import Register from "./Register";
import React, { useEffect, useMemo, useState } from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  Award,
  WalletCards,
  CalendarDays,
  Megaphone,
  Activity,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Trash2,
  Pencil,
  Download,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { api, get, post, put, del } from "./api";
import type { User } from "./types";
import AccountApprovals from "./AccountApprovals";
import RegistrationSubmit from "./RegistrationSubmit";

const nav = [
  ["Dashboard", "/", "ADMIN,TEACHER,STUDENT", LayoutDashboard],
  ["Students", "/students", "ADMIN,TEACHER", Users],
  ["Teachers", "/teachers", "ADMIN,TEACHER", GraduationCap],
  ["Departments", "/departments", "ADMIN", Building2],
  ["Programs", "/programs", "ADMIN", BookOpen],
  ["Courses", "/courses", "ADMIN,TEACHER", BookOpen],
  ["Enrollment", "/enrollment", "ADMIN", ClipboardList],
  ["Attendance", "/attendance", "ADMIN,TEACHER,STUDENT", CalendarCheck],
  ["Grades", "/grades", "ADMIN,TEACHER,STUDENT", Award],
  ["Fees", "/fees", "ADMIN,STUDENT", WalletCards],
  ["Timetable", "/timetable", "ADMIN,TEACHER,STUDENT", CalendarDays],
  ["Announcements", "/announcements", "ADMIN,TEACHER,STUDENT", Megaphone],
  ["Account Approvals", "/account-approvals", "ADMIN", UserCheck],
  ["Activity Log", "/activity", "ADMIN", Activity],
] as const;

function useAuth() {
  const [user, setUser] = useState<User | null>(() =>
    JSON.parse(localStorage.getItem("sms_user") || "null"),
  );
  return {
    user,
    login: (u: User, t: string) => {
      localStorage.setItem("sms_user", JSON.stringify(u));
      localStorage.setItem("sms_token", t);
      setUser(u);
    },
    logout: () => {
      localStorage.clear();
      setUser(null);
    },
  };
}

