const http = require("http");
const fsSync = require("fs");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const SESSION_COOKIE = "au_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

const FACULTY_CODE = process.env.FACULTY_REGISTRATION_CODE || "FAC-AU-2026";
const HOD_CODE = process.env.HOD_REGISTRATION_CODE || "HOD-AU-2026";
const ADMIN_KEY_FILE = path.join(DATA_DIR, "admin-key.txt");

const sessions = new Map();
let cachedAdminKey = null;

function loadEnvFile(filePath) {
  try {
    const raw = fsSync.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // Local .env is optional.
  }
}

const departments = [
  "Computer Science & Engineering",
  "Artificial Intelligence",
  "AI & Machine Learning",
  "AI & Data Science",
  "Computer Science - Data Science",
  "Cyber Security",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Humanities & Sciences"
];

const courses = [
  "B.Tech Computer Science",
  "B.Tech Artificial Intelligence",
  "B.Tech AI & Machine Learning",
  "B.Tech AI & Data Science",
  "B.Tech CSE - Data Science",
  "B.Tech Cyber Security",
  "B.Tech Information Technology",
  "B.Tech Electronics",
  "B.Tech Electrical",
  "B.Tech Mechanical",
  "B.Tech Civil",
  "B.Sc Data Science"
];

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expected] = String(storedHash || "").split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(String(password), salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return expectedBuffer.length === actual.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanEmail(value) {
  return cleanText(value).toLowerCase();
}

function normalizePhone(value) {
  const digits = cleanText(value).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
}

function isTenDigitPhone(value) {
  return /^\d{10}$/.test(normalizePhone(value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(toNumber(value), min), max);
}

function virtualAdminUser() {
  return {
    id: "admin-key-session",
    role: "admin",
    name: "Portal Admin",
    email: "",
    username: "admin",
    phone: "",
    department: "Administration",
    status: "active",
    createdAt: ""
  };
}

function createSeedDb() {
  const createdAt = now();
  const studentUser = {
    id: "usr-student-demo",
    role: "student",
    name: "John Doe Annamacharya",
    email: "student@annamacharya.edu.in",
    username: "john.doe",
    phone: "9876543210",
    department: "Computer Science & Engineering",
    status: "active",
    createdAt,
    passwordHash: hashPassword("Student123")
  };
  const studentUser2 = {
    id: "usr-student-sample-2",
    role: "student",
    name: "Siri Priya",
    email: "siri.priya@annamacharya.edu.in",
    username: "siri.priya",
    phone: "9123456780",
    department: "Computer Science & Engineering",
    status: "active",
    createdAt,
    passwordHash: hashPassword("Student123")
  };
  const facultyUser = {
    id: "usr-faculty-demo",
    role: "faculty",
    name: "Dr. Kavya Reddy",
    email: "faculty@annamacharya.edu.in",
    username: "dr.kavya",
    phone: "9848011223",
    department: "Computer Science & Engineering",
    status: "active",
    createdAt,
    passwordHash: hashPassword("Faculty123")
  };
  const hodUser = {
    id: "usr-hod-demo",
    role: "hod",
    name: "Dr. Raghavendra Rao",
    email: "hod@annamacharya.edu.in",
    username: "cse.hod",
    phone: "9700044556",
    department: "Computer Science & Engineering",
    status: "active",
    createdAt,
    passwordHash: hashPassword("Hod123")
  };

  return {
    meta: {
      name: "Annamacharya University Management Portal",
      version: "1.0.0",
      createdAt
    },
    users: [studentUser, studentUser2, facultyUser, hodUser],
    students: [
      {
        id: "stu-demo-001",
        userId: studentUser.id,
        rollNumber: "AU23CSE001",
        gender: "Male",
        dob: "2004-05-12",
        bloodGroup: "O+",
        department: "Computer Science & Engineering",
        course: "B.Tech Computer Science",
        year: "3",
        semester: "6",
        academics: {
          attendance: 87,
          internalMarks: 42,
          externalMarks: 78,
          cgpa: 8.42,
          performance: "Excellent",
          subjects: [
            { code: "CS601", name: "Data Structures", attendance: 91, internal: 44, external: 82 },
            { code: "CS602", name: "DBMS", attendance: 86, internal: 41, external: 76 },
            { code: "CS603", name: "Web Technologies", attendance: 88, internal: 43, external: 80 },
            { code: "CS604", name: "Operating Systems", attendance: 83, internal: 39, external: 74 }
          ]
        },
        updatedAt: createdAt
      },
      {
        id: "stu-demo-002",
        userId: "usr-student-sample-2",
        rollNumber: "AU23CSE014",
        gender: "Female",
        dob: "2004-02-18",
        bloodGroup: "A+",
        department: "Computer Science & Engineering",
        course: "B.Tech Computer Science",
        year: "3",
        semester: "6",
        academics: {
          attendance: 79,
          internalMarks: 38,
          externalMarks: 72,
          cgpa: 7.86,
          performance: "Good",
          subjects: [
            { code: "CS601", name: "Data Structures", attendance: 82, internal: 39, external: 73 },
            { code: "CS602", name: "DBMS", attendance: 78, internal: 37, external: 71 },
            { code: "CS603", name: "Web Technologies", attendance: 81, internal: 40, external: 75 }
          ]
        },
        updatedAt: createdAt
      }
    ],
    faculty: [
      {
        id: "fac-demo-001",
        userId: facultyUser.id,
        facultyCode: "FAC-AU-2026",
        qualification: "M.Tech, Ph.D Pursuing",
        experience: "8 years 4 months",
        bloodGroup: "B+",
        department: "Computer Science & Engineering",
        assignedYears: ["2", "3"],
        status: "active",
        updatedAt: createdAt
      }
    ],
    notifications: [
      {
        id: "not-001",
        title: "Internal marks window open",
        body: "Faculty can update internal marks for current semester students.",
        type: "academic",
        toRoles: ["faculty", "hod"],
        department: "Computer Science & Engineering",
        createdAt,
        readBy: []
      },
      {
        id: "not-002",
        title: "Attendance updated",
        body: "Your current semester attendance has been refreshed.",
        type: "student",
        toRoles: ["student"],
        toUserIds: [studentUser.id],
        department: "Computer Science & Engineering",
        createdAt,
        readBy: []
      },
      {
        id: "not-003",
        title: "Department review",
        body: "HOD workspace has the latest student and faculty overview.",
        type: "admin",
        toRoles: ["hod"],
        department: "Computer Science & Engineering",
        createdAt,
        readBy: []
      }
    ],
    auditLogs: [
      {
        id: "log-001",
        actorName: "System",
        actorRole: "system",
        action: "Seeded demo portal data",
        targetName: "All workspaces",
        createdAt
      }
    ]
  };
}

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await writeDb(createSeedDb());
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const db = JSON.parse(raw);
  if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
  if (!Array.isArray(db.notifications)) db.notifications = [];
  if (migrateDb(db)) await writeDb(db);
  return db;
}

async function writeDb(db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
}

function migrateDb(db) {
  let changed = false;
  db.users ||= [];
  db.students ||= [];
  db.faculty ||= [];
  const withoutAdmins = db.users.filter((user) => user.role !== "admin");
  if (withoutAdmins.length !== db.users.length) {
    db.users = withoutAdmins;
    changed = true;
  }
  if (db.students.some((student) => student.userId === "usr-student-sample-2") && !db.users.some((user) => user.id === "usr-student-sample-2")) {
    db.users.push({
      id: "usr-student-sample-2",
      role: "student",
      name: "Siri Priya",
      email: "siri.priya@annamacharya.edu.in",
      username: "siri.priya",
      phone: "9123456780",
      department: "Computer Science & Engineering",
      status: "active",
      createdAt: now(),
      passwordHash: hashPassword("Student123")
    });
    changed = true;
  }
  return changed;
}

async function getAdminKey() {
  if (cachedAdminKey) return cachedAdminKey;
  if (process.env.ADMIN_KEY) {
    cachedAdminKey = cleanText(process.env.ADMIN_KEY);
    return cachedAdminKey;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    cachedAdminKey = cleanText(await fs.readFile(ADMIN_KEY_FILE, "utf8"));
  } catch {
    cachedAdminKey = `auadm_${crypto.randomBytes(24).toString("hex")}`;
    await fs.writeFile(ADMIN_KEY_FILE, `${cachedAdminKey}\n`);
    console.log(`Generated admin key saved to ${ADMIN_KEY_FILE}`);
  }
  return cachedAdminKey;
}

function safeCompare(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function makeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  parts.push("Path=/", "HttpOnly", "SameSite=Lax");
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text, headers = {}) {
  res.writeHead(status, headers);
  res.end(text);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Invalid JSON payload.");
    error.status = 400;
    throw error;
  }
}

