"use client";

import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  lightText?: boolean;
}

export function BrandLogo({ size = "md", showText = true, className = "", lightText = false }: BrandLogoProps) {
  const iconSizes = {
    sm: 30,
    md: 38,
    lg: 48,
  };

  const fontSizes = {
    sm: "1.05rem",
    md: "1.25rem",
    lg: "1.6rem",
  };

  const proBadges = {
    sm: { font: "0.55rem", padding: "1px 5px" },
    md: { font: "0.65rem", padding: "2px 6px" },
    lg: { font: "0.75rem", padding: "3px 8px" },
  };

  const dimension = iconSizes[size];

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }} className={className}>
      {/* Sleek Emblem Container with Soft Glowing Gradient */}
      <div
        style={{
          width: dimension,
          height: dimension,
          borderRadius: size === "lg" ? "14px" : "10px",
          background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle Shine Accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)",
            borderRadius: "inherit",
          }}
        />
        {/* Clean Vector House & Wrench Icon */}
        <svg
          width={dimension * 0.58}
          height={dimension * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* House Roof & Body */}
          <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20V9.5z" />
          {/* Wrench inside */}
          <path d="M14.7 13.3l-3.2 3.2a1.5 1.5 0 01-2.1-2.1l3.2-3.2" />
          <path d="M14.5 10.5a1.5 1.5 0 102.1 2.1" />
        </svg>
      </div>

      {showText && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", lineHeight: 1 }}>
          <span
            style={{
              fontFamily: "var(--font-display, inherit)",
              fontSize: fontSizes[size],
              fontWeight: 800,
              color: lightText ? "#F8FAFC" : "var(--text-primary, #0F172A)",
              letterSpacing: "-0.02em",
            }}
          >
            HandyHub
          </span>
          <span
            style={{
              fontFamily: "var(--font-display, inherit)",
              fontSize: proBadges[size].font,
              fontWeight: 800,
              background: "linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)",
              color: "#FFFFFF",
              padding: proBadges[size].padding,
              borderRadius: "5px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              boxShadow: "0 2px 6px rgba(14, 165, 233, 0.25)",
            }}
          >
            PRO
          </span>
        </div>
      )}
    </div>
  );
}
