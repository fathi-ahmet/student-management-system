import React, { useState } from "react";

const API_URL = "http://localhost:5000";

export default function RegistrationStatus() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkStatus = async e => {
    e.preventDefault();

    setError("");
    setStatus(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/registration-status?email=${encodeURIComponent(
          trimmedEmail,
        )}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to check registration status.");
      }

      setStatus(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = currentStatus => {
    switch (currentStatus) {
      case "PENDING":
        return "Your registration has been submitted and is waiting for administrator approval.";

      case "ACTIVE":
        return "Your registration has been approved. Your account is now active.";

      case "REJECTED":
        return "Your registration application was rejected. You may resubmit your registration.";

      default:
        return "The current registration status could not be determined.";
    }
  };

  const getStatusColor = currentStatus => {
    switch (currentStatus) {
      case "PENDING":
        return {
          background: "#fef3c7",
          color: "#92400e",
          border: "#f59e0b",
        };

      case "ACTIVE":
        return {
          background: "#dcfce7",
          color: "#166534",
          border: "#22c55e",
        };

      case "REJECTED":
        return {
          background: "#fee2e2",
          color: "#991b1b",
          border: "#ef4444",
        };

      default:
        return {
          background: "#f1f5f9",
          color: "#334155",
          border: "#cbd5e1",
        };
    }
  };

  const formatDate = date => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString();
  };

  const statusStyle = status
    ? getStatusColor(status.status)
    : getStatusColor("");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        background: "#f8fafc",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "#ffffff",
          padding: "36px",
          borderRadius: "18px",
          boxShadow: "0 12px 35px rgba(15, 23, 42, 0.08)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "30px",
              fontWeight: "700",
              color: "#0f172a",
            }}
          >
            Check Registration Status
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              lineHeight: "1.6",
            }}
          >
            Enter the email address you used during registration to view your
            application status.
          </p>
        </div>

        <form onSubmit={checkStatus}>
          <label
            htmlFor="registration-email"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            Email Address
          </label>

          <input
            id="registration-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your registration email"
            autoComplete="email"
            style={{
              width: "100%",
              padding: "13px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: "9px",
              marginBottom: "14px",
              boxSizing: "border-box",
              fontSize: "15px",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "9px",
              background: loading ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Checking..." : "Check Status"}
          </button>
        </form>

        {error && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px 16px",
              borderRadius: "9px",
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              lineHeight: "1.5",
            }}
          >
            {error}
          </div>
        )}

        {status && (
          <div
            style={{
              marginTop: "28px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            {/* Status header */}
            <div
              style={{
                padding: "18px 20px",
                background: statusStyle.background,
                borderBottom: `1px solid ${statusStyle.border}`,
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: statusStyle.color,
                  marginBottom: "5px",
                }}
              >
                APPLICATION STATUS
              </div>

              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: statusStyle.color,
                }}
              >
                {status.status || "UNKNOWN"}
              </div>

              <p
                style={{
                  margin: "8px 0 0",
                  color: statusStyle.color,
                  lineHeight: "1.5",
                  fontSize: "14px",
                }}
              >
                {getStatusMessage(status.status)}
              </p>
            </div>

            {/* Registration details */}
            <div style={{ padding: "20px" }}>
              <h2
                style={{
                  margin: "0 0 16px",
                  fontSize: "18px",
                  color: "#0f172a",
                }}
              >
                Registration Details
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "14px",
                }}
              >
                <DetailRow label="Name" value={status.name} />

                <DetailRow label="Email" value={status.email} />

                <DetailRow label="Role" value={status.role} />

                <DetailRow
                  label="Application ID"
                  value={status.applicationId}
                />

                <DetailRow label="Department" value={status.department} />

                {status.role === "STUDENT" && (
                  <DetailRow label="Program" value={status.program} />
                )}

                <DetailRow
                  label="Submitted"
                  value={formatDate(status.submittedAt)}
                />
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "13px",
            color: "#94a3b8",
          }}
        >
          StudentHub Registration Portal
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        paddingBottom: "12px",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span
        style={{
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: "#0f172a",
          fontSize: "14px",
          fontWeight: "600",
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value || "Not available"}
      </span>
    </div>
  );
}
