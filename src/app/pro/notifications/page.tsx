"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Bell, CheckCircle2, DollarSign, ShieldCheck, Inbox, RefreshCw } from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRealNotifications = async () => {
    setLoading(true);
    let activeUserId = "";

    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
      } catch (err) {}
    }

    try {
      const res = await fetch(`/api/user/profile?userId=${activeUserId}`);
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.warn("Failed to fetch real notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealNotifications();
  }, []);

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="h2">Notifications & Job Alerts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
            Real-time alerts for booking dispatches, escrow payouts, and verification status updates.
          </p>
        </div>
        <button onClick={fetchRealNotifications} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refresh Notifications
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--text-tertiary)" }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="card" style={{ padding: "40px", textAlign: "center", background: "var(--bg-tertiary)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-primary)" }}>
            <Inbox size={40} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 12 }} />
            <h4 className="h4" style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>No Notifications Yet</h4>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-secondary)", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
              Live booking updates, verification approvals, and wallet payout alerts will log here automatically.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="card" style={{ background: n.isRead ? "var(--bg-secondary)" : "rgba(14,165,233,0.06)", borderLeft: n.isRead ? "1px solid var(--border-primary)" : "4px solid #0EA5E9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <strong style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)" }}>{n.title}</strong>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", margin: 0 }}>{n.message}</p>
            </div>
          ))
        )}
      </div>
    </ProLayoutShell>
  );
}
