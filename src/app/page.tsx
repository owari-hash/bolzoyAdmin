"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getStoredUser, User, DatePlan, AnalyticsData, PlanStatus } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AnalyticsCharts } from "@/components/Charts";

const TIME_MAP: Record<string, string> = {
  morning: "🌞 Өглөө (09:00)",
  afternoon: "☀️ Өдөр (13:00)",
  evening: "🌅 Орой (18:00)",
  night: "🌙 Шөнө (20:00)",
};

export default function OverviewDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentPlans, setRecentPlans] = useState<DatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, plansRes] = await Promise.all([
        api.getAnalytics(),
        api.getPlans(),
      ]);
      setAnalytics(analyticsRes);
      setRecentPlans(plansRes.slice(0, 8)); // latest 8
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`❌ ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (currentUser.role === "superadmin") {
      router.push("/superadmin");
      return;
    }
    setUser(currentUser);
    loadData();
  }, [router]);

  const handleStatusChange = async (planId: string, newStatus: PlanStatus) => {
    try {
      const updated = await api.updatePlanStatus(planId, newStatus);
      setRecentPlans((prev) => prev.map((p) => (p._id === planId ? updated : p)));
      showToast(`✅ Төлөв солигдлоо: ${newStatus}`);
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar user={user} />

      <main className="main-wrapper">
        <Header
          title="✨ Хяналтын Самбар"
          description={`Тавтай морилно уу, @${user.slug}! Өнөөдрийн болзооны захиалгын статистик ба хяналт.`}
        >
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

        {/* Top Metric Cards */}
        <div className="metrics-grid">
          <div className="glass-card metric-card">
            <div className="metric-icon-wrap purple">📬</div>
            <div className="metric-body">
              <span className="metric-value">{analytics?.totalPlans || 0}</span>
              <span className="metric-label">Нийт ирсэн хүсэлт</span>
            </div>
          </div>

          <div className="glass-card metric-card">
            <div className="metric-icon-wrap cyan">⚡</div>
            <div className="metric-body">
              <span className="metric-value">{analytics?.statusCounts.new || 0}</span>
              <span className="metric-label">Шинэ хүлээгдэж буй</span>
            </div>
          </div>

          <div className="glass-card metric-card">
            <div className="metric-icon-wrap emerald">✅</div>
            <div className="metric-body">
              <span className="metric-value">{analytics?.statusCounts.confirmed || 0}</span>
              <span className="metric-label">Баталгаажсан болзоо</span>
            </div>
          </div>

          <div className="glass-card metric-card">
            <div className="metric-icon-wrap pink">🍜</div>
            <div className="metric-body">
              <span className="metric-value">{analytics?.totalFoods || 0}</span>
              <span className="metric-label">Идэвхтэй хоолны цэс</span>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        {analytics && <AnalyticsCharts analytics={analytics} />}

        {/* Recent Activity Table */}
        <section className="glass-card table-panel">
          <div className="table-toolbar">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>⚡ Сүүлд Ирсэн Захиалгууд</h3>
            <button onClick={() => router.push("/requests")} className="btn-cyber" style={{ fontSize: "0.82rem", padding: "8px 16px" }}>
              Бүх хүсэлтийг харах →
            </button>
          </div>

          <table className="modern-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Нэр</th>
                <th>Огноо & Цаг</th>
                <th>Хоолны газар</th>
                <th>Кино газар</th>
                <th>Төлөв</th>
                <th style={{ textAlign: "center" }}>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    Ачаалж байна...
                  </td>
                </tr>
              ) : recentPlans.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Одоогоор хүсэлт ирээгүй байна
                  </td>
                </tr>
              ) : (
                recentPlans.map((plan, idx) => (
                  <tr key={plan._id}>
                    <td style={{ fontWeight: 700, color: "#c084fc" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700, color: "white" }}>{plan.name || "—"}</td>
                    <td>
                      <div>{plan.date || "—"}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{TIME_MAP[plan.time] || plan.time}</div>
                    </td>
                    <td>{plan.foodVenue === "outdoor" ? "🏙️ Гадуур" : plan.foodVenue === "home" ? "🏠 Гэртээ" : "—"}</td>
                    <td>{plan.movieVenue === "outdoor" ? "🎭 Театр" : plan.movieVenue === "home" ? "🛋️ Гэртээ" : "—"}</td>
                    <td>
                      <span className={`status-badge ${plan.status || "new"}`}>
                        ● {plan.status || "new"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <select
                        value={plan.status || "new"}
                        onChange={(e) => handleStatusChange(plan._id, e.target.value as PlanStatus)}
                        style={{
                          background: "rgba(15, 23, 42, 0.8)",
                          border: "1px solid rgba(139, 92, 246, 0.3)",
                          color: "white",
                          borderRadius: "8px",
                          padding: "4px 8px",
                          fontSize: "0.8rem",
                          outline: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="new">new</option>
                        <option value="confirmed">confirmed</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
