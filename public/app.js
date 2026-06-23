const app = document.getElementById("app");

const state = {
  config: { departments: [], courses: [] },
  user: null,
  dashboard: null,
  role: "student",
  mode: "login",
  view: "overview",
  selectedStudentId: null,
  selectedFacultyId: null,
  search: "",
  notice: null
};

const roleMeta = {
  student: { label: "Student", icon: "school", line: "Profile, attendance, marks and CGPA." },
  faculty: { label: "Faculty", icon: "co_present", line: "Update students in your department." },
  hod: { label: "HOD", icon: "admin_panel_settings", line: "Oversee faculty and student records." },
  admin: { label: "Admin", icon: "lock_person", line: "Private system control and database overview." }
};

const publicRoles = ["student", "faculty", "hod"];

function html(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function icon(name) {
  return `<span class="material-symbols-outlined" aria-hidden="true">${name}</span>`;
}

function logo(name = "logo1.jpeg", extraClass = "") {
  return `<img class="seal ${extraClass}" src="/assets/${name}" alt="Annamacharya official logo" />`;
}

function initials(name = "AU") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AU";
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

function phoneAttrs(value = "", required = true) {
  const requiredAttr = required ? "required" : "";
  const valueAttr = value ? `value="${html(digitsOnly(value))}"` : "";
  return `type="tel" inputmode="numeric" maxlength="10" pattern="[0-9]{10}" ${requiredAttr} ${valueAttr} placeholder="10 digit mobile number"`;
}

function noticeHtml() {
  if (!state.notice) return "";
  return `<div class="notice ${state.notice.type}">${html(state.notice.message)}</div>`;
}

function setNotice(type, message) {
  state.notice = { type, message };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(typeof data === "string" ? data : data.message || "Request failed.");
  }
  return data;
}

async function init() {
  try {
    state.config = await api("/api/config");
    const session = await api("/api/me");
    if (session.user) {
      state.user = session.user;
      await refreshDashboard();
      return;
    }
  } catch {
    state.config = { departments: [], courses: [] };
  }
  renderLanding();
}

async function refreshDashboard() {
  state.dashboard = await api("/api/dashboard");
  state.user = state.dashboard.user;
  const allowed = navItems().map((item) => item.id);
  if (!allowed.includes(state.view)) state.view = allowed[0] || "overview";
  renderDashboard();
}

function renderLanding() {
  state.notice = null;
  app.innerHTML = `
    <div class="landing">
      <header class="landing-bar">
        <div class="brand">
          ${logo("logo1.jpeg")}
          <div>
            <strong>Annamacharya University</strong>
            <span>Management Portal</span>
          </div>
        </div>
        <nav class="landing-nav" aria-label="University links">
          <a href="#about">About</a>
          <a href="#academics">Academics</a>
          <a href="#support">Support</a>
          <button class="nav-admin" data-open-auth data-role="admin">${icon("lock")} Admin</button>
        </nav>
      </header>
      <main class="hero">
        <div class="hero-inner">
          ${logo("logo2.jpeg", "hero-seal")}
          <h1>Annamacharya University</h1>
          <p>Student, Faculty and HOD Management Portal</p>
          <div class="hero-rule"></div>
          <div class="hero-actions">
            <button class="btn gold" data-open-auth data-role="student">${icon("arrow_forward")} Enter Portal</button>
            <button class="btn light" data-open-auth data-role="faculty">${icon("login")} Faculty Login</button>
            <button class="btn ghost" data-open-auth data-role="hod">${icon("shield_person")} HOD Access</button>
          </div>
          <div class="landing-cards">
            <div class="glass-card">${icon("school")}<strong>Academic Records</strong><p>Attendance, internal marks, external marks, performance and CGPA are connected to student profiles.</p></div>
            <div class="glass-card">${icon("fact_check")}<strong>Faculty Workspace</strong><p>Faculty can manage student academics inside their assigned department.</p></div>
            <div class="glass-card">${icon("admin_panel_settings")}<strong>HOD Oversight</strong><p>HODs can review faculty, students, reports and department activity.</p></div>
          </div>
        </div>
      </main>
      <footer class="landing-foot">
        <span>Portal Version v1.0.0</span>
        <span>Guest / External User</span>
      </footer>
    </div>
  `;
  document.querySelectorAll("[data-open-auth]").forEach((button) => {
    button.addEventListener("click", () => {
      state.role = button.dataset.role || "student";
      state.mode = "login";
      renderAuth();
    });
  });
}

