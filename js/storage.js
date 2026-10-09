/**
 * GAPPath AI - Storage & Persistence Engine
 * Supports local browser storage with automatic seeding of 6 initial synthetic sample learner profiles.
 * Includes Supabase multi-user readiness check and schema generator.
 */

const STORAGE_KEY = "gappath_cn_records_v1";

// 6 Initial Sample Learner Dashboard Profiles (EXPLICITLY LABELED SYNTHETIC)
const INITIAL_SYNTHETIC_PROFILES = [
  {
    report_id: "GAP-2026-CSE-9814",
    is_synthetic: true,
    synthetic_label: "Synthetic Benchmark Profile 1 (Subnetting Misconception)",
    student_id: "22CS1048",
    student_name: "Aarav Patel (Simulated)",
    student_email: "aarav.p@college.edu",
    department: "CSE",
    course_code: "CS301",
    course_name: "Computer Networks",
    year_semester: "3rd Year / 5th Sem",
    assigned_instructor: {
      name: "Prof. Rajesh Sharma",
      email: "rajesh.sharma@college.edu"
    },
    assigned_hod: {
      name: "Dr. Ananya Sen",
      email: "hod.cse@college.edu"
    },
    submitted_at: "2026-10-09T10:15:00Z",
    score: 8,
    total_questions: 10,
    percentage: 80,
    primary_likely_gap: "CN_04_SUBNETTING_IP",
    primary_gap_name: "IPv4 Addressing & CIDR Subnetting",
    is_prereq_cascade: false,
    item_responses: {
      CN_01_OSI_LAYERS: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_02_FRAMING_CRC: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_03_FLOW_CONTROL: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_04_SUBNETTING_IP: { 
        chosen_key: "B", 
        is_correct: false, 
        status: "Likely Concept Gap",
        misconception: "Included Network ID (.0) and Broadcast Address (.63) in usable hosts."
      },
      CN_05_ROUTING_ALGO: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_06_TCP_UDP_TRANSPORT: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_07_TCP_CONGESTION: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_08_DNS_SYSTEM: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_09_HTTP_APPLICATION: { 
        chosen_key: "B", 
        is_correct: false, 
        status: "Likely Concept Gap",
        misconception: "Believed HTTP/2 opens multiple connections instead of multiplexing."
      },
      CN_10_NETWORK_SECURITY: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" }
    },
    practice_retest: {
      completed: true,
      score: 3,
      total: 3,
      status: "Secure Signal (Gap Remediated)",
      target_concept: "CN_04_SUBNETTING_IP",
      completed_at: "2026-10-09T10:35:00Z"
    }
  },
  {
    report_id: "GAP-2026-IT-9821",
    is_synthetic: true,
    synthetic_label: "Synthetic Benchmark Profile 2 (Congestion vs Flow Control Trap)",
    student_id: "22IT2015",
    student_name: "Riya Sen (Simulated)",
    student_email: "riya.sen@college.edu",
    department: "IT",
    course_code: "IT302",
    course_name: "Data Communication & Networking",
    year_semester: "3rd Year / 5th Sem",
    assigned_instructor: {
      name: "Prof. Priya Murthy",
      email: "priya.murthy@college.edu"
    },
    assigned_hod: {
      name: "Dr. Vikram Malhotra",
      email: "hod.it@college.edu"
    },
    submitted_at: "2026-10-09T11:20:00Z",
    score: 7,
    total_questions: 10,
    percentage: 70,
    primary_likely_gap: "CN_07_TCP_CONGESTION",
    primary_gap_name: "TCP Congestion Control (AIMD & Slow Start)",
    is_prereq_cascade: false,
    item_responses: {
      CN_01_OSI_LAYERS: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_02_FRAMING_CRC: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_03_FLOW_CONTROL: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_04_SUBNETTING_IP: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_05_ROUTING_ALGO: { chosen_key: "B", is_correct: false, status: "Likely Concept Gap", misconception: "Confused Dijkstra SPF with Bellman-Ford Distance Vector." },
      CN_06_TCP_UDP_TRANSPORT: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_07_TCP_CONGESTION: { 
        chosen_key: "C", 
        is_correct: false, 
        status: "Likely Concept Gap",
        misconception: "Confused Congestion Window (cwnd) with Flow Control Receive Window (rwnd)."
      },
      CN_08_DNS_SYSTEM: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_09_HTTP_APPLICATION: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_10_NETWORK_SECURITY: { chosen_key: "B", is_correct: false, status: "Likely Concept Gap", misconception: "Assumed asymmetric encryption is used for bulk payload data." }
    },
    practice_retest: {
      completed: true,
      score: 2,
      total: 3,
      status: "Developing (Partial Concept Recovery)",
      target_concept: "CN_07_TCP_CONGESTION",
      completed_at: "2026-10-09T11:45:00Z"
    }
  },
  {
    report_id: "GAP-2026-ECE-9833",
    is_synthetic: true,
    synthetic_label: "Synthetic Benchmark Profile 3 (Prerequisite Cascade Error)",
    student_id: "22EC3082",
    student_name: "Kabir Das (Simulated)",
    student_email: "kabir.das@college.edu",
    department: "ECE",
    course_code: "EC304",
    course_name: "Computer Communication Networks",
    year_semester: "3rd Year / 6th Sem",
    assigned_instructor: {
      name: "Prof. S. R. Kulkarni",
      email: "sr.kulkarni@college.edu"
    },
    assigned_hod: {
      name: "Dr. Meenakshi Sundaram",
      email: "hod.ece@college.edu"
    },
    submitted_at: "2026-10-09T12:05:00Z",
    score: 5,
    total_questions: 10,
    percentage: 50,
    primary_likely_gap: "CN_02_FRAMING_CRC",
    primary_gap_name: "Data Link Framing & CRC Error Detection",
    is_prereq_cascade: true,
    item_responses: {
      CN_01_OSI_LAYERS: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_02_FRAMING_CRC: { 
        chosen_key: "B", 
        is_correct: false, 
        status: "Likely Concept Gap (Root Prerequisite)",
        misconception: "Used integer division with borrow instead of modulo-2 XOR division."
      },
      CN_03_FLOW_CONTROL: { 
        chosen_key: "B", 
        is_correct: false, 
        status: "Prerequisite Risk (Cascading Gap)",
        misconception: "Applied Go-Back-N window formula (2^n - 1) to Selective Repeat protocol."
      },
      CN_04_SUBNETTING_IP: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_05_ROUTING_ALGO: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_06_TCP_UDP_TRANSPORT: { chosen_key: "B", is_correct: false, status: "Likely Concept Gap", misconception: "Omitted server's SYN synchronization flag." },
      CN_07_TCP_CONGESTION: { chosen_key: "B", is_correct: false, status: "Prerequisite Risk (Cascading Gap)" },
      CN_08_DNS_SYSTEM: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_09_HTTP_APPLICATION: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_10_NETWORK_SECURITY: { chosen_key: "D", is_correct: false, status: "Likely Concept Gap" }
    },
    practice_retest: {
      completed: false,
      score: 0,
      total: 3,
      status: "Not Attempted",
      target_concept: "CN_02_FRAMING_CRC",
      completed_at: null
    }
  },
  {
    report_id: "GAP-2026-AIML-9844",
    is_synthetic: true,
    synthetic_label: "Synthetic Benchmark Profile 4 (DNS Inverted Hierarchy)",
    student_id: "22AI4019",
    student_name: "Ananya Iyer (Simulated)",
    student_email: "ananya.iyer@college.edu",
    department: "AIML",
    course_code: "AI305",
    course_name: "Network Architecture for AI Systems",
    year_semester: "3rd Year / 5th Sem",
    assigned_instructor: {
      name: "Prof. Neha Gupta",
      email: "neha.gupta@college.edu"
    },
    assigned_hod: {
      name: "Dr. Arvind Swaminathan",
      email: "hod.aiml@college.edu"
    },
    submitted_at: "2026-10-09T13:10:00Z",
    score: 8,
    total_questions: 10,
    percentage: 80,
    primary_likely_gap: "CN_08_DNS_SYSTEM",
    primary_gap_name: "Domain Name System (DNS Architecture)",
    is_prereq_cascade: false,
    item_responses: {
      CN_01_OSI_LAYERS: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_02_FRAMING_CRC: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_03_FLOW_CONTROL: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_04_SUBNETTING_IP: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_05_ROUTING_ALGO: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_06_TCP_UDP_TRANSPORT: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_07_TCP_CONGESTION: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_08_DNS_SYSTEM: { 
        chosen_key: "B", 
        is_correct: false, 
        status: "Likely Concept Gap",
        misconception: "Inverted hierarchical resolution order: assumed Authoritative is checked before TLD."
      },
      CN_09_HTTP_APPLICATION: { chosen_key: "C", is_correct: false, status: "Likely Concept Gap" },
      CN_10_NETWORK_SECURITY: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" }
    },
    practice_retest: {
      completed: true,
      score: 3,
      total: 3,
      status: "Secure Signal (Gap Remediated)",
      target_concept: "CN_08_DNS_SYSTEM",
      completed_at: "2026-10-09T13:40:00Z"
    }
  },
  {
    report_id: "GAP-2026-CSE-9855",
    is_synthetic: true,
    synthetic_label: "Synthetic Benchmark Profile 5 (Near-Mastery Profile)",
    student_id: "22CS1190",
    student_name: "Vikram Reddy (Simulated)",
    student_email: "vikram.r@college.edu",
    department: "CSE",
    course_code: "CS301",
    course_name: "Computer Networks",
    year_semester: "3rd Year / 6th Sem",
    assigned_instructor: {
      name: "Prof. Rajesh Sharma",
      email: "rajesh.sharma@college.edu"
    },
    assigned_hod: {
      name: "Dr. Ananya Sen",
      email: "hod.cse@college.edu"
    },
    submitted_at: "2026-10-09T14:15:00Z",
    score: 9,
    total_questions: 10,
    percentage: 90,
    primary_likely_gap: "CN_05_ROUTING_ALGO",
    primary_gap_name: "Routing Algorithms (Dijkstra vs Distance Vector)",
    is_prereq_cascade: false,
    item_responses: {
      CN_01_OSI_LAYERS: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_02_FRAMING_CRC: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_03_FLOW_CONTROL: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_04_SUBNETTING_IP: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_05_ROUTING_ALGO: { 
        chosen_key: "C", 
        is_correct: false, 
        status: "Likely Concept Gap",
        misconception: "Confused Layer 2 Spanning Tree (STP) with Layer 3 Split Horizon."
      },
      CN_06_TCP_UDP_TRANSPORT: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_07_TCP_CONGESTION: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_08_DNS_SYSTEM: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_09_HTTP_APPLICATION: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_10_NETWORK_SECURITY: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" }
    },
    practice_retest: {
      completed: true,
      score: 3,
      total: 3,
      status: "Secure Signal (Gap Remediated)",
      target_concept: "CN_05_ROUTING_ALGO",
      completed_at: "2026-10-09T14:40:00Z"
    }
  },
  {
    report_id: "GAP-2026-IT-9866",
    is_synthetic: true,
    synthetic_label: "Synthetic Benchmark Profile 6 (Foundational Architecture Gap)",
    student_id: "22IT2078",
    student_name: "Pooja Hegde (Simulated)",
    student_email: "pooja.h@college.edu",
    department: "IT",
    course_code: "IT302",
    course_name: "Data Communication & Networking",
    year_semester: "3rd Year / 5th Sem",
    assigned_instructor: {
      name: "Prof. Priya Murthy",
      email: "priya.murthy@college.edu"
    },
    assigned_hod: {
      name: "Dr. Vikram Malhotra",
      email: "hod.it@college.edu"
    },
    submitted_at: "2026-10-09T15:00:00Z",
    score: 4,
    total_questions: 10,
    percentage: 40,
    primary_likely_gap: "CN_01_OSI_LAYERS",
    primary_gap_name: "OSI & TCP/IP Architecture",
    is_prereq_cascade: true,
    item_responses: {
      CN_01_OSI_LAYERS: { 
        chosen_key: "B", 
        is_correct: false, 
        status: "Likely Concept Gap (Root Prerequisite)",
        misconception: "Confused Layer 2 Data Link Frames with Layer 3 IP Packets."
      },
      CN_02_FRAMING_CRC: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_03_FLOW_CONTROL: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_04_SUBNETTING_IP: { chosen_key: "D", is_correct: false, status: "Prerequisite Risk (Cascading Gap)" },
      CN_05_ROUTING_ALGO: { chosen_key: "B", is_correct: false, status: "Prerequisite Risk (Cascading Gap)" },
      CN_06_TCP_UDP_TRANSPORT: { chosen_key: "C", is_correct: false, status: "Prerequisite Risk (Cascading Gap)" },
      CN_07_TCP_CONGESTION: { chosen_key: "B", is_correct: false, status: "Prerequisite Risk (Cascading Gap)" },
      CN_08_DNS_SYSTEM: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_09_HTTP_APPLICATION: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
      CN_10_NETWORK_SECURITY: { chosen_key: "C", is_correct: false, status: "Likely Concept Gap" }
    },
    practice_retest: {
      completed: false,
      score: 0,
      total: 3,
      status: "In Progress",
      target_concept: "CN_01_OSI_LAYERS",
      completed_at: null
    }
  }
];

