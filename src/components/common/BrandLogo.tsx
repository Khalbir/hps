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
    sm: 38,
    md: 48,
    lg: 64,
  };

  const fontSizes = {
    sm: "1.1rem",
    md: "1.3rem",
    lg: "1.65rem",
  };

  const proBadges = {
    sm: { font: "0.55rem", padding: "1px 5px" },
    md: { font: "0.65rem", padding: "2px 6px" },
    lg: { font: "0.75rem", padding: "3px 8px" },
  };

  const dimension = iconSizes[size];

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }} className={className}>
      {/* Official Transparent Logo Image */}
      <img
        src="/logo.png"
        alt="HandyHub Pro Solutions Logo"
        style={{
          width: dimension,
          height: dimension,
          objectFit: "contain",
          flexShrink: 0,
          filter: "drop-shadow(0 2px 8px rgba(0, 168, 181, 0.25))",
        }}
      />

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
            Handy<span style={{ color: "#00A8B5" }}>Hub</span>
          </span>
          <span
            style={{
              fontFamily: "var(--font-display, inherit)",
              fontSize: proBadges[size].font,
              fontWeight: 800,
              background: "linear-gradient(135deg, #00A8B5 0%, #FF6B00 100%)",
              color: "#FFFFFF",
              padding: proBadges[size].padding,
              borderRadius: "6px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              boxShadow: "0 2px 10px rgba(255, 107, 0, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
            }}
          >
            PRO
          </span>
        </div>
      )}
    </div>
  );
}
