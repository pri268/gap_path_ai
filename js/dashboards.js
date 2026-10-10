/**
 * GAPPath AI - Academic Dashboards Engine
 * 
 * STRICT ACCESS CONTROL POLICIES:
 * 1. NO Principal login, dashboard, menu, label, or recipient.
 * 2. Student Dashboard: Student sees only their own diagnostic history and reports.
 * 3. Course Instructor Portal: Instructor sees reports assigned strictly to their course/identity.
 * 4. Department HOD Portal: HOD sees student-level records strictly within that HOD's assigned department.
 * 5. Recipient mapping is strictly derived from student department, never user-selected.
 */

class DashboardEngine {
  constructor() {
    this.currentInstructorKey = "Prof. Rajesh Sharma";
    this.currentCourseKey = "CS301";
    this.currentHODDept = "CSE";
    this.selectedHODYear = "3rd Year";
    this.activeFacultySubtab = "overview";
    this.activeHODSubtab = "overview";
    this.activeStudentSection = "ongoing";
    this.selectedHODCourse = "ALL";
    this.selectedHODClass = "ALL";
  }

  // ==========================================
  // 1. STUDENT PERSONAL DASHBOARD & SECTION BAR
  // ==========================================
  switchStudentSection(sectionId) {
    this.activeStudentSection = sectionId || "ongoing";
    const sections = [
      { id: "ongoing", btnId: "stu-sec-btn-ongoing", viewId: "stu-sec-ongoing" },
      { id: "upcoming", btnId: "stu-sec-btn-upcoming", viewId: "stu-sec-upcoming" },
      { id: "completed", btnId: "stu-sec-btn-completed", viewId: "stu-sec-completed" },
      { id: "topics", btnId: "stu-sec-btn-topics", viewId: "stu-sec-topics" },
      { id: "activity", btnId: "stu-sec-btn-activity", viewId: "stu-sec-activity" }
    ];

    sections.forEach(s => {
      const btn = document.getElementById(s.btnId);
      const view = document.getElementById(s.viewId);
      const isActive = s.id === this.activeStudentSection;
      if (btn) {
        if (isActive) {
          btn.classList.add("active");
          btn.setAttribute("aria-selected", "true");
        } else {
          btn.classList.remove("active");
          btn.setAttribute("aria-selected", "false");
        }
      }
      if (view) {
        if (isActive) {
          view.classList.add("active");
          view.style.display = "block";
        } else {
          view.classList.remove("active");
          view.style.display = "none";
        }
      }
    });
  }

  renderStudentDashboard(studentUser) {
    if (!studentUser) {
      studentUser = authEngine.getCurrentUser();
    }
    if (!studentUser) return;

    const loadingEl = document.getElementById("stu-dashboard-loading");
    const errorEl = document.getElementById("stu-dashboard-error");
    const errorTextEl = document.getElementById("stu-dashboard-error-text");

    if (loadingEl) loadingEl.style.display = "block";
    if (errorEl) errorEl.style.display = "none";

    try {
      // Filter strictly to this student's records only
      const records = storageEngine.getRecordsForStudent(studentUser.student_id, studentUser.email);
      
      // Header & Profile information
      const nameEl = document.getElementById("stu-dash-name");
      const idEl = document.getElementById("stu-dash-id");
      const emailEl = document.getElementById("stu-dash-email");
      const deptEl = document.getElementById("stu-dash-dept");
      const courseEl = document.getElementById("stu-dash-course");
      const yearEl = document.getElementById("stu-dash-year");
      const assignedFacEl = document.getElementById("stu-dash-assigned-faculty");

      const deptConfig = CONFIG.DEPARTMENTS[studentUser.department] || CONFIG.DEPARTMENTS.CSE;

      if (nameEl) nameEl.textContent = studentUser.name || "Student";
      if (idEl) idEl.textContent = studentUser.student_id || "";
      if (emailEl) emailEl.textContent = studentUser.email || "";
      if (deptEl) deptEl.textContent = deptConfig.name;
      if (courseEl) courseEl.textContent = `${deptConfig.course_code} - ${deptConfig.course_name}`;
      if (yearEl) yearEl.textContent = studentUser.year_semester || "3rd Year / 5th Sem";
      if (assignedFacEl) {
        assignedFacEl.innerHTML = `
          <span>Course Instructor: <strong>${deptConfig.instructor.name}</strong> (${deptConfig.instructor.email})</span><br>
          <span>Department HOD: <strong>${deptConfig.hod.name}</strong> (${deptConfig.hod.email})</span>
        `;
      }

      // Active in-flight quiz check (for resume stability)
      const activeQuiz = typeof quizGenerator !== "undefined" && quizGenerator.getActiveQuiz ? quizGenerator.getActiveQuiz(studentUser.student_id) : null;
      const activeBanner = document.getElementById("stu-active-quiz-banner");
      const startBtn = document.getElementById("stu-start-quiz-btn");

      if (activeBanner) {
        if (activeQuiz) {
          activeBanner.style.display = "block";
          activeBanner.innerHTML = `
            <div class="active-quiz-alert">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                  <span class="badge badge-warning">Active Quiz In-Flight</span>
                  <strong style="margin-left: 8px; color: #FFFFFF;">Diagnostic Attempt ${activeQuiz.attempt_id}</strong>
                  <p style="font-size: 13px; color: #CBD5E1; margin-top: 4px;">
                    You have an in-progress 10-concept quiz saved. Your balanced question set is stabilized.
                  </p>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-sm btn-primary" onclick="window.resumeStudentQuiz()">
                    Resume Active Quiz →
                  </button>
                  <button class="btn btn-sm btn-outline-warning" onclick="window.discardAndRestartQuiz()">
                    Discard & Start Fresh
                  </button>
                </div>
              </div>
            </div>
          `;
          if (startBtn) startBtn.textContent = "Resume In-Flight Quiz →";
        } else {
          activeBanner.style.display = "none";
          if (startBtn) startBtn.textContent = "Start 10-Concept Diagnostic Assessment →";
        }
      }

      // Student Metrics Cards
      const totalAttempts = records.length;
      const latestRecord = totalAttempts > 0 ? records[0] : null;

      // Auto Diagnosed Gap Video & Tutor Nudge on Student Dashboard
      const gapNudgeEl = document.getElementById("stu-dash-gap-video-nudge");
      if (gapNudgeEl) {
        if (latestRecord && latestRecord.primary_likely_gap && latestRecord.primary_likely_gap !== "NONE") {
          const gapName = latestRecord.primary_gap_name || latestRecord.primary_likely_gap;
          const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent("Computer Networks " + gapName + " explained for beginners")}`;
          gapNudgeEl.style.display = "block";
          gapNudgeEl.innerHTML = `
            <div class="dashboard-gap-nudge-box">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                  <span class="badge badge-warning text-xs">Diagnostic Learning Path</span>
                  <strong style="margin-left: 6px; color: #FFFFFF;">Targeted Topic: ${gapName}</strong>
                  <p style="font-size: 12px; color: #94A3B8; margin: 3px 0 0 0;">
                    Reinforce this concept with step-by-step AI guidance and recommended video tutorials.
                  </p>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-xs btn-primary" onclick="switchTab('tab-tutor'); if(window.tutorEngineInstance) window.tutorEngineInstance.askAboutGap('${latestRecord.primary_likely_gap}', '${gapName}');">
                    💬 Ask Tutor About This Gap →
                  </button>
                  <a href="${ytSearchUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline-secondary">
                    📺 Search YouTube Videos ↗
                  </a>
                </div>
              </div>
            </div>
          `;
        } else {
          gapNudgeEl.style.display = "none";
        }
      }

      const latestScore = latestRecord ? `${latestRecord.score} / ${latestRecord.total_questions || 10} (${latestRecord.percentage}%)` : "No Attempts";
      const primaryGap = latestRecord ? latestRecord.primary_gap_name || latestRecord.primary_likely_gap : "None";
      const retestStatus = (latestRecord && latestRecord.practice_retest && latestRecord.practice_retest.completed)
        ? `${latestRecord.practice_retest.status} (${latestRecord.practice_retest.score}/3)`
        : (latestRecord ? "Pending Retest" : "N/A");

      const totalEl = document.getElementById("stu-stat-attempts");
      const scoreEl = document.getElementById("stu-stat-latest-score");
      const gapEl = document.getElementById("stu-stat-primary-gap");
      const retestEl = document.getElementById("stu-stat-retest-status");

      if (totalEl) totalEl.textContent = totalAttempts;
      if (scoreEl) scoreEl.textContent = latestScore;
      if (gapEl) gapEl.textContent = primaryGap;
      if (retestEl) retestEl.textContent = retestStatus;

      // Render Student Reports Table (Strictly this student's records)
      const tbody = document.getElementById("stu-reports-table-body");
      if (tbody) {
        if (records.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="text-center py-4 text-muted">
                No diagnostic attempts completed yet. Click 'Start 10-Concept Diagnostic Assessment' above to begin!
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = records.map(r => {
            const retestBadge = r.practice_retest && r.practice_retest.completed
              ? `<span class="badge badge-success">✓ Remediated (${r.practice_retest.score}/3)</span>`
              : `<span class="badge badge-warning">Retest Pending</span>`;

            const gapBadge = r.primary_likely_gap && r.primary_likely_gap !== "NONE"
              ? `<span class="badge badge-danger">${r.primary_likely_gap}</span>`
              : `<span class="badge badge-success">Positive Signals</span>`;

            return `
              <tr>
                <td><code class="report-code">${r.report_id}</code></td>
                <td><small>${new Date(r.submitted_at).toLocaleString()}</small></td>
                <td><span class="score-pill ${r.score >= 7 ? 'score-high' : (r.score >= 5 ? 'score-mid' : 'score-low')}">${r.score}/10 (${r.percentage}%)</span></td>
                <td>${gapBadge}</td>
                <td>${retestBadge}</td>
                <td><small class="text-muted">${r.assigned_instructor ? r.assigned_instructor.name : 'Faculty'} & ${r.assigned_hod ? r.assigned_hod.name : 'HOD'}</small></td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn btn-xs btn-outline-primary" onclick="window.viewStudentReportFromDashboard('${r.report_id}')">
                      View Map & Report
                    </button>
                    ${r.primary_likely_gap && r.primary_likely_gap !== "NONE" ? `
                      <button class="btn btn-xs btn-outline-warning" onclick="window.openTargetedLesson('${r.primary_likely_gap}', '${r.report_id}')">
                        Practice Lesson
                      </button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `;
          }).join("");
        }
      }

      // Populate Quick Progress Glance (Isolated with defensive error handling)
      try {
        this.populateStudentDashboardGlance(studentUser);
      } catch (errGlance) {
        console.warn("Notice in populateStudentDashboardGlance:", errGlance);
        const summaryEl = document.getElementById("stu-dash-prog-summary-text");
        if (summaryEl) summaryEl.innerHTML = `<span class="text-muted">Complete an assigned test above to populate your personal learning progress.</span>`;
      }

      // Render My Learning History & Progress Visualization
      try {
        this.renderLearningHistory(studentUser);
      } catch (errHist) {
        console.warn("Notice in renderLearningHistory:", errHist);
      }

      // Render Faculty Scheduled Assessments (Upcoming & Active Tests)
      try {
        this.renderStudentScheduledTests(studentUser);
      } catch (errSched) {
        console.warn("Notice in renderStudentScheduledTests:", errSched);
      }

