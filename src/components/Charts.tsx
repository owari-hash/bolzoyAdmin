"use client";

import React from "react";
import { AnalyticsData } from "@/lib/api";

interface ChartsProps {
  analytics: AnalyticsData;
}

export const AnalyticsCharts: React.FC<ChartsProps> = ({ analytics }) => {
  const totalTime =
    (analytics.timeDistribution.morning || 0) +
    (analytics.timeDistribution.afternoon || 0) +
    (analytics.timeDistribution.evening || 0) +
    (analytics.timeDistribution.night || 0) || 1;

  const totalFoodVenues =
    (analytics.venueRatio.outdoorFood || 0) + (analytics.venueRatio.homeFood || 0) || 1;

  const totalMovieVenues =
    (analytics.venueRatio.outdoorMovie || 0) + (analytics.venueRatio.homeMovie || 0) || 1;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "32px" }}>
      {/* Time Slots Bar Progress */}
      <div className="glass-card chart-container">
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f3e8ff" }}>⏰ Болзооны Цагийн Хуваарилалт</h3>
        <div className="bar-meter-group">
          <div className="bar-meter-item">
            <div className="bar-meter-label">
              <span>🌞 Өглөө (09:00)</span>
              <span>{analytics.timeDistribution.morning || 0} ({Math.round(((analytics.timeDistribution.morning || 0) / totalTime) * 100)}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill purple" style={{ width: `${((analytics.timeDistribution.morning || 0) / totalTime) * 100}%` }}></div>
            </div>
          </div>

          <div className="bar-meter-item">
            <div className="bar-meter-label">
              <span>☀️ Өдөр (13:00)</span>
              <span>{analytics.timeDistribution.afternoon || 0} ({Math.round(((analytics.timeDistribution.afternoon || 0) / totalTime) * 100)}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill cyan" style={{ width: `${((analytics.timeDistribution.afternoon || 0) / totalTime) * 100}%` }}></div>
            </div>
          </div>

          <div className="bar-meter-item">
            <div className="bar-meter-label">
              <span>🌅 Орой (18:00)</span>
              <span>{analytics.timeDistribution.evening || 0} ({Math.round(((analytics.timeDistribution.evening || 0) / totalTime) * 100)}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill emerald" style={{ width: `${((analytics.timeDistribution.evening || 0) / totalTime) * 100}%` }}></div>
            </div>
          </div>

          <div className="bar-meter-item">
            <div className="bar-meter-label">
              <span>🌙 Шөнө (20:00)</span>
              <span>{analytics.timeDistribution.night || 0} ({Math.round(((analytics.timeDistribution.night || 0) / totalTime) * 100)}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill amber" style={{ width: `${((analytics.timeDistribution.night || 0) / totalTime) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Venue Preference Breakdown */}
      <div className="glass-card chart-container">
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f3e8ff" }}>🏙️ vs 🏠 Газар Сонголтын Харьцаа</h3>
        <div className="bar-meter-group">
          <div className="bar-meter-item">
            <div className="bar-meter-label">
              <span>🍜 Хоол: Гадуур идэх</span>
              <span>{analytics.venueRatio.outdoorFood || 0} ({Math.round(((analytics.venueRatio.outdoorFood || 0) / totalFoodVenues) * 100)}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill amber" style={{ width: `${((analytics.venueRatio.outdoorFood || 0) / totalFoodVenues) * 100}%` }}></div>
            </div>
          </div>

          <div className="bar-meter-item">
            <div className="bar-meter-label">
              <span>🏠 Хоол: Гэртээ идэх</span>
              <span>{analytics.venueRatio.homeFood || 0} ({Math.round(((analytics.venueRatio.homeFood || 0) / totalFoodVenues) * 100)}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill emerald" style={{ width: `${((analytics.venueRatio.homeFood || 0) / totalFoodVenues) * 100}%` }}></div>
            </div>
          </div>

          <div className="bar-meter-item">
            <div className="bar-meter-label">
              <span>🎭 Кино: Театр явах</span>
              <span>{analytics.venueRatio.outdoorMovie || 0} ({Math.round(((analytics.venueRatio.outdoorMovie || 0) / totalMovieVenues) * 100)}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill purple" style={{ width: `${((analytics.venueRatio.outdoorMovie || 0) / totalMovieVenues) * 100}%` }}></div>
            </div>
          </div>

          <div className="bar-meter-item">
            <div className="bar-meter-label">
              <span>🛋️ Кино: Гэрийн театр</span>
              <span>{analytics.venueRatio.homeMovie || 0} ({Math.round(((analytics.venueRatio.homeMovie || 0) / totalMovieVenues) * 100)}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill cyan" style={{ width: `${((analytics.venueRatio.homeMovie || 0) / totalMovieVenues) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Requested Foods Leaderboard */}
      <div className="glass-card chart-container">
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f3e8ff" }}>🔥 Эрэлттэй Сонгогдсон Хоолнууд</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
          {analytics.topFoods.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Дата одоогоор цуглаагүй байна</p>
          ) : (
            analytics.topFoods.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.04)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontWeight: 800, color: "#c084fc", fontSize: "0.9rem" }}>#{idx + 1}</span>
                  <span style={{ fontSize: "1.2rem" }}>{item.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.name}</span>
                </div>
                <span className="badge-status confirmed">{item.count} удаа</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
