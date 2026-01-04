import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

const ResetPassword = () => {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr(""); setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", { token, password });
      setMsg(res.data?.message || "Password reset successful");
      setTimeout(()=>navigate("/login"), 900);
    } catch (error) {
      setErr(error.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Reset password</h2>
        {msg && <div style={{padding:10, background:"#e7f7ee", marginBottom:10}}>{msg}</div>}
        {err && <div className="auth-error">{err}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Reset token</label>
            <input
              value={token}
              onChange={(e)=>setToken(e.target.value)}
              required
              placeholder="Paste token from email"
            />
          </div>
          <div className="form-group">
            <label>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
              placeholder="Enter new password"
            />
          </div>
          <button className="auth-button" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;