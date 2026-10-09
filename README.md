# GapPath AI — College Computer Networks (CN) Diagnostic Platform

> **Undergraduate B.Tech Diagnostic Assessment, Targeted Remediation & Academic Governance Engine**  
> *Developed for Academic Evaluation & Hackathon Demonstration*

---

## 🌟 Executive Summary

**GapPath AI** is an explainable, formative diagnostic learning platform tailored to undergraduate Computer Networks (CN) curricula. Unlike traditional multiple-choice test portals that merely produce aggregate scores, GapPath AI maps student responses to a **Directed Acyclic Graph (DAG) of 10 core Computer Networks concepts and prerequisite dependencies**. 

The platform identifies whether an error represents an isolated misconception or a cascading failure originating from an unaddressed foundational prerequisite, directs the student to a targeted micro-lesson with verified video learning resources, and confirms mastery recovery through formative retesting.

---

## 🚀 Getting Started & Startup Instructions

### Prerequisites
- Python 3.9+ (or modern Node.js / any static HTTP server)
- Modern web browser (Chrome, Edge, Firefox, or Safari)

### Quick Start (Local Run)
To launch the complete application with the local API gateway and Gemini AI Tutor integration:

```bash
# Start via Python
python scripts/server.py

# Or start via npm
npm start
```

The application server will start on:  
👉 **`http://localhost:3000`**

#### Environment Configuration & Secret Protection
To enable live AI Tutor conversational responses via Google Gemini, set your API key as an environment variable or in a local `.env` file created from `.env.example`:

```bash
# Copy example template
cp .env.example .env
```

```env
# .env (Excluded from Git via .gitignore)
GEMINI_API_KEY="your-gemini-api-key-here"
```