function departmentOptions(selected = "") {
  return state.config.departments
    .map((department) => `<option value="${html(department)}" ${department === selected ? "selected" : ""}>${html(department)}</option>`)
    .join("");
}

function courseOptions(selected = "") {
  return state.config.courses
    .map((course) => `<option value="${html(course)}" ${course === selected ? "selected" : ""}>${html(course)}</option>`)
    .join("");
}

function field(label, name, attrs = "", full = false) {
  return `
    <label class="field ${full ? "full" : ""}">
      <span>${label}</span>
      <input name="${name}" ${attrs} />
    </label>
  `;
}

function loginFields() {
  return `
    <div class="form-grid">
      ${field("Email or Username", "identifier", `required autocomplete="username" placeholder="${state.role === "admin" ? "admin@annamacharya.edu.in" : "student@annamacharya.edu.in"}"`, true)}
      ${field("Password", "password", "type=\"password\" required autocomplete=\"current-password\" placeholder=\"Enter password\"", true)}
    </div>
  `;
}

function registerFields() {
  const common = `
    <div class="form-grid">
      ${field("Full Name", "name", "required placeholder=\"Enter full name\"")}
      ${field("Email", "email", "type=\"email\" required placeholder=\"name@annamacharya.edu.in\"")}
      ${field("Username", "username", "required placeholder=\"Choose username\"")}
      ${field("Phone Number", "phone", phoneAttrs())}
      <label class="field">
        <span>Department</span>
        <select name="department" required>
          <option value="">Select department</option>
          ${departmentOptions()}
        </select>
      </label>
      <label class="field">
        <span>Blood Group</span>
        <select name="bloodGroup">
          <option value="">Select group</option>
          ${["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((group) => `<option>${group}</option>`).join("")}
        </select>
      </label>
  `;

  if (state.role === "student") {
    return `${common}
      ${field("Roll Number", "rollNumber", "placeholder=\"AU23CSE001\"")}
      <label class="field">
        <span>Gender</span>
        <select name="gender">
          <option value="">Select gender</option>
          <option>Female</option>
          <option>Male</option>
          <option>Other</option>
        </select>
      </label>
      ${field("Date of Birth", "dob", "type=\"date\"")}
      <label class="field">
        <span>Course</span>
        <select name="course" required>${courseOptions()}</select>
      </label>
      ${field("Year of Study", "year", "type=\"number\" min=\"1\" max=\"4\" required value=\"1\"")}
      ${field("Semester", "semester", "type=\"number\" min=\"1\" max=\"8\" required value=\"1\"")}
      ${field("Password", "password", "type=\"password\" required autocomplete=\"new-password\"")}
      ${field("Confirm Password", "confirmPassword", "type=\"password\" required autocomplete=\"new-password\"")}
    </div>`;
  }

  if (state.role === "faculty") {
    return `${common}
      ${field("Faculty Code", "facultyCode", "required placeholder=\"Enter official code\"")}
      ${field("Qualification", "qualification", "required placeholder=\"M.Tech, Ph.D\"")}
      ${field("Experience Years", "experienceYears", "type=\"number\" min=\"0\" required value=\"0\"")}
      ${field("Experience Months", "experienceMonths", "type=\"number\" min=\"0\" max=\"11\" value=\"0\"")}
      ${field("Password", "password", "type=\"password\" required autocomplete=\"new-password\"")}
      ${field("Confirm Password", "confirmPassword", "type=\"password\" required autocomplete=\"new-password\"")}
    </div>`;
  }

  return `${common}
    ${field("HOD Code", "hodCode", "required placeholder=\"Enter official code\"")}
    ${field("Highest Qualification", "qualification", "required placeholder=\"Ph.D, M.Tech\"")}
    ${field("Years of Experience", "experienceYears", "type=\"number\" min=\"0\" required value=\"0\"", true)}
    ${field("Password", "password", "type=\"password\" required autocomplete=\"new-password\"")}
    ${field("Confirm Password", "confirmPassword", "type=\"password\" required autocomplete=\"new-password\"")}
  </div>`;
}