function getSession(req) {
  const cookie = parseCookies(req.headers.cookie || "")[SESSION_COOKIE];
  if (!cookie) return null;
  const session = sessions.get(cookie);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(cookie);
    return null;
  }
  return { id: cookie, ...session };
}

function getUserFromRequest(req, db) {
  const session = getSession(req);
  if (!session) return null;
  if (session.admin) return virtualAdminUser();
  const user = db.users.find((entry) => entry.id === session.userId && entry.status === "active");
  return user || null;
}

function requireUser(req, db, roles = []) {
  const user = getUserFromRequest(req, db);
  if (!user) {
    const error = new Error("Please login to continue.");
    error.status = 401;
    throw error;
  }
  if (roles.length && !roles.includes(user.role)) {
    const error = new Error("This workspace is not available for your role.");
    error.status = 403;
    throw error;
  }
  return user;
}

function enrichStudent(db, student) {
  const user = db.users.find((entry) => entry.id === student.userId) || {};
  return {
    ...student,
    name: user.name || "Student",
    email: user.email || "",
    username: user.username || "",
    phone: user.phone || "",
    status: user.status || "active"
  };
}

function enrichFaculty(db, faculty) {
  const user = db.users.find((entry) => entry.id === faculty.userId) || {};
  const studentCount = db.students.filter((student) => student.department === faculty.department).length;
  return {
    ...faculty,
    name: user.name || "Faculty",
    email: user.email || "",
    username: user.username || "",
    phone: user.phone || "",
    status: user.status || faculty.status || "active",
    studentCount
  };
}

