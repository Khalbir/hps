"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  TrendingUp, DollarSign, UserPlus, Activity, ClipboardList, Shield,
  ArrowRight, CheckCircle2, Clock, MapPin,
} from "lucide-react";
import styles from "../admin.module.css";

const stats = [
  { label: "Total Revenue", value: "₦4.2M", icon: DollarSign, change: "+12.5%", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  { label: "Active Bookings", value: "47", icon: ClipboardList, change: "+8", color: "#0EA5E9", bg: "rgba(14,165,233,0.15)" },
  { label: "New Users (30d)", value: "182", icon: UserPlus, change: "+23%", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  { label: "Pending Verifications", value: "3", icon: Shield, change: "Review now", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  { label: "System Health", value: "99.8%", icon: Activity, change: "Operational", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
];

const recentBookings = [
  { id: "HHP-M1K9X", customer: "Amina Ibrahim", service: "Deep Cleaning", pro: "Blessing O.", status: "IN_PROGRESS", amount: "₦25,000", date: "Today" },
  { id: "HHP-N2L0Y", customer: "Chidi Okonkwo", service: "Electrical Repairs", pro: "Abubakar T.", status: "CONFIRMED", amount: "₦15,000", date: "Today" },
  { id: "HHP-O3M1Z", customer: "Fatima Yusuf", service: "AC Installation", pro: "Yusuf A.", status: "PENDING", amount: "₦15,000", date: "Tomorrow" },
  { id: "HHP-P4N2A", customer: "David Adekunle", service: "Plumbing", pro: "Ibrahim M.", status: "COMPLETED", amount: "₦10,000", date: "Jul 17" },
];

const pendingPros = [
  { name: "Emeka Uzor", service: "Electrical", applied: "2 hours ago", score: "100%" },
  { name: "Aisha Bello", service: "Cleaning", applied: "1 day ago", score: "80%" },
  { name: "Tunde Bakare", service: "Plumbing", applied: "5 hours ago", score: "100%" },
];

export default function AdminDashboardPage() {
  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">System Administration Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Welcome back, Administrator. Real-time platform metrics and checkmate audits.
          </p>
        </div>
      </header>

      <div className={styles.adminContent}>
        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          {stats.map((s, idx) => (
            <motion.div
              key={s.label}
              className="card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{ padding: "var(--space-4)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", fontWeight: "var(--fw-medium)" }}>{s.label}</span>
                <div style={{ background: s.bg, color: s.color, padding: 6, borderRadius: 8 }}>
                  <s.icon size={16} />
                </div>
              </div>
              <h3 className="h3" style={{ color: "var(--text-primary)", margin: 0 }}>{s.value}</h3>
              <span style={{ fontSize: "11px", color: s.color, fontWeight: "bold" }}>{s.change}</span>
            </motion.div>
          ))}
        </div>

        {/* 2-Column Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)" }}>
          {/* Recent Bookings Card */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="h4">Recent Active Bookings</h3>
              <Link href="/admin/dashboard/bookings" className="btn btn-secondary btn-xs">
                View All Bookings <ArrowRight size={14} />
              </Link>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-sm)" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Ref</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Customer</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Service</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Pro</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Amount</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontFamily: "monospace" }}>{b.id}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: "bold" }}>{b.customer}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>{b.service}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>{b.pro}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: "bold", color: "var(--color-primary-400)" }}>{b.amount}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <span className="badge" style={{ background: b.status === "COMPLETED" ? "rgba(16,185,129,0.15)" : b.status === "IN_PROGRESS" ? "rgba(139,92,246,0.15)" : "rgba(245,158,11,0.15)", color: b.status === "COMPLETED" ? "#10B981" : b.status === "IN_PROGRESS" ? "#8B5CF6" : "#F59E0B" }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pending Pro Verifications */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <h3 className="h4">Pending Pro Audits</h3>
              <Link href="/admin/dashboard/professionals" className="btn btn-primary btn-xs">
                Audit Panel
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {pendingPros.map((p) => (
                <div key={p.name} style={{ background: "var(--bg-tertiary)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-primary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <strong style={{ fontSize: "var(--fs-sm)" }}>{p.name}</strong>
                    <span style={{ fontSize: "11px", color: "#10B981", fontWeight: "bold" }}>Score: {p.score}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                    <span>Field: {p.service}</span>
                    <span>{p.applied}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