function renderAuth() {
  if (state.role === "admin") state.mode = "login";
  const meta = roleMeta[state.role];
  const authRoles = state.role === "admin" ? ["admin"] : publicRoles;
  const authCopy = state.role === "admin"
    ? "Admin access is private and protected by admin credentials. Registration is disabled for this workspace."
    : `${html(meta.line)} Registration for faculty and HOD workspaces is protected with official verification codes.`;
  app.innerHTML = `
    <div class="auth-page">
      <header class="auth-topbar">
        <div class="brand">
          ${logo("logo1.jpeg")}
          <div>
            <strong>Annamacharya University</strong>
            <span>${meta.label} Access</span>
          </div>
        </div>
        <button class="btn ghost" data-back>${icon("arrow_back")} Home</button>
      </header>
      <main class="auth-layout">
        <section class="auth-visual">
          ${logo("logo1.jpeg")}
          <h1>Academic Portal</h1>
          <p>${authCopy}</p>
          <div class="role-stack">
            ${publicRoles.map((role) => {
              const item = roleMeta[role];
              return `
              <button class="role-card" data-role="${role}">
                ${icon(item.icon)}
                <span><strong>${item.label}</strong><span>${item.line}</span></span>
              </button>
            `;
            }).join("")}
          </div>
        </section>
        <section class="auth-panel">
          <div class="tabs">
            ${authRoles.map((role) => {
              const item = roleMeta[role];
              return `
              <button class="tab ${state.role === role ? "active" : ""}" data-role-tab="${role}">${icon(item.icon)} ${item.label}</button>
            `;
            }).join("")}
          </div>
          <div class="mode-tabs ${state.role === "admin" ? "single" : ""}">
            <button class="tab ${state.mode === "login" ? "active" : ""}" data-mode="login">${icon("login")} Login</button>
            ${state.role === "admin" ? "" : `<button class="tab ${state.mode === "register" ? "active" : ""}" data-mode="register">${icon("how_to_reg")} Register</button>`}
          </div>
          ${noticeHtml()}
          <div class="form-title">
            <h2>${state.mode === "login" ? `${meta.label} Login` : `${meta.label} Registration`}</h2>
            <p>${state.mode === "login" ? "Enter your account details to open your workspace." : "Complete the form to create your secured portal account."}</p>
          </div>
          <form id="auth-form">
            ${state.mode === "login" ? loginFields() : registerFields()}
            <div class="form-actions">
              <button class="btn primary" type="submit">${icon(state.mode === "login" ? "login" : "how_to_reg")} ${state.mode === "login" ? "Login" : "Register"}</button>
              <button class="btn ghost" type="reset">${icon("restart_alt")} Reset</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  `;
  attachAuthEvents();
}

function attachAuthEvents() {
  document.querySelector("[data-back]")?.addEventListener("click", renderLanding);
  document.querySelectorAll("[data-role], [data-role-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.role = button.dataset.role || button.dataset.roleTab;
      if (state.role === "admin") state.mode = "login";
      state.notice = null;
      renderAuth();
    });
  });
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      state.notice = null;
      renderAuth();
    });
  });
  bindPhoneInputs();
  document.getElementById("auth-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector("button[type='submit']");
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.role = state.role;
    submit.disabled = true;
    try {
      if (state.mode === "login") {
        const result = await api("/api/login", { method: "POST", body: JSON.stringify(payload) });
        state.user = result.user;
        state.notice = null;
        state.view = "overview";
        await refreshDashboard();
      } else {
        await api("/api/register", { method: "POST", body: JSON.stringify(payload) });
        state.mode = "login";
        setNotice("success", "Registration successful. Login with your new account.");
        renderAuth();
      }
    } catch (error) {
      setNotice("error", error.message);
      renderAuth();
    }
  });
}

