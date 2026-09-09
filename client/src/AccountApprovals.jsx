import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

export default function AccountApprovals() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(null);

  async function loadPendingUsers() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("sms_token");

      const response = await fetch(
        `${API_URL}/api/admin/pending-registrations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load pending accounts.");
      }

      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPendingUsers();
  }, []);

  async function handleAction(id, action) {
    const actionName = action === "approve" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionName} this account?`,
    );

    if (!confirmed) return;

    try {
      setProcessing(id);
      setError("");

      const token = localStorage.getItem("sms_token");

      const response = await fetch(
        `${API_URL}/api/admin/users/${id}/${actionName}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Action failed.");
      }

      // Remove the processed account from the list
      setUsers(current => current.filter(user => user.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="page-card">
        <h1>Account Approvals</h1>
        <p>Loading pending registrations...</p>
      </div>
    );
  }

  return (
    <div className="page-card">
      <div className="page-header">
        <div>
          <h1>Account Approvals</h1>
          <p>Review and approve student and teacher registrations.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {users.length === 0 ? (
        <div className="empty-state">
          <h3>No pending registrations</h3>
          <p>There are currently no accounts waiting for approval.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Institutional ID</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>

                  <td>{user.email}</td>

                  <td>
                    <span className="status-badge">{user.role}</span>
                  </td>

                  <td>{user.department_name || "—"}</td>

                  <td>{user.institutional_id || "—"}</td>

                  <td>{new Date(user.created_at).toLocaleDateString()}</td>

                  <td>
                    <div className="action-buttons">
                      <button
                        type="button"
                        onClick={() => handleAction(user.id, "approve")}
                        disabled={processing === user.id}
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction(user.id, "reject")}
                        disabled={processing === user.id}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
