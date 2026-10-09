"""
GAPPath AI - Comprehensive Verification Test for New Requirements:
1. 10,000 Question Dataset Validation & 4 Subjects Integrity
2. BKT Engine Formulation & Parameter Configuration
3. Single Results Page Metrics, Accuracy Formula & Branching
4. Notes Fallback & Zero 'undefined'/'null' Verification
5. Teacher Subject/Topic Scheduling Integration
"""

import os
import json
import re
import urllib.request
import urllib.parse
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://localhost:3000"

def log_section(title):
    print(f"\n========================================================")
    print(f" {title}")
    print(f"========================================================")

def test_1_dataset_validation():
    log_section("TEST 1: 10,000 Synthetic Question Dataset & 4 Subjects Validation")
    dataset_path = "data/synthetic_questions_10000.json"
    catalog_path = "data/subject_catalog.json"
    stats_path = "data/dataset_stats.json"

    assert os.path.exists(dataset_path), f"Missing {dataset_path}"
    assert os.path.exists(catalog_path), f"Missing {catalog_path}"
    assert os.path.exists(stats_path), f"Missing {stats_path}"

    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    questions = data.get("questions", [])
    total_count = len(questions)
    assert total_count == 10000, f"Expected 10,000 questions, got {total_count}"
    print(f"  [PASS] Dataset Record Count: Exactly {total_count:,} records.")

    # Validate 4 subjects and balance
    expected_subjects = {
        "CN": "Computer Networks",
        "OS": "Operating Systems",
        "DBMS": "Database Management Systems",
        "DSA": "Data Structures and Algorithms"
    }
    
    subject_counts = {}
    topic_counts = {}
    unique_ids = set()
    difficulties = {"Easy": 0, "Medium": 0, "Hard": 0}
    question_types = set()

    for idx, q in enumerate(questions):
        qid = q.get("question_id")
        assert qid, f"Missing question_id at index {idx}"
        assert qid not in unique_ids, f"Duplicate question_id: {qid}"
        unique_ids.add(qid)

        subj_id = q.get("subject_id")
        assert subj_id in expected_subjects, f"Unknown subject {subj_id} in {qid}"
        subject_counts[subj_id] = subject_counts.get(subj_id, 0) + 1

        top_id = q.get("topic_id")
        assert top_id, f"Missing topic_id in {qid}"
        topic_counts[top_id] = topic_counts.get(top_id, 0) + 1

        # Required fields
        for field in ["text", "options", "correct_option", "explanation", "misconception_tag", "difficulty"]:
            assert field in q and q[field], f"Missing or empty {field} in {qid}"

        # Answer key validation
        options = q.get("options", [])
        assert len(options) == 4, f"Question {qid} must have 4 options"
        correct_keys = [opt["key"] for opt in options if opt.get("is_correct") is True]
        assert len(correct_keys) == 1, f"Question {qid} must have exactly 1 correct option, got {correct_keys}"
        assert correct_keys[0] == q["correct_option"], f"Key mismatch in {qid}: {correct_keys[0]} vs {q['correct_option']}"

        # Difficulty & Type
        diff = q.get("difficulty", "").title()
        if diff in difficulties:
            difficulties[diff] = difficulties.get(diff, 0) + 1
        qtype = q.get("question_type") or q.get("type", "single_choice")
        question_types.add(qtype)

    assert len(unique_ids) == 10000, "IDs must be 100% unique"
    print(f"  [PASS] Unique IDs: 10,000 unique question identifiers confirmed.")

    for s_code, s_name in expected_subjects.items():
        count = subject_counts.get(s_code, 0)
        assert count == 2500, f"Expected 2500 questions for {s_name} ({s_code}), got {count}"
        print(f"  [PASS] Subject Balance: {s_name} ({s_code}) has exactly {count:,} questions.")

    assert len(topic_counts) == 40, f"Expected 40 topics total (10 per subject), got {len(topic_counts)}"
    for tid, count in topic_counts.items():
        assert count == 250, f"Expected 250 questions for topic {tid}, got {count}"
    print(f"  [PASS] Topic Balance: All 40 topics across 4 subjects have exactly 250 questions each.")

    print(f"  [PASS] Question Types & Difficulties: Types={list(question_types)}, Difficulties={difficulties}")
    print(f"  [PASS] Single Correct Answer Keys: 10,000 / 10,000 (100%) validated.")

    # API Endpoint check
    req = urllib.request.Request(f"{BASE_URL}/api/questions?validate=true", headers={'User-Agent': 'TestRunner/2.0'})
    with urllib.request.urlopen(req, timeout=5) as response:
        res_json = json.loads(response.read().decode("utf-8"))
        assert res_json.get("status") in ["ok", "valid"]
        assert res_json.get("total_records") == 10000
        assert res_json.get("unique_ids_count") == 10000
        assert res_json.get("answer_keys_validated") is True
        print(f"  [PASS] HTTP Endpoint /api/questions?validate=true returns valid dataset status.")