function notificationsFor(db, user) {
  return db.notifications
    .filter((item) => {
      const roleMatch = Array.isArray(item.toRoles) && item.toRoles.includes(user.role);
      const userMatch = Array.isArray(item.toUserIds) && item.toUserIds.includes(user.id);
      const departmentMatch = !item.department || item.department === user.department || user.role === "hod";
      return (roleMatch || userMatch) && departmentMatch;
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function buildStats(db, scopedStudents = db.students) {
  const averageAttendance = scopedStudents.length
    ? Math.round(scopedStudents.reduce((sum, item) => sum + toNumber(item.academics?.attendance), 0) / scopedStudents.length)
    : 0;
  const averageCgpa = scopedStudents.length
    ? Number((scopedStudents.reduce((sum, item) => sum + toNumber(item.academics?.cgpa), 0) / scopedStudents.length).toFixed(2))
    : 0;
  return {
    students: scopedStudents.length,
    faculty: db.faculty.length,
    departments: departments.length,
    averageAttendance,
    averageCgpa
  };
}

function buildDashboard(db, user) {
  if (user.role === "student") {
    const student = db.students.find((item) => item.userId === user.id);
    return {
      role: user.role,
      user: publicUser(user),
      student: student ? enrichStudent(db, student) : null,
      notifications: notificationsFor(db, user)
    };
  }

  if (user.role === "faculty") {
    const faculty = db.faculty.find((item) => item.userId === user.id);
    const students = db.students
      .filter((student) => student.department === user.department)
      .map((student) => enrichStudent(db, student));
    return {
      role: user.role,
      user: publicUser(user),
      faculty: faculty ? enrichFaculty(db, faculty) : null,
      students,
      stats: buildStats(db, students),
      notifications: notificationsFor(db, user),
      auditLogs: db.auditLogs.slice(-8).reverse()
    };
  }

  if (user.role === "admin") {
    const students = db.students.map((student) => enrichStudent(db, student));
    return {
      role: user.role,
      user: publicUser(user),
      users: db.users.map((entry) => publicUser(entry)),
      students,
      faculty: db.faculty.map((item) => enrichFaculty(db, item)),
      stats: {
        ...buildStats(db, students),
        users: db.users.length,
        activeUsers: db.users.filter((entry) => entry.status === "active").length,
        notifications: db.notifications.length
      },
      database: {
        file: "data/db.json",
        storage: "Local JSON database",
        records: {
          users: db.users.length,
          students: db.students.length,
          faculty: db.faculty.length,
          notifications: db.notifications.length,
          auditLogs: db.auditLogs.length
        }
      },
      notifications: notificationsFor(db, user),
      auditLogs: db.auditLogs.slice(-20).reverse()
    };
  }

  const students = db.students.map((student) => enrichStudent(db, student));
  return {
    role: user.role,
    user: publicUser(user),
    students,
    faculty: db.faculty.map((item) => enrichFaculty(db, item)),
    stats: buildStats(db, students),
    notifications: notificationsFor(db, user),
    auditLogs: db.auditLogs.slice(-12).reverse()
  };
}

function addAuditLog(db, user, action, targetName) {
  db.auditLogs.push({
    id: id("log"),
    actorName: user.name,
    actorRole: user.role,
    action,
    targetName,
    createdAt: now()
  });
  db.auditLogs = db.auditLogs.slice(-100);
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function studentsToCsv(students) {
  const rows = [
    ["Roll Number", "Name", "Department", "Course", "Year", "Semester", "Attendance", "Internal", "External", "CGPA", "Performance"]
  ];
  for (const student of students) {
    rows.push([
      student.rollNumber,
      student.name,
      student.department,
      student.course,
      student.year,
      student.semester,
      student.academics?.attendance,
      student.academics?.internalMarks,
      student.academics?.externalMarks,
      student.academics?.cgpa,
      student.academics?.performance
    ]);
  }
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

async function register(req, res, db) {
  const body = await readJson(req);
  const role = cleanText(body.role).toLowerCase();
  if (!["student", "faculty", "hod"].includes(role)) {
    return sendJson(res, 400, { message: "Choose student, faculty or HOD registration." });
  }

  const name = cleanText(body.name);
  const email = cleanEmail(body.email);
  const username = cleanText(body.username || email.split("@")[0]);
  const password = cleanText(body.password);
  const confirmPassword = cleanText(body.confirmPassword);
  const department = cleanText(body.department);
  const phone = normalizePhone(body.phone);

  if (!name || !email || !username || !password || !department) {
    return sendJson(res, 400, { message: "Please fill all required fields." });
  }
  if (!isTenDigitPhone(phone)) {
    return sendJson(res, 400, { message: "Phone number must be exactly 10 digits." });
  }
  if (password.length < 6) {
    return sendJson(res, 400, { message: "Password must be at least 6 characters." });
  }
  if (password !== confirmPassword) {
    return sendJson(res, 400, { message: "Passwords do not match." });
  }
  if (!departments.includes(department)) {
    return sendJson(res, 400, { message: "Please choose a valid department." });
  }
  if (db.users.some((user) => user.email === email || user.username.toLowerCase() === username.toLowerCase())) {
    return sendJson(res, 409, { message: "Email or username already exists." });
  }

  if (role === "faculty" && cleanText(body.facultyCode) !== FACULTY_CODE) {
    return sendJson(res, 403, { message: "Faculty registration code is invalid." });
  }
  if (role === "hod" && cleanText(body.hodCode) !== HOD_CODE) {
    return sendJson(res, 403, { message: "HOD registration code is invalid." });
  }

  const user = {
    id: id("usr"),
    role,
    name,
    email,
    username,
    phone,
    department,
    status: "active",
    createdAt: now(),
    passwordHash: hashPassword(password)
  };
  db.users.push(user);

  if (role === "student") {
    const rollNumber = cleanText(body.rollNumber || `AU${Date.now().toString().slice(-7)}`);
    if (db.students.some((student) => student.rollNumber.toLowerCase() === rollNumber.toLowerCase())) {
      db.users = db.users.filter((entry) => entry.id !== user.id);
      return sendJson(res, 409, { message: "Roll number already exists." });
    }
    db.students.push({
      id: id("stu"),
      userId: user.id,
      rollNumber,
      gender: cleanText(body.gender),
      dob: cleanText(body.dob),
      bloodGroup: cleanText(body.bloodGroup),
      department,
      course: cleanText(body.course || courses[0]),
      year: cleanText(body.year || "1"),
      semester: cleanText(body.semester || "1"),
      academics: {
        attendance: 0,
        internalMarks: 0,
        externalMarks: 0,
        cgpa: 0,
        performance: "New Registration",
        subjects: []
      },
      updatedAt: now()
    });
  }

  if (role === "faculty") {
    db.faculty.push({
      id: id("fac"),
      userId: user.id,
      facultyCode: "verified",
      qualification: cleanText(body.qualification),
      experience: `${cleanText(body.experienceYears || "0")} years ${cleanText(body.experienceMonths || "0")} months`,
      bloodGroup: cleanText(body.bloodGroup),
      department,
      assignedYears: ["1", "2"],
      status: "active",
      updatedAt: now()
    });
  }

  addAuditLog(db, user, `${role.toUpperCase()} registration completed`, name);
  await writeDb(db);
  return sendJson(res, 201, { message: "Registration successful. You can login now.", user: publicUser(user) });
}

async function login(req, res, db) {
  const body = await readJson(req);
  const identifier = cleanText(body.identifier).toLowerCase();
  const role = cleanText(body.role).toLowerCase();
  const password = cleanText(body.password);
  if (role === "admin") {
    return sendJson(res, 400, { message: "Admin access uses the private /admin key page." });
  }
  const user = db.users.find((entry) => {
    const identityMatches = entry.email.toLowerCase() === identifier || entry.username.toLowerCase() === identifier;
    const roleMatches = !role || entry.role === role;
    return identityMatches && roleMatches;
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return sendJson(res, 401, { message: "Invalid login details." });
  }
  if (user.status !== "active") {
    return sendJson(res, 403, { message: "This account is not active." });
  }

  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS });
  return sendJson(
    res,
    200,
    { message: "Login successful.", user: publicUser(user) },
    { "Set-Cookie": makeCookie(SESSION_COOKIE, sessionId, { maxAge: SESSION_TTL_MS / 1000 }) }
  );
}

async function adminLogin(req, res) {
  const body = await readJson(req);
  const adminKey = await getAdminKey();
  if (!safeCompare(cleanText(body.adminKey), adminKey)) {
    return sendJson(res, 401, { message: "Invalid admin key." });
  }
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, { admin: true, expiresAt: Date.now() + SESSION_TTL_MS });
  return sendJson(
    res,
    200,
    { message: "Admin access granted.", user: publicUser(virtualAdminUser()) },
    { "Set-Cookie": makeCookie(SESSION_COOKIE, sessionId, { maxAge: SESSION_TTL_MS / 1000 }) }
  );
}

async function updateStudentAcademics(req, res, db, user, studentId) {
  const student = db.students.find((entry) => entry.id === studentId);
  if (!student) return sendJson(res, 404, { message: "Student record not found." });
  if (user.role === "faculty" && student.department !== user.department) {
    return sendJson(res, 403, { message: "Faculty can update only their department students." });
  }

  const body = await readJson(req);
  student.academics = {
    ...student.academics,
    attendance: clamp(body.attendance, 0, 100),
    internalMarks: clamp(body.internalMarks, 0, 50),
    externalMarks: clamp(body.externalMarks, 0, 100),
    cgpa: clamp(body.cgpa, 0, 10),
    performance: cleanText(body.performance || student.academics?.performance || "Updated")
  };
  student.updatedAt = now();

  const target = enrichStudent(db, student);
  db.notifications.push({
    id: id("not"),
    title: "Academic profile updated",
    body: `${user.name} updated attendance, marks, performance and CGPA.`,
    type: "student",
    toRoles: ["student"],
    toUserIds: [student.userId],
    department: student.department,
    createdAt: now(),
    readBy: []
  });
  addAuditLog(db, user, "Updated student academic profile", `${target.rollNumber} - ${target.name}`);
  await writeDb(db);
  return sendJson(res, 200, { message: "Student academic profile updated.", student: target });
}

async function updateFaculty(req, res, db, user, facultyId) {
  const faculty = db.faculty.find((entry) => entry.id === facultyId);
  if (!faculty) return sendJson(res, 404, { message: "Faculty record not found." });
  const facultyUser = db.users.find((entry) => entry.id === faculty.userId);
  const body = await readJson(req);

  if (facultyUser) {
    if (body.phone !== undefined && !isTenDigitPhone(body.phone)) {
      return sendJson(res, 400, { message: "Phone number must be exactly 10 digits." });
    }
    facultyUser.phone = body.phone !== undefined ? normalizePhone(body.phone) : facultyUser.phone;
    facultyUser.status = ["active", "inactive"].includes(cleanText(body.status)) ? cleanText(body.status) : facultyUser.status;
  }
  faculty.qualification = cleanText(body.qualification || faculty.qualification);
  faculty.experience = cleanText(body.experience || faculty.experience);
  faculty.assignedYears = Array.isArray(body.assignedYears) ? body.assignedYears.map(cleanText).filter(Boolean) : faculty.assignedYears;
  faculty.updatedAt = now();

  addAuditLog(db, user, "Updated faculty profile", facultyUser?.name || faculty.id);
  await writeDb(db);
  return sendJson(res, 200, { message: "Faculty profile updated.", faculty: enrichFaculty(db, faculty) });
}

async function handleApi(req, res) {
  const db = await readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;
  const method = req.method || "GET";

  if (method === "GET" && pathname === "/api/config") {
    return sendJson(res, 200, { departments, courses });
  }
  if (method === "POST" && pathname === "/api/register") {
    return register(req, res, db);
  }
  if (method === "POST" && pathname === "/api/login") {
    return login(req, res, db);
  }
  if (method === "POST" && pathname === "/api/admin/login") {
    return adminLogin(req, res);
  }
  if (method === "POST" && pathname === "/api/logout") {
    const session = getSession(req);
    if (session) sessions.delete(session.id);
    return sendJson(res, 200, { message: "Logged out." }, { "Set-Cookie": makeCookie(SESSION_COOKIE, "", { maxAge: 0 }) });
  }
  if (method === "GET" && pathname === "/api/me") {
    const user = getUserFromRequest(req, db);
    return sendJson(res, 200, { user: publicUser(user) });
  }

  const user = requireUser(req, db);

  if (method === "GET" && pathname === "/api/dashboard") {
    return sendJson(res, 200, buildDashboard(db, user));
  }
  if (method === "GET" && pathname === "/api/students") {
    requireUser(req, db, ["faculty", "hod", "admin"]);
    const students = db.students
      .filter((student) => user.role === "hod" || user.role === "admin" || student.department === user.department)
      .map((student) => enrichStudent(db, student));
    return sendJson(res, 200, { students });
  }
  if (method === "PATCH" && /^\/api\/students\/[^/]+\/academics$/.test(pathname)) {
    requireUser(req, db, ["faculty", "hod", "admin"]);
    const studentId = decodeURIComponent(pathname.split("/")[3]);
    return updateStudentAcademics(req, res, db, user, studentId);
  }
  if (method === "GET" && pathname === "/api/faculty") {
    requireUser(req, db, ["hod", "admin"]);
    return sendJson(res, 200, { faculty: db.faculty.map((item) => enrichFaculty(db, item)) });
  }
  if (method === "PATCH" && /^\/api\/faculty\/[^/]+$/.test(pathname)) {
    requireUser(req, db, ["hod", "admin"]);
    const facultyId = decodeURIComponent(pathname.split("/")[3]);
    return updateFaculty(req, res, db, user, facultyId);
  }
  if (method === "GET" && pathname === "/api/reports/students.csv") {
    requireUser(req, db, ["faculty", "hod", "admin"]);
    const students = db.students
      .filter((student) => user.role === "hod" || user.role === "admin" || student.department === user.department)
      .map((student) => enrichStudent(db, student));
    return sendText(res, 200, studentsToCsv(students), {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"annamacharya-students.csv\""
    });
  }

  return sendJson(res, 404, { message: "API route not found." });
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendText(res, 403, "Forbidden");
  }
  try {
    const data = await fs.readFile(filePath);
    const type = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch {
    const index = await fs.readFile(path.join(PUBLIC_DIR, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(index);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
    } else {
      await serveStatic(req, res);
    }
  } catch (error) {
    const status = error.status || 500;
    sendJson(res, status, { message: status === 500 ? "Server error. Please try again." : error.message });
    if (status === 500) console.error(error);
  }
});

ensureDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Annamacharya University portal running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start portal:", error);
    process.exit(1);
  });