function Shell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  return (
    <div className="app-shell">
      <aside className={open ? "sidebar" : "sidebar collapsed"}>
        <div className="brand">
          <div className="brand-mark">SH</div>
          {open && (
            <div>
              <b>StudentHub</b>
              <span>Management System</span>
            </div>
          )}
        </div>
        <nav>
          {nav
            .filter(n => n[2].split(",").includes(user.role))
            .map(([label, path, _, Icon]) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={() => innerWidth < 800 && setOpen(false)}
              >
                <Icon size={18} />
                {open && <span>{label}</span>}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          {open && (
            <div className="mini-user">
              <div className="avatar">{user.name[0]}</div>
              <div>
                <b>{user.name}</b>
                <span>{user.role}</span>
              </div>
            </div>
          )}
          <button className="logout" onClick={onLogout}>
            <LogOut size={18} />
            {open && "Sign out"}
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="crumb">
            {location.pathname === "/"
              ? "Dashboard"
              : location.pathname.slice(1).replaceAll("-", " ")}
          </div>
          <div className="top-actions">
            <span className="role-pill">{user.role}</span>
            <div className="avatar">{user.name[0]}</div>
          </div>
        </header>
        <section className="page">
          <Routes>
            <Route path="/" element={<Dashboard role={user.role} />} />
            <Route path="/students" element={<Students role={user.role} />} />
            <Route
              path="/teachers"
              element={
                <CrudPage
                  title="Teachers"
                  endpoint="teachers"
                  columns={[
                    "employee_id",
                    "first_name",
                    "last_name",
                    "email",
                    "department_name",
                    "specialization",
                    "status",
                  ]}
                  fields={teacherFields}
                  role={user.role}
                />
              }
            />
            <Route
              path="/departments"
              element={
                <CrudPage
                  title="Departments"
                  endpoint="departments"
                  columns={["name", "code", "description", "status"]}
                  fields={departmentFields}
                  role={user.role}
                />
              }
            />
            <Route
              path="/programs"
              element={
                <CrudPage
                  title="Programs"
                  endpoint="programs"
                  columns={[
                    "name",
                    "code",
                    "department_name",
                    "duration_years",
                    "status",
                  ]}
                  fields={programFields}
                  role={user.role}
                />
              }
            />
            <Route
              path="/courses"
              element={
                <CrudPage
                  title="Courses"
                  endpoint="courses"
                  columns={[
                    "code",
                    "title",
                    "credit_hours",
                    "semester",
                    "department_name",
                    "teacher_name",
                    "status",
                  ]}
                  fields={courseFields}
                  role={user.role}
                />
              }
            />
            <Route
              path="/enrollment"
              element={<Enrollment role={user.role} />}
            />
            <Route
              path="/attendance"
              element={
                <Records
                  title="Attendance"
                  endpoint="attendance"
                  columns={[
                    "attendance_date",
                    "student_name",
                    "course_code",
                    "status",
                    "notes",
                  ]}
                  fields={attendanceFields}
                  role={user.role}
                />
              }
            />
            <Route
              path="/grades"
              element={
                <Records
                  title="Grades"
                  endpoint="grades"
                  columns={[
                    "student_name",
                    "course_code",
                    "assessment",
                    "score",
                    "max_score",
                  ]}
                  fields={gradeFields}
                  role={user.role}
                />
              }
            />
            <Route
              path="/fees"
              element={
                <CrudPage
                  title="Fees & Payments"
                  endpoint="fees"
                  columns={[
                    "student_code",
                    "student_name",
                    "description",
                    "amount",
                    "amount_paid",
                    "due_date",
                    "status",
                  ]}
                  fields={feeFields}
                  role={user.role}
                />
              }
            />
            <Route
              path="/timetable"
              element={
                <CrudPage
                  title="Timetable"
                  endpoint="timetable"
                  columns={[
                    "day_of_week",
                    "start_time",
                    "end_time",
                    "course_code",
                    "course_title",
                    "room",
                    "teacher_name",
                  ]}
                  fields={timetableFields}
                  role={user.role}
                />
              }
            />
            <Route
              path="/announcements"
              element={
                <CrudPage
                  title="Announcements"
                  endpoint="announcements"
                  columns={[
                    "title",
                    "message",
                    "target_role",
                    "created_by_name",
                    "created_at",
                  ]}
                  fields={announcementFields}
                  role={user.role}
                />
              }
            />
            <Route path="/account-approvals" element={<AccountApprovals />} />
            <Route path="/activity" element={<ActivityLog />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

const studentFields = [
  ["student_id", "Student ID", "text"],
  ["admission_number", "Admission Number", "text"],
  ["first_name", "First Name", "text"],
  ["last_name", "Last Name", "text"],
  ["gender", "Gender", "select:MALE,FEMALE"],
  ["date_of_birth", "Date of Birth", "date"],
  ["email", "Email", "email"],
  ["phone", "Phone", "text"],
  ["address", "Address", "text"],
  ["guardian_name", "Guardian Name", "text"],
  ["guardian_phone", "Guardian Phone", "text"],
  ["department_id", "Department ID", "number"],
  ["program_id", "Program ID", "number"],
  ["year_level", "Year Level", "number"],
  ["semester", "Semester", "number"],
  ["admission_date", "Admission Date", "date"],
  ["status", "Status", "select:ACTIVE,INACTIVE,GRADUATED,SUSPENDED"],
  ["notes", "Notes", "textarea"],
] as const;

const teacherFields = [
  ["employee_id", "Employee ID", "text"],
  ["first_name", "First Name", "text"],
  ["last_name", "Last Name", "text"],
  ["email", "Email", "email"],
  ["phone", "Phone", "text"],
  ["department_id", "Department ID", "number"],
  ["specialization", "Specialization", "text"],
  ["status", "Status", "select:ACTIVE,INACTIVE"],
] as const;

const departmentFields = [
  ["name", "Name", "text"],
  ["code", "Code", "text"],
  ["description", "Description", "textarea"],
  ["status", "Status", "select:ACTIVE,INACTIVE"],
] as const;

const programFields = [
  ["department_id", "Department ID", "number"],
  ["name", "Name", "text"],
  ["code", "Code", "text"],
  ["duration_years", "Duration (years)", "number"],
  ["status", "Status", "select:ACTIVE,INACTIVE"],
] as const;

const courseFields = [
  ["department_id", "Department ID", "number"],
  ["teacher_id", "Teacher ID", "number"],
  ["code", "Code", "text"],
  ["title", "Title", "text"],
  ["credit_hours", "Credit Hours", "number"],
  ["semester", "Semester", "number"],
  ["prerequisites", "Prerequisites", "text"],
  ["status", "Status", "select:ACTIVE,INACTIVE"],
] as const;

const attendanceFields = [
  ["enrollment_id", "Enrollment ID", "number"],
  ["attendance_date", "Date", "date"],
  ["status", "Status", "select:PRESENT,ABSENT,LATE,EXCUSED"],
  ["notes", "Notes", "text"],
] as const;

const gradeFields = [
  ["enrollment_id", "Enrollment ID", "number"],
  [
    "assessment",
    "Assessment",
    "select:Mid Exam,Final Exam,Assignment,Quiz,Project",
  ],
  ["score", "Score", "number"],
  ["max_score", "Max Score", "number"],
  ["grade_letter", "Grade Letter", "select:A+,A,A-,B+,B,B-,C+,C,C-,D,F,NG"],
] as const;

const feeFields = [
  ["student_id", "Student ID", "number"],
  ["description", "Description", "text"],
  ["amount", "Amount", "number"],
  ["amount_paid", "Amount Paid", "number"],
  ["due_date", "Due Date", "date"],
  ["status", "Status", "select:UNPAID,PARTIAL,PAID,OVERDUE"],
  ["payment_date", "Payment Date", "date"],
] as const;

const timetableFields = [
  ["course_id", "Course ID", "number"],
  ["teacher_id", "Teacher ID", "number"],
  ["room", "Room", "text"],
  [
    "day_of_week",
    "Day",
    "select:MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY",
  ],
  ["start_time", "Start Time", "time"],
  ["end_time", "End Time", "time"],
] as const;

const announcementFields = [
  ["title", "Title", "text"],
  ["message", "Message", "textarea"],
  ["target_role", "Target Role", "select:ALL,STUDENT,TEACHER,ADMIN"],
] as const;

function Dashboard({ role }: { role: string }) {
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    get("/dashboard").then(setD).catch(console.error);
  }, []);

  if (!d) {
    return (
      <div className="page-heading">
        <div>
          <p className="eyebrow">LOADING</p>
          <h1>Dashboard</h1>
          <p className="muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // STUDENT DASHBOARD
  // ==========================================
  if (role === "STUDENT") {
    const studentCards = [
      ["Attendance", `${d.attendance}%`, CalendarCheck],
      [
        "Outstanding Fees",
        `ETB ${Number(d.outstandingFees).toLocaleString()}`,
        WalletCards,
      ],
      ["Enrolled Courses", d.enrolledCourses, BookOpen],
    ];

    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">STUDENT PORTAL</p>

            <h1>Welcome, {d.student?.name}</h1>

            <p className="muted">
              Your academic overview and latest activities.
            </p>
          </div>

          <button className="btn secondary" onClick={() => location.reload()}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Student statistics */}
        <div className="stat-grid">
          {studentCards.map(([name, value, Icon]: any) => (
            <div className="stat-card" key={name}>
              <div className="stat-icon">
                <Icon size={21} />
              </div>

              <div>
                <span>{name}</span>
                <strong>{value}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          {/* Recent Grades */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Recent Grades</h3>
                <p className="muted">Your latest assessment results.</p>
              </div>

              <NavLink to="/grades" className="btn secondary">
                View all
              </NavLink>
            </div>

            {d.recentGrades?.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Assessment</th>
                      <th>Score</th>
                    </tr>
                  </thead>

                  <tbody>
                    {d.recentGrades.map((grade: any) => (
                      <tr key={grade.id}>
                        <td>
                          <strong>{grade.course_code}</strong>
                          <br />
                          <span className="muted">{grade.course_title}</span>
                        </td>

                        <td>{grade.assessment}</td>

                        <td>
                          {grade.score} / {grade.max_score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No grades have been recorded yet.</p>
            )}
          </div>

          {/* Upcoming Timetable */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Upcoming Timetable</h3>
                <p className="muted">Your enrolled course schedule.</p>
              </div>

              <NavLink to="/timetable" className="btn secondary">
                View all
              </NavLink>
            </div>

            {d.timetable?.length ? (
              <div className="quick">
                {d.timetable.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="module">
                    <CalendarDays size={20} />

                    <div>
                      <strong>{item.course_code}</strong>

                      <div className="muted">{item.course_title}</div>

                      <small>
                        {item.day_of_week} ·{" "}
                        {String(item.start_time).slice(0, 5)}
                        {" - "}
                        {String(item.end_time).slice(0, 5)}
                        {" · Room "}
                        {item.room}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No timetable entries are available.</p>
            )}
          </div>

          {/* Announcements */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Announcements</h3>
                <p className="muted">Latest announcements for students.</p>
              </div>

              <NavLink to="/announcements" className="btn secondary">
                View all
              </NavLink>
            </div>

            {d.announcements?.length ? (
              <div className="quick">
                {d.announcements.map((announcement: any) => (
                  <div key={announcement.id} className="module">
                    <Megaphone size={20} />

                    <div>
                      <strong>{announcement.title}</strong>

                      <div className="muted">{announcement.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No announcements available.</p>
            )}
          </div>
        </div>
      </>
    );
  }

  if (role === "TEACHER") {
    const teacherCards = [
      ["My Courses", d.courses?.length || 0, BookOpen],
      ["My Students", d.students || 0, Users],
      ["Attendance", `${d.attendance || 0}%`, CalendarCheck],
      ["Grades Recorded", d.grades || 0, Award],
    ];

    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">TEACHER PORTAL</p>

            <h1>Welcome, {d.teacher?.name}</h1>

            <p className="muted">
              Your teaching activities and academic overview.
            </p>
          </div>

          <button className="btn secondary" onClick={() => location.reload()}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="stat-grid">
          {teacherCards.map(([name, value, Icon]: any) => (
            <div className="stat-card" key={name}>
              <div className="stat-icon">
                <Icon size={21} />
              </div>

              <div>
                <span>{name}</span>
                <strong>{value}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          {/* MY COURSES */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>My Courses</h3>

                <p className="muted">Courses assigned to you.</p>
              </div>

              <NavLink to="/courses" className="btn secondary">
                View all
              </NavLink>
            </div>

            {d.courses?.length ? (
              <div className="quick">
                {d.courses.slice(0, 5).map((course: any) => (
                  <div key={course.id} className="module">
                    <BookOpen size={20} />

                    <div>
                      <strong>{course.code}</strong>

                      <div className="muted">{course.title}</div>

                      <small>
                        {course.credit_hours} credit hours · Semester{" "}
                        {course.semester}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No courses are currently assigned to you.</p>
            )}
          </div>

          {/* RECENT GRADES */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Recent Grades</h3>

                <p className="muted">Latest grades from your courses.</p>
              </div>

              <NavLink to="/grades" className="btn secondary">
                View all
              </NavLink>
            </div>

            {d.recentGrades?.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Assessment</th>
                      <th>Score</th>
                    </tr>
                  </thead>

                  <tbody>
                    {d.recentGrades.map((grade: any) => (
                      <tr key={grade.id}>
                        <td>{grade.student_name}</td>

                        <td>
                          <strong>{grade.course_code}</strong>
                        </td>

                        <td>{grade.assessment}</td>

                        <td>
                          {grade.score} / {grade.max_score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No grades have been recorded yet.</p>
            )}
          </div>

          {/* TIMETABLE */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Teaching Timetable</h3>

                <p className="muted">Your scheduled classes.</p>
              </div>

              <NavLink to="/timetable" className="btn secondary">
                View all
              </NavLink>
            </div>

            {d.timetable?.length ? (
              <div className="quick">
                {d.timetable.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="module">
                    <CalendarDays size={20} />

                    <div>
                      <strong>{item.course_code}</strong>

                      <div className="muted">{item.course_title}</div>

                      <small>
                        {item.day_of_week} ·{" "}
                        {String(item.start_time).slice(0, 5)}
                        {" - "}
                        {String(item.end_time).slice(0, 5)}
                        {" · Room "}
                        {item.room}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No timetable entries are available.</p>
            )}
          </div>

          {/* ANNOUNCEMENTS */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Announcements</h3>

                <p className="muted">Latest announcements for teachers.</p>
              </div>

              <NavLink to="/announcements" className="btn secondary">
                View all
              </NavLink>
            </div>

            {d.announcements?.length ? (
              <div className="quick">
                {d.announcements.map((announcement: any) => (
                  <div key={announcement.id} className="module">
                    <Megaphone size={20} />

                    <div>
                      <strong>{announcement.title}</strong>

                      <div className="muted">{announcement.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No announcements available.</p>
            )}
          </div>
        </div>
      </>
    );
  }

  // ==========================================
  // EXISTING ADMIN / TEACHER DASHBOARD
  // ==========================================

  const cards = [
    ["Students", d.students, Users],
    ["Teachers", d.teachers, GraduationCap],
    ["Courses", d.courses, BookOpen],
    ["Departments", d.departments, Building2],
    ["Active Students", d.activeStudents, Users],
    ["Attendance", `${d.attendance}%`, CalendarCheck],
    [
      "Outstanding Fees",
      `ETB ${Number(d.outstandingFees).toLocaleString()}`,
      WalletCards,
    ],
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="muted">A real-time overview of academic operations.</p>
        </div>

        <button className="btn secondary" onClick={() => location.reload()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="stat-grid">
        {cards.map(([name, value, Icon]: any) => (
          <div className="stat-card" key={name}>
            <div className="stat-icon">
              <Icon size={21} />
            </div>

            <div>
              <span>{name}</span>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>System modules</h3>
              <p className="muted">Core areas available in the system.</p>
            </div>
          </div>

          <div className="module-grid">
            {nav.slice(1).map(([label, path, _, Icon]) => (
              <NavLink to={path} className="module" key={path}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Quick actions</h3>

          <div className="quick">
            <NavLink to="/students">
              <Plus size={18} />
              Register student
            </NavLink>

            <NavLink to="/enrollment">
              <ClipboardList size={18} />
              Create enrollment
            </NavLink>

            <NavLink to="/attendance">
              <CalendarCheck size={18} />
              Record attendance
            </NavLink>

            <NavLink to="/grades">
              <Award size={18} />
              Enter grades
            </NavLink>
          </div>
        </div>
      </div>
    </>
  );
}

function Students({ role }: { role: string }) {
  return (
    <CrudPage
      title="Students"
      endpoint="students"
      columns={[
        "student_id",
        "admission_number",
        "first_name",
        "last_name",
        "department_name",
        "program_name",
        "year_level",
        "status",
      ]}
      fields={studentFields}
      role={role}
    />
  );
}

function CrudPage({
  title,
  endpoint,
  columns,
  fields,
  role,
}: {
  title: string;
  endpoint: string;
  columns: string[];
  fields: readonly any[];
  role: string;
}) {
  const [rows, setRows] = useState<any[]>([]),
    [q, setQ] = useState(""),
    [editing, setEditing] = useState<any | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");

  const canEdit =
    ["ADMIN"].includes(role) ||
    (role === "TEACHER" && ["attendance", "grades"].includes(endpoint));

  const load = () => {
    setLoading(true);
    get(`/${endpoint}`)
      .then(setRows)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const filtered = useMemo(
    () =>
      rows.filter(r =>
        Object.values(r).join(" ").toLowerCase().includes(q.toLowerCase()),
      ),
    [rows, q],
  );
  async function remove(id: number) {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    try {
      await del(`/${endpoint}/${id}`);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>{title}</h1>
          <p className="muted">
            {rows.length} record{rows.length === 1 ? "" : "s"} in the system.
          </p>
        </div>
        {canEdit && (
          <button className="btn primary" onClick={() => setEditing({})}>
            <Plus size={17} />
            Add {title.slice(0, -1)}
          </button>
        )}
      </div>
      <div className="panel table-panel">
        <div className="toolbar">
          <div className="search">
            <Search size={17} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
            />
          </div>
          <button className="btn secondary" onClick={load}>
            <RefreshCw size={16} />
            Refresh
          </button>
          {endpoint === "students" && (
            <button
              className="btn secondary"
              onClick={() => downloadCSV(filtered, columns)}
            >
              <Download size={16} />
              CSV
            </button>
          )}
        </div>
        {error ? (
          <div className="error">{error}</div>
        ) : loading ? (
          <div className="empty">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No records found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map(c => (
                    <th key={c}>{pretty(c)}</th>
                  ))}
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    {columns.map(c => (
                      <td key={c}>{formatCell(r[c], c)}</td>
                    ))}
                    {canEdit && (
                      <td>
                        <div className="actions">
                          <button
                            className="icon-action"
                            onClick={() => setEditing(r)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="icon-action danger"
                            onClick={() => remove(r.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && (
        <FormModal
          title={
            editing.id
              ? `Edit ${title.slice(0, -1)}`
              : `Add ${title.slice(0, -1)}`
          }
          fields={fields}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          endpoint={endpoint}
        />
      )}
    </>
  );
}

function Records({
  title,
  endpoint,
  columns,
  fields,
  role,
}: {
  title: string;
  endpoint: string;
  columns: string[];
  fields: readonly any[];
  role: string;
}) {
  return (
    <CrudPage
      title={title}
      endpoint={endpoint}
      columns={columns}
      fields={fields}
      role={role}
    />
  );
}

function Enrollment({ role }: { role: string }) {
  return (
    <CrudPage
      title="Enrollments"
      endpoint="enrollments"
      columns={[
        "student_id",
        "student_name",
        "course_code",
        "course_title",
        "academic_year",
        "semester",
        "status",
      ]}
      fields={[
        ["student_id", "Student ID", "text"],
        ["course_id", "Course ID", "text"],
        ["academic_year", "Academic Year", "text"],
        ["semester", "Semester", "number"],
        ["status", "Status", "select:ENROLLED,DROPPED,COMPLETED"],
      ]}
      role={role}
    />
  );
}

function FormModal({
  title,
  fields,
  initial,
  onClose,
  onSaved,
  endpoint,
}: {
  title: string;
  fields: readonly any[];
  initial: any;
  onClose: () => void;
  onSaved: () => void;
  endpoint: string;
}) {
  const [data, setData] = useState<any>(() => ({ ...initial }));
  const [saving, setSaving] = useState(false);
  const submit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial.id) await put(`/${endpoint}/${initial.id}`, data);
      else await post(`/${endpoint}`, data);
      onSaved();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            <p className="muted">Enter the required information.</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            {fields.map(([key, label, type]: any) => (
              <label key={key} className={type === "textarea" ? "full" : ""}>
                {label}
                {type.startsWith("select:") ? (
                  <select
                    value={data[key] ?? ""}
                    onChange={e => setData({ ...data, [key]: e.target.value })}
                    required={
                      ![
                        "notes",
                        "description",
                        "prerequisites",
                        "phone",
                        "address",
                      ].includes(key)
                    }
                  >
                    <option value="">Select...</option>
                    {type
                      .slice(7)
                      .split(",")
                      .map((x: string) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                  </select>
                ) : type === "textarea" ? (
                  <textarea
                    value={data[key] ?? ""}
                    onChange={e => setData({ ...data, [key]: e.target.value })}
                  />
                ) : (
                  <input
                    type={type}
                    value={data[key] ?? ""}
                    onChange={e => setData({ ...data, [key]: e.target.value })}
                    required={
                      ![
                        "notes",
                        "description",
                        "prerequisites",
                        "phone",
                        "address",
                        "teacher_id",
                        "payment_date",
                        "date_of_birth",
                      ].includes(key)
                    }
                  />
                )}
              </label>
            ))}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn primary" disabled={saving}>
              {saving ? "Saving..." : "Save record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActivityLog() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    get("/activity")
      .then(setRows)
      .catch(e => alert(e.message));
  }, []);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SECURITY</p>
          <h1>Activity Log</h1>
          <p className="muted">Recent system activity and audit events.</p>
        </div>
      </div>
      <div className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.user_name || "System"}</td>
                  <td>
                    <span className="badge">{r.action}</span>
                  </td>
                  <td>{r.entity}</td>
                  <td>{r.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Login({ onLogin }: { onLogin: (u: User, t: string) => void }) {
  const [email, setEmail] = useState(" "),
    [password, setPassword] = useState(" "),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    nav = useNavigate();
  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin(d.user, d.token);
      nav("/");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">SH</div>
          <div>
            <b>StudentHub</b>
            <span>Management System</span>
          </div>
        </div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to manage your institution.</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              autoComplete="off"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="off"
            />
          </label>
          <button className="btn primary wide" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <NavLink className="btn secondary" to="/register">
              Sign up
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}

function downloadCSV(rows: any[], cols: string[]) {
  const csv = [
    cols.map(pretty).join(","),
    ...rows.map(r =>
      cols.map(c => `"${String(r[c] ?? "").replaceAll('"', '""')}"`).join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" }),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "students.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
function pretty(s: string) {
  return s.replaceAll("_", " ").replace(/\b\w/g, x => x.toUpperCase());
}
function formatCell(v: any, c: string) {
  if (v === null || v === undefined || v === "") return "—";
  if (c === "amount" || c === "amount_paid")
    return `ETB ${Number(v).toLocaleString()}`;
  if (c === "status") return <span className="badge">{v}</span>;
  if (typeof v === "string" && v.includes("T") && v.includes("Z"))
    return new Date(v).toLocaleDateString();
  return String(v);
}
export default function App() {
  const auth = useAuth();

  return (
    <Routes>
      {/* Standalone registration page */}
      <Route path="/register" element={<Register />} />

      {/* Registration success page */}
      <Route path="/registration-submitted" element={<RegistrationSubmit />} />

      {/* Login */}
      <Route
        path="/login"
        element={
          auth.user ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={auth.login} />
          )
        }
      />

      {/* Normal application */}
      <Route
        path="*"
        element={
          auth.user ? (
            <Shell user={auth.user} onLogout={auth.logout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
