"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, ClipboardList, CreditCard, Star,
  Settings, Shield, BarChart3, Tag, Bell, LogOut, Menu, X,
  TrendingUp, TrendingDown, DollarSign, UserPlus, Activity,
  ArrowRight,
} from "lucide-react";
import styles from "../admin.module.css";

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/bookings", label: "Bookings", icon: ClipboardList, badge: 5 },
  { href: "/admin/dashboard/users", label: "Users", icon: Users },
  { href: "/admin/dashboard/professionals", label: "Professionals", icon: Shield, badge: 3 },
  { href: "/admin/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/admin/dashboard/promo-codes", label: "Promo Codes", icon: Tag },
  { href: "/admin/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/dashboard/settings", label: "Settings", icon: Settings },
];

const stats = [
  { label: "Total Revenue", value: "₦4.2M", icon: DollarSign, change: "+12.5%", up: true, color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  { label: "Active Bookings", value: "47", icon: ClipboardList, change: "+8", up: true, color: "#0EA5E9", bg: "rgba(14,165,233,0.15)" },
  { label: "New Users (30d)", value: "182", icon: UserPlus, change: "+23%", up: true, color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  { label: "Pending Verifications", value: "3", icon: Shield, change: "Review now", up: false, color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  { label: "System Health", value: "99.8%", icon: Activity, change: "Operational", up: true, color: "#10B981", bg: "rgba(16,185,129,0.15)" },
];

const recentBookings = [
  { id: "HHP-M1K9X", customer: "Amina Ibrahim", service: "Deep Cleaning", pro: "Blessing O.", status: "IN_PROGRESS", amount: "₦25,000", date: "Today" },
  { id: "HHP-N2L0Y", customer: "Chidi Okonkwo", service: "Electrical Repairs", pro: "Abubakar T.", status: "CONFIRMED", amount: "₦15,000", date: "Today" },
  { id: "HHP-O3M1Z", customer: "Fatima Yusuf", service: "AC Installation", pro: "Yusuf A.", status: "PENDING", amount: "₦15,000", date: "Tomorrow" },
  { id: "HHP-P4N2A", customer: "David Adekunle", service: "Plumbing", pro: "Ibrahim M.", status: "COMPLETED", amount: "₦10,000", date: "Jul 17" },
  { id: "HHP-Q5O3B", customer: "Grace Nwosu", service: "Painting", pro: "Ngozi N.", status: "COMPLETED", amount: "₦20,000", date: "Jul 16" },
];

const pendingPros = [
  { name: "Emeka Uzor", service: "Electrical", applied: "2 days ago", docs: "3/4" },
  { name: "Aisha Bello", service: "Cleaning", applied: "1 day ago", docs: "4/4" },
  { name: "Tunde Bakare", service: "Plumbing", applied: "5 hours ago", docs: "2/4" },
];

const statusColors: Record<string, string> = {
  PENDING: "#F59E0B",
  CONFIRMED: "#3B82F6",
  IN_PROGRESS: "#8B5CF6",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
};

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.adminDashLayout}>
      {sidebarOpen && (
        <div className={styles.adminOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.adminSidebar} ${sidebarOpen ? styles.adminSidebarOpen : ""}`}>
        <div className={styles.adminSidebarHeader}>
          <Link href="/admin/dashboard" className={styles.adminLogo}>
            <Shield size={24} />
            <div>
              <span>HandyHub</span>
              <span>Admin</span>
            </div>
          </Link>
          <button
            className={styles.adminMenuBtn}
            onClick={() => setSidebarOpen(false)}
            style={{ display: sidebarOpen ? "block" : undefined }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.adminNav}>
          {adminNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.adminNavLink} ${link.href === "/admin/dashboard" ? styles.adminNavLinkActive : ""}`}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
              {link.badge && <span className={styles.adminNavBadge}>{link.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className={styles.adminSidebarFooter}>
          <Link href="/admin" className={styles.adminNavLink}>
            <LogOut size={18} />
            <span>Log Out</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.adminMain}>
        <header className={styles.adminTopBar}>
          <div className={styles.adminTopLeft}>
            <button className={styles.adminMenuBtn} onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div>
              <h1 className={styles.adminGreeting}>Dashboard Overview</h1>
              <p className={styles.adminGreetingSub}>Welcome back, Administrator</p>
            </div>
          </div>
        </header>

        <div className={styles.adminContent}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--space-4)" }}>
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className={styles.adminStatCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className={styles.adminStatIcon} style={{ background: stat.bg, color: stat.color }}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <span className={styles.adminStatValue}>{stat.value}</span>
                  <span className={styles.adminStatLabel}>{stat.label}</span>
                  <span className={styles.adminStatChange} style={{ color: stat.up ? "#10B981" : stat.color }}>
                    {stat.up && <TrendingUp size={12} style={{ display: "inline", marginRight: 4 }} />}
                    {stat.change}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent Bookings & Pending Pros */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)" }}>
            {/* Recent Bookings */}
            <div className={styles.adminTableCard}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-lg)", fontWeight: "var(--fw-semibold)", color: "white" }}>
                  Recent Bookings
                </h2>
                <Link href="/admin/dashboard/bookings" style={{ color: "var(--color-primary-400)", fontSize: "var(--fs-sm)", display: "flex", alignItems: "center", gap: "4px" }}>
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Professional</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "white" }}>{b.id}</td>
                        <td style={{ color: "white" }}>{b.customer}</td>
                        <td>{b.service}</td>
                        <td>{b.pro}</td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "white" }}>{b.amount}</td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "2px 10px",
                              borderRadius: "var(--radius-full)",
                              fontSize: "var(--fs-xs)",
                              fontWeight: "var(--fw-semibold)",
                              color: statusColors[b.status],
                              background: `${statusColors[b.status]}15`,
                            }}
                          >
                            {b.status.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Verifications */}
            <div className={styles.adminTableCard}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-lg)", fontWeight: "var(--fw-semibold)", color: "white", marginBottom: "var(--space-5)" }}>
                Pending Verifications
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {pendingPros.map((pro) => (
                  <div
                    key={pro.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-4)",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div>
                      <div style={{ color: "white", fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)" }}>{pro.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "var(--fs-xs)" }}>{pro.service} · Applied {pro.applied}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "var(--fs-xs)", marginTop: "2px" }}>Documents: {pro.docs}</div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flexShrink: 0 }}
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