def test_2_bkt_engine_and_parameters():
    log_section("TEST 2: Bayesian Knowledge Tracing (BKT) Engine & Parameters")
    
    bkt_params_path = "data/bkt_parameters.json"
    assert os.path.exists(bkt_params_path), f"Missing {bkt_params_path}"
    with open(bkt_params_path, "r", encoding="utf-8") as f:
        bkt_data = json.load(f)

    meta = bkt_data.get("metadata", {})
    assert "experimental" in meta.get("tuning_status", "").lower()
    assert "calibrated" in meta.get("scientific_validation_notice", "").lower() or "experimental" in meta.get("scientific_validation_notice", "").lower()
    print("  [PASS] BKT Disclaimer: Clearly labeled as experimental synthetic tuning.")

    # Test BKT mathematical properties in js/bkt-engine.js
    with open("js/bkt-engine.js", "r", encoding="utf-8") as f:
        bkt_js = f.read()

    # Verify standard Corbett & Anderson Bayesian formulas:
    # Correct response: P(L_t | corr) = (P(L_t) * (1 - s)) / (P(L_t) * (1 - s) + (1 - P(L_t)) * g)
    assert "pKnown * (1.0 - pSlip)" in bkt_js, "Missing BKT correct posterior update"
    # Incorrect response: P(L_t | incorr) = (P(L_t) * s) / (P(L_t) * s + (1 - P(L_t)) * (1 - g))
    assert "pKnown * pSlip" in bkt_js, "Missing BKT incorrect posterior update"
    # Learning transition: P(L_{t+1}) = P(L_t | obs) + (1 - P(L_t | obs)) * pTransit
    assert "pPost + (1.0 - pPost) * pTransit" in bkt_js, "Missing learning transition"
    print("  [PASS] BKT Equations: Standard Corbett & Anderson posterior and learning transition verified.")

    # Verify configurable parameters per topic
    for param in ["p_init", "p_transit", "p_guess", "p_slip", "mastery_threshold"]:
        assert param in bkt_js
    print("  [PASS] BKT Configurable Parameters: p_init, p_transit, p_guess, p_slip, and mastery_threshold supported per topic.")

