"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, api } from "@/lib/api";

interface SidebarProps {
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    api.logout();
    if (user?.role === "superadmin") {
      router.push("/superadmin/login");
    } else {
      router.push("/login");
    }
  };

  const isSuperAdmin = user?.role === "superadmin";

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand-icon">{isSuperAdmin ? "👑" : "💖"}</div>
        <div className="sidebar-brand-title">
          <span>{isSuperAdmin ? "SuperAdmin" : "Болзоо Admin"}</span>
          <span className="sidebar-tenant-badge">
            {isSuperAdmin ? "System Control" : user?.slug ? `@${user.slug}` : "portal"}
          </span>
        </div>
      </div>

      <ul className="nav-list">
        {!isSuperAdmin ? (
          <>
            <li>
              <Link href="/" className={`nav-item-link ${pathname === "/" ? "active" : ""}`}>
                <span className="nav-icon">📊</span>
                <span className="nav-text">Хяналтын самбар</span>
              </Link>
            </li>
            <li>
              <Link href="/requests" className={`nav-item-link ${pathname === "/requests" ? "active" : ""}`}>
                <span className="nav-icon">📋</span>
                <span className="nav-text">Болзооны хүсэлтүүд</span>
              </Link>
            </li>
            <li>
              <Link href="/foods" className={`nav-item-link ${pathname === "/foods" ? "active" : ""}`}>
                <span className="nav-icon">🍜</span>
                <span className="nav-text">Хоолны цэс</span>
              </Link>
            </li>
            <li>
              <Link href="/analytics" className={`nav-item-link ${pathname === "/analytics" ? "active" : ""}`}>
                <span className="nav-icon">📈</span>
                <span className="nav-text">Дата дата</span>
              </Link>
            </li>
            <li>
              <Link href="/settings" className={`nav-item-link ${pathname === "/settings" ? "active" : ""}`}>
                <span className="nav-icon">⚙️</span>
                <span className="nav-text">Тохиргоо</span>
              </Link>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link href="/superadmin" className={`nav-item-link ${pathname === "/superadmin" ? "active" : ""}`}>
                <span className="nav-icon">🏛️</span>
                <span className="nav-text">Tenant Удирдлага</span>
              </Link>
            </li>
          </>
        )}
      </ul>

      <div className="sidebar-footer">
        {user && (
          <div className="user-card-sm">
            <div className="user-avatar-sm">{user.username.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name-sm">{user.displayName || user.username}</span>
              <span className="user-role-sm">{isSuperAdmin ? "SuperAdmin" : `Tenant: ${user.slug}`}</span>
            </div>
          </div>
        )}

        <button onClick={handleLogout} className="btn-rose" style={{ width: "100%", justifyContent: "center" }}>
          🚪 Гарах
        </button>
      </div>
    </aside>
  );
};
