import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);

    try {
      const res = await api.post("/auth/request-password-reset", { email });
      setMsg(res.data?.message || "If the email exists, a reset token has been sent.");

      // ✅ redirect to reset page
      setTimeout(() => navigate("/reset-password"), 600);
    } catch (error) {
      setErr(error.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Forgot password</h2>

        {msg && (
          <div style={{ padding: 10, background: "#e7f7ee", marginBottom: 10 }}>
            {msg}
          </div>
        )}
        {err && <div className="auth-error">{err}</div>}

        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your registered email"
            />
          </div>

          <button className="auth-button" disabled={loading}>
            {loading ? "Sending..." : "Send reset token"}
          </button>
        </form>

        <p className="auth-footer">
          Already have a reset token? <a href="/reset-password">Reset password</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;