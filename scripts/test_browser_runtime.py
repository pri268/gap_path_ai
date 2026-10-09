import subprocess
import time
import json
import urllib.request
import socket
import os
import sys
import base64
import hashlib
import struct

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def make_ws_handshake(host, port, path):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((host, port))
    key = base64.b64encode(os.urandom(16)).decode('ascii')
    req = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(req.encode('utf-8'))
    resp = s.recv(4096).decode('utf-8')
    assert "101" in resp, f"Handshake failed: {resp}"
    return s

def send_ws_frame(s, msg):
    payload = msg.encode('utf-8')
    length = len(payload)
    frame = bytearray([0x81]) # text frame
    if length <= 125:
        frame.append(0x80 | length)
    elif length <= 65535:
        frame.append(0x80 | 126)
        frame.extend(struct.pack('>H', length))
    else:
        frame.append(0x80 | 127)
        frame.extend(struct.pack('>Q', length))
    # 4-byte mask
    mask = os.urandom(4)
    frame.extend(mask)
    for i in range(length):
        frame.append(payload[i] ^ mask[i % 4])
    s.sendall(frame)

def recv_ws_frame(s):
    hdr = s.recv(2)
    if not hdr:
        return None
    b1, b2 = hdr[0], hdr[1]
    length = b2 & 0x7f
    if length == 126:
        length = struct.unpack('>H', s.recv(2))[0]
    elif length == 127:
        length = struct.unpack('>Q', s.recv(8))[0]
    data = bytearray()
    while len(data) < length:
        chunk = s.recv(min(4096, length - len(data)))
        if not chunk:
            break
        data.extend(chunk)
    return data.decode('utf-8', errors='replace')

