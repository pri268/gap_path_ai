/**
 * GAPPath AI - College Computer Networks Prototype
 * Main Application Orchestrator with 3 Role-Based Portals & Adaptive Quiz Generation
 */

// Global State
window.gQuestionBank = null;
window.diagnosisEngineInstance = null;
window.conceptMapInstance = null;
window.practiceEngineInstance = null;
window.dashboardEngineInstance = null;
window.datasetInsightsInstance = null;

let activeLoginRole = "student"; // Default login portal tab
let currentActiveQuiz = null;
let currentQuestionIndex = 0;
let studentAnswers = {};
let currentSubmissionRecord = null;

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", async () => {
  await loadQuestionBank();
  initEngines();
  initEventHandlers();
  initAuthAndUI();
});

async function loadQuestionBank() {
  try {
    const resp = await fetch("data/computer_networks_question_bank.json");
    window.gQuestionBank = await resp.json();
    console.log("Loaded Question Bank with 10 CN concepts.");
  } catch (e) {
    console.error("Failed to load question bank:", e);
  }
}

function initEngines() {
  window.diagnosisEngineInstance = new DiagnosisEngine(window.gQuestionBank);
  window.conceptMapInstance = new ConceptMap("concept-map-container", (cid) => {
    window.openTargetedLesson(cid);
  });
  window.practiceEngineInstance = new PracticeEngine(window.gQuestionBank);
  window.tutorEngineInstance = new TutorEngine(window.gQuestionBank);
  window.scheduledTestEngineInstance = new ScheduledTestEngine(window.gQuestionBank);
  window.dashboardEngineInstance = new DashboardEngine();
  window.datasetInsightsInstance = new DatasetInsightsEngine();
}

function initEventHandlers() {
  // Login form submit
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleLoginSubmit();
    });
  }

  // Instructor search
  const instSearch = document.getElementById("instructor-search-input");
  if (instSearch) {
    instSearch.addEventListener("input", () => {
      window.dashboardEngineInstance.filterInstructorTable();
    });
  }

  // Instructor gap filter
  const instGapFilter = document.getElementById("instructor-gap-filter");
  if (instGapFilter) {
    instGapFilter.addEventListener("change", () => {
      window.dashboardEngineInstance.filterInstructorTable();
    });
  }

  // Instructor semester filter
  const instSemFilter = document.getElementById("instructor-sem-filter");
  if (instSemFilter) {
    instSemFilter.addEventListener("change", () => {
      window.dashboardEngineInstance.filterInstructorTable();
    });
  }

  // HOD search
  const hodSearch = document.getElementById("hod-search-input");
  if (hodSearch) {
    hodSearch.addEventListener("input", () => {
      window.dashboardEngineInstance.filterHODTable();
    });
  }

  // HOD semester filter
  const hodSemFilter = document.getElementById("hod-sem-filter");
  if (hodSemFilter) {
    hodSemFilter.addEventListener("change", () => {
      window.dashboardEngineInstance.filterHODTable();
    });
  }
}

// ==========================================
// AUTHENTICATION & UI VIEW GATEWAY
// ==========================================
function initAuthAndUI() {
  const loginScreen = document.getElementById("login-portal-screen");
  const appPortal = document.getElementById("app-portal-container");
  const userProfileEl = document.getElementById("header-user-profile");
  const currentUser = authEngine.getCurrentUser();

  if (!currentUser) {
    // Not logged in: Show Login Screen
    if (loginScreen) loginScreen.style.display = "block";
    if (appPortal) appPortal.style.display = "none";
    if (userProfileEl) userProfileEl.style.display = "none";
    setLoginPortalRole(activeLoginRole);
    return;
  }

  // Logged in: Show Main Application
  if (loginScreen) loginScreen.style.display = "none";
  if (appPortal) appPortal.style.display = "block";
  if (userProfileEl) {
    userProfileEl.style.display = "flex";
    const nameEl = document.getElementById("header-user-name");
    const roleEl = document.getElementById("header-user-role");
    const deptEl = document.getElementById("header-user-dept");

    if (nameEl) nameEl.textContent = currentUser.name;
    if (roleEl) {
      const roleBadges = {
        student: "🎓 Student",
        instructor: "👨‍🏫 Faculty",
        hod: "🏛️ Dept HOD"
      };
      roleEl.textContent = roleBadges[currentUser.role] || currentUser.role;
    }
    if (deptEl) deptEl.textContent = currentUser.department;
  }

  // Configure Navigation based on authenticated role
  configureNavForRole(currentUser.role);
}

