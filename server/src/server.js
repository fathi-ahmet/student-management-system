import express from "express";
import cors from "cors";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { query, pool } from "./db.js";
import { signToken, authRequired, allow } from "./auth.js";

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));

const asyncRoute = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

async function audit(user, action, entity, entityId, details = "") {
  await query(
    "INSERT INTO activity_logs (user_id,action,entity,entity_id,details) VALUES (?,?,?,?,?)",
    [user?.id || null, action, entity, entityId || null, details],
  );
}

app.get("/api/health", (req, res) =>
  res.json({ ok: true, service: "student-management-api" }),
);

app.post(
  "/api/auth/login",
  asyncRoute(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const rows = await query(
      `SELECT id, name, email, password_hash, role, status
       FROM users
       WHERE email=?`,
      [email.trim().toLowerCase()],
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Registration still waiting for admin
    if (user.status === "PENDING") {
      return res.status(403).json({
        message: "Your registration is still awaiting administrator approval.",
        status: "PENDING",
      });
    }

    // Registration was rejected
    if (user.status === "REJECTED") {
      return res.status(403).json({
        message:
          "Your registration was rejected. You can review your application and resubmit it.",
        status: "REJECTED",
        canResubmit: true,
      });
    }

    // Any other non-active account
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Your account is not currently active.",
        status: user.status,
      });
    }

    const token = signToken(user);

    await audit(user, "LOGIN", "user", user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }),
);

