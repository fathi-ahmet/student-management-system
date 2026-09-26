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

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      // Temporary API call.
      // We will connect this to the backend endpoint in the next step.
      const response = await fetch(
        `${API_URL}/api/auth/registration-status?email=${encodeURIComponent(
          email.trim(),
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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "#ffffff",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
            fontSize: "28px",
            fontWeight: "700",
          }}
        >
          Check Registration Status
        </h1>

        <p
          style={{
            marginBottom: "24px",
            color: "#64748b",
          }}
        >
          Enter the email address you used during registration to check your
          application status.
        </p>

        <form onSubmit={checkStatus}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
            }}
          >
            Email Address
          </label>

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              marginBottom: "16px",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: "600",
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
              padding: "12px",
              borderRadius: "8px",
              background: "#fee2e2",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        {status && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "8px",
              background: "#f1f5f9",
            }}
          >
            <strong>Application Status:</strong> {status.status || "Unknown"}
          </div>
        )}
      </div>
    </div>
  );
}