function setLoginPortalRole(role) {
  activeLoginRole = role;
  
  // Update role tab buttons
  const roleButtons = ["student", "instructor", "hod"];
  roleButtons.forEach(r => {
    const btn = document.getElementById(`role-tab-btn-${r}`);
    if (btn) {
      if (r === role) {
        btn.classList.add("active-role-tab");
      } else {
        btn.classList.remove("active-role-tab");
      }
    }
  });

  // Update Portal Labels & Hints
  const titleEl = document.getElementById("login-portal-title");
  const descEl = document.getElementById("login-portal-desc");
  const passHintEl = document.getElementById("login-password-hint");
  const errorBox = document.getElementById("login-error-alert");

  if (errorBox) errorBox.style.display = "none";

  if (role === "student") {
    if (titleEl) titleEl.textContent = "Student Diagnostic Portal";
    if (descEl) descEl.textContent = "Sign in to take your diagnostic assessment, view concept status, and access practice retests.";
    if (passHintEl) passHintEl.textContent = "Initial Temporary Password: Your 10-digit registered phone number.";
  } else if (role === "instructor") {
    if (titleEl) titleEl.textContent = "Faculty / Course Instructor Portal";
    if (descEl) descEl.textContent = "Sign in to monitor course diagnostic reports, assess learning gaps, and review practice retests.";
    if (passHintEl) passHintEl.textContent = "Password: Your institutional faculty password.";
  } else if (role === "hod") {
    if (titleEl) titleEl.textContent = "Department Head (HOD) Portal";
    if (descEl) descEl.textContent = "Sign in to review departmental concept vulnerability heatmaps and cohort diagnostic analytics.";
    if (passHintEl) passHintEl.textContent = "Password: Your institutional HOD password.";
  }

  // Render demo account quick-fill chips for this role
  renderDemoAccountChips(role);
}

function renderDemoAccountChips(role) {
  const container = document.getElementById("demo-accounts-chips");
  if (!container) return;

  const accounts = (CONFIG.ACCOUNTS || []).filter(a => a.role === role);
  container.innerHTML = accounts.map(a => {
    const passLabel = role === "student" ? `Phone: ${a.phone}` : a.password;
    const details = a.section ? `${a.department} · ${a.section} · ${a.semester || '5th Sem'}` : a.department;
    return `
      <button type="button" class="btn-demo-chip" onclick="quickLoginDemoAccount('${a.email}', '${a.password}')" title="1-Click Sign In as ${a.name}">
        <strong>⚡ ${a.name}</strong> <small>(${details}) · Pass: <code>${passLabel}</code></small>
      </button>
    `;
  }).join("");
}

function quickFillCredentials(email, password) {
  const emailInput = document.getElementById("login-email-input");
  const passInput = document.getElementById("login-password-input");
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = password;
}

function quickLoginDemoAccount(email, password) {
  quickFillCredentials(email, password);
  handleLoginSubmit();
}

