"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, getStoredUser, User, DatePlan, FoodItem, PlanStatus } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";

const TIME_MAP: Record<string, string> = {
  morning: "🌞 Өглөө (09:00)",
  afternoon: "☀️ Өдөр (13:00)",
  evening: "🌅 Орой (18:00)",
  night: "🌙 Шөнө (20:00)",
};

export default function RequestsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<DatePlan[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<"all" | PlanStatus>("all");
  const [search, setSearch] = useState("");

  // Selected Plan for Details Modal
  const [selectedPlan, setSelectedPlan] = useState<DatePlan | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, foodsData] = await Promise.all([api.getPlans(), api.getFoods()]);
      setPlans(plansData);
      setFoods(foodsData);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
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
    setUser(currentUser);
    loadData();
  }, [router]);

  const foodMap = useMemo(() => {
    const map: Record<string, string> = {};
    foods.forEach((f) => {
      map[f._id] = `${f.emoji} ${f.name}`;
    });
    return map;
  }, [foods]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchTab = activeTab === "all" || (p.status || "new") === activeTab;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.date && p.date.toLowerCase().includes(q)) ||
        (p.foodVenue && p.foodVenue.toLowerCase().includes(q));
      return matchTab && matchSearch;
    });
  }, [plans, activeTab, search]);

  const handleStatusChange = async (planId: string, newStatus: PlanStatus) => {
    try {
      const updated = await api.updatePlanStatus(planId, newStatus);
      setPlans((prev) => prev.map((p) => (p._id === planId ? updated : p)));
      if (selectedPlan && selectedPlan._id === planId) {
        setSelectedPlan(updated);
      }
      showToast(`✅ Төлөв солигдлоо: ${newStatus}`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedPlan) return;
    try {
      setSavingNotes(true);
      const updated = await api.updatePlanStatus(selectedPlan._id, selectedPlan.status, editingNotes);
      setPlans((prev) => prev.map((p) => (p._id === selectedPlan._id ? updated : p)));
      setSelectedPlan(updated);
      showToast("💾 Тэмдэглэл хадгалагдлаа!");
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ хүсэлтийг устгах уу?")) return;
    try {
      await api.deletePlan(id);
      setPlans((prev) => prev.filter((p) => p._id !== id));
      if (selectedPlan && selectedPlan._id === id) setSelectedPlan(null);
      showToast("🗑️ Хүсэлт устгагдлаа");
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    }
  };

  const exportToCSV = () => {
    if (plans.length === 0) return alert("Татах дата одоогоор байхгүй байна");
    const headers = ["#", "Name", "Date", "Time", "FoodVenue", "MovieVenue", "Status", "CreatedAt"];
    const rows = plans.map((p, i) => [
      i + 1,
      `"${p.name || ""}"`,
      `"${p.date || ""}"`,
      `"${p.time || ""}"`,
      `"${p.foodVenue || ""}"`,
      `"${p.movieVenue || ""}"`,
      `"${p.status || "new"}"`,
      `"${new Date(p.createdAt).toLocaleString("mn-MN")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `date_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar user={user} />

      <main className="main-wrapper">
        <Header
          title="📋 Болзооны Хүсэлтүүдийн Төв"
          description="Бүх ирсэн захиалгуудыг шүүх, төлөв өөрчлөх болон CSV экспорт хийх."
        >
          <button onClick={exportToCSV} className="btn-glass">
            📥 CSV Татах
          </button>
          <button onClick={loadData} className="btn-cyber">
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

        {/* Requests Table Panel */}
        <section className="glass-card table-panel">
          <div className="table-toolbar">
            <div className="filter-tabs">
              <button onClick={() => setActiveTab("all")} className={`tab-btn ${activeTab === "all" ? "active" : ""}`}>
                Бүгд ({plans.length})
              </button>
              <button onClick={() => setActiveTab("new")} className={`tab-btn ${activeTab === "new" ? "active" : ""}`}>
                Шинэ ({plans.filter((p) => (p.status || "new") === "new").length})
              </button>
              <button onClick={() => setActiveTab("confirmed")} className={`tab-btn ${activeTab === "confirmed" ? "active" : ""}`}>
                Баталгаажсан ({plans.filter((p) => p.status === "confirmed").length})
              </button>
              <button onClick={() => setActiveTab("completed")} className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}>
                Дууссан ({plans.filter((p) => p.status === "completed").length})
              </button>
              <button onClick={() => setActiveTab("cancelled")} className={`tab-btn ${activeTab === "cancelled" ? "active" : ""}`}>
                Цуцлагдсан ({plans.filter((p) => p.status === "cancelled").length})
              </button>
            </div>

            <input
              type="text"
              placeholder="🔍 Хайх (нэр, огноо)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "12px",
                padding: "8px 16px",
                color: "white",
                fontSize: "0.88rem",
                outline: "none",
                maxWidth: "240px",
              }}
            />
          </div>

          <table className="modern-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Нэр</th>
                <th>Огноо</th>
                <th>Цаг</th>
                <th>Хоолны газар</th>
                <th>Кино газар</th>
                <th>Төлөв</th>
                <th style={{ textAlign: "center" }}>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    Ачаалж байна...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Хүсэлт олдсонгүй
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan, idx) => (
                  <tr key={plan._id}>
                    <td style={{ fontWeight: 700, color: "#c084fc" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700, color: "white" }}>{plan.name || "—"}</td>
                    <td>{plan.date || "—"}</td>
                    <td>{TIME_MAP[plan.time] || plan.time || "—"}</td>
                    <td>{plan.foodVenue === "outdoor" ? "🏙️ Гадуур" : plan.foodVenue === "home" ? "🏠 Гэртээ" : "—"}</td>
                    <td>{plan.movieVenue === "outdoor" ? "🎭 Театр" : plan.movieVenue === "home" ? "🛋️ Гэртээ" : "—"}</td>
                    <td>
                      <span className={`status-badge ${plan.status || "new"}`}>
                        ● {plan.status || "new"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button
                        onClick={() => {
                          setSelectedPlan(plan);
                          setEditingNotes(plan.notes || "");
                        }}
                        className="btn-glass"
                        style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                      >
                        👁️ Дэлгэрэнгүй
                      </button>
                      <button onClick={() => handleDelete(plan._id)} className="btn-rose" style={{ padding: "4px 8px" }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Details & Notes Modal */}
        <Modal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          title={`🌸 Болзооны Дэлгэрэнгүй: ${selectedPlan?.name || "Хүсэлт"}`}
        >
          {selectedPlan && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "14px" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Огноо & Цаг</span>
                  <strong>{selectedPlan.date} — {TIME_MAP[selectedPlan.time] || selectedPlan.time}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Төлөв</span>
                  <span className={`status-badge ${selectedPlan.status || "new"}`}>● {selectedPlan.status || "new"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Хоолны Газар</span>
                  <span>{selectedPlan.foodVenue === "outdoor" ? "🏙️ Гадуур" : selectedPlan.foodVenue === "home" ? "🏠 Гэртээ" : "—"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Кино Газар</span>
                  <span>{selectedPlan.movieVenue === "outdoor" ? "🎭 Кино театр" : selectedPlan.movieVenue === "home" ? "🛋️ Гэрийн театр" : "—"}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#c084fc", display: "block", marginBottom: "8px" }}>🍜 Сонгосон Хоолнууд:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedPlan.foods && selectedPlan.foods.length > 0 ? (
                    selectedPlan.foods.map((id) => (
                      <span key={id} style={{ background: "rgba(139, 92, 246, 0.2)", border: "1px solid rgba(139, 92, 246, 0.4)", borderRadius: "8px", padding: "6px 12px", fontSize: "0.85rem" }}>
                        {foodMap[id] || id}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Сонгосон хоол байхгүй</span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#c084fc", display: "block", marginBottom: "8px" }}>⚡ Төлөв Өөрчлөх:</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["new", "confirmed", "completed", "cancelled"] as PlanStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedPlan._id, st)}
                      className={`status-badge ${st}`}
                      style={{ cursor: "pointer", opacity: selectedPlan.status === st ? 1 : 0.5 }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#c084fc", display: "block", marginBottom: "8px" }}>📝 Дотоод Тэмдэглэл (Admin Note):</span>
                <textarea
                  rows={3}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Энд тэмдэглэл бичиж хадгална уу..."
                  style={{
                    width: "100%",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: "12px",
                    padding: "12px",
                    color: "white",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
                <button onClick={handleSaveNotes} className="btn-cyber" style={{ marginTop: "10px", width: "100%", justifyContent: "center" }} disabled={savingNotes}>
                  {savingNotes ? "Хадгалж байна..." : "💾 Тэмдэглэл Хадгалах"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}
