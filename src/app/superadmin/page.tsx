"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getStoredUser, User, TenantUser, SuperAdminAnalytics } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";

export default function SuperAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<SuperAdminAnalytics | null>(null);
  const [tenants, setTenants] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Form & Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [resetTenant, setResetTenant] = useState<TenantUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [username, setUsername] = useState("");
  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // QPay Config State
  const [qpayTerminalId, setQpayTerminalId] = useState("95000059");
  const [qpayMerchantId, setQpayMerchantId] = useState("05646a89-8641-4853-812e-7d36676b18e9");
  const [qpayBankCode, setQpayBankCode] = useState("050000");
  const [qpayAccountNumber, setQpayAccountNumber] = useState("5039842709");
  const [qpayAccountName, setQpayAccountName] = useState("Отгонбилэг");
  const [qpayPlanAmount, setQpayPlanAmount] = useState(100);
  const [savingQpay, setSavingQpay] = useState(false);

  // New QPay Merchant Register Form state
  const [isRegisterMerchantModalOpen, setIsRegisterMerchantModalOpen] = useState(false);
  const [mType, setMType] = useState<"person" | "company">("person");
  const [mRegisterNo, setMRegisterNo] = useState("");
  const [mFirstName, setMFirstName] = useState("");
  const [mLastName, setMLastName] = useState("");
  const [mCompanyName, setMCompanyName] = useState("");
  const [mBusinessName, setMBusinessName] = useState("");
  const [mPhone, setMPhone] = useState("95393408");
  const [mEmail, setMEmail] = useState("anzainnnn@gmail.com");
  const [mAddress, setMAddress] = useState("Улаанбаатар");
  const [registeringMerchant, setRegisteringMerchant] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, tenantsData, configData] = await Promise.all([
        api.getSuperAdminAnalytics(),
        api.getTenants(),
        api.getQPayConfig().catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setTenants(tenantsData);
      if (configData) {
        setQpayTerminalId(configData.terminalId || "95000059");
        setQpayMerchantId(configData.merchantId || "465d3e33-4f95-461a-ac1b-c24ab095af0a");
        setQpayBankCode(configData.bankCode || "050000");
        setQpayAccountNumber(configData.accountNumber || "5016271526");
        setQpayAccountName(configData.accountName || "Болзоо Платформ ХХК");
        setQpayPlanAmount(configData.planAmount || 100);
      }
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.push("/superadmin/login");
      return;
    }
    if (currentUser.role !== "superadmin") {
      router.push("/");
      return;
    }
    setUser(currentUser);
    loadData();
  }, [router]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !slug.trim() || !password.trim()) return showToast("Бүх талбарыг бөглөнө үү");
    try {
      setSubmitting(true);
      await api.createTenant(username.trim(), slug.trim().toLowerCase(), password.trim(), displayName.trim());
      showToast("✅ Шинэ Tenant үүсгэгдлээ!");
      setIsCreateModalOpen(false);
      setUsername("");
      setSlug("");
      setDisplayName("");
      setPassword("");
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (tenant: TenantUser) => {
    const nextStatus = tenant.status === "suspended" ? "active" : "suspended";
    try {
      const updated = await api.updateTenant(tenant._id, { status: nextStatus });
      setTenants((prev) => prev.map((t) => (t._id === tenant._id ? updated : t)));
      showToast(`Төлөв: ${updated.status}`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTenant || !newPassword.trim()) return;
    try {
      await api.updateTenant(resetTenant._id, { password: newPassword.trim() });
      showToast(`✅ '${resetTenant.username}' нууц үг шинэчлэгдлээ!`);
      setResetTenant(null);
      setNewPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!confirm(`'${name}' tenant-ийг устгахдаа итгэлтэй байна уу? Түүний бүх дата устгагдана!`)) return;
    try {
      await api.deleteTenant(id);
      setTenants((prev) => prev.filter((t) => t._id !== id));
      showToast("🗑️ Tenant устгагдлаа");
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    }
  };

  const handleSaveQPay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingQpay(true);
      await api.updateQPayConfig({
        terminalId: qpayTerminalId,
        merchantId: qpayMerchantId,
        bankCode: qpayBankCode,
        accountNumber: qpayAccountNumber,
        accountName: qpayAccountName,
        planAmount: Number(qpayPlanAmount),
      });
      showToast("✅ QPay тохиргоо амжилттай хадгалагдлаа!");
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    } finally {
      setSavingQpay(false);
    }
  };

  const handleRegisterMerchantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mRegisterNo.trim() || !mBusinessName.trim() || !mPhone.trim() || !mEmail.trim()) {
      return showToast("❌ Заавал шаардлагатай талбаруудыг бөглөнө үү");
    }

    try {
      setRegisteringMerchant(true);
      const res = await api.registerQPayMerchant({
        type: mType,
        register_number: mRegisterNo.trim(),
        first_name: mFirstName.trim(),
        last_name: mLastName.trim(),
        company_name: mCompanyName.trim(),
        business_name: mBusinessName.trim(),
        address: mAddress.trim(),
        phone: mPhone.trim(),
        email: mEmail.trim(),
      });

      if (res.success && res.merchantId) {
        setQpayMerchantId(res.merchantId);
        showToast(`🎉 Шинэ QPay Мерчант үүсгэгдлээ! ID: ${res.merchantId}`);
        setIsRegisterMerchantModalOpen(false);
        loadData();
      }
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    } finally {
      setRegisteringMerchant(false);
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar user={user} />

      <main className="main-wrapper">
        <Header
          title="👑 SuperAdmin Удирдлагын Төв"
          description="Нийт системийн tenant бүртгэлүүд, сервер холболт ба системийн эрхийн удирдлага."
        >
          <button onClick={() => setIsCreateModalOpen(true)} className="btn-cyber">
            + Шинэ Tenant Үүсгэх
          </button>
          <button onClick={loadData} className="btn-glass">
            🔄 Шинэчлэх
          </button>
        </Header>

        {toast && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "14px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
              zIndex: 100,
              fontWeight: 600,
            }}
          >
            {toast}
          </div>
        )}

        {/* SuperAdmin Metrics */}
        <div className="metrics-grid">
          <div className="glass-card metric-card">
            <div className="metric-icon-wrap purple">🏛️</div>
            <div className="metric-body">
              <span className="metric-value">{analytics?.totalTenants || 0}</span>
              <span className="metric-label">Нийт Tenant</span>
            </div>
          </div>

          <div className="glass-card metric-card">
            <div className="metric-icon-wrap emerald">🟢</div>
            <div className="metric-body">
              <span className="metric-value">{analytics?.activeTenants || 0}</span>
              <span className="metric-label">Идэвхтэй Хэрэглэгч</span>
            </div>
          </div>

          <div className="glass-card metric-card">
            <div className="metric-icon-wrap cyan">📬</div>
            <div className="metric-body">
              <span className="metric-value">{analytics?.totalPlans || 0}</span>
              <span className="metric-label">Системийн Нийт Хүсэлт</span>
            </div>
          </div>

          <div className="glass-card metric-card">
            <div className="metric-icon-wrap pink">🍜</div>
            <div className="metric-body">
              <span className="metric-value">{analytics?.totalFoods || 0}</span>
              <span className="metric-label">Нийт Хоолны Сонголт</span>
            </div>
          </div>
        </div>

        {/* QPay System Configuration */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">💳 QPay Мерчант & Төлбөрийн Тохиргоо</h2>
          </div>

          <form onSubmit={handleSaveQPay} className="glass-panel form-panel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div className="input-group">
              <label className="form-label">Terminal ID</label>
              <input
                type="text"
                className="form-input"
                value={qpayTerminalId}
                onChange={(e) => setQpayTerminalId(e.target.value)}
                placeholder="95000059"
                required
              />
            </div>

            <div className="input-group">
              <label className="form-label">Merchant ID</label>
              <input
                type="text"
                className="form-input"
                value={qpayMerchantId}
                onChange={(e) => setQpayMerchantId(e.target.value)}
                placeholder="05646a89-8641-4853-812e-7d36676b18e9"
                required
              />
            </div>

            <div className="input-group">
              <label className="form-label">Банкны Код</label>
              <input
                type="text"
                className="form-input"
                value={qpayBankCode}
                onChange={(e) => setQpayBankCode(e.target.value)}
                placeholder="050000 (Хаан)"
                required
              />
            </div>

            <div className="input-group">
              <label className="form-label">Дансны Дугаар</label>
              <input
                type="text"
                className="form-input"
                value={qpayAccountNumber}
                onChange={(e) => setQpayAccountNumber(e.target.value)}
                placeholder="5016271526"
                required
              />
            </div>

            <div className="input-group">
              <label className="form-label">Дансны Нэр</label>
              <input
                type="text"
                className="form-input"
                value={qpayAccountName}
                onChange={(e) => setQpayAccountName(e.target.value)}
                placeholder="Болзоо ХХК"
                required
              />
            </div>

            <div className="input-group">
              <label className="form-label">Бүртгэлийн Төлбөр (₮)</label>
              <input
                type="number"
                className="form-input"
                value={qpayPlanAmount}
                onChange={(e) => setQpayPlanAmount(Number(e.target.value))}
                placeholder="100"
                required
              />
            </div>

            <div className="input-group" style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setIsRegisterMerchantModalOpen(true)} className="btn-secondary" style={{ background: "rgba(168,85,247,0.2)", borderColor: "#c084fc", color: "#e9d5ff" }}>
                ➕ Шинэ QPay Мерчант Бүртгэх
              </button>

              <button type="submit" className="btn-cyber" disabled={savingQpay}>
                {savingQpay ? "Хадгалж байна..." : "💾 QPay Тохиргоо Хадгалах"}
              </button>
            </div>
          </form>
        </section>

        {/* Tenants Table */}
        <section className="glass-card table-panel">
          <div className="table-toolbar">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>👥 Хэрэглэгч Tenant-уудын Жагсаалт</h3>
          </div>

          <table className="modern-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Slug (URL)</th>
                <th>Төлөв</th>
                <th>Үүсгэсэн Огноо</th>
                <th style={{ textAlign: "center" }}>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                    Ачаалж байна...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Tenant байхгүй байна
                  </td>
                </tr>
              ) : (
                tenants.map((t, idx) => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 700, color: "#c084fc" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700, color: "white" }}>{t.username}</td>
                    <td>
                      <span className="sidebar-tenant-badge" style={{ fontSize: "0.85rem" }}>@{t.slug}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${t.status === "suspended" ? "cancelled" : "completed"}`}>
                        ● {t.status || "active"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {new Date(t.createdAt).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}
                    </td>
                    <td style={{ textAlign: "center", display: "flex", gap: "6px", justifyContent: "center" }}>
                      <button onClick={() => handleToggleStatus(t)} className="btn-glass" style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
                        {t.status === "suspended" ? "🟢 Идэвхжүүлэх" : "🔴 Хаах"}
                      </button>
                      <button onClick={() => setResetTenant(t)} className="btn-glass" style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
                        🔑 Нууц үг
                      </button>
                      <button onClick={() => handleDeleteTenant(t._id, t.username)} className="btn-rose" style={{ padding: "4px 8px" }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Create Tenant Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="➕ Шинэ Tenant Үүсгэх">
          <form onSubmit={handleCreateTenant} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Username (Нэвтрэх нэр)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Жш: saraa_admin"
                required
                style={{
                  width: "100%",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  color: "white",
                  fontSize: "0.92rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Slug (URL тэмдэгт)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="Жш: saraa"
                required
                style={{
                  width: "100%",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  color: "white",
                  fontSize: "0.92rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Нууц үг</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Нууц үг"
                required
                style={{
                  width: "100%",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  color: "white",
                  fontSize: "0.92rem",
                  outline: "none",
                }}
              />
            </div>

            <button type="submit" className="btn-cyber" style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }} disabled={submitting}>
              {submitting ? "Үүсгэж байна..." : "+ Tenant Үүсгэх"}
            </button>
          </form>
        </Modal>

        {/* Reset Password Modal */}
        <Modal isOpen={!!resetTenant} onClose={() => setResetTenant(null)} title={`🔑 Нууц үг сольж шинэчлэх: ${resetTenant?.username}`}>
          <form onSubmit={handleResetPasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Шинэ Нууц үг</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Шинэ нууц үг оруулна уу"
                required
                style={{
                  width: "100%",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  color: "white",
                  fontSize: "0.92rem",
                  outline: "none",
                }}
              />
            </div>

            <button type="submit" className="btn-cyber" style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }}>
              💾 Нууц үг Хадгалах
            </button>
          </form>
        </Modal>

        {/* Register QPay Merchant Modal */}
        <Modal isOpen={isRegisterMerchantModalOpen} onClose={() => setIsRegisterMerchantModalOpen(false)} title="🏢 Шинэ QPay Мерчант Бүртгэх">
          <form onSubmit={handleRegisterMerchantSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className={`status-badge ${mType === "person" ? "confirmed" : ""}`}
                onClick={() => setMType("person")}
                style={{ flex: 1, padding: "10px", justifyContent: "center", cursor: "pointer", background: mType === "person" ? "rgba(236,72,153,0.3)" : "rgba(255,255,255,0.05)" }}
              >
                👤 Хувь Хүнээр
              </button>
              <button
                type="button"
                className={`status-badge ${mType === "company" ? "confirmed" : ""}`}
                onClick={() => setMType("company")}
                style={{ flex: 1, padding: "10px", justifyContent: "center", cursor: "pointer", background: mType === "company" ? "rgba(236,72,153,0.3)" : "rgba(255,255,255,0.05)" }}
              >
                🏢 Байгууллагаар
              </button>
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>
                Регистрийн Дугаар *
              </label>
              <input
                type="text"
                value={mRegisterNo}
                onChange={(e) => setMRegisterNo(e.target.value)}
                placeholder={mType === "person" ? "Жш: УК98070825" : "Жш: 6691374"}
                required
                style={{ width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "0.9rem" }}
              />
            </div>

            {mType === "person" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Овог</label>
                  <input
                    type="text"
                    value={mLastName}
                    onChange={(e) => setMLastName(e.target.value)}
                    placeholder="Энхтайван"
                    style={{ width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "0.9rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Нэр</label>
                  <input
                    type="text"
                    value={mFirstName}
                    onChange={(e) => setMFirstName(e.target.value)}
                    placeholder="Отгонбилэг"
                    style={{ width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "0.9rem" }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Байгууллагын Нэр</label>
                <input
                  type="text"
                  value={mCompanyName}
                  onChange={(e) => setMCompanyName(e.target.value)}
                  placeholder="Болзоо Платформ ХХК"
                  style={{ width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "0.9rem" }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Бизнесийн Дэлгэцийн Нэр *</label>
              <input
                type="text"
                value={mBusinessName}
                onChange={(e) => setMBusinessName(e.target.value)}
                placeholder="Жш: Болзоо Ресторан"
                required
                style={{ width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "0.9rem" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Утас *</label>
                <input
                  type="text"
                  value={mPhone}
                  onChange={(e) => setMPhone(e.target.value)}
                  placeholder="95393408"
                  required
                  style={{ width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>И-мэйл *</label>
                <input
                  type="email"
                  value={mEmail}
                  onChange={(e) => setMEmail(e.target.value)}
                  placeholder="anzainnnn@gmail.com"
                  required
                  style={{ width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "0.9rem" }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Хаяг</label>
              <input
                type="text"
                value={mAddress}
                onChange={(e) => setMAddress(e.target.value)}
                placeholder="Улаанбаатар"
                style={{ width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "0.9rem" }}
              />
            </div>

            <button type="submit" className="btn-cyber" style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }} disabled={registeringMerchant}>
              {registeringMerchant ? "QPay рүү бүртгэж байна..." : "✨ QPay дээр Шинэ Мерчант Бүртгэх"}
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
}
