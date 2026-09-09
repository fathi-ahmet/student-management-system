import "./Register.css";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("STUDENT");
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    gender: "",
    date_of_birth: "",
    department_id: "",
    program_id: "",
    specialization: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (form.department_id) {
      loadPrograms(form.department_id);
    } else {
      setPrograms([]);
    }
  }, [form.department_id]);

  async function loadDepartments() {
    try {
      const response = await fetch(`${API_URL}/api/auth/departments`);

      if (!response.ok) {
        throw new Error("Failed to load departments");
      }

      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadPrograms(departmentId) {
    try {
      const response = await fetch(
        `${API_URL}/api/auth/programs?department_id=${departmentId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load programs");
      }

      const data = await response.json();
      setPrograms(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm(current => ({
      ...current,
      [name]: value,
    }));
  }

  function handleRoleChange(e) {
    const newRole = e.target.value;

    setRole(newRole);

    setForm(current => ({
      ...current,
      gender: "",
      date_of_birth: "",
      program_id: "",
      specialization: "",
    }));

    setPrograms([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        role,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirm_password: form.confirm_password,
        department_id: form.department_id,
      };

      if (role === "STUDENT") {
        payload.gender = form.gender;
        payload.date_of_birth = form.date_of_birth;
        payload.program_id = form.program_id;
      }

      if (role === "TEACHER") {
        payload.specialization = form.specialization;
      }

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      navigate("/registration-submitted", {
        state: {
          message: data.message,
          applicationId: data.applicationId,
          status: data.status,
          email: form.email,
          role,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="register-page">
      <div className="register-shell">
        {/* LEFT BRAND PANEL */}
        <aside className="register-brand-panel">
          <div className="brand-header">
            <div className="brand-logo">SH</div>

            <div>
              <div className="brand-name">StudentHub</div>
              <div className="brand-subtitle">Management System</div>
            </div>
          </div>

          <div className="brand-content">
            <span className="brand-badge">UNIVERSITY PLATFORM</span>

            <h2>
              Manage your academic
              <span> journey in one place.</span>
            </h2>

            <p>
              StudentHub connects students, teachers, and administrators through
              a modern academic management platform.
            </p>

            <div className="brand-features">
              <div className="brand-feature">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Academic Management</strong>
                  <span>Courses, grades and attendance</span>
                </div>
              </div>

              <div className="brand-feature">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Secure Access</strong>
                  <span>Role-based account management</span>
                </div>
              </div>

              <div className="brand-feature">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Connected Campus</strong>
                  <span>Everything in one platform</span>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-footer">
            © 2026 StudentHub Management System
          </div>
        </aside>

        {/* RIGHT FORM PANEL */}
        <main className="register-form-panel">
          <div className="register-form-container">
            <div className="mobile-brand">
              <div className="brand-logo">SH</div>
              <div>
                <div className="brand-name">StudentHub</div>
                <div className="brand-subtitle">Management System</div>
              </div>
            </div>

            <div className="form-heading">
              <span className="form-eyebrow">ACCOUNT REGISTRATION</span>

              <h1>Create your account</h1>

              <p>
                Register your StudentHub account to access your academic portal.
              </p>
            </div>

            {/* ALERTS */}
            {message && (
              <div className="register-alert success">
                <span className="alert-icon">✓</span>
                <div>
                  <strong>Registration successful</strong>
                  <p>{message}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="register-alert error">
                <span className="alert-icon">!</span>
                <div>
                  <strong>Registration failed</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              {/* ACCOUNT TYPE */}
              <section className="form-section">
                <div className="section-heading">
                  <div className="section-number">01</div>
                  <div>
                    <h3>Account type</h3>
                    <p>Select the type of account you want to create.</p>
                  </div>
                </div>

                <div className="role-selector">
                  <label
                    className={`role-option ${
                      role === "STUDENT" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="STUDENT"
                      checked={role === "STUDENT"}
                      onChange={handleRoleChange}
                    />

                    <div className="role-icon">S</div>

                    <div className="role-content">
                      <strong>Student</strong>
                      <span>Access courses, grades and attendance</span>
                    </div>

                    <div className="role-check">✓</div>
                  </label>

                  <label
                    className={`role-option ${
                      role === "TEACHER" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="TEACHER"
                      checked={role === "TEACHER"}
                      onChange={handleRoleChange}
                    />

                    <div className="role-icon teacher">T</div>

                    <div className="role-content">
                      <strong>Teacher</strong>
                      <span>Manage courses, grades and attendance</span>
                    </div>

                    <div className="role-check">✓</div>
                  </label>
                </div>
              </section>

              {/* PERSONAL INFORMATION */}
              <section className="form-section">
                <div className="section-heading">
                  <div className="section-number">02</div>

                  <div>
                    <h3>Personal information</h3>
                    <p>Enter your basic account information.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="first_name">First name</label>

                    <input
                      id="first_name"
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="last_name">Last name</label>

                    <input
                      id="last_name"
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="Enter last name"
                      required
                    />
                  </div>

                  <div className="field full">
                    <label htmlFor="email">Email address</label>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      required
                    />
                  </div>

                  <div className="field full">
                    <label htmlFor="phone">
                      Phone number
                      <span className="optional">Optional</span>
                    </label>

                    <input
                      id="phone"
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+251 ..."
                    />
                  </div>

                  {role === "STUDENT" && (
                    <>
                      <div className="field">
                        <label htmlFor="gender">Gender</label>

                        <select
                          id="gender"
                          name="gender"
                          value={form.gender}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select gender</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                      </div>

                      <div className="field">
                        <label htmlFor="date_of_birth">Date of birth</label>

                        <input
                          id="date_of_birth"
                          type="date"
                          name="date_of_birth"
                          value={form.date_of_birth}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* ACADEMIC INFORMATION */}
              <section className="form-section">
                <div className="section-heading">
                  <div className="section-number">03</div>

                  <div>
                    <h3>Academic information</h3>
                    <p>Provide your academic affiliation.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="field full">
                    <label htmlFor="department_id">Department</label>

                    <select
                      id="department_id"
                      name="department_id"
                      value={form.department_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select department</option>

                      {departments.map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {role === "STUDENT" && (
                    <div className="field full">
                      <label htmlFor="program_id">Program</label>

                      <select
                        id="program_id"
                        name="program_id"
                        value={form.program_id}
                        onChange={handleChange}
                        required
                        disabled={!form.department_id}
                      >
                        <option value="">
                          {form.department_id
                            ? "Select program"
                            : "Select department first"}
                        </option>

                        {programs.map(program => (
                          <option key={program.id} value={program.id}>
                            {program.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {role === "TEACHER" && (
                    <div className="field full">
                      <label htmlFor="specialization">Specialization</label>

                      <input
                        id="specialization"
                        type="text"
                        name="specialization"
                        value={form.specialization}
                        onChange={handleChange}
                        placeholder="e.g. Software Engineering"
                        required
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* SECURITY */}
              <section className="form-section">
                <div className="section-heading">
                  <div className="section-number">04</div>

                  <div>
                    <h3>Account security</h3>
                    <p>Create a secure password for your account.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="password">Password</label>

                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="confirm_password">Confirm password</label>

                    <input
                      id="confirm_password"
                      type="password"
                      name="confirm_password"
                      value={form.confirm_password}
                      onChange={handleChange}
                      placeholder="Repeat your password"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* SUBMIT */}
              <div className="form-actions">
                <button
                  type="button"
                  className="back-button"
                  onClick={() => navigate("/login")}
                >
                  ← Back to sign in
                </button>

                <button
                  type="submit"
                  className="register-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>

              <p className="form-note">
                By creating an account, you agree to use StudentHub in
                accordance with your institution's policies.
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
