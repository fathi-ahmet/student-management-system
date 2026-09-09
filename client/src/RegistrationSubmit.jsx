import "./RegistrationSubmit.css";

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function RegistrationSubmit() {
  const navigate = useNavigate();
  const location = useLocation();

  const { message, applicationId, status, email, role } = location.state || {};

  return (
    <div className="registration-submit-page">
      <div className="registration-submit-shell">
        {/* LEFT BRAND PANEL */}
        <aside className="registration-submit-brand">
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
              Your academic
              <span> journey starts here.</span>
            </h2>

            <p>
              StudentHub connects students, teachers, and administrators through
              a modern academic management platform.
            </p>

            <div className="brand-features">
              <div className="brand-feature">
                <div className="feature-icon">✓</div>

                <div>
                  <strong>Secure Registration</strong>
                  <span>Your information is securely submitted</span>
                </div>
              </div>

              <div className="brand-feature">
                <div className="feature-icon">✓</div>

                <div>
                  <strong>Account Review</strong>
                  <span>Your institution will review your request</span>
                </div>
              </div>

              <div className="brand-feature">
                <div className="feature-icon">✓</div>

                <div>
                  <strong>Academic Access</strong>
                  <span>Access StudentHub after approval</span>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-footer">
            © 2026 StudentHub Management System
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="registration-submit-content">
          <div className="registration-submit-card">
            <div className="success-icon">✓</div>

            <span className="submit-eyebrow">REGISTRATION SUBMITTED</span>

            <h1>Application received</h1>

            <p className="submit-description">
              Your registration request has been successfully submitted. Your
              account is now awaiting approval from your institution.
            </p>

            {/* STATUS */}
            <div className="application-status">
              <div className="status-indicator">
                <span className="status-dot"></span>

                <div>
                  <span className="status-label">APPLICATION STATUS</span>

                  <strong>{status || "PENDING"}</strong>
                </div>
              </div>
            </div>

            {/* APPLICATION DETAILS */}
            <div className="application-details">
              {applicationId && (
                <div className="detail-row">
                  <span>Application ID</span>
                  <strong>{applicationId}</strong>
                </div>
              )}

              {email && (
                <div className="detail-row">
                  <span>Email address</span>
                  <strong>{email}</strong>
                </div>
              )}

              {role && (
                <div className="detail-row">
                  <span>Account type</span>
                  <strong>{role === "STUDENT" ? "Student" : "Teacher"}</strong>
                </div>
              )}
            </div>

            {/* MESSAGE FROM BACKEND */}
            {message && (
              <div className="submit-message">
                <span className="message-icon">i</span>

                <p>{message}</p>
              </div>
            )}

            <div className="next-step">
              <h3>What happens next?</h3>

              <p>
                Your registration will be reviewed by an authorized
                administrator. Once your account is approved, you will be able
                to sign in and access StudentHub.
              </p>
            </div>

            <button
              className="submit-login-button"
              onClick={() => navigate("/login")}
            >
              <span>Return to sign in</span>
              <span>←</span>
            </button>

            <p className="submit-note">
              Keep your registration information available in case your
              institution needs to contact you.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
