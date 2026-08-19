"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Bell, CheckCircle2, DollarSign, ShieldCheck, Inbox, RefreshCw, Briefcase, ArrowRight, Check } from "lucide-react";

export default function ProNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  const fetchRealNotifications = async () => {
    setLoading(true);
    let activeUserId = "";
    let activeEmail = "";

    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
        if (parsed?.user?.email || parsed?.email) activeEmail = parsed.user?.email || parsed.email;
        setUserId(activeUserId);
      } catch (err) {}
    }

    try {
      const res = await fetch(`/api/pro/notifications?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}&_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn("Failed to fetch real notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await fetch("/api/pro/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_ALL_READ", userId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  useEffect(() => {
    fetchRealNotifications();
    const interval = setInterval(fetchRealNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (n: any) => {
    if (n.type === "PAYMENT") return <DollarSign size={18} color="#10B981" />;
    if (n.type === "VERIFICATION") return <ShieldCheck size={18} color="#8B5CF6" />;
    if (n.title.includes("Assigned") || n.type === "BOOKING") return <Briefcase size={18} color="#0EA5E9" />;
    return <Bell size={18} color="#F59E0B" />;
  };

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 className="h2">Notifications & Job Alerts</h1>
            {unreadCount > 0 && (
              <span className="badge" style={{ background: "#EF4444", color: "#FFFFFF", fontWeight: 800 }}>
                {unreadCount} New
              </span>
            )}
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
            Real-time alerts for booking dispatches, client acceptance requests, and escrow payouts.
          </p>
        </div>
        
        <div style={{ display: "flex", gap: 8 }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={14} /> Mark All Read
            </button>
          )}
          <button onClick={fetchRealNotifications} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {loading && notifications.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--text-tertiary)" }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="card" style={{ padding: "40px", textAlign: "center", background: "var(--bg-tertiary)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-primary)" }}>
            <Inbox size={40} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 12 }} />
            <h4 className="h4" style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>No Notifications Yet</h4>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-secondary)", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
              Live booking assignment alerts, client acceptances, and wallet payout confirmations will log here automatically.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const isJobDispatch = n.title.includes("Assigned") || n.type === "BOOKING" || n.jobAction === "ACCEPT_REQUIRED";
            return (
              <div
                key={n.id}
                className="card"
                style={{
                  background: n.isRead ? "var(--bg-secondary)" : "rgba(14,165,233,0.08)",
                  borderLeft: n.isRead ? "1px solid var(--border-primary)" : "4px solid #0EA5E9",
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ background: "var(--bg-tertiary)", padding: 6, borderRadius: 8, display: "flex" }}>
                      {getIcon(n)}
                    </div>
                    <strong style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)" }}>{n.title}</strong>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                    {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", margin: "0 0 10px 0", lineHeight: 1.5 }}>
                  {n.message}
                </p>

                {isJobDispatch && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <Link
                      href="/pro/jobs"
                      className="btn btn-primary btn-xs"
                      style={{
                        background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        textDecoration: "none",
                      }}
                    >
                      ⚡ View & Accept Job Dispatch <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </ProLayoutShell>
  );
}
