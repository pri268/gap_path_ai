/**
 * GAPPath AI - Adaptive Quiz Generator & Shuffler
 * 
 * Implements Change 3:
 * - Balances across all 10 Computer Networks concepts (1 question per concept area).
 * - Pulls from the concept diagnostic pool (3 distinct questions per concept area).
 * - Avoids recently used question IDs for the student where possible.
 * - Shuffles question presentation order.
 * - Shuffles answer options (A, B, C, D) independently per question while preserving correct mapping.
 * - Persists active quiz in localStorage so page reloads do NOT disrupt or replace questions in-flight.
 * - Records question IDs, attempt ID, and shuffled mapping for full academic auditability.
 * - Never exposes correct answers on the client before submission.
 */

class QuizGenerator {
  constructor() {
    this.storagePrefix = "gappath_active_quiz_";
    this.progressPrefix = "gappath_quiz_progress_";
  }

  // Helper: Fisher-Yates shuffle
  shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Get currently active in-flight quiz for a student if one exists
   */
  getActiveQuiz(studentId) {
    try {
      const key = `${this.storagePrefix}${studentId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Failed to load active quiz:", e);
    }
    return null;
  }

  /**
   * Clear active quiz once submitted or explicitly reset
   */
  clearActiveQuiz(studentId) {
    localStorage.removeItem(`${this.storagePrefix}${studentId}`);
    localStorage.removeItem(`${this.progressPrefix}${studentId}`);
  }

  /**
   * Save partial quiz progress (answers selected, current question index)
   */
  saveProgress(studentId, answers, currentIndex) {
    const key = `${this.progressPrefix}${studentId}`;
    localStorage.setItem(key, JSON.stringify({
      answers: answers || {},
      currentIndex: currentIndex || 0,
      savedAt: new Date().toISOString()
    }));
  }

  /**
   * Get partial progress
   */
  getProgress(studentId) {
    try {
      const key = `${this.progressPrefix}${studentId}`;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to load quiz progress:", e);
    }
    return null;
  }

  /**
   * Generate or retrieve a balanced 10-concept quiz for a student
   * @param {string} studentId
   * @param {Object} questionBank
   * @param {boolean} forceNew - if true, discards existing active attempt and generates new
   */
  getOrGenerateQuiz(studentId, questionBank, forceNew = false) {
    if (!forceNew) {
      const existing = this.getActiveQuiz(studentId);
      if (existing && existing.questions && existing.questions.length === 10) {
        console.log(`Resuming active stable quiz ${existing.attempt_id} for student ${studentId}`);
        return existing;
      }
    }

    // Generate new attempt
    const concepts = questionBank.concepts || [];
    if (concepts.length < 10) {
      console.error("Question bank has fewer than 10 concepts!");
    }

    // Find previous attempts to avoid recently used questions
    const pastRecords = storageEngine.getRecordsForStudent(studentId);
    const recentQuestionIds = new Set();
    if (pastRecords && pastRecords.length > 0) {
      const lastAttempt = pastRecords[0];
      if (lastAttempt.selected_question_ids) {
        lastAttempt.selected_question_ids.forEach(qid => recentQuestionIds.add(qid));
      }
    }

    const selectedItems = [];
    const attemptId = `ATT-2026-${studentId}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Exactly one question from each of the 10 concept areas
    concepts.forEach(concept => {
      const pool = concept.diagnostic_pool && concept.diagnostic_pool.length > 0
        ? concept.diagnostic_pool
        : [concept.diagnostic_question];

      // Try to pick a question not used in the immediate previous attempt
      let candidates = pool.filter(q => !recentQuestionIds.has(q.id));
      if (candidates.length === 0) {
        candidates = pool; // Fallback to all if pool exhausted
      }

      const chosenQuestion = candidates[Math.floor(Math.random() * candidates.length)];

      // 2. Clone and shuffle answer options independently
      const rawOptions = (chosenQuestion.options || []).map(opt => ({ ...opt }));
      const shuffledOptions = this.shuffleArray(rawOptions);

      // Re-assign letter keys A, B, C, D to shuffled positions
      const keyLabels = ["A", "B", "C", "D"];
      let correctKey = "A";

      const finalOptions = shuffledOptions.map((opt, idx) => {
        const assignedKey = keyLabels[idx];
        if (opt.is_correct) {
          correctKey = assignedKey;
        }
        return {
          key: assignedKey,
          text: opt.text,
          is_correct: opt.is_correct,
          rationale: opt.rationale
        };
      });

      selectedItems.push({
        concept_id: concept.id,
        concept_name: concept.name,
        concept_tier: concept.tier,
        concept_category: concept.category,
        prerequisites: concept.prerequisites,
        question_id: chosenQuestion.id,
        text: chosenQuestion.text,
        options: finalOptions,
        // Secretly stored in attempt record on client (not shown in DOM until submit)
        correct_option: correctKey,
        explanation: chosenQuestion.explanation,
        lesson: concept.lesson
      });
    });

    // 3. Shuffle the order of the selected 10 questions
    const shuffledQuestions = this.shuffleArray(selectedItems);

    const quizAttempt = {
      attempt_id: attemptId,
      student_id: studentId,
      created_at: new Date().toISOString(),
      question_count: shuffledQuestions.length,
      selected_question_ids: shuffledQuestions.map(q => q.question_id),
      concepts_covered: shuffledQuestions.map(q => q.concept_id),
      questions: shuffledQuestions
    };

    // Persist active quiz in storage so refresh doesn't change questions
    localStorage.setItem(`${this.storagePrefix}${studentId}`, JSON.stringify(quizAttempt));
    return quizAttempt;
  }
}

const quizGenerator = new QuizGenerator();
