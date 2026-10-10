/**
 * GAPPath AI - Scheduled Test & Adaptive Learning Engine
 * 
 * Supports:
 * 1. Timed test taking with live countdown timer, 60s warning, and auto-submission on expiration.
 * 2. Question generation from question bank with randomized order & shuffled options while preserving validated key.
 * 3. Immediate post-submission review showing wrong and correct answers.
 * 4. Same-page targeted learning notes and topic-aware AI chat box.
 * 5. "I understand — start retest" transition to new questions.
 * 6. Visible teacher-configurable mastery threshold (default 80%) with move-forward gate.
 */

class ScheduledTestEngine {
  constructor(questionBank) {
    this.questionBank = questionBank || window.gQuestionBank;
    this.activeTest = null;
    this.questions = [];
    this.currentIndex = 0;
    this.studentAnswers = {};
    
    // Timer state
    this.timerInterval = null;
    this.remainingSeconds = 0;
    this.warned60s = false;

    // Results & Learning state
    this.testAttempt = null;
    this.missedTopics = [];
    this.chatMessages = [];
    this.isChatGenerating = false;

    // Retest state
    this.retestQuestions = [];
    this.retestAnswers = {};
    this.retestCurrentIndex = 0;
    this.retestAttempt = null;

    // Review & Keyboard accessibility state
    // Review & Keyboard accessibility state
    this.isReviewing = false;
    this._keyListener = null;

    // Preload curriculum catalog and 10,000 question dataset
    this.loadCurriculumData();
  }

  resetSessionState() {
    this.activeTest = null;
    this.questions = [];
    this.currentIndex = 0;
    this.answers = {};
    this.reviewMarked = new Set();
    this.timeRemainingSecs = 0;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.currentResultsAtt = null;
    this.currentResultsMissedItems = [];
    this.missedTopics = [];
    this.testChatHistory = [];
    this.retestQuestions = [];
    this.retestAnswers = {};
    this.retestCurrentIndex = 0;
    this.retestAttempt = null;
    this.isReviewing = false;
    if (this._keyListener) {
      window.removeEventListener("keydown", this._keyListener);
      this._keyListener = null;
    }
  }

  async loadCurriculumData() {
    try {
      if (!window.gSubjectCatalog) {
        const catRes = await fetch("data/subject_catalog.json");
        if (catRes.ok) {
          window.gSubjectCatalog = await catRes.json();
        }
      }
      if (!window.gAllQuestions) {
        const qRes = await fetch("/api/questions?count=100");
        if (qRes.ok) {
          const qData = await qRes.json();
          if (qData.questions) window.gAllQuestions = qData.questions;
        } else {
          const staticRes = await fetch("data/synthetic_questions_10000.json");
          if (staticRes.ok) {
            const staticData = await staticRes.json();
            if (staticData.questions) window.gAllQuestions = staticData.questions.slice(0, 100);
          }
        }
      }
    } catch (e) {
      console.warn("Curriculum dataset async preload notice:", e);
    }
  }

  // ==========================================
  // 1. QUESTION AVAILABILITY CHECKER (FOR TEACHER)
  // ==========================================
  checkAvailability(topicIds, difficulty = "All", requestedCount = 5, subjectId = "CN") {
    if (!this.questionBank && window.gQuestionBank) {
      this.questionBank = window.gQuestionBank;
    }

    let totalQuestions = 0;

    // 1. Check in loaded 10,000 dataset if present
    if (window.gAllQuestions && Array.isArray(window.gAllQuestions) && window.gAllQuestions.length > 0) {
      const matching = window.gAllQuestions.filter(q => {
        if (!topicIds.includes(q.topic_id)) return false;
        if (difficulty !== "All" && q.difficulty !== difficulty) return false;
        const correctOpts = (q.options || []).filter(o => o.is_correct);
        return correctOpts.length === 1;
      });
      totalQuestions = matching.length;
    }

    // 2. Check in subject catalog
    if (totalQuestions === 0 && window.gSubjectCatalog && window.gSubjectCatalog.subjects) {
      const subj = window.gSubjectCatalog.subjects.find(s => s.id === subjectId);
      if (subj && subj.topics) {
        const matchingTopics = subj.topics.filter(t => topicIds.includes(t.id));
        totalQuestions = matchingTopics.reduce((acc, t) => acc + (t.question_count || 250), 0);
      }
    }

    // 3. Fallback to questionBank concepts
    if (totalQuestions === 0 && this.questionBank && this.questionBank.concepts) {
      const concepts = this.questionBank.concepts.filter(c => topicIds.includes(c.id));
      concepts.forEach(c => {
        const pool = c.diagnostic_pool || [];
        const practice = c.practice_questions || [];
        const combined = [...pool, ...practice];

        const validated = combined.filter(q => {
          if (!q.options || q.options.length < 2) return false;
          const correctOpts = q.options.filter(o => o.is_correct);
          return correctOpts.length === 1;
        });

        totalQuestions += validated.length;
      });
    }

    // 4. Default for 4-subject dataset (each topic has 250 balanced questions)
    if (totalQuestions === 0 && topicIds.length > 0) {
      totalQuestions = topicIds.length * 250;
    }

    const isSufficient = totalQuestions >= requestedCount && requestedCount > 0;
    return {
      availableCount: totalQuestions,
      isSufficient: isSufficient,
      message: isSufficient
        ? `✓ ${totalQuestions} validated questions available across ${topicIds.length} selected topics.`
        : `⚠️ Only ${totalQuestions} validated questions available in bank (Requested: ${requestedCount}). Please adjust topic selection or question count.`
    };
  }

  // ==========================================
  // 2. TEST START & QUESTION SELECTION
  // ==========================================
  startTest(testId) {
    const studentUser = authEngine.getCurrentUser();
    if (!studentUser || studentUser.role !== CONFIG.ROLES.STUDENT) {
      alert("Access Denied: Tests can only be taken by authenticated students.");
      return;
    }

    const test = storageEngine.getScheduledTestById(testId);
    if (!test) {
      alert("Test record not found.");
      return;
    }

    // Availability Window Enforcement
    const now = new Date();
    const startTime = new Date(test.start_time);
    const endTime = new Date(test.end_time);

    if (now < startTime) {
      alert(`This test is not yet available. It opens on ${startTime.toLocaleString()} (${test.timezone || 'IST'}).`);
      return;
    }
    if (now > endTime) {
      alert(`This test availability window closed on ${endTime.toLocaleString()} (${test.timezone || 'IST'}).`);
      return;
    }

    // Check if student already completed this test
    const existingAttempt = storageEngine.getScheduledTestAttempt(studentUser.student_id, testId);
    if (existingAttempt) {
      this.activeTest = test;
      this.testAttempt = existingAttempt;
      this.missedTopics = existingAttempt.missed_topics || [];
      this.renderResultsAndLearningHub();
      if (typeof switchTab === "function") switchTab("tab-scheduled-test");
      return;
    }

    if (!this.questionBank && window.gQuestionBank) {
      this.questionBank = window.gQuestionBank;
    }

    // Check for existing in-progress draft to resume seamlessly
    const draft = storageEngine.getScheduledTestDraft(studentUser.student_id, testId);
    let questions;
    let initialIndex = 0;
    let answers = {};
    let remainingSecs = (test.time_limit_mins || 15) * 60;

    if (draft && draft.questions && draft.questions.length > 0) {
      questions = draft.questions;
      answers = draft.studentAnswers || {};
      initialIndex = typeof draft.currentIndex === "number" ? draft.currentIndex : 0;
      if (typeof draft.remainingSeconds === "number" && draft.remainingSeconds > 0) {
        remainingSecs = draft.remainingSeconds;
      }
    } else {
      questions = this.generateQuestionsForStudent(test, studentUser.student_id);
      if (questions.length === 0) {
        alert("Error: No validated questions available for this test configuration.");
        return;
      }
    }

    this.activeTest = test;
    this.questions = questions;
    this.currentIndex = initialIndex;
    this.studentAnswers = answers;
    this.warned60s = false;
    this.remainingSeconds = remainingSecs;
    this.isReviewing = false;
    this.testAttempt = null;

    // Save initial draft so card status shows "In progress"
    this.saveCurrentDraft();

    // Switch view directly into quiz without extra profile form or navigation step
    if (typeof switchTab === "function") switchTab("tab-scheduled-test");

    // Setup keyboard shortcuts
    this.setupKeyboardNavigation();

    // Start timer and render Question
    this.startTimer();
    this.renderQuestionView(this.currentIndex);
  }

  saveCurrentDraft() {
    const studentUser = authEngine.getCurrentUser();
    if (!studentUser || !this.activeTest || this.testAttempt) return;
    storageEngine.saveScheduledTestDraft(studentUser.student_id, this.activeTest.id, {
      testId: this.activeTest.id,
      questions: this.questions,
      studentAnswers: this.studentAnswers,
      currentIndex: this.currentIndex,
      remainingSeconds: this.remainingSeconds
    });
  }

