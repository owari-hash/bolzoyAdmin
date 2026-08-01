"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, getStoredUser, User, FoodItem } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";

export default function FoodsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState<"all" | "outdoor" | "home">("all");
  const [search, setSearch] = useState("");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);

  // Form Fields
  const [emoji, setEmoji] = useState("🍽️");
  const [name, setName] = useState("");
  const [type, setType] = useState<"outdoor" | "home">("outdoor");
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadFoods = async () => {
    try {
      setLoading(true);
      const data = await api.getFoods();
      setFoods(data);
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
    loadFoods();
  }, [router]);

  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchType = typeFilter === "all" || f.type === typeFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || f.name.toLowerCase().includes(q) || (f.category && f.category.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [foods, typeFilter, search]);

  const resetForm = () => {
    setEmoji("🍽️");
    setName("");
    setType("outdoor");
    setPrice(0);
    setCategory("General");
    setEditingFood(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: FoodItem) => {
    setEditingFood(item);
    setEmoji(item.emoji || "🍽️");
    setName(item.name);
    setType(item.type);
    setPrice(item.price || 0);
    setCategory(item.category || "General");
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return showToast("Хоолны нэр оруулна уу");
    try {
      setSubmitting(true);
      if (editingFood) {
        const updated = await api.updateFood(editingFood._id, {
          emoji: emoji || "🍽️",
          name: name.trim(),
          type,
          price,
          category,
        });
        setFoods((prev) => prev.map((f) => (f._id === editingFood._id ? updated : f)));
        showToast("✅ Хоол шинэчлэгдлээ!");
        setEditingFood(null);
      } else {
        const newItem = await api.addFood(emoji || "🍽️", name.trim(), type, price, category);
        setFoods((prev) => [newItem, ...prev]);
        showToast("✅ Хоол нэмэгдлээ!");
        setIsAddModalOpen(false);
      }
      resetForm();
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: FoodItem) => {
    try {
      const updated = await api.updateFood(item._id, { isActive: !item.isActive });
      setFoods((prev) => prev.map((f) => (f._id === item._id ? updated : f)));
      showToast(`Төлөв: ${updated.isActive ? "Идэвхтэй" : "Идэвхгүй"}`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(`❌ ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Устгах уу?")) return;
    try {
      await api.deleteFood(id);
      setFoods((prev) => prev.filter((f) => f._id !== id));
      showToast("🗑️ Устгагдлаа");
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
          title="🍜 Хоолны Цэс Удирдах"
          description="Болзоонд санал болгох хоолны сонголтуудыг нэмэх, засах болон идэвхгүй болгох."
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setViewMode("grid")} className={`btn-glass ${viewMode === "grid" ? "active" : ""}`}>
              📱 Grid
            </button>
            <button onClick={() => setViewMode("table")} className={`btn-glass ${viewMode === "table" ? "active" : ""}`}>
              📑 Table
            </button>
          </div>
          <button onClick={handleOpenAdd} className="btn-cyber">
            + Шинэ Хоол Нэмэх
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

        {/* Filter Toolbar */}
        <section className="glass-card table-panel" style={{ marginBottom: "24px" }}>
          <div className="table-toolbar">
            <div className="filter-tabs">
              <button onClick={() => setTypeFilter("all")} className={`tab-btn ${typeFilter === "all" ? "active" : ""}`}>
                Бүгд ({foods.length})
              </button>
              <button onClick={() => setTypeFilter("outdoor")} className={`tab-btn ${typeFilter === "outdoor" ? "active" : ""}`}>
                🏙️ Гадуур идэх ({foods.filter((f) => f.type === "outdoor").length})
              </button>
              <button onClick={() => setTypeFilter("home")} className={`tab-btn ${typeFilter === "home" ? "active" : ""}`}>
                🏠 Гэртээ идэх ({foods.filter((f) => f.type === "home").length})
              </button>
            </div>

            <input
              type="text"
              placeholder="🔍 Хайх..."
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

          {/* Grid View */}
          {viewMode === "grid" ? (
            <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "18px" }}>
              {loading ? (
                <p style={{ color: "var(--text-muted)", gridColumn: "1 / -1", textAlign: "center" }}>Ачаалж байна...</p>
              ) : filteredFoods.length === 0 ? (
                <p style={{ color: "var(--text-muted)", gridColumn: "1 / -1", textAlign: "center" }}>Хоол олдсонгүй</p>
              ) : (
                filteredFoods.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      background: item.isActive !== false ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: "12px",
                      opacity: item.isActive !== false ? 1 : 0.5,
                      transition: "transform 0.2s, border-color 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "3rem", lineHeight: 1 }}>{item.emoji}</div>
                    <div>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "white" }}>{item.name}</h4>
                      <span className={`status-badge ${item.type === "outdoor" ? "confirmed" : "completed"}`} style={{ marginTop: "6px" }}>
                        {item.type === "outdoor" ? "🏙️ Гадуур" : "🏠 Гэртээ"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                      <button onClick={() => handleToggleActive(item)} className="btn-glass" style={{ padding: "4px 8px", fontSize: "0.78rem" }}>
                        {item.isActive !== false ? "🟢 Идэвхтэй" : "⚪ Идэвхгүй"}
                      </button>
                      <button onClick={() => handleOpenEdit(item)} className="btn-glass" style={{ padding: "4px 8px", fontSize: "0.78rem" }}>
                        ✏️ Засах
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="btn-rose" style={{ padding: "4px 8px" }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Table View */
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Emoji</th>
                  <th>Нэр</th>
                  <th>Төрөл</th>
                  <th>Төлөв</th>
                  <th style={{ textAlign: "center" }}>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filteredFoods.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontSize: "1.5rem" }}>{item.emoji}</td>
                    <td style={{ fontWeight: 700, color: "white" }}>{item.name}</td>
                    <td>
                      <span className={`status-badge ${item.type === "outdoor" ? "confirmed" : "completed"}`}>
                        {item.type === "outdoor" ? "🏙️ Гадуур" : "🏠 Гэртээ"}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: item.isActive !== false ? "#34d399" : "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>
                        {item.isActive !== false ? "🟢 Идэвхтэй" : "⚪ Идэвхгүй"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", display: "flex", gap: "6px", justifyContent: "center" }}>
                      <button onClick={() => handleToggleActive(item)} className="btn-glass" style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
                        Төлөв
                      </button>
                      <button onClick={() => handleOpenEdit(item)} className="btn-glass" style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
                        ✏️ Засах
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="btn-rose" style={{ padding: "4px 8px" }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isAddModalOpen || !!editingFood}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingFood(null);
          }}
          title={editingFood ? `✏️ Хоол Засах: ${editingFood.name}` : "➕ Шинэ Хоол Нэмэх"}
        >
          <form onSubmit={handleSaveFood} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: "0 0 100px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Emoji</label>
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="🍕"
                  maxLength={4}
                  style={{
                    width: "100%",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: "12px",
                    padding: "10px",
                    color: "white",
                    fontSize: "1.2rem",
                    textAlign: "center",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Хоолны Нэр</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Жш: Рамен, Суши, Пицца"
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
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c084fc", textTransform: "uppercase" }}>Төрөл</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "outdoor" | "home")}
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
              >
                <option value="outdoor">🏙️ Гадуур идэх</option>
                <option value="home">🏠 Гэртээ идэх</option>
              </select>
            </div>

            <button type="submit" className="btn-cyber" style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }} disabled={submitting}>
              {submitting ? "Хадгалж байна..." : editingFood ? "💾 Өөрчлөлтийг Хадгалах" : "+ Хоол Нэмэх"}
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
}