function bindPhoneInputs() {
  document.querySelectorAll("input[name='phone']").forEach((input) => {
    input.value = digitsOnly(input.value);
    input.addEventListener("input", () => {
      input.value = digitsOnly(input.value);
    });
  });
}

function navItems() {
  if (!state.user) return [];
  if (state.user.role === "student") {
    return [
      { id: "overview", label: "Overview", icon: "dashboard" },
      { id: "academics", label: "Academics", icon: "history_edu" },
      { id: "notifications", label: "Notifications", icon: "notifications" }
    ];
  }
  if (state.user.role === "faculty") {
    return [
      { id: "overview", label: "Overview", icon: "dashboard" },
      { id: "students", label: "Student Records", icon: "person_search" },
      { id: "reports", label: "Reports", icon: "download" }
    ];
  }
  if (state.user.role === "admin") {
    return [
      { id: "overview", label: "Admin Overview", icon: "admin_panel_settings" },
      { id: "users", label: "Users", icon: "manage_accounts" },
      { id: "database", label: "Database", icon: "database" },
      { id: "activity", label: "Activity", icon: "monitoring" }
    ];
  }
  return [
    { id: "overview", label: "Overview", icon: "dashboard" },
    { id: "students", label: "Students", icon: "groups" },
    { id: "faculty", label: "Faculty", icon: "co_present" },
    { id: "activity", label: "Activity", icon: "monitoring" }
  ];
}

function renderDashboard() {
  const user = state.user;
  const meta = roleMeta[user.role];
  app.innerHTML = `
    <div class="workspace">
      <aside class="sidebar">
        <div class="brand">
          ${logo("logo1.jpeg")}
          <div>
            <strong>Annamacharya</strong>
            <span>${meta.label} Workspace</span>
          </div>
        </div>
        <nav class="nav-list" aria-label="Workspace">
          ${navItems().map((item) => `
            <button class="nav-btn ${state.view === item.id ? "active" : ""}" data-view="${item.id}">
              ${icon(item.icon)} ${item.label}
            </button>
          `).join("")}
        </nav>
        <div class="sidebar-footer">
          <button class="btn ghost" data-refresh>${icon("sync")} Refresh</button>
          <button class="btn primary" data-logout>${icon("logout")} Logout</button>
        </div>
      </aside>
      <main class="workspace-main">
        <header class="topline">
          <div class="workspace-head">
            <h1>${meta.label} Dashboard</h1>
            <p>${html(user.name)} · ${html(user.department || "Annamacharya University")}</p>
          </div>
          <div class="workspace-tools">
            <span class="pill good">${html(user.role.toUpperCase())}</span>
            <div class="avatar" title="${html(user.name)}">${html(initials(user.name))}</div>
          </div>
        </header>
        ${noticeHtml()}
        ${renderDashboardContent()}
      </main>
    </div>
  `;
  attachDashboardEvents();
}

function metric(label, value, iconName = "analytics") {
  return `<div class="metric-card">${icon(iconName)}<span>${label}</span><strong>${html(value)}</strong></div>`;
}

function progress(label, value, max = 100, suffix = "%") {
  const percent = max ? Math.max(0, Math.min(100, (Number(value || 0) / max) * 100)) : 0;
  return `
    <div class="progress-line">
      <div class="progress-meta"><span>${html(label)}</span><strong>${html(value)}${suffix}</strong></div>
      <div class="bar"><span style="width:${percent}%"></span></div>
    </div>
  `;
}

function renderDashboardContent() {
  if (state.user.role === "student") return studentContent();
  if (state.user.role === "faculty") return facultyContent();
  if (state.user.role === "admin") return adminContent();
  return hodContent();
}

