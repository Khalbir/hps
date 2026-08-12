"use client";

import React from "react";
import { ShieldCheck, MapPin, Award, Lock, AlertTriangle } from "lucide-react";

export interface TrustBadgeProps {
  type: "ADDRESS_VERIFIED" | "IDENTITY_VERIFIED" | "ARTISAN_VERIFIED" | "HIGH_RISK_GATED" | "PENDING";
  label?: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

export function TrustBadge({ type, label, size = "md", showTooltip = true }: TrustBadgeProps) {
  let badgeConfig = {
    bg: "rgba(16,185,129,0.12)",
    color: "#10B981",
    border: "1px solid rgba(16,185,129,0.3)",
    icon: ShieldCheck,
    defaultLabel: "Verified Address",
    tooltip: "Permanent address document verified by HandyHub Compliance.",
  };

  if (type === "IDENTITY_VERIFIED") {
    badgeConfig = {
      bg: "rgba(14,165,233,0.12)",
      color: "#0EA5E9",
      border: "1px solid rgba(14,165,233,0.3)",
      icon: MapPin,
      defaultLabel: "Identity Verified",
      tooltip: "Government ID / NIN matched and verified.",
    };
  } else if (type === "ARTISAN_VERIFIED") {
    badgeConfig = {
      bg: "rgba(245,158,11,0.12)",
      color: "#F59E0B",
      border: "1px solid rgba(245,158,11,0.3)",
      icon: Award,
      defaultLabel: "Verified Artisan",
      tooltip: "Trade certification, background check, and address verified.",
    };
  } else if (type === "HIGH_RISK_GATED") {
    badgeConfig = {
      bg: "rgba(239,68,68,0.12)",
      color: "#EF4444",
      border: "1px solid rgba(239,68,68,0.3)",
      icon: Lock,
      defaultLabel: "High-Risk Service • Verification Required",
      tooltip: "High-risk services require verified permanent address before confirmation.",
    };
  } else if (type === "PENDING") {
    badgeConfig = {
      bg: "rgba(245,158,11,0.12)",
      color: "#F59E0B",
      border: "1px solid rgba(245,158,11,0.3)",
      icon: AlertTriangle,
      defaultLabel: "Verification Pending ⏳",
      tooltip: "Document uploaded and currently being audited by compliance (ETA < 24 hrs).",
    };
  }

  const IconComp = badgeConfig.icon;
  const padding = size === "sm" ? "2px 8px" : size === "lg" ? "6px 14px" : "4px 10px";
  const fontSize = size === "sm" ? "11px" : size === "lg" ? "14px" : "12px";
  const iconSize = size === "sm" ? 12 : size === "lg" ? 16 : 14;

  return (
    <span
      title={showTooltip ? badgeConfig.tooltip : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding,
        borderRadius: "20px",
        background: badgeConfig.bg,
        color: badgeConfig.color,
        border: badgeConfig.border,
        fontSize,
        fontWeight: 600,
        letterSpacing: "0.2px",
        cursor: showTooltip ? "help" : "default",
        whiteSpace: "nowrap",
        transition: "all 0.2s ease",
      }}
    >
      <IconComp size={iconSize} />
      {label || badgeConfig.defaultLabel}
    </span>
  );
}