def main():
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    port = 9333
    
    cmd = [
        edge_path,
        "--headless=new",
        "--disable-gpu",
        f"--remote-debugging-port={port}",
        "about:blank"
    ]
    
    print("[Browser Test] Launching headless Edge...")
    proc = subprocess.Popen(cmd)
    time.sleep(1.5)
    
    try:
        req = urllib.request.urlopen(f"http://127.0.0.1:{port}/json")
        targets = json.loads(req.read().decode())
        page_target = [t for t in targets if t.get("type") == "page"][0]
        ws_url = page_target["webSocketDebuggerUrl"]
        
        # Parse ws url
        from urllib.parse import urlparse
        parsed = urlparse(ws_url)
        host = parsed.hostname
        wport = parsed.port
        path = parsed.path
        
        sock = make_ws_handshake(host, wport, path)
        sock.settimeout(4.0)
        
        # Enable Runtime, Page, Console
        send_ws_frame(sock, json.dumps({"id": 1, "method": "Runtime.enable"}))
        send_ws_frame(sock, json.dumps({"id": 2, "method": "Page.enable"}))
        send_ws_frame(sock, json.dumps({"id": 3, "method": "Console.enable"}))
        
        # Navigate to http://localhost:3000
        send_ws_frame(sock, json.dumps({
            "id": 4,
            "method": "Page.navigate",
            "params": {"url": "http://localhost:3000"}
        }))
        
        console_errors = []
        runtime_exceptions = []
        
        # Collect events for 3 seconds
        end_time = time.time() + 3.0
        while time.time() < end_time:
            try:
                frame = recv_ws_frame(sock)
                if not frame:
                    continue
                evt = json.loads(frame)
                method = evt.get("method", "")
                if method == "Runtime.exceptionThrown":
                    runtime_exceptions.append(evt["params"]["exceptionDetails"])
                    print(f"  [ERROR] Runtime exception: {evt['params']['exceptionDetails']}")
                elif method == "Console.messageAdded":
                    msg = evt["params"]["message"]
                    if msg.get("level") == "error":
                        console_errors.append(msg.get("text"))
                        print(f"  [ERROR] Console error: {msg.get('text')}")
                    else:
                        print(f"  [LOG] {msg.get('text')}")
            except socket.timeout:
                pass
        
        # Now evaluate JS in page: test CONFIG, engines, login, and UI
        test_scripts = [
            ("CONFIG defined", "typeof CONFIG !== 'undefined'"),
            ("CONFIG.ACCOUNTS count", "CONFIG.ACCOUNTS.length"),
            ("authEngine defined", "typeof authEngine !== 'undefined'"),
            ("ScheduledTestEngine initialized", "typeof window.scheduledTestEngineInstance !== 'undefined'"),
            ("DashboardEngine initialized", "typeof window.dashboardEngineInstance !== 'undefined'"),
            ("Available Demo Accounts", "Array.isArray(CONFIG.ACCOUNTS) && CONFIG.ACCOUNTS.filter(a => a.role === 'student').length"),
            ("Simulate Aarav Login", "(function() { const res = authEngine.login('aarav.p@college.edu', '9876543210', 'student'); const u = authEngine.getCurrentUser(); return (res.success && u) ? u.student_id : 'failed: ' + JSON.stringify(res); })()"),
            ("Render Student Dashboard", "(function() { window.dashboardEngineInstance.renderStudentDashboard(); const el = document.getElementById('stu-scheduled-tests-grid'); return el ? el.children.length : 0; })()"),
            ("Check Eligible Tests Count (CSE Aarav)", "(function() { const u = authEngine.getCurrentUser(); return storageEngine.getScheduledTests().filter(t => storageEngine.isStudentEligibleForTest(u, t)).length; })()"),
            ("Check Ongoing Badge and Card Match (Aarav)", "(function() { window.dashboardEngineInstance.renderStudentScheduledTests(); const btn = document.getElementById('stu-sec-btn-ongoing').textContent; const grid = document.getElementById('stu-scheduled-tests-grid').innerHTML; const countBadge = document.getElementById('stu-assigned-count-badge').textContent; return JSON.stringify({ btn, hasNoAssigned: grid.includes('No Assigned Tests'), cardCount: (grid.match(/scheduled-test-card/g) || []).length, countBadge }); })()"),
            ("Switch to IT Demo Student (Riya Sen)", "(function() { quickLoginDemoAccount('riya.sen@college.edu', '9876543211'); const u = authEngine.getCurrentUser(); const tests = storageEngine.getScheduledTests().filter(t => storageEngine.isStudentEligibleForTest(u, t)); return 'User: ' + u.name + ', eligible tests: ' + tests.length; })()"),
            ("Check Ongoing Badge and Card Match (Riya)", "(function() { const btn = document.getElementById('stu-sec-btn-ongoing').textContent; const grid = document.getElementById('stu-scheduled-tests-grid').innerHTML; const countBadge = document.getElementById('stu-assigned-count-badge').textContent; return JSON.stringify({ btn, hasNoAssigned: grid.includes('No Assigned Tests'), cardCount: (grid.match(/scheduled-test-card/g) || []).length, countBadge }); })()"),
            ("Switch Back to Aarav Patel", "(function() { quickLoginDemoAccount('aarav.p@college.edu', '9876543210'); const btn = document.getElementById('stu-sec-btn-ongoing').textContent; const grid = document.getElementById('stu-scheduled-tests-grid').innerHTML; return JSON.stringify({ btn, hasNoAssigned: grid.includes('No Assigned Tests'), cardCount: (grid.match(/scheduled-test-card/g) || []).length }); })()"),
            ("Simulate Faculty Login", "(function() { const res = authEngine.login('rajesh.sharma@college.edu', 'prof.rajesh@cs301', 'instructor'); if (!res.success) return 'login fail: ' + JSON.stringify(res); window.dashboardEngineInstance.renderInstructorDashboard(); return document.getElementById('inst-test-stat-active') ? ('Active tests: ' + document.getElementById('inst-test-stat-active').textContent) : 'no el'; })()"),
            ("Test Faculty Subtabs Switching", "(function() { const tabs = ['overview', 'tests-schedule', 'progress', 'topics-support', 'students-inspect']; const res = {}; tabs.forEach(t => { window.dashboardEngineInstance.switchFacultyTab(t); const view = document.getElementById('fac-view-' + t); res[t] = view && view.style.display !== 'none'; }); return JSON.stringify(res); })()"),
            ("Simulate HOD Login", "(function() { const res = authEngine.login('hod.cse@college.edu', 'hod.sen@cse', 'hod'); if (!res.success) return 'login fail: ' + JSON.stringify(res); window.dashboardEngineInstance.renderHODDashboard(); return document.getElementById('hod-year-pills') ? ('Year pills count: ' + document.getElementById('hod-year-pills').children.length) : 'no el'; })()"),
            ("Test HOD Subtabs Switching", "(function() { const tabs = ['overview', 'years', 'progress', 'topics', 'roster']; const res = {}; tabs.forEach(t => { window.dashboardEngineInstance.switchHODTab(t); const view = document.getElementById('fac-view-' + t || 'hod-view-' + t); res[t] = view && view.style.display !== 'none'; }); return JSON.stringify(res); })()"),
            ("Test HOD Year and Course Drilldown", "(function() { window.dashboardEngineInstance.selectHODYear('3rd Year'); window.dashboardEngineInstance.selectHODCourseClass('CS301', 'Section A'); return document.getElementById('hod-selected-year-display') ? 'Drilldown rendered successfully' : 'error'; })()"),
            ("Test View Progress Modal Open (Aarav Patel)", "(function() { window.dashboardEngineInstance.showRecordModal('ACT-2026-CSE-1048', '22CS1048'); const modal = document.getElementById('student-record-modal'); const body = document.getElementById('record-modal-body'); const title = document.getElementById('record-modal-title'); const isOpen = modal && modal.classList.contains('modal-open'); const hasSummary = body && body.innerHTML.includes('Tests Completed') && body.innerHTML.includes('Topics Doing Well') && body.innerHTML.includes('Topics Needing More Practice') && body.innerHTML.includes('Recommended Next Step'); const hidesTechnicalCodes = !body.innerHTML.includes('Q-CN-SUBNET') && !body.innerHTML.includes('DAG') && !body.innerHTML.includes('SYNTHETIC BENCHMARK'); return JSON.stringify({ isOpen, hasSummary, hidesTechnicalCodes, title: title.textContent }); })()"),
            ("Test View Attempt Details Toggle", "(function() { const content = document.getElementById('sp-attempt-details-content'); const before = content ? content.style.display : 'missing'; window.dashboardEngineInstance.toggleAttemptDetails(); const openState = content ? content.style.display : 'missing'; window.dashboardEngineInstance.toggleAttemptDetails(); const closeState = content ? content.style.display : 'missing'; return JSON.stringify({ before, openState, closeState }); })()"),
            ("Test Honest Mastery Status (No 0/5 false mastery)", "(function() { window.dashboardEngineInstance.showRecordModal('NONEXISTENT_DRAFT', '22CS1048'); const body = document.getElementById('record-modal-body'); const text = body ? body.textContent : ''; const hasContradiction = text.includes('Mastery Met') && text.includes('0%'); return hasContradiction ? 'FAILED: False Mastery Met shown on 0 score' : 'PASSED: Honest assessment'; })()"),
            ("Test Close Progress Modal", "(function() { closeStudentRecordModal(); const modal = document.getElementById('student-record-modal'); return (!modal.classList.contains('modal-open')) ? 'PASSED: Modal cleanly closed' : 'FAILED'; })()"),
            ("Test Open Schedule Test Modal", "(function() { authEngine.login('rajesh.sharma@college.edu', 'prof.rajesh@cs301', 'instructor'); window.openScheduleTestModal(); const modal = document.getElementById('schedule-test-modal'); const cSel = document.getElementById('sched-input-course'); const startVal = document.getElementById('sched-input-start').value; return JSON.stringify({ isOpen: modal && modal.style.display === 'flex', course: cSel ? cSel.value : '', hasStart: !!startVal }); })()"),
            ("Test Schedule Form Validation Missing Title", "(function() { document.getElementById('sched-input-title').value = ''; const res = window.dashboardEngineInstance.validateScheduleFormData(); const alertEl = document.getElementById('sched-form-error-alert'); return JSON.stringify({ isValid: res.isValid, alertText: alertEl ? alertEl.textContent : '' }); })()"),
            ("Test Schedule Form Validation End Before Start", "(function() { document.getElementById('sched-input-title').value = 'Test Title'; document.getElementById('sched-input-start').value = '2026-10-10T14:00'; document.getElementById('sched-input-end').value = '2026-10-10T12:00'; const res = window.dashboardEngineInstance.validateScheduleFormData(); const alertEl = document.getElementById('sched-form-error-alert'); return JSON.stringify({ isValid: res.isValid, alertText: alertEl ? alertEl.textContent : '' }); })()"),
            ("Test Teacher Schedules and Saves Test Directly", "(function() { document.getElementById('sched-input-title').value = 'Midterm Assessment: Routing & Transport Protocols'; document.getElementById('sched-input-course').value = 'CS301'; document.getElementById('sched-input-section').value = 'Section A'; document.getElementById('sched-input-semester').value = '5'; document.getElementById('sched-input-subject').value = 'CN'; window.dashboardEngineInstance.populateScheduleTopicsForSubject('CN'); const now = new Date(); const end = new Date(now.getTime() + 4 * 3600 * 1000); document.getElementById('sched-input-start').value = window.dashboardEngineInstance.formatISTForInput(now); document.getElementById('sched-input-end').value = window.dashboardEngineInstance.formatISTForInput(end); document.getElementById('sched-input-count').value = '5'; document.getElementById('sched-input-time-limit').value = '20'; document.getElementById('sched-input-threshold').value = '80'; const oldAlert = window.alert; window.alert = function() {}; const ok = window.dashboardEngineInstance.submitScheduleForm(); window.alert = oldAlert; const all = storageEngine.getScheduledTests(); const found = all.find(t => t.title === 'Midterm Assessment: Routing & Transport Protocols'); const statSched = document.getElementById('inst-test-stat-scheduled')?.textContent; const statActive = document.getElementById('inst-test-stat-active')?.textContent; return JSON.stringify({ ok, saved: !!found, testId: found?.id, course: found?.course_code, section: found?.section, semester: found?.semester, statSched, statActive }); })()"),
            ("Test Scheduled Test Visible in Eligible Student (Aarav - CS301 Section A)", "(function() { setLoginPortalRole('student'); quickLoginDemoAccount('aarav.p@college.edu', '9876543210'); window.dashboardEngineInstance.renderStudentScheduledTests(); const grid = document.getElementById('stu-scheduled-tests-grid')?.innerHTML || ''; const btn = document.getElementById('stu-sec-btn-ongoing')?.textContent; const countBadge = document.getElementById('stu-assigned-count-badge')?.textContent; const cardCount = (grid.match(/scheduled-test-card/g) || []).length; const includesNewTest = grid.includes('Midterm Assessment'); return JSON.stringify({ includesNewTest, cardCount, btn, countBadge }); })()"),
            ("Test Scheduled Test Hidden in Ineligible Student (Riya - IT302)", "(function() { setLoginPortalRole('student'); quickLoginDemoAccount('riya.sen@college.edu', '9876543211'); window.dashboardEngineInstance.renderStudentScheduledTests(); const grid = document.getElementById('stu-scheduled-tests-grid')?.innerHTML || ''; const includesNewTest = grid.includes('Midterm Assessment'); return JSON.stringify({ includesNewTest, hasNoAssigned: grid.includes('No Assigned Tests') }); })()")
        ]
        
        print("\n--- IN-BROWSER JAVASCRIPT EVALUATION RESULTS ---")
        req_id = 100
        for desc, script in test_scripts:
            req_id += 1
            send_ws_frame(sock, json.dumps({
                "id": req_id,
                "method": "Runtime.evaluate",
                "params": {"expression": script, "returnByValue": True}
            }))
            while True:
                try:
                    frame = recv_ws_frame(sock)
                    if not frame:
                        break
                    evt = json.loads(frame)
                    if evt.get("id") == req_id:
                        res = evt.get("result", {}).get("result", {}).get("value")
                        print(f"  [EVAL] {desc}: {res}")
                        break
                except socket.timeout:
                    print(f"  [EVAL TIMEOUT] {desc}")
                    break
                    
        print("\n--- SUMMARY ---")
        print(f"Console Errors: {len(console_errors)}")
        print(f"Runtime Exceptions: {len(runtime_exceptions)}")
        
        sock.close()
    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    main()
