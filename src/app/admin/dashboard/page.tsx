"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  DollarSign, ClipboardList, UserPlus, Activity, Shield,
  ArrowRight, CheckCircle2, Clock, MapPin, AlertCircle,
  RefreshCw, TrendingUp, BarChart3, Inbox
} from "lucide-react";
import styles from "../admin.module.css";

const statusColorMap: Record<string, string> = {
  COMPLETED: "#10B981",
  WORK_IN_PROGRESS: "#8B5CF6",
  EN_ROUTE: "#0EA5E9",
  ACCEPTED: "#3B82F6",
  ASSIGNED: "#6366F1",
  PENDING: "#F59E0B",
  CANCELLED: "#64748B",
  REFUNDED: "#EF4444",
};

export default function AdminDashboardPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<any>(null);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch("/api/admin/telemetry");
      const data = await res.json();
      if (res.ok && data.success) {
        setTelemetry(data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn("Failed to fetch telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    if (!autoRefresh) return;
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const stats = telemetry?.stats || {
    totalRevenueNgn: 0,
    activeBookingsCount: 0,
    verifiedArtisansCount: 0,
    pendingVerificationsCount: 0,
    openDisputesCount: 0,
    completedJobsCount: 0,
    avgResponseTimeMin: 0,
    totalBookingsAll: 0,
  };

  const kpiStats = [
    { id: "rev", label: "Total Revenue (NGN)", value: `₦${stats.totalRevenueNgn.toLocaleString()}`, change: "Real Database Sum", icon: DollarSign, color: "#10B981", bg: "rgba(16,185,129,0.15)" },
    { id: "active", label: "Active Bookings", value: String(stats.activeBookingsCount), change: "Live In-Flight", icon: ClipboardList, color: "#0EA5E9", bg: "rgba(14,165,233,0.15)" },
    { id: "pros", label: "Verified Artisans", value: String(stats.verifiedArtisansCount), change: `${stats.pendingVerificationsCount} Pending Audit`, icon: Shield, color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
    { id: "disputes", label: "Open Disputes", value: String(stats.openDisputesCount), change: stats.openDisputesCount > 0 ? "Requires Action" : "All Clear", icon: AlertCircle, color: stats.openDisputesCount > 0 ? "#EF4444" : "#10B981", bg: stats.openDisputesCount > 0 ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)" },
    { id: "completed", label: "Completed Jobs", value: String(stats.completedJobsCount), change: `${stats.totalBookingsAll} Total Placed`, icon: CheckCircle2, color: "#10B981", bg: "rgba(16,185,129,0.15)" },
    { id: "response", label: "Avg Pro Response", value: stats.avgResponseTimeMin > 0 ? `${stats.avgResponseTimeMin} mins` : "N/A", change: "Live Metric", icon: Clock, color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  ];

  const bookingStatusBreakdown = telemetry?.bookingStatusBreakdown || [];
  const regionalDistribution = telemetry?.regionalDistribution || [];
  const revenueMonthly = telemetry?.revenueMonthly || [];
  const recentBookings = telemetry?.recentBookings || [];
  const liveActivityFeed = telemetry?.liveActivityFeed || [];

  const maxRev = Math.max(1000, ...revenueMonthly.map((r: any) => r.amount || 0));

  return (
    <AdminLayoutShell>
      {/* Top Header Bar */}
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 className="h3">Production KPI Command Center</h1>
            <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", fontSize: "11px", fontWeight: 700 }}>
              LIVE DATABASE TELEMETRY
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Zero fiction. Live truth calculated directly from Prisma Database. Last synced: {lastUpdated || "Syncing..."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="btn btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} className={autoRefresh ? "spinner" : ""} />
            {autoRefresh ? "Auto-Refresh ON (5s)" : "Auto-Refresh Paused"}
          </button>

          <Link href="/admin/dashboard/analytics" className="btn btn-primary btn-sm">
            <BarChart3 size={14} /> Full Analytics & Export
          </Link>
        </div>
      </header>

      <div className={styles.adminContent}>
        {/* KPI Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          {kpiStats.map((s, idx) => (
            <motion.div
              key={s.id}
              className="card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              style={{ padding: "var(--space-4)", background: "#1E293B", border: "1px solid #334155" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", fontWeight: "var(--fw-medium)" }}>{s.label}</span>
                <div style={{ background: s.bg, color: s.color, padding: 6, borderRadius: 8 }}>
                  <s.icon size={16} />
                </div>
              </div>
              <h3 className="h3" style={{ color: "var(--text-primary)", margin: "4px 0" }}>{s.value}</h3>
              <span style={{ fontSize: "11px", color: s.color, fontWeight: "bold" }}>{s.change}</span>
            </motion.div>
          ))}
        </div>

        {/* Analytics & Live Activity Stream Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
          {/* Revenue Trend Interactive SVG Chart */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "var(--space-5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <div>
                <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Real Production Gross Revenue (2026)</h3>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>Cumulative verified Paystack / gateway payments in NGN</span>
              </div>
              <span style={{ color: "#10B981", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                <TrendingUp size={16} /> Live Escrow Sum
              </span>
            </div>

            <div style={{ height: "200px", display: "flex", alignItems: "flex-end", gap: "16px", padding: "10px 0 0 0" }}>
              {revenueMonthly.map((r: any) => {
                const heightPercent = maxRev > 0 ? Math.round((r.amount / maxRev) * 100) : 0;
                return (
                  <div key={r.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 600 }}>₦{r.amount.toLocaleString()}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(4, heightPercent)}%` }}
                      transition={{ duration: 0.5 }}
                      style={{
                        width: "100%",
                        maxWidth: "40px",
                        background: r.amount > 0 ? "linear-gradient(180deg, #0EA5E9 0%, #0284C7 100%)" : "#334155",
                        borderRadius: "6px 6px 0 0",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#F8FAFC", fontWeight: 600 }}>{r.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Booking Status Breakdown */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "var(--space-5)" }}>
            <h3 className="h4" style={{ margin: "0 0 var(--space-4) 0", color: "#F8FAFC" }}>Live 8-State Booking Counts</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {bookingStatusBreakdown.map((sb: any) => {
                const color = statusColorMap[sb.status] || "#94A3B8";
                return (
                  <div key={sb.status} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "#CBD5E1", fontWeight: 600 }}>{sb.status}</span>
                      <span style={{ color, fontWeight: 700 }}>{sb.count}</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#0F172A", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (sb.count / Math.max(1, stats.totalBookingsAll)) * 100)}%`, height: "100%", background: color, borderRadius: "3px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2-Column Section: Live Bookings Table & Live Audit Stream */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)" }}>
          {/* Active Live Bookings Table */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "var(--space-4)", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 className="h4" style={{ margin: 0 }}>Recent Production Bookings</h3>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>Fetched directly from database</span>
              </div>
              <Link href="/admin/dashboard/bookings" className="btn btn-secondary btn-xs">
                View All Bookings <ArrowRight size={14} />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
                <Inbox size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: "14px" }}>No production bookings in database yet.</p>
                <span style={{ fontSize: "12px", color: "#64748B" }}>Real bookings placed by customers will stream here live.</span>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-sm)" }}>
                <thead>
                  <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                    <th style={{ padding: "var(--space-3) var(--space-4)" }}>Ref</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)" }}>Customer</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)" }}>Service</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)" }}>Artisan</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)" }}>Amount</th>
                    <th style={{ padding: "var(--space-3) var(--space-4)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b: any) => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #334155" }}>
                      <td style={{ padding: "var(--space-3) var(--space-4)", fontFamily: "monospace", color: "#0EA5E9" }}>#{b.id}</td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: "bold" }}>{b.customer}</td>
                      <td style={{ padding: "var(--space-3) var(--space-4)" }}>{b.service}</td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", color: "#CBD5E1" }}>{b.pro}</td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: "bold", color: "#10B981" }}>{b.amount}</td>
                      <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                        <span className="badge" style={{ background: (statusColorMap[b.status] || "#94A3B8") + "25", color: statusColorMap[b.status] || "#94A3B8" }}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Live Activity Feed from AuditLog */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "var(--space-5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <div>
                <h3 className="h4" style={{ margin: 0 }}>Live Audit Log Stream</h3>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>Real-time database events</span>
              </div>
              <Activity size={18} color="#0EA5E9" />
            </div>

            {liveActivityFeed.length === 0 ? (
              <div style={{ padding: "30px 10px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
                No audit log actions recorded yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {liveActivityFeed.map((act: any) => (
                  <div key={act.id} style={{ background: "#0F172A", padding: "10px", borderRadius: "6px", border: "1px solid #334155" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <strong style={{ color: "#0EA5E9" }}>{act.event}</strong>
                      <span style={{ color: "#64748B", fontSize: "10px" }}>{act.time}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginTop: "2px" }}>{act.details}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