function handleLoginSubmit() {
  const emailInput = document.getElementById("login-email-input");
  const passInput = document.getElementById("login-password-input");
  const errorBox = document.getElementById("login-error-alert");

  const email = emailInput ? emailInput.value : "";
  const password = passInput ? passInput.value : "";

  // Reset any active session or timers from prior account
  if (window.scheduledTestEngineInstance && typeof window.scheduledTestEngineInstance.resetSessionState === "function") {
    window.scheduledTestEngineInstance.resetSessionState();
  }
  currentActiveQuiz = null;
  studentAnswers = {};
  currentSubmissionRecord = null;

  // Clear stale student badges to ensure fresh rendering on account switch
  const btnOngoing = document.getElementById("stu-sec-btn-ongoing");
  const btnUpcoming = document.getElementById("stu-sec-btn-upcoming");
  const countBadge = document.getElementById("stu-assigned-count-badge");
  if (btnOngoing) btnOngoing.innerHTML = "▶️ Ongoing Tests";
  if (btnUpcoming) btnUpcoming.innerHTML = "📅 Upcoming Tests";
  if (countBadge) countBadge.textContent = "Active Schedule";

  const res = authEngine.login(email, password, activeLoginRole);
  if (!res.success) {
    if (errorBox) {
      errorBox.style.display = "block";
      errorBox.textContent = res.error;
    }
  } else {
    if (errorBox) errorBox.style.display = "none";
    initAuthAndUI();
  }
}

function handleLogout() {
  if (window.scheduledTestEngineInstance && typeof window.scheduledTestEngineInstance.resetSessionState === "function") {
    window.scheduledTestEngineInstance.resetSessionState();
  }
  authEngine.logout();
  currentActiveQuiz = null;
  studentAnswers = {};
  currentSubmissionRecord = null;

  const btnOngoing = document.getElementById("stu-sec-btn-ongoing");
  const btnUpcoming = document.getElementById("stu-sec-btn-upcoming");
  const countBadge = document.getElementById("stu-assigned-count-badge");
  if (btnOngoing) btnOngoing.innerHTML = "▶️ Ongoing Tests";
  if (btnUpcoming) btnUpcoming.innerHTML = "📅 Upcoming Tests";
  if (countBadge) countBadge.textContent = "Active Schedule";

  initAuthAndUI();
}

function configureNavForRole(role) {
  const navTabs = [
    { id: "nav-tab-stu-dashboard", roles: ["student"] },
    { id: "nav-tab-my-progress", roles: ["student"] },
    { id: "nav-tab-student", roles: [] },
    { id: "nav-tab-results", roles: [] },
    { id: "nav-tab-practice", roles: [] },
    { id: "nav-tab-tutor", roles: ["student"] },
    { id: "nav-tab-instructor", roles: ["instructor"] },
    { id: "nav-tab-hod", roles: ["hod"] },
    { id: "nav-tab-dataset", roles: [] }
  ];

  navTabs.forEach(item => {
    const btn = document.getElementById(item.id);
    if (btn) {
      btn.style.display = item.roles.includes(role) ? "inline-flex" : "none";
    }
  });

  // Default view based on role
  if (role === "student") {
    switchTab("tab-stu-dashboard");
  } else if (role === "instructor") {
    switchTab("tab-instructor");
  } else if (role === "hod") {
    switchTab("tab-hod");
  }
}