app.post(
  "/api/auth/register",
  asyncRoute(async (req, res) => {
    const {
      role,
      first_name,
      last_name,
      email,
      phone,
      password,
      confirm_password,
      gender,
      date_of_birth,
      department_id,
      program_id,
      specialization,
    } = req.body;

    // =========================
    // BASIC VALIDATION
    // =========================

    if (!role || !["STUDENT", "TEACHER"].includes(role)) {
      return res.status(400).json({
        message: "Registration is only available for students and teachers.",
      });
    }

    if (!first_name?.trim() || !last_name?.trim()) {
      return res.status(400).json({
        message: "First name and last name are required.",
      });
    }

    if (!email?.trim() || !password || !confirm_password) {
      return res.status(400).json({
        message: "Email, password and password confirmation are required.",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    if (!department_id) {
      return res.status(400).json({
        message: "Department is required.",
      });
    }

    if (role === "STUDENT") {
      if (!program_id) {
        return res.status(400).json({
          message: "Program is required for student registration.",
        });
      }

      if (!gender || !["MALE", "FEMALE"].includes(gender)) {
        return res.status(400).json({
          message: "Please select a valid gender.",
        });
      }
    }

    if (role === "TEACHER" && !specialization?.trim()) {
      return res.status(400).json({
        message: "Specialization is required for teacher registration.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // =========================
    // CHECK EXISTING EMAIL
    // =========================

    const existingUsers = await query(
      `SELECT id, role, status
       FROM users
       WHERE email=?`,
      [normalizedEmail],
    );

    const existingUser = existingUsers[0];

    if (existingUser) {
      if (existingUser.status === "ACTIVE") {
        return res.status(409).json({
          message: "An account with this email already exists.",
        });
      }

      if (existingUser.status === "PENDING") {
        return res.status(409).json({
          message:
            "Your registration is already pending administrator approval.",
          status: "PENDING",
        });
      }

      if (existingUser.status !== "REJECTED") {
        return res.status(409).json({
          message: "This account cannot be registered again.",
        });
      }

      // REJECTED accounts will be handled by the resubmission flow.
    }

    // =========================
    // START TRANSACTION
    // =========================

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // =========================
      // CREATE USER ACCOUNT
      // =========================

      const passwordHash = await bcrypt.hash(password, 10);

      const userResult = await connection.execute(
        `INSERT INTO users
          (name, email, password_hash, role, status)
         VALUES (?, ?, ?, ?, 'PENDING')`,
        [
          `${first_name.trim()} ${last_name.trim()}`,
          normalizedEmail,
          passwordHash,
          role,
        ],
      );

      const userId = userResult[0].insertId;

      // =========================
      // CREATE STUDENT PROFILE
      // =========================

      if (role === "STUDENT") {
        const studentResult = await connection.execute(
          `INSERT INTO students
            (
              user_id,
              student_id,
              admission_number,
              first_name,
              last_name,
              gender,
              date_of_birth,
              email,
              phone,
              department_id,
              program_id,
              year_level,
              semester,
              admission_date,
              status
            )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, CURDATE(), 'INACTIVE')`,
          [
            userId,
            `STU-PENDING-${userId}`,
            `ADM-PENDING-${userId}`,
            first_name.trim(),
            last_name.trim(),
            gender,
            date_of_birth || null,
            normalizedEmail,
            phone?.trim() || null,
            department_id,
            program_id,
          ],
        );

        const studentId = studentResult[0].insertId;

        // Generate permanent institutional IDs
        const generatedStudentId = `STU-${new Date().getFullYear()}-${String(studentId).padStart(3, "0")}`;

        const generatedAdmissionNumber = `ADM-${new Date().getFullYear()}-${String(studentId).padStart(3, "0")}`;

        await connection.execute(
          `UPDATE students
           SET student_id=?, admission_number=?
           WHERE id=?`,
          [generatedStudentId, generatedAdmissionNumber, studentId],
        );

        await connection.commit();

        return res.status(201).json({
          message:
            "Student registration submitted successfully. Your account is waiting for administrator approval.",
          applicationId: generatedStudentId,
          status: "PENDING",
        });
      }

      // =========================
      // CREATE TEACHER PROFILE
      // =========================

      const teacherResult = await connection.execute(
        `INSERT INTO teachers
          (
            user_id,
            employee_id,
            first_name,
            last_name,
            email,
            phone,
            department_id,
            specialization,
            status
          )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'INACTIVE')`,
        [
          userId,
          `EMP-PENDING-${userId}`,
          first_name.trim(),
          last_name.trim(),
          normalizedEmail,
          phone?.trim() || null,
          department_id,
          specialization.trim(),
        ],
      );

      const teacherId = teacherResult[0].insertId;

      // Generate permanent employee ID
      const generatedEmployeeId = `EMP-${new Date().getFullYear()}-${String(teacherId).padStart(3, "0")}`;

      await connection.execute(
        `UPDATE teachers
         SET employee_id=?
         WHERE id=?`,
        [generatedEmployeeId, teacherId],
      );

      await connection.commit();

      return res.status(201).json({
        message:
          "Teacher registration submitted successfully. Your account is waiting for administrator approval.",
        applicationId: generatedEmployeeId,
        status: "PENDING",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }),
);

app.get(
  "/api/auth/me",
  authRequired,
  asyncRoute(async (req, res) => {
    const rows = await query(
      "SELECT id,name,email,role,status FROM users WHERE id=?",
      [req.user.id],
    );
    res.json(rows[0]);
  }),
);

// ============================================================
// ADMIN - PENDING ACCOUNT APPROVALS
// ============================================================

app.get(
  "/api/admin/pending-registrations",
  authRequired,
  asyncRoute(async (req, res) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    const rows = await query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.created_at,
        d.name AS department_name,
        CASE
          WHEN u.role = 'STUDENT' THEN s.student_id
          WHEN u.role = 'TEACHER' THEN t.employee_id
        END AS institutional_id
      FROM users u
      LEFT JOIN students s
        ON s.user_id = u.id
      LEFT JOIN teachers t
        ON t.user_id = u.id
      LEFT JOIN departments d
        ON d.id = COALESCE(s.department_id, t.department_id)
      WHERE u.status = 'PENDING'
      ORDER BY u.created_at DESC
    `);

    res.json(rows);
  }),
);

app.put(
  "/api/admin/users/:id/approve",
  authRequired,
  asyncRoute(async (req, res) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    const userId = Number(req.params.id);

    if (!userId) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [users] = await connection.execute(
        "SELECT id, role, status FROM users WHERE id=? FOR UPDATE",
        [userId],
      );

      const user = users[0];

      if (!user) {
        await connection.rollback();

        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (user.status !== "PENDING") {
        await connection.rollback();

        return res.status(400).json({
          message: "This account is not pending approval.",
        });
      }

      // Activate user account
      await connection.execute("UPDATE users SET status='ACTIVE' WHERE id=?", [
        userId,
      ]);

      // Activate corresponding profile
      if (user.role === "STUDENT") {
        await connection.execute(
          "UPDATE students SET status='ACTIVE' WHERE user_id=?",
          [userId],
        );
      }

      if (user.role === "TEACHER") {
        await connection.execute(
          "UPDATE teachers SET status='ACTIVE' WHERE user_id=?",
          [userId],
        );
      }

      await connection.commit();

      res.json({
        message: "Account approved successfully.",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }),
);

app.put(
  "/api/admin/users/:id/reject",
  authRequired,
  asyncRoute(async (req, res) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    const userId = Number(req.params.id);

    if (!userId) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [users] = await connection.execute(
        "SELECT id, role, status FROM users WHERE id=? FOR UPDATE",
        [userId],
      );

      const user = users[0];

      if (!user) {
        await connection.rollback();

        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (user.status !== "PENDING") {
        await connection.rollback();

        return res.status(400).json({
          message: "This account is not pending approval.",
        });
      }

      // Deactivate user account
      await connection.execute(
        "UPDATE users SET status='REJECTED' WHERE id=?",
        [userId],
      );

      // Keep profile inactive
      if (user.role === "STUDENT") {
        await connection.execute(
          "UPDATE students SET status='INACTIVE' WHERE user_id=?",
          [userId],
        );
      }

      if (user.role === "TEACHER") {
        await connection.execute(
          "UPDATE teachers SET status='INACTIVE' WHERE user_id=?",
          [userId],
        );
      }

      await connection.commit();

      res.json({
        message: "Account rejected successfully.",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }),
);

app.get(
  "/api/dashboard",
  authRequired,
  asyncRoute(async (req, res) => {
    // =========================
    // STUDENT DASHBOARD
    // =========================
    if (req.user.role === "STUDENT") {
      const studentRows = await query(
        `
        SELECT
          s.id,
          s.student_id,
          s.first_name,
          s.last_name,
          s.email
          FROM users u
          JOIN students s ON s.user_id = u.id
          WHERE u.id = ?
        `,
        [req.user.id],
      );

      const student = studentRows[0];

      if (!student) {
        return res.status(404).json({
          message: "No student profile is linked to this account.",
        });
      }

      const attendanceRows = await query(
        `
        SELECT
          COUNT(*) AS total,
          SUM(a.status = 'PRESENT') AS present
        FROM attendance a
        JOIN enrollments e ON e.id = a.enrollment_id
        WHERE e.student_id = ?
        `,
        [student.id],
      );

      const attendanceTotal = Number(attendanceRows[0]?.total || 0);

      const attendancePresent = Number(attendanceRows[0]?.present || 0);

      const attendancePercentage = attendanceTotal
        ? Math.round((attendancePresent / attendanceTotal) * 100)
        : 0;

      const feeRows = await query(
        `
        SELECT COALESCE(
          SUM(amount - amount_paid),
          0
        ) AS outstanding
        FROM fees
        WHERE student_id = ?
        `,
        [student.id],
      );

      const courseRows = await query(
        `
        SELECT COUNT(DISTINCT course_id) AS count
        FROM enrollments
        WHERE student_id = ?
          AND status = 'ENROLLED'
        `,
        [student.id],
      );

      const recentGrades = await query(
        `
        SELECT
          g.id,
          g.assessment,
          g.score,
          g.max_score,
          c.code AS course_code,
          c.title AS course_title
        FROM grades g
        JOIN enrollments e
          ON e.id = g.enrollment_id
        JOIN courses c
          ON c.id = e.course_id
        WHERE e.student_id = ?
        ORDER BY g.created_at DESC
        LIMIT 5
        `,
        [student.id],
      );

      const timetable = await query(
        `
        SELECT
          tt.id,
          tt.day_of_week,
          tt.start_time,
          tt.end_time,
          tt.room,
          c.code AS course_code,
          c.title AS course_title,
          CONCAT(
            COALESCE(t.first_name, ''),
            ' ',
            COALESCE(t.last_name, '')
          ) AS teacher_name
        FROM timetable tt
        JOIN courses c
          ON c.id = tt.course_id
        JOIN enrollments e
          ON e.course_id = c.id
        LEFT JOIN teachers t
          ON t.id = tt.teacher_id
        WHERE e.student_id = ?
          AND e.status = 'ENROLLED'
        GROUP BY
          tt.id,
          tt.day_of_week,
          tt.start_time,
          tt.end_time,
          tt.room,
          c.code,
          c.title,
          t.first_name,
          t.last_name
        ORDER BY
          FIELD(
            tt.day_of_week,
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY'
          ),
          tt.start_time
        `,
        [student.id],
      );

      const announcements = await query(
        `
        SELECT
          a.id,
          a.title,
          a.message,
          a.target_role,
          a.created_at,
          u.name AS created_by_name
        FROM announcements a
        LEFT JOIN users u
          ON u.id = a.created_by
        WHERE a.target_role IN ('ALL', 'STUDENT')
        ORDER BY a.created_at DESC
        LIMIT 5
        `,
      );

      return res.json({
        student: {
          id: student.id,
          studentId: student.student_id,
          name: `${student.first_name} ${student.last_name}`,
          email: student.email,
        },
        attendance: attendancePercentage,
        outstandingFees: Number(feeRows[0]?.outstanding || 0),
        enrolledCourses: Number(courseRows[0]?.count || 0),
        recentGrades,
        timetable,
        announcements,
      });
    }

    // =========================
    // TEACHER DASHBOARD
    // =========================
    if (req.user.role === "TEACHER") {
      const teacherRows = await query(
        `
        SELECT
          t.id,
          t.employee_id,
          t.first_name,
          t.last_name,
          t.email
        FROM users u
        JOIN teachers t ON t.user_id = u.id
        WHERE u.id = ?
        `,
        [req.user.id],
      );

      const teacher = teacherRows[0];

      if (!teacher) {
        return res.status(404).json({
          message: "No teacher profile is linked to this account.",
        });
      }

      // Courses assigned to this teacher
      const courseRows = await query(
        `
        SELECT
          c.id,
          c.code,
          c.title,
          c.credit_hours,
          c.semester
        FROM courses c
        WHERE c.teacher_id = ?
        ORDER BY c.code
        `,
        [teacher.id],
      );

      // Attendance for this teacher's courses
      const attendanceRows = await query(
        `
        SELECT
          COUNT(*) AS total,
          SUM(a.status = 'PRESENT') AS present
        FROM attendance a
        JOIN enrollments e
          ON e.id = a.enrollment_id
        JOIN courses c
          ON c.id = e.course_id
        WHERE c.teacher_id = ?
        `,
        [teacher.id],
      );

      const attendanceTotal = Number(attendanceRows[0]?.total || 0);

      const attendancePresent = Number(attendanceRows[0]?.present || 0);

      const attendancePercentage = attendanceTotal
        ? Math.round((attendancePresent / attendanceTotal) * 100)
        : 0;

      // Students in teacher's courses
      const studentRows = await query(
        `
        SELECT COUNT(DISTINCT e.student_id) AS count
        FROM enrollments e
        JOIN courses c
          ON c.id = e.course_id
        WHERE c.teacher_id = ?
          AND e.status = 'ENROLLED'
        `,
        [teacher.id],
      );

      // Grades recorded in teacher's courses
      const gradeRows = await query(
        `
        SELECT COUNT(*) AS count
        FROM grades g
        JOIN enrollments e
          ON e.id = g.enrollment_id
        JOIN courses c
          ON c.id = e.course_id
        WHERE c.teacher_id = ?
        `,
        [teacher.id],
      );

      // Teacher timetable
      const timetable = await query(
        `
        SELECT
          tt.id,
          tt.day_of_week,
          tt.start_time,
          tt.end_time,
          tt.room,
          c.code AS course_code,
          c.title AS course_title
        FROM timetable tt
        JOIN courses c
          ON c.id = tt.course_id
        WHERE c.teacher_id = ?
        ORDER BY
          FIELD(
            tt.day_of_week,
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY'
          ),
          tt.start_time
        `,
        [teacher.id],
      );

      // Recent grades in teacher's courses
      const recentGrades = await query(
        `
        SELECT
          g.id,
          g.assessment,
          g.score,
          g.max_score,
          c.code AS course_code,
          c.title AS course_title,
          CONCAT(
            s.first_name,
            ' ',
            s.last_name
          ) AS student_name
        FROM grades g
        JOIN enrollments e
          ON e.id = g.enrollment_id
        JOIN students s
          ON s.id = e.student_id
        JOIN courses c
          ON c.id = e.course_id
        WHERE c.teacher_id = ?
        ORDER BY g.created_at DESC
        LIMIT 5
        `,
        [teacher.id],
      );

      // Teacher announcements
      const announcements = await query(
        `
        SELECT
          a.id,
          a.title,
          a.message,
          a.target_role,
          a.created_at,
          u.name AS created_by_name
        FROM announcements a
        LEFT JOIN users u
          ON u.id = a.created_by
        WHERE a.target_role IN ('ALL', 'TEACHER')
        ORDER BY a.created_at DESC
        LIMIT 5
        `,
      );

      return res.json({
        teacher: {
          id: teacher.id,
          employeeId: teacher.employee_id,
          name: `${teacher.first_name} ${teacher.last_name}`,
          email: teacher.email,
        },
        courses: courseRows,
        attendance: attendancePercentage,
        students: Number(studentRows[0]?.count || 0),
        grades: Number(gradeRows[0]?.count || 0),
        timetable,
        recentGrades,
        announcements,
      });
    }

    // =========================
    // ADMIN  DASHBOARD
    // =========================
    const [students, teachers, courses, departments, active, fees, attendance] =
      await Promise.all([
        query(
          "SELECT COUNT(*) count FROM students s JOIN users u ON u.id=s.user_id WHERE s.status='ACTIVE' AND u.status='ACTIVE'",
        ),
        query(
          "SELECT COUNT(*) count FROM teachers t JOIN users u ON u.id=t.user_id WHERE t.status='ACTIVE' AND u.status='ACTIVE'",
        ),
        query("SELECT COUNT(*) count FROM courses"),
        query("SELECT COUNT(*) count FROM departments"),
        query(
          "SELECT COUNT(*) count FROM students s JOIN users u ON u.id=s.user_id WHERE s.status='ACTIVE' AND u.status='ACTIVE'",
        ),
        query("SELECT COALESCE(SUM(amount-amount_paid),0) balance FROM fees"),
        query(
          "SELECT COUNT(*) total, SUM(status='PRESENT') present FROM attendance",
        ),
      ]);

    res.json({
      students: students[0].count,
      teachers: teachers[0].count,
      courses: courses[0].count,
      departments: departments[0].count,
      activeStudents: active[0].count,
      outstandingFees: Number(fees[0].balance),
      attendance: attendance[0].total
        ? Math.round(
            (Number(attendance[0].present) / Number(attendance[0].total)) * 100,
          )
        : 0,
    });
  }),
);

const resourceConfig = {
  departments: {
    table: "departments",
    fields: ["name", "code", "description", "status"],
    select: "SELECT * FROM departments ORDER BY name",
  },
  programs: {
    table: "programs",
    fields: ["department_id", "name", "code", "duration_years", "status"],
    select:
      "SELECT p.*, d.name department_name FROM programs p JOIN departments d ON d.id=p.department_id ORDER BY p.name",
  },
  teachers: {
    table: "teachers",
    fields: [
      "employee_id",
      "first_name",
      "last_name",
      "email",
      "phone",
      "department_id",
      "specialization",
      "status",
    ],
    select:
      "SELECT t.*, d.name department_name FROM teachers t JOIN users u ON u.id=t.user_id JOIN departments d ON d.id=t.department_id WHERE u.status='ACTIVE' AND t.status='ACTIVE' ORDER BY t.created_at DESC",
  },
  courses: {
    table: "courses",
    fields: [
      "department_id",
      "teacher_id",
      "code",
      "title",
      "credit_hours",
      "semester",
      "prerequisites",
      "status",
    ],
    select:
      "SELECT c.*, d.name department_name, CONCAT(COALESCE(t.first_name,''),' ',COALESCE(t.last_name,'')) teacher_name FROM courses c JOIN departments d ON d.id=c.department_id LEFT JOIN teachers t ON t.id=c.teacher_id ORDER BY c.code",
  },
  students: {
    table: "students",
    fields: [
      "student_id",
      "admission_number",
      "first_name",
      "last_name",
      "gender",
      "date_of_birth",
      "email",
      "phone",
      "address",
      "guardian_name",
      "guardian_phone",
      "department_id",
      "program_id",
      "year_level",
      "semester",
      "admission_date",
      "status",
      "notes",
    ],
    select:
      "SELECT s.*, d.name department_name, p.name program_name FROM students s JOIN users u ON u.id=s.user_id JOIN departments d ON d.id=s.department_id JOIN programs p ON p.id=s.program_id WHERE u.status='ACTIVE' AND s.status='ACTIVE' ORDER BY s.created_at DESC",
  },

  timetable: {
    table: "timetable",
    fields: [
      "course_id",
      "teacher_id",
      "room",
      "day_of_week",
      "start_time",
      "end_time",
    ],
    select:
      "SELECT tt.*, c.code course_code, c.title course_title, CONCAT(COALESCE(t.first_name,''),' ',COALESCE(t.last_name,'')) teacher_name FROM timetable tt JOIN courses c ON c.id=tt.course_id LEFT JOIN teachers t ON t.id=tt.teacher_id ORDER BY FIELD(day_of_week,'MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'),start_time",
  },
  announcements: {
    table: "announcements",
    fields: ["title", "message", "target_role", "created_by"],
    select:
      "SELECT a.*, u.name created_by_name FROM announcements a LEFT JOIN users u ON u.id=a.created_by ORDER BY a.created_at DESC",
  },
};

// Student-specific Fees GET route
app.get(
  "/api/fees",
  authRequired,
  asyncRoute(async (req, res) => {
    let sql = `
      SELECT
        f.*,
        CONCAT(s.first_name, ' ', s.last_name) AS student_name,
        s.student_id AS student_code
      FROM fees f
      JOIN students s ON s.id = f.student_id
    `;

    const params = [];

    // Students can only see their own fees
    if (req.user.role === "STUDENT") {
      sql += `
      JOIN users u ON u.id = s.user_id
      WHERE s.user_id = ?
      `;

      params.push(req.user.id);
    }

    sql += `
      ORDER BY f.created_at DESC
    `;

    const rows = await query(sql, params);

    res.json(rows);
  }),
);

// Public registration data
app.get(
  "/api/auth/departments",
  asyncRoute(async (req, res) => {
    const rows = await query(
      `SELECT id, name
       FROM departments
       WHERE status = 'ACTIVE'
       ORDER BY name`,
    );

    res.json(rows);
  }),
);

app.get(
  "/api/auth/programs",
  asyncRoute(async (req, res) => {
    const { department_id } = req.query;

    if (!department_id) {
      return res.status(400).json({
        message: "Department is required.",
      });
    }

    const rows = await query(
      `SELECT id, name, department_id
       FROM programs
       WHERE department_id = ?
       AND status = 'ACTIVE'
       ORDER BY name`,
      [department_id],
    );

    res.json(rows);
  }),
);

// Generic CRUD routes
for (const [resource, cfg] of Object.entries(resourceConfig)) {
  app.get(
    `/api/${resource}`,
    authRequired,
    asyncRoute(async (req, res) => {
      const role = req.user.role;

      const permissions = {
        departments: ["ADMIN"],
        programs: ["ADMIN"],
        teachers: ["ADMIN", "TEACHER"],
        courses: ["ADMIN", "TEACHER"],
        students: ["ADMIN", "TEACHER"],
        fees: ["ADMIN", "STUDENT"],
        timetable: ["ADMIN", "TEACHER", "STUDENT"],
        announcements: ["ADMIN", "TEACHER", "STUDENT"],
      };

      if (!permissions[resource]?.includes(role)) {
        return res.status(403).json({
          message: "You do not have permission to access this resource.",
        });
      }

      const rows = await query(cfg.select);
      res.json(rows);
    }),
  );

  app.post(
    `/api/${resource}`,
    authRequired,
    allow("ADMIN"),
    asyncRoute(async (req, res) => {
      // Fees validation
      if (resource === "fees") {
        const amount = Number(req.body.amount);
        const amountPaid = Number(req.body.amount_paid ?? 0);

        if (!Number.isFinite(amount) || amount <= 0) {
          return res.status(400).json({
            message: "Amount must be greater than 0.",
          });
        }

        if (!Number.isFinite(amountPaid) || amountPaid < 0) {
          return res.status(400).json({
            message: "Amount paid cannot be negative.",
          });
        }

        if (amountPaid > amount) {
          return res.status(400).json({
            message: "Amount paid cannot be greater than the total amount.",
          });
        }
      }

      const data = cfg.fields.map(f => {
        if (resource === "announcements" && f === "created_by") {
          return req.user.id;
        }

        return req.body[f] ?? null;
      });

      const placeholders = cfg.fields.map(() => "?").join(",");

      const result = await query(
        `INSERT INTO ${cfg.table} (${cfg.fields.join(",")}) VALUES (${placeholders})`,
        data,
      );

      await audit(req.user, "CREATE", resource, result.insertId);

      const rows = await query(`SELECT * FROM ${cfg.table} WHERE id=?`, [
        result.insertId,
      ]);

      res.status(201).json(rows[0]);
    }),
  );

  app.put(
    `/api/${resource}/:id`,
    authRequired,
    allow("ADMIN"),
    asyncRoute(async (req, res) => {
      // Fees validation
      if (resource === "fees") {
        const amount = Number(req.body.amount);
        const amountPaid = Number(req.body.amount_paid ?? 0);

        if (!Number.isFinite(amount) || amount <= 0) {
          return res.status(400).json({
            message: "Amount must be greater than 0.",
          });
        }

        if (!Number.isFinite(amountPaid) || amountPaid < 0) {
          return res.status(400).json({
            message: "Amount paid cannot be negative.",
          });
        }

        if (amountPaid > amount) {
          return res.status(400).json({
            message: "Amount paid cannot be greater than the total amount.",
          });
        }
      }

      const assignments = cfg.fields.map(f => `${f}=?`).join(",");
      const data = [...cfg.fields.map(f => req.body[f] ?? null), req.params.id];

      await query(`UPDATE ${cfg.table} SET ${assignments} WHERE id=?`, data);

      await audit(req.user, "UPDATE", resource, req.params.id);

      const rows = await query(`SELECT * FROM ${cfg.table} WHERE id=?`, [
        req.params.id,
      ]);

      res.json(rows[0]);
    }),
  );

  app.delete(
    `/api/${resource}/:id`,
    authRequired,
    allow("ADMIN"),
    asyncRoute(async (req, res) => {
      await query(`DELETE FROM ${cfg.table} WHERE id=?`, [req.params.id]);

      await audit(req.user, "DELETE", resource, req.params.id);

      res.status(204).send();
    }),
  );
}
app.get(
  "/api/enrollments",
  authRequired,
  asyncRoute(async (req, res) => {
    res.json(
      await query(`SELECT e.*, s.student_id, CONCAT(s.first_name,' ',s.last_name) student_name, c.code course_code, c.title course_title
    FROM enrollments e JOIN students s ON s.id=e.student_id JOIN courses c ON c.id=e.course_id ORDER BY e.enrolled_at DESC`),
    );
  }),
);
app.post(
  "/api/enrollments",
  authRequired,
  allow("ADMIN"),
  asyncRoute(async (req, res) => {
    const {
      student_id,
      course_id,
      academic_year,
      semester,
      status = "ENROLLED",
    } = req.body;

    const studentIdentifier = String(student_id ?? "").trim();
    const courseCode = String(course_id ?? "")
      .trim()
      .toUpperCase();

    if (!studentIdentifier) {
      return res.status(400).json({
        message: "Student ID is required.",
      });
    }

    if (!courseCode) {
      return res.status(400).json({
        message: "Course Code is required.",
      });
    }

    // Resolve Student ID → internal students.id
    const studentRows = await query(
      "SELECT id FROM students WHERE student_id = ? LIMIT 1",
      [studentIdentifier],
    );

    if (!studentRows.length) {
      return res.status(400).json({
        message: `Student ID "${studentIdentifier}" was not found.`,
      });
    }

    // Resolve Course Code → internal courses.id
    const courseRows = await query(
      "SELECT id FROM courses WHERE UPPER(code) = ? LIMIT 1",
      [courseCode],
    );

    if (!courseRows.length) {
      return res.status(400).json({
        message: `Course Code "${courseCode}" was not found.`,
      });
    }

    const studentDbId = studentRows[0].id;
    const courseDbId = courseRows[0].id;

    const r = await query(
      `INSERT INTO enrollments
        (student_id, course_id, academic_year, semester, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        studentDbId,
        courseDbId,
        String(academic_year ?? "").trim(),
        Number(semester),
        status,
      ],
    );

    await audit(req.user, "CREATE", "enrollment", r.insertId);

    res.status(201).json({
      id: r.insertId,
    });
  }),
);

app.put(
  "/api/enrollments/:id",
  authRequired,
  allow("ADMIN"),
  asyncRoute(async (req, res) => {
    const { student_id, course_id, academic_year, semester, status } = req.body;

    const studentIdentifier = String(student_id ?? "").trim();
    const courseCode = String(course_id ?? "")
      .trim()
      .toUpperCase();

    if (!studentIdentifier) {
      return res.status(400).json({
        message: "Student ID is required.",
      });
    }

    if (!courseCode) {
      return res.status(400).json({
        message: "Course Code is required.",
      });
    }

    // Resolve Student ID → internal students.id
    const studentRows = await query(
      "SELECT id FROM students WHERE student_id = ? LIMIT 1",
      [studentIdentifier],
    );

    if (!studentRows.length) {
      return res.status(400).json({
        message: `Student ID "${studentIdentifier}" was not found.`,
      });
    }

    // Resolve Course Code → internal courses.id
    const courseRows = await query(
      "SELECT id FROM courses WHERE UPPER(code) = ? LIMIT 1",
      [courseCode],
    );

    if (!courseRows.length) {
      return res.status(400).json({
        message: `Course Code "${courseCode}" was not found.`,
      });
    }

    const studentDbId = studentRows[0].id;
    const courseDbId = courseRows[0].id;

    await query(
      `UPDATE enrollments
       SET student_id = ?,
           course_id = ?,
           academic_year = ?,
           semester = ?,
           status = ?
       WHERE id = ?`,
      [
        studentDbId,
        courseDbId,
        String(academic_year ?? "").trim(),
        Number(semester),
        status,
        req.params.id,
      ],
    );

    await audit(req.user, "UPDATE", "enrollment", req.params.id);

    res.json({
      id: Number(req.params.id),
    });
  }),
);

app.delete(
  "/api/enrollments/:id",
  authRequired,
  allow("ADMIN"),
  asyncRoute(async (req, res) => {
    await query("DELETE FROM enrollments WHERE id=?", [req.params.id]);
    await audit(req.user, "DELETE", "enrollment", req.params.id);
    res.status(204).send();
  }),
);

app.get(
  "/api/attendance",
  authRequired,
  asyncRoute(async (req, res) => {
    let sql = `
        SELECT
          a.*,
          e.student_id,
          CONCAT(s.first_name, ' ', s.last_name) AS student_name,
          c.code AS course_code
        FROM attendance a
        JOIN enrollments e ON e.id = a.enrollment_id
        JOIN students s ON s.id = e.student_id
        JOIN courses c ON c.id = e.course_id
      `;

    let params = [];

    // Students can only see their own attendance
    if (req.user.role === "STUDENT") {
      sql += `
          WHERE s.user_id = ?
        `;
      params.push(req.user.id);
    }

    sql += `
        ORDER BY a.attendance_date DESC
      `;

    const rows = await query(sql, params);

    res.json(rows);
  }),
);

async function teacherOwnsAttendance(req, attendanceId) {
  if (req.user.role !== "TEACHER") {
    return true;
  }

  const rows = await query(
    `
    SELECT a.id
    FROM attendance a
    JOIN enrollments e ON e.id = a.enrollment_id
    JOIN courses c ON c.id = e.course_id
    JOIN teachers t ON t.id = c.teacher_id
    WHERE a.id = ? AND t.user_id = ?
    LIMIT 1
    `,
    [attendanceId, req.user.id],
  );

  return rows.length > 0;
}

app.post(
  "/api/attendance",
  authRequired,
  allow("ADMIN", "TEACHER"),
  asyncRoute(async (req, res) => {
    const { enrollment_id, attendance_date, status, notes } = req.body;
    if (req.user.role === "TEACHER") {
      const teacherRows = await query(
        `
        SELECT e.id
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        JOIN teachers t ON t.id = c.teacher_id
        WHERE e.id = ? AND t.user_id = ?
        LIMIT 1
        `,
        [enrollment_id, req.user.id],
      );

      if (teacherRows.length === 0) {
        return res.status(403).json({
          message: "You can only record attendance for your own courses.",
        });
      }
    }
    const r = await query(
      "INSERT INTO attendance(enrollment_id,attendance_date,status,notes) VALUES(?,?,?,?)",
      [enrollment_id, attendance_date, status, notes || null],
    );
    await audit(req.user, "CREATE", "attendance", r.insertId);
    res.status(201).json({ id: r.insertId });
  }),
);

app.put(
  "/api/attendance/:id",
  authRequired,
  allow("ADMIN", "TEACHER"),
  asyncRoute(async (req, res) => {
    if (req.user.role === "TEACHER") {
      const ownsAttendance = await teacherOwnsAttendance(req, req.params.id);

      if (!ownsAttendance) {
        return res.status(403).json({
          message: "You can only modify attendance for your own courses.",
        });
      }
    }
    const { enrollment_id, attendance_date, status, notes } = req.body;

    await query(
      `UPDATE attendance
         SET enrollment_id=?,
             attendance_date=?,
             status=?,
             notes=?
         WHERE id=?`,
      [enrollment_id, attendance_date, status, notes || null, req.params.id],
    );

    await audit(req.user, "UPDATE", "attendance", req.params.id);

    res.json({
      id: Number(req.params.id),
    });
  }),
);

app.delete(
  "/api/attendance/:id",
  authRequired,
  allow("ADMIN", "TEACHER"),
  asyncRoute(async (req, res) => {
    if (req.user.role === "TEACHER") {
      const ownsAttendance = await teacherOwnsAttendance(req, req.params.id);

      if (!ownsAttendance) {
        return res.status(403).json({
          message: "You can only modify attendance for your own courses.",
        });
      }
    }
    await query("DELETE FROM attendance WHERE id=?", [req.params.id]);
    await audit(req.user, "DELETE", "attendance", req.params.id);
    res.status(204).send();
  }),
);

app.get(
  "/api/grades",
  authRequired,
  asyncRoute(async (req, res) => {
    let sql = `
        SELECT
          g.*,
          e.student_id,
          CONCAT(s.first_name, ' ', s.last_name) AS student_name,
          c.code AS course_code
        FROM grades g
        JOIN enrollments e ON e.id = g.enrollment_id
        JOIN students s ON s.id = e.student_id
        JOIN courses c ON c.id = e.course_id
      `;

    const params = [];

    // Students can only see their own grades
    if (req.user.role === "STUDENT") {
      sql += `
          WHERE s.user_id = ?
        `;
      params.push(req.user.id);
    }

    sql += `
        ORDER BY g.created_at DESC
      `;

    const rows = await query(sql, params);

    res.json(rows);
  }),
);

app.post(
  "/api/grades",
  authRequired,
  allow("ADMIN", "TEACHER"),
  asyncRoute(async (req, res) => {
    const { enrollment_id, assessment, score, max_score = 100 } = req.body;
    const r = await query(
      "INSERT INTO grades(enrollment_id,assessment,score,max_score) VALUES(?,?,?,?)",
      [enrollment_id, assessment, score, max_score],
    );
    await audit(req.user, "CREATE", "grade", r.insertId);
    res.status(201).json({ id: r.insertId });
  }),
);

app.put(
  "/api/grades/:id",
  authRequired,
  allow("ADMIN", "TEACHER"),
  asyncRoute(async (req, res) => {
    const { enrollment_id, assessment, score, max_score = 100 } = req.body;

    await query(
      `UPDATE grades
         SET enrollment_id=?,
             assessment=?,
             score=?,
             max_score=?
         WHERE id=?`,
      [enrollment_id, assessment, score, max_score, req.params.id],
    );

    await audit(req.user, "UPDATE", "grade", req.params.id);

    res.json({
      id: Number(req.params.id),
    });
  }),
);

app.delete(
  "/api/grades/:id",
  authRequired,
  allow("ADMIN", "TEACHER"),
  asyncRoute(async (req, res) => {
    await query("DELETE FROM grades WHERE id=?", [req.params.id]);
    res.status(204).send();
  }),
);

app.get(
  "/api/activity",
  authRequired,
  allow("ADMIN"),
  asyncRoute(async (req, res) => {
    res.json(
      await query(
        `SELECT a.*, u.name user_name FROM activity_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 100`,
      ),
    );
  }),
);

app.use((err, req, res, next) => {
  console.error(err);

  // Foreign-key constraint: trying to delete a record
  // that is still being referenced.
  if (err.code === "ER_ROW_IS_REFERENCED_2" || err.errno === 1451) {
    return res.status(409).json({
      message:
        "This record cannot be deleted because it is being used by other records. Remove or reassign those records first.",
    });
  }

  // Foreign-key constraint: trying to create/update
  // a record with a related ID that does not exist.
  if (err.code === "ER_NO_REFERENCED_ROW_2" || err.errno === 1452) {
    if (req.path === "/api/enrollments") {
      return res.status(400).json({
        message:
          "Invalid student or course ID. Make sure the student ID and course ID exist.",
      });
    }

    if (req.path === "/api/attendance") {
      return res.status(400).json({
        message: "Invalid enrollment ID. Make sure the enrollment exists.",
      });
    }

    if (req.path === "/api/grades") {
      return res.status(400).json({
        message: "Invalid enrollment ID. Make sure the enrollment exists.",
      });
    }

    if (req.path === "/api/fees" || req.path.startsWith("/api/fees/")) {
      return res.status(400).json({
        message:
          "Invalid student ID. Make sure the student exists before creating or updating a fee.",
      });
    }

    if (
      req.path === "/api/timetable" ||
      req.path.startsWith("/api/timetable/")
    ) {
      return res.status(400).json({
        message:
          "Invalid course or teacher ID. Make sure the course and teacher exist.",
      });
    }

    return res.status(400).json({
      message:
        "Invalid related record. The department or teacher you entered does not exist.",
    });
  }
  // Duplicate value for a UNIQUE column.
  if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
    if (req.path === "/api/grades" || req.path.startsWith("/api/grades/")) {
      return res.status(409).json({
        message:
          "A grade for this assessment already exists for this enrollment.",
      });
    }

    if (req.path === "/api/courses" || req.path.startsWith("/api/courses/")) {
      return res.status(409).json({
        message:
          "A record with this course code already exists. Please use a different course code.",
      });
    }

    return res.status(409).json({
      message: "A record with these values already exists.",
    });
  }

  res.status(500).json({
    message: "Internal Server Error",
  });
});
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
