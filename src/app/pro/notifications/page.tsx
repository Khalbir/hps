"use client";

import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Bell, CheckCircle2, DollarSign, ShieldCheck } from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProNotificationsPage() {
  const notifications = [
    { id: "n1", title: "New Job Offered! 🚀", desc: "Deep Cleaning job in Maitama assigned via Location Intelligence dispatch.", date: "2 hours ago", unread: true },
    { id: "n2", title: "Payment Held in Escrow 🔒", desc: "₦25,000 held in escrow. Payout releases in 24 hours.", date: "Today", unread: false },
    { id: "n3", title: "Verification Approved! 🎉", desc: "Your trade certificate and NIN audit passed. Verified Badge is now active on your profile.", date: "Jul 20, 2026", unread: false },
  ];

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 className="h2">Notifications & Job Alerts</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
          Real-time alerts for booking dispatches, escrow payouts, and verification status updates.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {notifications.map((n) => (
          <div key={n.id} className="card" style={{ background: n.unread ? "rgba(14,165,233,0.06)" : "var(--bg-secondary)", borderLeft: n.unread ? "4px solid #0EA5E9" : "1px solid var(--border-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <strong style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)" }}>{n.title}</strong>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{n.date}</span>
            </div>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", margin: 0 }}>{n.desc}</p>
          </div>
        ))}
      </div>
    </ProLayoutShell>
  );
}
