"use client";

import React from "react";

interface HeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, description, children }) => {
  return (
    <header className="top-header">
      <div className="header-title-wrap">
        <h1 className="header-page-title">{title}</h1>
        {description && <p className="header-page-desc">{description}</p>}
      </div>

      {children && <div className="header-actions">{children}</div>}
    </header>
  );
};
