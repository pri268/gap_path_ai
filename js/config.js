/**
 * GAPPath AI - College Computer Networks Prototype
 * Configuration & Institutional Governance Mapping
 * 
 * IMPORTANT REPORT ROUTING POLICY:
 * - NO Principal login, dashboard, menu, label, or recipient.
 * - Strict institutional roles: Student, Course Instructor, Department HOD.
 * - Routing is strictly determined by student's department/course mapping.
 * - Course Instructor sees records assigned to their course.
 * - Department HOD sees records within their department only.
 */

const CONFIG = {
  APP_NAME: "GapPath AI",
  APP_SUBTITLE: "College Computer Networks (CN) Diagnostic & Remediation Engine",
  TARGET_AUDIENCE: "B.Tech / Undergraduate Computer Science & Allied Disciplines",
  VERSION: "2.5.0-hackathon",
  
  ROLES: {
    STUDENT: "student",
    INSTRUCTOR: "instructor",
    HOD: "hod"
  },

  // Institution Configured Timezone & Academic Policies
  INSTITUTION_TIMEZONE: "Asia/Kolkata (IST · UTC+05:30)",
  DEFAULT_MASTERY_THRESHOLD: 80,

  // Department to Course & Faculty Assignment Mapping (Strict Institutional Matrix)
  DEPARTMENTS: {
    CSE: {
      code: "CSE",
      name: "Computer Science & Engineering",
      course_code: "CS301",
      course_name: "Computer Networks",
      instructor: {
        name: "Prof. Rajesh Sharma",
        email: "rajesh.sharma@college.edu",
        designation: "Associate Professor, Dept. of CSE"
      },
      hod: {
        name: "Dr. Ananya Sen",
        email: "hod.cse@college.edu",
        designation: "Professor & Head of Department, CSE"
      },
      academic_years: [
        {
          year_id: "Y1",
          year_name: "1st Year",
          semesters: ["1st Sem", "2nd Sem"],
          courses: [
            { code: "CS101", name: "Programming for Problem Solving", faculty: "Dr. R. Mehra", sections: ["Section A", "Section B"] }
          ]
        },
        {
          year_id: "Y2",
          year_name: "2nd Year",
          semesters: ["3rd Sem", "4th Sem"],
          courses: [
            { code: "CS201", name: "Data Structures & Algorithms", faculty: "Prof. S. Verma", sections: ["Section A", "Section B"] },
            { code: "CS202", name: "Discrete Mathematics", faculty: "Dr. N. Rao", sections: ["Section A", "Section B"] }
          ]
        },
        {
          year_id: "Y3",
          year_name: "3rd Year",
          semesters: ["5th Sem", "6th Sem"],
          courses: [
            { code: "CS301", name: "Computer Networks", faculty: "Prof. Rajesh Sharma", sections: ["Section A", "Section B"], is_core: true }
          ]
        },
        {
          year_id: "Y4",
          year_name: "4th Year",
          semesters: ["7th Sem", "8th Sem"],
          courses: [
            { code: "CS401", name: "Distributed Systems & Cloud Computing", faculty: "Dr. K. Iyer", sections: ["Section A", "Section B"] }
          ]
        }
      ]
    },
    IT: {
      code: "IT",
      name: "Information Technology",
      course_code: "IT302",
      course_name: "Data Communication & Networking",
      instructor: {
        name: "Prof. Priya Murthy",
        email: "priya.murthy@college.edu",
        designation: "Assistant Professor (Sr. Scale), Dept. of IT"
      },
      hod: {
        name: "Dr. Vikram Malhotra",
        email: "hod.it@college.edu",
        designation: "Professor & Head of Department, IT"
      },
      academic_years: [
        {
          year_id: "Y1",
          year_name: "1st Year",
          semesters: ["1st Sem", "2nd Sem"],
          courses: [{ code: "IT101", name: "Foundations of IT", faculty: "Dr. S. Nair", sections: ["Section A", "Section B"] }]
        },
        {
          year_id: "Y2",
          year_name: "2nd Year",
          semesters: ["3rd Sem", "4th Sem"],
          courses: [{ code: "IT201", name: "Web Technologies & Data Structs", faculty: "Prof. K. Sen", sections: ["Section A", "Section B"] }]
        },
        {
          year_id: "Y3",
          year_name: "3rd Year",
          semesters: ["5th Sem", "6th Sem"],
          courses: [{ code: "IT302", name: "Data Communication & Networking", faculty: "Prof. Priya Murthy", sections: ["Section A", "Section B"], is_core: true }]
        },
        {
          year_id: "Y4",
          year_name: "4th Year",
          semesters: ["7th Sem", "8th Sem"],
          courses: [{ code: "IT401", name: "Information Security & Cloud", faculty: "Dr. M. Joshi", sections: ["Section A", "Section B"] }]
        }
      ]
    },
    ECE: {
      code: "ECE",
      name: "Electronics & Communication Engineering",
      course_code: "EC304",
      course_name: "Computer Communication Networks",
      instructor: {
        name: "Prof. S. R. Kulkarni",
        email: "sr.kulkarni@college.edu",
        designation: "Associate Professor, Dept. of ECE"
      },
      hod: {
        name: "Dr. Meenakshi Sundaram",
        email: "hod.ece@college.edu",
        designation: "Professor & Head of Department, ECE"
      },
      academic_years: [
        {
          year_id: "Y1",
          year_name: "1st Year",
          semesters: ["1st Sem", "2nd Sem"],
          courses: [{ code: "EC101", name: "Circuit Theory & Devices", faculty: "Dr. A. Roy", sections: ["Section A", "Section B"] }]
        },
        {
          year_id: "Y2",
          year_name: "2nd Year",
          semesters: ["3rd Sem", "4th Sem"],
          courses: [{ code: "EC201", name: "Signals & Systems", faculty: "Prof. V. Raman", sections: ["Section A", "Section B"] }]
        },
        {
          year_id: "Y3",
          year_name: "3rd Year",
          semesters: ["5th Sem", "6th Sem"],
          courses: [{ code: "EC304", name: "Computer Communication Networks", faculty: "Prof. S. R. Kulkarni", sections: ["Section A", "Section B"], is_core: true }]
        },
        {
          year_id: "Y4",
          year_name: "4th Year",
          semesters: ["7th Sem", "8th Sem"],
          courses: [{ code: "EC401", name: "Wireless & Optical Comm", faculty: "Dr. Meenakshi Sundaram", sections: ["Section A", "Section B"] }]
        }
      ]
    },
    AIML: {
      code: "AIML",
      name: "Artificial Intelligence & Machine Learning",
      course_code: "AI305",
      course_name: "Network Architecture for AI Systems",
      instructor: {
        name: "Prof. Neha Gupta",
        email: "neha.gupta@college.edu",
        designation: "Assistant Professor, Dept. of AIML"
      },
      hod: {
        name: "Dr. Arvind Swaminathan",
        email: "hod.aiml@college.edu",
        designation: "Professor & Head of Department, AIML"
      },
      academic_years: [
        {
          year_id: "Y1",
          year_name: "1st Year",
          semesters: ["1st Sem", "2nd Sem"],
          courses: [{ code: "AI101", name: "Intro to Python & Math for AI", faculty: "Dr. P. Das", sections: ["Section A", "Section B"] }]
        },
        {
          year_id: "Y2",
          year_name: "2nd Year",
          semesters: ["3rd Sem", "4th Sem"],
          courses: [{ code: "AI201", name: "Machine Learning Foundations", faculty: "Prof. T. Shah", sections: ["Section A", "Section B"] }]
        },
        {
          year_id: "Y3",
          year_name: "3rd Year",
          semesters: ["5th Sem", "6th Sem"],
          courses: [{ code: "AI305", name: "Network Architecture for AI Systems", faculty: "Prof. Neha Gupta", sections: ["Section A", "Section B"], is_core: true }]
        },
        {
          year_id: "Y4",
          year_name: "4th Year",
          semesters: ["7th Sem", "8th Sem"],
          courses: [{ code: "AI401", name: "Deep Learning & LLM Infrastructure", faculty: "Dr. Arvind Swaminathan", sections: ["Section A", "Section B"] }]
        }
      ]
    }
  },

  // Trusted Preconfigured Synthetic Demo Accounts Database
  // Note: For students, initial temporary password is their registered phone number.
  ACCOUNTS: [
    // 1. Students (Synthetic Demo Accounts)
    {
      id: "usr_stu_1",
      email: "aarav.p@college.edu",
      phone: "9876543210",
      password: "9876543210", // Phone number as initial temporary password
      role: "student",
      name: "Aarav Patel (Simulated)",
      student_id: "22CS1048",
      department: "CSE",
      course_code: "CS301",
      course_name: "Computer Networks",
      year_semester: "3rd Year / 5th Sem",
      section: "Section A",
      semester: "5",
      academic_year: "3rd Year",
      is_active: true
    },
    {
      id: "usr_stu_2",
      email: "riya.sen@college.edu",
      phone: "9876543211",
      password: "9876543211",
      role: "student",
      name: "Riya Sen (Simulated)",
      student_id: "22IT2015",
      department: "IT",
      course_code: "IT302",
      course_name: "Data Communication & Networking",
      year_semester: "3rd Year / 5th Sem",
      section: "Section A",
      semester: "5",
      academic_year: "3rd Year",
      is_active: true
    },
    {
      id: "usr_stu_3",
      email: "kabir.das@college.edu",
      phone: "9876543212",
      password: "9876543212",
      role: "student",
      name: "Kabir Das (Simulated)",
      student_id: "22EC3082",
      department: "ECE",
      course_code: "EC304",
      course_name: "Computer Communication Networks",
      year_semester: "3rd Year / 6th Sem",
      section: "Section A",
      semester: "6",
      academic_year: "3rd Year",
      is_active: true
    },
    {
      id: "usr_stu_4",
      email: "ananya.iyer@college.edu",
      phone: "9876543213",
      password: "9876543213",
      role: "student",
      name: "Ananya Iyer (Simulated)",
      student_id: "22AI4019",
      department: "AIML",
      course_code: "AI305",
      course_name: "Network Architecture for AI Systems",
      year_semester: "3rd Year / 5th Sem",
      section: "Section A",
      semester: "5",
      academic_year: "3rd Year",
      is_active: true
    },
    {
      id: "usr_stu_5",
      email: "vikram.r@college.edu",
      phone: "9876543214",
      password: "9876543214",
      role: "student",
      name: "Vikram Reddy (Simulated)",
      student_id: "22CS1190",
      department: "CSE",
      course_code: "CS301",
      course_name: "Computer Networks",
      year_semester: "3rd Year / 6th Sem",
      section: "Section B",
      semester: "6",
      academic_year: "3rd Year",
      is_active: true
    },
    {
      id: "usr_stu_6",
      email: "pooja.h@college.edu",
      phone: "9876543215",
      password: "9876543215",
      role: "student",
      name: "Pooja Hegde (Simulated)",
      student_id: "22IT2078",
      department: "IT",
      course_code: "IT302",
      course_name: "Data Communication & Networking",
      year_semester: "3rd Year / 5th Sem",
      section: "Section B",
      semester: "5",
      academic_year: "3rd Year",
      is_active: true
    },

    // 2. Faculty / Course Instructors
    {
      id: "usr_fac_1",
      email: "rajesh.sharma@college.edu",
      password: "prof.rajesh@cs301",
      role: "instructor",
      name: "Prof. Rajesh Sharma",
      department: "CSE",
      course_code: "CS301",
      course_name: "Computer Networks",
      designation: "Associate Professor, Dept. of CSE",
      is_active: true
    },
    {
      id: "usr_fac_2",
      email: "priya.murthy@college.edu",
      password: "prof.priya@it302",
      role: "instructor",
      name: "Prof. Priya Murthy",
      department: "IT",
      course_code: "IT302",
      course_name: "Data Communication & Networking",
      designation: "Assistant Professor (Sr. Scale), Dept. of IT",
      is_active: true
    },
    {
      id: "usr_fac_3",
      email: "sr.kulkarni@college.edu",
      password: "prof.kulkarni@ec304",
      role: "instructor",
      name: "Prof. S. R. Kulkarni",
      department: "ECE",
      course_code: "EC304",
      course_name: "Computer Communication Networks",
      designation: "Associate Professor, Dept. of ECE",
      is_active: true
    },
    {
      id: "usr_fac_4",
      email: "neha.gupta@college.edu",
      password: "prof.neha@ai305",
      role: "instructor",
      name: "Prof. Neha Gupta",
      department: "AIML",
      course_code: "AI305",
      course_name: "Network Architecture for AI Systems",
      designation: "Assistant Professor, Dept. of AIML",
      is_active: true
    },

    // 3. Department Heads (HODs)
    {
      id: "usr_hod_1",
      email: "hod.cse@college.edu",
      password: "hod.sen@cse",
      role: "hod",
      name: "Dr. Ananya Sen",
      department: "CSE",
      designation: "Professor & Head of Department, CSE",
      is_active: true
    },
    {
      id: "usr_hod_2",
      email: "hod.it@college.edu",
      password: "hod.malhotra@it",
      role: "hod",
      name: "Dr. Vikram Malhotra",
      department: "IT",
      designation: "Professor & Head of Department, IT",
      is_active: true
    },
    {
      id: "usr_hod_3",
      email: "hod.ece@college.edu",
      password: "hod.meenakshi@ece",
      role: "hod",
      name: "Dr. Meenakshi Sundaram",
      department: "ECE",
      designation: "Professor & Head of Department, ECE",
      is_active: true
    },
    {
      id: "usr_hod_4",
      email: "hod.aiml@college.edu",
      password: "hod.arvind@aiml",
      role: "hod",
      name: "Dr. Arvind Swaminathan",
      department: "AIML",
      designation: "Professor & Head of Department, AIML",
      is_active: true
    }
  ],

  // Cautious Diagnostic Terminology Standards
  TERMINOLOGY: {
    POSITIVE_SIGNAL: "Positive Answer Signal",
    LIKELY_GAP: "Possible Learning Gap",
    PREREQUISITE_RISK: "Prerequisite Risk (Cascading Gap)",
    INSUFFICIENT_EVIDENCE: "Insufficient Evidence to Assess Confidently",
    MORE_PRACTICE_RECOMMENDED: "More Practice Recommended",
    CAUTION_NOTICE: "Single-item diagnostic observations provide formative signals ('positive answer signal' or 'possible learning gap'). Clinical diagnostic mastery requires multi-item verification."
  },

  // Synthetic Dataset Disclaimers
  SYNTHETIC_BENCHMARK_NOTICE: "All 10,000 dataset rows and initial sample learner profiles are synthetic benchmark models generated for algorithm calibration, item difficulty discrimination, and cascade error distribution analysis. They are NOT real human student records."
};

// Helper: Get department details
function getDepartmentConfig(deptCode) {
  return CONFIG.DEPARTMENTS[deptCode] || CONFIG.DEPARTMENTS.CSE;
}

// Helper: Get automatic recipients strictly from department
function getAssignedRecipients(deptCode) {
  const dept = getDepartmentConfig(deptCode);
  return {
    instructor: dept.instructor,
    hod: dept.hod,
    course_code: dept.course_code,
    course_name: dept.course_name,
    department_name: dept.name,
    department_code: dept.code
  };
}