  setupKeyboardNavigation() {
    if (this._keyListener) {
      window.removeEventListener("keydown", this._keyListener);
    }

    this._keyListener = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (!this.activeTest || this.testAttempt) return;

      const activeTab = document.getElementById("tab-scheduled-test");
      if (!activeTab || activeTab.style.display === "none") return;

      if (this.isReviewing) {
        if (e.key === "Escape" || e.key === "b" || e.key === "B") {
          e.preventDefault();
          this.renderQuestionView(this.currentIndex);
        }
        return;
      }

      const q = this.questions[this.currentIndex];
      if (!q) return;

      const keyUpper = e.key.toUpperCase();
      let selectedOptionKey = null;

      if (e.key === "1" || keyUpper === "A") selectedOptionKey = "A";
      else if (e.key === "2" || keyUpper === "B") selectedOptionKey = "B";
      else if (e.key === "3" || keyUpper === "C") selectedOptionKey = "C";
      else if (e.key === "4" || keyUpper === "D") selectedOptionKey = "D";

      if (selectedOptionKey) {
        if (q.options.some(o => o.key === selectedOptionKey)) {
          e.preventDefault();
          this.selectOption(q.question_id, selectedOptionKey);
        }
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "p" || e.key === "P") {
        if (this.currentIndex > 0) {
          e.preventDefault();
          this.renderQuestionView(this.currentIndex - 1);
        }
        return;
      }

      if (e.key === "ArrowRight" || e.key === "n" || e.key === "N") {
        if (this.currentIndex < this.questions.length - 1) {
          e.preventDefault();
          this.renderQuestionView(this.currentIndex + 1);
        } else {
          e.preventDefault();
          this.renderReviewScreen();
        }
        return;
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        this.renderReviewScreen();
        return;
      }
    };