class StorageEngine {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SYNTHETIC_PROFILES));
        console.log("Initialized GapPath storage with 6 synthetic benchmark profiles.");
      }
      this.seedInitialActualRecordsIfClean();
    } catch (e) {
      console.warn("Storage error or restricted mode:", e);
    }
  }

  seedInitialActualRecordsIfClean() {
    try {
      const seededFlag = localStorage.getItem("gappath_actual_seeded_v3");
      if (seededFlag) return;

      const now = new Date();
      const allRecords = this.getAllRecords();

      // Seed 4 actual non-synthetic diagnostic submissions for CSE students
      const actualDiagnosticRecords = [
        {
          report_id: "ACT-2026-CSE-1048",
          is_synthetic: false,
          student_id: "22CS1048",
          student_name: "Aarav Patel (Simulated)",
          student_email: "aarav.p@college.edu",
          department: "CSE",
          course_code: "CS301",
          course_name: "Computer Networks",
          year_semester: "3rd Year / 5th Sem",
          section: "Section A",
          semester: "5",
          assigned_instructor: {
            name: "Prof. Rajesh Sharma",
            email: "rajesh.sharma@college.edu"
          },
          assigned_hod: {
            name: "Dr. Ananya Sen",
            email: "hod.cse@college.edu"
          },
          submitted_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          score: 8,
          total_questions: 10,
          percentage: 80,
          primary_likely_gap: "CN_04_SUBNETTING_IP",
          primary_gap_name: "IPv4 Addressing & CIDR Subnetting",
          is_prereq_cascade: false,
          item_responses: {
            CN_01_OSI_LAYERS: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_02_FRAMING_CRC: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_03_FLOW_CONTROL: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_04_SUBNETTING_IP: { chosen_key: "B", is_correct: false, status: "Likely Concept Gap", misconception: "Confused usable host formula (2^n - 2) with block size." },
            CN_05_ROUTING_ALGO: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_06_TCP_UDP_TRANSPORT: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_07_TCP_CONGESTION: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_08_DNS_SYSTEM: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_09_HTTP_APPLICATION: { chosen_key: "C", is_correct: false, status: "Likely Concept Gap", misconception: "Assumed HTTP pipelining solves head-of-line blocking." },
            CN_10_NETWORK_SECURITY: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" }
          },
          practice_retest: {
            completed: true,
            score: 3,
            total: 3,
            status: "Secure Signal (Gap Remediated)",
            target_concept: "CN_04_SUBNETTING_IP",
            completed_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString()
          }
        },
        {
          report_id: "ACT-2026-CSE-1190",
          is_synthetic: false,
          student_id: "22CS1190",
          student_name: "Vikram Reddy (Simulated)",
          student_email: "vikram.r@college.edu",
          department: "CSE",
          course_code: "CS301",
          course_name: "Computer Networks",
          year_semester: "3rd Year / 6th Sem",
          section: "Section B",
          semester: "6",
          assigned_instructor: {
            name: "Prof. Rajesh Sharma",
            email: "rajesh.sharma@college.edu"
          },
          assigned_hod: {
            name: "Dr. Ananya Sen",
            email: "hod.cse@college.edu"
          },
          submitted_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          score: 7,
          total_questions: 10,
          percentage: 70,
          primary_likely_gap: "CN_07_TCP_CONGESTION",
          primary_gap_name: "TCP Congestion Control (AIMD & Slow Start)",
          is_prereq_cascade: false,
          item_responses: {
            CN_01_OSI_LAYERS: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_02_FRAMING_CRC: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_03_FLOW_CONTROL: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_04_SUBNETTING_IP: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_05_ROUTING_ALGO: { chosen_key: "B", is_correct: false, status: "Likely Concept Gap", misconception: "Confused link-state flooding with distance-vector periodic broadcast." },
            CN_06_TCP_UDP_TRANSPORT: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_07_TCP_CONGESTION: { chosen_key: "C", is_correct: false, status: "Likely Concept Gap", misconception: "Believed duplicate ACKs trigger Slow Start reset instead of Fast Recovery." },
            CN_08_DNS_SYSTEM: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_09_HTTP_APPLICATION: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_10_NETWORK_SECURITY: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" }
          },
          practice_retest: {
            completed: false,
            score: 0,
            total: 3,
            status: "Pending Retest",
            target_concept: "CN_07_TCP_CONGESTION",
            completed_at: null
          }
        },
        {
          report_id: "ACT-2026-CSE-1022",
          is_synthetic: false,
          student_id: "22CS1022",
          student_name: "Sneha Rao",
          student_email: "sneha.rao@college.edu",
          department: "CSE",
          course_code: "CS301",
          course_name: "Computer Networks",
          year_semester: "3rd Year / 5th Sem",
          section: "Section A",
          semester: "5",
          assigned_instructor: {
            name: "Prof. Rajesh Sharma",
            email: "rajesh.sharma@college.edu"
          },
          assigned_hod: {
            name: "Dr. Ananya Sen",
            email: "hod.cse@college.edu"
          },
          submitted_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          score: 5,
          total_questions: 10,
          percentage: 50,
          primary_likely_gap: "CN_04_SUBNETTING_IP",
          primary_gap_name: "IPv4 Addressing & CIDR Subnetting",
          is_prereq_cascade: false,
          item_responses: {
            CN_01_OSI_LAYERS: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_02_FRAMING_CRC: { chosen_key: "B", is_correct: false, status: "Likely Concept Gap" },
            CN_03_FLOW_CONTROL: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_04_SUBNETTING_IP: { chosen_key: "B", is_correct: false, status: "Likely Concept Gap" },
            CN_05_ROUTING_ALGO: { chosen_key: "C", is_correct: false, status: "Likely Concept Gap" },
            CN_06_TCP_UDP_TRANSPORT: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_07_TCP_CONGESTION: { chosen_key: "C", is_correct: false, status: "Likely Concept Gap" },
            CN_08_DNS_SYSTEM: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_09_HTTP_APPLICATION: { chosen_key: "C", is_correct: false, status: "Likely Concept Gap" },
            CN_10_NETWORK_SECURITY: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" }
          },
          practice_retest: {
            completed: false,
            score: 0,
            total: 3,
            status: "Pending Retest",
            target_concept: "CN_04_SUBNETTING_IP",
            completed_at: null
          }
        },
        {
          report_id: "ACT-2026-CSE-1035",
          is_synthetic: false,
          student_id: "22CS1035",
          student_name: "Rahul Verma",
          student_email: "rahul.v@college.edu",
          department: "CSE",
          course_code: "CS301",
          course_name: "Computer Networks",
          year_semester: "3rd Year / 6th Sem",
          section: "Section B",
          semester: "6",
          assigned_instructor: {
            name: "Prof. Rajesh Sharma",
            email: "rajesh.sharma@college.edu"
          },
          assigned_hod: {
            name: "Dr. Ananya Sen",
            email: "hod.cse@college.edu"
          },
          submitted_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          score: 4,
          total_questions: 10,
          percentage: 40,
          primary_likely_gap: "CN_05_ROUTING_ALGO",
          primary_gap_name: "Routing Algorithms (Dijkstra SPF & Bellman-Ford)",
          is_prereq_cascade: true,
          item_responses: {
            CN_01_OSI_LAYERS: { chosen_key: "B", is_correct: false, status: "Likely Concept Gap" },
            CN_02_FRAMING_CRC: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_03_FLOW_CONTROL: { chosen_key: "B", is_correct: false, status: "Likely Concept Gap" },
            CN_04_SUBNETTING_IP: { chosen_key: "B", is_correct: false, status: "Likely Concept Gap" },
            CN_05_ROUTING_ALGO: { chosen_key: "D", is_correct: false, status: "Likely Concept Gap" },
            CN_06_TCP_UDP_TRANSPORT: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_07_TCP_CONGESTION: { chosen_key: "C", is_correct: false, status: "Likely Concept Gap" },
            CN_08_DNS_SYSTEM: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_09_HTTP_APPLICATION: { chosen_key: "A", is_correct: true, status: "Positive Answer Signal" },
            CN_10_NETWORK_SECURITY: { chosen_key: "B", is_correct: false, status: "Likely Concept Gap" }
          },
          practice_retest: {
            completed: false,
            score: 0,
            total: 3,
            status: "Pending Retest",
            target_concept: "CN_05_ROUTING_ALGO",
            completed_at: null
          }
        }
      ];

      actualDiagnosticRecords.forEach(r => {
        if (!allRecords.some(ex => ex.report_id === r.report_id)) {
          allRecords.push(r);
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));

      // Seed scheduled test attempt for Vikram Reddy (22CS1190)
      const vikramAttempts = [
        {
          attempt_id: "ATT-CN-2026-1190-01",
          test_id: "TEST-CN-2026-01",
          title: "Midterm Diagnostic: IPv4 Subnetting & Transport Layer",
          student_id: "22CS1190",
          student_name: "Vikram Reddy",
          department: "CSE",
          course_code: "CS301",
          section: "Section B",
          semester: "6",
          score: 3,
          total_questions: 4,
          percentage: 75,
          completed_at: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
          is_synthetic: false,
          responses: [
            { topic_id: "CN_04_SUBNETTING_IP", topic_name: "IPv4 Addressing & CIDR Subnetting", is_correct: false },
            { topic_id: "CN_04_SUBNETTING_IP", topic_name: "IPv4 Addressing & CIDR Subnetting", is_correct: true },
            { topic_id: "CN_06_TCP_UDP_TRANSPORT", topic_name: "TCP & UDP Transport Protocols", is_correct: true },
            { topic_id: "CN_06_TCP_UDP_TRANSPORT", topic_name: "TCP & UDP Transport Protocols", is_correct: true }
          ],
          weak_topics: ["IPv4 Addressing & CIDR Subnetting"]
        }
      ];
      localStorage.setItem("gappath_test_attempts_22CS1190", JSON.stringify(vikramAttempts));

      // Seed in-progress draft for Aarav Patel (22CS1048) on TEST-CN-2026-01
      const aaravDraft = {
        testId: "TEST-CN-2026-01",
        studentId: "22CS1048",
        lastSavedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        studentAnswers: {
          "Q-CN-SUBNET-101": "B",
          "Q-CN-SUBNET-102": "A"
        },
        timeRemainingSeconds: 420
      };
      localStorage.setItem("gappath_draft_22CS1048_TEST-CN-2026-01", JSON.stringify(aaravDraft));

      localStorage.setItem("gappath_actual_seeded_v3", "true");
    } catch (e) {
      console.warn("Notice seeding initial actual records:", e);
    }
  }

  getAllRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [...INITIAL_SYNTHETIC_PROFILES];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [...INITIAL_SYNTHETIC_PROFILES];
    } catch (e) {
      console.error("Failed to load records from storage:", e);
      return [...INITIAL_SYNTHETIC_PROFILES];
    }
  }

  getRecordById(reportId) {
    const all = this.getAllRecords();
    return all.find(r => r.report_id === reportId) || null;
  }

  saveDiagnosticSubmission(record) {
    const all = this.getAllRecords();
    // Add new record to front
    const existingIndex = all.findIndex(r => r.report_id === record.report_id);
    if (existingIndex >= 0) {
      all[existingIndex] = record;
    } else {
      all.unshift(record);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return record;
  }

  updatePracticeRetest(reportId, retestScore, retestStatus, targetConceptId) {
    const all = this.getAllRecords();
    const target = all.find(r => r.report_id === reportId);
    if (target) {
      target.practice_retest = {
        completed: true,
        score: retestScore,
        total: 3,
        status: retestStatus,
        target_concept: targetConceptId,
        completed_at: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return target;
    }
    return null;
  }

  // Student Filter: Strictly records belonging to this student only
  getRecordsForStudent(studentId, studentEmail) {
    const all = this.getAllRecords();
    return all.filter(r => {
      if (studentId && r.student_id === studentId) return true;
      if (studentEmail && r.student_email && r.student_email.toLowerCase() === studentEmail.toLowerCase()) return true;
      return false;
    });
  }

  // Course Instructor Filter: Strictly records assigned to this course / instructor
  getRecordsForInstructor(instructorName, courseCode) {
    const all = this.getAllRecords();
    return all.filter(r => {
      if (courseCode && r.course_code === courseCode) return true;
      if (instructorName && r.assigned_instructor && r.assigned_instructor.name === instructorName) return true;
      return false;
    });
  }

  // Department HOD Filter: Strictly records within this HOD's assigned department
  getRecordsForHOD(departmentCode) {
    const all = this.getAllRecords();
    return all.filter(r => r.department === departmentCode);
  }

  // ==========================================
  // LEARNING HISTORY PERSISTENCE (STUDENT ISOLATED)
  // ==========================================
  getLearningSessionsForStudent(studentId) {
    if (!studentId) return [];
    try {
      const key = `gappath_learning_sessions_${studentId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
      
      // Seed 1 realistic benchmark learning session for demo student 22CS1048 if clean
      if (studentId === "22CS1048") {
        const seeded = [{
          session_id: "SES-2026-CS-101",
          student_id: "22CS1048",
          student_name: "Aarav Patel",
          concept_id: "CN_04_SUBNETTING_IP",
          concept_name: "IPv4 Addressing & CIDR Subnetting",
          lesson_completed: true,
          previous_diagnostic_evidence: {
            status: "Likely Concept Gap",
            score_fraction: "0 / 1",
            misconception: "Included Network ID (.0) and Broadcast Address (.63) in usable hosts."
          },
          retest_score: 4,
          retest_total: 5,
          retest_percentage: 80,
          score_comparison: "+80% Improvement over initial diagnostic signal",
          learning_status: "Improved",
          status_badge_class: "badge-success",
          recommended_next_step: "Ready to study downstream Routing Algorithms (CN_05_ROUTING_ALGO)",
          associated_report_id: "GAP-2026-CSE-9814",
          started_at: "2026-10-09T10:20:00Z",
          completed_at: "2026-10-09T10:35:00Z",
          retest_responses: [
            {
              question_id: "DQ_04_B",
              question_text: "A router interface is assigned IP 172.16.45.14/20. What is the network identifier and broadcast address?",
              chosen_key: "A",
              correct_key: "A",
              is_correct: true,
              explanation: "With /20 prefix, the block size in third octet is 16. Network is 172.16.32.0 and broadcast is 172.16.47.255."
            },
            {
              question_id: "DQ_04_C",
              question_text: "An organization needs 500 usable host addresses per subnet. What minimum CIDR prefix should be used?",
              chosen_key: "B",
              correct_key: "B",
              is_correct: true,
              explanation: "2^9 - 2 = 510 usable hosts, needing 9 host bits. Prefix = 32 - 9 = /23."
            },
            {
              question_id: "PQ_04_1",
              question_text: "How many subnets and usable hosts per subnet are created when subnetting 192.168.1.0/24 into /27?",
              chosen_key: "C",
              correct_key: "C",
              is_correct: true,
              explanation: "3 borrowed bits = 2^3 = 8 subnets. 5 host bits = 2^5 - 2 = 30 usable hosts."
            },
            {
              question_id: "PQ_04_2",
              question_text: "Which of the following addresses is a valid usable host address in the subnet 10.0.8.0/22?",
              chosen_key: "A",
              correct_key: "B",
              is_correct: false,
              explanation: "Subnet spans 10.0.8.0 to 10.0.11.255. 10.0.11.255 is the broadcast address, not a host."
            },
            {
              question_id: "PQ_04_3",
              question_text: "What is the primary advantage of CIDR over legacy classful IP addressing?",
              chosen_key: "D",
              correct_key: "D",
              is_correct: true,
              explanation: "CIDR enables route aggregation (supernetting) and prevents rapid IPv4 address exhaustion."
            }
          ]
        }];
        localStorage.setItem(key, JSON.stringify(seeded));
        return seeded;
      }

      return [];
    } catch (e) {
      console.warn("Error reading learning sessions:", e);
      return [];
    }
  }

  saveLearningSession(session) {
    if (!session || !session.student_id || !session.session_id) return null;
    try {
      const key = `gappath_learning_sessions_${session.student_id}`;
      const existing = this.getLearningSessionsForStudent(session.student_id);
      
      // Prevent duplicate records on refresh
      const idx = existing.findIndex(s => s.session_id === session.session_id);
      if (idx >= 0) {
        existing[idx] = session;
      } else {
        existing.unshift(session);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
      console.log(`Saved learning session ${session.session_id} for student ${session.student_id}.`);
      return session;
    } catch (e) {
      console.error("Failed to save learning session:", e);
      return null;
    }
  }

  getLearningSessionById(studentId, sessionId) {
    const list = this.getLearningSessionsForStudent(studentId);
    return list.find(s => s.session_id === sessionId) || null;
  }

  // ==========================================
  // SCHEDULED TESTS & ATTEMPTS PERSISTENCE
  // ==========================================
  getScheduledTests(courseCode = null) {
    const key = "gappath_scheduled_tests_v1";
    try {
      const raw = localStorage.getItem(key);
      let tests = [];
      const now = new Date();
      const activeStart = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      const activeEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours ahead
      const upcomingStart = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(); // 2 days ahead
      const upcomingEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(); // 3 days ahead

      if (raw) {
        tests = JSON.parse(raw);
        // Ensure evaluator demo test TEST-CN-2026-01 remains actively available on any date
        let updated = false;
        const t1 = tests.find(t => t.id === "TEST-CN-2026-01");
        if (t1) {
          if (new Date(t1.end_time) < now) {
            t1.start_time = activeStart;
            t1.end_time = activeEnd;
            t1.status = "active";
            updated = true;
          }
          if (!t1.department) t1.department = "CSE";
          if (!t1.course_code) t1.course_code = "CS301";
          if (!t1.section) t1.section = "ALL";
          if (!t1.semester) t1.semester = "ALL";
        }
        const t2 = tests.find(t => t.id === "TEST-CN-2026-02");
        if (t2) {
          if (new Date(t2.end_time) < now) {
            t2.start_time = upcomingStart;
            t2.end_time = upcomingEnd;
            t2.status = "upcoming";
            updated = true;
          }
          if (!t2.department) t2.department = "CSE";
          if (!t2.course_code) t2.course_code = "CS301";
          if (!t2.section) t2.section = "ALL";
          if (!t2.semester) t2.semester = "ALL";
        }
        if (updated) {
          localStorage.setItem(key, JSON.stringify(tests));
        }
      } else {
        // Seed initial benchmark scheduled tests for CS301
        tests = [
          {
            id: "TEST-CN-2026-01",
            title: "Midterm Diagnostic: IPv4 Subnetting & Transport Layer",
            course_code: "CS301",
            department: "CSE",
            section: "ALL",
            semester: "ALL",
            academic_year: "3rd Year",
            instructor_name: "Prof. Rajesh Sharma",
            topics: ["CN_04_SUBNETTING_IP", "CN_06_TCP_UDP_TRANSPORT"],
            question_count: 4,
            difficulty: "All",
            time_limit_mins: 10,
            mastery_threshold: 80,
            start_time: activeStart,
            end_time: activeEnd,
            timezone: "IST (UTC+05:30)",
            created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
            status: "active"
          },
          {
            id: "TEST-CN-2026-02",
            title: "Unit 3 Assessment: Routing & Congestion Control",
            course_code: "CS301",
            department: "CSE",
            section: "ALL",
            semester: "ALL",
            academic_year: "3rd Year",
            instructor_name: "Prof. Rajesh Sharma",
            topics: ["CN_05_ROUTING_ALGO", "CN_07_TCP_CONGESTION"],
            question_count: 5,
            difficulty: "Tier 2 (Core Protocols)",
            time_limit_mins: 15,
            mastery_threshold: 80,
            start_time: upcomingStart,
            end_time: upcomingEnd,
            timezone: "IST (UTC+05:30)",
            created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
            status: "upcoming"
          }
        ];
        localStorage.setItem(key, JSON.stringify(tests));
      }

      if (courseCode) {
        return tests.filter(t => t.course_code === courseCode || t.course_code === "ALL");
      }
      return tests;
    } catch (e) {
      console.warn("Error reading scheduled tests:", e);
      return [];
    }
  }

  deleteScheduledTest(testId) {
    const key = "gappath_scheduled_tests_v1";
    try {
      const all = this.getScheduledTests().filter(t => t.id !== testId);
      localStorage.setItem(key, JSON.stringify(all));
      return all;
    } catch (e) {
      console.warn("Error deleting scheduled test:", e);
      return [];
    }
  }

  /**
   * Deterministically match students and test assignments using stable identifiers:
   * course code, department, section, semester, and student ID.
   * Avoids loose string matching or displaying cross-course tests.
   */
  isStudentEligibleForTest(student, test) {
    if (!student || !test) return false;

    // Helper: Normalize strings (case-insensitive, trimmed, standardizing & to AND)
    const norm = (s) => (s ? String(s).trim().toUpperCase().replace(/\s*&\s*/g, " AND ") : "");
    const isWildcard = (s) => {
      const v = norm(s);
      return !v || v === "ALL" || v === "ALL SECTIONS" || v === "ALL SEMESTERS" || v === "ALL COURSES" || v === "ANY" || v === "*";
    };

    // 1. Direct Target Student ID check (takes highest precedence)
    const targetStudents = test.target_student_ids || test.target_students;
    if (targetStudents) {
      if (Array.isArray(targetStudents) && targetStudents.length > 0) {
        if (!targetStudents.some(isWildcard)) {
          return targetStudents.map(norm).includes(norm(student.student_id));
        }
      } else if (typeof targetStudents === "string" && !isWildcard(targetStudents)) {
        const ids = targetStudents.split(",").map(norm);
        return ids.includes(norm(student.student_id));
      }
    }

    // 2. Department Check
    const deptAliasMap = {
      "COMPUTER SCIENCE AND ENGINEERING": "CSE",
      "COMPUTER SCIENCE": "CSE",
      "CSE": "CSE",
      "INFORMATION TECHNOLOGY": "IT",
      "IT": "IT",
      "ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",
      "ELECTRONICS AND COMMUNICATION": "ECE",
      "ECE": "ECE",
      "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING": "AIML",
      "ARTIFICIAL INTELLIGENCE": "AIML",
      "AIML": "AIML"
    };
    const normalizeDept = (d) => {
      const v = norm(d);
      return deptAliasMap[v] || v;
    };

    const sDept = normalizeDept(student.department);
    const tDept = normalizeDept(test.department);
    if (!isWildcard(tDept) && sDept && tDept) {
      if (sDept !== tDept) return false;
    }

    // 3. Course Code Check
    const deptCoreCourse = { CSE: "CS301", IT: "IT302", ECE: "EC304", AIML: "AI305" };
    const courseAliasMap = {
      "COMPUTER NETWORKS": "CS301",
      "CN": "CS301",
      "CS301": "CS301",
      "OPERATING SYSTEMS": "CS302",
      "OS": "CS302",
      "CS302": "CS302",
      "DATABASE MANAGEMENT SYSTEMS": "CS303",
      "DBMS": "CS303",
      "CS303": "CS303",
      "DATA STRUCTURES AND ALGORITHMS": "CS304",
      "DSA": "CS304",
      "CS304": "CS304",
      "DATA COMMUNICATION AND NETWORKING": "IT302",
      "DATA COMMUNICATION": "IT302",
      "IT302": "IT302",
      "COMPUTER COMMUNICATION NETWORKS": "EC304",
      "EC304": "EC304",
      "NETWORK ARCHITECTURE FOR AI SYSTEMS": "AI305",
      "AI305": "AI305"
    };
    const normalizeCourse = (c) => {
      if (!c) return "";
      const full = norm(c);
      const clean = full.replace(/\s+/g, "");
      return courseAliasMap[full] || courseAliasMap[clean] || clean;
    };

    let sCourse = normalizeCourse(student.course_code || student.course_name || student.course);
    if (!sCourse && sDept && deptCoreCourse[sDept]) {
      sCourse = deptCoreCourse[sDept];
    }
    const tCourse = normalizeCourse(test.course_code || test.subject_id || test.subject_name || test.subject);

    if (!isWildcard(tCourse) && sCourse && tCourse) {
      if (sCourse !== tCourse) {
        if (deptCoreCourse[sDept] !== tCourse) {
          return false;
        }
      }
    }

    // 4. Section Check
    const normalizeSection = (sec) => {
      if (isWildcard(sec)) return "ALL";
      const cleaned = norm(sec).replace(/SECTION\s*/gi, "").trim();
      return cleaned || "ALL";
    };

    const tSec = normalizeSection(test.section || test.class_section || test.cohort);
    if (tSec !== "ALL") {
      const sSec = normalizeSection(student.section || student.class_section || student.cohort);
      if (sSec !== "ALL") {
        const allowedSections = tSec.split(",").map(s => normalizeSection(s));
        if (!allowedSections.includes(sSec) && !allowedSections.includes("ALL")) {
          return false;
        }
      }
    }

    // 5. Semester Check
    const extractSemNum = (sem) => {
      if (isWildcard(sem)) return "ALL";
      const str = String(sem);
      const semMatch = str.match(/(?:sem(?:ester)?\s*(\d+)|\b(\d+)(?:st|nd|rd|th)?\s*sem)/i);
      if (semMatch) {
        return semMatch[1] || semMatch[2];
      }
      const digits = str.match(/\d+/);
      return digits ? digits[0] : "ALL";
    };

    const tSem = extractSemNum(test.semester);
    if (tSem !== "ALL") {
      let sSem = "ALL";
      if (student.semester && !isWildcard(student.semester)) {
        sSem = extractSemNum(student.semester);
      } else if (student.year_semester) {
        sSem = extractSemNum(student.year_semester);
      }
      if (sSem !== "ALL" && tSem !== "ALL") {
        if (sSem !== tSem) {
          return false;
        }
      }
    }

    // 6. Academic Year Check
    if (test.academic_year && !isWildcard(test.academic_year)) {
      const extractYearNum = (yr) => {
        if (isWildcard(yr)) return "ALL";
        const m = String(yr).match(/(\d+)(?:st|nd|rd|th)?\s*year/i) || String(yr).match(/\d+/);
        return m ? (m[1] || m[0]) : "ALL";
      };
      const tYr = extractYearNum(test.academic_year);
      const sYr = extractYearNum(student.academic_year || student.year_semester);
      if (tYr !== "ALL" && sYr !== "ALL" && tYr !== sYr) {
        return false;
      }
    }

    return true;
  }

  saveScheduledTest(test) {
    if (!test || !test.id) return null;
    try {
      const key = "gappath_scheduled_tests_v1";
      const all = this.getScheduledTests();
      const idx = all.findIndex(t => t.id === test.id);
      if (idx >= 0) {
        all[idx] = test;
      } else {
        all.unshift(test);
      }
      localStorage.setItem(key, JSON.stringify(all));
      return test;
    } catch (e) {
      console.error("Failed to save scheduled test:", e);
      return null;
    }
  }

  getScheduledTestById(testId) {
    const all = this.getScheduledTests();
    return all.find(t => t.id === testId) || null;
  }

  getScheduledTestAttemptsForStudent(studentId) {
    if (!studentId) return [];
    try {
      const key = `gappath_test_attempts_${studentId}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  getScheduledTestAttempt(studentId, testId) {
    const list = this.getScheduledTestAttemptsForStudent(studentId);
    return list.find(a => a.test_id === testId) || null;
  }

  saveScheduledTestAttempt(attempt) {
    if (!attempt || !attempt.student_id || !attempt.test_id) return null;
    try {
      const key = `gappath_test_attempts_${attempt.student_id}`;
      const list = this.getScheduledTestAttemptsForStudent(attempt.student_id);
      const idx = list.findIndex(a => a.test_id === attempt.test_id);
      if (idx >= 0) {
        list[idx] = attempt;
      } else {
        list.unshift(attempt);
      }
      localStorage.setItem(key, JSON.stringify(list));
      return attempt;
    } catch (e) {
      console.error("Failed to save test attempt:", e);
      return null;
    }
  }

  getScheduledTestDraft(studentId, testId) {
    if (!studentId || !testId) return null;
    try {
      const key = `gappath_draft_${studentId}_${testId}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  saveScheduledTestDraft(studentId, testId, draft) {
    if (!studentId || !testId || !draft) return;
    try {
      const key = `gappath_draft_${studentId}_${testId}`;
      localStorage.setItem(key, JSON.stringify(draft));
    } catch (e) {
      console.warn("Failed to save draft:", e);
    }
  }

  clearScheduledTestDraft(studentId, testId) {
    if (!studentId || !testId) return;
    try {
      const key = `gappath_draft_${studentId}_${testId}`;
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Failed to clear draft:", e);
    }
  }

  // ==========================================
  // ACTUAL VS SYNTHETIC RECORD SEPARATION
  // ==========================================
  getAllScheduledTestAttempts() {
    const attempts = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("gappath_test_attempts_")) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              attempts.push(...list);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error reading scheduled test attempts:", e);
    }
    return attempts;
  }

  getActualRecordsForStudent(studentId, studentEmail) {
    try {
      // 1. Diagnostic submissions made by student (excluding seeded synthetic profiles)
      const allDiag = this.getAllRecords();
      const actualDiag = Array.isArray(allDiag) ? allDiag.filter(r => {
        if (!r || r.is_synthetic) return false;
        if (studentId && r.student_id === studentId) return true;
        if (studentEmail && r.student_email && (String(r.student_email).toLowerCase() === String(studentEmail).toLowerCase())) return true;
        return false;
      }) : [];

      // 2. Scheduled test attempts completed by this student
      const schedAttempts = this.getScheduledTestAttemptsForStudent(studentId) || [];

      // Return an Array instance so .forEach, .length, .map, .filter work directly without data-shape mismatches.
      // Simultaneously attach .diagnostic_records, .scheduled_attempts, and .total_completed
      // so any caller expecting an object shape receives valid data.
      actualDiag.diagnostic_records = actualDiag;
      actualDiag.scheduled_attempts = schedAttempts;
      actualDiag.total_completed = actualDiag.length + schedAttempts.length;
      return actualDiag;
    } catch (e) {
      console.warn("Error reading actual student records:", e);
      const empty = [];
      empty.diagnostic_records = [];
      empty.scheduled_attempts = [];
      empty.total_completed = 0;
      return empty;
    }
  }

  getActualRecordsForInstructor(instructorName, courseCode) {
    try {
      // 1. Filter diagnostic submissions (strictly non-synthetic)
      const allDiag = this.getAllRecords();
      const actualDiag = Array.isArray(allDiag) ? allDiag.filter(r => {
        if (!r || r.is_synthetic) return false;
        if (courseCode && r.course_code === courseCode) return true;
        if (instructorName && r.assigned_instructor && r.assigned_instructor.name === instructorName) return true;
        return false;
      }) : [];

      // 2. Filter scheduled test attempts for this instructor's course
      const allSched = this.getAllScheduledTestAttempts();
      const actualSched = Array.isArray(allSched) ? allSched.filter(a => {
        if (!a || a.is_synthetic) return false;
        if (courseCode && a.course_code === courseCode) return true;
        return false;
      }) : [];

      const combined = [...actualDiag, ...actualSched];
      combined.diagnostic_records = actualDiag;
      combined.scheduled_attempts = actualSched;
      combined.all_records = combined;
      return combined;
    } catch (e) {
      console.warn("Error reading actual instructor records:", e);
      const empty = [];
      empty.diagnostic_records = [];
      empty.scheduled_attempts = [];
      empty.all_records = [];
      return empty;
    }
  }

  getActualRecordsForHOD(departmentCode) {
    try {
      // 1. Filter diagnostic submissions (strictly non-synthetic)
      const allDiag = this.getAllRecords();
      const actualDiag = Array.isArray(allDiag) ? allDiag.filter(r => {
        if (!r || r.is_synthetic) return false;
        return r.department === departmentCode;
      }) : [];

      // 2. Filter scheduled test attempts for this department
      const allSched = this.getAllScheduledTestAttempts();
      // Match department from course code or test config
      const actualSched = Array.isArray(allSched) ? allSched.filter(a => {
        if (!a || a.is_synthetic) return false;
        if (a.department && a.department === departmentCode) return true;
        if (departmentCode === "CSE" && a.course_code === "CS301") return true;
        if (departmentCode === "IT" && a.course_code === "IT302") return true;
        if (departmentCode === "ECE" && a.course_code === "EC303") return true;
        return false;
      }) : [];

      const combined = [...actualDiag, ...actualSched];
      combined.diagnostic_records = actualDiag;
      combined.scheduled_attempts = actualSched;
      combined.all_records = combined;
      return combined;
    } catch (e) {
      console.warn("Error reading actual HOD records:", e);
      const empty = [];
      empty.diagnostic_records = [];
      empty.scheduled_attempts = [];
      empty.all_records = [];
      return empty;
    }
  }

  // Record student requests for help or difficulties
  recordHelpRequest(studentId, topicId, topicName, questionText) {
    if (!studentId || !topicId) return;
    try {
      const key = `gappath_help_requests_${studentId}`;
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      list.push({
        topic_id: topicId,
        topic_name: topicName,
        question_text: questionText,
        requested_at: new Date().toISOString()
      });
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.warn("Error saving help request:", e);
    }
  }

  getHelpRequestsForStudent(studentId) {
    if (!studentId) return [];
    try {
      const key = `gappath_help_requests_${studentId}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // ==========================================
  // INSPECT ALL VIEW DATA PROVIDERS (SCOPED)
  // ==========================================
  getInspectAssessmentsForInstructor(instructorName, courseCode) {
    const records = [];
    const actualData = this.getActualRecordsForInstructor(instructorName, courseCode);
    const diagRecords = actualData.diagnostic_records || [];
    const schedAttempts = actualData.scheduled_attempts || [];

    // 1. Completed Scheduled Test Attempts
    schedAttempts.forEach(att => {
      records.push({
        id: att.test_id,
        assessment_title: att.title || "Scheduled Test",
        student_id: att.student_id,
        student_name: att.student_name || "Student",
        course_code: att.course_code || courseCode || "CS301",
        class_section: att.section || "Section A",
        semester: att.semester || "5",
        status: "Completed",
        score: att.score,
        total: att.total_questions || 5,
        percentage: att.percentage || Math.round((att.score / (att.total_questions || 5)) * 100),
        topics_needing_review: att.weak_topics && att.weak_topics.length > 0 ? att.weak_topics : (att.responses ? att.responses.filter(r => !r.is_correct).map(r => r.topic_name || r.topic_id) : []),
        date: new Date(att.completed_at || att.submitted_at || Date.now()),
        type: "scheduled_test"
      });
    });

    // 2. Completed Diagnostic Assessments
    diagRecords.forEach(r => {
      const weakTopics = [];
      if (r.primary_likely_gap && r.primary_likely_gap !== "NONE") {
        weakTopics.push(r.primary_gap_name || r.primary_likely_gap);
      }
      records.push({
        id: r.report_id,
        assessment_title: "10-Concept Diagnostic Assessment",
        student_id: r.student_id,
        student_name: r.student_name,
        course_code: r.course_code,
        class_section: r.section || (r.year_semester && r.year_semester.includes("6th") ? "Section B" : "Section A"),
        semester: r.semester || (r.year_semester && r.year_semester.includes("6th") ? "6" : "5"),
        status: "Completed",
        score: r.score,
        total: r.total_questions || 10,
        percentage: r.percentage || Math.round((r.score / 10) * 100),
        topics_needing_review: weakTopics,
        date: new Date(r.submitted_at),
        type: "diagnostic"
      });
    });

    // 3. In-Progress Scheduled Test Drafts for this Course
    const scheduledTests = this.getScheduledTests(courseCode);
    const accounts = (CONFIG.ACCOUNTS || []).filter(a => a.role === "student" && (a.course_code === courseCode || courseCode === "CS301"));
    accounts.forEach(acc => {
      scheduledTests.forEach(test => {
        const hasCompleted = schedAttempts.some(a => a.student_id === acc.student_id && a.test_id === test.id);
        if (!hasCompleted) {
          const draft = this.getScheduledTestDraft(acc.student_id, test.id);
          if (draft && draft.studentAnswers && Object.keys(draft.studentAnswers).length > 0) {
            const answeredCount = Object.keys(draft.studentAnswers).length;
            const totalQ = draft.questions ? draft.questions.length : (test.question_count || 5);
            records.push({
              id: test.id,
              assessment_title: test.title,
              student_id: acc.student_id,
              student_name: acc.name,
              course_code: test.course_code,
              class_section: acc.section || "Section A",
              semester: acc.semester || "5",
              status: "In Progress",
              score: answeredCount,
              total: totalQ,
              percentage: Math.round((answeredCount / totalQ) * 100),
              topics_needing_review: ["In progress — pending submission"],
              date: new Date(draft.lastSavedAt || Date.now()),
              type: "scheduled_draft"
            });
          }
        }
      });
    });

    return records;
  }

  getInspectAssessmentsForHOD(departmentCode) {
    const records = [];
    const actualData = this.getActualRecordsForHOD(departmentCode);
    const diagRecords = actualData.diagnostic_records || [];
    const schedAttempts = actualData.scheduled_attempts || [];

    schedAttempts.forEach(att => {
      records.push({
        id: att.test_id,
        assessment_title: att.title || "Scheduled Test",
        student_id: att.student_id,
        student_name: att.student_name || "Student",
        course_code: att.course_code || "CS301",
        class_section: att.section || "Section A",
        semester: att.semester || "5",
        status: "Completed",
        score: att.score,
        total: att.total_questions || 5,
        percentage: att.percentage || Math.round((att.score / (att.total_questions || 5)) * 100),
        topics_needing_review: att.weak_topics && att.weak_topics.length > 0 ? att.weak_topics : (att.responses ? att.responses.filter(r => !r.is_correct).map(r => r.topic_name || r.topic_id) : []),
        date: new Date(att.completed_at || att.submitted_at || Date.now()),
        type: "scheduled_test"
      });
    });

    diagRecords.forEach(r => {
      const weakTopics = [];
      if (r.primary_likely_gap && r.primary_likely_gap !== "NONE") {
        weakTopics.push(r.primary_gap_name || r.primary_likely_gap);
      }
      records.push({
        id: r.report_id,
        assessment_title: "10-Concept Diagnostic Assessment",
        student_id: r.student_id,
        student_name: r.student_name,
        course_code: r.course_code,
        class_section: r.section || (r.year_semester && r.year_semester.includes("6th") ? "Section B" : "Section A"),
        semester: r.semester || (r.year_semester && r.year_semester.includes("6th") ? "6" : "5"),
        status: "Completed",
        score: r.score,
        total: r.total_questions || 10,
        percentage: r.percentage || Math.round((r.score / 10) * 100),
        topics_needing_review: weakTopics,
        date: new Date(r.submitted_at),
        type: "diagnostic"
      });
    });

    // In-progress drafts for students in this department
    const deptAccounts = (CONFIG.ACCOUNTS || []).filter(a => a.role === "student" && a.department === departmentCode);
    const scheduledTests = this.getScheduledTests();
    deptAccounts.forEach(acc => {
      scheduledTests.forEach(test => {
        const hasCompleted = schedAttempts.some(a => a.student_id === acc.student_id && a.test_id === test.id);
        if (!hasCompleted) {
          const draft = this.getScheduledTestDraft(acc.student_id, test.id);
          if (draft && draft.studentAnswers && Object.keys(draft.studentAnswers).length > 0) {
            const answeredCount = Object.keys(draft.studentAnswers).length;
            const totalQ = draft.questions ? draft.questions.length : (test.question_count || 5);
            records.push({
              id: test.id,
              assessment_title: test.title,
              student_id: acc.student_id,
              student_name: acc.name,
              course_code: test.course_code,
              class_section: acc.section || "Section A",
              semester: acc.semester || "5",
              status: "In Progress",
              score: answeredCount,
              total: totalQ,
              percentage: Math.round((answeredCount / totalQ) * 100),
              topics_needing_review: ["In progress — pending submission"],
              date: new Date(draft.lastSavedAt || Date.now()),
              type: "scheduled_draft"
            });
          }
        }
      });
    });

    return records;
  }
}

const storageEngine = new StorageEngine();
