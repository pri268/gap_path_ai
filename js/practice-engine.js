/**
 * GAPPath AI - Targeted Micro-Lesson & 3-Question Practice Retest Engine
 * Delivers focused remediation on the primary diagnosed gap and retests the concept.
 */

class PracticeEngine {
  constructor(questionBank) {
    this.questionBank = questionBank;
    this.currentConcept = null;
    this.currentReportId = null;
    this.practiceAnswers = {};
  }

  setQuestionBank(qb) {
    this.questionBank = qb;
  }

  loadLessonAndRetest(conceptId, reportId) {
    this.currentReportId = reportId;
    this.practiceAnswers = {};
    const concepts = this.questionBank.concepts || [];
    this.currentConcept = concepts.find(c => c.id === conceptId) || concepts[0];

    const lessonContainer = document.getElementById("micro-lesson-content");
    const retestContainer = document.getElementById("practice-retest-items");
    const headerTitle = document.getElementById("remediation-concept-title");
    const resultsContainer = document.getElementById("retest-results-panel");

    if (resultsContainer) resultsContainer.style.display = "none";

    if (headerTitle) {
      headerTitle.textContent = `${this.currentConcept.name} (${this.currentConcept.id})`;
    }

    // Render Micro-lesson
    if (lessonContainer) {
      const lesson = this.currentConcept.lesson;
      lessonContainer.innerHTML = `
        <div class="lesson-card">
          <div class="lesson-header-badge">Targeted Micro-Lesson · High-Yield Architecture Module</div>
          <h3 class="lesson-title">${lesson.title}</h3>
          
          <div class="lesson-axiom-box">
            <span class="axiom-label">Core Architectural Axiom</span>
            <p class="axiom-text">${lesson.axiom}</p>
          </div>

          <div class="lesson-diagram-box">
            <div class="diagram-header">Reference Protocol Architecture</div>
            <pre class="ascii-diagram">${lesson.diagram}</pre>
          </div>

          <div class="lesson-trap-box">
            <span class="trap-label">⚠️ Common Cognitive Trap / B.Tech Pitfall</span>
            <p class="trap-text">${lesson.trap}</p>
          </div>

          <div class="lesson-rules-list">
            <h4>Key Operational Rules</h4>
            <ul>
              ${lesson.rules.map(r => `<li>${r}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
    }

    // Render 3 Practice Questions
    if (retestContainer) {
      const pqs = this.currentConcept.practice_questions || [];
      retestContainer.innerHTML = pqs.map((pq, idx) => `
        <div class="practice-item-card" id="practice-card-${pq.id}">
          <div class="practice-item-header">
            <span class="practice-num-badge">Retest Item ${idx + 1} of 3</span>
            <span class="practice-target-badge">${this.currentConcept.short || this.currentConcept.name}</span>
          </div>
          <p class="practice-question-text">${pq.text}</p>
          <div class="practice-options-grid">
            ${pq.options.map(opt => `
              <label class="practice-option-label" id="opt-label-${pq.id}-${opt.key}">
                <input type="radio" name="pq_${pq.id}" value="${opt.key}" 
                       onchange="window.practiceEngineInstance.recordAnswer('${pq.id}', '${opt.key}')" />
                <span class="opt-key">${opt.key}</span>
                <span class="opt-text">${opt.text}</span>
              </label>
            `).join("")}
          </div>
          <div class="practice-feedback-box" id="feedback-${pq.id}" style="display: none;"></div>
        </div>
      `).join("");
    }
  }

  recordAnswer(questionId, selectedKey) {
    this.practiceAnswers[questionId] = selectedKey;
  }

  submitPracticeRetest() {
    if (!this.currentConcept) return;
    const pqs = this.currentConcept.practice_questions || [];
    
    // Check if all 3 questions answered
    const answeredKeys = Object.keys(this.practiceAnswers);
    if (answeredKeys.length < pqs.length) {
      alert(`Please answer all 3 practice retest items before submitting. (${answeredKeys.length}/3 answered).`);
      return;
    }

    let score = 0;
    pqs.forEach(pq => {
      const chosen = this.practiceAnswers[pq.id];
      const isCorrect = chosen === pq.correct_option;
      if (isCorrect) score += 1;

      // Reveal visual feedback
      const feedbackEl = document.getElementById(`feedback-${pq.id}`);
      if (feedbackEl) {
        feedbackEl.style.display = "block";
        feedbackEl.className = `practice-feedback-box ${isCorrect ? 'fb-correct' : 'fb-incorrect'}`;
        feedbackEl.innerHTML = `
          <strong>${isCorrect ? '✓ Correct Positive Signal' : '✕ Incorrect'}</strong>
          <p>${pq.explanation}</p>
        `;
      }

      // Highlight options
      pq.options.forEach(opt => {
        const lbl = document.getElementById(`opt-label-${pq.id}-${opt.key}`);
        if (lbl) {
          if (opt.key === pq.correct_option) {
            lbl.classList.add("option-correct");
          } else if (opt.key === chosen && !isCorrect) {
            lbl.classList.add("option-incorrect");
          }
        }
      });
    });

    let statusText = "";
    let badgeClass = "";
    if (score === 3) {
      statusText = "Secure Signal (Gap Remediated)";
      badgeClass = "badge-success";
    } else if (score === 2) {
      statusText = "Developing (Partial Concept Recovery)";
      badgeClass = "badge-warning";
    } else {
      statusText = "Needs Instructor Review (Persistent Difficulty)";
      badgeClass = "badge-danger";
    }

    // Persist result into record
    if (this.currentReportId) {
      storageEngine.updatePracticeRetest(this.currentReportId, score, statusText, this.currentConcept.id);
      console.log(`Updated practice retest for ${this.currentReportId}: Score ${score}/3`);
    }

    // Show Results Panel
    const resultsPanel = document.getElementById("retest-results-panel");
    const scoreVal = document.getElementById("retest-score-value");
    const statusVal = document.getElementById("retest-status-badge");
    const summaryMsg = document.getElementById("retest-summary-msg");

    if (scoreVal) scoreVal.textContent = `${score} / 3`;
    if (statusVal) {
      statusVal.textContent = statusText;
      statusVal.className = `badge ${badgeClass}`;
    }
    if (summaryMsg) {
      summaryMsg.textContent = score === 3
        ? "Excellent! The student has demonstrated positive remediation signals on this target concept across all 3 practice variations. Report automatically updated for Course Instructor and HOD."
        : (score === 2 
            ? "Solid improvement with partial recovery. One minor variation requires further review. Report updated for faculty."
            : "The student experienced continued difficulty on this concept. Flagged in the Course Instructor dashboard for targeted office-hour support.");
    }
    if (resultsPanel) {
      resultsPanel.style.display = "block";
      resultsPanel.scrollIntoView({ behavior: "smooth" });
    }
  }
}
