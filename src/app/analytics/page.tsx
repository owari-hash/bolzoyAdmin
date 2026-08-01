"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getStoredUser, User, AnalyticsData } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AnalyticsCharts } from "@/components/Charts";

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    api
      .getAnalytics()
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, [router]);

  if (!user) return null;

  const total = analytics?.totalPlans || 1;
  const confirmedCount = analytics?.statusCounts.confirmed || 0;
  const completedCount = analytics?.statusCounts.completed || 0;
  const cancelledCount = analytics?.statusCounts.cancelled || 0;
  const newCount = analytics?.statusCounts.new || 0;

  const successRate = Math.round(((confirmedCount + completedCount) / total) * 100);

  return (
    <div className="dashboard-layout">
      <Sidebar user={user} />

      <main className="main-wrapper">
        <Header
          title="📈 Дата & Аналитик Анализ"
          description="Хэрэглэгчдийн дата хандлага, цагийн ба байршлын сонголтуудын нарийвчилсан статистик."
        />

        {loading ? (
          <p style={{ color: "var(--text-muted)", padding: "40px" }}>Ачаалж байна...</p>
        ) : (
          <>
            {/* Overview Summary */}
            <div className="metrics-grid">
              <div className="glass-card metric-card">
                <div className="metric-icon-wrap emerald">🎯</div>
                <div className="metric-body">
                  <span className="metric-value">{successRate}%</span>
                  <span className="metric-label">Амжилттай Болзооны Хувь</span>
                </div>
              </div>

              <div className="glass-card metric-card">
                <div className="metric-icon-wrap cyan">✨</div>
                <div className="metric-body">
                  <span className="metric-value">{newCount}</span>
                  <span className="metric-label">Шинэ Хүлээгдэж Буй</span>
                </div>
              </div>

              <div className="glass-card metric-card">
                <div className="metric-icon-wrap purple">💜</div>
                <div className="metric-body">
                  <span className="metric-value">{confirmedCount + completedCount}</span>
                  <span className="metric-label">Баталгаажсан / Биелсэн</span>
                </div>
              </div>

              <div className="glass-card metric-card">
                <div className="metric-icon-wrap pink">❌</div>
                <div className="metric-body">
                  <span className="metric-value">{cancelledCount}</span>
                  <span className="metric-label">Цуцлагдсан Хүсэлтүүд</span>
                </div>
              </div>
            </div>

            {/* Visual Charts Component */}
            {analytics && <AnalyticsCharts analytics={analytics} />}
          </>
        )}
      </main>
    </div>
  );
}
