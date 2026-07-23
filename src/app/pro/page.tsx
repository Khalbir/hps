"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ClipboardList, Calendar, Star, Wallet,
  User, Settings, LogOut, Menu, X, Bell,
  TrendingUp, Clock, CheckCircle, DollarSign, MapPin,
  ArrowRight, Phone, ToggleLeft, ToggleRight,
} from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

const proNav = [
  { href: "/pro", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pro/jobs", label: "My Jobs", icon: ClipboardList, badge: 2 },
  { href: "/pro/calendar", label: "Calendar", icon: Calendar },
  { href: "/pro/reviews", label: "Reviews", icon: Star },
  { href: "/pro/earnings", label: "Earnings", icon: Wallet },
  { href: "/pro/profile", label: "Profile", icon: User },
  { href: "/pro/notifications", label: "Notifications", icon: Bell, badge: 1 },
  { href: "/pro/settings", label: "Settings", icon: Settings },
];

const upcomingJobs = [
  { id: "HHP-M1K9X", service: "Deep Cleaning", customer: "Amina I.", address: "12 Aminu Kano, Maitama", date: "Today", time: "2:00 PM", price: "₦25,000", status: "CONFIRMED" },
  { id: "HHP-N2L0Y", service: "Residential Cleaning", customer: "Chidi O.", address: "Plot 5, Wuse 2", date: "Tomorrow", time: "9:00 AM", price: "₦15,000", status: "PENDING" },
  { id: "HHP-O3M1Z", service: "Post Construction", customer: "Grace N.", address: "7 Alex Ekwueme Way, Jabi", date: "Jul 22", time: "10:00 AM", price: "₦40,000", status: "CONFIRMED" },
];

const statusColors: Record<string, string> = {
  PENDING: "#F59E0B",
  CONFIRMED: "#3B82F6",
  IN_PROGRESS: "#8B5CF6",
  COMPLETED: "#10B981",
};

export default function ProDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [available, setAvailable] = useState(true);

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.sidebarLogo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#pro-logo)" />
              <path d="M8 16C8 11.58 11.58 8 16 8C20.42 8 24 11.58 24 16C24 20.42 20.42 24 16 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M16 12V16L19 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs><linearGradient id="pro-logo" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#F97316" /><stop offset="1" stopColor="#EA580C" /></linearGradient></defs>
            </svg>
            <span>HandyHub <strong style={{ fontSize: "var(--fs-xs)", color: "var(--color-accent-500)" }}>PRO</strong></span>
          </Link>
          <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Availability Toggle */}
        <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border-primary)" }}>
          <button
            onClick={() => setAvailable(!available)}
            style={{
              display: "flex", alignItems: "center", gap: "var(--space-3)",
              width: "100%", padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-lg)", cursor: "pointer",
              background: available ? "rgba(16,185,129,0.1)" : "var(--bg-tertiary)",
              border: `1.5px solid ${available ? "#10B981" : "var(--border-primary)"}`,
              color: available ? "#10B981" : "var(--text-tertiary)",
              fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)",
              transition: "all 0.2s ease",
            }}
          >
            {available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            {available ? "Available" : "Unavailable"}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {proNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${link.href === "/pro" ? styles.navLinkActive : ""}`}
            >
              <link.icon size={20} />
              <span>{link.label}</span>
              {link.badge && <span className={styles.navBadge}>{link.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/auth/login" className={styles.navLink}>
            <LogOut size={20} />
            <span>Log Out</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div>
              <h1 className={styles.greeting}>Good afternoon, Blessing! 💪</h1>
              <p className={styles.greetingSub}>You have 2 upcoming jobs today</p>
            </div>
          </div>
          <div className={styles.topBarRight}>
            <div style={{
              display: "flex", alignItems: "center", gap: "var(--space-2)",
              padding: "var(--space-2) var(--space-4)",
              background: available ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--fs-xs)", fontWeight: "var(--fw-semibold)",
              color: available ? "#10B981" : "#EF4444",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: available ? "#10B981" : "#EF4444",
              }} />
              {available ? "Online" : "Offline"}
            </div>
          </div>
        </header>

        <div className={styles.content}>
          {/* Stats */}
          <div className={styles.statsGrid}>
            {[
              { label: "This Month Earnings", value: "₦185,000", icon: DollarSign, change: "+₦45K vs last month" },
              { label: "Jobs Completed", value: "312", icon: CheckCircle, change: "18 this month" },
              { label: "Average Rating", value: "4.8★", icon: Star, change: "Based on 98 reviews" },
              { label: "Response Time", value: "15min", icon: Clock, change: "Great! Top 10%" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className={`card ${styles.statCard}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={styles.statIcon}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statChange}>{stat.change}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Upcoming Jobs */}
          <div className={`card ${styles.tableCard}`}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Upcoming Jobs</h2>
              <Link href="/pro/jobs" className={styles.viewAll}>
                View All <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {upcomingJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "var(--space-4) var(--space-5)",
                    background: "var(--bg-tertiary)", borderRadius: "var(--radius-xl)",
                    border: "1px solid var(--border-secondary)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                      <span style={{ fontWeight: "var(--fw-semibold)", color: "var(--text-primary)", fontSize: "var(--fs-base)" }}>
                        {job.service}
                      </span>
                      <span style={{
                        padding: "2px 10px", borderRadius: "var(--radius-full)",
                        fontSize: "var(--fs-xs)", fontWeight: "var(--fw-semibold)",
                        color: statusColors[job.status],
                        background: `${statusColors[job.status]}15`,
                      }}>
                        {job.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--fs-sm)", color: "var(--text-tertiary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <User size={14} /> {job.customer}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={14} /> {job.address}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={14} /> {job.date}, {job.time}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "var(--space-4)" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: "var(--fw-bold)", color: "var(--color-primary-500)", fontSize: "var(--fs-lg)" }}>
                      {job.price}
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                      {job.status === "PENDING" && (
                        <>
                          <button className="btn btn-primary btn-sm">Accept</button>
                          <button className="btn btn-secondary btn-sm">Decline</button>
                        </>
                      )}
                      {job.status === "CONFIRMED" && (
                        <button className="btn btn-primary btn-sm">Start Job</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActionsGrid}>
            <Link href="/pro/calendar" className={`card card-hover ${styles.quickAction}`}>
              <Calendar size={24} />
              <h3>Manage Schedule</h3>
              <p>Set your available hours and days off</p>
            </Link>
            <Link href="/pro/earnings" className={`card card-hover ${styles.quickAction}`}>
              <Wallet size={24} />
              <h3>View Earnings</h3>
              <p>Track your income and request payouts</p>
            </Link>
            <Link href="/pro/profile" className={`card card-hover ${styles.quickAction}`}>
              <User size={24} />
              <h3>Update Profile</h3>
              <p>Edit your skills, bio, and portfolio</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