// Switch Active View Tab
function switchTab(tabId) {
  const currentUser = authEngine.getCurrentUser();
  if (!currentUser) {
    initAuthAndUI();
    return;
  }

  // Security gate: prevent unauthorized tab visits
  if (currentUser.role === "student" && (tabId === "tab-instructor" || tabId === "tab-hod" || tabId === "tab-dataset")) {
    alert("Access Denied: Students are restricted to personal assessments and verified progress.");
    switchTab("tab-stu-dashboard");
    return;
  }
  if (currentUser.role === "instructor" && (tabId === "tab-hod" || tabId === "tab-stu-dashboard" || tabId === "tab-my-progress" || tabId === "tab-tutor" || tabId === "tab-scheduled-test")) {
    alert("Access Denied: Course Instructors are restricted to their assigned course portal.");
    switchTab("tab-instructor");
    return;
  }
  if (currentUser.role === "hod" && (tabId === "tab-instructor" || tabId === "tab-stu-dashboard" || tabId === "tab-my-progress" || tabId === "tab-tutor" || tabId === "tab-scheduled-test")) {
    alert("Access Denied: HODs are restricted to their assigned department portal.");
    switchTab("tab-hod");
    return;
  }

  const allTabs = [
    "tab-stu-dashboard", "tab-my-progress", "tab-student", "tab-results",
    "tab-practice", "tab-tutor", "tab-instructor", "tab-hod", "tab-dataset",
    "tab-scheduled-test"
  ];

  allTabs.forEach(t => {
    const el = document.getElementById(t);
    const navBtn = document.getElementById(`nav-${t}`);
    if (el) el.style.display = t === tabId ? "block" : "none";
    if (navBtn) {
      if (t === tabId) {
        navBtn.classList.add("nav-active");
      } else {
        navBtn.classList.remove("nav-active");
      }
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  // Render on switch
  if (tabId === "tab-stu-dashboard") {
    window.dashboardEngineInstance.renderStudentDashboard(currentUser);
  } else if (tabId === "tab-my-progress") {
    window.dashboardEngineInstance.renderStudentMyProgress(currentUser);
  } else if (tabId === "tab-tutor") {
    if (window.tutorEngineInstance) {
      window.tutorEngineInstance.initView(currentUser);
    }
  } else if (tabId === "tab-student") {
    // Check if active quiz exists or load
    loadOrResumeStudentQuiz();
  } else if (tabId === "tab-results") {
    if (!currentSubmissionRecord) {
      const records = storageEngine.getRecordsForStudent(currentUser.student_id, currentUser.email);
      if (records.length > 0) currentSubmissionRecord = records[0];
    }
    if (currentSubmissionRecord) {
      renderResultsView(currentSubmissionRecord);
    }
  } else if (tabId === "tab-instructor") {
    window.dashboardEngineInstance.renderInstructorDashboard();
  } else if (tabId === "tab-hod") {
    window.dashboardEngineInstance.renderHODDashboard();
  } else if (tabId === "tab-dataset") {
    if (!window.datasetInsightsInstance.stats) {
      window.datasetInsightsInstance.loadStats();
      window.datasetInsightsInstance.loadSampleCsv();
    }
  }
}

// ==========================================
// STUDENT QUIZ GENERATION & NAVIGATION
// ==========================================
function loadOrResumeStudentQuiz(forceNew = false) {
  const currentUser = authEngine.getCurrentUser();
  if (!currentUser || currentUser.role !== "student") return;

  // Retrieve or generate balanced quiz across 10 concepts
  currentActiveQuiz = quizGenerator.getOrGenerateQuiz(currentUser.student_id, window.gQuestionBank, forceNew);

  // Restore progress
  const progress = quizGenerator.getProgress(currentUser.student_id);
  if (progress && !forceNew) {
    studentAnswers = progress.answers || {};
    currentQuestionIndex = progress.currentIndex || 0;
  } else if (forceNew) {
    studentAnswers = {};
    currentQuestionIndex = 0;
    quizGenerator.saveProgress(currentUser.student_id, {}, 0);
  }

  // Update routing preview banner on student form
  updateStudentQuizMetadata(currentUser);

  // Render question
  renderQuizQuestion(currentQuestionIndex);
}

function updateStudentQuizMetadata(studentUser) {
  const idEl = document.getElementById("student-id");
  const nameEl = document.getElementById("student-name");
  const emailEl = document.getElementById("student-email");
  const deptEl = document.getElementById("student-department");
  const yearEl = document.getElementById("student-year");
  const courseEl = document.getElementById("student-course");
  const routingBadge = document.getElementById("student-routing-badge");

  const deptConfig = CONFIG.DEPARTMENTS[studentUser.department] || CONFIG.DEPARTMENTS.CSE;

  if (idEl) idEl.value = studentUser.student_id;
  if (nameEl) nameEl.value = studentUser.name;
  if (emailEl) emailEl.value = studentUser.email;
  if (deptEl) deptEl.value = studentUser.department;
  if (yearEl) yearEl.value = studentUser.year_semester || "3rd Year / 5th Sem";
  if (courseEl) courseEl.value = `${deptConfig.course_code} - ${deptConfig.course_name}`;

  if (routingBadge) {
    routingBadge.innerHTML = `
      <div class="routing-badge-card">
        <span class="routing-icon">🔒</span>
        <div class="routing-text">
          <strong>Institutional Assignment Policy:</strong>
          Upon submission, this report will automatically attach to:
          <span class="highlight-role">Course Instructor: ${deptConfig.instructor.name}</span> (${deptConfig.instructor.email}) & 
          <span class="highlight-role">Dept HOD: ${deptConfig.hod.name}</span> (${deptConfig.hod.email}).
          <div class="text-xs text-muted mt-1">Institutional rule: Determined strictly by Department matrix. Principal recipient prohibited.</div>
        </div>
      </div>
    `;
  }
}

// Render Diagnostic Quiz Item
function renderQuizQuestion(index) {
  if (!currentActiveQuiz || !currentActiveQuiz.questions) return;
  const questions = currentActiveQuiz.questions;
  if (index < 0 || index >= questions.length) return;

  currentQuestionIndex = index;
  const qItem = questions[index];
  const currentUser = authEngine.getCurrentUser();

  // Save current progress
  if (currentUser) {
    quizGenerator.saveProgress(currentUser.student_id, studentAnswers, currentQuestionIndex);
  }

  // Update question navigation dots (1 to 10)
  const trackerEl = document.getElementById("quiz-nav-dots");
  if (trackerEl) {
    trackerEl.innerHTML = questions.map((q, i) => {
      const isAnswered = !!studentAnswers[q.concept_id];
      const isCurrent = i === currentQuestionIndex;
      return `
        <button class="nav-dot ${isCurrent ? 'dot-current' : ''} ${isAnswered ? 'dot-answered' : ''}"
                onclick="renderQuizQuestion(${i})" title="${q.concept_name}">
          ${i + 1}
        </button>
      `;
    }).join("");
  }

  // Update Question Content
  const container = document.getElementById("diagnostic-question-card");
  if (container) {
    const chosenKey = studentAnswers[qItem.concept_id] || null;

    container.innerHTML = `
      <div class="question-header">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div class="q-domain-tag">Concept Area ${index + 1} of 10 · ${qItem.concept_category} (Tier ${qItem.concept_tier})</div>
          <span class="badge badge-secondary">Attempt: ${currentActiveQuiz.attempt_id} · Question ID: ${qItem.question_id}</span>
        </div>
        <div class="q-concept-name">${qItem.concept_name}</div>
        <div class="q-prereqs">Prerequisites: ${qItem.prerequisites && qItem.prerequisites.length > 0 ? qItem.prerequisites.join(", ") : "None (Foundational Entry Point)"}</div>
      </div>

      <div class="q-text-box">
        <p class="q-scenario">${qItem.text}</p>
      </div>

      <div class="q-options-list">
        ${qItem.options.map(opt => `
          <label class="q-option-card ${chosenKey === opt.key ? 'opt-selected' : ''}">
            <input type="radio" name="opt_${qItem.concept_id}" value="${opt.key}" 
                   ${chosenKey === opt.key ? 'checked' : ''}
                   onchange="handleOptionSelect('${qItem.concept_id}', '${opt.key}')" />
            <div class="opt-key-circle">${opt.key}</div>
            <div class="opt-body">
              <div class="opt-text">${opt.text}</div>
            </div>
          </label>
        `).join("")}
      </div>

      <div class="quiz-controls-row">
        <button class="btn btn-secondary" onclick="renderQuizQuestion(${index - 1})" ${index === 0 ? 'disabled' : ''}>
          ← Previous Concept
        </button>
        <button class="btn btn-outline-warning" onclick="clearOptionSelect('${qItem.concept_id}')">
          Clear Selection
        </button>
        ${index < questions.length - 1 ? `
          <button class="btn btn-primary" onclick="renderQuizQuestion(${index + 1})">
            Next Concept →
          </button>
        ` : `
          <button class="btn btn-success btn-submit-quiz" onclick="submitDiagnosticQuiz()">
            Submit Assessment & Generate Diagnosis ✓
          </button>
        `}
      </div>
    `;
  }
}

function handleOptionSelect(conceptId, key) {
  studentAnswers[conceptId] = key;
  const currentUser = authEngine.getCurrentUser();
  if (currentUser) {
    quizGenerator.saveProgress(currentUser.student_id, studentAnswers, currentQuestionIndex);
  }
  renderQuizQuestion(currentQuestionIndex);
}

function clearOptionSelect(conceptId) {
  delete studentAnswers[conceptId];
  const currentUser = authEngine.getCurrentUser();
  if (currentUser) {
    quizGenerator.saveProgress(currentUser.student_id, studentAnswers, currentQuestionIndex);
  }
  renderQuizQuestion(currentQuestionIndex);
}

// Submit Diagnostic Assessment
function submitDiagnosticQuiz() {
  const currentUser = authEngine.getCurrentUser();
  if (!currentUser || !currentActiveQuiz) return;
  const questions = currentActiveQuiz.questions;

  // Check unanswered items
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(studentAnswers).filter(k => studentAnswers[k]).length;
  const unansweredCount = totalQuestions - answeredCount;

  if (unansweredCount > 0) {
    const proceed = confirm(
      `⚠️ Insufficient Evidence Notice:\nYou have ${unansweredCount} unanswered questions.\n\n` +
      `Under our diagnostic policy, unanswered items will be evaluated as "Insufficient Evidence to Assess Confidently" and will not produce a positive signal.\n\n` +
      `Do you want to submit your assessment now?`
    );
    if (!proceed) return;
  }

  // Gather student info strictly from authenticated user
  const studentInfo = {
    student_id: currentUser.student_id,
    name: currentUser.name,
    email: currentUser.email,
    department: currentUser.department,
    year_semester: currentUser.year_semester || "3rd Year / 5th Sem"
  };

  // Run explainable diagnosis with active quiz mapping
  const record = window.diagnosisEngineInstance.evaluate(studentInfo, studentAnswers, currentActiveQuiz);
  currentSubmissionRecord = record;

  // Clear active in-flight attempt since submitted
  quizGenerator.clearActiveQuiz(currentUser.student_id);

  // Save to persistent storage
  storageEngine.saveDiagnosticSubmission(record);

  // Switch to Results Tab
  switchTab("tab-results");
}

// Render Results & Diagnosis View
function renderResultsView(record) {
  if (!record) return;

  // Header info & Accuracy metrics (Requirement 4)
  const scoreVal = document.getElementById("res-score-value");
  const pctVal = document.getElementById("res-pct-value");
  const reportCode = document.getElementById("res-report-id");
  const primaryGap = document.getElementById("res-primary-gap");
  const routingCert = document.getElementById("res-routing-cert");
  const cautionBox = document.getElementById("res-caution-notice");

  const totalQuestions = record.total_questions || 10;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  if (record.item_responses) {
    const items = Object.values(record.item_responses);
    correctCount = items.filter(it => it.is_correct).length;
    unansweredCount = items.filter(it => !it.chosen_key || it.status_type === "insufficient").length;
    wrongCount = items.length - correctCount - unansweredCount;
  } else {
    correctCount = record.score || 0;
    wrongCount = Math.max(0, totalQuestions - correctCount);
    unansweredCount = 0;
  }

  const attemptedCount = correctCount + wrongCount;
  const accuracyPct = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  const totalEl = document.getElementById("res-total-value");
  const correctEl = document.getElementById("res-correct-value");
  const wrongEl = document.getElementById("res-wrong-value");
  const unansweredEl = document.getElementById("res-unanswered-value");
  const accuracySummaryEl = document.getElementById("res-accuracy-summary");
  const accuracyBreakdownEl = document.getElementById("res-accuracy-breakdown");

  if (totalEl) totalEl.textContent = totalQuestions;
  if (correctEl) correctEl.textContent = correctCount;
  if (wrongEl) wrongEl.textContent = wrongCount;
  if (unansweredEl) unansweredEl.textContent = unansweredCount;
  if (accuracySummaryEl) accuracySummaryEl.textContent = `${correctCount} of ${attemptedCount} attempted — ${accuracyPct}% accuracy`;
  if (accuracyBreakdownEl) accuracyBreakdownEl.textContent = `${correctCount} correct of ${attemptedCount} attempted (${accuracyPct}%)`;

  if (scoreVal) scoreVal.textContent = `${record.score} / ${record.total_questions}`;
  if (pctVal) pctVal.textContent = `${record.percentage}% Positive Signals`;
  if (reportCode) reportCode.textContent = record.report_id;
  if (primaryGap) primaryGap.textContent = record.primary_gap_name;

  if (routingCert) {
    routingCert.innerHTML = `
      <div class="routing-cert-box">
        <div class="cert-title">📋 Institutional Report Dispatch Verification</div>
        <div class="cert-details">
          <div>Report ID: <strong>${record.report_id}</strong> · Attempt ID: <code>${record.quiz_attempt_id || 'ATT-2026-STABLE'}</code></div>
          <div>Submitted: <strong>${new Date(record.submitted_at).toLocaleString()}</strong></div>
          <div>Course: <strong>${record.course_code} - ${record.course_name}</strong></div>
          <div>Dispatched to Course Instructor: <strong>${record.assigned_instructor.name}</strong> (${record.assigned_instructor.email})</div>
          <div>Dispatched to Dept HOD: <strong>${record.assigned_hod.name}</strong> (${record.assigned_hod.email})</div>
          <div class="text-xs text-muted mt-1">Status: Verified Delivered · Principal role omitted per institutional governance.</div>
        </div>
      </div>
    `;
  }

  if (cautionBox) {
    cautionBox.innerHTML = `
      <div class="caution-banner">
        <strong>ℹ️ Formative Diagnostic Cautious Language Standard:</strong>
        ${CONFIG.TERMINOLOGY.CAUTION_NOTICE}
        ${record.is_prereq_cascade ? `<div class="mt-1 text-warning">⚠️ <strong>Prerequisite Cascade Detected:</strong> Root foundational concept (${record.root_prerequisite_id}) flagged; addressing root gap will restore downstream comprehension.</div>` : ''}
      </div>
    `;
  }

  // Render Concept Status Map
  window.conceptMapInstance.render(record, window.gQuestionBank);

  // Render Detailed Evidence Table
  renderEvidenceTable(record);

  // Setup Remediation Button
  const remBtn = document.getElementById("btn-start-remediation");
  if (remBtn) {
    if (record.primary_likely_gap && record.primary_likely_gap !== "NONE") {
      remBtn.style.display = "inline-flex";
      remBtn.innerHTML = `Start Targeted Remediation: ${record.primary_gap_name} →`;
      remBtn.onclick = () => {
        openTargetedLesson(record.primary_likely_gap, record.report_id);
      };
    } else {
      remBtn.style.display = "none";
    }
  }
}

function renderEvidenceTable(record) {
  const container = document.getElementById("results-evidence-table");
  if (!container || !window.gQuestionBank) return;

  const concepts = window.gQuestionBank.concepts;
  const rows = concepts.map((c, i) => {
    const resp = record.item_responses ? record.item_responses[c.id] : null;
    const isCorrect = resp ? resp.is_correct : false;

    let badgeClass = "badge-secondary";
    if (resp) {
      if (resp.status_type === "positive" || resp.is_correct) badgeClass = "badge-success";
      else if (resp.status_type === "prereq_risk") badgeClass = "badge-warning";
      else if (resp.status_type === "gap") badgeClass = "badge-danger";
    }

    return `
      <tr>
        <td><strong>#${i + 1}</strong></td>
        <td>
          <strong>${c.name}</strong><br>
          <small class="text-muted">${c.id} · Tier ${c.tier} ${resp && resp.question_id ? `(${resp.question_id})` : ''}</small>
        </td>
        <td><span class="badge ${badgeClass}">${resp ? resp.status : 'Untested'}</span></td>
        <td>Option ${resp ? (resp.chosen_key || '—') : '—'}</td>
        <td>
          <div class="evidence-notes">
            ${resp && resp.misconception ? `<strong>Misconception Analysis:</strong> ${resp.misconception}<br>` : ''}
            <small class="text-muted">${resp && resp.explanation ? resp.explanation : c.diagnostic_question.explanation}</small>
          </div>
        </td>
        <td>
          <button class="btn btn-xs btn-outline-secondary" onclick="window.openTargetedLesson('${c.id}', '${record.report_id}')">
            View Lesson
          </button>
        </td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>#</th>
          <th>Concept & Tier</th>
          <th>Diagnostic Signal</th>
          <th>Chosen</th>
          <th>Observed Evidence & Rationale</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// Open Targeted Micro-Lesson & Retest
function openTargetedLesson(conceptId, reportId = null) {
  const activeRepId = reportId || (currentSubmissionRecord ? currentSubmissionRecord.report_id : null);
  switchTab("tab-practice");
  window.practiceEngineInstance.loadLessonAndRetest(conceptId, activeRepId);
}
window.openTargetedLesson = openTargetedLesson;

// Open AI Tutor & Learning for a specific concept (Requirement 1 & 5)
function openAITutorConcept(conceptId) {
  switchTab("tab-tutor");
  if (window.tutorEngineInstance) {
    window.tutorEngineInstance.setMode("learning");
    window.tutorEngineInstance.openConceptLesson(conceptId);
  }
}
window.openAITutorConcept = openAITutorConcept;

function viewStudentReportFromDashboard(reportId) {
  const record = storageEngine.getRecordById(reportId);
  if (record) {
    currentSubmissionRecord = record;
    switchTab("tab-results");
  }
}
window.viewStudentReportFromDashboard = viewStudentReportFromDashboard;

function startStudentDiagnostic(forceNew = false) {
  switchTab("tab-student");
  loadOrResumeStudentQuiz(forceNew);
}
window.startStudentDiagnostic = startStudentDiagnostic;

function resumeStudentQuiz() {
  switchTab("tab-student");
}
window.resumeStudentQuiz = resumeStudentQuiz;

function discardAndRestartQuiz() {
  const currentUser = authEngine.getCurrentUser();
  if (currentUser) {
    quizGenerator.clearActiveQuiz(currentUser.student_id);
    loadOrResumeStudentQuiz(true);
  }
}
window.discardAndRestartQuiz = discardAndRestartQuiz;

// Print Report Trigger
function printStudentReport() {
  window.print();
}

function openAITutor() {
  switchTab("tab-tutor");
}
window.openAITutor = openAITutor;

async function startScheduledTest(testId) {
  if (window.scheduledTestEngineInstance) {
    await window.scheduledTestEngineInstance.startTest(testId);
  }
}
window.startScheduledTest = startScheduledTest;
