/**
 * GAPPath AI - Explainable Rule-Based Diagnosis Engine
 * 
 * ACADEMIC & ETHICAL DIAGNOSTIC CONSTRAINTS:
 * 1. Runtime diagnosis derives strictly from current student's quiz answers and prerequisite metadata.
 * 2. Does NOT leak `correct_option` or latent mastery fields from synthetic CSV into runtime inputs.
 * 3. Uses cautious language: "Positive answer signal", "Possible learning gap", "More practice recommended",
 *    and "Insufficient evidence to assess confidently".
 * 4. Identifies root prerequisite gaps vs downstream cascading errors.
 * 5. Full auditability: Records attempt ID, question IDs, student choices, and rationale.
 */

class DiagnosisEngine {
  constructor(questionBank) {
    this.questionBank = questionBank;
    this.conceptsMap = {};
    if (questionBank && questionBank.concepts) {
      questionBank.concepts.forEach(c => {
        this.conceptsMap[c.id] = c;
      });
    }
  }

  setQuestionBank(qb) {
    this.questionBank = qb;
    this.conceptsMap = {};
    if (qb && qb.concepts) {
      qb.concepts.forEach(c => {
        this.conceptsMap[c.id] = c;
      });
    }
  }

  /**
   * Run rule-based diagnosis on student answers
   * @param {Object} studentInfo - { student_id, name, email, department, year_semester, course_code, course_name }
   * @param {Object} studentAnswers - { [concept_id or question_id]: "A" | "B" | "C" | "D" }
   * @param {Object} activeQuiz - Optional active quiz attempt object with shuffled questions & options
   */
  evaluate(studentInfo, studentAnswers, activeQuiz = null) {
    const assigned = getAssignedRecipients(studentInfo.department);
    const concepts = this.questionBank.concepts || [];
    
    let totalScore = 0;
    const itemEvidences = {};
    const gapsList = [];
    const positiveSignalsList = [];

    // Determine question list: from activeQuiz if provided, else fallback to standard concept questions
    const questionItems = (activeQuiz && activeQuiz.questions && activeQuiz.questions.length === 10)
      ? activeQuiz.questions
      : concepts.map(c => ({
          concept_id: c.id,
          concept_name: c.name,
          concept_tier: c.tier,
          concept_category: c.category,
          prerequisites: c.prerequisites,
          question_id: c.diagnostic_question.id,
          text: c.diagnostic_question.text,
          options: c.diagnostic_question.options,
          correct_option: c.diagnostic_question.correct_option,
          explanation: c.diagnostic_question.explanation,
          lesson: c.lesson
        }));

    // 1. Item-level evaluation without leaking keys
    questionItems.forEach(qItem => {
      const cid = qItem.concept_id;
      // Answer may be keyed by concept_id or question_id
      const chosenKey = studentAnswers[cid] || studentAnswers[qItem.question_id] || null;

      if (!chosenKey) {
        // Insufficient Evidence
        itemEvidences[cid] = {
          concept_id: cid,
          concept_name: qItem.concept_name,
          category: qItem.concept_category,
          tier: qItem.concept_tier,
          prerequisites: qItem.prerequisites,
          question_id: qItem.question_id,
          question_text: qItem.text,
          options: qItem.options,
          chosen_key: null,
          chosen_text: "Unanswered",
          correct_key: qItem.correct_option,
          is_correct: false,
          status: CONFIG.TERMINOLOGY.INSUFFICIENT_EVIDENCE,
          status_type: "insufficient",
          misconception: "No response submitted; insufficient evidence to assess confidently.",
          explanation: qItem.explanation,
          lesson: qItem.lesson
        };
        return;
      }

      // Check chosen option
      const selectedOption = qItem.options.find(opt => opt.key === chosenKey);
      const isCorrect = selectedOption ? (selectedOption.is_correct || chosenKey === qItem.correct_option) : false;

      if (isCorrect) {
        totalScore += 1;
        positiveSignalsList.push(cid);
        itemEvidences[cid] = {
          concept_id: cid,
          concept_name: qItem.concept_name,
          category: qItem.concept_category,
          tier: qItem.concept_tier,
          prerequisites: qItem.prerequisites,
          question_id: qItem.question_id,
          question_text: qItem.text,
          options: qItem.options,
          chosen_key: chosenKey,
          chosen_text: selectedOption ? selectedOption.text : "",
          correct_key: qItem.correct_option,
          is_correct: true,
          status: CONFIG.TERMINOLOGY.POSITIVE_SIGNAL,
          status_type: "positive",
          misconception: null,
          rationale: selectedOption ? (selectedOption.rationale || "Positive answer signal observed.") : "Positive answer signal observed.",
          explanation: qItem.explanation,
          lesson: qItem.lesson
        };
      } else {
        gapsList.push(cid);
        itemEvidences[cid] = {
          concept_id: cid,
          concept_name: qItem.concept_name,
          category: qItem.concept_category,
          tier: qItem.concept_tier,
          prerequisites: qItem.prerequisites,
          question_id: qItem.question_id,
          question_text: qItem.text,
          options: qItem.options,
          chosen_key: chosenKey,
          chosen_text: selectedOption ? selectedOption.text : "",
          correct_key: qItem.correct_option,
          is_correct: false,
          status: CONFIG.TERMINOLOGY.LIKELY_GAP,
          status_type: "gap",
          misconception: selectedOption ? (selectedOption.rationale || "Incorrect distractor option selected.") : "Incorrect option selected.",
          explanation: qItem.explanation,
          lesson: qItem.lesson
        };
      }
    });

    // 2. Prerequisite DAG Cascade Analysis
    // Trace if an incorrect concept has an upstream prerequisite that was also missed
    let primaryTargetGap = null;
    let rootPrereqGap = null;
    const cascadeIdentified = [];

    gapsList.forEach(cid => {
      const item = itemEvidences[cid];
      const missedPrereqs = (item.prerequisites || []).filter(pid => gapsList.includes(pid));
      
      if (missedPrereqs.length > 0) {
        // This is a cascading failure caused by upstream gap
        item.status = CONFIG.TERMINOLOGY.PREREQUISITE_RISK;
        item.status_type = "prereq_risk";
        item.cascading_from = missedPrereqs;
        cascadeIdentified.push(cid);
        if (!rootPrereqGap) {
          rootPrereqGap = missedPrereqs[0];
        }
      }
    });

    // Determine primary remediation target:
    // If root prerequisite gap exists, prioritize it first (pedagogical bridge)
    if (rootPrereqGap) {
      primaryTargetGap = rootPrereqGap;
    } else if (gapsList.length > 0) {
      primaryTargetGap = gapsList[0];
    } else {
      primaryTargetGap = "NONE";
    }

    // Generate unique Report ID: GAP-2026-[DEPT]-[RAND4]
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const reportId = `GAP-2026-${studentInfo.department}-${randNum}`;
    const timestamp = new Date().toISOString();

    const diagnosisRecord = {
      report_id: reportId,
      quiz_attempt_id: activeQuiz ? activeQuiz.attempt_id : `ATT-2026-${studentInfo.student_id}-${randNum}`,
      selected_question_ids: questionItems.map(q => q.question_id),
      is_synthetic: false,
      student_id: studentInfo.student_id,
      student_name: studentInfo.name,
      student_email: studentInfo.email,
      department: studentInfo.department,
      department_name: assigned.department_name,
      course_code: assigned.course_code,
      course_name: assigned.course_name,
      year_semester: studentInfo.year_semester,
      assigned_instructor: {
        name: assigned.instructor.name,
        email: assigned.instructor.email,
        designation: assigned.instructor.designation
      },
      assigned_hod: {
        name: assigned.hod.name,
        email: assigned.hod.email,
        designation: assigned.hod.designation
      },
      routing_notice: `Report securely routed to Course Instructor: ${assigned.instructor.name} and Dept HOD: ${assigned.hod.name}. (Principal role omitted by institutional policy).`,
      submitted_at: timestamp,
      score: totalScore,
      total_questions: questionItems.length,
      percentage: Math.round((totalScore / questionItems.length) * 100),
      primary_likely_gap: primaryTargetGap,
      primary_gap_name: this.conceptsMap[primaryTargetGap] ? this.conceptsMap[primaryTargetGap].name : "None (All items produced positive signals)",
      is_prereq_cascade: cascadeIdentified.length > 0,
      cascade_count: cascadeIdentified.length,
      root_prerequisite_id: rootPrereqGap,
      item_responses: itemEvidences,
      cautious_summary: totalScore === 10
        ? "Positive answer signals observed across all 10 diagnostic items. Note: single-item observations indicate positive signals, not certified clinical mastery."
        : `Identified ${gapsList.length} possible learning gap(s). Primary recommended learning focus: ${this.conceptsMap[primaryTargetGap] ? this.conceptsMap[primaryTargetGap].name : 'N/A'}. More practice recommended.`,
      practice_retest: {
        completed: false,
        score: 0,
        total: 3,
        status: "Pending Retest",
        target_concept: primaryTargetGap,
        completed_at: null
      }
    };

    return diagnosisRecord;
  }
}
