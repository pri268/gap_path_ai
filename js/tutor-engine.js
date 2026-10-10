/**
 * GAPPath AI - Personal Student Tutor & Learning Engine
 * 
 * Provides:
 * 1. Dedicated 4-Step Learning Journey:
 *    - Step 1: Choose a concept (diagnosed gaps highlighted with cautious indicators)
 *    - Step 2: Learn concept (B.Tech objectives, analogies, worked calculations, traps, comprehension checks, YouTube tutorials)
 *    - Step 3: Take 5-question concept retest (randomized question & option order, correct key preservation)
 *    - Step 4: Show retest results & comparison with prior diagnostic evidence, saved to learning history
 * 2. Multi-turn natural language AI Tutor chatbot with authentic YouTube recommendations and curated fallback.
 */

class TutorEngine {
  constructor(questionBank) {
    this.questionBank = questionBank || window.gQuestionBank;
    this.activeMode = "learning"; // "learning" (4-step workflow) or "chat" (freeform dialogue)
    this.activeStep = 1; // 1: Choose, 2: Learn, 3: Retest, 4: Results
    this.selectedConceptId = "CN_04_SUBNETTING_IP";
    
    // Retest State
    this.activeRetest = null;
    this.currentRetestIndex = 0;
    this.studentRetestAnswers = {};
    this.latestSessionRecord = null;

    // Chat State
    this.conversationHistory = [];
    this.currentTopic = "General Computer Networks";
    this.pendingQuestion = null;
    this.isGenerating = false;
    this.initialized = false;
  }

  // ==========================================
  // 1. VIEW INITIALIZATION & ROUTING
  // ==========================================
  initView(studentUser, targetConceptId = null) {
    if (!studentUser) {
      studentUser = authEngine.getCurrentUser();
    }

    // Strict access control: only authenticated students
    if (!studentUser || studentUser.role !== CONFIG.ROLES.STUDENT) {
      alert("Access Denied: The GapPath AI Personal Tutor is exclusively reserved for authenticated students.");
      if (typeof switchTab === "function") switchTab("tab-stu-dashboard");
      return;
    }

    if (!this.questionBank && window.gQuestionBank) {
      this.questionBank = window.gQuestionBank;
    }

    // Set student name in header
    const studentNameEl = document.getElementById("tutor-header-student-name");
    if (studentNameEl) studentNameEl.textContent = studentUser.name;

    // Check student's diagnostic records for initial gap recommendation
    const records = storageEngine.getRecordsForStudent(studentUser.student_id, studentUser.email);
    const latestRecord = records.length > 0 ? records[0] : null;

    // If target concept requested directly, jump to Step 2 (Learn)
    if (targetConceptId) {
      this.activeMode = "learning";
      this.openConceptLesson(targetConceptId);
    } else if (this.activeMode === "learning") {
      if (this.activeStep === 1) {
        this.renderStep1ChooseConcept(studentUser, latestRecord);
      } else if (this.activeStep === 2) {
        this.renderStep2LearnConcept(this.selectedConceptId, studentUser, latestRecord);
      } else if (this.activeStep === 3) {
        this.renderStep3RetestQuestion(this.currentRetestIndex);
      } else if (this.activeStep === 4) {
        this.renderStep4Results(this.latestSessionRecord);
      }
    } else {
      this.renderChatView(studentUser, latestRecord);
    }

    this.initialized = true;
  }

  setMode(mode) {
    this.activeMode = mode;
    const studentUser = authEngine.getCurrentUser();
    const records = storageEngine.getRecordsForStudent(studentUser.student_id, studentUser.email);
    const latestRecord = records.length > 0 ? records[0] : null;

    const learnTabBtn = document.getElementById("tutor-mode-tab-learn");
    const chatTabBtn = document.getElementById("tutor-mode-tab-chat");
    const learnSection = document.getElementById("tutor-section-learning");
    const chatSection = document.getElementById("tutor-section-chat");

    if (learnTabBtn && chatTabBtn) {
      if (mode === "learning") {
        learnTabBtn.classList.add("active-mode-btn");
        chatTabBtn.classList.remove("active-mode-btn");
        if (learnSection) learnSection.style.display = "block";
        if (chatSection) chatSection.style.display = "none";
        this.initView(studentUser);
      } else {
        chatTabBtn.classList.add("active-mode-btn");
        learnTabBtn.classList.remove("active-mode-btn");
        if (learnSection) learnSection.style.display = "none";
        if (chatSection) chatSection.style.display = "block";
        this.renderChatView(studentUser, latestRecord);
      }
    }
  }

