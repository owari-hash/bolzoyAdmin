"use client";

import React from "react";
import { User, api } from "@/lib/api";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  title?: string;
  badge?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, title = "Болзоо Admin", badge }) => {
  return (
    <nav className="glass-panel navbar">
      <div className="brand-logo">
        <div className="brand-icon">💖</div>
        <div className="brand-title">
          {title}
          {badge && <span className="badge-slug">{badge}</span>}
        </div>
      </div>

      <div className="user-menu">
        {user && (
          <div className="user-info">
            <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
            <span>{user.username}</span>
          </div>
        )}
        <button onClick={onLogout} className="btn-danger">
          🚪 Гарах
        </button>
      </div>
    </nav>
  );
};