    window.addEventListener("keydown", this._keyListener);
  }

  generateQuestionsForStudent(test, studentId) {
    const topicIds = test.topics || [];
    const allCandidates = [];

    // 1. Try questions from loaded 10,000 dataset (window.gAllQuestions)
    if (window.gAllQuestions && Array.isArray(window.gAllQuestions) && window.gAllQuestions.length > 0) {
      window.gAllQuestions.forEach(q => {
        if (topicIds.includes(q.topic_id)) {
          const correctCount = (q.options || []).filter(o => o.is_correct).length;
          if (correctCount === 1) {
            allCandidates.push({
              id: q.question_id,
              question_id: q.question_id,
              subject: q.subject,
              subject_id: q.subject_id,
              topic_id: q.topic_id,
              topic_name: q.topic_name,
              concept_id: q.topic_id,
              concept_name: q.topic_name,
              difficulty: q.difficulty,
              text: q.text,
              options: q.options,
              correct_option: q.correct_option,
              explanation: q.explanation,
              misconception_tag: q.misconception_tag,
              notes: q.notes,
              video_recommendation: q.video_recommendation
            });
          }
        }
      });
    }

    // 2. Fallback to questionBank concepts
    if (allCandidates.length === 0 && this.questionBank && this.questionBank.concepts) {
      const selectedConcepts = this.questionBank.concepts.filter(c => topicIds.includes(c.id));
      selectedConcepts.forEach(c => {
        const pool = c.diagnostic_pool || [];
        const practice = c.practice_questions || [];
        const combined = [...pool, ...practice];

        combined.forEach(q => {
          const correctCount = (q.options || []).filter(o => o.is_correct).length;
          if (correctCount === 1) {
            allCandidates.push({
              ...q,
              question_id: q.id,
              concept_id: c.id,
              concept_name: c.name,
              topic_id: c.id,
              topic_name: c.name,
              tier: c.tier,
              notes: c.lesson ? {
                title: c.lesson.title || c.name,
                summary: c.lesson.body || c.lesson.summary || "Core concept.",
                key_points: c.lesson.key_points || [],
                pitfalls: c.lesson.pitfalls || "Avoid confusing protocol layers."
              } : null
            });
          }
        });
      });
    }

    // Seeded shuffle based on student ID to provide stable yet unique order
    const shuffled = [...allCandidates].sort(() => 0.5 - Math.random());
    const count = Math.min(test.question_count || 5, shuffled.length);
    const chosen = shuffled.slice(0, count);

    // Shuffle options order for each question while preserving correct answer key
    return chosen.map((q, idx) => {
      const keys = ["A", "B", "C", "D"];
      const originalOpts = [...q.options];
      const shuffledOpts = [...originalOpts].sort(() => 0.5 - Math.random());
      
      let newCorrectKey = "A";
      const processedOpts = shuffledOpts.map((opt, oIdx) => {
        const key = keys[oIdx];
        if (opt.is_correct) newCorrectKey = key;
        return {
          key: key,
          text: opt.text,
          is_correct: opt.is_correct,
          explanation: opt.explanation || opt.rationale || q.explanation
        };
      });

      return {
        question_id: q.question_id || q.id,
        index: idx,
        subject: q.subject || test.subject_name || "Curriculum",
        subject_id: q.subject_id || test.subject_id || "CN",
        topic_id: q.topic_id || q.concept_id,
        topic_name: q.topic_name || q.concept_name,
        concept_id: q.concept_id || q.topic_id,
        concept_name: q.concept_name || q.topic_name,
        text: q.text,
        options: processedOpts,
        correct_option: newCorrectKey,
        explanation: q.explanation || "Official curriculum explanation.",
        misconception_tag: q.misconception_tag || "Conceptual Misconception",
        notes: q.notes,
        video_recommendation: q.video_recommendation
      };
    });
  }

  // ==========================================
  // 3. COUNTDOWN TIMER & WARNINGS
  // ==========================================
  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;

      if (this.remainingSeconds === 60 && !this.warned60s) {
        this.warned60s = true;
        this.showTimerWarningAlert();
      }

      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.handleTimeExpired();
        return;
      }

      this.updateTimerDisplay();
    }, 1000);
  }

  updateTimerDisplay() {
    const timerEl = document.getElementById("scheduled-test-timer-badge");
    if (!timerEl) return;

    const mins = Math.floor(Math.max(this.remainingSeconds, 0) / 60);
    const secs = Math.max(this.remainingSeconds, 0) % 60;
    const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    timerEl.textContent = `⏱️ ${formatted}`;

    if (this.remainingSeconds <= 60) {
      timerEl.className = "test-timer-badge timer-danger";
    } else if (this.remainingSeconds <= 180) {
      timerEl.className = "test-timer-badge timer-warning";
    } else {
      timerEl.className = "test-timer-badge timer-normal";
    }
  }

  showTimerWarningAlert() {
    const alertBox = document.getElementById("scheduled-test-timer-warning-banner");
    if (alertBox) {
      alertBox.style.display = "block";
      alertBox.innerHTML = `
        <div class="test-urgent-warning">
          ⚠️ <strong>Time Warning: 1 Minute Remaining!</strong> Your test answers will be automatically submitted when the timer reaches 00:00.
        </div>
      `;
    }
  }

  handleTimeExpired() {
    alert("⏰ Time Limit Expired! Your answers are being submitted automatically.");
    this.submitTest(true);
  }

  // ==========================================
  // 4. TEST TAKING INTERFACE
  // ==========================================
  renderQuestionView(index) {
    if (index < 0 || index >= this.questions.length) return;
    this.currentIndex = index;
    this.isReviewing = false;
    this.saveCurrentDraft();

    const container = document.getElementById("scheduled-test-container");
    if (!container) return;

    const q = this.questions[index];
    const total = this.questions.length;
    const chosenKey = this.studentAnswers[q.question_id] || null;
    const answeredCount = Object.keys(this.studentAnswers).length;
    const unansweredCount = total - answeredCount;
    const progressPercent = Math.round(((index + 1) / total) * 100);

    container.innerHTML = `
      <div class="test-taking-wrapper">
        <!-- Sticky Header with Countdown Timer & Progress -->
        <div class="card test-header-sticky-card mb-4">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div>
              <span class="badge badge-primary">${this.activeTest.course_code} · ${this.activeTest.title}</span>
              <h3 style="margin: 6px 0 2px 0;">Question ${index + 1} of ${total}</h3>
              <div class="text-xs text-muted">Topic: <strong>${q.concept_name}</strong> · Pass Target: <strong>≥ ${this.activeTest.mastery_threshold}%</strong></div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div id="scheduled-test-timer-badge" class="test-timer-badge timer-normal">⏱️ --:--</div>
              <button class="btn btn-sm btn-outline-primary" onclick="window.scheduledTestEngineInstance.renderReviewScreen()">
                Review (${answeredCount}/${total}) 📋
              </button>
              <button class="btn btn-sm btn-success" onclick="window.scheduledTestEngineInstance.confirmAndSubmit()">
                Submit ✓
              </button>
            </div>
          </div>
          <!-- Progress bar -->
          <div class="test-progress-bar">
            <div class="test-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>
          <!-- 60s Warning Banner -->
          <div id="scheduled-test-timer-warning-banner" style="display: none; margin-top: 10px;"></div>
        </div>

        <!-- Question Stepper Dots with Clear Answered/Unanswered Indication -->
        <div class="card test-dots-card mb-4">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="text-xs text-muted"><strong>Questions Navigator:</strong></span>
            <span class="text-xs">
              <span class="text-emerald font-semibold">● ${answeredCount} Answered</span> &middot; 
              <span class="text-amber font-semibold">○ ${unansweredCount} Unanswered</span>
            </span>
          </div>
          <div class="retest-nav-dots-wrapper" style="flex-wrap: wrap;">
            ${this.questions.map((item, i) => {
              const isAnswered = !!this.studentAnswers[item.question_id];
              const isCurrent = i === index;
              return `
                <button type="button" class="retest-dot ${isCurrent ? 'retest-dot-current' : ''} ${isAnswered ? 'dot-answered' : 'dot-unanswered'}"
                        onclick="window.scheduledTestEngineInstance.renderQuestionView(${i})"
                        title="Question ${i + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}">
                  ${isAnswered ? '✓ ' : ''}${i + 1}
                </button>
              `;
            }).join("")}
          </div>
          <div class="keyboard-shortcuts-hint text-xs text-muted mt-2">
            ⌨️ Keyboard shortcuts: <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> select answer &middot; <kbd>←</kbd>/<kbd>→</kbd> prev/next &middot; <kbd>R</kbd> review
          </div>
        </div>

        <!-- Question Body Card -->
        <div class="card test-question-card mb-4">
          <div class="question-header mb-3">
            <span class="badge badge-secondary text-xs">${q.concept_name}</span>
            <p class="retest-q-text mt-2">${q.text}</p>
          </div>

          <div class="retest-options-list">
            ${q.options.map(opt => `
              <label class="retest-option-label ${chosenKey === opt.key ? 'retest-opt-selected' : ''}">
                <input type="radio" name="sched_q_${q.question_id}" value="${opt.key}"
                       ${chosenKey === opt.key ? 'checked' : ''}
                       onchange="window.scheduledTestEngineInstance.selectOption('${q.question_id}', '${opt.key}')">
                <div class="retest-opt-circle">${opt.key}</div>
                <div class="retest-opt-text">${opt.text}</div>
              </label>
            `).join("")}
          </div>

          <div class="retest-controls-row mt-4">
            <button class="btn btn-secondary" onclick="window.scheduledTestEngineInstance.renderQuestionView(${index - 1})" ${index === 0 ? 'disabled' : ''}>
              ← Previous Question
            </button>
            <button class="btn btn-outline-secondary" onclick="window.scheduledTestEngineInstance.renderReviewScreen()">
              Review All Answers 📋
            </button>
            ${index < total - 1 ? `
              <button class="btn btn-primary" onclick="window.scheduledTestEngineInstance.renderQuestionView(${index + 1})">
                Next Question →
              </button>
            ` : `
              <button class="btn btn-success" onclick="window.scheduledTestEngineInstance.renderReviewScreen()">
                Review & Submit Test →
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    this.updateTimerDisplay();
  }

  selectOption(questionId, key) {
    this.studentAnswers[questionId] = key;
    this.saveCurrentDraft();
    this.renderQuestionView(this.currentIndex);
  }

  // ==========================================
  // 4.5. REVIEW ANSWERS BEFORE SUBMISSION
  // ==========================================
  renderReviewScreen() {
    this.isReviewing = true;
    const container = document.getElementById("scheduled-test-container");
    if (!container) return;

    const total = this.questions.length;
    const answeredCount = Object.keys(this.studentAnswers).length;
    const unansweredCount = total - answeredCount;

    container.innerHTML = `
      <div class="test-taking-wrapper">
        <!-- Review Header Card -->
        <div class="card test-header-sticky-card mb-4">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div>
              <span class="badge badge-primary">${this.activeTest.course_code} · ${this.activeTest.title}</span>
              <h2 style="margin: 6px 0 2px 0;">Review Your Answers</h2>
              <div class="text-xs text-muted">Pass Mark: <strong>≥ ${this.activeTest.mastery_threshold}%</strong></div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div id="scheduled-test-timer-badge" class="test-timer-badge timer-normal">⏱️ --:--</div>
              <button class="btn btn-sm btn-secondary" onclick="window.scheduledTestEngineInstance.renderQuestionView(${this.currentIndex})">
                ← Back to Questions
              </button>
            </div>
          </div>
          <div id="scheduled-test-timer-warning-banner" style="display: none; margin-top: 10px;"></div>
        </div>

        <!-- Review Summary Status -->
        <div class="card mb-4" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="margin: 0 0 4px 0;">${answeredCount} of ${total} Questions Answered</h3>
              <p class="text-xs text-muted" style="margin: 0;">
                ${unansweredCount === 0 
                  ? "✓ Great job! All questions have been answered. Review your selections below before submitting." 
                  : `⚠️ You still have <strong>${unansweredCount} unanswered question(s)</strong>. Click 'Edit Answer' on any question to return and pick an option.`}
              </p>
            </div>
            <div>
              <span class="badge ${unansweredCount === 0 ? 'badge-success' : 'badge-warning'}" style="font-size: 13px; padding: 6px 12px;">
                ${unansweredCount === 0 ? '✓ Ready to Submit' : `⚠️ ${unansweredCount} Unanswered`}
              </span>
            </div>
          </div>
        </div>

        <!-- Question-by-Question Review List -->
        <div class="card mb-4">
          <h4 class="mb-3">Questions Overview</h4>
          <div class="review-questions-list">
            ${this.questions.map((q, idx) => {
              const chosenKey = this.studentAnswers[q.question_id];
              const chosenOpt = chosenKey ? q.options.find(o => o.key === chosenKey) : null;
              const isAnswered = !!chosenKey;

              return `
                <div class="review-question-row ${isAnswered ? 'review-row-answered' : 'review-row-unanswered'}">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 6px;">
                    <div>
                      <strong>Question ${idx + 1}</strong> &middot; <span class="badge badge-secondary text-xs">${q.concept_name}</span>
                    </div>
                    <div>
                      ${isAnswered
                        ? `<span class="badge badge-success text-xs">✓ Answered (Option ${chosenKey})</span>`
                        : `<span class="badge badge-warning text-xs">⚠️ Not Answered</span>`}
                    </div>
                  </div>
                  <p class="text-sm mb-2" style="color: #F8FAFC;">${q.text}</p>
                  <div class="text-xs mb-2" style="color: ${isAnswered ? '#38BDF8' : '#F59E0B'};">
                    ${isAnswered
                      ? `Selected Choice: <strong>Option ${chosenKey}:</strong> ${chosenOpt ? chosenOpt.text : ''}`
                      : `No answer selected yet.`}
                  </div>
                  <div>
                    <button class="btn btn-xs btn-outline-primary" onclick="window.scheduledTestEngineInstance.renderQuestionView(${idx})">
                      ${isAnswered ? 'Change Answer ✏️' : 'Answer This Question ✍️'}
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Action Footer -->
        <div class="card text-center py-4" style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(148, 163, 184, 0.2);">
          <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="window.scheduledTestEngineInstance.renderQuestionView(${this.currentIndex})">
              ← Return to Test (Question ${this.currentIndex + 1})
            </button>
            <button class="btn btn-success" style="font-size: 15px; padding: 12px 32px; font-weight: 600;" onclick="window.scheduledTestEngineInstance.confirmAndSubmit()">
              Confirm & Submit Test ✓
            </button>
          </div>
        </div>
      </div>
    `;

    this.updateTimerDisplay();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  confirmAndSubmit() {
    const answered = Object.keys(this.studentAnswers).length;
    const total = this.questions.length;
    const unanswered = total - answered;

    let msg = "";
    if (unanswered > 0) {
      msg = `⚠️ Unanswered Questions:\n\nYou have answered ${answered} of ${total} questions (${unanswered} unanswered).\n\nUnanswered questions will receive 0 marks. Are you sure you want to finalize and submit your test now?`;
    } else {
      msg = `Submit Test Confirmation:\n\nYou have answered all ${total} questions.\n\nOnce submitted, your answers will be graded immediately. Are you sure you want to submit?`;
    }

    if (confirm(msg)) {
      this.submitTest(false);
    }
  }

  // ==========================================
  // 5. TEST SUBMISSION & ACCURACY SCORING
  // ==========================================
  getSafeTopicNotes(topicId, topicName) {
    let found = null;
    if (window.gSubjectCatalog && window.gSubjectCatalog.subjects) {
      for (const subj of window.gSubjectCatalog.subjects) {
        const top = (subj.topics || []).find(t => t.id === topicId);
        if (top) {
          found = top;
          break;
        }
      }
    }
    if (!found && this.questionBank && this.questionBank.concepts) {
      found = this.questionBank.concepts.find(c => c.id === topicId);
    }

    let title = `${topicName || topicId} — Essential Concepts`;
    let summary = "";
    let keyPoints = [];
    let pitfalls = "";

    if (found) {
      if (found.notes) {
        if (typeof found.notes.title === "string" && found.notes.title.trim()) title = found.notes.title.trim();
        if (typeof found.notes.summary === "string" && found.notes.summary.trim()) summary = found.notes.summary.trim();
        if (Array.isArray(found.notes.key_points) && found.notes.key_points.length > 0) {
          keyPoints = found.notes.key_points.filter(p => typeof p === "string" && p.trim() && p !== "undefined" && p !== "null");
        }
        if (typeof found.notes.pitfalls === "string" && found.notes.pitfalls.trim()) pitfalls = found.notes.pitfalls.trim();
      }
      if (!summary && found.lesson) {
        if (typeof found.lesson.title === "string" && found.lesson.title.trim()) title = found.lesson.title.trim();
        if (typeof found.lesson.body === "string" && found.lesson.body.trim()) summary = found.lesson.body.trim();
        else if (typeof found.lesson.summary === "string" && found.lesson.summary.trim()) summary = found.lesson.summary.trim();
        if (keyPoints.length === 0 && Array.isArray(found.lesson.key_points)) {
          keyPoints = found.lesson.key_points.filter(p => typeof p === "string" && p.trim() && p !== "undefined" && p !== "null");
        }
        if (!pitfalls && typeof found.lesson.pitfalls === "string" && found.lesson.pitfalls.trim()) {
          pitfalls = found.lesson.pitfalls.trim();
        }
      }
    }

    // Curated pedagogical fallbacks: Zero 'undefined', 'null', or empty card content guaranteed
    if (!summary || summary === "undefined" || summary === "null") {
      summary = `Fundamental undergraduate curriculum topic covering ${topicName || topicId}. Emphasizes architectural invariants, state machine transitions, formal protocol invariants, and algorithmic bounds tested in standard engineering examinations.`;
    }
    if (keyPoints.length === 0) {
      keyPoints = [
        `Master the core operational principles and boundary conditions governing ${topicName || topicId}.`,
        `Differentiate between architectural interface contracts and lower-level implementation mechanics.`,
        `Review standard state diagrams, packet header fields, and time/space complexity tradeoffs.`
      ];
    }
    if (!pitfalls || pitfalls === "undefined" || pitfalls === "null") {
      pitfalls = `Confusing protocol layer boundaries or misinterpreting operational state transitions in edge scenarios.`;
    }

    return {
      title,
      summary,
      keyPoints,
      pitfalls
    };
  }

  getVideoRecommendationForTopic(topicId, topicName, subjectName = "Computer Networks") {
    // 1. Check topic catalog metadata for verified recommendation
    let storedRec = null;
    if (window.gSubjectCatalog && window.gSubjectCatalog.subjects) {
      for (const subj of window.gSubjectCatalog.subjects) {
        const top = (subj.topics || []).find(t => t.id === topicId);
        if (top && top.video_recommendation) {
          storedRec = top.video_recommendation;
          break;
        }
      }
    }

    if (!storedRec && this.questions) {
      const q = this.questions.find(item => (item.topic_id === topicId || item.concept_id === topicId) && item.video_recommendation);
      if (q) storedRec = q.video_recommendation;
    }

    if (storedRec && (storedRec.search_url || storedRec.watch_url)) {
      return {
        available: true,
        title: storedRec.title || `Undergraduate Tutorial: ${topicName}`,
        channel: storedRec.channel || "Curated Reference",
        url: storedRec.watch_url || storedRec.search_url,
        notice: "Curated academic video resource verified for this topic."
      };
    }

    // 2. Curated YouTube search recommendation using configured project query
    const cleanTopic = encodeURIComponent(topicName || topicId);
    const cleanSubj = encodeURIComponent(subjectName || "Computer Networks");
    return {
      available: true,
      title: `${topicName} — Concept Tutorial`,
      channel: "Curated Course Search",
      url: `https://www.youtube.com/results?search_query=${cleanSubj}+${cleanTopic}+tutorial+for+beginners`,
      notice: "Direct YouTube search link configured for this undergraduate topic."
    };
  }

  handleContinue() {
    if (typeof switchTab === "function") {
      switchTab("tab-stu-dashboard");
    }
    if (window.dashboardEngineInstance && window.dashboardEngineInstance.renderStudentScheduledTests) {
      window.dashboardEngineInstance.renderStudentScheduledTests();
    }
  }

  submitTest(isAuto = false) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this._keyListener) {
      window.removeEventListener("keydown", this._keyListener);
      this._keyListener = null;
    }

    const studentUser = authEngine.getCurrentUser();
    // Clear in-progress draft on submission
    if (studentUser && this.activeTest) {
      storageEngine.clearScheduledTestDraft(studentUser.student_id, this.activeTest.id);
    }

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const itemResults = [];
    const missedConceptSet = new Set();
    const missedItems = [];
    const topicResponsesMap = {};

    this.questions.forEach(q => {
      const topicId = q.topic_id || q.concept_id;
      const topicName = q.topic_name || q.concept_name;
      if (!topicResponsesMap[topicId]) {
        topicResponsesMap[topicId] = {
          id: topicId,
          name: topicName,
          questions: [],
          responses: []
        };
      }
      topicResponsesMap[topicId].questions.push(q);

      const chosenKey = this.studentAnswers[q.question_id];
      const isAnswered = chosenKey !== null && chosenKey !== undefined;
      const isCorrect = isAnswered && chosenKey === q.correct_option;

      if (!isAnswered) {
        unansweredCount++;
        missedConceptSet.add(topicId);
      } else if (isCorrect) {
        correctCount++;
        topicResponsesMap[topicId].responses.push(true);
      } else {
        wrongCount++;
        missedConceptSet.add(topicId);
        topicResponsesMap[topicId].responses.push(false);
      }

      const chosenOpt = isAnswered ? q.options.find(o => o.key === chosenKey) : null;
      const correctOpt = q.options.find(o => o.key === q.correct_option);

      const itemRes = {
        question_id: q.question_id,
        topic_id: topicId,
        topic_name: topicName,
        concept_id: topicId,
        concept_name: topicName,
        question_text: q.text,
        chosen_key: chosenKey || "—",
        chosen_text: chosenOpt ? chosenOpt.text : "Unanswered",
        correct_key: q.correct_option,
        correct_text: correctOpt ? correctOpt.text : "",
        is_answered: isAnswered,
        is_correct: isCorrect,
        explanation: q.explanation || "Official curriculum explanation.",
        misconception_tag: q.misconception_tag || "Conceptual Misconception"
      };

      itemResults.push(itemRes);
      if (!isCorrect) {
        missedItems.push(itemRes);
      }
    });

    const totalCount = this.questions.length;
    const attemptedCount = totalCount - unansweredCount;

    // Overall accuracy as correct answers / questions attempted * 100
    const overallAccuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const percentage = overallAccuracy; // for threshold comparison
    const threshold = this.activeTest.mastery_threshold || 80;
    const allCorrect = (correctCount === totalCount && wrongCount === 0 && unansweredCount === 0);
    const masteryMet = allCorrect || (overallAccuracy >= threshold);

    // Compute Topic Metrics: Raw accuracy strictly from attempted questions + BKT topic-mastery estimate
    const topicMetrics = Object.values(topicResponsesMap).map(top => {
      const topQuestions = top.questions;
      const topAttempted = topQuestions.filter(q => this.studentAnswers[q.question_id] != null).length;
      const topUnanswered = topQuestions.length - topAttempted;
      const topCorrect = topQuestions.filter(q => this.studentAnswers[q.question_id] === q.correct_option).length;
      const topWrong = topAttempted - topCorrect;
      const topAccuracy = topAttempted > 0 ? Math.round((topCorrect / topAttempted) * 100) : 0;

      // Bayesian Knowledge Tracing Calculation
      let bktData = null;
      if (typeof BKTEngine !== "undefined" && BKTEngine.traceTopic) {
        bktData = BKTEngine.traceTopic(top.responses, top.id);
      } else {
        bktData = {
          estimatedMasteryPct: topAccuracy,
          isMastered: topAccuracy >= 80,
          masteryStatus: topAccuracy >= 80 ? "Mastered (Model Estimate)" : "Developing (Model Estimate)",
          disclaimer: "BKT topic-mastery is an algorithmic probability estimate, separate from raw quiz accuracy."
        };
      }

      return {
        topic_id: top.id,
        topic_name: top.name,
        total_questions: topQuestions.length,
        attempted_count: topAttempted,
        unanswered_count: topUnanswered,
        correct_count: topCorrect,
        wrong_count: topWrong,
        accuracy_percent: topAccuracy,
        bkt_mastery_pct: bktData.estimatedMasteryPct,
        bkt_status: bktData.masteryStatus,
        bkt_is_mastered: bktData.isMastered,
        bkt_disclaimer: bktData.disclaimer
      };
    });

    const attempt = {
      attempt_id: "ATT-" + Math.floor(100000 + Math.random() * 900000),
      test_id: this.activeTest.id,
      test_title: this.activeTest.title,
      subject_id: this.activeTest.subject_id || "CN",
      subject_name: this.activeTest.subject_name || "Computer Networks",
      course_code: this.activeTest.course_code,
      student_id: studentUser ? studentUser.student_id : "UNKNOWN",
      student_name: studentUser ? studentUser.name : "Student",
      score: correctCount,
      correct_count: correctCount,
      wrong_count: wrongCount,
      unanswered_count: unansweredCount,
      total_questions: totalCount,
      attempted_count: attemptedCount,
      overall_accuracy: overallAccuracy,
      percentage: percentage,
      all_correct: allCorrect,
      mastery_threshold: threshold,
      mastery_met: masteryMet,
      is_auto_submitted: isAuto,
      submitted_at: new Date().toISOString(),
      missed_topics: Array.from(missedConceptSet),
      missed_items: missedItems,
      topic_metrics: topicMetrics,
      item_results: itemResults,
      retest_completed: false
    };

    // Save attempt
    storageEngine.saveScheduledTestAttempt(attempt);
    this.testAttempt = attempt;
    this.missedTopics = attempt.missed_topics;

    // Render results & clear results page
    this.renderResultsAndLearningHub();
  }

  // ==========================================
  // 6. CLEAR RESULTS PAGE WITH BKT & BRANCHING
  // ==========================================
  renderResultsAndLearningHub() {
    const container = document.getElementById("scheduled-test-container");
    if (!container || !this.testAttempt) return;

    const att = this.testAttempt;
    const totalCount = att.total_questions || this.questions.length;
    const correctCount = att.correct_count ?? att.score ?? 0;
    const wrongCount = att.wrong_count ?? 0;
    const unansweredCount = att.unanswered_count ?? (totalCount - (correctCount + wrongCount));
    const attemptedCount = att.attempted_count ?? (totalCount - unansweredCount);
    const overallAccuracy = att.overall_accuracy ?? (attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0);
    const allCorrect = (correctCount === totalCount && wrongCount === 0 && unansweredCount === 0);

    const missedItems = att.missed_items || (att.item_results ? att.item_results.filter(i => !i.is_correct) : []);
    const missedTopicList = att.missed_topics || [];
    this.currentResultsMissedItems = missedItems;
    this.currentResultsAtt = att;
    this.testChatHistory = [];

    const topicNameMap = {};
    if (att.topic_metrics) {
      att.topic_metrics.forEach(tm => { topicNameMap[tm.topic_id] = tm.topic_name; });
    }
    if (this.questions) {
      this.questions.forEach(q => {
        const tid = q.topic_id || q.concept_id;
        const tname = q.topic_name || q.concept_name;
        if (tid && tname) topicNameMap[tid] = tname;
      });
    }

    const missedTopicNames = missedTopicList.map(tid => topicNameMap[tid] || tid);
    const missedTopicNamesStr = missedTopicNames.length > 0 ? missedTopicNames.join(", ") : "Curriculum Topics";
    const primaryMissedTopicName = missedTopicNames[0] || "Curriculum Concepts";

    const autoSubmitBanner = att.is_auto_submitted ? `
      <div class="alert alert-warning mb-4" style="background: rgba(245, 158, 11, 0.15); border-left: 4px solid var(--amber-warning); padding: 14px 18px; border-radius: 8px;">
        ⏰ <strong>Notice: Auto-Submitted on Time Limit Expiration</strong><br>
        Your test was automatically submitted when the countdown reached 00:00. All recorded answers have been graded.
      </div>
    ` : '';

    container.innerHTML = `
      <div class="test-learning-hub-wrapper">
        ${autoSubmitBanner}

        <!-- 1. CLEAR RESULTS SUMMARY HEADER -->
        <div class="card mb-4" style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%); border: 1px solid rgba(148, 163, 184, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <span class="badge badge-primary">${att.course_code || 'Assessment'} · Results Page</span>
              <h2 style="margin: 8px 0 4px 0; color: #FFFFFF;">${att.test_title}</h2>
              <div class="text-xs text-muted">
                Submitted on ${new Date(att.submitted_at).toLocaleString()} &middot; Attempt ID: <code>${att.attempt_id}</code>
              </div>
            </div>
            <div>
              ${allCorrect
                ? `<span class="badge badge-success" style="font-size: 13px; padding: 6px 14px;">🎉 All Answers Correct (100%)</span>`
                : `<span class="badge badge-warning" style="font-size: 13px; padding: 6px 14px;">Review Missed Concepts</span>`
              }
            </div>
          </div>

          <!-- 4 Core Metric Cards: Correct, Wrong, Unanswered, Total -->
          <div class="results-hero-grid mt-4">
            <div class="res-stat-card">
              <span class="res-stat-label">Total Questions</span>
              <div class="res-stat-num text-cyan">${totalCount}</div>
              <span class="res-stat-sub text-muted">Test scope</span>
            </div>
            <div class="res-stat-card">
              <span class="res-stat-label">Correct Answers</span>
              <div class="res-stat-num text-emerald">${correctCount}</div>
              <span class="res-stat-sub text-emerald">Validated correct</span>
            </div>
            <div class="res-stat-card">
              <span class="res-stat-label">Wrong Answers</span>
              <div class="res-stat-num ${wrongCount > 0 ? 'text-rose' : 'text-muted'}">${wrongCount}</div>
              <span class="res-stat-sub text-muted">${wrongCount > 0 ? 'Needs review' : 'Zero mistakes'}</span>
            </div>
            <div class="res-stat-card">
              <span class="res-stat-label">Unanswered Count</span>
              <div class="res-stat-num ${unansweredCount > 0 ? 'text-amber' : 'text-muted'}">${unansweredCount}</div>
              <span class="res-stat-sub text-muted">${unansweredCount > 0 ? 'Left blank' : 'All attempted'}</span>
            </div>
          </div>

          <!-- Overall Accuracy with Clear Example & Attempted/Unanswered Counts -->
          <div class="card mt-3" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); padding: 14px 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <span class="text-xs text-muted" style="letter-spacing: 0.5px;">FORMULA: CORRECT ANSWERS ÷ QUESTIONS ATTEMPTED × 100</span>
                <div style="font-size: 18px; font-weight: 700; color: #FFFFFF; margin: 4px 0;">
                  Overall Accuracy: <span class="text-cyan">${overallAccuracy}%</span>
                </div>
                <div class="text-sm font-mono text-cyan" id="results-accuracy-example" style="font-size: 13px;">
                  📌 <strong>Accuracy:</strong> ${correctCount} of ${attemptedCount} attempted — ${overallAccuracy}% accuracy
                  ${unansweredCount > 0 
                    ? ` &middot; (${attemptedCount} attempted &amp; ${unansweredCount} unanswered out of ${totalCount} total questions)` 
                    : ` &middot; (All ${totalCount} questions attempted)`}
                </div>
              </div>
              <div>
                <span class="badge ${att.mastery_met ? 'badge-success' : 'badge-warning'}" style="font-size: 13px; padding: 6px 14px;">
                  ${att.mastery_met ? '✓ Mastery Target Met' : '⚠️ Additional Review Required'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. TOPIC ACCURACY VS BKT MASTERY ESTIMATE BREAKDOWN -->
        <div class="card mb-4">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div>
              <h3 style="margin: 0;">Accuracy & Topic-Mastery Breakdown</h3>
              <p class="text-xs text-muted" style="margin: 2px 0 0 0;">
                Topic accuracy is calculated strictly from questions attempted for that topic. BKT mastery is an algorithmic probability estimate.
              </p>
            </div>
            <span class="badge badge-secondary text-xs">Separately Labeled</span>
          </div>

          <div class="topic-metrics-list">
            ${(att.topic_metrics || []).map(tm => `
              <div class="card mb-2" style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); padding: 14px 18px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                  <div>
                    <strong style="color: #FFFFFF; font-size: 14px;">${tm.topic_name}</strong>
                    <div class="text-xs text-muted">Topic Code: <code>${tm.topic_id}</code> &middot; ${tm.total_questions} question(s) in this test</div>
                  </div>
                  <div>
                    <span class="badge ${tm.accuracy_percent >= 80 ? 'badge-success' : 'badge-warning'}">
                      ${tm.accuracy_percent >= 80 ? '✓ Mastery Target Met' : 'Additional Review Required'}
                    </span>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(148, 163, 184, 0.15);">
                  <div>
                    <span class="text-xs text-muted">Raw Topic Accuracy (Attempted Questions Only):</span>
                    <div style="font-size: 16px; font-weight: 700; color: #38BDF8;">
                      ${tm.accuracy_percent}%
                      <span class="text-xs text-muted" style="font-weight: normal;">(${tm.correct_count} of ${tm.attempted_count} attempted${tm.unanswered_count > 0 ? `, ${tm.unanswered_count} unanswered` : ''})</span>
                    </div>
                  </div>
                  <div>
                    <span class="text-xs text-muted">BKT Topic-Mastery Estimate (Bayesian Probability):</span>
                    <div style="font-size: 16px; font-weight: 700; color: ${tm.bkt_is_mastered ? '#10B981' : '#F59E0B'};">
                      ${tm.bkt_mastery_pct}%
                      <span class="text-xs text-muted" style="font-weight: normal;">— ${tm.bkt_status}</span>
                    </div>
                    <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">
                      <em>Model Estimate: Probabilistic prediction from answer sequence. Separate from raw accuracy.</em>
                    </div>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        ${allCorrect ? `
          <!-- BRANCH A: ALL ANSWERS CORRECT -> SIMPLE CONTINUE ACTION -->
          <!-- DO NOT show remedial notes, AI tutoring, video recommendations, or retest -->
          <div class="card text-center py-5 mb-4" style="background: rgba(16, 185, 129, 0.08); border: 2px solid var(--emerald-success);">
            <div style="max-width: 600px; margin: 0 auto;">
              <span style="font-size: 52px;">🎉</span>
              <h2 style="color: #FFFFFF; margin: 14px 0 8px 0;">All Answers Correct!</h2>
              <p class="text-sm text-muted mb-4" style="line-height: 1.6;">
                Excellent work! You answered all questions correctly (100% Accuracy). You have demonstrated solid mastery across all tested topics with zero mistakes.
              </p>
              <button id="btn-continue-all-correct" class="btn btn-primary" style="font-size: 16px; padding: 12px 36px; font-weight: 600;" onclick="window.scheduledTestEngineInstance.handleContinue()">
                Continue →
              </button>
            </div>
          </div>
        ` : `
          <!-- BRANCH B: SOME ANSWERS WRONG OR UNANSWERED -> FEEDBACK ONLY FOR MISSED QUESTIONS -->
          <div class="card mb-4" id="missed-questions-feedback-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
              <div>
                <span class="badge badge-danger text-xs mb-1">Targeted Review</span>
                <h3 style="margin: 0;">Feedback for Missed Questions (${missedItems.length} Question${missedItems.length > 1 ? 's' : ''})</h3>
                <p class="text-xs text-muted" style="margin: 2px 0 0 0;">
                  Showing review feedback strictly for questions answered incorrectly or left blank.
                </p>
              </div>
              <span class="badge badge-warning text-xs">Review Before Retest</span>
            </div>

            <div class="retest-trace-list">
              ${missedItems.map((item, idx) => `
                <div class="retest-item-box ${item.is_correct ? 'trace-correct' : 'trace-incorrect'} mb-3">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div>
                      <strong>Missed Question ${idx + 1}</strong> &middot; <span class="badge badge-secondary text-xs">${item.topic_name || item.concept_name}</span>
                    </div>
                    <span class="badge badge-danger">
                      ✗ ${item.is_answered ? 'Incorrect Answer' : 'Unanswered (0 Marks)'}
                    </span>
                  </div>
                  <p class="text-sm mb-2" style="color: #F8FAFC;">${item.question_text}</p>
                  <div class="text-xs mb-2">
                    <span style="color: #FDA4AF;"><strong>Your Answer:</strong> Option ${item.chosen_key} (${item.chosen_text})</span>
                    <span class="text-cyan" style="margin-left: 14px;"><strong>Correct Answer:</strong> Option ${item.correct_key} (${item.correct_text})</span>
                  </div>
                  <div class="trace-explanation">
                    <strong>Explanation:</strong>
                    ${item.misconception_tag ? `<span class="badge badge-warning text-xs font-mono" style="margin: 0 4px;">${item.misconception_tag}</span> ` : ''}
                    ${item.explanation}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- TARGETED LEARNING NOTES FOR MISSED TOPICS (ZERO UNDEFINED GUARANTEED) -->
          <div class="card mb-4" id="same-page-learning-notes-section" style="border: 1px solid rgba(245, 158, 11, 0.4); background: rgba(15, 23, 42, 0.8);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
              <div>
                <span class="badge badge-warning mb-1">Targeted Review Notes</span>
                <h3 style="margin: 0;">Learning Notes for Missed Topics</h3>
                <p class="text-xs text-muted" style="margin-top: 4px;">
                  Study these verified curriculum notes and traps before taking your retest.
                </p>
              </div>
              <span class="badge badge-secondary text-xs">Curriculum Aligned</span>
            </div>

            <div class="learning-notes-accordion">
              ${missedTopicList.map(tid => {
                const notes = this.getSafeTopicNotes(tid, topicNameMap[tid]);
                return `
                  <div class="card mb-3" style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(148, 163, 184, 0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <h4 style="margin: 0; color: #FFFFFF;">📘 ${notes.title}</h4>
                      <span class="badge badge-primary text-xs"><code>${tid}</code></span>
                    </div>
                    <p style="font-size: 13px; color: #E2E8F0; line-height: 1.6; margin-bottom: 10px;">
                      ${notes.summary}
                    </p>
                    ${notes.keyPoints && notes.keyPoints.length > 0 ? `
                      <div style="background: rgba(15, 23, 42, 0.6); padding: 10px 14px; border-radius: 6px; margin-bottom: 8px;">
                        <strong class="text-cyan text-xs">Key Principles:</strong>
                        <ul style="margin: 4px 0 0 0; padding-left: 18px; font-size: 12px; color: #CBD5E1;">
                          ${notes.keyPoints.map(pt => `<li>${pt}</li>`).join("")}
                        </ul>
                      </div>
                    ` : ''}
                    ${notes.pitfalls ? `
                      <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--rose-danger); padding: 8px 12px; border-radius: 4px; font-size: 12px; color: #FECDD3;">
                        <strong>Common Trap / Pitfall:</strong> ${notes.pitfalls}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- EMBEDDED TOPIC-AWARE AI CHAT BOX -->
          <div class="card mb-4" id="same-page-ai-chat-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🤖</span>
                <div>
                  <h3 style="margin: 0;">Topic-Aware AI Tutor</h3>
                  <div class="text-xs text-muted">Ask questions scoped strictly to your missed topics: <strong>${missedTopicNamesStr}</strong></div>
                </div>
              </div>
              <span class="badge badge-primary text-xs">Scoped to Missed Topics</span>
            </div>

            <div class="tutor-chat-box" style="height: 280px; overflow-y: auto; background: rgba(15, 23, 42, 0.85); border-radius: 8px; padding: 14px; border: 1px solid rgba(148, 163, 184, 0.15);" id="sched-test-chat-messages">
              <div class="tutor-message-row msg-tutor">
                <div class="tutor-bubble">
                  <div class="bubble-header">
                    <span class="bubble-sender">✨ GapPath AI Tutor</span>
                    <span class="bubble-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div class="bubble-content">
                    Hello! I see you missed questions on <strong>${missedTopicNamesStr}</strong>. What part of these concepts can I explain with an analogy or step-by-step example before your retest?
                  </div>
                </div>
              </div>
            </div>

            <div class="tutor-quick-chips mt-2 mb-2" style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="btn btn-xs btn-outline-secondary" onclick="window.scheduledTestEngineInstance.sendPresetChat('Can you give a simple analogy explaining the core mechanism of ${primaryMissedTopicName}?')">
                💡 Simple Analogy
              </button>
              <button type="button" class="btn btn-xs btn-outline-secondary" onclick="window.scheduledTestEngineInstance.sendPresetChat('What is the main pitfall to avoid when solving questions on ${primaryMissedTopicName}?')">
                ⚠️ Common Pitfalls
              </button>
              <button type="button" class="btn btn-xs btn-outline-secondary" onclick="window.scheduledTestEngineInstance.sendPresetChat('Can you walk me through a step-by-step example on ${primaryMissedTopicName}?')">
                📝 Step-by-Step Example
              </button>
            </div>

            <form onsubmit="event.preventDefault(); window.scheduledTestEngineInstance.handleChatSubmit();" style="display: flex; gap: 10px; margin-top: 8px;">
              <input type="text" id="sched-test-chat-input" class="form-control" placeholder="Ask a question about ${primaryMissedTopicName}..." style="flex: 1;">
              <button type="submit" class="btn btn-primary">Send ↗</button>
            </form>
          </div>

          <!-- RELEVANT YOUTUBE VIDEO RECOMMENDATION -->
          <div class="card mb-4" id="video-recommendations-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div>
                <span class="badge badge-danger text-xs mb-1">Video Resource</span>
                <h3 style="margin: 0;">Recommended Video Tutorials</h3>
                <p class="text-xs text-muted" style="margin: 2px 0 0 0;">
                  Curated video resources to reinforce your missed concepts before the retest.
                </p>
              </div>
              <span class="badge badge-secondary text-xs">Curated Links Only</span>
            </div>

            <div class="video-cards-grid">
              ${missedTopicList.map(tid => {
                const vRec = this.getVideoRecommendationForTopic(tid, topicNameMap[tid], att.subject_name || att.course_code);
                if (!vRec.available) {
                  return `
                    <div class="card mb-2" style="background: rgba(30, 41, 59, 0.5); padding: 12px 16px;">
                      <span class="text-muted text-sm">📺 A video recommendation is currently unavailable for <strong>${topicNameMap[tid] || tid}</strong>.</span>
                    </div>
                  `;
                }
                return `
                  <div class="card mb-2" style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); padding: 14px 18px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                      <div>
                        <h4 style="margin: 0 0 4px 0; color: #FFFFFF;">📺 ${vRec.title}</h4>
                        <div class="text-xs text-muted">Channel: <strong>${vRec.channel}</strong> &middot; ${vRec.notice}</div>
                      </div>
                      <div>
                        <a href="${vRec.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-danger" style="font-weight: 600;">
                          Watch Tutorial ↗
                        </a>
                      </div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- RETEST ACTION SECTION: "I understand — start retest" -->
          <div class="card text-center py-4" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3);">
            <h3 style="margin-bottom: 6px;">Ready to demonstrate improvement?</h3>
            <p class="text-xs text-muted mb-4" style="max-width: 600px; margin-left: auto; margin-right: auto;">
              After reviewing your missed questions, studying the notes, and discussing doubts with the AI Tutor, start the retest on the missed topics with <strong>new questions</strong>.
            </p>
            <button class="btn btn-success" style="font-size: 16px; padding: 14px 36px; font-weight: 600;" onclick="window.scheduledTestEngineInstance.startMissedTopicsRetest()">
              👉 I understand — start retest
            </button>
          </div>
        `}
      </div>
    `;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ==========================================
  // 7. EMBEDDED AI CHAT HANDLING
  // ==========================================
  sendPresetChat(text) {
    const input = document.getElementById("sched-test-chat-input");
    if (input) input.value = text;
    this.handleChatSubmit();
  }

  async handleChatSubmit() {
    const input = document.getElementById("sched-test-chat-input");
    if (!input || !input.value.trim() || this.isChatGenerating) return;

    const userText = input.value.trim();
    input.value = "";
    this.isChatGenerating = true;

    if (!this.testChatHistory) this.testChatHistory = [];
    this.testChatHistory.push({ role: "student", text: userText });

    const messagesEl = document.getElementById("sched-test-chat-messages");
    if (messagesEl) {
      // Safe escaped display of student question
      const tempSafe = document.createElement("div");
      tempSafe.textContent = userText;
      const safeUserHtml = tempSafe.innerHTML;

      // Append user bubble
      messagesEl.innerHTML += `
        <div class="tutor-message-row msg-student">
          <div class="tutor-bubble">
            <div class="bubble-header">
              <span class="bubble-sender">You</span>
              <span class="bubble-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="bubble-content">${safeUserHtml}</div>
          </div>
        </div>
      `;

      // Append temporary analyzing indicator
      messagesEl.innerHTML += `
        <div class="tutor-message-row msg-tutor" id="sched-chat-thinking">
          <div class="tutor-bubble" style="opacity: 0.8; font-style: italic;">
            <div class="bubble-content">✨ GapPath AI Tutor is analyzing your question...</div>
          </div>
        </div>
      `;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Call /api/chat endpoint with student message, history, subject/topic, notes, and missed question
    let replyText = "";
    let sourceLabel = "✨ GapPath AI Tutor";
    let isNotice = false;

    try {
      const topicContext = (this.missedTopics && this.missedTopics.length > 0)
        ? this.missedTopics.join(", ")
        : (this.activeTest && this.activeTest.topics ? this.activeTest.topics.join(", ") : "General Engineering");

      const subjectContext = (this.currentResultsAtt && (this.currentResultsAtt.subject_name || this.currentResultsAtt.subject || this.currentResultsAtt.course_code))
        || (this.activeTest && (this.activeTest.subject || this.activeTest.subject_name))
        || "Computer Networks";

      const firstMissed = (this.currentResultsMissedItems && this.currentResultsMissedItems.length > 0)
        ? {
            question: this.currentResultsMissedItems[0].question_text,
            student_answer: this.currentResultsMissedItems[0].chosen_text,
            correct_answer: this.currentResultsMissedItems[0].correct_text,
            misconception: this.currentResultsMissedItems[0].misconception_tag || this.currentResultsMissedItems[0].explanation
          }
        : null;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          subject: subjectContext,
          topic: topicContext,
          history: this.testChatHistory.slice(-6),
          missed_question: firstMissed
        })
      });

      const data = await res.json();
      if (res.ok && data.success && (data.text || data.reply)) {
        replyText = data.text || data.reply;
        sourceLabel = data.source_label || "✨ GapPath AI (Gemini Flash)";
        this.testChatHistory.push({ role: "tutor", text: replyText });
      } else if (data.status === "unavailable") {
        const curatedText = (window.tutorEngine && window.tutorEngine.generateCuratedPedagogicalResponse)
          ? window.tutorEngine.generateCuratedPedagogicalResponse(userText, topicContext)
          : null;
        if (curatedText) {
          replyText = curatedText;
          sourceLabel = "📚 GapPath Knowledge Base";
          isNotice = false;
        } else {
          isNotice = true;
          sourceLabel = "⚠️ AI Service Notice (Setup Required)";
          replyText = data.setup_guidance || data.guidance || data.error_message || "The Gemini AI tutoring service is not currently configured with an API key on the server. Set GEMINI_API_KEY in your server environment to enable live AI responses.";
        }
      } else if (data.status === "error") {
        isNotice = true;
        sourceLabel = "⚠️ AI Service Notice (API Error)";
        replyText = data.error_message || data.reply || "Gemini API returned an error. Please verify that GEMINI_API_KEY is valid and has active quota.";
      } else {
        isNotice = true;
        sourceLabel = "⚠️ AI Service Notice";
        replyText = data.error_message || data.reply || "Unexpected response from tutoring service. Please check server logs.";
      }
    } catch (e) {
      console.warn("Chat API connection error:", e);
      isNotice = true;
      sourceLabel = "⚠️ Connection Notice";
      replyText = "Unable to contact the AI backend. Please verify scripts/server.py is running on port 3000.";
    }

    if (messagesEl) {
      const thinkingEl = document.getElementById("sched-chat-thinking");
      if (thinkingEl) thinkingEl.remove();

      messagesEl.innerHTML += `
        <div class="tutor-message-row msg-tutor">
          <div class="tutor-bubble ${isNotice ? 'tutor-bubble-notice' : ''}">
            <div class="bubble-header">
              <span class="bubble-sender">${sourceLabel}</span>
              <span class="bubble-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="bubble-content">${replyText.replace(/\n/g, "<br>")}</div>
          </div>
        </div>
      `;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    this.isChatGenerating = false;
  }

  // ==========================================
  // 8. MISSED TOPICS RETEST (WITH NEW QUESTIONS)
  // ==========================================
  startMissedTopicsRetest() {
    const missed = this.missedTopics.length > 0
      ? this.missedTopics
      : this.activeTest.topics;

    const usedIds = new Set(this.questions.map(q => q.question_id || q.id));
    const newQuestions = [];

    // 1. Check in loaded 10,000 question dataset (window.gAllQuestions)
    if (window.gAllQuestions && Array.isArray(window.gAllQuestions) && window.gAllQuestions.length > 0) {
      window.gAllQuestions.forEach(q => {
        if (missed.includes(q.topic_id) && !usedIds.has(q.question_id)) {
          const correctOpts = (q.options || []).filter(o => o.is_correct);
          if (correctOpts.length === 1) {
            newQuestions.push({
              id: q.question_id,
              question_id: q.question_id,
              concept_id: q.topic_id,
              concept_name: q.topic_name,
              topic_id: q.topic_id,
              topic_name: q.topic_name,
              text: q.text,
              options: q.options,
              correct_option: q.correct_option,
              explanation: q.explanation,
              misconception_tag: q.misconception_tag
            });
          }
        }
      });
    }

    // 2. Fallback to questionBank concepts
    if (newQuestions.length === 0 && this.questionBank && this.questionBank.concepts) {
      const targetConcepts = this.questionBank.concepts.filter(c => missed.includes(c.id));
      targetConcepts.forEach(c => {
        const pool = c.diagnostic_pool || [];
        const practice = c.practice_questions || [];
        const all = [...pool, ...practice];

        // Exclude questions already seen
        const unseen = all.filter(q => !usedIds.has(q.id));
        unseen.forEach(q => {
          newQuestions.push({
            ...q,
            concept_id: c.id,
            concept_name: c.name
          });
        });
      });
    }

    // If not enough unseen, use practice items
    let candidates = newQuestions.length >= 3 ? newQuestions : (this.questionBank?.concepts || []).filter(c => missed.includes(c.id)).flatMap(c => c.practice_questions || []);
    candidates = candidates.sort(() => 0.5 - Math.random());
    const retestCount = Math.min(Math.max(candidates.length, 1), 4);
    const selected = candidates.slice(0, retestCount);

    // Shuffle options while preserving key
    this.retestQuestions = selected.map((q, idx) => {
      const keys = ["A", "B", "C", "D"];
      const shuffledOpts = [...q.options].sort(() => 0.5 - Math.random());
      let newCorrectKey = "A";
      const processed = shuffledOpts.map((opt, oIdx) => {
        const k = keys[oIdx];
        if (opt.is_correct) newCorrectKey = k;
        return {
          key: k,
          text: opt.text,
          is_correct: opt.is_correct,
          explanation: opt.explanation || opt.rationale || q.explanation
        };
      });

      return {
        question_id: q.question_id || q.id,
        index: idx,
        concept_id: q.concept_id || q.topic_id,
        concept_name: q.concept_name || q.topic_name,
        topic_id: q.topic_id || q.concept_id,
        topic_name: q.topic_name || q.concept_name,
        text: q.text,
        options: processed,
        correct_option: newCorrectKey,
        explanation: q.explanation || "Official curriculum explanation.",
        misconception_tag: q.misconception_tag || "Conceptual Misconception"
      };
    });

    this.retestCurrentIndex = 0;
    this.retestAnswers = {};
    this.renderRetestQuestion(0);
  }

  renderRetestQuestion(index) {
    if (index < 0 || index >= this.retestQuestions.length) return;
    this.retestCurrentIndex = index;

    const container = document.getElementById("scheduled-test-container");
    if (!container) return;

    const q = this.retestQuestions[index];
    const total = this.retestQuestions.length;
    const chosenKey = this.retestAnswers[q.question_id] || null;

    container.innerHTML = `
      <div class="test-taking-wrapper">
        <div class="card mb-4" style="background: rgba(15, 23, 42, 0.9);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <span class="badge badge-warning">Targeted Remediation Retest · New Questions</span>
              <h3 style="margin: 6px 0 2px 0;">Retest Question ${index + 1} of ${total}</h3>
              <div class="text-xs text-muted">Topic: <strong>${q.concept_name}</strong> · Pass Mastery Target: <strong>${this.activeTest.mastery_threshold}%</strong></div>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="window.scheduledTestEngineInstance.renderResultsAndLearningHub()">
              ← Back to Review Notes
            </button>
          </div>
        </div>

        <!-- Question Body Card -->
        <div class="card test-question-card mb-4">
          <div class="question-header mb-3">
            <span class="badge badge-secondary text-xs">${q.concept_id}</span>
            <p class="retest-q-text mt-2">${q.text}</p>
          </div>

          <div class="retest-options-list">
            ${q.options.map(opt => `
              <label class="retest-option-label ${chosenKey === opt.key ? 'retest-opt-selected' : ''}">
                <input type="radio" name="retest_q_${q.question_id}" value="${opt.key}"
                       ${chosenKey === opt.key ? 'checked' : ''}
                       onchange="window.scheduledTestEngineInstance.selectRetestOption('${q.question_id}', '${opt.key}')">
                <div class="retest-opt-circle">${opt.key}</div>
                <div class="retest-opt-text">${opt.text}</div>
              </label>
            `).join("")}
          </div>

          <div class="retest-controls-row mt-4">
            <button class="btn btn-secondary" onclick="window.scheduledTestEngineInstance.renderRetestQuestion(${index - 1})" ${index === 0 ? 'disabled' : ''}>
              ← Previous
            </button>
            ${index < total - 1 ? `
              <button class="btn btn-primary" onclick="window.scheduledTestEngineInstance.renderRetestQuestion(${index + 1})">
                Next Question →
              </button>
            ` : `
              <button class="btn btn-success" onclick="window.scheduledTestEngineInstance.submitRetest()">
                Submit Retest & Verify Mastery ✓
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  selectRetestOption(questionId, key) {
    this.retestAnswers[questionId] = key;
    this.renderRetestQuestion(this.retestCurrentIndex);
  }

  // ==========================================
  // 9. RETEST EVALUATION & MASTERY GATEWAY (REQUIREMENT 6)
  // ==========================================
  submitRetest() {
    let correctCount = 0;
    const total = this.retestQuestions.length;

    this.retestQuestions.forEach(q => {
      const chosen = this.retestAnswers[q.question_id];
      if (chosen === q.correct_option) correctCount++;
    });

    const percentage = Math.round((correctCount / total) * 100);
    const threshold = this.activeTest.mastery_threshold || 80;
    const masteryAchieved = percentage >= threshold;

    const container = document.getElementById("scheduled-test-container");
    if (!container) return;

    const allScheduled = storageEngine.getScheduledTests();
    const studentUser = authEngine.getCurrentUser();
    const studentCourse = (studentUser && studentUser.course_code) || (this.activeTest && this.activeTest.course_code) || "CS301";
    const studentId = studentUser ? studentUser.student_id : "";
    const otherTests = allScheduled.filter(t =>
      (t.course_code === studentCourse || t.course_code === "ALL") &&
      t.id !== (this.activeTest ? this.activeTest.id : "") &&
      !storageEngine.getScheduledTestAttempt(studentId, t.id)
    );
    const now = new Date();
    const nextAvailable = otherTests.find(t => {
      const st = new Date(t.start_time);
      const et = new Date(t.end_time);
      return now >= st && now <= et;
    });

    if (masteryAchieved) {
      // MASTERY THRESHOLD MET (MOVE FORWARD)
      container.innerHTML = `
        <div class="card text-center py-5" style="background: rgba(16, 185, 129, 0.1); border: 2px solid var(--emerald-success);">
          <div style="font-size: 56px; margin-bottom: 12px;">🎉</div>
          <span class="badge badge-success" style="font-size: 14px; padding: 6px 14px;">Mastery Target Met (${percentage}% ≥ ${threshold}%)</span>
          <h2 style="margin: 16px 0 8px 0; color: #FFFFFF;">Concept Mastery Confirmed!</h2>
          <p style="color: #CBD5E1; max-width: 600px; margin: 0 auto 24px auto; font-size: 14px; line-height: 1.6;">
            You scored <strong>${correctCount} / ${total} (${percentage}%)</strong> on the remediation retest, meeting your instructor's <strong>${threshold}% mastery threshold</strong>. You have demonstrated recovery on previously missed topics and are ready to move forward.
          </p>
          <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
            ${nextAvailable ? `
              <button class="btn btn-success" style="padding: 12px 28px; font-size: 15px; font-weight: 600;" onclick="window.startScheduledTest('${nextAvailable.id}')">
                Start Next Available Test: ${nextAvailable.title} →
              </button>
            ` : ''}
            <button class="btn btn-primary" style="padding: 12px 28px; font-size: 15px;" onclick="switchTab('tab-stu-dashboard')">
              Return to My Tests →
            </button>
            <button class="btn btn-outline-secondary" onclick="window.scheduledTestEngineInstance.renderResultsAndLearningHub()">
              View Test & Notes Review
            </button>
          </div>
        </div>
      `;
    } else {
      // MASTERY THRESHOLD NOT MET (RETURN TO RELEVANT NOTES & PRACTICE)
      container.innerHTML = `
        <div class="card text-center py-5" style="background: rgba(239, 68, 68, 0.1); border: 2px solid var(--rose-danger);">
          <div style="font-size: 56px; margin-bottom: 12px;">⚠️</div>
          <span class="badge badge-danger" style="font-size: 14px; padding: 6px 14px;">Mastery Threshold Not Yet Met (${percentage}% &lt; ${threshold}% Target)</span>
          <h2 style="margin: 16px 0 8px 0; color: #FFFFFF;">Additional Review Required</h2>
          <p style="color: #CBD5E1; max-width: 600px; margin: 0 auto 24px auto; font-size: 14px; line-height: 1.6;">
            You scored <strong>${correctCount} / ${total} (${percentage}%)</strong> on this attempt. Your instructor has set a mastery requirement of <strong>${threshold}%</strong> before moving forward. Return to the targeted notes and interact with the AI Tutor for clarification before retrying.
          </p>
          <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
            <button class="btn btn-warning" style="padding: 12px 28px; font-size: 15px;" onclick="window.scheduledTestEngineInstance.renderResultsAndLearningHub()">
              📖 Return to Relevant Notes & AI Tutor →
            </button>
            <button class="btn btn-outline-secondary" onclick="switchTab('tab-stu-dashboard')">
              Back to My Tests
            </button>
          </div>
        </div>
      `;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Global instance
window.scheduledTestEngineInstance = new ScheduledTestEngine();