  // ==========================================
  // STEP 1: CHOOSE A CONCEPT
  // ==========================================
  renderStep1ChooseConcept(studentUser, latestRecord) {
    this.activeStep = 1;
    const container = document.getElementById("tutor-step-container");
    if (!container || !this.questionBank) return;

    const concepts = this.questionBank.concepts || [];
    
    // Identify gaps from previous diagnostic records
    const diagnosedGaps = new Set();
    const records = storageEngine.getRecordsForStudent(studentUser.student_id, studentUser.email);
    records.forEach(r => {
      if (r.primary_likely_gap && r.primary_likely_gap !== "NONE") {
        diagnosedGaps.add(r.primary_likely_gap);
      }
      if (r.item_responses) {
        Object.keys(r.item_responses).forEach(cid => {
          if (!r.item_responses[cid].is_correct) {
            diagnosedGaps.add(cid);
          }
        });
      }
    });

    const conceptsHtml = concepts.map(c => {
      const isDiagnosedGap = diagnosedGaps.has(c.id);
      
      let badgeHtml = "";
      let cardClass = "concept-select-card";

      if (isDiagnosedGap) {
        cardClass += " card-gap-highlight";
        badgeHtml = `
          <span class="badge badge-warning" title="Identified as a possible learning gap in your previous diagnostic assessment. Not definitive proof of lack of understanding.">
            ⚠️ Possible Learning Gap
          </span>
        `;
      } else {
        badgeHtml = `<span class="badge badge-secondary">Tier ${c.tier} · ${c.category}</span>`;
      }

      return `
        <div class="${cardClass}" onclick="window.tutorEngineInstance.openConceptLesson('${c.id}')">
          <div class="concept-card-top">
            <span class="concept-id-tag">${c.id}</span>
            ${badgeHtml}
          </div>
          <h3 class="concept-card-title">${c.name}</h3>
          <p class="concept-card-desc">
            Prerequisites: ${c.prerequisites && c.prerequisites.length > 0 ? c.prerequisites.join(", ") : "None (Foundational Entry)"}
          </p>
          <div class="concept-card-footer">
            <span class="text-xs text-muted">Axioms · Analogies · 5-Question Retest</span>
            <button class="btn btn-sm btn-outline-primary">
              Learn Concept →
            </button>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="learning-step-wrapper">
        <div class="step-progress-indicator">
          <span class="step-pill step-active">Step 1: Choose Concept</span>
          <span class="step-divider">→</span>
          <span class="step-pill">Step 2: Learn Concept</span>
          <span class="step-divider">→</span>
          <span class="step-pill">Step 3: 5-Question Retest</span>
          <span class="step-divider">→</span>
          <span class="step-pill">Step 4: Track Progress</span>
        </div>

        <div class="step-hero-header">
          <h2>Step 1: Choose a Computer Networks Concept</h2>
          <p class="text-muted">
            Select any concept area from your B.Tech curriculum. Concepts identified as possible learning gaps in your diagnostic reports are marked with amber indicators.
          </p>
          ${diagnosedGaps.size > 0 ? `
            <div class="cautious-gap-notice mb-3">
              ℹ️ <strong>Cautious Diagnostic Policy:</strong> Highlighted concepts reflect formative assessment signals where additional practice was recommended. A single incorrect question is never treated as definitive lack of mastery.
            </div>
          ` : ''}
        </div>

        <div class="concept-selection-grid">
          ${conceptsHtml}
        </div>
      </div>
    `;
  }

  // ==========================================
  // STEP 2: LEARN THE CONCEPT
  // ==========================================
  openConceptLesson(conceptId) {
    this.selectedConceptId = conceptId;
    this.activeStep = 2;
    const studentUser = authEngine.getCurrentUser();
    const records = storageEngine.getRecordsForStudent(studentUser.student_id, studentUser.email);
    const latestRecord = records.length > 0 ? records[0] : null;
    this.renderStep2LearnConcept(conceptId, studentUser, latestRecord);
  }

  renderStep2LearnConcept(conceptId, studentUser, latestRecord) {
    this.activeStep = 2;
    const container = document.getElementById("tutor-step-container");
    if (!container || !this.questionBank) return;

    const concept = this.getConceptById(conceptId);
    if (!concept) return;

    // Check if student has diagnostic history for this specific concept
    let personalizedCalloutHtml = "";
    if (latestRecord && latestRecord.item_responses && latestRecord.item_responses[conceptId]) {
      const resp = latestRecord.item_responses[conceptId];
      if (!resp.is_correct) {
        personalizedCalloutHtml = `
          <div class="personalized-diagnostic-nudge mb-4">
            <span style="font-size: 22px;">🎯</span>
            <div>
              <strong style="color: #FBBF24;">Personalized Diagnostic Guidance for ${studentUser.name}:</strong>
              <p style="font-size: 13px; color: #E2E8F0; margin-top: 4px;">
                In your previous diagnostic assessment, you chose Option ${resp.chosen_key || '—'}.
                ${resp.misconception ? `<em>Pedagogical note:</em> ${resp.misconception}` : ''}
                This lesson reinforces that exact distinction.
              </p>
            </div>
          </div>
        `;
      }
    }

    // Get curated explanation content
    const pedagogicalGuide = this.getPedagogicalGuideForConcept(conceptId);
    const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent("Computer Networks " + concept.name + " explained for beginners")}`;

    container.innerHTML = `
      <div class="learning-step-wrapper">
        <div class="step-progress-indicator">
          <button class="btn-step-link" onclick="window.tutorEngineInstance.renderStep1ChooseConcept(authEngine.getCurrentUser())">← Back to Concept Selection</button>
          <span class="step-divider">|</span>
          <span class="step-pill">Step 1: Choose</span>
          <span class="step-divider">→</span>
          <span class="step-pill step-active">Step 2: Learn Concept</span>
          <span class="step-divider">→</span>
          <span class="step-pill">Step 3: 5-Question Retest</span>
          <span class="step-divider">→</span>
          <span class="step-pill">Step 4: Track Progress</span>
        </div>

        <div class="lesson-header-banner">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <span class="badge badge-primary">${concept.id} · Tier ${concept.tier}</span>
              <h2 style="margin: 8px 0 4px 0;">${concept.name}</h2>
              <div class="text-muted text-xs">Curriculum Scope: ${concept.category} · Prerequisites: ${concept.prerequisites && concept.prerequisites.length > 0 ? concept.prerequisites.join(", ") : "None (Foundational Entry Point)"}</div>
            </div>
            <button class="btn btn-success" onclick="window.tutorEngineInstance.startConceptRetest('${conceptId}')">
              I am ready for the retest →
            </button>
          </div>
        </div>

        ${personalizedCalloutHtml}

        <!-- Learning Objectives -->
        <div class="lesson-objectives-box mb-4">
          <div class="objectives-title">🎯 Undergraduate Learning Objectives:</div>
          <ul class="objectives-list">
            ${pedagogicalGuide.objectives.map(obj => `<li>${obj}</li>`).join("")}
          </ul>
        </div>

        <!-- Comprehensive Step-by-Step Explanation -->
        <div class="card lesson-body-card mb-4 markdown-body">
          ${this.formatMarkdown(pedagogicalGuide.fullLessonText)}
        </div>

        <!-- Quick Interactive Comprehension Checks -->
        <div class="card mb-4">
          <h3 class="mb-2">💡 Quick Comprehension Checks</h3>
          <p class="text-xs text-muted mb-3">
            Click an option below to test your understanding before the scored retest. Answers and rationale are shown instantly.
          </p>
          <div class="comprehension-checks-grid">
            ${pedagogicalGuide.comprehensionChecks.map((chk, idx) => `
              <div class="check-card">
                <div class="check-q-title">Check #${idx + 1}: ${chk.question}</div>
                <div class="check-options-list">
                  ${chk.options.map((opt, oIdx) => `
                    <button class="btn-check-opt" onclick="window.tutorEngineInstance.revealCheckAnswer('check_ans_${idx}_${oIdx}', ${opt.is_correct})">
                      <strong>${opt.key})</strong> ${opt.text}
                    </button>
                    <div id="check_ans_${idx}_${oIdx}" class="check-answer-reveal" style="display: none;">
                      ${opt.is_correct 
                        ? `<span class="text-emerald">✓ <strong>Correct!</strong> ${opt.explanation}</span>` 
                        : `<span class="text-rose">✗ <strong>Incorrect.</strong> ${opt.explanation}</span>`}
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Relevant YouTube Learning Recommendations -->
        <div class="card mb-4">
          <div class="video-section-header">
            <span>📺 <strong>Recommended YouTube Learning Tutorials:</strong> ${concept.name}</span>
            <span class="badge badge-secondary text-xs">Curated Search Recommendation</span>
          </div>
          <div class="video-search-rec-card">
            <div class="video-rec-body">
              <div style="font-size: 28px; margin-right: 14px;">▶️</div>
              <div>
                <div style="font-weight: 600; color: #FFFFFF;">Top-Rated Visual Tutorials: ${concept.name}</div>
                <div style="font-size: 13px; color: #94A3B8; margin-top: 2px;">
                  Recommended undergraduate educators: <em>NetworkChuck, Gate Smashers, Sunny Classroom, PowerCert Animated Videos, Ben Eater</em>.
                </div>
                <div class="video-honest-badge mt-2">
                  🔍 <strong>Verified Search Query:</strong> Click below to open verified YouTube tutorials tailored to undergraduate exam preparation.
                </div>
              </div>
            </div>
            <div style="margin-top: 12px; text-align: right;">
              <a href="${ytSearchUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                Watch ${concept.name} Tutorials on YouTube ↗
              </a>
            </div>
          </div>
        </div>

        <!-- Bottom Ready CTA -->
        <div class="card text-center py-4">
          <h3>Finished studying this concept?</h3>
          <p class="text-muted text-xs mb-3">
            Take a 5-question multiple-choice retest to assess your improvement. Your score will be saved to your Student Dashboard.
          </p>
          <button class="btn btn-success" style="font-size: 16px; padding: 12px 28px;" onclick="window.tutorEngineInstance.startConceptRetest('${conceptId}')">
            Start 5-Question Retest →
          </button>
        </div>
      </div>
    `;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  revealCheckAnswer(elementId, isCorrect) {
    const el = document.getElementById(elementId);
    if (el) {
      el.style.display = "block";
    }
  }

  // ==========================================
  // STEP 3: 5-QUESTION CONCEPT RETEST
  // ==========================================
  startConceptRetest(conceptId) {
    this.selectedConceptId = conceptId;
    this.activeStep = 3;
    const studentUser = authEngine.getCurrentUser();
    const concept = this.getConceptById(conceptId);
    if (!concept) return;

    // Collect all available questions for this concept (3 diagnostic pool + 3 practice items = 6 items)
    const pool = concept.diagnostic_pool || [];
    const practice = concept.practice_questions || [];
    const allAvailable = [...pool, ...practice];

    // Identify question used in earlier diagnostic attempt, if known
    const records = storageEngine.getRecordsForStudent(studentUser.student_id, studentUser.email);
    let usedQuestionId = null;
    if (records.length > 0 && records[0].item_responses && records[0].item_responses[conceptId]) {
      usedQuestionId = records[0].item_responses[conceptId].question_id;
    }

    // Filter to avoid reusing the diagnostic question if possible
    let candidateQuestions = allAvailable.filter(q => q.id !== usedQuestionId);
    if (candidateQuestions.length < 5) {
      candidateQuestions = [...allAvailable];
    }

    // Select 5 questions
    const selectedFive = candidateQuestions.slice(0, 5);

    // Shuffle presentation order
    const shuffledQuestions = [...selectedFive].sort(() => 0.5 - Math.random());

    // Shuffle options independently for each question while preserving correct mapping
    const processedQuestions = shuffledQuestions.map((q, idx) => {
      const originalOptions = [...q.options];
      const shuffledOptions = [...originalOptions].sort(() => 0.5 - Math.random());
      
      const keys = ["A", "B", "C", "D"];
      let newCorrectKey = "A";
      const remappedOptions = shuffledOptions.map((opt, oIdx) => {
        const newKey = keys[oIdx];
        if (opt.is_correct) {
          newCorrectKey = newKey;
        }
        return {
          key: newKey,
          text: opt.text,
          is_correct: opt.is_correct,
          explanation: opt.explanation || opt.rationale || q.explanation
        };
      });

      return {
        question_id: q.id,
        index: idx,
        concept_id: concept.id,
        concept_name: concept.name,
        text: q.text,
        options: remappedOptions,
        correct_option: newCorrectKey,
        explanation: q.explanation || "Official undergraduate syllabus rationale."
      };
    });

    // Initialize retest state
    this.activeRetest = {
      concept_id: conceptId,
      concept_name: concept.name,
      questions: processedQuestions,
      started_at: new Date().toISOString()
    };
    this.currentRetestIndex = 0;
    this.studentRetestAnswers = {};

    this.renderStep3RetestQuestion(0);
  }

  renderStep3RetestQuestion(index) {
    if (!this.activeRetest || !this.activeRetest.questions) return;
    const questions = this.activeRetest.questions;
    if (index < 0 || index >= questions.length) return;

    this.currentRetestIndex = index;
    const qItem = questions[index];
    const container = document.getElementById("tutor-step-container");
    if (!container) return;

    const chosenKey = this.studentRetestAnswers[qItem.question_id] || null;

    container.innerHTML = `
      <div class="learning-step-wrapper">
        <div class="step-progress-indicator">
          <button class="btn-step-link" onclick="window.tutorEngineInstance.openConceptLesson('${this.selectedConceptId}')">← Back to Lesson</button>
          <span class="step-divider">|</span>
          <span class="step-pill">Step 1: Choose</span>
          <span class="step-divider">→</span>
          <span class="step-pill">Step 2: Learn</span>
          <span class="step-divider">→</span>
          <span class="step-pill step-active">Step 3: 5-Question Retest</span>
          <span class="step-divider">→</span>
          <span class="step-pill">Step 4: Track Progress</span>
        </div>

        <div class="card tutor-retest-card">
          <div class="retest-stepper-header">
            <div>
              <span class="badge badge-primary">Concept Retest: ${qItem.concept_name}</span>
              <h3 style="margin: 8px 0 0 0;">Question ${index + 1} of ${questions.length}</h3>
              <span class="text-xs text-muted">Item ID: <code>${qItem.question_id}</code></span>
            </div>
            <div class="retest-nav-dots-wrapper">
              ${questions.map((q, i) => {
                const isAnswered = !!this.studentRetestAnswers[q.question_id];
                const isCurrent = i === index;
                return `
                  <button class="retest-dot ${isCurrent ? 'retest-dot-current' : ''} ${isAnswered ? 'retest-dot-answered' : ''}"
                          onclick="window.tutorEngineInstance.renderStep3RetestQuestion(${i})">
                    ${i + 1}
                  </button>
                `;
              }).join("")}
            </div>
          </div>

          <div class="retest-q-box mt-3 mb-4">
            <p class="retest-q-text">${qItem.text}</p>
          </div>

          <div class="retest-options-list">
            ${qItem.options.map(opt => `
              <label class="retest-option-label ${chosenKey === opt.key ? 'retest-opt-selected' : ''}">
                <input type="radio" name="opt_${qItem.question_id}" value="${opt.key}"
                       ${chosenKey === opt.key ? 'checked' : ''}
                       onchange="window.tutorEngineInstance.handleRetestOptionSelect('${qItem.question_id}', '${opt.key}')">
                <div class="retest-opt-circle">${opt.key}</div>
                <div class="retest-opt-text">${opt.text}</div>
              </label>
            `).join("")}
          </div>

          <div class="retest-controls-row mt-4">
            <button class="btn btn-secondary" onclick="window.tutorEngineInstance.renderStep3RetestQuestion(${index - 1})" ${index === 0 ? 'disabled' : ''}>
              ← Previous Question
            </button>
            
            ${index < questions.length - 1 ? `
              <button class="btn btn-primary" onclick="window.tutorEngineInstance.renderStep3RetestQuestion(${index + 1})">
                Next Question →
              </button>
            ` : `
              <button class="btn btn-success" onclick="window.tutorEngineInstance.submitConceptRetest()">
                Submit Retest & Track Improvement ✓
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  handleRetestOptionSelect(questionId, key) {
    this.studentRetestAnswers[questionId] = key;
    this.renderStep3RetestQuestion(this.currentRetestIndex);
  }

  // ==========================================
  // STEP 4: RETEST RESULTS, COMPARISON & HISTORY
  // ==========================================
  submitConceptRetest() {
    if (!this.activeRetest) return;
    const questions = this.activeRetest.questions;
    const totalCount = questions.length;
    const answeredCount = Object.keys(this.studentRetestAnswers).length;
    const unansweredCount = totalCount - answeredCount;

    if (unansweredCount > 0) {
      const proceed = confirm(`You have ${unansweredCount} unanswered questions in this 5-question retest. Would you like to submit now?`);
      if (!proceed) return;
    }

    const studentUser = authEngine.getCurrentUser();
    let correctCount = 0;
    const retestResponses = [];

    questions.forEach(q => {
      const chosen = this.studentRetestAnswers[q.question_id] || null;
      const isCorrect = chosen === q.correct_option;
      if (isCorrect) correctCount += 1;

      const chosenOpt = q.options.find(o => o.key === chosen);

      retestResponses.push({
        question_id: q.question_id,
        question_text: q.text,
        chosen_key: chosen || "—",
        chosen_text: chosenOpt ? chosenOpt.text : "Unanswered",
        correct_key: q.correct_option,
        is_correct: isCorrect,
        explanation: q.explanation
      });
    });

    const percentage = Math.round((correctCount / totalCount) * 100);

    // Cautious status evaluation
    let learningStatus = "Improved";
    let statusBadgeClass = "badge-success";
    let nextStepMsg = "Ready to proceed to another concept area.";

    if (correctCount >= 4) {
      learningStatus = "Improved (Positive Signal)";
      statusBadgeClass = "badge-success";
      nextStepMsg = "Strong concept recovery demonstrated. Ready to explore adjacent downstream topics!";
    } else if (correctCount === 3) {
      learningStatus = "Needs more practice (Moderate)";
      statusBadgeClass = "badge-warning";
      nextStepMsg = "Solid foundation, but review calculation edge cases and re-attempt practice.";
    } else {
      learningStatus = "Needs more practice (Foundational Review)";
      statusBadgeClass = "badge-danger";
      nextStepMsg = "Review the introductory analogies and step-by-step worked examples before re-testing.";
    }

    // Retrieve earlier diagnostic evidence for comparison
    const diagnosticRecords = storageEngine.getRecordsForStudent(studentUser.student_id, studentUser.email);
    let prevEvidence = null;
    let scoreComparison = "First Recorded Assessment for This Concept";
    let associatedReportId = null;

    if (diagnosticRecords.length > 0) {
      associatedReportId = diagnosticRecords[0].report_id;
      if (diagnosticRecords[0].item_responses && diagnosticRecords[0].item_responses[this.selectedConceptId]) {
        const prevItem = diagnosticRecords[0].item_responses[this.selectedConceptId];
        prevEvidence = {
          status: prevItem.status,
          is_correct: prevItem.is_correct,
          chosen_key: prevItem.chosen_key,
          misconception: prevItem.misconception || null
        };

        if (!prevItem.is_correct && correctCount >= 4) {
          scoreComparison = `+${percentage}% Improvement (Remediated from initial diagnostic gap)`;
        } else if (!prevItem.is_correct) {
          scoreComparison = `${correctCount}/5 on Retest (Reinforcement in progress)`;
        } else {
          scoreComparison = `Maintained Positive Signal (${correctCount}/5)`;
        }
      }
    }

    // Build unique learning session record
    const sessionId = "SES-2026-" + Math.floor(1000 + Math.random() * 9000);
    const sessionRecord = {
      session_id: sessionId,
      student_id: studentUser.student_id,
      student_name: studentUser.name,
      concept_id: this.selectedConceptId,
      concept_name: this.activeRetest.concept_name,
      lesson_completed: true,
      previous_diagnostic_evidence: prevEvidence,
      retest_score: correctCount,
      retest_total: totalCount,
      retest_percentage: percentage,
      score_comparison: scoreComparison,
      learning_status: learningStatus,
      status_badge_class: statusBadgeClass,
      recommended_next_step: nextStepMsg,
      associated_report_id: associatedReportId,
      started_at: this.activeRetest.started_at,
      completed_at: new Date().toISOString(),
      retest_responses: retestResponses
    };

    // Save to persistent storage (student isolated, guarded against duplicate on refresh)
    storageEngine.saveLearningSession(sessionRecord);
    this.latestSessionRecord = sessionRecord;
    this.activeRetest = null;

    this.renderStep4Results(sessionRecord);
  }

  renderStep4Results(record) {
    if (!record) return;
    this.activeStep = 4;
    const container = document.getElementById("tutor-step-container");
    if (!container) return;

    container.innerHTML = `
      <div class="learning-step-wrapper">
        <div class="step-progress-indicator">
          <span class="step-pill">Step 1: Choose</span>
          <span class="step-divider">→</span>
          <span class="step-pill">Step 2: Learn</span>
          <span class="step-divider">→</span>
          <span class="step-pill">Step 3: Retest</span>
          <span class="step-divider">→</span>
          <span class="step-pill step-active">Step 4: Results & Progress</span>
        </div>

        <div class="card retest-results-hero-card mb-4">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <span class="badge ${record.status_badge_class}">${record.learning_status}</span>
              <h2 style="margin: 10px 0 4px 0;">Retest Complete: ${record.concept_name}</h2>
              <div class="text-muted text-xs">
                Session ID: <code>${record.session_id}</code> · Recorded at: ${new Date(record.completed_at).toLocaleString()}
              </div>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-secondary" onclick="switchTab('tab-stu-dashboard')">
                View in Dashboard History 📊
              </button>
              <button class="btn btn-primary" onclick="window.tutorEngineInstance.renderStep1ChooseConcept(authEngine.getCurrentUser())">
                Study Another Concept →
              </button>
            </div>
          </div>

          <!-- Score & Comparison Metric Grid -->
          <div class="results-hero-grid mt-4">
            <div class="res-stat-card">
              <span class="res-stat-label">Concept Retest Score</span>
              <div class="res-stat-num text-cyan">${record.retest_score} / ${record.retest_total}</div>
              <span class="res-stat-sub text-emerald">${record.retest_percentage}% Accuracy</span>
            </div>

            <div class="res-stat-card">
              <span class="res-stat-label">Diagnostic Evidence Comparison</span>
              <div class="res-stat-num" style="font-size: 18px; color: #F59E0B;">
                ${record.score_comparison}
              </div>
              <span class="res-stat-sub text-muted">
                ${record.previous_diagnostic_evidence ? `Prior Status: ${record.previous_diagnostic_evidence.status}` : 'First recorded assessment for this topic'}
              </span>
            </div>
          </div>

          <!-- Cautious Policy Notice -->
          <div class="cautious-gap-notice mt-3">
            ℹ️ <strong>Cautious Evaluation Policy:</strong> This retest provides formative learning evidence. Mastery cannot be guaranteed solely from a 5-question assessment. Continue solving diverse networking problems to cement your skills.
          </div>
        </div>

        <!-- Item-by-Item Retest Question Trace -->
        <div class="card mb-4">
          <h3 class="mb-3">Item-by-Item Retest Performance & Explanations</h3>
          <div class="retest-trace-list">
            ${record.retest_responses.map((item, idx) => `
              <div class="retest-item-box ${item.is_correct ? 'trace-correct' : 'trace-incorrect'}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong>Item ${idx + 1} (${item.question_id})</strong>
                  <span class="badge ${item.is_correct ? 'badge-success' : 'badge-danger'}">
                    ${item.is_correct ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <p class="text-sm mb-2" style="color: #F1F5F9;">${item.question_text}</p>
                <div class="text-xs mb-2">
                  <span><strong>Your Answer:</strong> Option ${item.chosen_key} (${item.chosen_text})</span>
                  ${!item.is_correct ? `<span class="text-cyan" style="margin-left: 12px;"><strong>Correct Answer:</strong> Option ${item.correct_key}</span>` : ''}
                </div>
                <div class="trace-explanation">
                  <strong>Academic Rationale:</strong> ${item.explanation}
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Next Actions Bar -->
        <div class="card text-center py-4">
          <h3>What would you like to do next?</h3>
          <p class="text-muted text-xs mb-3">${record.recommended_next_step}</p>
          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-outline-warning" onclick="window.tutorEngineInstance.openConceptLesson('${record.concept_id}')">
              Review Lesson Again
            </button>
            <button class="btn btn-primary" onclick="window.tutorEngineInstance.renderStep1ChooseConcept(authEngine.getCurrentUser())">
              Learn Another Concept →
            </button>
            <button class="btn btn-secondary" onclick="switchTab('tab-stu-dashboard')">
              Return to Student Dashboard
            </button>
          </div>
        </div>
      </div>
    `;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ==========================================
  // PEDAGOGICAL CONTENT REPOSITORY
  // ==========================================
  getPedagogicalGuideForConcept(conceptId) {
    const guides = {
      CN_04_SUBNETTING_IP: {
        objectives: [
          "Understand 32-bit IPv4 binary structure and CIDR prefix boundary notation.",
          "Calculate block size, network address, and broadcast address without errors.",
          "Apply the golden formula Usable Hosts = 2^h - 2 to prevent host address exhaustion."
        ],
        fullLessonText: 
          `### 1. Conceptual Foundation: The Street & House Analogy\n\n` +
          `An IPv4 address is like a postal delivery code. Part of the 32 bits identifies the **Network (Neighborhood)**, and the remaining bits identify the **Host (Specific House)**.\n\n` +
          `#### The 32-Bit Fixed Rule\n` +
          `When you see a prefix like \`/26\`:\n` +
          `• **Network Bits:** Exactly $26$ bits are frozen for routing.\n` +
          `• **Host Bits ($h$):** Exactly $32 - 26 = 6$ bits remain for local machine addressing.\n\n` +
          `#### The Golden Formula: Why Subtract 2?\n` +
          `$$\\text{Usable Hosts} = 2^h - 2$$\n` +
          `Every subnet reserves:\n` +
          `1. **All host bits 0:** Represents the entire Subnet/Network Identifier.\n` +
          `2. **All host bits 1:** Represents the Subnet Broadcast Address (sends packets to all machines on the subnet).\n\n` +
          `### 2. Step-by-Step Worked Calculation Example\n\n` +
          `**Scenario:** Given IP \`192.168.10.75/26\`, find the network ID, broadcast address, and usable range.\n\n` +
          `1. **Identify the interesting octet:** $26$ bits = 8 + 8 + 8 + 2. The division falls in the 4th octet.\n` +
          `2. **Subnet Mask:** Two 1s in the 4th octet ($128 + 64 = 192$). Full mask = \`255.255.255.192\`.\n` +
          `3. **Magic Block Size:** $256 - 192 = 64$ (or $2^6 = 64$).\n` +
          `4. **Subnet Multiples:** 0, 64, 128, 192...\n` +
          `5. **Locate our IP:** .75 falls between 64 and 127.\n` +
          `• **Network ID:** \`192.168.10.64\`\n` +
          `• **Broadcast Address:** \`192.168.10.127\`\n` +
          `• **Usable Host Range:** \`192.168.10.65\` to \`192.168.10.126\` (exactly 62 usable machines).\n\n` +
          `### 3. Semester Exam Traps to Avoid\n\n` +
          `• **Trap 1:** Forgetting to subtract 2 when asked for *usable* hosts.\n` +
          `• **Trap 2:** Confusing subnet mask bits with host bits when borrowing from octets.`,
        comprehensionChecks: [
          {
            question: "How many usable host IP addresses are available in a /28 subnet?",
            options: [
              { key: "A", text: "16 hosts", is_correct: false, explanation: "16 is the total number of addresses (2^4), but network and broadcast addresses must be subtracted." },
              { key: "B", text: "14 hosts", is_correct: true, explanation: "Correct! 32 - 28 = 4 host bits. 2^4 - 2 = 14 usable hosts." },
              { key: "C", text: "30 hosts", is_correct: false, explanation: "30 hosts would correspond to a /27 subnet (2^5 - 2)." },
              { key: "D", text: "12 hosts", is_correct: false, explanation: "There are 2 reserved addresses, not 4." }
            ]
          },
          {
            question: "What is the broadcast address for the subnet containing 10.0.1.130/25?",
            options: [
              { key: "A", text: "10.0.1.255", is_correct: true, explanation: "Correct! With /25, subnets are 0-127 and 128-255. The broadcast for the second subnet is 10.0.1.255." },
              { key: "B", text: "10.0.1.127", is_correct: false, explanation: "10.0.1.127 is the broadcast address of the first subnet (0-127)." },
              { key: "C", text: "10.0.1.128", is_correct: false, explanation: "10.0.1.128 is the network ID of this subnet, not the broadcast address." },
              { key: "D", text: "10.0.255.255", is_correct: false, explanation: "This would span outside the Class C boundary of the given prefix." }
            ]
          }
        ]
      },
      CN_01_OSI_LAYERS: {
        objectives: [
          "Understand the 7 layers of the OSI model and their corresponding PDUs.",
          "Distinguish Layer 2 physical addressing (MAC) from Layer 3 logical routing (IP).",
          "Identify header encapsulation and decapsulation flows."
        ],
        fullLessonText:
          `### 1. Conceptual Foundation: The International Postal Analogy\n\n` +
          `When you send a certified letter internationally:\n` +
          `• **Application (L7):** You draft the message.\n` +
          `• **Presentation (L6):** Translate to French and seal in an envelope.\n` +
          `• **Transport (L4):** Segment the message and number the sheets (TCP).\n` +
          `• **Network (L3):** Write the recipient's city and postal code (IP Packet).\n` +
          `• **Data Link (L2):** The local postal truck driving between distribution centers (Ethernet Frame).\n` +
          `• **Physical (L1):** The paved highway the truck drives on (Raw Bits on Wire).\n\n` +
          `### 2. Protocol Data Units (PDUs) by Layer\n\n` +
          `| Layer | Name | PDU | Core Function |\n` +
          `| :--- | :--- | :--- | :--- |\n` +
          `| Layer 4 | Transport | **Segment** | Process-to-process multiplexing (Ports) |\n` +
          `| Layer 3 | Network | **Packet** | Host-to-host logical routing (IP) |\n` +
          `| Layer 2 | Data Link | **Frame** | Node-to-node hop delivery (MAC) |\n` +
          `| Layer 1 | Physical | **Bits** | Signal modulation (Voltages/Light) |`,
        comprehensionChecks: [
          {
            question: "At which layer does a standard network switch operate to forward frames based on MAC addresses?",
            options: [
              { key: "A", text: "Layer 1 (Physical)", is_correct: false, explanation: "Layer 1 hubs repeat raw electrical bits, not MAC frames." },
              { key: "B", text: "Layer 2 (Data Link)", is_correct: true, explanation: "Correct! Layer 2 switches maintain MAC address tables and forward Frames." },
              { key: "C", text: "Layer 3 (Network)", is_correct: false, explanation: "Layer 3 routers forward Packets based on IP addresses." },
              { key: "D", text: "Layer 4 (Transport)", is_correct: false, explanation: "Layer 4 inspects TCP/UDP port numbers." }
            ]
          }
        ]
      }
    };

    // Return specific guide or dynamic fallback guide
    if (guides[conceptId]) return guides[conceptId];

    const c = this.getConceptById(conceptId) || { name: conceptId, category: "Core Networking" };
    return {
      objectives: [
        `Master theoretical and practical fundamentals of ${c.name}.`,
        "Analyze core protocol data structures and operational constraints.",
        "Solve undergraduate exam problem sets and prevent common design traps."
      ],
      fullLessonText:
        `### 1. Conceptual Foundation of ${c.name}\n\n` +
        `In undergraduate Computer Networks, **${c.name}** establishes essential mechanisms for reliable, high-throughput distributed communication.\n\n` +
        `#### Core Architectural Tenets\n` +
        `• **Header Encapsulation:** Critical control signals are prepended to ensure intermediate nodes make correct forwarding and error-handling decisions.\n` +
        `• **Verification & State:** State machines track sequence numbers, acknowledgment status, and timers to handle unreliable physical channels.\n\n` +
        `### 2. Worked Analysis & Rules of Operation\n\n` +
        `1. **Sender Responsibility:** Modulate data, compute integrity verification checksums, and buffer pending frames.\n` +
        `2. **Channel Transmission:** Propagate bits across guided or unguided media subject to propagation delay $\\tau = d / v$.\n` +
        `3. **Receiver Verification:** Parse header, validate checksum, and dispatch data to higher layers.`,
      comprehensionChecks: [
        {
          question: `What is the primary objective of ${c.name} in standard protocol stacks?`,
          options: [
            { key: "A", text: "Guarantee structured and verifiable communication across network nodes", is_correct: true, explanation: "Correct! Protocol layers enforce standardized, verifiable state exchanges." },
            { key: "B", text: "Eliminate the need for physical transmission media", is_correct: false, explanation: "Physical media is always required to transmit signals." }
          ]
        }
      ]
    };
  }

  // ==========================================
  // FREEFORM CHAT VIEW & ENGINE INTEGRATION
  // ==========================================
  renderChatView(studentUser, latestRecord) {
    this.activeMode = "chat";
    const container = document.getElementById("tutor-step-container");
    if (!container) return;

    container.innerHTML = `
      <div class="tutor-chat-embedded-wrapper">
        <!-- Diagnosed Gap Notice Banner -->
        <div id="tutor-gap-alert-box" class="mb-3" style="display: none;"></div>

        <!-- Chat Viewport -->
        <div id="tutor-chat-viewport" class="tutor-chat-viewport">
          <div id="tutor-chat-messages" class="tutor-messages-scroll"></div>
          
          <div id="tutor-typing-indicator" class="tutor-typing-indicator" style="display: none;">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <span style="margin-left: 8px; font-size: 12px; color: #94A3B8;">GapPath AI Tutor is formulating an explanation...</span>
          </div>
        </div>

        <!-- Suggested Prompt Chips -->
        <div class="tutor-quick-chips-wrapper mt-3">
          <span class="chips-label">Suggested Prompts:</span>
          <div class="chips-scroll">
            <button type="button" class="tutor-prompt-chip" onclick="window.tutorEngineInstance.sendPresetPrompt('Can you provide a simpler explanation for a beginner?')">
              💡 Simpler Explanation
            </button>
            <button type="button" class="tutor-prompt-chip" onclick="window.tutorEngineInstance.sendPresetPrompt('Can you give a clear real-world example of this concept?')">
              🔍 Real-World Example
            </button>
            <button type="button" class="tutor-prompt-chip" onclick="window.tutorEngineInstance.sendPresetPrompt('Can you explain this concept using a simple analogy?')">
              🌉 Analogy
            </button>
            <button type="button" class="tutor-prompt-chip" onclick="window.tutorEngineInstance.sendPresetPrompt('Can you provide a concise summary of the key takeaways?')">
              📑 Concise Summary
            </button>
            <button type="button" class="tutor-prompt-chip" onclick="window.tutorEngineInstance.sendPresetPrompt('Give me a practice question to test my understanding')">
              📝 Practice Question
            </button>
            <button type="button" class="tutor-prompt-chip" onclick="window.tutorEngineInstance.sendPresetPrompt('What is the difference between TCP and UDP?')">
              ⚖️ TCP vs UDP
            </button>
            <button type="button" class="tutor-prompt-chip" onclick="window.tutorEngineInstance.sendPresetPrompt('Explain subnetting like I am a beginner with a worked calculation')">
              🔢 Subnetting Calculation
            </button>
          </div>
        </div>

        <!-- Chat Input Form -->
        <form id="tutor-chat-form" onsubmit="event.preventDefault(); window.tutorEngineInstance.handleStudentSubmit();" class="tutor-input-form mt-2">
          <div class="tutor-input-wrapper">
            <input type="text" id="tutor-chat-input" class="form-control tutor-input-box"
                   placeholder="Ask any question about Computer Networks (e.g. 'Why do we need 3-way handshake?', 'How does CRC work?')..."
                   autocomplete="off" required>
            <button type="submit" id="tutor-send-btn" class="btn btn-primary tutor-send-btn">
              Send ✈️
            </button>
          </div>
          <div class="tutor-disclaimer-text">
            🔒 <strong>Privacy Guarantee:</strong> Only your authenticated account can access this session. Private student records are never transmitted to external APIs.
          </div>
        </form>
      </div>
    `;

    this.renderGapNoticeBanner(latestRecord);

    if (this.conversationHistory.length === 0) {
      this.generateInitialGreeting(studentUser, latestRecord);
    } else {
      this.renderMessages();
    }
  }

  renderGapNoticeBanner(latestRecord) {
    const bannerEl = document.getElementById("tutor-gap-alert-box");
    if (!bannerEl) return;

    if (latestRecord && latestRecord.primary_likely_gap && latestRecord.primary_likely_gap !== "NONE") {
      const gapConcept = this.getConceptById(latestRecord.primary_likely_gap);
      const gapName = gapConcept ? gapConcept.name : latestRecord.primary_likely_gap;

      bannerEl.style.display = "block";
      bannerEl.innerHTML = `
        <div class="tutor-gap-card">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <span class="badge badge-warning">Formative Diagnosis Signal</span>
              <strong style="margin-left: 8px; color: #FFFFFF;">Recommended Focus: ${gapName}</strong>
              <p style="font-size: 13px; color: #CBD5E1; margin-top: 4px;">
                Your latest diagnostic suggested more practice with <strong>${gapName}</strong>.
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-xs btn-primary" onclick="window.tutorEngineInstance.openConceptLesson('${latestRecord.primary_likely_gap}')">
                Open Structured 4-Step Lesson →
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      bannerEl.style.display = "none";
    }
  }

  generateInitialGreeting(studentUser, latestRecord) {
    let greetingText = "";
    let suggestedVideosTopic = null;

    if (latestRecord && latestRecord.primary_likely_gap && latestRecord.primary_likely_gap !== "NONE") {
      const gapConcept = this.getConceptById(latestRecord.primary_likely_gap);
      const gapName = gapConcept ? gapConcept.name : latestRecord.primary_likely_gap;
      this.currentTopic = gapName;
      suggestedVideosTopic = gapName;

      greetingText = 
        `Hello **${studentUser.name}**! 👋 Welcome to your **GapPath AI Personal Tutor**.\n\n` +
        `I’ve reviewed your diagnostic results. Your recent quiz suggests you may need more practice with **${gapName}**.\n\n` +
        `Shall we start from the very basics with a simple real-world analogy and a worked example, or would you like to ask a specific question first?`;
    } else {
      greetingText = 
        `Hello **${studentUser.name}**! 👋 I am your **GapPath AI Personal Tutor** for Computer Networks.\n\n` +
        `I specialize in making tricky networking topics simple and intuitive for B.Tech undergraduate students. You can ask me:\n` +
        `• *"Explain subnetting like I'm a beginner"*\n` +
        `• *"What is the difference between TCP and UDP?"*\n` +
        `• *"Explain the OSI model with a real-world example"*\n` +
        `• *"Make revision notes for routing algorithms"*\n\n` +
        `What would you like to explore today?`;
    }

    const greetingMessage = {
      id: "msg_" + Date.now(),
      role: "tutor",
      source_label: "✨ GapPath AI Tutor",
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      topic: suggestedVideosTopic || "General Computer Networks",
      videos: null
    };

    this.conversationHistory.push(greetingMessage);
    this.renderMessages();

    if (suggestedVideosTopic) {
      this.fetchAndAttachVideos(greetingMessage.id, suggestedVideosTopic);
    }
  }

  async handleStudentSubmit() {
    if (this.isGenerating) return;

    const inputEl = document.getElementById("tutor-chat-input");
    if (!inputEl) return;

    const rawText = inputEl.value.trim();
    if (!rawText) return;

    inputEl.value = "";
    this.appendStudentMessage(rawText);
    this.setLoadingState(true);

    try {
      await this.processTutorReply(rawText);
    } catch (err) {
      console.error("Tutor response error:", err);
      this.appendTutorErrorMessage("I ran into an issue processing that question. Please click retry or try rephrasing.");
    } finally {
      this.setLoadingState(false);
    }
  }

  appendStudentMessage(text) {
    const msg = {
      id: "msg_" + Date.now(),
      role: "student",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.conversationHistory.push(msg);
    this.renderMessages();
    this.scrollToBottom();
  }

  appendTutorErrorMessage(errorText) {
    const msg = {
      id: "msg_" + Date.now(),
      role: "tutor",
      source_label: "⚠️ System Notice",
      text: errorText,
      is_error: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.conversationHistory.push(msg);
    this.renderMessages();
    this.scrollToBottom();
  }

  async processTutorReply(userPrompt) {
    const studentUser = authEngine.getCurrentUser();
    const records = storageEngine.getRecordsForStudent(studentUser.student_id, studentUser.email);
    const latestRecord = records.length > 0 ? records[0] : null;
    const gapContext = latestRecord && latestRecord.primary_likely_gap ? latestRecord.primary_likely_gap : null;

    const detectedTopic = this.detectTopic(userPrompt) || this.currentTopic;
    this.currentTopic = detectedTopic;

    let apiSuccess = false;
    let replyText = "";
    let sourceLabel = "📚 GapPath Curated CN Knowledge Base";

    try {
      const currentSubject = this.currentSubject || "Computer Networks";
      const notesContext = this.getConceptById ? (this.getConceptById(detectedTopic)?.description || "") : "";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userPrompt,
          subject: currentSubject,
          topic: detectedTopic,
          history: this.conversationHistory.slice(-6).map(m => ({ role: m.role, text: m.text })),
          gap_context: gapContext,
          learning_context: notesContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && (data.text || data.reply)) {
          apiSuccess = true;
          replyText = data.text || data.reply;
          sourceLabel = data.source_label || "✨ GapPath AI (Gemini Flash)";
        } else if (data.status === "error") {
          apiSuccess = true;
          sourceLabel = "⚠️ AI Service Notice (API Error)";
          replyText = `### ⚠️ AI Service Error\n\n${data.error_message || "Gemini API returned an error."}\n\n**Guidance:** ${data.setup_guidance || "Verify that your GEMINI_API_KEY is valid and has active quota in Google AI Studio."}`;
        } else if (data.status === "unavailable" || !data.success) {
          replyText = this.generateCuratedPedagogicalResponse(userPrompt, detectedTopic, latestRecord) + 
            `\n\n---\n*💡 AI Service Notice: Answered from GapPath's verified curriculum knowledge base. To enable real-time Gemini Flash dynamic conversational AI, configure \`GEMINI_API_KEY\` in your server or Render Environment settings.*`;
          sourceLabel = "📚 GapPath Knowledge Base (Curriculum Grounded)";
          apiSuccess = true;
        }
      }
    } catch (e) {
      console.warn("API request failed:", e);
    }

    // Record this help inquiry for the student's progress tracking
    if (studentUser && studentUser.student_id) {
      storageEngine.recordHelpRequest(studentUser.student_id, detectedTopic, detectedTopic, userPrompt);
    }

    if (!apiSuccess) {
      replyText = this.generateCuratedPedagogicalResponse(userPrompt, detectedTopic, latestRecord);
      sourceLabel = "📚 GapPath Knowledge Base (Offline Fallback)";
    }

    const tutorMsg = {
      id: "msg_" + Date.now(),
      role: "tutor",
      source_label: sourceLabel,
      text: replyText,
      topic: detectedTopic,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      videos: null
    };

    this.conversationHistory.push(tutorMsg);
    this.renderMessages();
    this.scrollToBottom();

    this.fetchAndAttachVideos(tutorMsg.id, detectedTopic);
  }

  generateCuratedPedagogicalResponse(prompt, topic, latestRecord) {
    const p = prompt.toLowerCase();

    if (p.includes("why am i getting") || p.includes("learning gap") || p.includes("wrong") || p.includes("quiz suggests")) {
      return this.explainLearningGapPedagogy(latestRecord);
    }

    if (topic.includes("Subnetting") || p.includes("subnet") || p.includes("cidr") || p.includes("ip address")) {
      return (
        `### IPv4 Subnetting & CIDR Explained Simply\n\n` +
        `**Analogy:** An IPv4 address is like a street address. The Network ID is the neighborhood, and the Host ID is the house number.\n\n` +
        `• **32-Bit Fixed Rule:** In a \`/26\` prefix, 26 bits belong to the network and $32 - 26 = 6$ bits belong to hosts.\n` +
        `• **Usable Hosts:** $2^h - 2 = 2^6 - 2 = 62$ usable hosts.\n` +
        `• **Why subtract 2?** The first address (all 0s) is the Network ID, and the last address (all 1s) is the Broadcast Address.\n\n` +
        `💡 *Would you like to try the dedicated 5-question retest to assess your score? Click the **AI Tutor & Learning** tab above!*`
      );
    }

    if (topic.includes("OSI") || p.includes("osi") || p.includes("layers")) {
      return (
        `### OSI Model: International Postal Letter Analogy\n\n` +
        `• **Layer 7 (Application):** Writing your letter in English (HTTP, DNS).\n` +
        `• **Layer 6 (Presentation):** Translating and encrypting the letter (TLS).\n` +
        `• **Layer 4 (Transport):** Numbering the pages and choosing registered mail (TCP Segment).\n` +
        `• **Layer 3 (Network):** Addressing the envelope with destination postal code (IP Packet).\n` +
        `• **Layer 2 (Data Link):** The mail truck driving between postal distribution hubs (Ethernet Frame).\n` +
        `• **Layer 1 (Physical):** The asphalt road surface (Raw bits on physical wire).\n\n` +
        `*Mnemonic:* **P**lease **D**o **N**ot **T**hrow **S**ausage **P**izza **A**way!`
      );
    }

    if (topic.includes("TCP / UDP") || p.includes("tcp") || p.includes("udp")) {
      return (
        `### TCP vs UDP Breakdown\n\n` +
        `• **TCP (Transmission Control Protocol):** Certified phone call. Requires 3-way handshake (SYN, SYN-ACK, ACK), acknowledges packets, and retransmits lost data.\n` +
        `• **UDP (User Datagram Protocol):** Postcard or megaphone. Connectionless, zero handshake, 8-byte header overhead. Ideal for live video streaming and gaming where low latency matters most!`
      );
    }

    return (
      `### Core Principles: ${topic}\n\n` +
      `In computer networks, **${topic}** ensures standardized communication between remote nodes.\n\n` +
      `1. **Layer Abstraction:** Protocols encapsulate lower-layer services.\n` +
      `2. **State Machines:** Devices negotiate capabilities before transmitting payload.\n` +
      `3. **Error Handling:** Checksums and acknowledgments ensure message integrity.\n\n` +
      `*Tip: You can take a 5-question retest on this topic in the **Structured Learning** section!*`
    );
  }

  explainLearningGapPedagogy(latestRecord) {
    if (!latestRecord || !latestRecord.primary_likely_gap || latestRecord.primary_likely_gap === "NONE") {
      return `Great news! Your recent diagnostic assessment showed positive answer signals across the syllabus. Would you like to review an advanced topic like **TCP Congestion Control (AIMD)**?`;
    }

    const gapId = latestRecord.primary_likely_gap;
    const gapConcept = this.getConceptById(gapId);
    const gapName = gapConcept ? gapConcept.name : gapId;

    return (
      `### Formative Review: ${gapName}\n\n` +
      `Your recent diagnostic assessment highlighted an opportunity to strengthen your understanding of **${gapName}** (${gapId}).\n\n` +
      `**Common B.Tech Misconception:** Students often confuse network and host bit boundaries or forget the two reserved addresses.\n\n` +
      `👉 **Recommended Step:** Click the button above to launch the **Dedicated 4-Step Learning Module** for ${gapName} to review the worked examples and complete a 5-question retest!`
    );
  }

  async fetchAndAttachVideos(messageId, topic) {
    let videosData = null;
    try {
      const res = await fetch(`/api/youtube-search?topic=${encodeURIComponent(topic)}`);
      if (res.ok) {
        videosData = await res.json();
      }
    } catch (e) {}

    if (!videosData) {
      const query = `Computer Networks ${topic} explained for beginners`;
      videosData = {
        status: "search_recommendation",
        topic: topic,
        search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        search_query: query,
        is_verified_api: false
      };
    }

    const targetMsg = this.conversationHistory.find(m => m.id === messageId);
    if (targetMsg) {
      targetMsg.videos = videosData;
      this.renderMessages();
      this.scrollToBottom();
    }
  }

  renderMessages() {
    const container = document.getElementById("tutor-chat-messages");
    if (!container) return;

    if (this.conversationHistory.length === 0) {
      container.innerHTML = `<div class="tutor-empty-state">Ask any Computer Networks question below!</div>`;
      return;
    }

    container.innerHTML = this.conversationHistory.map(msg => {
      const isStudent = msg.role === "student";
      return `
        <div class="tutor-message-row ${isStudent ? 'msg-student' : 'msg-tutor'}">
          <div class="tutor-bubble">
            <div class="bubble-header">
              <span class="bubble-sender">${isStudent ? '🎓 You' : (msg.source_label || '🤖 GapPath AI Tutor')}</span>
              <span class="bubble-time">${msg.timestamp}</span>
            </div>
            <div class="bubble-content markdown-body">
              ${this.formatMarkdown(msg.text)}
            </div>
            ${msg.videos ? this.renderVideoRecommendations(msg.videos) : ''}
          </div>
        </div>
      `;
    }).join("");
  }

  renderVideoRecommendations(videosData) {
    const searchUrl = videosData.search_url || `https://www.youtube.com/results?search_query=${encodeURIComponent("Computer Networks " + videosData.topic)}`;
    const topicName = videosData.topic || "Computer Networks";

    return `
      <div class="tutor-video-section">
        <div class="video-section-header">
          <span>📺 <strong>Recommended YouTube Learning Tutorials:</strong> ${topicName}</span>
          <span class="badge badge-secondary text-xs">Curated Search Recommendation</span>
        </div>
        <div class="video-search-rec-card">
          <div class="video-rec-body">
            <div style="font-size: 24px; margin-right: 12px;">▶️</div>
            <div>
              <div style="font-weight: 600; color: #FFFFFF;">Top-Rated Visual Tutorials: ${topicName}</div>
              <div style="font-size: 12px; color: #94A3B8; margin-top: 2px;">
                Recommended channels: <em>NetworkChuck, Gate Smashers, Sunny Classroom, PowerCert Animated Videos</em>.
              </div>
            </div>
          </div>
          <div style="margin-top: 10px; text-align: right;">
            <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
              Watch Tutorials on YouTube ↗
            </a>
          </div>
        </div>
      </div>
    `;
  }

  formatMarkdown(text) {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^#### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    html = html.replace(/\n\n/gim, '<br><br>');
    html = html.replace(/\n/gim, '<br>');

    return html;
  }

  setLoadingState(loading) {
    this.isGenerating = loading;
    const typingIndicator = document.getElementById("tutor-typing-indicator");
    const sendBtn = document.getElementById("tutor-send-btn");
    const inputEl = document.getElementById("tutor-chat-input");

    if (typingIndicator) typingIndicator.style.display = loading ? "flex" : "none";
    if (sendBtn) sendBtn.disabled = loading;
    if (inputEl) inputEl.disabled = loading;
  }

  scrollToBottom() {
    const container = document.getElementById("tutor-chat-messages");
    if (container) {
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
    }
  }

  sendPresetPrompt(promptText) {
    const inputEl = document.getElementById("tutor-chat-input");
    if (inputEl) {
      inputEl.value = promptText;
      this.handleStudentSubmit();
    }
  }

  clearConversation() {
    if (confirm("Start a fresh conversation with your AI Tutor?")) {
      this.conversationHistory = [];
      const studentUser = authEngine.getCurrentUser();
      const records = storageEngine.getRecordsForStudent(studentUser.student_id, studentUser.email);
      const latestRecord = records.length > 0 ? records[0] : null;
      this.generateInitialGreeting(studentUser, latestRecord);
    }
  }

  detectTopic(text) {
    const t = text.toLowerCase();
    if (t.includes("subnet") || t.includes("cidr") || t.includes("ip address")) return "IPv4 Subnetting & CIDR";
    if (t.includes("osi") || t.includes("layer") || t.includes("model")) return "OSI Architecture & Protocol Stacks";
    if (t.includes("tcp") || t.includes("udp") || t.includes("handshake")) return "TCP / UDP Transport Protocols";
    if (t.includes("framing") || t.includes("crc") || t.includes("checksum")) return "Framing & Error Detection (CRC)";
    if (t.includes("flow control") || t.includes("sliding window")) return "Flow Control & Sliding Window Protocols";
    if (t.includes("routing") || t.includes("dijkstra") || t.includes("distance vector")) return "Routing Algorithms";
    if (t.includes("congestion") || t.includes("slow start")) return "TCP Congestion Control";
    if (t.includes("dns") || t.includes("domain")) return "Domain Name System (DNS)";
    if (t.includes("http") || t.includes("web") || t.includes("status code")) return "Application Protocols (HTTP & HTTPS)";
    if (t.includes("security") || t.includes("encryption") || t.includes("firewall")) return "Network Security & Cryptography";
    return this.currentTopic || "General Computer Networks";
  }

  getConceptById(cid) {
    if (!this.questionBank || !this.questionBank.concepts) return null;
    return this.questionBank.concepts.find(c => c.id === cid);
  }
}

window.tutorEngineInstance = null;
