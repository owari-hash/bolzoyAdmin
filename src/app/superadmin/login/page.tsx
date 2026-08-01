"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getStoredUser } from "@/lib/api";
import Link from "next/link";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user && user.role === "superadmin") {
      router.push("/superadmin");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.loginSuperAdmin(username, password);
      router.push("/superadmin");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Нэвтрэх үед алдаа гарлаа");
      }
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
        padding: "20px",
      }}
    >
      <div className="glass-card" style={{ width: "100%", maxWidth: "420px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "3.2rem", marginBottom: "12px" }}>👑</div>
          <h1
            style={{
              fontSize: "1.9rem",
              fontWeight: 800,
              background: "linear-gradient(90deg, #f472b6, #c084fc, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SuperAdmin
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "6px" }}>Системийн төв удирдлагад нэвтрэх</p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.35)",
              color: "#fb7185",
              borderRadius: "12px",
              padding: "12px",
              fontSize: "0.88rem",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Нэвтрэх нэр</label>
            <input
              type="text"
              placeholder="superadmin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              style={{
                width: "100%",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "12px",
                padding: "12px 16px",
                color: "white",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Нууц үг</label>
            <input
              type="password"
              placeholder="Нууц үг"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "12px",
                padding: "12px 16px",
                color: "white",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>

          <button type="submit" className="btn-cyber" style={{ justifyContent: "center", width: "100%", padding: "14px", marginTop: "8px" }} disabled={loading}>
            {loading ? "Нэвтэрч байна..." : "Нэвтрэх →"}
          </button>
        </form>

        <div style={{ marginTop: "24px", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center" }}>
          Tenant админ уу? <Link href="/login" style={{ color: "#c084fc", textDecoration: "none", fontWeight: 600 }}>Tenant Login</Link>
        </div>
      </div>
    </div>
  );
}
