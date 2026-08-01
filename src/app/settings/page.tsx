"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, getStoredUser, User, QPayInvoiceResponse } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // QPay Modal State
  const [qpayInvoice, setQpayInvoice] = useState<QPayInvoiceResponse | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentPaid, setPaymentPaid] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
  }, [router]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleStartQPay = async () => {
    if (!user) return;
    setInvoiceError("");
    setLoadingInvoice(true);
    try {
      const invoiceData = await api.createQPayInvoice(user.username);
      setQpayInvoice(invoiceData);
      startAutoPolling(invoiceData.invoiceId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setInvoiceError(err.message);
      } else {
        setInvoiceError("QPay Нэхэмжлэх үүсгэхэд алдаа гарлаа");
      }
    } finally {
      setLoadingInvoice(false);
    }
  };

  const startAutoPolling = (invoiceId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.checkQPayPayment(invoiceId);
        if (res.paid) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPaymentPaid(true);
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
  };

  const handleManualCheck = async (isDemoConfirm = false) => {
    if (!qpayInvoice) return;
    try {
      setCheckingPayment(true);
      const res = await api.checkQPayPayment(qpayInvoice.invoiceId, isDemoConfirm);
      if (res.paid) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setPaymentPaid(true);
      } else {
        alert("Төлбөр хараахан тохироогүй байна.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setCheckingPayment(false);
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar user={user} />

      <main className="main-wrapper">
        <Header
          title="⚙️ Системийн Тохиргоо"
          description="Хэрэглэгчийн мэдээлэл, QPay төлбөрийн идэвхжүүлэлт болон интеграцийн тохиргоо."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {/* Profile Card */}
          <div className="glass-card" style={{ padding: "28px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "18px" }}>👤 Хэрэглэгчийн Профайл</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Нэвтрэх нэр</span>
                <strong style={{ fontSize: "1rem" }}>{user.username}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Tenant Slug</span>
                <span className="sidebar-tenant-badge" style={{ fontSize: "0.9rem" }}>@{user.slug}</span>
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Эрхийн Түвшин</span>
                <span className="status-badge confirmed">● {user.role}</span>
              </div>
            </div>
          </div>

          {/* QPay Subscription & Payment Card */}
          <div className="glass-card" style={{ padding: "28px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "18px" }}>💳 QPay Төлбөр & Идэвхжүүлэлт</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Бүртгэлийн Төлөв</span>
                <span className="status-badge confirmed">
                  ● Идэвхтэй Хэрэглэгч
                </span>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                Болзоо платформ дээрх нэмэлт боломж болон сарын эрхээ QPay-ээр сунгах эсвэл төлбөр төлөх боломжтой.
              </p>

              {invoiceError && (
                <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.35)", color: "#fb7185", borderRadius: "10px", padding: "10px", fontSize: "0.82rem" }}>
                  ❌ {invoiceError}
                </div>
              )}

              <button
                onClick={handleStartQPay}
                className="btn-pink"
                style={{ marginTop: "8px", padding: "12px 20px", width: "100%", justifyContent: "center" }}
                disabled={loadingInvoice}
              >
                {loadingInvoice ? "QPay Нэхэмжлэх Бэлтгэж байна..." : "💳 QPay-ээр Төлбөр Төлөх"}
              </button>
            </div>
          </div>

          {/* API Integration Details */}
          <div className="glass-card" style={{ padding: "28px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "18px" }}>🔗 Интеграци & API Сүлжээ</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Backend API Server</span>
                <code style={{ color: "#38bdf8", fontSize: "0.9rem" }}>http://103.236.194.106:9000</code>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Frontend Booking URL</span>
                <code style={{ color: "#c084fc", fontSize: "0.9rem" }}>http://103.236.194.106:9000/proposal/{user.slug}</code>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                <span style={{ fontSize: "0.85rem", color: "#34d399", fontWeight: 600 }}>API Холболт Идэвхтэй</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* QPay Payment Modal */}
      {qpayInvoice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3, 7, 18, 0.88)",
            backdropFilter: "blur(20px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "28px",
              textAlign: "center",
              borderRadius: "32px",
              border: "1px solid rgba(244, 114, 182, 0.35)",
              background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.9))",
              boxShadow: "0 25px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(236, 72, 153, 0.2)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Ambient Glow */}
            <div
              style={{
                position: "absolute",
                top: "-60px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "200px",
                height: "200px",
                background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(0,0,0,0) 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(236, 72, 153, 0.4)",
                  }}
                >
                  <span style={{ fontSize: "1.1rem", color: "white" }}>💳</span>
                </div>
                <div style={{ textAlign: "left" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "white", lineHeight: 1.2 }}>
                    QPay Төлбөр Төлөх
                  </h3>
                  <span style={{ fontSize: "0.72rem", color: "#ec4899", fontWeight: 700, letterSpacing: "0.5px" }}>
                    ● LIVE PAYMENT
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setQpayInvoice(null);
                  if (pollingRef.current) clearInterval(pollingRef.current);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#94a3b8",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {paymentPaid ? (
              <div style={{ padding: "36px 16px" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    boxShadow: "0 0 35px rgba(16, 185, 129, 0.6)",
                    fontSize: "2.4rem",
                    color: "white",
                  }}
                >
                  ✓
                </div>
                <h4 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#34d399", marginBottom: "8px" }}>
                  ТӨЛБОР АМЖИЛТТАЙ ТӨЛӨГДЛӨӨ!
                </h4>
                <p style={{ color: "#94a3b8", fontSize: "0.88rem" }}>
                  Таны төлбөр баталгаажлаа. Баярлалаа!
                </p>
                <button
                  onClick={() => setQpayInvoice(null)}
                  className="btn-pink"
                  style={{ marginTop: "16px", width: "100%", justifyContent: "center" }}
                >
                  Болов
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
                {/* Amount Badge */}
                <div
                  style={{
                    background: "rgba(236, 72, 153, 0.08)",
                    padding: "14px 20px",
                    borderRadius: "18px",
                    border: "1px solid rgba(236, 72, 153, 0.25)",
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <span style={{ fontSize: "0.74rem", color: "#94a3b8", fontWeight: 600, display: "block", textTransform: "uppercase" }}>
                      Төлөх Дүн
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                      Сунгалтын Эрх / Төлбөр
                    </span>
                  </div>
                  <strong style={{ fontSize: "1.65rem", color: "#f472b6", fontWeight: 900, textShadow: "0 0 15px rgba(244, 114, 182, 0.4)" }}>
                    {qpayInvoice.amount ? qpayInvoice.amount.toLocaleString() : "100"} ₮
                  </strong>
                </div>

                {/* QR Code Container */}
                <div
                  style={{
                    position: "relative",
                    background: "white",
                    padding: "16px",
                    borderRadius: "24px",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(236, 72, 153, 0.25)",
                    border: "3px solid #ec4899",
                  }}
                >
                  {qpayInvoice.qrImage ? (
                    <img
                      src={`data:image/png;base64,${qpayInvoice.qrImage}`}
                      alt="QPay QR Code"
                      style={{ width: "175px", height: "175px", display: "block", borderRadius: "10px" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "175px",
                        height: "175px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f8fafc",
                        borderRadius: "10px",
                      }}
                    >
                      <span style={{ color: "#0f172a", fontWeight: 800, fontSize: "0.85rem" }}>[QPay Quick QR]</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#ec4899" }} />
                  <p style={{ fontSize: "0.78rem", color: "#cbd5e1", fontWeight: 500, margin: 0 }}>
                    QR кодыг банкны апп-аараа уншуулах эсвэл доорх банкийг сонгоно уу:
                  </p>
                </div>

                {/* Bank Links with Logos */}
                {qpayInvoice.urls && qpayInvoice.urls.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      width: "100%",
                      maxHeight: "155px",
                      overflowY: "auto",
                      paddingRight: "2px",
                    }}
                  >
                    {qpayInvoice.urls.map((bank, i) => (
                      <a
                        key={i}
                        href={bank.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "12px",
                          padding: "8px 10px",
                          textDecoration: "none",
                          color: "white",
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {bank.logo ? (
                          <img src={bank.logo} alt={bank.name} style={{ width: "20px", height: "20px", borderRadius: "5px", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: "0.9rem" }}>🏦</span>
                        )}
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {bank.description || bank.name}
                        </span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: "4px" }}>
                  <button
                    onClick={() => handleManualCheck(false)}
                    className="btn-pink"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "11px",
                      fontSize: "0.9rem",
                      boxShadow: "0 4px 20px rgba(236, 72, 153, 0.4)",
                    }}
                    disabled={checkingPayment}
                  >
                    {checkingPayment ? "Шалгаж байна..." : "🔄 Төлбөр Баталгаажуулах"}
                  </button>

                  <button
                    onClick={() => handleManualCheck(true)}
                    className="btn-secondary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      fontSize: "0.78rem",
                      padding: "8px",
                      borderColor: "rgba(52, 211, 153, 0.4)",
                      color: "#34d399",
                      background: "rgba(16, 185, 129, 0.08)",
                    }}
                  >
                    ⚡ (Demo) Төлбөр Төлөгдсөнөөр Шалгах
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