function studentContent() {
  const student = state.dashboard.student;
  if (!student) return `<div class="empty">Student profile is not linked yet.</div>`;
  if (state.view === "academics") return studentAcademics(student);
  if (state.view === "notifications") return notificationPanel(state.dashboard.notifications);

  return `
    <section class="stats-grid">
      ${metric("Attendance", `${student.academics.attendance}%`, "fact_check")}
      ${metric("Internal", `${student.academics.internalMarks}/50`, "edit_note")}
      ${metric("External", `${student.academics.externalMarks}/100`, "assignment")}
      ${metric("CGPA", student.academics.cgpa, "workspace_premium")}
    </section>
    <section class="section-grid">
      <div class="panel">
        <div class="section-title">
          <div><h2>${html(student.name)}</h2><p>${html(student.rollNumber)} · ${html(student.course)}</p></div>
          <span class="pill good">${html(student.academics.performance)}</span>
        </div>
        <div class="info-grid">
          ${info("Department", student.department)}
          ${info("Year / Semester", `${student.year} / ${student.semester}`)}
          ${info("Email", student.email)}
          ${info("Phone", student.phone)}
          ${info("Blood Group", student.bloodGroup || "Not added")}
          ${info("Last Updated", formatDate(student.updatedAt))}
        </div>
      </div>
      <div class="panel">
        <div class="section-title"><div><h2>Course Attendance</h2><p>Current semester summary</p></div></div>
        ${progress("Overall Attendance", student.academics.attendance)}
        ${progress("CGPA Progress", student.academics.cgpa, 10, "")}
      </div>
    </section>
  `;
}

function studentAcademics(student) {
  const subjects = student.academics.subjects || [];
  return `
    <section class="panel">
      <div class="section-title">
        <div><h2>Academic Information</h2><p>Marks and subject-wise attendance</p></div>
        <button class="btn ghost" data-view="overview">${icon("person_pin")} Profile</button>
      </div>
      <div class="stats-grid">
        ${metric("Internal Marks", `${student.academics.internalMarks}/50`, "edit_note")}
        ${metric("External Marks", `${student.academics.externalMarks}/100`, "assignment")}
        ${metric("Performance", student.academics.performance, "trending_up")}
        ${metric("CGPA", student.academics.cgpa, "workspace_premium")}
      </div>
      <div class="subject-grid">
        ${subjects.length ? subjects.map((subject) => `
          <div class="subject-card">
            <span>${html(subject.code)}</span>
            <strong>${html(subject.name)}</strong>
            ${progress("Attendance", subject.attendance)}
            ${progress("Internal", subject.internal, 50, "/50")}
            ${progress("External", subject.external, 100, "/100")}
          </div>
        `).join("") : `<div class="empty">Subject-level marks will appear after faculty updates.</div>`}
      </div>
    </section>
  `;
}

function info(label, value) {
  return `<div class="info-item"><span>${html(label)}</span><strong>${html(value || "Not available")}</strong></div>`;
}

function notificationPanel(items = []) {
  return `
    <section class="panel">
      <div class="section-title"><div><h2>Notifications</h2><p>${items.length} message${items.length === 1 ? "" : "s"}</p></div></div>
      <div class="role-stack">
        ${items.length ? items.map((item) => `
          <div class="notification">
            <span>${html(item.type || "portal")} · ${formatDate(item.createdAt)}</span>
            <strong>${html(item.title)}</strong>
            <p>${html(item.body)}</p>
          </div>
        `).join("") : `<div class="empty">No notifications right now.</div>`}
      </div>
    </section>
  `;
}

function facultyContent() {
  if (state.view === "students") return studentManager("faculty");
  if (state.view === "reports") return reportsPanel();
  const stats = state.dashboard.stats;
  return `
    <section class="stats-grid">
      ${metric("Department Students", stats.students, "groups")}
      ${metric("Average Attendance", `${stats.averageAttendance}%`, "fact_check")}
      ${metric("Average CGPA", stats.averageCgpa, "workspace_premium")}
      ${metric("Notifications", state.dashboard.notifications.length, "notifications")}
    </section>
    <section class="section-grid">
      <div class="panel">
        <div class="section-title"><div><h2>Student Records Management</h2><p>Attendance, marks, performance and CGPA updates</p></div><button class="btn primary" data-view="students">${icon("person_search")} Open Records</button></div>
        ${studentTable(state.dashboard.students.slice(0, 5))}
      </div>
      <div class="panel">
        <div class="section-title"><div><h2>Your Recent Activity</h2><p>Latest workspace changes</p></div></div>
        ${activityList(state.dashboard.auditLogs)}
      </div>
    </section>
  `;
}