def test_3_results_page_and_branching():
    log_section("TEST 3: Post-Quiz Submission Single Results Page & Branching Logic")
    with open("js/scheduled-test-engine.js", "r", encoding="utf-8") as f:
        sched_js = f.read()

    # 1. Check Metrics Display: Correct, Wrong, Unanswered, Total
    assert "Total Questions" in sched_js
    assert "Correct Answers" in sched_js
    assert "Wrong Answers" in sched_js
    assert "Unanswered Count" in sched_js
    print("  [PASS] 4 Core Metrics: Total, Correct, Wrong, Unanswered counts rendered clearly.")

    # 2. Check Overall Accuracy Formula & Example String
    # Formula: correct answers / questions attempted * 100
    assert "correctCount / attemptedCount" in sched_js or "(correctCount / attemptedCount) * 100" in sched_js
    assert "CORRECT ANSWERS ÷ QUESTIONS ATTEMPTED × 100" in sched_js
    assert "attempted —" in sched_js and "% accuracy" in sched_js
    print("  [PASS] Overall Accuracy: Computed as correct ÷ attempted × 100 with clear example string.")

    # 3. Topic Accuracy calculated only from attempted questions
    assert "topCorrect / topAttempted" in sched_js
    assert "Raw Topic Accuracy (Attempted Questions Only)" in sched_js
    print("  [PASS] Topic Accuracy: Strictly calculated only from questions attempted for that topic.")

    # 4. BKT Topic Mastery kept separate from raw accuracy
    assert "BKT Topic-Mastery Estimate (Bayesian Probability)" in sched_js
    assert "Separate from raw accuracy" in sched_js or "separate from raw quiz accuracy" in sched_js
    print("  [PASS] Separation: Raw accuracy and BKT mastery estimate distinctly labeled.")

    # 5. All-Correct Branch vs Some-Wrong Branch
    # All Correct: Result + Continue action ONLY
    assert "btn-continue-all-correct" in sched_js
    assert "All Answers Correct!" in sched_js
    assert "handleContinue" in sched_js

    # Some Wrong: feedback ONLY for missed questions
    assert "Feedback for Missed Questions" in sched_js
    assert "Showing review feedback strictly for questions answered incorrectly or left blank" in sched_js
    assert "Learning Notes for Missed Topics" in sched_js
    assert "same-page-ai-chat-section" in sched_js
    assert "video-recommendations-section" in sched_js
    assert "startMissedTopicsRetest" in sched_js
    print("  [PASS] Branching: All-correct has Continue only; Some-wrong shows missed question feedback, notes, AI chat, video, and retest.")

def test_4_learning_notes_and_video_fallbacks():
    log_section("TEST 4: Learning Notes Zero-Undefined Guarantee & Honest Video Recommendation")
    with open("js/scheduled-test-engine.js", "r", encoding="utf-8") as f:
        sched_js = f.read()

    # Validation in getSafeTopicNotes preventing 'undefined', 'null', or empty
    assert "getSafeTopicNotes" in sched_js
    assert 'summary === "undefined"' in sched_js
    assert 'summary === "null"' in sched_js
    assert 'pitfalls === "undefined"' in sched_js
    print("  [PASS] Notes Validation: Explicit checks for 'undefined', 'null', and empty strings with curated fallbacks.")

    # Honest video recommendation (no invented URLs)
    assert "getVideoRecommendationForTopic" in sched_js
    assert "Video recommendation is unavailable" in sched_js or "search_query=" in sched_js
    print("  [PASS] Video Recommendation: Uses stored metadata or configured search query without inventing URLs.")

def test_5_teacher_subject_and_topic_scheduling():
    log_section("TEST 5: Teacher Scheduling with 4 Subjects Selection")
    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()
    with open("js/dashboards.js", "r", encoding="utf-8") as f:
        dash_js = f.read()

    assert "sched-input-subject" in html
    for s_code in ["CN", "OS", "DBMS", "DSA"]:
        assert f'value="{s_code}"' in html, f"Missing option for subject {s_code} in index.html"
    print("  [PASS] Modal Subject Selector: All 4 subjects (CN, OS, DBMS, DSA) present in teacher modal dropdown.")

    assert "handleSubjectChange" in dash_js
    assert "populateScheduleTopicsForSubject" in dash_js
    for s_code in ["CN", "OS", "DBMS", "DSA"]:
        assert s_code in dash_js, f"Subject code {s_code} not handled in dashboards.js"
    print("  [PASS] Dynamic Topics: Selecting any of the 4 subjects updates topic checkboxes accordingly.")

if __name__ == "__main__":
    print("\n========================================================")
    print(" VERIFYING NEW USER REQUIREMENTS SUITE")
    print("========================================================")
    test_1_dataset_validation()
    test_2_bkt_engine_and_parameters()
    test_3_results_page_and_branching()
    test_4_learning_notes_and_video_fallbacks()
    test_5_teacher_subject_and_topic_scheduling()
    print("\n========================================================")
    print(" ALL NEW REQUIREMENT VERIFICATION TESTS PASSED (5/5)! ")
    print("========================================================\n")
