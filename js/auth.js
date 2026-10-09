/**
 * GAPPath AI - Authentication & Role-Based Access Control (RBAC)
 * 
 * Manages 3 role-based portals:
 * 1. Student Portal
 * 2. Faculty / Course Instructor Portal
 * 3. Department HOD Portal
 * 
 * Strict authorization:
 * - Reject login if account role does not match chosen portal.
 * - Enforce student temporary password as registered phone number.
 * - Demo mode persistence in localStorage with clear security disclosure.
 */

const AUTH_SESSION_KEY = "gappath_active_session_v2";

class AuthEngine {
  constructor() {
    this.currentUser = this.loadSession();
  }

  loadSession() {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Failed to load session:", e);
    }
    return null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  /**
   * Authenticate user credentials against trusted account repository
   * @param {string} email
   * @param {string} password
   * @param {string} selectedRole - 'student' | 'instructor' | 'hod'
   */
  login(email, password, selectedRole) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanEmail) {
      return { success: false, error: "Email address is required." };
    }
    if (!cleanPass) {
      return { success: false, error: "Password is required." };
    }

    const accounts = CONFIG.ACCOUNTS || [];
    const account = accounts.find(a => 
      a.email.toLowerCase() === cleanEmail || 
      (a.student_id && a.student_id.toLowerCase() === cleanEmail)
    );

    if (!account) {
      return {
        success: false,
        error: `Account Not Found: No registered user found with ID or email "${email}". Please verify your credentials or select a demo account.`
      };
    }

    if (!account.is_active) {
      return {
        success: false,
        error: "Account Inactive: Your account has been suspended or deactivated."
      };
    }

    // Role Enforcement: Check if account role matches the active portal
    if (account.role !== selectedRole) {
      const roleNames = {
        student: "Student",
        instructor: "Faculty / Course Instructor",
        hod: "Department HOD"
      };
      return {
        success: false,
        error: `Authorization Mismatch: This account is registered as "${roleNames[account.role] || account.role}", but you attempted to sign in through the "${roleNames[selectedRole] || selectedRole}" portal. Please switch to the appropriate portal above.`
      };
    }

    // Credential check
    if (account.password !== cleanPass) {
      const hint = account.role === "student"
        ? " (Hint: Student temporary password is your 10-digit registered phone number)"
        : "";
      return {
        success: false,
        error: `Authentication Failed: Incorrect password.${hint}`
      };
    }

    // Create session (omitting raw password from stored session)
    // Preserving all stable identifiers for deterministic test matching and reporting
    const sessionUser = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      department: account.department,
      phone: account.phone || null,
      student_id: account.student_id || null,
      course_code: account.course_code || null,
      course_name: account.course_name || null,
      year_semester: account.year_semester || null,
      section: account.section || "Section A",
      semester: account.semester || (account.year_semester && account.year_semester.includes("6th") ? "6" : "5"),
      academic_year: account.academic_year || "3rd Year",
      designation: account.designation || null,
      loggedInAt: new Date().toISOString()
    };

    this.currentUser = sessionUser;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(AUTH_SESSION_KEY);
    return true;
  }

  /**
   * Fast 1-click demo login for evaluators
   */
  quickLogin(accountId, targetRole) {
    const account = (CONFIG.ACCOUNTS || []).find(a => a.id === accountId);
    if (account) {
      return this.login(account.email, account.password, targetRole || account.role);
    }
    return { success: false, error: "Demo account not found." };
  }

  renderCurrentPortal() {
    if (this.currentUser) {
      if (typeof window.configureNavForRole === "function") {
        window.configureNavForRole(this.currentUser.role);
      }
    } else {
      if (typeof window.initAuthAndUI === "function") {
        window.initAuthAndUI();
      }
    }
  }
}

const authEngine = new AuthEngine();