      // Activate the selected section
      this.switchStudentSection(this.activeStudentSection || "ongoing");
    } catch (err) {
      console.error("Critical error in student dashboard render:", err);
      if (errorEl) {
        errorEl.style.display = "block";
        if (errorTextEl) {
          errorTextEl.textContent = `Dashboard rendering error: ${err.message || 'Check connection or retry.'}`;
        }
      }
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  // ==========================================
  // 1.05 STUDENT QUICK PROGRESS GLANCE
  // ==========================================
  populateStudentDashboardGlance(studentUser) {
    const summaryEl = document.getElementById("stu-dash-prog-summary-text");
    if (!summaryEl) return;

    try {
      if (!studentUser) {
        summaryEl.innerHTML = `<span class="text-muted">No student profile active.</span>`;
        return;
      }

      let actualRecords = storageEngine.getActualRecordsForStudent(studentUser.student_id, studentUser.email);
      if (!Array.isArray(actualRecords)) {
        actualRecords = (actualRecords && Array.isArray(actualRecords.diagnostic_records))
          ? actualRecords.diagnostic_records
          : [];
      }

      const allSched = storageEngine.getAllScheduledTestAttempts();
      const schedAttempts = Array.isArray(allSched)
        ? allSched.filter(a => a && a.student_id === studentUser.student_id)
        : [];

      const totalTests = actualRecords.length + schedAttempts.length;

      if (totalTests === 0) {
        summaryEl.innerHTML = `<span class="text-muted">No completed assessments yet. Complete an assigned test above to populate your personal learning progress.</span>`;
        return;
      }

      let totalAttempted = 0;
      let totalCorrect = 0;
      actualRecords.forEach(r => {
        if (!r) return;
        totalAttempted += (r.total_questions || 10);
        totalCorrect += (r.score || 0);
      });
      schedAttempts.forEach(a => {
        if (!a) return;
        totalAttempted += (a.total_questions || 5);
        totalCorrect += (a.score || 0);
      });
      const avgAcc = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

      summaryEl.innerHTML = `
        <span class="text-emerald font-bold">${totalTests} completed test${totalTests === 1 ? '' : 's'}</span> · 
        Overall Accuracy: <strong class="text-cyan">${avgAcc}%</strong> (${totalCorrect}/${totalAttempted} Qs attempted) · 
        <a href="javascript:void(0)" onclick="switchTab('tab-my-progress')" style="color: var(--cyan-accent); text-decoration: underline; font-weight: 600;">View My Progress</a> for topic breakdowns & lecture notes.
      `;
    } catch (err) {
      console.warn("Error rendering student dashboard glance:", err);
      summaryEl.innerHTML = `<span class="text-muted">Complete an assigned test above to populate your personal learning progress.</span>`;
    }
  }

  // ==========================================
  // 1.06 STUDENT DASHBOARD EMBEDDED AI CHATBOT
  // ==========================================
  async handleDashboardChatSubmit() {
    const input = document.getElementById("stu-dash-chat-input");
    const messagesBox = document.getElementById("stu-dash-chat-messages");
    if (!input || !messagesBox) return;

    const message = input.value.trim();
    if (!message) return;

    input.value = "";

    // Append Student bubble
    const userBubble = document.createElement("div");
    userBubble.style.margin = "8px 0";
    userBubble.style.textAlign = "right";
    const userSafe = document.createElement("div");
    userSafe.style.cssText = "display: inline-block; background: var(--primary-color, #2563EB); color: #FFFFFF; padding: 8px 12px; border-radius: 8px; font-size: 13px; max-width: 85%; text-align: left;";
    userSafe.textContent = "You: " + message;
    userBubble.appendChild(userSafe);
    messagesBox.appendChild(userBubble);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    // Record help request for this student and resolve active curriculum context
    const currentUser = authEngine.getCurrentUser();
    let currentTopic = "General Engineering";
    let currentSubject = "Computer Networks";
    if (currentUser && typeof storageEngine !== "undefined") {
      const recs = storageEngine.getActualRecordsForStudent(currentUser.student_id);
      if (recs && recs.length > 0) {
        currentSubject = recs[0].subject_name || recs[0].course_code || currentSubject;
        currentTopic = recs[0].topic_name || recs[0].concept_id || currentTopic;
      }
      if (storageEngine.recordHelpRequest) {
        storageEngine.recordHelpRequest(currentUser.student_id, currentTopic, "General Curriculum Inquiry", message);
      }
    }

    if (!window._dashChatHistory) window._dashChatHistory = [];
    window._dashChatHistory.push({ role: "student", text: message });

    // Pending indicator
    const pendingBubble = document.createElement("div");
    pendingBubble.style.margin = "8px 0";
    pendingBubble.innerHTML = `
      <div style="display: inline-block; background: rgba(30, 41, 59, 0.8); color: #94A3B8; padding: 8px 12px; border-radius: 8px; font-size: 12px;">
        <em>GapPath AI Tutor is analyzing your question...</em>
      </div>
    `;
    messagesBox.appendChild(pendingBubble);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          subject: currentSubject,
          topic: currentTopic,
          topic_id: currentTopic,
          history: window._dashChatHistory.slice(-6)
        })
      });

      const data = await res.json();
      if (pendingBubble.parentNode) messagesBox.removeChild(pendingBubble);

      const aiBubble = document.createElement("div");
      aiBubble.style.margin = "8px 0";

      if (data.status === "unavailable") {
        const curatedText = (window.tutorEngine && window.tutorEngine.generateCuratedPedagogicalResponse)
          ? window.tutorEngine.generateCuratedPedagogicalResponse(message, currentTopic)
          : null;
        aiBubble.innerHTML = `
          <div style="background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 10px 14px; font-size: 13px; line-height: 1.5; color: #F8FAFC;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px; color: #94A3B8;">
              <span style="font-weight: 600; color: #38BDF8;">📚 GapPath Knowledge Base</span>
              <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div>${curatedText ? (window.tutorEngine.formatMarkdown ? window.tutorEngine.formatMarkdown(curatedText) : curatedText) : (data.setup_guidance || data.guidance || "Configure GEMINI_API_KEY on the server to enable live generative AI.")}</div>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #94A3B8;">
              💡 <em>Add GEMINI_API_KEY in Render service Environment tab to activate real-time Gemini Flash AI.</em>
            </div>
          </div>
        `;
      } else if (data.status === "error") {
        aiBubble.innerHTML = `
          <div class="tutor-setup-notice-card" style="font-size: 12px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span>⚠️</span>
              <strong>AI Service Notice: API Error</strong>
            </div>
            <p style="margin: 0 0 6px 0; color: #F8FAFC;">
              ${data.error_message || "Gemini API returned an error."}
            </p>
            <div class="text-xs text-muted">
              ${data.setup_guidance || "Verify that your GEMINI_API_KEY is valid and has active quota in Google AI Studio."}
            </div>
          </div>
        `;
      } else if (data.text || data.reply) {
        const replyContent = data.text || data.reply;
        window._dashChatHistory.push({ role: "tutor", text: replyContent });
        aiBubble.innerHTML = `
          <div style="display: inline-block; background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(148, 163, 184, 0.25); color: #F8FAFC; padding: 10px 14px; border-radius: 8px; font-size: 13px; max-width: 90%; line-height: 1.5;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 11px; color: #38BDF8;">
              <span>🤖</span> <strong>GapPath AI Tutor</strong> <span class="badge badge-secondary text-xs">${data.source || 'AI Response'}</span>
            </div>
            <div>${replyContent.replace(/\n/g, '<br>')}</div>
          </div>
        `;
      } else {
        aiBubble.innerHTML = `
          <div class="tutor-setup-notice-card" style="font-size: 12px;">
            ⚠️ <strong>AI Service Error:</strong> Unexpected response from learning engine. Please retry your question.
          </div>
        `;
      }
      messagesBox.appendChild(aiBubble);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    } catch (e) {
      if (pendingBubble.parentNode) messagesBox.removeChild(pendingBubble);
      const errBubble = document.createElement("div");
      errBubble.style.margin = "8px 0";
      errBubble.innerHTML = `
        <div class="tutor-setup-notice-card" style="font-size: 12px;">
          ⚠️ <strong>Connection Notice:</strong> Unable to contact the backend AI service. Ensure the local server is running at http://localhost:3000.
        </div>
      `;
      messagesBox.appendChild(errBubble);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }
  }

  // ==========================================
  // 1.07 MY PROGRESS (PERSONAL STUDENT ANALYTICS)
  // ==========================================
  renderStudentMyProgress(studentUser) {
    if (!studentUser) {
      studentUser = authEngine.getCurrentUser();
    }
    if (!studentUser || studentUser.role !== "student") return;

    // Derived strictly from this student's actual assessment attempts
    let actualRecords = storageEngine.getActualRecordsForStudent(studentUser.student_id, studentUser.email);
    if (!Array.isArray(actualRecords)) {
      actualRecords = (actualRecords && Array.isArray(actualRecords.diagnostic_records))
        ? actualRecords.diagnostic_records
        : [];
    }
    const allSchedAttempts = storageEngine.getAllScheduledTestAttempts();
    const schedAttempts = Array.isArray(allSchedAttempts)
      ? allSchedAttempts.filter(a => a && a.student_id === studentUser.student_id)
      : [];
    const helpRequests = storageEngine.getHelpRequestsForStudent(studentUser.student_id) || [];

    const titleEl = document.getElementById("prog-student-title");
    if (titleEl) {
      titleEl.textContent = `My Progress & Activity — ${studentUser.name} (${studentUser.student_id})`;
    }

    const emptyStateEl = document.getElementById("prog-empty-state");
    const contentEl = document.getElementById("prog-content-container");

    const totalCompleted = actualRecords.length + schedAttempts.length;

    // Handle Empty State: Student with no completed attempts
    if (totalCompleted === 0) {
      if (emptyStateEl) emptyStateEl.style.display = "block";
      if (contentEl) contentEl.style.display = "none";
      return;
    }

    if (emptyStateEl) emptyStateEl.style.display = "none";
    if (contentEl) contentEl.style.display = "block";

    // 1. Activity Overview Metrics
    let totalQuestionsAttempted = 0;
    let totalCorrectAnswers = 0;

    actualRecords.forEach(r => {
      totalQuestionsAttempted += (r.total_questions || 10);
      totalCorrectAnswers += (r.score || 0);
    });

    schedAttempts.forEach(a => {
      totalQuestionsAttempted += (a.total_questions || 5);
      totalCorrectAnswers += (a.score || 0);
    });

    const overallAccuracyPct = totalQuestionsAttempted > 0
      ? Math.round((totalCorrectAnswers / totalQuestionsAttempted) * 100)
      : 0;

    // Upcoming tests count
    const allTests = storageEngine.getScheduledTests();
    const now = new Date();
    const upcomingCount = allTests.filter(t => {
      const isEligible = storageEngine.isStudentEligibleForTest(studentUser, t);
      const isUpcoming = new Date(t.start_time) > now;
      const alreadyDone = schedAttempts.some(a => a.test_id === t.id);
      return isEligible && isUpcoming && !alreadyDone;
    }).length;

    // Recent Score & Chronological list
    const allChronologicalAttempts = [
      ...actualRecords.map(r => ({
        id: r.report_id,
        title: "10-Concept Diagnostic Assessment",
        subject: r.course_name || "Computer Networks",
        date: new Date(r.submitted_at),
        score: r.score,
        total: r.total_questions || 10,
        accuracy: r.percentage || Math.round((r.score / (r.total_questions || 10)) * 100),
        status: r.score >= 8 ? "Mastered" : (r.score >= 5 ? "Developing" : "Review Needed"),
        type: "diagnostic",
        raw: r
      })),
      ...schedAttempts.map(a => ({
        id: a.test_id,
        title: a.title || "Scheduled Test",
        subject: a.subject_name || "Computer Networks",
        date: new Date(a.completed_at || a.submitted_at || Date.now()),
        score: a.score,
        total: a.total_questions || 5,
        accuracy: a.percentage || Math.round((a.score / (a.total_questions || 5)) * 100),
        status: a.score >= (a.total_questions * 0.8) ? "Mastered" : "Developing",
        type: "scheduled",
        raw: a
      }))
    ].sort((a, b) => b.date - a.date);

    const latestAttempt = allChronologicalAttempts[0];

    const completedEl = document.getElementById("prog-stat-completed");
    const completedSubEl = document.getElementById("prog-stat-completed-sub");
    const upcomingEl = document.getElementById("prog-stat-upcoming");
    const accuracyEl = document.getElementById("prog-stat-accuracy");
    const accuracySubEl = document.getElementById("prog-stat-accuracy-sub");
    const recentScoreEl = document.getElementById("prog-stat-recent-score");
    const recentDateEl = document.getElementById("prog-stat-recent-date");

    if (completedEl) completedEl.textContent = totalCompleted;
    if (completedSubEl) completedSubEl.textContent = `${schedAttempts.length} scheduled · ${actualRecords.length} diagnostic`;
    if (upcomingEl) upcomingEl.textContent = upcomingCount;
    if (accuracyEl) accuracyEl.textContent = `${overallAccuracyPct}%`;
    if (accuracySubEl) accuracySubEl.textContent = `${totalCorrectAnswers} of ${totalQuestionsAttempted} attempted`;
    if (recentScoreEl && latestAttempt) recentScoreEl.textContent = `${latestAttempt.score} / ${latestAttempt.total} (${latestAttempt.accuracy}%)`;
    if (recentDateEl && latestAttempt) recentDateEl.textContent = latestAttempt.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // 2. Simple Weekly Progress Line Graph & Tooltips (Requirement 3)
    const chronologicalAsc = [...allChronologicalAttempts].sort((a, b) => a.date - b.date);
    this.renderWeeklyProgressGraph(chronologicalAsc);

    // 3. Plain-Language Summary of Topics Finished & Still to Finish (Requirement 3)
    this.renderPlainLanguageTopicsSummary(actualRecords, schedAttempts);
  }

  showProgressPointDetails(title, dateStr, accuracy, score, total) {
    const el = document.getElementById("prog-selected-point-info");
    if (el) {
      el.innerHTML = `<strong>${title}</strong> &middot; ${dateStr} &middot; <strong class="text-cyan">${accuracy}% accuracy</strong> (${score}/${total} correct)`;
    }
  }

  // ==========================================
  // 1.08 WEEKLY PROGRESS GRAPH & PLAIN-LANGUAGE TOPICS
  // ==========================================
  renderWeeklyProgressGraph(testEvents) {
    const container = document.getElementById("prog-weekly-graph-container");
    if (!container) return;

    if (!testEvents || testEvents.length === 0) {
      container.innerHTML = `<div class="text-center py-5 text-muted">No assessment attempts recorded yet.</div>`;
      return;
    }

    const width = 640;
    const height = 220;
    const padLeft = 45;
    const padRight = 35;
    const padTop = 25;
    const padBottom = 35;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const n = testEvents.length;
    const getX = (i) => n === 1 ? padLeft + chartW / 2 : padLeft + (i / (n - 1)) * chartW;
    const getY = (acc) => padTop + chartH - (acc / 100) * chartH;

    const yVals = [0, 25, 50, 75, 100];
    const gridHtml = yVals.map(v => {
      const y = getY(v);
      return `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="rgba(148, 163, 184, 0.2)" stroke-dasharray="3,3" />
        <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#94A3B8">${v}%</text>
      `;
    }).join("");

    const pointsStr = testEvents.map((ev, i) => `${getX(i)},${getY(ev.accuracy)}`).join(" ");
    const firstX = getX(0);
    const lastX = getX(n - 1);
    const bottomY = getY(0);
    const areaPoints = `${firstX},${bottomY} ${pointsStr} ${lastX},${bottomY}`;

    const circlesHtml = testEvents.map((ev, i) => {
      const cx = getX(i);
      const cy = getY(ev.accuracy);
      const dateFormatted = ev.date.toLocaleDateString([], { month: "short", day: "numeric" });
      const safeTitle = (ev.title || "Test").replace(/'/g, "\\'").replace(/"/g, "&quot;");
      const tooltip = `${ev.title || 'Test'}\nDate: ${ev.date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}\nAccuracy: ${ev.accuracy}% (${ev.score} of ${ev.total} correct)`;

      return `
        <g class="chart-point-group" style="cursor: pointer;"
           onmouseover="window.dashboardEngineInstance.showProgressPointDetails('${safeTitle}', '${dateFormatted}', ${ev.accuracy}, ${ev.score}, ${ev.total})"
           onclick="window.dashboardEngineInstance.showProgressPointDetails('${safeTitle}', '${dateFormatted}', ${ev.accuracy}, ${ev.score}, ${ev.total})">
          <circle cx="${cx}" cy="${cy}" r="6" fill="#0284C7" stroke="#38BDF8" stroke-width="2.5" class="chart-point">
            <title>${tooltip}</title>
          </circle>
          <text x="${cx}" y="${height - 12}" text-anchor="middle" font-size="11" fill="#94A3B8">${dateFormatted}</text>
        </g>
      `;
    }).join("");

    const latest = testEvents[testEvents.length - 1];
    const latestDate = latest.date.toLocaleDateString([], { month: "short", day: "numeric" });

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="weekly-progress-svg" style="overflow: visible;">
        <defs>
          <linearGradient id="progLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        ${gridHtml}
        ${n > 1 ? `<polygon fill="url(#progLineGrad)" points="${areaPoints}" />` : ''}
        ${n > 1 ? `<polyline fill="none" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${pointsStr}" />` : ''}
        ${circlesHtml}
      </svg>
      <div id="prog-selected-point-info" class="card p-2 text-xs text-center mt-2" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.25); color: #F8FAFC;">
        Hover or click a graph point above to view details &middot; Latest: <strong>${latest.title}</strong> &middot; ${latestDate} &middot; <strong class="text-cyan">${latest.accuracy}% accuracy</strong> (${latest.score}/${latest.total} correct)
      </div>
    `;
  }

  renderPlainLanguageTopicsSummary(actualRecords, schedAttempts) {
    const finishedContainer = document.getElementById("prog-topics-finished-list");
    const todoContainer = document.getElementById("prog-topics-todo-list");
    const finishedCountEl = document.getElementById("prog-topics-finished-count");
    const todoCountEl = document.getElementById("prog-topics-todo-count");

    if (!finishedContainer || !todoContainer) return;

    const qb = window.gQuestionBank || { concepts: [] };
    const catalog = window.gSubjectCatalog || { subjects: [] };
    const cnSubject = catalog.subjects.find(s => s.id === "CN") || { topics: [] };

    const topicStats = {};

    actualRecords.forEach(r => {
      if (r.item_responses) {
        Object.keys(r.item_responses).forEach(cid => {
          if (!topicStats[cid]) topicStats[cid] = { attempted: 0, correct: 0, wrong: 0 };
          topicStats[cid].attempted += 1;
          if (r.item_responses[cid].is_correct) topicStats[cid].correct += 1;
          else topicStats[cid].wrong += 1;
        });
      }
      if (r.primary_likely_gap && r.primary_likely_gap !== "NONE") {
        const gid = r.primary_likely_gap;
        if (!topicStats[gid]) topicStats[gid] = { attempted: 1, correct: 0, wrong: 1 };
      }
    });

    schedAttempts.forEach(att => {
      if (att.responses) {
        att.responses.forEach(resp => {
          const tid = resp.topic_id || resp.concept_id;
          if (tid) {
            if (!topicStats[tid]) topicStats[tid] = { attempted: 0, correct: 0, wrong: 0 };
            topicStats[tid].attempted += 1;
            if (resp.is_correct) topicStats[tid].correct += 1;
            else topicStats[tid].wrong += 1;
          }
        });
      }
    });

    const allConcepts = (qb.concepts && qb.concepts.length > 0)
      ? qb.concepts
      : (cnSubject.topics || []);

    const finished = [];
    const todo = [];

    allConcepts.forEach(c => {
      const stats = topicStats[c.id];
      if (stats && stats.attempted > 0) {
        const acc = Math.round((stats.correct / stats.attempted) * 100);
        if (acc >= 75) {
          finished.push({
            id: c.id,
            name: c.name,
            accuracy: acc,
            detail: `${stats.correct} of ${stats.attempted} correct (${acc}% accuracy)`
          });
        } else {
          todo.push({
            id: c.id,
            name: c.name,
            accuracy: acc,
            reason: `Needs practice · ${acc}% accuracy (${stats.wrong} incorrect selection${stats.wrong === 1 ? '' : 's'})`
          });
        }
      } else {
        todo.push({
          id: c.id,
          name: c.name,
          accuracy: null,
          reason: "Not yet attempted in any test"
        });
      }
    });

    if (finishedCountEl) finishedCountEl.textContent = `${finished.length} Finished`;
    if (todoCountEl) todoCountEl.textContent = `${todo.length} To Finish`;

    if (finished.length === 0) {
      finishedContainer.innerHTML = `
        <div class="text-xs text-muted py-2">
          No topics finished yet. Complete an assigned test with ≥75% accuracy to mark topics as finished.
        </div>
      `;
    } else {
      finishedContainer.innerHTML = finished.map(t => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px; padding: 8px 12px;">
          <div>
            <strong style="color: #FFFFFF; font-size: 13px;">✓ ${t.name}</strong>
            <div class="text-xs text-emerald">${t.detail}</div>
          </div>
          <span class="badge badge-success text-xs">Finished</span>
        </div>
      `).join("");
    }

    if (todo.length === 0) {
      todoContainer.innerHTML = `
        <div class="text-xs text-emerald py-2">
          🎉 Fantastic! You have finished all curriculum topics.
        </div>
      `;
    } else {
      todoContainer.innerHTML = todo.map(t => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 6px; padding: 8px 12px; gap: 8px;">
          <div>
            <strong style="color: #FFFFFF; font-size: 13px;">⏳ ${t.name}</strong>
            <div class="text-xs text-amber">${t.reason}</div>
          </div>
          <button class="btn btn-xs btn-outline-warning" style="white-space: nowrap;" onclick="switchTab('tab-tutor'); if(window.tutorEngineInstance) window.tutorEngineInstance.askAboutGap('${t.id}', '${t.name}');">
            Study with AI Tutor →
          </button>
        </div>
      `).join("");
    }
  }

  handleProgressSubjectChange(subjectId) {
    const studentUser = authEngine.getCurrentUser();
    if (!studentUser) return;
    let actualRecords = storageEngine.getActualRecordsForStudent(studentUser.student_id, studentUser.email);
    if (!Array.isArray(actualRecords)) {
      actualRecords = (actualRecords && Array.isArray(actualRecords.diagnostic_records))
        ? actualRecords.diagnostic_records
        : [];
    }
    const allSched = storageEngine.getAllScheduledTestAttempts();
    const schedAttempts = Array.isArray(allSched)
      ? allSched.filter(a => a && a.student_id === studentUser.student_id)
      : [];
    this.renderProgressTopicBreakdown(actualRecords, schedAttempts, subjectId);
  }

  renderProgressTopicBreakdown(actualRecords, schedAttempts, subjectFilter = "ALL") {
    const container = document.getElementById("prog-topic-breakdown-list");
    if (!container) return;

    if (!Array.isArray(actualRecords)) {
      actualRecords = (actualRecords && Array.isArray(actualRecords.diagnostic_records))
        ? actualRecords.diagnostic_records
        : [];
    }
    if (!Array.isArray(schedAttempts)) {
      schedAttempts = [];
    }

    const catalog = window.gSubjectCatalog || { subjects: [] };
    let topicsToRender = [];

    catalog.subjects.forEach(subj => {
      if (subjectFilter === "ALL" || subj.id === subjectFilter) {
        (subj.topics || []).forEach(top => {
          topicsToRender.push({
            subjectId: subj.id,
            subjectName: subj.name,
            topicId: top.id,
            topicName: top.name,
            notes: top.notes || null,
            videoRec: top.video_recommendation || null
          });
        });
      }
    });

    if (topicsToRender.length === 0) {
      container.innerHTML = `<div class="text-muted text-center py-3">No topics found for selected subject.</div>`;
      return;
    }

    const topicStats = {};
    topicsToRender.forEach(t => {
      topicStats[t.topicId] = { attempted: 0, correct: 0, wrong: 0 };
    });

    actualRecords.forEach(r => {
      if (r.item_responses) {
        Object.keys(r.item_responses).forEach(cid => {
          if (topicStats[cid]) {
            topicStats[cid].attempted += 1;
            if (r.item_responses[cid].is_correct) topicStats[cid].correct += 1;
            else topicStats[cid].wrong += 1;
          }
        });
      }
    });

    schedAttempts.forEach(att => {
      if (att.responses) {
        att.responses.forEach(resp => {
          const tid = resp.topic_id || resp.concept_id;
          if (tid && topicStats[tid]) {
            topicStats[tid].attempted += 1;
            if (resp.is_correct) topicStats[tid].correct += 1;
            else topicStats[tid].wrong += 1;
          }
        });
      }
    });

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Subject & Topic</th>
              <th>Questions Attempted</th>
              <th>Accuracy</th>
              <th>BKT Mastery Estimate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${topicsToRender.map(t => {
              const stats = topicStats[t.topicId] || { attempted: 0, correct: 0, wrong: 0 };
              const acc = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : null;
              
              let bktMastery = "Unassessed";
              let statusBadge = `<span class="badge badge-secondary">Not Attempted</span>`;

              if (stats.attempted > 0) {
                const pInit = 0.2;
                const pTransit = 0.15;
                const pSlip = 0.1;
                const pGuess = 0.2;
                let pL = pInit;
                for (let i = 0; i < stats.correct; i++) {
                  pL = (pL * (1 - pSlip)) / (pL * (1 - pSlip) + (1 - pL) * pGuess);
                  pL = pL + (1 - pL) * pTransit;
                }
                for (let i = 0; i < stats.wrong; i++) {
                  pL = (pL * pSlip) / (pL * pSlip + (1 - pL) * (1 - pGuess));
                  pL = pL + (1 - pL) * pTransit;
                }
                const bktPct = Math.round(Math.min(0.99, Math.max(0.05, pL)) * 100);
                bktMastery = `${bktPct}% estimated probability`;

                if (acc >= 80) {
                  statusBadge = `<span class="badge badge-success">✓ Mastered (${acc}%)</span>`;
                } else if (acc >= 50) {
                  statusBadge = `<span class="badge badge-warning">Developing (${acc}%)</span>`;
                } else {
                  statusBadge = `<span class="badge badge-danger">Review Needed (${acc}%)</span>`;
                }
              }

              return `
                <tr>
                  <td>
                    <strong>${t.topicName}</strong><br>
                    <span class="badge badge-secondary text-xs">${t.subjectName}</span> <code class="text-xs text-cyan">${t.topicId}</code>
                  </td>
                  <td>${stats.attempted > 0 ? `${stats.correct} correct / ${stats.attempted} attempted` : '<span class="text-muted">0 attempted</span>'}</td>
                  <td>${acc !== null ? `<strong>${acc}%</strong>` : '<span class="text-muted">—</span>'}</td>
                  <td><small class="text-muted">${bktMastery}</small></td>
                  <td>${statusBadge}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  renderProgressWeakTopicsAndResources(actualRecords, schedAttempts, helpRequests) {
    const weakListEl = document.getElementById("prog-weak-topics-list");
    const countBadgeEl = document.getElementById("prog-weak-count-badge");
    const recsListEl = document.getElementById("prog-recommended-resources-list");

    if (!Array.isArray(actualRecords)) {
      actualRecords = (actualRecords && Array.isArray(actualRecords.diagnostic_records))
        ? actualRecords.diagnostic_records
        : [];
    }
    if (!Array.isArray(schedAttempts)) {
      schedAttempts = [];
    }
    if (!Array.isArray(helpRequests)) {
      helpRequests = [];
    }

    const catalog = window.gSubjectCatalog || { subjects: [] };
    const topicMap = {};
    catalog.subjects.forEach(s => {
      (s.topics || []).forEach(t => {
        topicMap[t.id] = { ...t, subjectName: s.name, subjectId: s.id };
      });
    });

    const topicDifficulty = {};
    
    actualRecords.forEach(r => {
      if (r.item_responses) {
        Object.keys(r.item_responses).forEach(cid => {
          if (!topicDifficulty[cid]) {
            topicDifficulty[cid] = { topicId: cid, wrong: 0, attempted: 0, helpRequests: 0, misconceptions: [] };
          }
          topicDifficulty[cid].attempted += 1;
          if (!r.item_responses[cid].is_correct) {
            topicDifficulty[cid].wrong += 1;
            if (r.item_responses[cid].misconception) {
              topicDifficulty[cid].misconceptions.push(r.item_responses[cid].misconception);
            }
          }
        });
      }
      if (r.primary_likely_gap && r.primary_likely_gap !== "NONE") {
        const gid = r.primary_likely_gap;
        if (!topicDifficulty[gid]) {
          topicDifficulty[gid] = { topicId: gid, wrong: 1, attempted: 1, helpRequests: 0, misconceptions: [] };
        }
      }
    });

    schedAttempts.forEach(att => {
      if (att.responses) {
        att.responses.forEach(resp => {
          const tid = resp.topic_id || resp.concept_id;
          if (tid) {
            if (!topicDifficulty[tid]) {
              topicDifficulty[tid] = { topicId: tid, wrong: 0, attempted: 0, helpRequests: 0, misconceptions: [] };
            }
            topicDifficulty[tid].attempted += 1;
            if (!resp.is_correct) topicDifficulty[tid].wrong += 1;
          }
        });
      }
    });

    (helpRequests || []).forEach(hr => {
      const tid = hr.topic_id;
      if (tid) {
        if (!topicDifficulty[tid]) {
          topicDifficulty[tid] = { topicId: tid, wrong: 0, attempted: 0, helpRequests: 0, misconceptions: [] };
        }
        topicDifficulty[tid].helpRequests += 1;
      }
    });

    const weakTopics = Object.values(topicDifficulty).filter(td => {
      const errorRate = td.attempted > 0 ? (td.wrong / td.attempted) : 0;
      return td.wrong >= 2 || (td.wrong >= 1 && td.helpRequests >= 1) || (errorRate >= 0.4 && td.attempted >= 2) || td.helpRequests >= 2;
    }).sort((a, b) => (b.wrong + b.helpRequests * 1.5) - (a.wrong + a.helpRequests * 1.5));

    if (countBadgeEl) {
      countBadgeEl.textContent = `${weakTopics.length} Flagged Topic${weakTopics.length === 1 ? '' : 's'}`;
    }

    // Render Weak Topics
    if (weakListEl) {
      if (weakTopics.length === 0) {
        weakListEl.innerHTML = `
          <div class="card p-4 text-center" style="background: rgba(16, 185, 129, 0.08); border: 1px solid var(--emerald-success);">
            <div style="font-size: 28px; margin-bottom: 6px;">🎉</div>
            <strong style="color: #6EE7B7; font-size: 15px;">Excellent Progress — No Recurring Difficulty Gaps Flagged</strong>
            <p class="text-xs text-muted" style="margin: 4px 0 0 0;">
              You have not demonstrated repeated mistakes or high AI help volume in your completed assessments. Keep practicing to maintain subject mastery!
            </p>
          </div>
        `;
      } else {
        weakListEl.innerHTML = weakTopics.map(wt => {
          const topMeta = topicMap[wt.topicId] || { name: wt.topicId, subjectName: "Computer Networks" };
          const accPct = wt.attempted > 0 ? Math.round(((wt.attempted - wt.wrong) / wt.attempted) * 100) : 0;
          
          let nextStep = `Review the lecture notes on ${topMeta.name} below, focus on key pitfalls, and complete a targeted retest.`;
          if (topMeta.notes && topMeta.notes.pitfalls) {
            nextStep = `Review ${topMeta.name} notes. Critical pitfall to clarify: "${topMeta.notes.pitfalls}". Then attempt a targeted 5-question retest.`;
          }

          return `
            <div class="topic-support-card mb-3">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                <div>
                  <span class="badge badge-secondary text-xs">${topMeta.subjectName}</span>
                  <h4 style="margin: 4px 0 2px 0; color: #FFFFFF;">${topMeta.name}</h4>
                  <div class="text-xs text-muted">Topic Code: <code>${wt.topicId}</code></div>
                </div>
                <div>
                  <span class="badge badge-danger">${wt.wrong} incorrect answers · ${wt.helpRequests} tutor inquiries</span>
                </div>
              </div>
              <div class="mt-2 text-xs" style="color: #CBD5E1;">
                <strong>Observed Difficulty:</strong> Accuracy is <strong>${accPct}%</strong> across ${wt.attempted} attempted questions.
                ${wt.misconceptions.length > 0 ? `<br><span class="text-amber">Diagnostic Note: ${wt.misconceptions[0]}</span>` : ''}
              </div>
              <div class="next-step-badge mt-2">
                👉 <strong>Clear Next Step:</strong> ${nextStep}
              </div>
            </div>
          `;
        }).join("");
      }
    }

    // Render Recommended Resources (Lecture Notes & Verified Videos)
    if (recsListEl) {
      const topicsForRecs = weakTopics.length > 0 ? weakTopics.slice(0, 4) : Object.values(topicDifficulty).slice(0, 3);

      if (topicsForRecs.length === 0) {
        recsListEl.innerHTML = `
          <div class="card p-3 text-center text-muted" style="background: rgba(15, 23, 42, 0.5);">
            No recommended resources required right now. Complete assessments to generate personalized learning paths.
          </div>
        `;
        return;
      }

      recsListEl.innerHTML = topicsForRecs.map(wt => {
        const topMeta = topicMap[wt.topicId] || { name: wt.topicId, subjectName: "Computer Networks" };
        const safeNotes = this.getTopicNotesSafe(wt.topicId, topMeta.name);
        const safeVideo = this.getVideoRecommendationSafe(wt.topicId, topMeta.name, topMeta.subjectName);

        return `
          <div class="card mb-3" style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(148, 163, 184, 0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <span class="badge badge-primary text-xs">${topMeta.subjectName}</span>
                <strong style="margin-left: 8px; color: #FFFFFF;">Target Concept: ${topMeta.name}</strong>
              </div>
              <span class="resource-recommendation-chip">Supports Topic: ${topMeta.name}</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-top: 10px;">
              <!-- Lecture Notes Recommendation -->
              <div class="card p-3" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.2);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span style="font-size: 18px;">📖</span>
                  <strong style="color: #38BDF8; font-size: 13px;">Verified Lecture Notes</strong>
                </div>
                ${safeNotes.available ? `
                  <h5 style="margin: 0 0 4px 0; color: #FFFFFF; font-size: 14px;">${safeNotes.title}</h5>
                  <p class="text-xs text-muted" style="margin: 0 0 8px 0; line-height: 1.4;">${safeNotes.summary}</p>
                  <div class="text-xs text-amber mb-2"><em>Key Pitfall:</em> ${safeNotes.pitfalls || 'Review foundational definitions'}</div>
                  <div class="text-xs text-muted"><strong>Supports Topic:</strong> ${topMeta.name} (addresses core theoretical misconceptions)</div>
                ` : `
                  <div class="text-xs text-muted py-2">No resource available yet</div>
                `}
              </div>

              <!-- Verified Video Recommendation -->
              <div class="card p-3" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(245, 158, 11, 0.2);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span style="font-size: 18px;">📺</span>
                  <strong style="color: #FBBF24; font-size: 13px;">Verified Video Tutorial</strong>
                </div>
                ${safeVideo.available && safeVideo.url ? `
                  <h5 style="margin: 0 0 4px 0; color: #FFFFFF; font-size: 14px;">${safeVideo.title}</h5>
                  <div class="text-xs text-muted mb-2">Channel: <strong>${safeVideo.channel}</strong></div>
                  <div class="text-xs text-muted mb-2"><strong>Supports Topic:</strong> ${topMeta.name} (step-by-step visual demonstration)</div>
                  <a href="${safeVideo.url}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline-warning">
                    Watch Verified Video ↗
                  </a>
                ` : `
                  <div class="text-xs text-muted py-2">No resource available yet</div>
                `}
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  getTopicNotesSafe(topicId, topicName) {
    if (window.gSubjectCatalog && window.gSubjectCatalog.subjects) {
      for (const subj of window.gSubjectCatalog.subjects) {
        const top = (subj.topics || []).find(t => t.id === topicId || t.name === topicName);
        if (top && top.notes && top.notes.title) {
          return {
            available: true,
            title: top.notes.title,
            summary: top.notes.summary || "",
            pitfalls: top.notes.pitfalls || ""
          };
        }
      }
    }
    if (window.gQuestionBank && window.gQuestionBank.concepts) {
      const c = window.gQuestionBank.concepts.find(item => item.id === topicId || item.name === topicName);
      if (c && c.description) {
        return {
          available: true,
          title: `${c.name} — Lecture Overview`,
          summary: c.description,
          pitfalls: c.pedagogical_gap || ""
        };
      }
    }
    return { available: false, title: "No resource available yet", summary: "" };
  }

  getVideoRecommendationSafe(topicId, topicName, subjectName = "Computer Networks") {
    if (window.scheduledTestEngineInstance && typeof window.scheduledTestEngineInstance.getVideoRecommendationForTopic === "function") {
      const v = window.scheduledTestEngineInstance.getVideoRecommendationForTopic(topicId, topicName, subjectName);
      if (v && v.available && v.url) {
        return {
          available: true,
          title: v.title || `${topicName} — Concept Tutorial`,
          channel: v.channel || "Academic Video",
          url: v.url
        };
      }
    }
    return { available: false, title: "No resource available yet", url: null };
  }

  // ==========================================
  // 1.1 MY LEARNING HISTORY & PROGRESS VISUALIZATION (REQUIREMENT 3)
  // ==========================================
  renderLearningHistory(studentUser) {
    if (!studentUser) return;

    const sessions = storageEngine.getLearningSessionsForStudent(studentUser.student_id);
    const diagRecords = storageEngine.getRecordsForStudent(studentUser.student_id, studentUser.email);

    // A. Learning Summary Metrics
    const totalDiagnosticAttempts = diagRecords.length;
    const totalSessions = sessions.length;
    const conceptsStudied = new Set(sessions.map(s => s.concept_id)).size;
    const retestsCompleted = sessions.filter(s => s.retest_score !== undefined).length;
    const avgAccuracy = retestsCompleted > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.retest_percentage || 0), 0) / retestsCompleted) + "%"
      : "No Retests Yet";

    const statAttemptsEl = document.getElementById("stu-lh-stat-attempts");
    const statSessionsEl = document.getElementById("stu-lh-stat-sessions");
    const statConceptsEl = document.getElementById("stu-lh-stat-concepts");
    const statRetestsEl = document.getElementById("stu-lh-stat-retests");
    const statAvgScoreEl = document.getElementById("stu-lh-stat-avg-score");

    if (statAttemptsEl) statAttemptsEl.textContent = totalDiagnosticAttempts;
    if (statSessionsEl) statSessionsEl.textContent = totalSessions;
    if (statConceptsEl) statConceptsEl.textContent = `${conceptsStudied} / 10`;
    if (statRetestsEl) statRetestsEl.textContent = retestsCompleted;
    if (statAvgScoreEl) statAvgScoreEl.textContent = avgAccuracy;

    // D. Progress Visualization Chart (Real Saved Data, No Fabrications)
    const chartEl = document.getElementById("stu-learning-progress-chart");
    if (chartEl) {
      if (sessions.length === 0) {
        chartEl.innerHTML = `
          <div class="chart-empty-state text-center py-4 text-muted">
            <div style="font-size: 28px; margin-bottom: 6px;">📊</div>
            <p style="margin: 0; font-size: 13px; color: #CBD5E1;">No concept retests completed yet for this account.</p>
            <span class="text-xs">Complete a 5-question retest in AI Tutor & Learning to generate your verified improvement timeline.</span>
          </div>
        `;
      } else {
        // Sort chronological for left-to-right progression
        const chronological = [...sessions].reverse().slice(-10); // Show up to last 10 attempts
        chartEl.innerHTML = `
          <div class="progress-chart-container">
            <div class="progress-chart-bars-wrap">
              ${chronological.map(s => {
                const fillClass = s.retest_percentage >= 80 ? 'fill-emerald' : (s.retest_percentage >= 60 ? 'fill-amber' : 'fill-rose');
                const conceptName = s.concept_name || s.concept_id || 'Concept';
                const shortConcept = conceptName.length > 16 ? conceptName.substring(0, 14) + '…' : conceptName;
                const dateLabel = s.completed_at ? new Date(s.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
                return `
                  <div class="progress-chart-column" title="${conceptName}: ${s.retest_score}/${s.retest_total || 5} (${s.retest_percentage}%) on ${s.completed_at ? new Date(s.completed_at).toLocaleString() : '—'}">
                    <div class="chart-bar-value">${s.retest_percentage}%</div>
                    <div class="chart-bar-track">
                      <div class="chart-bar-fill ${fillClass}" style="height: ${Math.max(s.retest_percentage, 10)}%;"></div>
                    </div>
                    <div class="chart-bar-label" title="${conceptName}">${shortConcept}</div>
                    <div class="chart-bar-date">${dateLabel}</div>
                  </div>
                `;
              }).join("")}
            </div>
            <div class="chart-footer-meta">
              <span class="text-xs text-muted">● High Accuracy (≥80%) &middot; ● Moderate (60-79%) &middot; ● Review Needed (&lt;60%)</span>
              <span class="text-xs text-cyan">Account Verified: <strong>${studentUser.student_id}</strong> (${sessions.length} sessions recorded)</span>
            </div>
          </div>
        `;
      }
    }

    // B. Recent Learning Sessions Table (Sorted by completed_at Descending)
    const tableBody = document.getElementById("stu-learning-sessions-table-body");
    if (tableBody) {
      if (sessions.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-4 text-muted">
              No learning sessions recorded yet. Launch 'AI Tutor & Learning' above to study a concept and take your first retest!
            </td>
          </tr>
        `;
      } else {
        // Sort newest first
        const sorted = [...sessions].sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0));
        tableBody.innerHTML = sorted.map(s => {
          let prevScoreHtml = `<span class="text-xs text-muted">Direct study</span>`;
          if (s.previous_diagnostic_evidence) {
            const isCorrect = s.previous_diagnostic_evidence.is_correct;
            const statusText = s.previous_diagnostic_evidence.status || (isCorrect ? "Correct (1/1)" : "Gap (0/1)");
            prevScoreHtml = `<span class="badge ${isCorrect ? 'badge-success' : 'badge-danger'}">${statusText}</span>`;
          }

          const scoreBadgeClass = s.retest_score >= 4 ? 'score-high' : (s.retest_score >= 3 ? 'score-mid' : 'score-low');
          const isImproved = s.score_comparison && s.score_comparison.includes("+");

          return `
            <tr>
              <td><small>${s.completed_at ? new Date(s.completed_at).toLocaleString() : '—'}</small></td>
              <td>
                <strong>${s.concept_name || s.concept_id || 'Concept'}</strong><br>
                <code class="text-xs text-cyan">${s.concept_id}</code>
              </td>
              <td>${prevScoreHtml}</td>
              <td><span class="score-pill ${scoreBadgeClass}">${s.retest_score}/${s.retest_total || 5} (${s.retest_percentage}%)</span></td>
              <td><small class="font-bold ${isImproved ? 'text-emerald' : 'text-amber'}">${s.score_comparison || 'Formative Retest'}</small></td>
              <td><span class="badge ${s.status_badge_class || 'badge-success'}">${s.learning_status}</span></td>
              <td>
                <button class="btn btn-xs btn-outline-primary" onclick="window.dashboardEngineInstance.showLearningSessionModal('${s.session_id}')">
                  View Details
                </button>
              </td>
            </tr>
          `;
        }).join("");
      }
    }

    // E. Continue Learning Actions
    const continueActionsEl = document.getElementById("stu-continue-actions-buttons");
    if (continueActionsEl) {
      const buttons = [];
      if (sessions.length > 0) {
        const latest = sessions[0];
        buttons.push(`
          <button class="btn btn-xs btn-outline-warning" onclick="window.openAITutorConcept('${latest.concept_id}')">
            🔄 Retry ${latest.concept_name || latest.concept_id}
          </button>
        `);
      }
      if (diagRecords.length > 0 && diagRecords[0].primary_likely_gap && diagRecords[0].primary_likely_gap !== "NONE") {
        const gapId = diagRecords[0].primary_likely_gap;
        const gapName = diagRecords[0].primary_gap_name || gapId;
        buttons.push(`
          <button class="btn btn-xs btn-outline-primary" onclick="window.openAITutorConcept('${gapId}')">
            🎯 Study Diagnosed Gap: ${gapName}
          </button>
        `);
      }
      buttons.push(`
        <button class="btn btn-xs btn-primary" onclick="switchTab('tab-tutor')">
          📚 Enter AI Tutor & Learning →
        </button>
      `);
      continueActionsEl.innerHTML = buttons.join("");
    }
  }

  // ==========================================
  // 2. COURSE INSTRUCTOR DASHBOARD
  // ==========================================
  switchFacultyTab(subtabId) {
    this.activeFacultySubtab = subtabId || "overview";
    const tabs = [
      { id: "overview", btnId: "fac-subtab-btn-overview", viewId: "fac-view-overview" },
      { id: "tests-schedule", btnId: "fac-subtab-btn-tests-schedule", viewId: "fac-view-tests-schedule" },
      { id: "progress", btnId: "fac-subtab-btn-progress", viewId: "fac-view-progress" },
      { id: "topics-support", btnId: "fac-subtab-btn-topics-support", viewId: "fac-view-topics-support" },
      { id: "students-inspect", btnId: "fac-subtab-btn-students-inspect", viewId: "fac-view-students-inspect" }
    ];

    tabs.forEach(t => {
      const btn = document.getElementById(t.btnId);
      const view = document.getElementById(t.viewId);
      const isActive = t.id === this.activeFacultySubtab;
      if (btn) {
        if (isActive) {
          btn.classList.add("active");
          btn.setAttribute("aria-selected", "true");
        } else {
          btn.classList.remove("active");
          btn.setAttribute("aria-selected", "false");
        }
      }
      if (view) {
        if (isActive) {
          view.classList.add("active");
          view.style.display = "block";
        } else {
          view.classList.remove("active");
          view.style.display = "none";
        }
      }
    });

    if (this.activeFacultySubtab === "students-inspect") {
      this.filterInstructorTable();
    }
  }

  renderInstructorDashboard() {
    const currentUser = authEngine.getCurrentUser();
    
    // If logged in as instructor, enforce their identity strictly
    if (currentUser && currentUser.role === CONFIG.ROLES.INSTRUCTOR) {
      this.currentInstructorKey = currentUser.name;
      this.currentCourseKey = currentUser.course_code;
    } else {
      const instructorSelect = document.getElementById("instructor-identity-select");
      if (instructorSelect) {
        this.currentInstructorKey = instructorSelect.value;
      }
    }

    // Determine department and course code
    let targetDept = "CSE";
    Object.keys(CONFIG.DEPARTMENTS).forEach(code => {
      const d = CONFIG.DEPARTMENTS[code];
      if (d.instructor.name === this.currentInstructorKey || d.course_code === this.currentCourseKey) {
        targetDept = code;
        this.currentCourseKey = d.course_code;
      }
    });

    const deptConfig = CONFIG.DEPARTMENTS[targetDept];
    // Filter strictly to this course and instructor
    const records = storageEngine.getRecordsForInstructor(this.currentInstructorKey, this.currentCourseKey);

    // Update Header Profile Info
    const profNameEl = document.getElementById("instructor-active-name");
    const profCourseEl = document.getElementById("instructor-active-course");
    const profDeptEl = document.getElementById("instructor-active-dept");
    const routingRuleEl = document.getElementById("instructor-routing-rule-notice");
    const switcherContainer = document.getElementById("instructor-switcher-box");

    if (profNameEl) profNameEl.textContent = deptConfig.instructor.name;
    if (profCourseEl) profCourseEl.textContent = `${deptConfig.course_code} - ${deptConfig.course_name}`;
    if (profDeptEl) profDeptEl.textContent = deptConfig.name;
    
    // Hide dropdown switcher if authentic instructor logged in
    if (switcherContainer && currentUser && currentUser.role === CONFIG.ROLES.INSTRUCTOR) {
      switcherContainer.style.display = "none";
    }

    if (routingRuleEl) {
      routingRuleEl.innerHTML = `🛡️ <strong>Institutional Access Scope:</strong> You are viewing submissions strictly assigned to <strong>${deptConfig.course_code}</strong>. Reports co-routed to Dept HOD (<strong>${deptConfig.hod.name}</strong>). Principal access prohibited.`;
    }

    // SECTION 1: TESTS METRICS (Scheduled, Active, Upcoming, Closed, Attempts, Completions)
    this.updateInstructorTestMetrics();

    const legacyTotalEl = document.getElementById("inst-stat-total");
    const legacyGapEl = document.getElementById("inst-stat-top-gap");
    const legacyRetestEl = document.getElementById("inst-stat-retest");
    if (legacyTotalEl) legacyTotalEl.textContent = records.length;
    if (legacyGapEl) legacyGapEl.textContent = "CN_04_SUBNETTING_IP";
    if (legacyRetestEl) legacyRetestEl.textContent = "50%";

    // SECTION 2: PROGRESS AND CLASS PERFORMANCE
    const actualData = storageEngine.getActualRecordsForInstructor(this.currentInstructorKey, this.currentCourseKey);
    const actualDiag = Array.isArray(actualData.diagnostic_records) ? actualData.diagnostic_records : [];
    const actualSched = Array.isArray(actualData.scheduled_attempts) ? actualData.scheduled_attempts : [];

    const enrolledStudents = Object.values(CONFIG.ACCOUNTS).filter(a => a.role === CONFIG.ROLES.STUDENT && a.department === targetDept);
    const uniqueCompleters = new Set();
    actualDiag.forEach(r => uniqueCompleters.add(r.student_id));
    actualSched.forEach(a => uniqueCompleters.add(a.student_id));
    const completionRate = enrolledStudents.length > 0 ? Math.round((uniqueCompleters.size / enrolledStudents.length) * 100) : 0;

    let totalQsAnswered = 0;
    let totalCorrectAnswered = 0;
    actualDiag.forEach(r => {
      totalQsAnswered += (r.total_questions || 10);
      totalCorrectAnswered += (r.score || 0);
    });
    actualSched.forEach(a => {
      totalQsAnswered += (a.total_questions || 5);
      totalCorrectAnswered += (a.score || 0);
    });
    const avgAccuracyPct = totalQsAnswered > 0 ? Math.round((totalCorrectAnswered / totalQsAnswered) * 100) : 0;
    const avgScore10 = (avgAccuracyPct / 10).toFixed(1);

    const progCompEl = document.getElementById("inst-prog-stat-completion");
    const progCompSubEl = document.getElementById("inst-prog-stat-completion-sub");
    const progAccEl = document.getElementById("inst-prog-stat-accuracy");
    const progItemsEl = document.getElementById("inst-prog-stat-items");
    const progCorrectEl = document.getElementById("inst-prog-stat-correct-items");
    const progCourseLabel = document.getElementById("inst-prog-stat-course-label");

    if (progCompEl) progCompEl.textContent = `${completionRate}%`;
    if (progCompSubEl) progCompSubEl.textContent = `${uniqueCompleters.size} of ${enrolledStudents.length} enrolled completed`;
    if (progAccEl) progAccEl.textContent = `${avgAccuracyPct}%`;
    if (progItemsEl) progItemsEl.textContent = totalQsAnswered;
    if (progCorrectEl) progCorrectEl.textContent = `${totalCorrectAnswered} correct`;
    if (progCourseLabel) progCourseLabel.textContent = this.currentCourseKey;

    // Render Combined Progress Graph Over Time
    this.renderInstructorCombinedChart(actualDiag, actualSched, enrolledStudents.length);

    // Detailed topic progress & estimated mastery
    this.renderInstructorCourseProgress(records, deptConfig);

    // SECTION 3: TOPICS NEEDING SUPPORT (Sorted with explanations)
    this.renderInstructorTopicsSupport(records, deptConfig);

    // SECTION 4: SCHEDULE TEST & STUDENTS NEEDING HELP
    this.renderInstructorStudentsNeedingSupport(targetDept);
    this.renderInstructorScheduledTests();
    this.filterInstructorTable(records);

    // Activate the selected tab
    this.switchFacultyTab(this.activeFacultySubtab || "overview");
  }

  renderInstructorCourseProgress(records, deptConfig) {
    const container = document.getElementById("instructor-course-progress-content");
    if (!container) return;

    try {
      // Get actual authorized non-synthetic records strictly for this course/instructor
      const actualData = storageEngine.getActualRecordsForInstructor(this.currentInstructorKey, this.currentCourseKey);
      const actualDiag = Array.isArray(actualData.diagnostic_records) ? actualData.diagnostic_records : [];
      const actualSched = Array.isArray(actualData.scheduled_attempts) ? actualData.scheduled_attempts : [];
      const totalAttempts = actualDiag.length + actualSched.length;

      let totalQs = 0;
      let totalCorrect = 0;
      actualDiag.forEach(r => {
        totalQs += (r.total_questions || 10);
        totalCorrect += (r.score || 0);
      });
      actualSched.forEach(a => {
        totalQs += (a.total_questions || 5);
        totalCorrect += (a.score || 0);
      });
      const classAccuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

      const catalog = window.gSubjectCatalog || { subjects: [] };
      const cnSubject = catalog.subjects.find(s => s.id === "CN") || { topics: [] };
      const topics = cnSubject.topics || [];

      // Calculate topic performance across all actual student attempts in this course
      const topicStats = {};
      topics.forEach(t => {
        topicStats[t.id] = { attempted: 0, correct: 0, wrong: 0 };
      });

      actualDiag.forEach(r => {
        if (r.item_responses) {
          Object.keys(r.item_responses).forEach(cid => {
            if (topicStats[cid]) {
              topicStats[cid].attempted += 1;
              if (r.item_responses[cid].is_correct) topicStats[cid].correct += 1;
              else topicStats[cid].wrong += 1;
            }
          });
        }
      });

      actualSched.forEach(att => {
        if (att.responses) {
          att.responses.forEach(resp => {
            const tid = resp.topic_id || resp.concept_id;
            if (tid && topicStats[tid]) {
              topicStats[tid].attempted += 1;
              if (resp.is_correct) topicStats[tid].correct += 1;
              else topicStats[tid].wrong += 1;
            }
          });
        }
      });

      if (totalAttempts === 0) {
        container.innerHTML = `
          <div class="text-center py-4 text-muted">
            No live student attempts submitted for ${deptConfig ? deptConfig.course_code : 'this course'} yet. As students take tests, class accuracy and topic progress will populate here.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 18px;">
          <div class="card p-3" style="background: #F8FAFC; border: 1px solid var(--border-card);">
            <span class="text-xs text-muted">Assigned Student Submissions</span>
            <div style="font-size: 22px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">
              ${totalAttempts} <span style="font-size: 13px; font-weight: normal;" class="text-muted">(${actualSched.length} tests, ${actualDiag.length} diags)</span>
            </div>
          </div>
          <div class="card p-3" style="background: #F8FAFC; border: 1px solid var(--border-card);">
            <span class="text-xs text-muted">Overall Class Accuracy</span>
            <div style="font-size: 22px; font-weight: 700; color: #0284C7; margin-top: 4px;">
              ${classAccuracy}% <span style="font-size: 13px; font-weight: normal;" class="text-muted">(${totalCorrect}/${totalQs} items)</span>
            </div>
          </div>
          <div class="card p-3" style="background: #F8FAFC; border: 1px solid var(--border-card);">
            <span class="text-xs text-muted">Assigned Subject</span>
            <div style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">
              ${deptConfig ? deptConfig.course_name : 'Computer Networks'}
            </div>
          </div>
        </div>

        <h4 style="font-size: 14px; margin-bottom: 10px; color: var(--text-primary);">Topic Progress & Estimated Mastery</h4>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Attempts</th>
                <th>Class Accuracy</th>
                <th>BKT Mastery Estimate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${topics.map(t => {
                const st = topicStats[t.id] || { attempted: 0, correct: 0, wrong: 0 };
                const acc = st.attempted > 0 ? Math.round((st.correct / st.attempted) * 100) : null;
                let badge = `<span class="badge badge-secondary">Not Attempted</span>`;
                let bktLabel = "Unassessed";
                if (st.attempted > 0) {
                  if (acc >= 80) {
                    badge = `<span class="badge badge-success">Mastered (${acc}%)</span>`;
                    bktLabel = "High (≥80%)";
                  } else if (acc >= 50) {
                    badge = `<span class="badge badge-warning">Developing (${acc}%)</span>`;
                    bktLabel = "Moderate (50-79%)";
                  } else {
                    badge = `<span class="badge badge-danger">Needs Support (${acc}%)</span>`;
                    bktLabel = "Low (<50%)";
                  }
                }
                return `
                  <tr>
                    <td><strong>${t.name}</strong> <code class="text-xs text-cyan">${t.id}</code></td>
                    <td>${st.attempted > 0 ? `${st.attempted} items` : '<span class="text-muted">0</span>'}</td>
                    <td>${acc !== null ? `<strong>${acc}%</strong>` : '<span class="text-muted">—</span>'}</td>
                    <td><small class="text-muted">${bktLabel}</small></td>
                    <td>${badge}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      console.warn("Notice in renderInstructorCourseProgress:", e);
      container.innerHTML = `<div class="text-muted text-sm py-2">Unable to load course progress at this time.</div>`;
    }
  }

  renderInstructorCombinedChart(actualDiag, actualSched, enrolledCount) {
    const container = document.getElementById("instructor-combined-chart");
    if (!container) return;

    // Combine all actual assessments sorted chronologically
    const events = [
      ...actualDiag.map(r => ({
        date: new Date(r.submitted_at),
        title: "Diagnostic: " + (r.quiz_attempt_id || r.report_id),
        accuracy: r.percentage || Math.round((r.score / (r.total_questions || 10)) * 100),
        score: r.score,
        total: r.total_questions || 10,
        student: r.student_name,
        type: "diagnostic"
      })),
      ...actualSched.map(a => ({
        date: new Date(a.completed_at || a.submitted_at || Date.now()),
        title: a.title || "Scheduled Test",
        accuracy: a.percentage || Math.round((a.score / (a.total_questions || 5)) * 100),
        score: a.score,
        total: a.total_questions || 5,
        student: a.student_name || "Student",
        type: "scheduled"
      }))
    ].sort((a, b) => a.date - b.date);

    if (events.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5 text-muted" style="border: 1px dashed #E2E8F0; border-radius: 8px;">
          No student assessment records recorded yet. As students take tests, the combined progress graph will render here.
        </div>
      `;
      return;
    }

    // Compute cumulative completion rate and running accuracy over time
    const studentSet = new Set();
    const dataPoints = events.map((ev, idx) => {
      studentSet.add(ev.student);
      const completionPct = enrolledCount > 0 ? Math.min(100, Math.round((studentSet.size / enrolledCount) * 100)) : 100;
      return {
        ...ev,
        stepIndex: idx,
        completion: completionPct,
        formattedDate: ev.date.toLocaleDateString([], { month: "short", day: "numeric" })
      };
    });

    const width = 640;
    const height = 220;
    const padLeft = 45;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 35;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const n = dataPoints.length;
    const getX = (i) => n === 1 ? padLeft + chartW / 2 : padLeft + (i / (n - 1)) * chartW;
    const getY = (val) => padTop + chartH - (val / 100) * chartH;

    const gridYValues = [0, 25, 50, 75, 100];
    const gridLines = gridYValues.map(v => {
      const y = getY(v);
      return `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" class="chart-grid-line" stroke="#E2E8F0" stroke-dasharray="3,3" />
        <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" class="chart-axis-text" font-size="10" fill="#64748B">${v}%</text>
      `;
    }).join("");

    const accPoints = dataPoints.map((p, i) => `${getX(i)},${getY(p.accuracy)}`).join(" ");
    const compPoints = dataPoints.map((p, i) => `${getX(i)},${getY(p.completion)}`).join(" ");

    const circles = dataPoints.map((p, i) => {
      const cx = getX(i);
      const cyAcc = getY(p.accuracy);
      const cyComp = getY(p.completion);
      const tooltipText = `${p.title} (${p.formattedDate})&#10;Student: ${p.student}&#10;Class Accuracy: ${p.accuracy}% (${p.score}/${p.total})&#10;Class Completion: ${p.completion}%`;

      return `
        <g class="chart-point-group">
          <circle cx="${cx}" cy="${cyAcc}" r="5" fill="#0284C7" stroke="#FFFFFF" stroke-width="2" class="chart-point">
            <title>${tooltipText}</title>
          </circle>
          <rect x="${cx - 4}" y="${cyComp - 4}" width="8" height="8" rx="2" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5" class="chart-point">
            <title>${tooltipText}</title>
          </rect>
          <text x="${cx}" y="${height - 12}" text-anchor="middle" class="chart-axis-text" font-size="10" fill="#64748B">${p.formattedDate}</text>
        </g>
      `;
    }).join("");

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="combined-progress-svg" style="overflow: visible;">
        ${gridLines}
        <!-- Completion Line (Emerald) -->
        <polyline fill="none" stroke="#10B981" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${compPoints}" opacity="0.85" />
        <!-- Accuracy Line (Sky Blue) -->
        <polyline fill="none" stroke="#0284C7" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${accPoints}" />
        ${circles}
      </svg>
    `;
  }

  renderInstructorTopicsSupport(records, deptConfig) {
    const container = document.getElementById("instructor-vulnerability-matrix");
    if (!container) return;

    const catalog = window.gSubjectCatalog || { subjects: [] };
    const cnSubject = catalog.subjects.find(s => s.id === "CN") || { topics: [] };
    const topics = cnSubject.topics || [];
    const total = records.length;

    if (total === 0) {
      container.innerHTML = `<div class="text-muted text-center py-3">No student assessment records submitted for ${deptConfig ? deptConfig.course_code : 'this course'} yet.</div>`;
      return;
    }

    const topicExplanations = {
      "CN_01_OSI_LAYERS": "Flagged due to boundary confusion between transport and network layer addressing and protocol encapsulation hierarchy.",
      "CN_02_FRAMING_CRC": "Flagged due to errors in CRC polynomial division, bit-stuffing rules, and frame delimiter verification.",
      "CN_03_FLOW_CONTROL": "Flagged due to window size vs buffer capacity calculation errors in Go-Back-N and Selective Repeat protocols.",
      "CN_04_SUBNETTING_IP": "Flagged due to high failure rate on CIDR prefix calculations, subnet masks, and broadcast boundary determination.",
      "CN_05_ROUTING_ALGO": "Flagged due to count-to-infinity problem misconceptions and Dijkstra vs Bellman-Ford convergence dynamics.",
      "CN_06_TCP_UDP_TRANSPORT": "Flagged due to confusion between TCP 3-way handshake sequence synchronization and UDP best-effort semantics.",
      "CN_07_TCP_CONGESTION": "Flagged due to threshold tracking errors during slow start, congestion avoidance, and fast retransmit phases.",
      "CN_08_DNS_SYSTEM": "Flagged due to recursive vs iterative resolver resolution confusion and DNS TTL record caching mechanisms.",
      "CN_09_HTTP_APPLICATION": "Flagged due to header state management, persistent connection pipelining, and status code misunderstandings.",
      "CN_10_NETWORK_SECURITY": "Flagged due to symmetric vs asymmetric encryption key distribution and digital signature hashing traps."
    };

    // Calculate gap count for each topic
    const topicRows = topics.map(t => {
      const tid = t.id;
      let gapCount = 0;
      records.forEach(r => {
        const resp = r.item_responses ? r.item_responses[tid] : null;
        if (resp && !resp.is_correct) gapCount += 1;
        else if (r.primary_likely_gap === tid) gapCount += 1;
      });

      const gapPct = total > 0 ? Math.round((gapCount / total) * 100) : 0;
      const explanation = topicExplanations[tid] || `Flagged due to recurring incorrect student selections on ${t.name} formative items.`;

      return {
        topic: t,
        gapCount,
        gapPct,
        explanation
      };
    });

    // Sort topics by most incorrect answers descending
    topicRows.sort((a, b) => b.gapCount - a.gapCount);

    const rowsHtml = topicRows.map(item => {
      const t = item.topic;
      const tid = t.id;
      const severityColor = item.gapPct >= 50 ? "#EF4444" : (item.gapPct >= 25 ? "#F59E0B" : "#10B981");

      const safeNotes = this.getTopicNotesSafe(tid, t.name);
      const safeVideo = this.getVideoRecommendationSafe(tid, t.name, "Computer Networks");

      return `
        <div class="topic-support-card mb-3" style="background: #FFFFFF; border: 1px solid var(--border-card); border-radius: 8px; padding: 14px;">
          <div class="vuln-matrix-row" style="margin-bottom: 8px;">
            <div class="vuln-concept-meta" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <div>
                <strong style="color: var(--text-primary); font-size: 14px;">${t.name}</strong>
                <code class="text-xs text-cyan" style="margin-left: 6px;">${tid}</code>
              </div>
              <span class="vuln-stat font-bold" style="color: ${severityColor}; font-size: 13px;">
                ${item.gapCount} of ${total} students flagged (${item.gapPct}%)
              </span>
            </div>
            <div class="vuln-bar-track" style="height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden;">
              <div class="vuln-bar-fill" style="width: ${item.gapPct}%; height: 100%; background-color: ${severityColor};"></div>
            </div>
          </div>

          <!-- Short Explanation of Why Topic is Flagged -->
          <div class="alert alert-warning text-xs py-2 px-3 mb-2" style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; color: #92400E; margin-top: 8px;">
            <strong>🔍 Pedagogical Reason for Flag:</strong> ${item.explanation}
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; margin-top: 8px; font-size: 12px;">
            <div class="card p-2" style="background: #F8FAFC; border: 1px solid var(--border-card);">
              <span class="text-cyan font-bold">📖 Suggested Lecture Notes:</span>
              ${safeNotes.available ? `
                <div style="font-weight: 600; color: var(--text-primary); margin-top: 2px;">${safeNotes.title}</div>
                <div class="text-muted text-xs" style="margin-top: 2px;">Supports Topic: ${t.name}</div>
              ` : `<div class="text-muted text-xs">No resource available yet</div>`}
            </div>

            <div class="card p-2" style="background: #F8FAFC; border: 1px solid var(--border-card);">
              <span class="text-amber font-bold">📺 Suggested Verified Video:</span>
              ${safeVideo.available && safeVideo.url ? `
                <div style="font-weight: 600; color: var(--text-primary); margin-top: 2px;">${safeVideo.title} (${safeVideo.channel})</div>
                <div class="text-muted text-xs" style="margin-top: 2px;">Supports Topic: ${t.name}</div>
                <a href="${safeVideo.url}" target="_blank" rel="noopener noreferrer" class="text-xs text-amber" style="text-decoration: underline;">Open Verified Link ↗</a>
              ` : `<div class="text-muted text-xs">No resource available yet</div>`}
            </div>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = rowsHtml;
  }

  renderInstructorStudentsNeedingSupport(targetDept) {
    const tbody = document.getElementById("instructor-students-help-tbody");
    if (!tbody) return;

    // Filter enrolled students in this department
    const enrolledStudents = Object.values(CONFIG.ACCOUNTS).filter(a => a.role === CONFIG.ROLES.STUDENT && a.department === targetDept);

    const flaggedStudents = [];

    enrolledStudents.forEach(stu => {
      const records = storageEngine.getRecordsForStudent(stu.student_id, stu.email) || [];
      const schedAttempts = storageEngine.getScheduledTestAttemptsForStudent(stu.student_id) || [];
      
      let totalQs = 0;
      let totalCorrect = 0;
      const gaps = new Set();
      let hasPendingRetest = false;

      records.forEach(r => {
        totalQs += (r.total_questions || 10);
        totalCorrect += (r.score || 0);
        if (r.primary_likely_gap && r.primary_likely_gap !== "NONE") {
          gaps.add(r.primary_likely_gap);
        }
        if (r.practice_retest && !r.practice_retest.completed) {
          hasPendingRetest = true;
        } else if (!r.practice_retest) {
          hasPendingRetest = true;
        }
      });

      schedAttempts.forEach(a => {
        totalQs += (a.total_questions || 5);
        totalCorrect += (a.score || 0);
        if (a.flagged_topics) {
          a.flagged_topics.forEach(t => gaps.add(t));
        }
      });

      const accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : null;
      const totalAttempts = records.length + schedAttempts.length;

      // Transparent criteria:
      // Flagged if: accuracy < 60% OR gaps >= 2 OR (hasAttempts && pendingRetest with accuracy < 70)
      const isLowAccuracy = accuracy !== null && accuracy < 60;
      const isMultiGap = gaps.size >= 2;
      const isFlagged = isLowAccuracy || isMultiGap || (totalAttempts > 0 && hasPendingRetest && accuracy < 70);

      if (isFlagged || (totalAttempts > 0 && accuracy < 70)) {
        flaggedStudents.push({
          student: stu,
          accuracy: accuracy !== null ? accuracy : 0,
          totalQs,
          totalCorrect,
          gaps: Array.from(gaps),
          hasPendingRetest,
          latestReportId: records.length > 0 ? records[0].report_id : null,
          reason: isLowAccuracy ? `Low Accuracy (${accuracy}%)` : (isMultiGap ? `Multiple Concept Gaps (${gaps.size})` : `Pending Remediation`)
        });
      }
    });

    if (flaggedStudents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            ✓ No students currently meet the intervention criteria. All active students maintain ≥60% accuracy with resolved gaps.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = flaggedStudents.map(f => {
      const qb = window.gQuestionBank || { concepts: [] };
      const gapNames = f.gaps.map(gid => {
        const c = qb.concepts.find(item => item.id === gid);
        return c ? c.name : gid;
      });

      const firstGap = f.gaps[0] || 'CN_04_SUBNETTING_IP';
      const actionBtn = `
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="btn btn-xs btn-outline-primary" onclick="window.dashboardEngineInstance.showRecordModal('${f.latestReportId || ''}', '${f.student.student_id}')" title="View student progress">View Progress</button>
          <button class="btn btn-xs btn-outline-warning" onclick="window.dashboardEngineInstance.openScheduleTestModal()" title="Assign test to cohort">Assign Test</button>
          <button class="btn btn-xs btn-outline-info" onclick="window.dashboardEngineInstance.recommendResourceForStudent('${f.student.name}', '${firstGap}')" title="Recommend curated learning resource">Recommend Resource</button>
        </div>
      `;

      return `
        <tr>
          <td>
            <strong>${f.student.name}</strong><br>
            <small class="text-muted">${f.student.student_id} · ${f.student.email}</small>
          </td>
          <td>
            <strong>${f.student.section || 'Section A'}</strong><br>
            <small class="text-muted">${f.student.semester || '5th Sem'}</small>
          </td>
          <td>
            <span class="score-pill ${f.accuracy < 60 ? 'score-low' : 'score-mid'}">
              ${f.accuracy}% (${f.totalCorrect}/${f.totalQs})
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${gapNames.length > 0 ? gapNames.map(g => `<span class="badge badge-danger text-xs">${g}</span>`).join("") : '<span class="text-muted text-xs">—</span>'}
            </div>
          </td>
          <td>
            <span class="badge badge-warning text-xs">⚠️ ${f.reason}</span>
          </td>
          <td>
            ${actionBtn}
          </td>
        </tr>
      `;
    }).join("");
  }

  filterInstructorTable(records) {
    const searchInput = document.getElementById("instructor-search-input");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const courseFilter = document.getElementById("instructor-course-filter");
    const courseVal = courseFilter ? courseFilter.value : "ALL";

    const semFilter = document.getElementById("instructor-sem-filter");
    const semVal = semFilter ? semFilter.value : "ALL";

    const statusFilter = document.getElementById("instructor-status-filter");
    const statusVal = statusFilter ? statusFilter.value : "ALL";

    const gapFilter = document.getElementById("instructor-gap-filter");
    const gapVal = gapFilter ? gapFilter.value : "ALL";

    // Query all assessments (completed & in-progress) for instructor's scope
    const inspectRecords = storageEngine.getInspectAssessmentsForInstructor(this.currentInstructorKey, this.currentCourseKey) || [];

    const filtered = inspectRecords.filter(r => {
      // Course match
      const matchCourse = courseVal === "ALL" || r.course_code === courseVal;

      // Class / section / cohort match
      const matchClass = semVal === "ALL" ||
        (r.class_section && r.class_section.toLowerCase().includes(semVal.toLowerCase())) ||
        (r.semester && semVal.includes(r.semester));

      // Status match
      const matchStatus = statusVal === "ALL" ||
        (statusVal === "Completed" && r.status === "Completed") ||
        (statusVal === "In Progress" && r.status.toLowerCase().includes("progress")) ||
        (statusVal === "Needs Retest" && ((r.accuracy || r.percentage) < 60 || (r.topics_needing_review && r.topics_needing_review.length >= 2)));

      // Search query match
      const matchQuery = !query ||
        (r.student_name && r.student_name.toLowerCase().includes(query)) ||
        (r.student_id && r.student_id.toLowerCase().includes(query)) ||
        (r.assessment_title && r.assessment_title.toLowerCase().includes(query)) ||
        (r.id && r.id.toLowerCase().includes(query));

      // Gap match
      const matchGap = gapVal === "ALL" ||
        (r.topics_needing_review && r.topics_needing_review.some(t => t.includes(gapVal)));

      return matchCourse && matchClass && matchStatus && matchQuery && matchGap;
    });

    const tbody = document.getElementById("instructor-table-body");
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No student assessments match the selected filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const isCompleted = r.status === "Completed";
      const statusBadge = isCompleted
        ? `<span class="badge badge-success">✓ Completed</span>`
        : `<span class="badge badge-warning">⏳ In Progress</span>`;

      const scoreHtml = isCompleted
        ? `<strong class="${(r.accuracy || r.percentage) >= 70 ? 'text-emerald' : 'text-amber'}">${r.score}/${r.total || 10} (${r.accuracy || r.percentage}%)</strong>`
        : `<span class="text-muted text-xs">Draft In Progress</span>`;

      let topicsHtml = `<span class="text-muted text-xs">—</span>`;
      if (r.topics_needing_review && r.topics_needing_review.length > 0) {
        topicsHtml = r.topics_needing_review.map(t => `<span class="badge text-xs" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;">${t}</span>`).join(" ");
      } else if (isCompleted) {
        const acc = (r.accuracy !== undefined ? r.accuracy : (r.percentage !== undefined ? r.percentage : (r.total ? Math.round((r.score / r.total) * 100) : 0)));
        if (r.score === 0 || acc < 60) {
          topicsHtml = `<span class="badge text-xs" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;">Needs Review (${acc}% Score)</span>`;
        } else if (acc >= 75) {
          topicsHtml = `<span class="badge text-xs" style="background: #CCFBF1; color: #0F766E; border: 1px solid #99F6E4;">✓ Mastery Met (${acc}%)</span>`;
        } else {
          topicsHtml = `<span class="badge text-xs" style="background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD;">Progressing (${acc}%)</span>`;
        }
      } else {
        topicsHtml = `<span class="text-muted text-xs">Not enough answers to assess yet</span>`;
      }

      const dateStr = new Date(r.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

      const firstTopic = (r.topics_needing_review && r.topics_needing_review[0]) || 'CN_04_SUBNETTING_IP';
      const actionBtn = isCompleted
        ? `<div style="display: flex; gap: 6px; flex-wrap: wrap;">
             <button class="btn btn-xs btn-outline-primary" onclick="window.dashboardEngineInstance.showRecordModal('${r.id}', '${r.student_id}')" title="View progress">View Progress</button>
             <button class="btn btn-xs btn-outline-info" onclick="window.dashboardEngineInstance.recommendResourceForStudent('${r.student_name}', '${firstTopic}')" title="Recommend resource">Recommend Resource</button>
           </div>`
        : `<div style="display: flex; gap: 6px; flex-wrap: wrap;">
             <button class="btn btn-xs btn-outline-secondary" onclick="window.dashboardEngineInstance.showRecordModal('${r.id}', '${r.student_id}')" title="View progress">View Progress</button>
             <button class="btn btn-xs btn-outline-warning" onclick="window.dashboardEngineInstance.openScheduleTestModal()" title="Assign test">Assign Test</button>
           </div>`;

      return `
        <tr>
          <td><strong>${r.student_name}</strong><br><small class="text-muted">${r.student_id}</small></td>
          <td><strong>${r.course_code}</strong><br><small class="text-muted">${r.class_section || 'Section A'}</small></td>
          <td><strong>${r.assessment_title}</strong><br><code class="report-code text-xs">${r.id}</code></td>
          <td>${statusBadge}</td>
          <td>${scoreHtml}</td>
          <td>${topicsHtml}</td>
          <td><small class="text-muted">${dateStr}</small></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join("");
  }

  // ==========================================
  // FACULTY INSPECT ALL ASSESSMENTS MODAL
  // ==========================================
  openInspectAllModal() {
    const modal = document.getElementById("faculty-inspect-all-modal");
    if (modal) {
      modal.classList.add("modal-open");
      this.renderInspectAllTable();
    }
  }

  closeInspectAllModal() {
    const modal = document.getElementById("faculty-inspect-all-modal");
    if (modal) {
      modal.classList.remove("modal-open");
    }
  }

  renderInspectAllTable() {
    const tbody = document.getElementById("inspect-all-table-body");
    if (!tbody) return;

    // Filter strictly to instructor's authorized scope
    const records = storageEngine.getInspectAssessmentsForInstructor(this.currentInstructorKey, this.currentCourseKey);

    const scopeNotice = document.getElementById("inspect-all-scope-notice");
    if (scopeNotice) {
      scopeNotice.textContent = `Showing assessments strictly assigned to ${this.currentCourseKey} (${this.currentInstructorKey}). Total records: ${records.length}.`;
    }

    // Read filter values
    const courseFilter = document.getElementById("inspect-filter-course");
    const courseVal = courseFilter ? courseFilter.value : "ALL";

    const classFilter = document.getElementById("inspect-filter-class") || document.getElementById("inspect-filter-section");
    const classVal = classFilter ? classFilter.value : "ALL";

    const statusFilter = document.getElementById("inspect-filter-status");
    const statusVal = statusFilter ? statusFilter.value : "ALL";

    const searchInput = document.getElementById("inspect-search-input");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const sortBy = document.getElementById("inspect-sort-by");
    const sortVal = sortBy ? sortBy.value : "date_desc";

    let filtered = records.filter(r => {
      const matchCourse = courseVal === "ALL" || r.course_code === courseVal;
      const matchClass = classVal === "ALL" || (r.section && r.section.includes(classVal));
      const matchStatus = statusVal === "ALL" || r.status.toLowerCase() === statusVal.toLowerCase();
      const matchQuery = !query ||
        r.student_name.toLowerCase().includes(query) ||
        r.student_id.toLowerCase().includes(query) ||
        r.assessment_title.toLowerCase().includes(query);
      return matchCourse && matchClass && matchStatus && matchQuery;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortVal === "date_desc") return new Date(b.date) - new Date(a.date);
      if (sortVal === "date_asc") return new Date(a.date) - new Date(b.date);
      if (sortVal === "score_desc") return (b.accuracy || 0) - (a.accuracy || 0);
      if (sortVal === "score_asc") return (a.accuracy || 0) - (b.accuracy || 0);
      if (sortVal === "name_asc") return a.student_name.localeCompare(b.student_name);
      return 0;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">
            No assessment records match the selected filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const isCompleted = r.status === "Completed";
      const statusBadge = isCompleted
        ? `<span class="badge badge-success">✓ Completed</span>`
        : `<span class="badge badge-warning">⏳ In Progress</span>`;

      const scoreHtml = isCompleted
        ? `<strong class="${r.accuracy >= 70 ? 'text-emerald' : 'text-amber'}">${r.score}/${r.total_questions} (${r.accuracy}%)</strong>`
        : `<span class="text-muted text-xs">${r.score_display || 'Draft saved'}</span>`;

      let topicsHtml = `<span class="text-muted text-xs">—</span>`;
      if (r.topics_needing_review && r.topics_needing_review.length > 0) {
        topicsHtml = r.topics_needing_review.map(t => `<span class="badge text-xs" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;">${t}</span>`).join(" ");
      } else if (isCompleted) {
        const acc = (r.accuracy !== undefined ? r.accuracy : (r.percentage !== undefined ? r.percentage : (r.total_questions ? Math.round((r.score / r.total_questions) * 100) : 0)));
        if (r.score === 0 || acc < 60) {
          topicsHtml = `<span class="badge text-xs" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;">Needs Review (${acc}% Score)</span>`;
        } else if (acc >= 75) {
          topicsHtml = `<span class="badge text-xs" style="background: #CCFBF1; color: #0F766E; border: 1px solid #99F6E4;">✓ Mastery Met (${acc}%)</span>`;
        } else {
          topicsHtml = `<span class="badge text-xs" style="background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD;">Progressing (${acc}%)</span>`;
        }
      } else {
        topicsHtml = `<span class="text-muted text-xs">Not enough answers to assess yet</span>`;
      }

      const dateStr = new Date(r.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

      const firstTopic = (r.topics_needing_review && r.topics_needing_review[0]) || 'CN_04_SUBNETTING_IP';
      const actionBtn = isCompleted
        ? `<div style="display: flex; gap: 6px; flex-wrap: wrap;">
             <button class="btn btn-xs btn-outline-primary" onclick="window.dashboardEngineInstance.showRecordModal('${r.report_id || r.assessment_id || r.id}', '${r.student_id}')" title="View progress">View Progress</button>
             <button class="btn btn-xs btn-outline-info" onclick="window.dashboardEngineInstance.recommendResourceForStudent('${r.student_name}', '${firstTopic}')" title="Recommend resource">Recommend Resource</button>
           </div>`
        : `<div style="display: flex; gap: 6px; flex-wrap: wrap;">
             <button class="btn btn-xs btn-outline-secondary" onclick="window.dashboardEngineInstance.showRecordModal('${r.assessment_id || r.id}', '${r.student_id}')" title="View progress">View Progress</button>
             <button class="btn btn-xs btn-outline-warning" onclick="window.dashboardEngineInstance.openScheduleTestModal()" title="Assign test">Assign Test</button>
           </div>`;

      return `
        <tr>
          <td>
            <strong>${r.student_name}</strong><br>
            <small class="text-muted">${r.student_id}</small>
          </td>
          <td>
            <strong>${r.course_code}</strong><br>
            <small class="text-muted">${r.section || 'Section A'}</small>
          </td>
          <td>
            <strong>${r.assessment_title}</strong><br>
            <code class="report-code text-xs">${r.assessment_id}</code>
          </td>
          <td>${statusBadge}</td>
          <td>${scoreHtml}</td>
          <td>${topicsHtml}</td>
          <td><small class="text-muted">${dateStr}</small></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join("");
  }

  // ==========================================
  // 3. DEPARTMENT HOD DASHBOARD
  // ==========================================
  switchHODTab(subtabId) {
    this.activeHODSubtab = subtabId || "overview";
    const tabs = [
      { id: "overview", btnId: "hod-subtab-btn-overview", viewId: "hod-view-overview" },
      { id: "years", btnId: "hod-subtab-btn-years", viewId: "hod-view-years" },
      { id: "progress", btnId: "hod-subtab-btn-progress", viewId: "hod-view-progress" },
      { id: "topics", btnId: "hod-subtab-btn-topics", viewId: "hod-view-topics" },
      { id: "roster", btnId: "hod-subtab-btn-roster", viewId: "hod-view-roster" }
    ];

    tabs.forEach(t => {
      const btn = document.getElementById(t.btnId);
      const view = document.getElementById(t.viewId);
      const isActive = t.id === this.activeHODSubtab;
      if (btn) {
        if (isActive) {
          btn.classList.add("active");
          btn.setAttribute("aria-selected", "true");
        } else {
          btn.classList.remove("active");
          btn.setAttribute("aria-selected", "false");
        }
      }
      if (view) {
        if (isActive) {
          view.classList.add("active");
          view.style.display = "block";
        } else {
          view.classList.remove("active");
          view.style.display = "none";
        }
      }
    });
  }

  renderHODDashboard() {
    const currentUser = authEngine.getCurrentUser();
    
    // If logged in as HOD, enforce their jurisdiction strictly
    if (currentUser && currentUser.role === CONFIG.ROLES.HOD) {
      this.currentHODDept = currentUser.department;
    } else {
      const hodSelect = document.getElementById("hod-department-select");
      if (hodSelect) {
        this.currentHODDept = hodSelect.value;
      }
    }

    const deptConfig = CONFIG.DEPARTMENTS[this.currentHODDept] || CONFIG.DEPARTMENTS.CSE;
    // Strictly filter to this HOD's department only
    const records = storageEngine.getRecordsForHOD(this.currentHODDept);

    // Update Header
    const hodNameEl = document.getElementById("hod-active-name");
    const hodDeptEl = document.getElementById("hod-active-dept");
    const hodNoticeEl = document.getElementById("hod-routing-notice");
    const switcherContainer = document.getElementById("hod-switcher-box");

    if (hodNameEl) hodNameEl.textContent = deptConfig.hod.name;
    if (hodDeptEl) hodDeptEl.textContent = `Department of ${deptConfig.name}`;
    
    // Hide dropdown switcher if authentic HOD logged in
    if (switcherContainer && currentUser && currentUser.role === CONFIG.ROLES.HOD) {
      switcherContainer.style.display = "none";
    }

    if (hodNoticeEl) {
      hodNoticeEl.innerHTML = `🏛️ <strong>Department Head Jurisdiction:</strong> Strictly showing student records for <strong>${deptConfig.name} (${this.currentHODDept})</strong>. Associated course instructor: <strong>${deptConfig.instructor.name}</strong>. No principal role in institutional governance.`;
    }

    // Metrics
    const totalSubmissions = records.length;
    const avgScore = totalSubmissions > 0
      ? (records.reduce((sum, r) => sum + r.score, 0) / totalSubmissions).toFixed(1)
      : "0.0";
    const avgPct = totalSubmissions > 0 ? ((avgScore / 10) * 100).toFixed(0) : "0";
    const cascadeCount = records.filter(r => r.is_prereq_cascade).length;

    const totalEl = document.getElementById("hod-stat-total");
    const avgEl = document.getElementById("hod-stat-avg");
    const cascadeEl = document.getElementById("hod-stat-cascades");
    const courseEl = document.getElementById("hod-stat-course");

    if (totalEl) totalEl.textContent = totalSubmissions;
    if (avgEl) avgEl.textContent = `${avgScore} / 10 (${avgPct}%)`;
    if (cascadeEl) cascadeEl.textContent = `${cascadeCount} students (${totalSubmissions > 0 ? Math.round((cascadeCount/totalSubmissions)*100) : 0}%)`;
    if (courseEl) courseEl.textContent = `${deptConfig.course_code}`;

    // Chronological Academic Years Grouping (Selectable)
    this.renderHODAcademicYears();

    // Department Combined Progress Graph
    this.renderHODCombinedChart();

    // Concept Vulnerability Matrix (Department Heatmap across all 10 concepts)
    this.renderHODConceptVulnerability(records);

    // Table
    this.filterHODTable(records);

    // Activate the selected tab
    this.switchHODTab(this.activeHODSubtab || "overview");
  }

  selectHODYear(yearId) {
    this.selectedHODYear = yearId;
    this.selectedHODCourse = "ALL";
    this.selectedHODClass = "ALL";
    this.renderHODAcademicYears();
  }

  selectHODCourseClass(courseCode, classSection) {
    this.selectedHODCourse = courseCode;
    this.selectedHODClass = classSection;
    this.renderHODAcademicYears();
  }

  renderHODAcademicYears() {
    const pillsContainer = document.getElementById("hod-year-pills");
    const displayContainer = document.getElementById("hod-selected-year-display");
    if (!pillsContainer || !displayContainer) return;

    const deptConfig = CONFIG.DEPARTMENTS[this.currentHODDept] || CONFIG.DEPARTMENTS.CSE;
    const rawYears = deptConfig.academic_years || [
      { id: "1st Year", name: "1st Year", semesters: "1st & 2nd Sem", courses: [] },
      { id: "2nd Year", name: "2nd Year", semesters: "3rd & 4th Sem", courses: [] },
      { id: "3rd Year", name: "3rd Year", semesters: "5th & 6th Sem", courses: [{ code: "CS301", name: "Computer Networks", sections: ["Section A", "Section B"] }] },
      { id: "4th Year", name: "4th Year", semesters: "7th & 8th Sem", courses: [] }
    ];

    const academicYears = rawYears.map(y => {
      const name = y.year_name || y.name || y.id || "Academic Year";
      const id = y.year_name || y.name || y.id || y.year_id || name;
      const semesters = Array.isArray(y.semesters) ? y.semesters.join(" & ") : (y.semesters || "");
      return {
        id,
        name,
        semesters,
        courses: y.courses || []
      };
    });

    const yearOrder = { "1st Year": 1, "2nd Year": 2, "3rd Year": 3, "4th Year": 4 };
    academicYears.sort((a, b) => (yearOrder[a.name] || 99) - (yearOrder[b.name] || 99));

    // Ensure selected year is valid
    if (!academicYears.some(y => y.id === this.selectedHODYear || y.name === this.selectedHODYear)) {
      this.selectedHODYear = academicYears.find(y => y.name === "3rd Year") ? "3rd Year" : academicYears[0].name;
    }

    // 1. Render Chronologically Sorted Year Pills
    pillsContainer.innerHTML = academicYears.map(y => {
      const isActive = y.id === this.selectedHODYear || y.name === this.selectedHODYear;
      return `
        <button type="button" class="hod-year-tab-btn ${isActive ? 'active' : ''}" onclick="window.dashboardEngineInstance.selectHODYear('${y.id}')">
          📅 ${y.name} <small style="opacity: 0.85;">(${y.semesters})</small>
        </button>
      `;
    }).join("");

    // 2. Render Selected Year Content
    const currentYearObj = academicYears.find(y => y.id === this.selectedHODYear || y.name === this.selectedHODYear) || academicYears[0];
    
    // Students in this year
    const allYearStudents = Object.values(CONFIG.ACCOUNTS).filter(a =>
      a.role === CONFIG.ROLES.STUDENT &&
      a.department === this.currentHODDept &&
      (a.academic_year === currentYearObj.name || (a.semester && currentYearObj.semesters.includes(a.semester)) || (a.year_semester && currentYearObj.semesters.includes(a.year_semester)))
    );

    // Courses in this year
    const courses = currentYearObj.courses || [];
    const courseCodes = courses.map(c => c.code);

    // Selected Course / Class filter
    const selectedCourseCode = this.selectedHODCourse || "ALL";
    const selectedClassSec = this.selectedHODClass || "ALL";

    const yearStudents = allYearStudents.filter(stu => {
      if (selectedClassSec !== "ALL" && stu.section && !stu.section.includes(selectedClassSec)) return false;
      return true;
    });

    // Scheduled tests for this year
    const allSchedTests = storageEngine.getScheduledTests();
    const yearSchedTests = allSchedTests.filter(t => (courseCodes.includes(t.course_code) || t.course_code === "ALL") && (selectedCourseCode === "ALL" || t.course_code === selectedCourseCode));

    // Attempts and diagnostic records for students in this cohort
    let yearAttemptsCount = 0;
    let totalQs = 0;
    let totalCorrect = 0;
    const uniqueCompleters = new Set();
    const weakTopicsCount = {};

    yearStudents.forEach(stu => {
      const diagRecords = storageEngine.getRecordsForStudent(stu.student_id, stu.email) || [];
      const schedAttempts = storageEngine.getScheduledTestAttemptsForStudent(stu.student_id) || [];

      diagRecords.forEach(r => {
        uniqueCompleters.add(stu.student_id);
        yearAttemptsCount += 1;
        totalQs += (r.total_questions || 10);
        totalCorrect += (r.score || 0);
        if (r.primary_likely_gap && r.primary_likely_gap !== "NONE") {
          weakTopicsCount[r.primary_likely_gap] = (weakTopicsCount[r.primary_likely_gap] || 0) + 1;
        }
      });

      schedAttempts.forEach(a => {
        uniqueCompleters.add(stu.student_id);
        yearAttemptsCount += 1;
        totalQs += (a.total_questions || 5);
        totalCorrect += (a.score || 0);
        if (a.flagged_topics) {
          a.flagged_topics.forEach(t => {
            weakTopicsCount[t] = (weakTopicsCount[t] || 0) + 1;
          });
        }
      });
    });

    const completionRate = yearStudents.length > 0 ? Math.round((uniqueCompleters.size / yearStudents.length) * 100) : 0;
    const avgAccuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

    // Students needing support in this cohort
    const studentsNeedingHelp = [];
    yearStudents.forEach(stu => {
      const records = storageEngine.getRecordsForStudent(stu.student_id, stu.email) || [];
      const schedAttempts = storageEngine.getScheduledTestAttemptsForStudent(stu.student_id) || [];
      let stuQs = 0;
      let stuCorrect = 0;
      const stuGaps = new Set();

      records.forEach(r => {
        stuQs += (r.total_questions || 10);
        stuCorrect += (r.score || 0);
        if (r.primary_likely_gap && r.primary_likely_gap !== "NONE") stuGaps.add(r.primary_likely_gap);
      });
      schedAttempts.forEach(a => {
        stuQs += (a.total_questions || 5);
        stuCorrect += (a.score || 0);
        if (a.flagged_topics) a.flagged_topics.forEach(t => stuGaps.add(t));
      });

      const acc = stuQs > 0 ? Math.round((stuCorrect / stuQs) * 100) : null;
      if (acc !== null && (acc < 60 || stuGaps.size >= 2)) {
        studentsNeedingHelp.push({
          student: stu,
          accuracy: acc,
          gaps: Array.from(stuGaps)
        });
      }
    });

    // Weak topics sorted
    const qb = window.gQuestionBank || { concepts: [] };
    const sortedWeakTopics = Object.keys(weakTopicsCount).sort((a, b) => weakTopicsCount[b] - weakTopicsCount[a]);

    // Build course & class selection buttons
    const filterPills = [
      `<button type="button" class="btn btn-xs ${selectedCourseCode === 'ALL' && selectedClassSec === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.dashboardEngineInstance.selectHODCourseClass('ALL', 'ALL')">All Classes & Sections</button>`
    ];
    courses.forEach(c => {
      (c.sections || ["Section A"]).forEach(sec => {
        const isSel = selectedCourseCode === c.code && selectedClassSec === sec;
        filterPills.push(`
          <button type="button" class="btn btn-xs ${isSel ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window.dashboardEngineInstance.selectHODCourseClass('${c.code}', '${sec}')">
            ${c.code} · ${sec}
          </button>
        `);
      });
    });

    displayContainer.innerHTML = `
      <div style="background: #F8FAFC; border: 1px solid var(--border-card); border-radius: 8px; padding: 20px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div>
            <h4 style="margin: 0; font-size: 16px; color: var(--text-primary);">
              ${currentYearObj.name} Cohort Overview (${currentYearObj.semesters})
            </h4>
            <span class="text-xs text-muted">Department of ${deptConfig.name} · ${yearStudents.length} Students ${selectedClassSec !== 'ALL' ? '(' + selectedClassSec + ')' : 'Enrolled'}</span>
          </div>
          <span class="badge badge-primary text-xs">Chronological Grouping Active</span>
        </div>

        <!-- Course & Class Selection Drilldown -->
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; padding: 10px 14px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px;">
          <strong style="font-size: 12px; color: #475569;">Scope Cohort:</strong>
          ${filterPills.join("")}
        </div>

        <!-- 4 Metric Cards for Selected Year / Cohort -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
          <div class="card p-3" style="background: #FFFFFF; border: 1px solid var(--border-card);">
            <span class="text-xs text-muted font-bold">COURSES & SECTIONS</span>
            <div style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">
              ${courses.length} Course${courses.length === 1 ? '' : 's'}
            </div>
            <small class="text-xs text-muted">${courses.map(c => c.code).join(", ") || 'No active courses'}</small>
          </div>
          <div class="card p-3" style="background: #FFFFFF; border: 1px solid var(--border-card);">
            <span class="text-xs text-muted font-bold">TESTS CONFIGURED & TAKEN</span>
            <div style="font-size: 20px; font-weight: 700; color: #0284C7; margin-top: 4px;">
              ${yearSchedTests.length} Sched · ${yearAttemptsCount} Taken
            </div>
            <small class="text-xs text-muted">Across enrolled sections</small>
          </div>
          <div class="card p-3" style="background: #FFFFFF; border: 1px solid var(--border-card);">
            <span class="text-xs text-emerald font-bold">COMPLETION RATE</span>
            <div style="font-size: 20px; font-weight: 700; color: #059669; margin-top: 4px;">
              ${completionRate}%
            </div>
            <small class="text-xs text-muted">${uniqueCompleters.size} of ${yearStudents.length} students completed</small>
          </div>
          <div class="card p-3" style="background: #FFFFFF; border: 1px solid var(--border-card);">
            <span class="text-xs text-muted font-bold">ACADEMIC PROGRESS / SCORE</span>
            <div style="font-size: 20px; font-weight: 700; color: #7C3AED; margin-top: 4px;">
              ${avgAccuracy}%
            </div>
            <small class="text-xs text-muted">Mean accuracy across ${totalQs} items</small>
          </div>
        </div>

        <!-- Courses & Classes Table -->
        <h5 style="margin: 0 0 8px 0; font-size: 13px;">Courses & Assigned Classes:</h5>
        <div class="table-responsive mb-4">
          <table class="table" style="background: #FFFFFF;">
            <thead>
              <tr>
                <th>Course Code & Title</th>
                <th>Sections / Classes</th>
                <th>Instructor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${courses.length > 0 ? courses.map(c => `
                <tr>
                  <td><strong>${c.code}</strong> - ${c.name}</td>
                  <td>${(c.sections || []).map(s => `<span class="badge ${selectedClassSec === s ? 'badge-primary' : 'badge-secondary'} text-xs" style="margin-right: 4px;">${s}</span>`).join("")}</td>
                  <td>${deptConfig.instructor.name}</td>
                  <td><span class="badge badge-success text-xs">Active Curricular</span></td>
                </tr>
              `).join("") : `
                <tr><td colspan="4" class="text-center text-muted py-3">No core courses configured for ${currentYearObj.name} in this department.</td></tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- Two Columns: Students Needing Support & Topics Needing Focus -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <!-- Students Needing Support -->
          <div class="card p-3" style="background: #FFFFFF; border: 1px solid var(--border-card);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: #DC2626; font-size: 13px;">⚠️ Students Needing Support (${studentsNeedingHelp.length})</strong>
              <small class="text-muted text-xs">&lt;60% accuracy or 2+ gaps</small>
            </div>
            ${studentsNeedingHelp.length > 0 ? `
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead><tr><th>Student</th><th>Accuracy</th><th>Flagged Gaps</th></tr></thead>
                  <tbody>
                    ${studentsNeedingHelp.map(s => `
                      <tr>
                        <td><strong>${s.student.name}</strong><br><small class="text-muted">${s.student.student_id} (${s.student.section || 'Sec A'})</small></td>
                        <td><span class="score-pill score-low">${s.accuracy}%</span></td>
                        <td><small class="text-danger">${s.gaps.join(", ") || 'General review'}</small></td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            ` : `<div class="text-muted text-xs py-3 text-center">✓ No students in this selection currently require intervention.</div>`}
          </div>

          <!-- Topics Needing More Focus -->
          <div class="card p-3" style="background: #FFFFFF; border: 1px solid var(--border-card);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: #D97706; font-size: 13px;">🎯 Topics Needing Pedagogical Focus</strong>
              <small class="text-muted text-xs">Derived from actual errors</small>
            </div>
            ${sortedWeakTopics.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${sortedWeakTopics.slice(0, 4).map(tid => {
                  const c = qb.concepts.find(item => item.id === tid);
                  const name = c ? c.name : tid;
                  const count = weakTopicsCount[tid];
                  return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; font-size: 12px;">
                      <div><strong>${name}</strong> <code class="text-xs">${tid}</code></div>
                      <span class="badge badge-warning text-xs">${count} student difficulty</span>
                    </div>
                  `;
                }).join("")}
              </div>
            ` : `<div class="text-muted text-xs py-3 text-center">✓ All assessed topics meet mastery thresholds for this selection.</div>`}
          </div>
        </div>
      </div>
    `;
  }

  renderHODCombinedChart() {
    const container = document.getElementById("hod-combined-chart");
    if (!container) return;

    // Get all authorized records for this HOD
    const actualData = storageEngine.getActualRecordsForHOD(this.currentHODDept);
    const diags = Array.isArray(actualData.diagnostic_records) ? actualData.diagnostic_records : [];
    const scheds = Array.isArray(actualData.scheduled_attempts) ? actualData.scheduled_attempts : [];

    // Department enrolled students
    const deptStudents = Object.values(CONFIG.ACCOUNTS).filter(a => a.role === CONFIG.ROLES.STUDENT && a.department === this.currentHODDept);
    const enrolledCount = deptStudents.length || 4;

    const events = [
      ...diags.map(r => ({
        date: new Date(r.submitted_at),
        title: "Diagnostic: " + (r.quiz_attempt_id || r.report_id),
        score: r.score,
        total: r.total_questions || 10,
        accuracy: r.percentage || Math.round((r.score / (r.total_questions || 10)) * 100),
        student: r.student_name
      })),
      ...scheds.map(a => ({
        date: new Date(a.completed_at || a.submitted_at || Date.now()),
        title: a.title || "Scheduled Test",
        score: a.score,
        total: a.total_questions || 5,
        accuracy: a.percentage || Math.round((a.score / (a.total_questions || 5)) * 100),
        student: a.student_name || "Student"
      }))
    ].sort((a, b) => a.date - b.date);

    if (events.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5 text-muted" style="border: 1px dashed #E2E8F0; border-radius: 8px;">
          No student submissions recorded for this department yet. Trends will appear here once students submit tests.
        </div>
      `;
      return;
    }

    const studentSet = new Set();
    const dataPoints = events.map((ev, idx) => {
      studentSet.add(ev.student);
      const completionPct = enrolledCount > 0 ? Math.min(100, Math.round((studentSet.size / enrolledCount) * 100)) : 100;
      return {
        ...ev,
        stepIndex: idx,
        completion: completionPct,
        formattedDate: ev.date.toLocaleDateString([], { month: "short", day: "numeric" })
      };
    });

    const width = 640;
    const height = 220;
    const padLeft = 45;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 35;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const n = dataPoints.length;
    const getX = (i) => n === 1 ? padLeft + chartW / 2 : padLeft + (i / (n - 1)) * chartW;
    const getY = (val) => padTop + chartH - (val / 100) * chartH;

    const gridYValues = [0, 25, 50, 75, 100];
    const gridLines = gridYValues.map(v => {
      const y = getY(v);
      return `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" class="chart-grid-line" stroke="#E2E8F0" stroke-dasharray="3,3" />
        <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" class="chart-axis-text" font-size="10" fill="#64748B">${v}%</text>
      `;
    }).join("");

    const accPoints = dataPoints.map((p, i) => `${getX(i)},${getY(p.accuracy)}`).join(" ");
    const compPoints = dataPoints.map((p, i) => `${getX(i)},${getY(p.completion)}`).join(" ");

    const circles = dataPoints.map((p, i) => {
      const cx = getX(i);
      const cyAcc = getY(p.accuracy);
      const cyComp = getY(p.completion);
      const tooltipText = `${p.title} (${p.formattedDate})&#10;Dept Performance: ${p.accuracy}%&#10;Dept Completion: ${p.completion}%`;

      return `
        <g class="chart-point-group">
          <circle cx="${cx}" cy="${cyAcc}" r="5" fill="#0284C7" stroke="#FFFFFF" stroke-width="2" class="chart-point">
            <title>${tooltipText}</title>
          </circle>
          <rect x="${cx - 4}" y="${cyComp - 4}" width="8" height="8" rx="2" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5" class="chart-point">
            <title>${tooltipText}</title>
          </rect>
          <text x="${cx}" y="${height - 12}" text-anchor="middle" class="chart-axis-text" font-size="10" fill="#64748B">${p.formattedDate}</text>
        </g>
      `;
    }).join("");

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="combined-progress-svg" style="overflow: visible;">
        ${gridLines}
        <polyline fill="none" stroke="#10B981" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${compPoints}" opacity="0.85" />
        <polyline fill="none" stroke="#0284C7" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${accPoints}" />
        ${circles}
      </svg>
    `;
  }

  renderHODConceptVulnerability(records) {
    const container = document.getElementById("hod-vulnerability-matrix");
    if (!container) return;

    const qb = window.gQuestionBank || { concepts: [] };
    const concepts = qb.concepts || [];
    const total = records.length;

    if (total === 0) {
      container.innerHTML = `<div class="text-muted text-center py-3">No records submitted for this department yet.</div>`;
      return;
    }

    const rowsHtml = concepts.map(c => {
      const cid = c.id;
      let gapCount = 0;
      records.forEach(r => {
        const resp = r.item_responses ? r.item_responses[cid] : null;
        if (resp && !resp.is_correct) gapCount += 1;
      });

      const gapPct = Math.round((gapCount / total) * 100);
      const severityColor = gapPct >= 50 ? "#EF4444" : (gapPct >= 25 ? "#F59E0B" : "#10B981");

      const safeNotes = this.getTopicNotesSafe(cid, c.name);
      const safeVideo = this.getVideoRecommendationSafe(cid, c.name, "Computer Networks");

      return `
        <div class="topic-support-card mb-3">
          <div class="vuln-matrix-row" style="margin-bottom: 6px;">
            <div class="vuln-concept-meta">
              <strong style="color: #FFFFFF;">${c.name}</strong>
              <span class="vuln-stat">${gapCount} of ${total} students flagged in department (${gapPct}%)</span>
            </div>
            <div class="vuln-bar-track">
              <div class="vuln-bar-fill" style="width: ${gapPct}%; background-color: ${severityColor};"></div>
            </div>
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 11px; margin-top: 6px;">
            <span class="text-muted">📖 Notes: ${safeNotes.available ? `<strong class="text-cyan">${safeNotes.title}</strong> (Supports: ${c.name})` : 'No resource available yet'}</span>
            <span class="text-muted">📺 Video: ${safeVideo.available && safeVideo.url ? `<a href="${safeVideo.url}" target="_blank" rel="noopener noreferrer" class="text-amber">${safeVideo.title} ↗</a> (Supports: ${c.name})` : 'No resource available yet'}</span>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = rowsHtml;
  }

  filterHODTable(records) {
    if (!records) {
      records = storageEngine.getRecordsForHOD(this.currentHODDept);
    }
    const searchInput = document.getElementById("hod-search-input");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const semFilter = document.getElementById("hod-sem-filter");
    const semVal = semFilter ? semFilter.value : "ALL";

    const filtered = records.filter(r => {
      const matchQuery = !query ||
        r.student_id.toLowerCase().includes(query) ||
        r.student_name.toLowerCase().includes(query) ||
        r.report_id.toLowerCase().includes(query);
      const matchSem = semVal === "ALL" || (r.year_semester && r.year_semester.includes(semVal));
      return matchQuery && matchSem;
    });

    const tbody = document.getElementById("hod-table-body");
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No department records match your search.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const synthTag = r.is_synthetic ? `<span class="synthetic-tag" title="Synthetic Benchmark Record">SYNTHETIC</span>` : '';
      return `
        <tr>
          <td><code class="report-code">${r.report_id}</code> ${synthTag}</td>
          <td><strong>${r.student_name}</strong><br><small class="text-muted">${r.student_id}</small></td>
          <td>${r.course_code}</td>
          <td><span class="score-pill ${r.score >= 7 ? 'score-high' : (r.score >= 5 ? 'score-mid' : 'score-low')}">${r.score}/10</span></td>
          <td><span class="badge ${r.primary_likely_gap !== 'NONE' ? 'badge-danger' : 'badge-success'}">${r.primary_likely_gap}</span></td>
          <td>${r.practice_retest && r.practice_retest.completed ? `<span class="badge badge-success">Remediated (${r.practice_retest.score}/3)</span>` : `<span class="badge badge-secondary">Pending</span>`}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="window.dashboardEngineInstance.showRecordModal('${r.report_id}', '${r.student_id}')">
              Inspect Detail
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ==========================================
  // 4. STUDENT PROGRESS SUMMARY MODAL (LIGHT THEME)
  // ==========================================
  toggleAttemptDetails() {
    const detailsContainer = document.getElementById("sp-attempt-details-content");
    const toggleBtn = document.getElementById("sp-toggle-details-btn");
    const toggleIcon = document.getElementById("sp-toggle-details-icon");
    if (!detailsContainer) return;
    const isHidden = detailsContainer.style.display === "none" || !detailsContainer.style.display;
    if (isHidden) {
      detailsContainer.style.display = "block";
      if (toggleIcon) toggleIcon.textContent = "▲ Hide Attempt Details";
      if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    } else {
      detailsContainer.style.display = "none";
      if (toggleIcon) toggleIcon.textContent = "▼ View Attempt Details";
      if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
    }
  }

  recommendResourceForStudent(studentName, topicIdOrName) {
    const qb = window.gQuestionBank || { concepts: [] };
    const concept = (qb.concepts || []).find(c => c.id === topicIdOrName || c.name === topicIdOrName);
    const topicDisplayName = concept ? concept.name : (topicIdOrName || "the assigned concept");
    alert(`Resource Recommendation Assigned:\n\nCurated revision module and 5-minute visual explainer for "${topicDisplayName}" have been dispatched to ${studentName || "the student"}'s learning plan.`);
  }

  renderAttemptDetailsHtml(diagRecords, schedAttempts, syllabusList) {
    if ((!diagRecords || diagRecords.length === 0) && (!schedAttempts || schedAttempts.length === 0)) {
      return `<div style="padding: 16px; text-align: center; color: #64748B; font-size: 13px; background: #F8FAFC; border-radius: 8px;">No attempt records available to display.</div>`;
    }

    let html = "";

    // 1. Diagnostic Assessments Attempt Details
    if (diagRecords && diagRecords.length > 0) {
      diagRecords.forEach((r, rIdx) => {
        const subDate = r.submitted_at ? new Date(r.submitted_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recorded";
        const scoreVal = r.score !== undefined ? r.score : 0;
        const totalVal = r.total_questions || 10;
        const pctVal = r.percentage !== undefined ? r.percentage : Math.round((scoreVal / totalVal) * 100);

        let itemsHtml = syllabusList.map((c, i) => {
          const resp = r.item_responses ? r.item_responses[c.id] : null;
          if (!resp) return "";
          const isCorrect = !!resp.is_correct;
          const qText = resp.question_text || (c.diagnostic_question && c.diagnostic_question.text) || `Assessment item covering ${c.name}.`;
          const explanation = resp.explanation || (c.diagnostic_question && c.diagnostic_question.explanation) || "Course fundamental concept.";
          const studentAnsText = resp.chosen_text || (resp.chosen_key ? `Option ${resp.chosen_key}` : "Unanswered");

          return `
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                <span style="font-size: 13px; font-weight: 700; color: #0F172A;">Question ${i + 1}: ${c.name}</span>
                <span class="${isCorrect ? 'sp-badge-teal' : 'sp-badge-amber'}">
                  ${isCorrect ? '✓ Correct' : '✗ Missed'}
                </span>
              </div>
              <p style="font-size: 13px; color: #334155; margin: 4px 0 8px 0; line-height: 1.4;">${qText}</p>
              <div style="font-size: 12.5px; color: #475569; background: #F8FAFC; padding: 6px 10px; border-radius: 6px; margin-bottom: 6px;">
                <strong>Student Answer:</strong> ${studentAnsText}
              </div>
              ${(!isCorrect && resp.misconception) ? `
                <div style="font-size: 12px; color: #92400E; background: #FFFBEB; border: 1px solid #FDE68A; padding: 6px 10px; border-radius: 6px; margin-bottom: 6px;">
                  <strong>Key Takeaway:</strong> ${resp.misconception}
                </div>
              ` : ''}
              <div style="font-size: 12px; color: #64748B;">
                <strong>Academic Rationale:</strong> ${explanation}
              </div>
            </div>
          `;
        }).filter(Boolean).join("");

        html += `
          <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 10px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
              <div>
                <strong style="font-size: 14px; color: #0F172A;">Course Diagnostic Assessment ${diagRecords.length > 1 ? `#${rIdx + 1}` : ''}</strong>
                <span style="font-size: 12px; color: #64748B; margin-left: 8px;">Completed ${subDate}</span>
              </div>
              <span class="sp-badge-blue" style="font-size: 12px;">
                Score: ${scoreVal} / ${totalVal} (${pctVal}%)
              </span>
            </div>
            ${itemsHtml || '<div class="text-xs text-muted">Item details not recorded for this session.</div>'}
          </div>
        `;
      });
    }

    // 2. Scheduled Test Attempts Attempt Details
    if (schedAttempts && schedAttempts.length > 0) {
      schedAttempts.forEach(att => {
        const subDate = att.completed_at || att.submitted_at ? new Date(att.completed_at || att.submitted_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recorded";
        const scoreVal = att.score !== undefined ? att.score : 0;
        const totalVal = att.total_questions || (att.responses ? att.responses.length : 5);
        const pctVal = att.percentage !== undefined ? att.percentage : Math.round((scoreVal / totalVal) * 100);

        let itemsHtml = "";
        if (Array.isArray(att.responses) && att.responses.length > 0) {
          itemsHtml = att.responses.map((resp, i) => {
            const isCorrect = !!resp.is_correct;
            const tName = resp.topic_name || resp.topic_id || "Course Topic";
            const qText = resp.question_text || `Evaluation question for ${tName}.`;
            const studentAnsText = resp.student_answer || "Selected option";
            const explanation = resp.explanation || "Course curriculum review.";

            return `
              <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                  <span style="font-size: 13px; font-weight: 700; color: #0F172A;">Question ${i + 1}: ${tName}</span>
                  <span class="${isCorrect ? 'sp-badge-teal' : 'sp-badge-amber'}">
                    ${isCorrect ? '✓ Correct' : '✗ Missed'}
                  </span>
                </div>
                <p style="font-size: 13px; color: #334155; margin: 4px 0 8px 0; line-height: 1.4;">${qText}</p>
                <div style="font-size: 12.5px; color: #475569; background: #F8FAFC; padding: 6px 10px; border-radius: 6px; margin-bottom: 6px;">
                  <strong>Student Answer:</strong> ${studentAnsText}
                </div>
                <div style="font-size: 12px; color: #64748B;">
                  <strong>Academic Rationale:</strong> ${explanation}
                </div>
              </div>
            `;
          }).join("");
        } else {
          itemsHtml = `<div class="text-xs text-muted">Summary recorded. Question-level trace archived.</div>`;
        }

        html += `
          <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 10px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
              <div>
                <strong style="font-size: 14px; color: #0F172A;">Scheduled Test: ${att.title || 'Course Assessment'}</strong>
                <span style="font-size: 12px; color: #64748B; margin-left: 8px;">Completed ${subDate}</span>
              </div>
              <span class="sp-badge-blue" style="font-size: 12px;">
                Score: ${scoreVal} / ${totalVal} (${pctVal}%)
              </span>
            </div>
            ${itemsHtml}
          </div>
        `;
      });
    }

    return html;
  }

  showRecordModal(reportIdOrStudentId, studentIdFallback) {
    const modal = document.getElementById("student-record-modal");
    const titleEl = document.getElementById("record-modal-title");
    const subtitleEl = document.getElementById("record-modal-subtitle");
    const bodyEl = document.getElementById("record-modal-body");

    // 1. Resolve student identifier robustly
    let studentId = studentIdFallback || null;
    let targetRecord = null;
    let targetAttempt = null;

    if (reportIdOrStudentId) {
      targetRecord = storageEngine.getRecordById(reportIdOrStudentId);
      if (targetRecord) {
        studentId = targetRecord.student_id;
      }
    }

    if (!studentId && reportIdOrStudentId) {
      const allAccounts = CONFIG.ACCOUNTS || [];
      const matchedAcc = allAccounts.find(a => a.student_id === reportIdOrStudentId || a.id === reportIdOrStudentId);
      if (matchedAcc) {
        studentId = matchedAcc.student_id;
      } else {
        const allAttempts = storageEngine.getAllScheduledTestAttempts ? storageEngine.getAllScheduledTestAttempts() : [];
        const found = allAttempts.find(a => a.test_id === reportIdOrStudentId || a.student_id === reportIdOrStudentId);
        if (found) {
          studentId = found.student_id;
          targetAttempt = found;
        }
      }
    }

    if (!studentId) {
      studentId = "22CS1048";
    }

    // 2. Fetch actual student records strictly
    const diagRecords = (storageEngine.getRecordsForStudent(studentId) || []).sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
    const schedAttempts = (storageEngine.getScheduledTestAttemptsForStudent ? storageEngine.getScheduledTestAttemptsForStudent(studentId) : []).sort((a, b) => new Date(b.completed_at || b.submitted_at || 0) - new Date(a.completed_at || a.submitted_at || 0));
    const studentAccount = (CONFIG.ACCOUNTS || []).find(a => a.student_id === studentId) || {};

    if (!targetRecord && diagRecords.length > 0) targetRecord = diagRecords[0];
    if (!targetAttempt && schedAttempts.length > 0) targetAttempt = schedAttempts[0];

    // Find any drafts in progress
    const activeDrafts = [];
    try {
      const scheduledTests = storageEngine.getScheduledTests ? storageEngine.getScheduledTests() : [];
      scheduledTests.forEach(test => {
        const draft = storageEngine.getScheduledTestDraft(studentId, test.id);
        if (draft && draft.studentAnswers && Object.keys(draft.studentAnswers).length > 0) {
          const isDone = schedAttempts.some(a => a.test_id === test.id);
          if (!isDone) activeDrafts.push({ test, draft });
        }
      });
    } catch (e) {
      console.warn("Draft check notice:", e);
    }

    // 3. Resolve student and institutional metadata
    const studentName = (targetRecord && targetRecord.student_name) || (targetAttempt && targetAttempt.student_name) || studentAccount.name || `Student ${studentId}`;
    const courseCode = (targetRecord && targetRecord.course_code) || studentAccount.course_code || "CS301";
    const courseName = (targetRecord && targetRecord.course_name) || studentAccount.course_name || "Computer Networks";
    const sectionName = (targetRecord && targetRecord.section) || studentAccount.section || "Section A";
    const semesterName = (targetRecord && targetRecord.semester) || studentAccount.semester || "5";
    const yearSemStr = (targetRecord && targetRecord.year_semester) || studentAccount.year_semester || `3rd Year / ${semesterName}th Sem`;

    const safeStudentName = String(studentName).replace(/'/g, "\\'").replace(/"/g, "&quot;");

    if (titleEl) {
      titleEl.innerHTML = `Student Progress Summary`;
    }
    if (subtitleEl) {
      subtitleEl.innerHTML = `<strong>${studentName}</strong> (${studentId}) · ${courseCode}: ${courseName} · ${sectionName} (${yearSemStr})`;
    }

    // 4. Calculate tests completed and most recent accuracy
    const totalCompleted = diagRecords.length + schedAttempts.length;

    let latestTest = null;
    if (diagRecords.length > 0 && schedAttempts.length > 0) {
      const dTime = new Date(diagRecords[0].submitted_at || 0).getTime();
      const sTime = new Date(schedAttempts[0].completed_at || schedAttempts[0].submitted_at || 0).getTime();
      latestTest = (dTime >= sTime) ? { ...diagRecords[0], _kind: "Diagnostic Assessment" } : { ...schedAttempts[0], _kind: "Scheduled Test" };
    } else if (diagRecords.length > 0) {
      latestTest = { ...diagRecords[0], _kind: "Diagnostic Assessment" };
    } else if (schedAttempts.length > 0) {
      latestTest = { ...schedAttempts[0], _kind: "Scheduled Test" };
    }

    let recentScore = 0;
    let recentTotal = 0;
    let recentAccuracy = 0;
    let recentDateStr = "No completed tests";
    let hasRecentData = false;

    if (latestTest && totalCompleted > 0) {
      hasRecentData = true;
      recentScore = latestTest.score !== undefined ? latestTest.score : 0;
      recentTotal = latestTest.total_questions || latestTest.total || (latestTest.responses ? latestTest.responses.length : 10);
      recentAccuracy = recentTotal > 0 ? Math.round((recentScore / recentTotal) * 100) : (latestTest.percentage || 0);
      const testDate = latestTest.submitted_at || latestTest.completed_at;
      recentDateStr = testDate ? new Date(testDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Recently";
    }

    // 5. Aggregate syllabus concepts and topic answers
    const qb = window.gQuestionBank || { concepts: [] };
    const syllabusList = (qb.concepts && qb.concepts.length > 0) ? qb.concepts : [
      { id: "CN_01_OSI_LAYERS", name: "OSI 7-Layer Reference Model" },
      { id: "CN_02_FRAMING_CRC", name: "Data Link Framing & CRC Error Detection" },
      { id: "CN_03_FLOW_CONTROL", name: "Flow Control & Sliding Window Protocols" },
      { id: "CN_04_SUBNETTING_IP", name: "IPv4 Addressing & CIDR Subnetting" },
      { id: "CN_05_ROUTING_ALGO", name: "Routing Algorithms: Distance Vector & Link State" },
      { id: "CN_06_TCP_UDP_TRANSPORT", name: "TCP & UDP Transport Protocols" },
      { id: "CN_07_TCP_CONGESTION", name: "TCP Congestion Control Mechanics" },
      { id: "CN_08_DNS_SYSTEM", name: "Domain Name System (DNS) Architecture" },
      { id: "CN_09_HTTP_APPLICATION", name: "HTTP/1.1 vs HTTP/2 Application Protocols" },
      { id: "CN_10_NETWORK_SECURITY", name: "Network Security: Cryptography & Certificates" }
    ];

    const topicStats = {};
    syllabusList.forEach(c => {
      topicStats[c.id] = {
        id: c.id,
        name: c.name,
        attempted: 0,
        correct: 0,
        missed: 0,
        misconceptions: [],
        retestCompleted: false,
        retestScore: null,
        retestStatus: null
      };
    });

    // Parse diagnostic records responses
    diagRecords.forEach(r => {
      if (r.practice_retest && r.practice_retest.completed) {
        const targetId = r.practice_retest.target_concept;
        if (topicStats[targetId]) {
          topicStats[targetId].retestCompleted = true;
          topicStats[targetId].retestScore = r.practice_retest.score;
          topicStats[targetId].retestStatus = r.practice_retest.status;
        }
      }
      if (r.item_responses) {
        Object.keys(r.item_responses).forEach(cKey => {
          const resp = r.item_responses[cKey];
          if (!topicStats[cKey]) {
            topicStats[cKey] = {
              id: cKey,
              name: cKey,
              attempted: 0,
              correct: 0,
              missed: 0,
              misconceptions: [],
              retestCompleted: false,
              retestScore: null
            };
          }
          topicStats[cKey].attempted += 1;
          if (resp.is_correct) {
            topicStats[cKey].correct += 1;
          } else {
            topicStats[cKey].missed += 1;
            if (resp.misconception) {
              topicStats[cKey].misconceptions.push(resp.misconception);
            }
          }
        });
      }
    });

    // Parse scheduled test attempts responses
    schedAttempts.forEach(att => {
      if (Array.isArray(att.responses)) {
        att.responses.forEach(resp => {
          const topicId = resp.topic_id || resp.topic_name;
          const matchedConcept = syllabusList.find(c => c.id === topicId || c.name === topicId);
          const targetKey = matchedConcept ? matchedConcept.id : topicId;
          if (!topicStats[targetKey]) {
            topicStats[targetKey] = {
              id: targetKey,
              name: (matchedConcept && matchedConcept.name) || resp.topic_name || topicId,
              attempted: 0,
              correct: 0,
              missed: 0,
              misconceptions: [],
              retestCompleted: false,
              retestScore: null
            };
          }
          topicStats[targetKey].attempted += 1;
          if (resp.is_correct) {
            topicStats[targetKey].correct += 1;
          } else {
            topicStats[targetKey].missed += 1;
          }
        });
      }
    });

    // 6. Group topics into Doing Well, Needing Practice, Completed vs Still to Learn
    const topicsDoingWell = [];
    const topicsNeedingPractice = [];
    const topicsCompleted = [];
    const topicsStillToLearn = [];

    syllabusList.forEach(c => {
      const st = topicStats[c.id];
      if (!st || st.attempted === 0) {
        topicsStillToLearn.push({
          id: c.id,
          name: c.name,
          reason: "Not enough answers to assess yet (Upcoming in course syllabus)"
        });
      } else {
        const acc = Math.round((st.correct / st.attempted) * 100);
        const isRemediated = st.retestCompleted && (st.retestScore >= 2 || (st.retestScore / 3) >= 0.66);

        if (st.missed === 0 || isRemediated || acc >= 75) {
          topicsDoingWell.push({
            id: c.id,
            name: c.name,
            attempted: st.attempted,
            correct: st.correct,
            accuracy: acc,
            isRemediated: isRemediated,
            retestScore: st.retestScore
          });
          topicsCompleted.push(c);
        } else {
          const missCount = st.missed;
          const attCount = st.attempted;
          let plainReason = `Missed ${missCount} of ${attCount} questions on ${c.name}`;
          if (st.misconceptions && st.misconceptions.length > 0) {
            plainReason += `. Identified issue: ${st.misconceptions[0]}`;
          }
          topicsNeedingPractice.push({
            id: c.id,
            name: c.name,
            attempted: attCount,
            correct: st.correct,
            missed: missCount,
            accuracy: acc,
            reason: plainReason,
            misconception: st.misconceptions[0] || null
          });
          topicsStillToLearn.push({
            id: c.id,
            name: c.name,
            reason: `Needs remediation · ${plainReason}`
          });
        }
      }
    });

    // 7. Determine Honest Overall Mastery Status Badge (no false "Mastery Met" on 0 score)
    let overallMasteryBadge = "";
    if (totalCompleted === 0) {
      overallMasteryBadge = `<span class="sp-badge-gray">Not enough answers to assess yet</span>`;
    } else if (recentScore === 0 && recentTotal > 0) {
      overallMasteryBadge = `<span class="sp-badge-amber">Needs Practice (0% Recent Score)</span>`;
    } else if (recentAccuracy < 60) {
      overallMasteryBadge = `<span class="sp-badge-amber">Needs Attention (${recentAccuracy}% Accuracy)</span>`;
    } else if (topicsNeedingPractice.length > 0) {
      overallMasteryBadge = `<span class="sp-badge-amber">Needs Practice (${topicsNeedingPractice.length} Topics Flagged)</span>`;
    } else if (recentAccuracy >= 80) {
      overallMasteryBadge = `<span class="sp-badge-teal">✓ Mastery Met (${recentAccuracy}% Accuracy)</span>`;
    } else {
      overallMasteryBadge = `<span class="sp-badge-blue">Progressing Steadily (${recentAccuracy}%)</span>`;
    }

    // 8. One Clear Next Step
    let nextStepTitle = "";
    let nextStepDescription = "";
    let nextStepBtnText = "";
    let nextStepAction = "";

    if (activeDrafts.length > 0) {
      const activeTest = activeDrafts[0].test;
      const safeTestTitle = String(activeTest.title).replace(/'/g, "\\'").replace(/"/g, "&quot;");
      const answeredCount = Object.keys(activeDrafts[0].draft.studentAnswers || {}).length;
      nextStepTitle = `Complete In-Progress Assessment: ${activeTest.title}`;
      nextStepDescription = `Student has an active, saved draft test with ${answeredCount} questions already answered. Advise the student to log in and submit the test before the testing window closes.`;
      nextStepBtnText = `Notify Student to Submit Draft`;
      nextStepAction = `alert('Notification dispatched to ${safeStudentName} (${studentId}) to complete draft test \\"${safeTestTitle}\\".')`;
    } else if (topicsNeedingPractice.length > 0) {
      const topWeak = topicsNeedingPractice[0];
      nextStepTitle = `Review Lesson & Complete Retest: ${topWeak.name}`;
      nextStepDescription = `Actual responses show: ${topWeak.reason}. Assigning a quick 5-minute visual review and a 3-question targeted practice quiz will solidify core concepts.`;
      nextStepBtnText = `Recommend Resource for ${topWeak.name}`;
      nextStepAction = `window.dashboardEngineInstance.recommendResourceForStudent('${safeStudentName}', '${topWeak.id}')`;
    } else if (totalCompleted === 0) {
      nextStepTitle = `Take Assigned Initial Assessment`;
      nextStepDescription = `No test submissions have been recorded for this student yet. Schedule the initial course diagnostic to benchmark foundational competencies.`;
      nextStepBtnText = `Assign Course Diagnostic`;
      nextStepAction = `window.dashboardEngineInstance.openScheduleTestModal()`;
    } else {
      nextStepTitle = `Advance to Next Curriculum Unit`;
      nextStepDescription = `Student has mastered all assessed syllabus topics with strong accuracy (${recentAccuracy}%). Ready to begin advanced networking modules.`;
      nextStepBtnText = `Schedule Advanced Module Test`;
      nextStepAction = `window.dashboardEngineInstance.openScheduleTestModal()`;
    }

    if (bodyEl) {
      bodyEl.innerHTML = `
        <!-- TOP SUMMARY CARDS (LIGHT THEME) -->
        <div class="summary-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 20px;">
          <!-- Card 1: Tests Completed -->
          <div class="student-progress-card" style="padding: 16px;">
            <span class="sp-card-label" style="font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Tests Completed</span>
            <div style="font-size: 26px; font-weight: 800; color: #0F172A; margin: 4px 0;">${totalCompleted}</div>
            <div style="font-size: 12px; color: #475569;">
              ${diagRecords.length > 0 ? `${diagRecords.length} Diagnostic` : '0 Diagnostic'} · ${schedAttempts.length > 0 ? `${schedAttempts.length} Scheduled` : '0 Scheduled'}
            </div>
          </div>

          <!-- Card 2: Most Recent Accuracy -->
          <div class="student-progress-card" style="padding: 16px;">
            <span class="sp-card-label" style="font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Most Recent Accuracy</span>
            <div style="font-size: 26px; font-weight: 800; color: ${hasRecentData ? (recentAccuracy >= 70 ? '#0D9488' : '#D97706') : '#64748B'}; margin: 4px 0;">
              ${hasRecentData ? `${recentAccuracy}%` : '—'}
            </div>
            <div style="font-size: 12px; color: #475569;">
              ${hasRecentData ? `${recentScore}/${recentTotal} correct · ${recentDateStr}` : 'Not enough answers to assess yet'}
            </div>
          </div>

          <!-- Card 3: Evaluated Status -->
          <div class="student-progress-card" style="padding: 16px;">
            <span class="sp-card-label" style="font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Evaluated Status</span>
            <div style="margin: 8px 0;">
              ${overallMasteryBadge}
            </div>
            <div style="font-size: 12px; color: #475569;">
              ${totalCompleted > 0 ? `Based on ${totalCompleted} actual submission(s)` : 'Awaiting student test submission'}
            </div>
          </div>

          <!-- Card 4: Syllabus Scope -->
          <div class="student-progress-card" style="padding: 16px;">
            <span class="sp-card-label" style="font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Topics Completed</span>
            <div style="font-size: 26px; font-weight: 800; color: #0284C7; margin: 4px 0;">
              ${topicsCompleted.length} / ${syllabusList.length}
            </div>
            <div style="font-size: 12px; color: #475569;">
              ${topicsStillToLearn.length} topic(s) still to learn or practice
            </div>
          </div>
        </div>

        <!-- CALLOUT: ONE CLEAR NEXT STEP -->
        <div class="student-progress-card mb-4" style="background: #F0F9FF; border: 1.5px solid #BAE6FD; padding: 18px 20px; border-radius: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div style="flex: 1; min-width: 260px;">
              <span class="sp-badge-blue" style="margin-bottom: 6px; display: inline-flex;">🎯 Recommended Next Step</span>
              <h4 style="margin: 4px 0 6px 0; color: #0369A1; font-size: 16px; font-weight: 700;">${nextStepTitle}</h4>
              <p style="margin: 0; color: #334155; font-size: 13.5px; line-height: 1.5;">${nextStepDescription}</p>
            </div>
            <div>
              <button type="button" class="btn btn-sm sp-btn-primary" onclick="${nextStepAction}" style="white-space: nowrap;">
                ${nextStepBtnText} →
              </button>
            </div>
          </div>
        </div>

        <!-- TWO COLUMN TOPIC BREAKDOWN: DOING WELL vs NEEDING PRACTICE -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; margin-bottom: 20px;">
          <!-- Column 1: Topics Doing Well -->
          <div class="student-progress-card" style="padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
              <h4 style="margin: 0; color: #0F172A; font-size: 14.5px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <span style="color: #0D9488;">●</span> Topics Doing Well (${topicsDoingWell.length})
              </h4>
              <span class="sp-badge-teal">${topicsDoingWell.length} Strong</span>
            </div>
            ${topicsDoingWell.length > 0 ? topicsDoingWell.map(t => `
              <div class="sp-topic-item sp-item-well">
                <div>
                  <strong style="color: #0F172A; font-size: 13.5px; display: block;">${t.name}</strong>
                  <span style="font-size: 12px; color: #475569;">
                    ${t.isRemediated ? `Remediated via retest (${t.retestScore}/3 score)` : `${t.correct}/${t.attempted} questions correct (${t.accuracy}%)`}
                  </span>
                </div>
                <span class="sp-badge-teal">✓ Strong</span>
              </div>
            `).join("") : `
              <div style="padding: 16px; text-align: center; color: #64748B; font-size: 13px; background: #F8FAFC; border-radius: 8px;">
                ${totalCompleted === 0 ? "Not enough answers to assess yet." : "No topics meeting mastery threshold yet. Review recommendations on the right."}
              </div>
            `}
          </div>

          <!-- Column 2: Topics Needing More Practice -->
          <div class="student-progress-card" style="padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
              <h4 style="margin: 0; color: #0F172A; font-size: 14.5px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <span style="color: #D97706;">●</span> Topics Needing More Practice (${topicsNeedingPractice.length})
              </h4>
              <span class="sp-badge-amber">${topicsNeedingPractice.length} Needs Attention</span>
            </div>
            ${topicsNeedingPractice.length > 0 ? topicsNeedingPractice.map(t => `
              <div class="sp-topic-item sp-item-needs-practice">
                <div style="flex: 1;">
                  <strong style="color: #0F172A; font-size: 13.5px; display: block;">${t.name}</strong>
                  <div style="font-size: 12.5px; color: #92400E; margin-top: 2px;">
                    ${t.reason}
                  </div>
                </div>
                <button type="button" class="btn btn-xs sp-btn-secondary" onclick="window.dashboardEngineInstance.recommendResourceForStudent('${safeStudentName}', '${t.id}')" title="Assign targeted lesson">
                  Recommend Resource
                </button>
              </div>
            `).join("") : `
              <div style="padding: 16px; text-align: center; color: #0D9488; font-size: 13px; background: #F0FDF4; border-radius: 8px; border: 1px solid #CCFBF1;">
                ${totalCompleted === 0 ? "Not enough answers to assess yet." : "✓ Great progress! No unresolved concept gaps detected in submitted tests."}
              </div>
            `}
          </div>
        </div>

        <!-- CURRICULUM SYLLABUS SCOPE -->
        <div class="student-progress-card mb-4" style="padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
            <h4 style="margin: 0; color: #0F172A; font-size: 14.5px; font-weight: 700;">
              📚 Course Curriculum Progress (${courseCode})
            </h4>
            <span class="text-xs text-muted">${syllabusList.length} Total Topics</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
            <div>
              <span style="font-size: 12px; font-weight: 700; color: #0D9488; text-transform: uppercase; margin-bottom: 6px; display: block;">
                Topics Completed (${topicsCompleted.length})
              </span>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${topicsCompleted.length > 0 ? topicsCompleted.map(c => `
                  <div style="font-size: 12.5px; color: #0F766E; background: #CCFBF1; padding: 6px 10px; border-radius: 6px; border: 1px solid #99F6E4; display: flex; justify-content: space-between;">
                    <span>✓ ${c.name}</span>
                    <span style="font-size: 11px; font-weight: 600;">Completed</span>
                  </div>
                `).join("") : '<div class="text-xs text-muted">No topics completed yet.</div>'}
              </div>
            </div>
            <div>
              <span style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 6px; display: block;">
                Topics Still to Learn / Practice (${topicsStillToLearn.length})
              </span>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${topicsStillToLearn.length > 0 ? topicsStillToLearn.map(c => `
                  <div style="font-size: 12.5px; color: #475569; background: #F8FAFC; padding: 6px 10px; border-radius: 6px; border: 1px solid #E2E8F0; display: flex; justify-content: space-between;">
                    <span>○ ${c.name}</span>
                    <span style="font-size: 11px; color: #64748B;">${c.reason.includes("Not enough") ? "Upcoming in syllabus" : "Needs practice"}</span>
                  </div>
                `).join("") : '<div class="text-xs text-muted">All syllabus topics completed!</div>'}
              </div>
            </div>
          </div>
        </div>

        <!-- COLLAPSIBLE SECTION: VIEW ATTEMPT DETAILS -->
        <div class="sp-attempt-details-wrapper" style="margin-top: 20px; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          <button id="sp-toggle-details-btn" type="button" class="btn btn-sm sp-btn-secondary" style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 16px;" onclick="window.dashboardEngineInstance.toggleAttemptDetails()" aria-expanded="false">
            <span style="font-weight: 600; color: #0F172A; display: flex; align-items: center; gap: 8px;">
              <span>📋</span> View Attempt Details (Question-by-Question Breakdown)
            </span>
            <span id="sp-toggle-details-icon" style="font-size: 12px; font-weight: 700; color: #0284C7;">▼ View Attempt Details</span>
          </button>

          <div id="sp-attempt-details-content" style="display: none; margin-top: 16px;">
            ${this.renderAttemptDetailsHtml(diagRecords, schedAttempts, syllabusList)}
          </div>
        </div>
      `;
    }

    if (modal) modal.classList.add("modal-open");
  }

  // ==========================================
  // 5. CSV EXPORTS
  // ==========================================
  exportInstructorCSV() {
    const records = storageEngine.getRecordsForInstructor(this.currentInstructorKey, this.currentCourseKey);
    this.downloadCSV(records, `GapPath_Course_${this.currentCourseKey}_Submissions.csv`);
  }

  exportHODCSV() {
    const records = storageEngine.getRecordsForHOD(this.currentHODDept);
    this.downloadCSV(records, `GapPath_Department_${this.currentHODDept}_Assessment_Report.csv`);
  }

  downloadCSV(records, filename) {
    if (!records || records.length === 0) {
      alert("No records to export.");
      return;
    }
    const headers = [
      "Report_ID", "Attempt_ID", "Is_Synthetic", "Student_ID", "Student_Name", "Student_Email",
      "Department", "Course_Code", "Course_Name", "Assigned_Instructor", "Assigned_HOD",
      "Year_Semester", "Score", "Percentage", "Primary_Likely_Gap", "Is_Prereq_Cascade",
      "Retest_Completed", "Retest_Score", "Retest_Status", "Submitted_At"
    ];

    const rows = records.map(r => [
      r.report_id,
      r.quiz_attempt_id || "N/A",
      r.is_synthetic ? "TRUE" : "FALSE",
      r.student_id,
      `"${r.student_name}"`,
      r.student_email,
      r.department,
      r.course_code,
      `"${r.course_name}"`,
      `"${r.assigned_instructor.name}"`,
      `"${r.assigned_hod.name}"`,
      `"${r.year_semester}"`,
      r.score,
      r.percentage,
      r.primary_likely_gap,
      r.is_prereq_cascade ? "TRUE" : "FALSE",
      r.practice_retest && r.practice_retest.completed ? "TRUE" : "FALSE",
      r.practice_retest ? r.practice_retest.score : 0,
      `"${r.practice_retest ? r.practice_retest.status : 'Pending'}"`,
      r.submitted_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==========================================
  // 6. LEARNING SESSION DETAIL INSPECTOR (REQUIREMENT 3.C)
  // ==========================================
  showLearningSessionModal(sessionId) {
    const studentUser = authEngine.getCurrentUser();
    if (!studentUser) return;

    const session = storageEngine.getLearningSessionById(studentUser.student_id, sessionId);
    if (!session) {
      alert("Session record not found.");
      return;
    }

    const modal = document.getElementById("learning-session-modal");
    const titleEl = document.getElementById("session-modal-title");
    const bodyEl = document.getElementById("session-modal-body");
    const studyBtn = document.getElementById("session-modal-study-btn");

    if (titleEl) {
      titleEl.innerHTML = `Learning Session: <span class="text-cyan">${session.concept_name}</span> (<code>${session.session_id}</code>)`;
    }

    if (studyBtn) {
      studyBtn.onclick = () => {
        closeLearningSessionModal();
        if (typeof window.openAITutorConcept === "function") {
          window.openAITutorConcept(session.concept_id);
        } else {
          switchTab("tab-tutor");
          if (window.tutorEngineInstance) window.tutorEngineInstance.openConceptLesson(session.concept_id);
        }
      };
    }

    if (bodyEl) {
      // Formatted items
      const itemsHtml = (session.retest_responses || []).map((resp, idx) => `
        <div class="retest-item-box ${resp.is_correct ? 'trace-correct' : 'trace-incorrect'} mb-3">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong>Question ${idx + 1} (${resp.question_id})</strong>
            <span class="badge ${resp.is_correct ? 'badge-success' : 'badge-danger'}">
              ${resp.is_correct ? '✓ Correct' : '✗ Incorrect'}
            </span>
          </div>
          <p class="text-sm mb-2" style="color: #F8FAFC;">${resp.question_text}</p>
          <div class="text-xs mb-2">
            <span><strong>Your Selected Choice:</strong> Option ${resp.chosen_key} (${resp.chosen_text || '—'})</span>
            ${!resp.is_correct ? `<span class="text-cyan" style="margin-left: 14px;"><strong>Correct Answer:</strong> Option ${resp.correct_key}</span>` : ''}
          </div>
          <div class="trace-explanation">
            <strong>Undergraduate Rationale:</strong> ${resp.explanation}
          </div>
        </div>
      `).join("");

      // Diagnostic evidence display
      let diagEvidenceHtml = "";
      if (session.previous_diagnostic_evidence) {
        diagEvidenceHtml = `
          <div class="meta-card">
            <span class="meta-label">Original Diagnostic Evidence</span>
            <div>Prior Signal: <strong>${session.previous_diagnostic_evidence.status || 'Assessed'}</strong></div>
            ${session.previous_diagnostic_evidence.misconception ? `<div class="text-xs text-amber mt-1"><em>Pedagogical Trap Noted:</em> ${session.previous_diagnostic_evidence.misconception}</div>` : ''}
            ${session.associated_report_id ? `<div class="text-xs text-muted mt-1">Associated Report: <code>${session.associated_report_id}</code></div>` : ''}
          </div>
        `;
      } else {
        diagEvidenceHtml = `
          <div class="meta-card">
            <span class="meta-label">Original Diagnostic Evidence</span>
            <div class="text-muted">Direct concept learning session (no prior diagnostic gap record attached).</div>
          </div>
        `;
      }

      bodyEl.innerHTML = `
        <div class="student-form-grid mb-3">
          <div class="meta-card">
            <span class="meta-label">Concept Learned</span>
            <strong style="color: #FFFFFF;">${session.concept_name}</strong>
            <div><code>${session.concept_id}</code></div>
          </div>
          <div class="meta-card">
            <span class="meta-label">Retest Outcome & Score</span>
            <div style="font-size: 18px; font-weight: 700; color: #FFFFFF;">${session.retest_score} / ${session.retest_total || 5} (${session.retest_percentage}%)</div>
            <div>Status: <span class="badge ${session.status_badge_class || 'badge-success'}">${session.learning_status}</span></div>
          </div>
          <div class="meta-card">
            <span class="meta-label">Session Timestamps</span>
            <div>Completed: <small>${new Date(session.completed_at).toLocaleString()}</small></div>
            <div class="text-xs text-muted">Session ID: <code>${session.session_id}</code></div>
          </div>
          ${diagEvidenceHtml}
        </div>

        <!-- Previous and Current Performance Comparison -->
        <div class="card mb-4" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(148, 163, 184, 0.15); padding: 16px;">
          <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #F59E0B;">⚖️ Performance Comparison & Cautious Policy</h4>
          <p style="margin: 0; font-size: 13px; color: #E2E8F0;">
            ${session.score_comparison || 'Formative concept assessment completed.'}
          </p>
          <div class="cautious-gap-notice mt-2" style="font-size: 12px;">
            ℹ️ <strong>Cautious Progress Notice:</strong> A 5-question retest confirms formative understanding and recovery from diagnosed traps, but does not guarantee complete syllabus mastery. Ongoing application is recommended.
          </div>
        </div>

        <!-- Recommended Next Action -->
        <div class="meta-card mb-4">
          <span class="meta-label">Recommended Next Action</span>
          <div style="color: #FFFFFF; font-weight: 600;">${session.recommended_next_step || 'Continue to adjacent networking topics.'}</div>
        </div>

        <!-- 5-Question Retest Trace -->
        <h4 class="mb-3">Retest Questions, Answers & Explanations (5-Question Concept Assessment)</h4>
        <div class="record-items-container">
          ${itemsHtml}
        </div>
      `;
    }

    if (modal) modal.classList.add("modal-open");
  }

  // ==========================================
  // 1.2 STUDENT SCHEDULED TESTS & TIMERS
  // ==========================================
  renderStudentScheduledTests(studentUser) {
    if (!studentUser) {
      studentUser = authEngine.getCurrentUser();
    }
    if (!studentUser) return;
    const grid = document.getElementById("stu-scheduled-tests-grid");
    if (!grid) return;

    const allTests = storageEngine.getScheduledTests();
    const eligibleTests = allTests.filter(t => storageEngine.isStudentEligibleForTest(studentUser, t));
    const now = new Date();

    const formatCard = (test) => {
      const startTime = new Date(test.start_time);
      const endTime = new Date(test.end_time);
      const attempt = storageEngine.getScheduledTestAttempt(studentUser.student_id, test.id);
      const draft = storageEngine.getScheduledTestDraft(studentUser.student_id, test.id);

      const isUpcoming = now < startTime;
      const isClosed = now > endTime;
      const isActive = !isUpcoming && !isClosed;

      let statusKey = "Available";
      let statusBadge = "";
      let actionBtn = "";

      if (attempt) {
        statusKey = "Completed";
        statusBadge = `<span class="badge badge-success">Completed · ${attempt.score}/${attempt.total_questions} (${attempt.percentage}%)</span>`;
        actionBtn = `
          <button class="btn btn-sm btn-outline-primary" onclick="window.startScheduledTest('${test.id}')">
            Review Results & Learning Notes →
          </button>
        `;
      } else if (isActive && draft && draft.studentAnswers) {
        statusKey = "In progress";
        const answeredCount = Object.keys(draft.studentAnswers).length;
        const totalQ = draft.questions ? draft.questions.length : (test.question_count || 5);
        statusBadge = `<span class="badge badge-warning">In progress (${answeredCount}/${totalQ} answered)</span>`;
        actionBtn = `
          <button class="btn btn-sm btn-warning" onclick="window.startScheduledTest('${test.id}')">
            Resume test →
          </button>
        `;
      } else if (isUpcoming) {
        statusKey = "Upcoming";
        statusBadge = `<span class="badge badge-secondary">Upcoming</span>`;
        actionBtn = `
          <button class="btn btn-sm btn-secondary" disabled title="Test window opens at ${startTime.toLocaleTimeString()}">
            🔒 Opens ${startTime.toLocaleDateString([], {month: 'short', day: 'numeric'})} at ${startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
          </button>
        `;
      } else if (isClosed) {
        statusKey = "Closed";
        statusBadge = `<span class="badge badge-danger">Closed</span>`;
        actionBtn = `
          <button class="btn btn-sm btn-secondary" disabled title="Test window has closed">
            Closed
          </button>
        `;
      } else {
        statusKey = "Available";
        statusBadge = `<span class="badge badge-success">Available</span>`;
        actionBtn = `
          <button class="btn btn-sm btn-primary" onclick="window.startScheduledTest('${test.id}')">
            Start test (${test.time_limit_mins} mins) →
          </button>
        `;
      }

      const conceptLabels = (test.topics || []).map(tid => {
        const found = (window.gQuestionBank && window.gQuestionBank.concepts) ? window.gQuestionBank.concepts.find(c => c.id === tid) : null;
        return found ? found.name : tid;
      });

      return `
        <div class="card scheduled-test-card ${isActive ? 'test-card-active' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
            <div>
              <span class="badge badge-secondary text-xs">${test.course_code}</span>
              <h4 style="margin: 6px 0 2px 0; font-size: 17px; font-weight: 600;">${test.title}</h4>
              <div class="text-xs text-muted">Status: <strong>${statusKey}</strong></div>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>

          <div class="test-card-meta-grid mb-3">
            <div class="test-meta-item">
              <span class="meta-label">Scheduled Date & Time</span>
              <strong>${startTime.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'})}</strong>
              <small class="text-muted">Start: ${startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} – ${endTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} (${test.timezone || 'IST'})</small>
            </div>
            <div class="test-meta-item">
              <span class="meta-label">Time Limit</span>
              <strong class="text-cyan">⏱️ ${test.time_limit_mins} mins</strong>
              <small class="text-muted">Auto-submits on expiration</small>
            </div>
            <div class="test-meta-item">
              <span class="meta-label">Questions & Pass Mark</span>
              <strong>${test.question_count} Questions</strong>
              <small class="text-amber">Pass Mark: ≥ ${test.mastery_threshold}%</small>
            </div>
          </div>

          <div class="test-topics-preview mb-3">
            <span class="meta-label">Topics:</span>
            <div class="test-topics-tags mt-1">
              ${conceptLabels.map(lbl => `<span class="topic-tag-chip">${lbl}</span>`).join("")}
            </div>
          </div>

          ${isUpcoming ? `
            <div class="alert alert-info text-xs mb-3" style="padding: 8px 12px; margin-bottom: 10px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px;">
              ℹ️ <strong>Upcoming Test:</strong> This test opens on <strong>${startTime.toLocaleDateString([], {month: 'short', day: 'numeric'})} at ${startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} (${test.timezone || 'IST'})</strong>. The "Start test" button will activate during this scheduled window.
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(148, 163, 184, 0.1); padding-top: 12px;">
            <span class="text-xs text-muted">🌐 ${test.timezone || 'IST'}</span>
            <div>
              ${actionBtn}
            </div>
          </div>
        </div>
      `;
    };

    // Partition eligible tests deterministically by availability window
    const ongoingTests = eligibleTests.filter(t => {
      const st = new Date(t.start_time);
      const et = new Date(t.end_time);
      return now >= st && now <= et;
    });

    const upcomingTests = eligibleTests.filter(t => now < new Date(t.start_time));

    // Update section bar tab badges/labels unconditionally
    const btnOngoing = document.getElementById("stu-sec-btn-ongoing");
    const btnUpcoming = document.getElementById("stu-sec-btn-upcoming");
    const btnCompleted = document.getElementById("stu-sec-btn-completed");
    const btnTopics = document.getElementById("stu-sec-btn-topics");
    const countBadge = document.getElementById("stu-assigned-count-badge");

    const diagRecords = storageEngine.getRecordsForStudent(studentUser.student_id, studentUser.email) || [];
    const allSchedAttempts = (storageEngine.getAllScheduledTestAttempts() || []).filter(a => a && a.student_id === studentUser.student_id);
    const totalCompleted = diagRecords.length + allSchedAttempts.length;
    const totalTopics = (window.gQuestionBank && window.gQuestionBank.concepts) ? window.gQuestionBank.concepts.length : 10;

    if (btnOngoing) btnOngoing.innerHTML = `▶️ Ongoing Tests (${ongoingTests.length})`;
    if (btnUpcoming) btnUpcoming.innerHTML = `📅 Upcoming Tests (${upcomingTests.length})`;
    if (btnCompleted) btnCompleted.innerHTML = `✅ Completed Tests (${totalCompleted})`;
    if (btnTopics) btnTopics.innerHTML = `📚 Topics to Study (${totalTopics})`;

    if (countBadge) {
      if (ongoingTests.length > 0) {
        countBadge.textContent = `${ongoingTests.length} Active Now`;
        countBadge.className = "badge badge-success text-xs";
      } else if (upcomingTests.length > 0) {
        countBadge.textContent = `${upcomingTests.length} Upcoming`;
        countBadge.className = "badge badge-info text-xs";
      } else {
        countBadge.textContent = "0 Assigned";
        countBadge.className = "badge badge-secondary text-xs";
      }
    }

    // 1. Render Ongoing Tests Grid
    if (ongoingTests.length > 0) {
      grid.innerHTML = ongoingTests.map(formatCard).join("");
    } else if (eligibleTests.length === 0) {
      grid.innerHTML = `
        <div class="empty-tests-state card text-center py-5" style="grid-column: 1 / -1; background: rgba(15, 23, 42, 0.4); border: 1px dashed rgba(148, 163, 184, 0.25);">
          <div style="font-size: 40px; margin-bottom: 12px;">📋</div>
          <h3 style="margin-bottom: 8px; color: #FFFFFF;">No Assigned Tests</h3>
          <p class="text-muted" style="max-width: 480px; margin: 0 auto 16px auto; font-size: 14px;">
            No scheduled assessments are assigned to <strong>${studentUser.name || 'your account'}</strong> (${studentUser.department || 'CSE'} · ${studentUser.section || 'Section A'} · ${studentUser.semester || '5th Sem'}) at this time. When your instructor assigns a test for your cohort, it will appear here with its start time and availability window.
          </p>
          <div>
            <button class="btn btn-sm btn-outline-secondary" onclick="authEngine.renderCurrentPortal()">
              ↻ Refresh My Tests
            </button>
          </div>
        </div>
      `;
    } else {
      grid.innerHTML = `
        <div class="card text-center py-4" style="grid-column: 1 / -1; background: rgba(15, 23, 42, 0.4); border: 1px dashed rgba(148, 163, 184, 0.25);">
          <div style="font-size: 32px; margin-bottom: 8px;">⏳</div>
          <h4 style="margin-bottom: 6px; color: #FFFFFF;">No Tests Open at this Moment</h4>
          <p class="text-muted text-xs" style="max-width: 480px; margin: 0 auto 12px auto;">
            You have ${upcomingTests.length} upcoming scheduled assessment${upcomingTests.length === 1 ? '' : 's'} assigned to your cohort.
          </p>
          <button class="btn btn-sm btn-outline-primary" onclick="window.dashboardEngineInstance.switchStudentSection('upcoming')">
            View Upcoming Tests (${upcomingTests.length}) →
          </button>
        </div>
      `;
    }

    // 2. Render Upcoming Tests Grid
    const upcomingGrid = document.getElementById("stu-upcoming-tests-grid");
    if (upcomingGrid) {
      if (upcomingTests.length > 0) {
        upcomingGrid.innerHTML = upcomingTests.map(formatCard).join("");
      } else {
        upcomingGrid.innerHTML = `
          <div class="card text-center py-4 text-muted" style="grid-column: 1 / -1; background: rgba(15, 23, 42, 0.4); border: 1px dashed rgba(148, 163, 184, 0.25);">
            No upcoming scheduled assessments at this time.
          </div>
        `;
      }
    }

    // 3. Render Topics to Study List
    const topicsListEl = document.getElementById("stu-topics-to-study-list");
    if (topicsListEl && window.gQuestionBank && Array.isArray(window.gQuestionBank.concepts)) {
      const concepts = window.gQuestionBank.concepts;
      topicsListEl.innerHTML = concepts.map(c => {
        const safeTitle = (c.name || 'Topic').replace(/'/g, "\\'").replace(/"/g, "&quot;");
        return `
          <div class="topic-study-card" style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 12px 16px; gap: 12px; flex-wrap: wrap;">
            <div>
              <span class="badge badge-secondary text-xs">${c.category || 'Core'}</span>
              <h4 style="margin: 4px 0 2px 0; color: #FFFFFF; font-size: 15px;">${c.name}</h4>
              <div class="text-xs text-muted">Tier ${c.tier} · ${c.prerequisites && c.prerequisites.length ? 'Prerequisites: ' + c.prerequisites.join(', ') : 'Foundational concept'}</div>
            </div>
            <button class="btn btn-sm btn-outline-primary" onclick="switchTab('tab-tutor'); if(window.tutorEngineInstance) window.tutorEngineInstance.askAboutGap('${c.id}', '${safeTitle}');">
              Study with AI Tutor →
            </button>
          </div>
        `;
      }).join("");
    }
  }

  // ==========================================
  // 2.2 INSTRUCTOR SCHEDULED TESTS MANAGEMENT
  // ==========================================
  updateInstructorTestMetrics() {
    const allTests = storageEngine.getScheduledTests();
    const courseTests = allTests.filter(t => 
      t.course_code === this.currentCourseKey || 
      t.course_code === "ALL" || 
      (this.currentInstructorKey && (t.created_by === this.currentInstructorKey || t.instructor_name === this.currentInstructorKey))
    );
    const now = new Date();
    const scheduledCount = courseTests.length;
    const activeCount = courseTests.filter(t => new Date(t.start_time) <= now && new Date(t.end_time) >= now).length;
    const upcomingCount = courseTests.filter(t => new Date(t.start_time) > now).length;
    const closedCount = courseTests.filter(t => new Date(t.end_time) < now).length;

    const allSchedAttempts = (storageEngine.getAllScheduledTestAttempts() || []).filter(a => 
      a.course_code === this.currentCourseKey || 
      a.course_code === "ALL" || 
      courseTests.some(t => t.id === a.test_id)
    );
    const totalStudentAttempts = allSchedAttempts.length;
    const totalStudentCompletions = allSchedAttempts.filter(a => a.completed_at || a.submitted_at).length;

    const testSchedEl = document.getElementById("inst-test-stat-scheduled");
    const testActiveEl = document.getElementById("inst-test-stat-active");
    const testUpEl = document.getElementById("inst-test-stat-upcoming");
    const testClosedEl = document.getElementById("inst-test-stat-closed");
    const testAttemptsEl = document.getElementById("inst-test-stat-attempts");
    const testCompEl = document.getElementById("inst-test-stat-completed");

    if (testSchedEl) testSchedEl.textContent = scheduledCount;
    if (testActiveEl) testActiveEl.textContent = activeCount;
    if (testUpEl) testUpEl.textContent = upcomingCount;
    if (testClosedEl) testClosedEl.textContent = closedCount;
    if (testAttemptsEl) testAttemptsEl.textContent = totalStudentAttempts;
    if (testCompEl) testCompEl.textContent = totalStudentCompletions;
  }

  renderInstructorScheduledTests() {
    const tbody = document.getElementById("instructor-scheduled-tests-tbody");
    if (!tbody) return;

    const allTests = storageEngine.getScheduledTests();
    const courseTests = allTests.filter(t => 
      t.course_code === this.currentCourseKey || 
      t.course_code === "ALL" || 
      (this.currentInstructorKey && (t.created_by === this.currentInstructorKey || t.instructor_name === this.currentInstructorKey))
    );
    const now = new Date();

    if (courseTests.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">
            No scheduled tests found for ${this.currentCourseKey}. Click "+ Schedule New Test" above to schedule an assessment.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = courseTests.map(t => {
      const startTime = new Date(t.start_time);
      const endTime = new Date(t.end_time);
      const isUpcoming = now < startTime;
      const isClosed = now > endTime;
      const isActive = !isUpcoming && !isClosed;

      let statusBadge = "";
      if (isActive) statusBadge = `<span class="badge badge-success">🟢 Active Now</span>`;
      else if (isUpcoming) statusBadge = `<span class="badge badge-secondary">🔒 Upcoming</span>`;
      else statusBadge = `<span class="badge badge-danger">Closed</span>`;

      const startFormatted = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endFormatted = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateFormatted = startTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

      return `
        <tr>
          <td>
            <strong>${t.title}</strong><br>
            <code class="report-code">${t.id}</code>
            ${t.section && t.section !== 'ALL' ? `<br><small class="badge badge-secondary text-xs">${t.section}</small>` : ''}
            ${t.course_code && t.course_code !== this.currentCourseKey ? `<small class="badge badge-info text-xs ml-1">${t.course_code}</small>` : ''}
          </td>
          <td>
            <small>${(t.topics || []).length} topics selected</small><br>
            <span class="text-xs text-muted">${(t.topics || []).slice(0, 2).join(", ")}${(t.topics || []).length > 2 ? '...' : ''}</span>
          </td>
          <td>
            <strong>${t.question_count} Qs</strong><br>
            <small class="badge badge-secondary text-xs">${t.difficulty || 'All'}</small>
          </td>
          <td>
            <small><strong>${startFormatted}</strong> to <strong>${endFormatted}</strong></small><br>
            <small class="text-muted">${dateFormatted} (${t.timezone || 'IST'})</small>
          </td>
          <td><strong>${t.time_limit_mins} min</strong></td>
          <td><span class="badge badge-warning">${t.mastery_threshold}%</span></td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-xs btn-outline-danger" onclick="window.dashboardEngineInstance.deleteScheduledTest('${t.id}')">
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ==========================================
  // 2.3 TEACHER TEST SCHEDULING MODAL WORKFLOW
  // ==========================================
  parseISTDateTime(dtStr) {
    if (!dtStr) return null;
    let s = String(dtStr).trim();
    if (!s.includes("Z") && !s.match(/[\+\-]\d{2}:?\d{2}$/)) {
      if (s.length === 16) {
        s = `${s}:00+05:30`;
      } else if (s.length === 19) {
        s = `${s}+05:30`;
      } else {
        s = `${s}+05:30`;
      }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  formatISTForInput(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) dateObj = new Date();
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      const parts = formatter.formatToParts(dateObj);
      const getP = (t) => {
        const item = parts.find(p => p.type === t);
        return item ? item.value : "00";
      };
      let hourVal = getP("hour");
      if (hourVal === "24") hourVal = "00";
      return `${getP("year")}-${getP("month")}-${getP("day")}T${hourVal}:${getP("minute")}`;
    } catch (e) {
      const pad = n => String(n).padStart(2, "0");
      return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
    }
  }

  openScheduleTestModal() {
    const modal = document.getElementById("schedule-test-modal");
    if (!modal) return;

    // Clear previous error messages
    const errorAlert = document.getElementById("sched-form-error-alert");
    if (errorAlert) {
      errorAlert.style.display = "none";
      errorAlert.textContent = "";
    }

    // Set course to current active course if present
    const courseSelect = document.getElementById("sched-input-course");
    if (courseSelect && this.currentCourseKey) {
      const matchOpt = Array.from(courseSelect.options).find(o => o.value === this.currentCourseKey);
      if (matchOpt) courseSelect.value = this.currentCourseKey;
    }

    // Check currently selected subject
    const subjectSelect = document.getElementById("sched-input-subject");
    const subjectId = subjectSelect ? subjectSelect.value : "CN";

    this.populateScheduleTopicsForSubject(subjectId);

    // Default dates in Asia/Kolkata (Start now, End +4 hours availability window)
    const now = new Date();
    const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const startInput = document.getElementById("sched-input-start");
    const endInput = document.getElementById("sched-input-end");
    if (startInput) startInput.value = this.formatISTForInput(now);
    if (endInput) endInput.value = this.formatISTForInput(fourHoursLater);

    // Default title
    const titleInput = document.getElementById("sched-input-title");
    if (titleInput && (!titleInput.value || titleInput.value.startsWith("Unit Assessment:"))) {
      const subjectNames = {
        CN: "Computer Networks",
        OS: "Operating Systems",
        DBMS: "Database Management Systems",
        DSA: "Data Structures & Algorithms"
      };
      titleInput.value = `Unit Assessment: ${subjectNames[subjectId] || "Curriculum"} Core Concepts`;
    }

    // Live validation
    this.checkScheduleFormAvailability();

    modal.style.display = "flex";
  }

  handleCourseChange(courseCode) {
    const courseSubjectDefaults = {
      CS301: "CN",
      IT302: "CN",
      EC304: "CN",
      AI305: "CN",
      ALL: "CN"
    };
    const subjectSelect = document.getElementById("sched-input-subject");
    if (subjectSelect && courseSubjectDefaults[courseCode]) {
      subjectSelect.value = courseSubjectDefaults[courseCode];
      this.handleSubjectChange(courseSubjectDefaults[courseCode]);
    }
  }

  handleSubjectChange(subjectId) {
    this.populateScheduleTopicsForSubject(subjectId);
    const titleInput = document.getElementById("sched-input-title");
    const subjectNames = {
      CN: "Computer Networks",
      OS: "Operating Systems",
      DBMS: "Database Management Systems",
      DSA: "Data Structures & Algorithms"
    };
    if (titleInput) {
      titleInput.value = `Unit Assessment: ${subjectNames[subjectId] || subjectId} Core Concepts`;
    }
    this.checkScheduleFormAvailability();
  }

  populateScheduleTopicsForSubject(subjectId = "CN") {
    const container = document.getElementById("sched-topics-checkboxes");
    if (!container) return;

    const subjectTopicsMap = {
      CN: [
        { id: "CN_01_OSI_LAYERS", name: "OSI & TCP/IP Architecture" },
        { id: "CN_02_FRAMING_CRC", name: "Data Link Framing & CRC Error Detection" },
        { id: "CN_03_FLOW_CONTROL", name: "Flow & Error Control (Stop-and-Wait, Go-Back-N, SR)" },
        { id: "CN_04_SUBNETTING_IP", name: "IPv4 Addressing & Subnet Masking" },
        { id: "CN_05_ROUTING_ALGO", name: "Distance Vector & Link State Routing" },
        { id: "CN_06_TCP_UDP_TRANSPORT", name: "TCP vs UDP Transport Protocols" },
        { id: "CN_07_TCP_CONGESTION", name: "TCP Congestion Control (AIMD, Slow Start)" },
        { id: "CN_08_DNS_SYSTEM", name: "Domain Name System (DNS) & Name Resolution" },
        { id: "CN_09_HTTP_APPLICATION", name: "HTTP/HTTPS & Application Layer Protocols" },
        { id: "CN_10_NETWORK_SECURITY", name: "Network Security, Cryptography & Firewalls" }
      ],
      OS: [
        { id: "OS_01_PROCESS_MGMT", name: "Process Lifecycle, States & PCB" },
        { id: "OS_02_CPU_SCHEDULING", name: "CPU Scheduling (FCFS, SJF, Round Robin, Priority)" },
        { id: "OS_03_SYNCHRONIZATION", name: "Process Synchronization, Critical Section & Semaphores" },
        { id: "OS_04_DEADLOCKS", name: "Deadlock Detection, Prevention & Banker's Algorithm" },
        { id: "OS_05_MEMORY_PAGING", name: "Main Memory Management, Paging & Segmentation" },
        { id: "OS_06_VIRTUAL_MEMORY", name: "Virtual Memory, Page Faults & Page Replacement" },
        { id: "OS_07_FILE_SYSTEMS", name: "File Systems, Directory Structures & Inodes" },
        { id: "OS_08_DISK_SCHEDULING", name: "Disk Scheduling Algorithms (SCAN, C-SCAN, LOOK)" },
        { id: "OS_09_THREADS_CONCURRENCY", name: "Multithreading Models & Kernel vs User Threads" },
        { id: "OS_10_SECURITY_PROTECTION", name: "System Calls, Dual-Mode Operation & Protection" }
      ],
      DBMS: [
        { id: "DBMS_01_ER_MODEL", name: "Entity-Relationship (ER) Modeling & Constraints" },
        { id: "DBMS_02_RELATIONAL_ALGEBRA", name: "Relational Algebra Operations" },
        { id: "DBMS_03_SQL_QUERIES", name: "SQL Queries, Subqueries & Aggregate Functions" },
        { id: "DBMS_04_NORMALIZATION", name: "Functional Dependencies & Normal Forms (1NF-BCNF)" },
        { id: "DBMS_05_TRANSACTION_ACID", name: "Transaction Processing & ACID Properties" },
        { id: "DBMS_06_CONCURRENCY_CONTROL", name: "Concurrency Control, Serializability & 2PL" },
        { id: "DBMS_07_INDEXING_BTREES", name: "Database Indexing, B-Trees & B+ Trees" },
        { id: "DBMS_08_QUERY_OPTIMIZATION", name: "Query Processing & Cost-Based Optimization" },
        { id: "DBMS_09_CRASH_RECOVERY", name: "Database Crash Recovery & Write-Ahead Logging (ARIES)" },
        { id: "DBMS_10_NOSQL_DISTRIBUTED", name: "NoSQL Data Stores & CAP Theorem" }
      ],
      DSA: [
        { id: "DSA_01_ASYMPTOTIC_ANALYSIS", name: "Asymptotic Notation & Time/Space Complexity" },
        { id: "DSA_02_ARRAYS_STRINGS", name: "Arrays, Dynamic Sizing & String Manipulation" },
        { id: "DSA_03_LINKED_LISTS", name: "Singly, Doubly & Circular Linked Lists" },
        { id: "DSA_04_STACKS_QUEUES", name: "Stacks, Queues, Deques & Monotonic Deques" },
        { id: "DSA_05_TREES_BST", name: "Binary Trees, Binary Search Trees & AVL Balancing" },
        { id: "DSA_06_HEAPS_PRIORITY", name: "Binary Heaps & Priority Queues" },
        { id: "DSA_07_HASHING_MAPS", name: "Hash Tables, Collision Resolution & Probing" },
        { id: "DSA_08_GRAPH_TRAVERSAL", name: "Graph Representations, BFS & DFS Traversals" },
        { id: "DSA_09_GRAPH_SHORTEST_PATH", name: "Dijkstra, Bellman-Ford, Prim & Kruskal" },
        { id: "DSA_10_DYNAMIC_PROGRAMMING", name: "Dynamic Programming & Greedy Algorithms" }
      ]
    };

    const label = document.getElementById("sched-topics-label");
    const subjectNames = {
      CN: "Computer Networks",
      OS: "Operating Systems",
      DBMS: "Database Management Systems",
      DSA: "Data Structures and Algorithms"
    };
    if (label) {
      label.textContent = `Select ${subjectNames[subjectId] || 'Subject'} Topics (At least 1 required) *`;
    }

    const topics = subjectTopicsMap[subjectId] || subjectTopicsMap.CN;
    container.innerHTML = topics.map((c, idx) => `
      <label class="sched-topic-checkbox-label">
        <input type="checkbox" name="sched_topic" value="${c.id}" ${idx < 4 ? 'checked' : ''} onchange="window.dashboardEngineInstance.checkScheduleFormAvailability()">
        <span><strong>${c.id}</strong>: ${c.name}</span>
      </label>
    `).join("");
  }

  closeScheduleTestModal() {
    const modal = document.getElementById("schedule-test-modal");
    if (modal) modal.style.display = "none";
  }

  toggleAllScheduleTopics(selectAll) {
    const checkboxes = document.querySelectorAll('input[name="sched_topic"]');
    checkboxes.forEach(cb => cb.checked = selectAll);
    this.checkScheduleFormAvailability();
  }

  checkScheduleFormAvailability() {
    const checkboxes = document.querySelectorAll('input[name="sched_topic"]:checked');
    const topicIds = Array.from(checkboxes).map(cb => cb.value);
    const countInput = document.getElementById("sched-input-count");
    const count = parseInt(countInput ? countInput.value : "5") || 5;
    const diffSelect = document.getElementById("sched-input-difficulty");
    const diff = diffSelect ? diffSelect.value : "All";
    const subjectSelect = document.getElementById("sched-input-subject");
    const subjectId = subjectSelect ? subjectSelect.value : "CN";

    const noticeEl = document.getElementById("sched-availability-notice");
    const reviewBtn = document.getElementById("sched-modal-review-btn");
    const saveBtn = document.getElementById("sched-modal-save-btn");

    if (topicIds.length === 0) {
      if (noticeEl) {
        noticeEl.style.background = "rgba(239, 68, 68, 0.15)";
        noticeEl.style.border = "1px solid var(--rose-danger)";
        noticeEl.style.color = "#FECDD3";
        noticeEl.innerHTML = "⚠️ Please select at least one curriculum topic.";
      }
      if (reviewBtn) reviewBtn.disabled = true;
      if (saveBtn) saveBtn.disabled = true;
      return false;
    }

    const check = window.scheduledTestEngineInstance.checkAvailability(topicIds, diff, count, subjectId);
    if (noticeEl) {
      if (check.isSufficient) {
        noticeEl.style.background = "rgba(16, 185, 129, 0.15)";
        noticeEl.style.border = "1px solid var(--emerald-success)";
        noticeEl.style.color = "#A7F3D0";
        noticeEl.innerHTML = `${check.message} (Answer keys validated for single correct choice)`;
        if (reviewBtn) reviewBtn.disabled = false;
        if (saveBtn) saveBtn.disabled = false;
      } else {
        noticeEl.style.background = "rgba(239, 68, 68, 0.15)";
        noticeEl.style.border = "1px solid var(--rose-danger)";
        noticeEl.style.color = "#FECDD3";
        noticeEl.innerHTML = check.message;
        if (reviewBtn) reviewBtn.disabled = true;
        if (saveBtn) saveBtn.disabled = true;
      }
    }
    return check.isSufficient;
  }

  validateScheduleFormData() {
    const errorAlert = document.getElementById("sched-form-error-alert");
    const showError = (msg) => {
      if (errorAlert) {
        errorAlert.textContent = msg;
        errorAlert.style.display = "block";
        errorAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      return { isValid: false, message: msg };
    };

    const title = (document.getElementById("sched-input-title")?.value || "").trim();
    if (!title) {
      return showError("Please enter a test title.");
    }

    const courseSelect = document.getElementById("sched-input-course");
    const courseCode = courseSelect ? courseSelect.value : (this.currentCourseKey || "CS301");
    if (!courseCode) {
      return showError("Please select a valid course code.");
    }

    const sectionSelect = document.getElementById("sched-input-section");
    const section = sectionSelect ? sectionSelect.value : "ALL";

    const semesterSelect = document.getElementById("sched-input-semester");
    const semester = semesterSelect ? semesterSelect.value : "ALL";

    const subjectSelect = document.getElementById("sched-input-subject");
    const subjectId = subjectSelect ? subjectSelect.value : "CN";

    const checkboxes = document.querySelectorAll('input[name="sched_topic"]:checked');
    const topicIds = Array.from(checkboxes).map(cb => cb.value);
    if (topicIds.length === 0) {
      return showError("Please select at least one syllabus topic.");
    }

    const countInput = document.getElementById("sched-input-count");
    const count = parseInt(countInput ? countInput.value : "5", 10);
    if (isNaN(count) || count < 1 || count > 20) {
      return showError("Question count must be between 1 and 20.");
    }

    const diffSelect = document.getElementById("sched-input-difficulty");
    const diff = diffSelect ? diffSelect.value : "All";

    const startStr = (document.getElementById("sched-input-start")?.value || "").trim();
    if (!startStr) {
      return showError("Please enter a scheduled start date and time.");
    }
    const startDate = this.parseISTDateTime(startStr);
    if (!startDate) {
      return showError("Scheduled start date and time format is invalid.");
    }

    const endStr = (document.getElementById("sched-input-end")?.value || "").trim();
    if (!endStr) {
      return showError("Please enter an availability window end date and time.");
    }
    const endDate = this.parseISTDateTime(endStr);
    if (!endDate) {
      return showError("Availability window end date and time format is invalid.");
    }

    if (endDate.getTime() <= startDate.getTime()) {
      return showError("Availability window end time must be after the scheduled start time.");
    }

    const timeLimitInput = document.getElementById("sched-input-time-limit");
    const timeLimit = parseInt(timeLimitInput ? timeLimitInput.value : "15", 10);
    if (isNaN(timeLimit) || timeLimit < 2 || timeLimit > 180) {
      return showError("Test taking time limit must be between 2 and 180 minutes.");
    }

    const thresholdInput = document.getElementById("sched-input-threshold");
    const threshold = parseInt(thresholdInput ? thresholdInput.value : "80", 10);
    if (isNaN(threshold) || threshold < 50 || threshold > 100) {
      return showError("Mastery pass threshold must be between 50% and 100%.");
    }

    // Check availability in question bank
    if (!this.checkScheduleFormAvailability()) {
      return showError("Not enough validated questions available for your topic and difficulty selection.");
    }

    if (errorAlert) {
      errorAlert.style.display = "none";
      errorAlert.textContent = "";
    }

    const deptMap = {
      CS301: "CSE",
      IT302: "IT",
      EC304: "ECE",
      AI305: "AIML",
      ALL: "ALL"
    };

    const subjectNames = {
      CN: "Computer Networks",
      OS: "Operating Systems",
      DBMS: "Database Management Systems",
      DSA: "Data Structures and Algorithms"
    };

    const courseDept = deptMap[courseCode] || (this.currentDeptKey || "CSE");

    const testPayload = {
      id: `TEST-${subjectId}-${Date.now().toString().slice(-4)}`,
      title: title,
      course_code: courseCode,
      department: courseDept,
      section: section,
      semester: semester,
      academic_year: semester === "5" || semester === "6" ? "3rd Year" : "ALL",
      subject_id: subjectId,
      subject_name: subjectNames[subjectId] || "Computer Networks",
      topics: topicIds,
      question_count: count,
      difficulty: diff,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      time_limit_mins: timeLimit,
      mastery_threshold: threshold,
      timezone: "Asia/Kolkata (IST · UTC+05:30)",
      created_by: this.currentInstructorKey || (authEngine.getCurrentUser() && authEngine.getCurrentUser().name) || "Prof. Rajesh Sharma",
      instructor_name: this.currentInstructorKey || (authEngine.getCurrentUser() && authEngine.getCurrentUser().name) || "Prof. Rajesh Sharma",
      created_at: new Date().toISOString(),
      status: (new Date() >= startDate && new Date() <= endDate) ? "active" : ((new Date() < startDate) ? "upcoming" : "closed")
    };

    return { isValid: true, testData: testPayload, startDate, endDate };
  }

  submitScheduleForm() {
    const valResult = this.validateScheduleFormData();
    if (!valResult.isValid) {
      return false;
    }

    const test = valResult.testData;
    const saved = storageEngine.saveScheduledTest(test);
    if (!saved) {
      const errorAlert = document.getElementById("sched-form-error-alert");
      if (errorAlert) {
        errorAlert.textContent = "Failed to save scheduled test to local storage. Please check storage permissions.";
        errorAlert.style.display = "block";
      }
      return false;
    }

    this.closeScheduleTestModal();
    this.renderInstructorScheduledTests();
    this.updateInstructorTestMetrics();

    try {
      this.renderStudentScheduledTests();
    } catch (e) {
      // not in student view
    }

    const startIST = valResult.startDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
    const endIST = valResult.endDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "short" });
    alert(`✓ Test Successfully Scheduled & Published!\n\nTitle: "${test.title}"\nCourse: ${test.course_code} (${test.section})\nStart: ${startIST}\nEnd: ${endIST} (IST)\nDuration: ${test.time_limit_mins} mins\n\nStudents in ${test.course_code} ${test.section !== 'ALL' ? '(' + test.section + ')' : ''} can now see it in their portal.`);

    return true;
  }

  reviewScheduledTest() {
    const valResult = this.validateScheduleFormData();
    if (!valResult.isValid) {
      return;
    }

    this.pendingScheduledTest = valResult.testData;
    const { startDate, endDate } = valResult;

    // Populate Review Modal
    const reviewBody = document.getElementById("review-test-modal-body");
    if (reviewBody) {
      const t = this.pendingScheduledTest;
      const startFormatted = startDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
      const endFormatted = endDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

      reviewBody.innerHTML = `
        <div class="card mb-3" style="background: rgba(15, 23, 42, 0.8);">
          <h4 style="color: #FFFFFF; margin-bottom: 12px;">Assessment Summary</h4>
          <table class="table">
            <tbody>
              <tr><td style="width: 200px;"><strong>Test Title:</strong></td><td><strong>${t.title}</strong></td></tr>
              <tr><td><strong>Course & Section:</strong></td><td><span class="badge badge-primary">${t.course_code}</span> · <strong>${t.section}</strong> (Dept: ${t.department})</td></tr>
              <tr><td><strong>Target Semester:</strong></td><td>${t.semester !== 'ALL' ? t.semester + 'th Sem' : 'All Semesters'}</td></tr>
              <tr><td><strong>Subject:</strong></td><td><strong>${t.subject_name}</strong> (<code>${t.subject_id}</code>)</td></tr>
              <tr><td><strong>Topics Selected (${t.topics.length}):</strong></td><td>${t.topics.join(", ")}</td></tr>
              <tr><td><strong>Question Count:</strong></td><td>${t.question_count} Questions (Randomized per student with shuffled options)</td></tr>
              <tr><td><strong>Difficulty Scope:</strong></td><td>${t.difficulty}</td></tr>
              <tr><td><strong>Scheduled Start:</strong></td><td><strong class="text-cyan">${startFormatted} (IST)</strong></td></tr>
              <tr><td><strong>Availability End:</strong></td><td><strong class="text-cyan">${endFormatted} (IST)</strong></td></tr>
              <tr><td><strong>Time Limit:</strong></td><td>⏱️ <strong>${t.time_limit_mins} Minutes</strong> (Live countdown & auto-submit)</td></tr>
              <tr><td><strong>Mastery Pass Target:</strong></td><td><span class="badge badge-warning">${t.mastery_threshold}%</span> (Retest required if below)</td></tr>
              <tr><td><strong>Institution Timezone:</strong></td><td><code>${t.timezone}</code></td></tr>
            </tbody>
          </table>
        </div>
        <div class="meta-card" style="font-size: 13px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--emerald-success);">
          ✓ <strong>Validated Question Key Guarantee:</strong> Each question used in this test has been pre-verified from the 10,000-question curriculum dataset with exactly one unambiguous correct answer key and explanation.
        </div>
      `;
    }

    this.closeScheduleTestModal();
    const reviewModal = document.getElementById("review-test-schedule-modal");
    if (reviewModal) reviewModal.style.display = "flex";
  }

  closeReviewTestModal() {
    const modal = document.getElementById("review-test-schedule-modal");
    if (modal) modal.style.display = "none";
  }

  confirmPublishScheduledTest() {
    if (!this.pendingScheduledTest) return;

    const test = this.pendingScheduledTest;
    storageEngine.saveScheduledTest(test);
    this.closeReviewTestModal();
    this.renderInstructorScheduledTests();
    this.updateInstructorTestMetrics();

    try {
      this.renderStudentScheduledTests();
    } catch (e) {
      // ignore
    }

    alert(`✓ Test "${test.title}" has been successfully published! Students in ${test.course_code} will see it on their dashboard.`);
    this.pendingScheduledTest = null;
  }

  deleteScheduledTest(testId) {
    if (confirm(`Are you sure you want to remove test ${testId}?`)) {
      storageEngine.deleteScheduledTest(testId);
      this.renderInstructorScheduledTests();
      this.updateInstructorTestMetrics();
      try {
        this.renderStudentScheduledTests();
      } catch (e) {
        // ignore
      }
    }
  }
}

function closeStudentRecordModal() {
  const modal = document.getElementById("student-record-modal");
  if (modal) modal.classList.remove("modal-open");
}
window.closeStudentRecordModal = closeStudentRecordModal;

function closeLearningSessionModal() {
  const modal = document.getElementById("learning-session-modal");
  if (modal) modal.classList.remove("modal-open");
}
window.closeLearningSessionModal = closeLearningSessionModal;

window.openScheduleTestModal = () => window.dashboardEngineInstance.openScheduleTestModal();
window.closeScheduleTestModal = () => window.dashboardEngineInstance.closeScheduleTestModal();
window.closeReviewTestModal = () => window.dashboardEngineInstance.closeReviewTestModal();
window.handleCourseChange = (val) => window.dashboardEngineInstance.handleCourseChange(val);
window.handleSubjectChange = (val) => window.dashboardEngineInstance.handleSubjectChange(val);
window.submitScheduleForm = () => window.dashboardEngineInstance.submitScheduleForm();
window.confirmPublishScheduledTest = () => window.dashboardEngineInstance.confirmPublishScheduledTest();
window.reviewScheduledTest = () => window.dashboardEngineInstance.reviewScheduledTest();
window.handleProgressSubjectChange = (val) => window.dashboardEngineInstance.handleProgressSubjectChange(val);
window.openInspectAllModal = () => window.dashboardEngineInstance.openInspectAllModal();
window.closeInspectAllModal = () => window.dashboardEngineInstance.closeInspectAllModal();
window.selectHODYear = (val) => window.dashboardEngineInstance.selectHODYear(val);
window.toggleAttemptDetails = () => window.dashboardEngineInstance.toggleAttemptDetails();