function hodContent() {
  if (state.view === "students") return studentManager("hod");
  if (state.view === "faculty") return facultyManager();
  if (state.view === "activity") return activityPanel();
  const stats = state.dashboard.stats;
  return `
    <section class="stats-grid">
      ${metric("Students", stats.students, "groups")}
      ${metric("Faculty", state.dashboard.faculty.length, "co_present")}
      ${metric("Departments", stats.departments, "account_balance")}
      ${metric("Avg CGPA", stats.averageCgpa, "workspace_premium")}
    </section>
    <section class="section-grid">
      <div class="panel">
        <div class="section-title"><div><h2>Executive Overview</h2><p>Department-wide student performance</p></div></div>
        ${progress("Average Attendance", stats.averageAttendance)}
        ${progress("Average CGPA", stats.averageCgpa, 10, "")}
        ${studentTable(state.dashboard.students.slice(0, 6))}
      </div>
      <div class="panel">
        <div class="section-title"><div><h2>Faculty Administration</h2><p>${state.dashboard.faculty.length} active record${state.dashboard.faculty.length === 1 ? "" : "s"}</p></div><button class="btn primary" data-view="faculty">${icon("co_present")} Manage</button></div>
        ${facultyListCompact()}
      </div>
    </section>
  `;
}

function adminContent() {
  if (state.view === "users") return adminUsers();
  if (state.view === "database") return adminDatabase();
  if (state.view === "activity") return activityPanel();
  const stats = state.dashboard.stats;
  return `
    <section class="stats-grid">
      ${metric("Total Users", stats.users, "manage_accounts")}
      ${metric("Active Users", stats.activeUsers, "verified_user")}
      ${metric("Students", stats.students, "groups")}
      ${metric("Faculty", state.dashboard.faculty.length, "co_present")}
    </section>
    <section class="section-grid">
      <div class="panel">
        <div class="section-title"><div><h2>Private Admin Control</h2><p>Only admin credentials can open this workspace.</p></div></div>
        ${adminUserTable((state.dashboard.users || []).slice(0, 8))}
      </div>
      <div class="panel">
        <div class="section-title"><div><h2>Database Setup</h2><p>${html(state.dashboard.database.storage)}</p></div></div>
        ${Object.entries(state.dashboard.database.records).map(([key, value]) => info(key, value)).join("")}
      </div>
    </section>
  `;
}

function adminUsers() {
  return `
    <section class="panel">
      <div class="section-title"><div><h2>User Access</h2><p>All registered portal accounts</p></div></div>
      ${adminUserTable(state.dashboard.users || [])}
    </section>
  `;
}