> [!IMPORTANT]
> **Secret Protection Guarantee**:
> - Never commit `.env` or hardcode API keys in frontend code, scripts, or documentation.
> - The application only reads `GEMINI_API_KEY` server-side via `scripts/server.py`. The key is never exposed to browser clients.
> - If an API key is ever accidentally leaked, immediately revoke it at [Google AI Studio](https://aistudio.google.com/) and generate a new secret.
> - If `GEMINI_API_KEY` is omitted, the platform gracefully switches to a built-in pedagogical knowledge base rather than failing.

---

## ☁️ Cloud Deployment Guide

This project includes a Python backend that serves static frontend assets, the live question pool, and the server-side `/api/chat` and `/api/youtube-search` endpoints.

### Platform Compatibility
The server automatically binds to the hosting platform's assigned port via the `PORT` environment variable (`PORT = int(os.environ.get("PORT", 3000))`).

### Supported Cloud Hosts:
1. **Render (Recommended)**:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python scripts/server.py`
   - **Environment Variables**: Add `GEMINI_API_KEY` in the Render Dashboard Environment settings.
2. **Railway**:
   - Automatically detects Python and the included `Procfile` (`web: python scripts/server.py`).
   - Add `GEMINI_API_KEY` under Service Variables.
3. **Fly.io / Heroku**:
   - Automatically detects `Procfile` and `requirements.txt`.
   - Set secret: `fly secrets set GEMINI_API_KEY=...` or `heroku config:set GEMINI_API_KEY=...`.

---

## 🔑 Demo Accounts & Test Assignment Matching

### Evaluator 1-Click Demo Accounts
The login screen features instant 1-click credential buttons for each role:

| Role | Demo Account Name | Email | Initial Password / Phone | Department / Cohort |
|---|---|---|---|---|
| **Student** | Aarav Patel | `aarav.p@college.edu` | `9876543210` | CSE · Section A · 5th Sem |
| **Student** | Riya Sen | `riya.sen@college.edu` | `9876543211` | IT · Section A · 5th Sem |
| **Student** | Kabir Das | `kabir.das@college.edu` | `9876543212` | ECE · Section A · 6th Sem |
| **Student** | Ananya Iyer | `ananya.iyer@college.edu` | `9876543213` | AIML · Section A · 5th Sem |
| **Student** | Vikram Reddy | `vikram.r@college.edu` | `9876543214` | CSE · Section B · 6th Sem |
| **Student** | Pooja Hegde | `pooja.h@college.edu` | `9876543215` | IT · Section B · 5th Sem |
| **Faculty** | Prof. Rajesh Sharma | `rajesh.sharma@college.edu` | `prof.rajesh@cs301` | CSE · CS301 Instructor |
| **Faculty** | Prof. Priya Murthy | `priya.murthy@college.edu` | `prof.priya@it302` | IT · IT302 Instructor |
| **HOD** | Dr. Ananya Sen | `hod.cse@college.edu` | `hod.sen@cse` | HOD - CSE |
| **HOD** | Dr. Vikram Malhotra | `hod.it@college.edu` | `hod.malhotra@it` | HOD - IT |

### Stable Identifier Test Availability Matching
Scheduled assessments are matched to signed-in students using strict **stable identifiers** rather than loose title text:
1. **Department Match (`department`)**: Normalized against departmental aliases (e.g. `CSE`, `COMPUTER SCIENCE`).
2. **Course Code Match (`course_code`)**: Evaluated using alphanumeric course codes (e.g. `CS301` for Computer Networks).
3. **Section Match (`section`)**: Normalized section designations (e.g. `Section A`, `Section B`, or `ALL`).
4. **Semester Match (`semester`)**: Numerical semester digit extraction (e.g. `5` for 5th Sem).
5. **Student ID Whitelist (`target_student_ids`)**: Direct targeting by university roll number where configured.

#### Demo Test Availability Behavior
- **CSE Demo Students** (e.g., Aarav Patel `22CS1048`): Immediately sees assigned scheduled tests (`TEST-CN-2026-01` active midterm and `TEST-CN-2026-02` upcoming assessment).
- **IT / ECE Students** (e.g., Riya Sen `22IT2015` or Kabir Das `22EC3082`): Do not see CSE tests, ensuring strict cohort isolation.
- **Switching Demo Accounts**: Switching accounts dynamically tears down active timers and drafts, clearing prior session answers and refreshing the test list immediately without stale results.
- **Empty State**: "No assigned tests" appears only when a signed-in student truly has zero matching tests.

---

## 🎓 Student Dashboard & Section Bar

The Student Dashboard (`#tab-stu-dashboard`) features an easy-to-use **Section Bar** that provides clear categorization and unambiguous next actions:

### Section Bar Tabs:
1. **▶️ Ongoing Tests**:
   - Shows assessments open in the current availability window with active countdown timers.
   - Next Action: **Start test (10 mins) →** or **Resume test →**.
2. **📅 Upcoming Tests**:
   - Shows future scheduled assessments assigned to the student's cohort.
   - Displays scheduled date, start/end times in IST (UTC+05:30), question counts, and syllabus topics.
   - Next Action: Locked button with clear opening timestamp (`🔒 Opens [Date] at [Time]`).
3. **✅ Completed Tests**:
   - Tabular history of submitted assessments with dates, scores, accuracies, and diagnostic reports.
   - Next Action: **Review Results & Learning Notes →** or **Inspect Report**.
4. **📚 Topics to Study**:
   - Clean list of curriculum topics requiring focus based on diagnostic evidence or syllabus requirements.
   - Next Action: **Study with AI Tutor →** (instantly opens AI Tutor with the topic context).
5. **📈 My Activity**:
   - Metrics grid (total diagnostic attempts, completed sessions, concepts studied, retest accuracy).
   - Chronological log of student retest attempts and practice sessions.
   - Next Action: **View My Progress →**.

*AI Tutor & Learning (`#tab-tutor`) remains accessible from every section and from the header navigation for continuous learning.*

---

## 📈 Simplified My Progress

The My Progress view (`#tab-my-progress`) is simplified to remove clutter, synthetic benchmarks, and complex BKT terminology:

- **Weekly Accuracy Line Graph**: Simple SVG trend line charting weekly test accuracy over time based **strictly on the signed-in student's real activity**.
- **Interactive Points & Tooltips**: Hovering or clicking any point displays the test name, submission date, and accuracy (e.g., `80% accuracy (8/10 correct)`).
- **Plain-Language Topics Summary**:
  - **Finished Topics**: Concepts where formative assessments or retests verified solid understanding.
  - **Topics Still to Finish**: Topics requiring further practice, each paired with a direct **Study with AI Tutor →** action.
- **Clear Empty State**: If the student has not taken any tests yet, a clear, friendly empty state explains how to begin.

---

## 🎯 Post-Test Accuracy Breakdown

At the end of every test (in Results & Diagnosis View `#tab-results`):
- Displays four clear metric cards:
  - **Total Questions** (e.g., `10`)
  - **Correct Answers** (e.g., `8`)
  - **Wrong Answers** (e.g., `2`)
  - **Unanswered** (e.g., `0`)
- **Accuracy Formula**: Calculated strictly as **correct ÷ attempted × 100**, presented in plain language:
  - Example: **`8 of 10 attempted — 80% accuracy`**
- **Clean Separation**: Test accuracy is clearly distinguished from Bayesian Knowledge Tracing (BKT) latent mastery estimates.

---

## 👨‍🏫 Course Instructor (Faculty) Dashboard

The Faculty Portal (`#tab-instructor`) provides a title-bar tab navigation matching the HOD dashboard, eliminating long vertical page scrolling:

### Navigation Subtabs:
1. **📊 Overview**:
   - Segregated counts for assessment status (Scheduled, Active, Upcoming, Closed) and student participation (Attempts, Completions).
2. **📋 Tests and Schedule**:
   - Assessment configuration table and prominent, easy-to-find **➕ Schedule New Test** action modal.
3. **📈 Progress and Class Performance**:
   - Class Completion Rate (%) and mean accuracy (%).
   - **Combined Progress Graph**: Chronological SVG chart comparing accuracy (%) and completion (%) over time with clear labels, legend, and tooltips.
4. **🎯 Topics Needing Support**:
   - Topics sorted by student error count, with pedagogical rationales and direct links to learning resources.
5. **👥 Students Needing Help / Inspect All**:
   - Filterable view of students needing intervention (<60% accuracy, unaddressed retests).
   - Filterable assessments table with filters for **Course**, **Class/Section**, and **Status**.
   - **Simplified Action Buttons**: Standardized on clear, consistent labels: **View Progress**, **Assign Test**, and **Recommend Resource**.
   - **Student Progress Summary Modal (`View Progress`)**:
     - Accessible **GapPath Light Visual Theme**: Soft neutral background (`#F8FAFC`), crisp white cards (`#FFFFFF`), deep navy typography (`#0F172A`), blue primary buttons (`#0284C7`), teal for positive progress (`#0D9488`), and amber for topics needing practice (`#D97706`).
     - **Executive Metrics**: Tests completed count and most recent accuracy derived strictly from actual assessment submissions.
     - **Strengths & Practice Topics**: Categorizes topics the student is doing well in vs. topics needing practice with plain-language reasons based on actual answers (e.g., *"Missed 3 of 5 questions on IPv4 subnetting"*).
     - **Curriculum Scope**: Clear breakdown of syllabus topics completed vs. still to learn.
     - **One Clear Next Step**: Prominent callout guiding faculty or students directly to remediation, in-progress draft completion, or advanced assessments.
     - **Collapsible Attempt Details**: Detailed question-by-question breakdown placed behind a clean **View Attempt Details** toggle; internal technical codes and answer keys are hidden from the primary summary.
     - **Contradictory / Missing Data Handling**: Strictly validates scores against mastery claims (never displays *"Mastery Met"* on 0% scores; displays *"Not enough answers to assess yet"* when unassessed).
   - Strictly scoped to assigned courses, classes, and students.

*Synthetic Benchmarks (N=10,000) has been removed from student and faculty navigation; benchmark data files remain intact in `data/`.*

---

## 🏛️ Department Head (HOD) Dashboard

The HOD Portal (`#tab-hod`) utilizes the same title-bar tab navigation style, strictly scoped to authorized departmental data:

### Navigation Subtabs:
1. **📊 Overview**:
   - Department-level metrics (total submissions, mean score, prerequisite cascades, department course code).
2. **📅 Academic Years**:
   - **Chronologically Sorted Selector**: Grouped into `1st Year`, `2nd Year`, `3rd Year`, and `4th Year`.
   - **Selectable Drilldown**: Selecting an academic year displays courses, classes, scheduled/taken tests, completion, and progress.
   - Shows students needing support and weak curriculum topics for the selected year and course.
3. **📈 Progress and Class Performance**:
   - **Combined Progress Graph**: Visualizes departmental completion and performance trends over time.
4. **🎯 Topics Needing Support**:
   - Department-wide concept failure heatmap across curriculum topics.
5. **👥 Students Needing Help / Inspect All**:
   - Department diagnostic roster with search, cohort filters, and CSV audit export.

---

## 📚 Curriculum Scope: Supported vs Planned

### Currently Implemented & Active in Code/Data
- **Subject**: Computer Networks (B.Tech 3rd Year / 5th Semester: `CS301` / `IT302` / `EC304` / `AI305`).
- **10 Core Concept DAG**:
  - `CN_01_OSI_LAYERS`: OSI Architecture & Reference Models
  - `CN_02_FRAMING_CRC`: Framing & CRC Polynomial Division
  - `CN_03_FLOW_CONTROL`: Sliding Window Protocols (GBN & SR)
  - `CN_04_SUBNETTING_IP`: IPv4 Subnetting & CIDR Prefixes
  - `CN_05_ROUTING_ALGO`: Distance Vector vs Link State Routing
  - `CN_06_TCP_UDP_TRANSPORT`: TCP 3-Way Handshake & Reliability
  - `CN_07_TCP_CONGESTION`: TCP Congestion Control (AIMD & Slow Start)
  - `CN_08_DNS_SYSTEM`: Domain Name System & Hierarchy
  - `CN_09_HTTP_APPLICATION`: HTTP/1.1 vs HTTP/2 Application Protocols
  - `CN_10_NETWORK_SECURITY`: Symmetric / Asymmetric Cryptography & TLS
- **Assessment Engines**: 10-concept adaptive diagnostic assessments, scheduled assessments with drafts and review mode, and 3-item targeted remediation retests.
- **AI Tutor**: Multiturn, concept-grounded conversational tutoring via Gemini API.
- **Psychometric Modeling**: Bayesian Knowledge Tracing (BKT) and distractor rationale classification.

### Planned Features (Labeled for Clarity)
- *Planned*: Question banks and prerequisite DAGs for Operating Systems (`CS302`), Database Management Systems (`CS303`), and Data Structures (`CS304`).
- *Planned*: Server-side database integration with PostgreSQL / Supabase Row-Level Security (RLS).
- *Planned*: Institutional Single Sign-On (SAML / OAuth2 / LDAP).

---

## 📊 Academic Benchmark Data & Synthetic Disclosure

- `data/computer_networks_question_bank.json`: Canonical question bank, rubrics, micro-lessons, and practice items.
- `data/computer_networks_diagnostic_10000.csv`: Synthetic baseline dataset comprising 10,000 simulated undergraduate attempts.
- `data/dataset_stats.json`: Precomputed benchmark summary (score distribution, mean 5.63/10, std dev ±2.52, cascade rate 24.79%).

> **Academic Integrity Notice:**  
> The 10,000 baseline records are **synthetically generated models** used exclusively for psychometric calibration, item discrimination estimation, and cascade error distribution analysis. **They are held strictly separate from real student performance and do not represent human clinical labels.**

---

## 🔒 Report Routing & Institutional Access Control

- ❌ **NO Principal Role**: There is zero Principal login, dashboard, menu, or report recipient in code or navigation.
- ✅ **Strict Dual-Routing**: Reports are automatically co-routed only to the student's assigned Course Instructor and Department HOD based on the departmental matrix.
- ✅ **Privacy Preservation**: Student AI conversations are private learning sessions and are never exposed on faculty or HOD dashboards.

---

## 🧪 Testing & Verification

Run the automated test suites:

```powershell
# Run the dashboard navigation & test availability verification suite
python scripts/test_dashboard_and_test_availability.py

# Run the complete prototype acceptance test suite (34 tests across 16 test suites)
python scripts/test_prototype.py

# Run the in-browser headless runtime test (Edge CDP: tabs, login, DOM, 0 console errors)
python scripts/test_browser_runtime.py
```

All test suites execute with **0 console errors** and **100% test pass rate**.

---

## 💾 Known Prototype Limitations

1. **Local Browser Persistence**: Currently runs in browser persistence mode (`localStorage`). Clearing browser storage resets demo accounts to their initial seeds.
2. **Prototype Authentication**: Employs client-side demo role verification for immediate evaluation; production requires server-enforced JWT/OAuth2.
3. **Question Bank Scope**: Currently Computer Networks (`CS301`) is fully populated with questions, micro-lessons, and retests; other departmental subjects are structured for curriculum expansion.
>>>>>>> 679516a (feat: complete GapPath platform with test scheduling fix and cloud deployment readiness)
