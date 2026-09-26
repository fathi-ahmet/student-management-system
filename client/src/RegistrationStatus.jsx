import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./RegistrationStatus.css";

const API_URL = "http://localhost:5000/api";

export default function RegistrationStatus() {
  const location = useLocation();
  const navigate = useNavigate();

  const [applicationId, setApplicationId] = useState(
    location.state?.applicationId || "",
  );
  const [email, setEmail] = useState(location.state?.email || "");
  const [status, setStatus] = useState(location.state?.status || "");
  const [rejectionReason, setRejectionReason] = useState(
    location.state?.rejectionReason || "",
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load saved registration information if the page is refreshed
  useEffect(() => {
    const savedApplication = localStorage.getItem("sms_registration");

    if (savedApplication) {
      try {
        const data = JSON.parse(savedApplication);

        setApplicationId(current => current || data.applicationId || "");
        setEmail(current => current || data.email || "");
        setStatus(current => current || data.status || "");
        setRejectionReason(current => current || data.rejectionReason || "");
      } catch (err) {
        console.error("Could not read saved registration:", err);
      }
    }
  }, []);

  // Save the latest registration information
  useEffect(() => {
    if (!applicationId && !email) return;

    localStorage.setItem(
      "sms_registration",
      JSON.stringify({
        applicationId,
        email,
        status,
        rejectionReason,
      }),
    );
  }, [applicationId, email, status, rejectionReason]);

  const checkStatus = async () => {
    if (!applicationId && !email) {
      setError("Please provide your application ID or email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const params = new URLSearchParams();

      if (applicationId) {
        params.append("application_id", applicationId);
      }

      if (email) {
        params.append("email", email);
      }

      const response = await fetch(
        `${API_URL}/auth/registration-status?${params.toString()}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to retrieve registration status.",
        );
      }

      setApplicationId(data.applicationId || applicationId);
      setEmail(data.email || email);
      setStatus(data.status || "");
      setRejectionReason(data.rejectionReason || "");

      setMessage("Registration status updated.");
    } catch (err) {
      console.error("Registration status error:", err);
      setError(err.message || "Unable to retrieve registration status.");
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = () => {
    navigate("/register", {
      state: {
        resubmission: true,
        applicationId,
        email,
      },
    });
  };

  const clearStatus = () => {
    localStorage.removeItem("sms_registration");

    setApplicationId("");
    setEmail("");
    setStatus("");
    setRejectionReason("");
    setMessage("");
    setError("");
  };

  const getStatusClass = () => {
    switch (status) {
      case "APPROVED":
        return "status-approved";

      case "REJECTED":
        return "status-rejected";

      case "PENDING":
        return "status-pending";

      default:
        return "";
    }
  };

  return (
    <div className="registration-status-page">
      <div className="registration-status-card">
        <div className="registration-status-header">
          <div className="brand-mark">SH</div>

          <h1>Registration Status</h1>

          <p>
            Check the current status of your StudentHub registration
            application.
          </p>
        </div>

        <div className="registration-status-form">
          <div className="form-group">
            <label htmlFor="applicationId">Application ID</label>

            <input
              id="applicationId"
              type="text"
              value={applicationId}
              onChange={e => setApplicationId(e.target.value)}
              placeholder="Enter your application ID"
            />
          </div>

          <div className="form-divider">
            <span>OR</span>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your registration email"
            />
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={checkStatus}
            disabled={loading}
          >
            {loading ? "Checking..." : "Check Status"}
          </button>
        </div>

        {message && <div className="success-message">{message}</div>}

        {error && <div className="error-message">{error}</div>}

        {status && (
          <div className="status-result">
            <div className="result-header">
              <h2>Application Details</h2>

              <span className={`status-badge ${getStatusClass()}`}>
                {status}
              </span>
            </div>

            <div className="application-details">
              <div className="detail-row">
                <span>Application ID</span>
                <strong>{applicationId || "—"}</strong>
              </div>

              <div className="detail-row">
                <span>Email</span>
                <strong>{email || "—"}</strong>
              </div>

              <div className="detail-row">
                <span>Status</span>
                <strong>{status}</strong>
              </div>
            </div>

            {status === "PENDING" && (
              <div className="status-information pending-information">
                <h3>Application Under Review</h3>

                <p>
                  Your registration has been submitted successfully and is
                  waiting for administrator approval.
                </p>

                <p>You cannot log in until your account has been approved.</p>
              </div>
            )}

            {status === "APPROVED" && (
              <div className="status-information approved-information">
                <h3>Application Approved</h3>

                <p>
                  Your registration has been approved. You can now log in to
                  StudentHub using your registered account.
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigate("/login")}
                >
                  Go to Login
                </button>
              </div>
            )}

            {status === "REJECTED" && (
              <div className="status-information rejected-information">
                <h3>Application Rejected</h3>

                <p>Your registration application was not approved.</p>

                {rejectionReason && (
                  <div className="rejection-reason">
                    <strong>Reason for rejection</strong>
                    <p>{rejectionReason}</p>
                  </div>
                )}

                <button
                  type="button"
                  className="primary-button"
                  onClick={handleResubmit}
                >
                  Resubmit Application
                </button>
              </div>
            )}
          </div>
        )}

        <div className="registration-status-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/register")}
          >
            Back to Registration
          </button>

          {(applicationId || email) && (
            <button type="button" className="text-button" onClick={clearStatus}>
              Clear Saved Information
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