function adminUserTable(users) {
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Department</th><th>Phone</th><th>Status</th></tr></thead>
        <tbody>
          ${users.map((user) => `
            <tr>
              <td>${html(user.name)}</td>
              <td><span class="pill ${user.role === "admin" ? "danger" : "good"}">${html(user.role)}</span></td>
              <td>${html(user.email)}</td>
              <td>${html(user.department)}</td>
              <td>${html(user.phone || "Not added")}</td>
              <td>${html(user.status)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function adminDatabase() {
  const database = state.dashboard.database;
  return `
    <section class="panel">
      <div class="section-title"><div><h2>Database Setup</h2><p>${html(database.file)} · ${html(database.storage)}</p></div></div>
      <div class="info-grid">
        ${Object.entries(database.records).map(([key, value]) => info(key, value)).join("")}
      </div>
      <div class="form-actions">
        <a class="btn primary" href="/api/reports/students.csv">${icon("download")} Download Student CSV</a>
      </div>
    </section>
  `;
}

function statusPill(value) {
  const number = Number(value);
  const klass = number >= 80 ? "good" : number >= 65 ? "warn" : "danger";
  return `<span class="pill ${klass}">${html(value)}%</span>`;
}

function studentTable(students) {
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Roll</th><th>Name</th><th>Department</th><th>Attendance</th><th>CGPA</th><th>Action</th></tr></thead>
        <tbody>
          ${students.map((student) => `
            <tr>
              <td>${html(student.rollNumber)}</td>
              <td>${html(student.name)}</td>
              <td>${html(student.department)}</td>
              <td>${statusPill(student.academics.attendance)}</td>
              <td>${html(student.academics.cgpa)}</td>
              <td><button class="mini-btn" data-edit-student="${html(student.id)}">${icon("edit")} Update</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function filteredStudents() {
  const list = state.dashboard.students || [];
  const q = state.search.trim().toLowerCase();
  if (!q) return list;
  return list.filter((student) => [student.name, student.rollNumber, student.department, student.course].join(" ").toLowerCase().includes(q));
}

function studentManager() {
  const students = filteredStudents();
  const selected = students.find((student) => student.id === state.selectedStudentId) || students[0];
  if (selected && !state.selectedStudentId) state.selectedStudentId = selected.id;
  return `
    <section class="record-layout">
      <div class="table-wrap">
        <div class="table-actions">
          <div class="section-title" style="margin:0"><div><h2>Student Records Management</h2><p>${students.length} matching record${students.length === 1 ? "" : "s"}</p></div></div>
          <input class="search-box" data-search placeholder="Search name, roll or department" value="${html(state.search)}" />
        </div>
        ${students.length ? studentTable(students) : `<div class="empty">No student records found.</div>`}
      </div>
      <aside class="editor-panel">
        ${selected ? studentEditor(selected) : `<div class="empty">Select a student to update academics.</div>`}
      </aside>
    </section>
  `;
}

function studentEditor(student) {
  return `
    <div class="section-title">
      <div><h2>${html(student.name)}</h2><p>${html(student.rollNumber)} · ${html(student.course)}</p></div>
    </div>
    <form id="student-update-form" data-id="${html(student.id)}">
      <div class="form-grid">
        ${field("Attendance %", "attendance", `type="number" min="0" max="100" required value="${html(student.academics.attendance)}"`)}
        ${field("Internal Marks", "internalMarks", `type="number" min="0" max="50" required value="${html(student.academics.internalMarks)}"`)}
        ${field("External Marks", "externalMarks", `type="number" min="0" max="100" required value="${html(student.academics.externalMarks)}"`)}
        ${field("CGPA", "cgpa", `type="number" min="0" max="10" step="0.01" required value="${html(student.academics.cgpa)}"`)}
        <label class="field full">
          <span>Performance</span>
          <select name="performance">
            ${["Excellent", "Good", "Average", "Needs Attention", "New Registration"].map((item) => `<option ${student.academics.performance === item ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">${icon("save")} Save Update</button>
      </div>
    </form>
  `;
}

function facultyListCompact() {
  const faculty = state.dashboard.faculty || [];
  return faculty.length ? faculty.map((item) => `
    <div class="activity-item">
      <span>${html(item.department)}</span>
      <strong>${html(item.name)}</strong>
      <p>${html(item.qualification)} · ${html(item.experience)}</p>
    </div>
  `).join("") : `<div class="empty">No faculty records yet.</div>`;
}

function facultyManager() {
  const faculty = state.dashboard.faculty || [];
  const selected = faculty.find((item) => item.id === state.selectedFacultyId) || faculty[0];
  if (selected && !state.selectedFacultyId) state.selectedFacultyId = selected.id;
  return `
    <section class="record-layout">
      <div class="table-wrap">
        <div class="section-title"><div><h2>Faculty Administration</h2><p>HOD access to faculty profiles</p></div></div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Name</th><th>Department</th><th>Qualification</th><th>Students</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${faculty.map((item) => `
                <tr>
                  <td>${html(item.name)}</td>
                  <td>${html(item.department)}</td>
                  <td>${html(item.qualification)}</td>
                  <td>${html(item.studentCount)}</td>
                  <td><span class="pill ${item.status === "active" ? "good" : "danger"}">${html(item.status)}</span></td>
                  <td><button class="mini-btn" data-edit-faculty="${html(item.id)}">${icon("edit")} Update</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
      <aside class="editor-panel">
        ${selected ? facultyEditor(selected) : `<div class="empty">Select a faculty record.</div>`}
      </aside>
    </section>
  `;
}

function facultyEditor(faculty) {
  return `
    <div class="section-title">
      <div><h2>${html(faculty.name)}</h2><p>${html(faculty.email)}</p></div>
    </div>
    <form id="faculty-update-form" data-id="${html(faculty.id)}">
      <div class="form-grid">
        ${field("Phone", "phone", phoneAttrs(faculty.phone))}
        ${field("Qualification", "qualification", `value="${html(faculty.qualification)}"`)}
        ${field("Experience", "experience", `value="${html(faculty.experience)}"`, true)}
        ${field("Assigned Years", "assignedYears", `value="${html((faculty.assignedYears || []).join(", "))}"`, true)}
        <label class="field full">
          <span>Status</span>
          <select name="status">
            <option value="active" ${faculty.status === "active" ? "selected" : ""}>Active</option>
            <option value="inactive" ${faculty.status === "inactive" ? "selected" : ""}>Inactive</option>
          </select>
        </label>
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">${icon("save")} Save Faculty</button>
      </div>
    </form>
  `;
}

function reportsPanel() {
  return `
    <section class="panel">
      <div class="section-title">
        <div><h2>Reports</h2><p>Export student academic records for review.</p></div>
        <a class="btn primary" href="/api/reports/students.csv">${icon("download")} Download CSV</a>
      </div>
      ${studentTable(state.dashboard.students || [])}
    </section>
  `;
}

function activityList(items = []) {
  return items.length ? items.map((item) => `
    <div class="activity-item">
      <span>${html(item.actorRole)} · ${formatDate(item.createdAt)}</span>
      <strong>${html(item.action)}</strong>
      <p>${html(item.targetName)}</p>
    </div>
  `).join("") : `<div class="empty">No activity yet.</div>`;
}

function activityPanel() {
  return `
    <section class="panel">
      <div class="section-title"><div><h2>Department Activity</h2><p>Latest updates across the portal</p></div></div>
      <div class="role-stack">${activityList(state.dashboard.auditLogs)}</div>
    </section>
  `;
}

function attachDashboardEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      state.notice = null;
      renderDashboard();
    });
  });
  document.querySelector("[data-refresh]")?.addEventListener("click", async () => {
    setNotice("success", "Workspace refreshed.");
    await refreshDashboard();
  });
  document.querySelector("[data-logout]")?.addEventListener("click", async () => {
    await api("/api/logout", { method: "POST", body: "{}" });
    state.user = null;
    state.dashboard = null;
    renderLanding();
  });
  document.querySelector("[data-search]")?.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderDashboard();
  });
  bindPhoneInputs();
  document.querySelectorAll("[data-edit-student]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedStudentId = button.dataset.editStudent;
      state.view = "students";
      renderDashboard();
    });
  });
  document.getElementById("student-update-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      await api(`/api/students/${form.dataset.id}/academics`, { method: "PATCH", body: JSON.stringify(payload) });
      setNotice("success", "Student academic profile updated.");
      await refreshDashboard();
    } catch (error) {
      setNotice("error", error.message);
      renderDashboard();
    }
  });
  document.querySelectorAll("[data-edit-faculty]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedFacultyId = button.dataset.editFaculty;
      state.view = "faculty";
      renderDashboard();
    });
  });
  document.getElementById("faculty-update-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.assignedYears = String(payload.assignedYears || "").split(",").map((item) => item.trim()).filter(Boolean);
    try {
      await api(`/api/faculty/${form.dataset.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      setNotice("success", "Faculty profile updated.");
      await refreshDashboard();
    } catch (error) {
      setNotice("error", error.message);
      renderDashboard();
    }
  });
}

init();
