"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home, Calendar, ClipboardList, User, Bell, Wallet,
  MapPin, Settings, LogOut, Menu, X, Plus, Search,
  ArrowRight, Star, Clock, CheckCircle, TrendingUp,
} from "lucide-react";
import styles from "./dashboard.module.css";

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/bookings", label: "My Bookings", icon: ClipboardList },
  { href: "/dashboard/addresses", label: "Addresses", icon: MapPin },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, badge: 3 },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const recentBookings = [
  { id: "HHP-ABC123", service: "Deep Cleaning", status: "COMPLETED", date: "Jul 15", price: "₦25,000", pro: "Blessing O.", rating: 5 },
  { id: "HHP-DEF456", service: "AC Servicing", status: "IN_PROGRESS", date: "Jul 18", price: "₦8,000", pro: "Yusuf A.", rating: null },
  { id: "HHP-GHI789", service: "Plumbing", status: "PENDING", date: "Jul 20", price: "₦10,000", pro: "Ibrahim M.", rating: null },
];

const statusColors: Record<string, string> = {
  PENDING: "#F59E0B",
  CONFIRMED: "#3B82F6",
  IN_PROGRESS: "#8B5CF6",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
};

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = { firstName: "Test", lastName: "Customer", email: "customer@test.com" };

  return (
    <div className={styles.layout}>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.sidebarLogo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#dash-logo)" />
              <path d="M8 16C8 11.58 11.58 8 16 8C20.42 8 24 11.58 24 16C24 20.42 20.42 24 16 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M16 12V16L19 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs><linearGradient id="dash-logo" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#0EA5E9" /><stop offset="1" stopColor="#0284C7" /></linearGradient></defs>
            </svg>
            <span>HandyHub</span>
          </Link>
          <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${link.href === "/dashboard" ? styles.navLinkActive : ""}`}
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

      {/* Main Content */}
      <main className={styles.main}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div>
              <h1 className={styles.greeting}>Welcome back, {user.firstName}! 👋</h1>
              <p className={styles.greetingSub}>Here&apos;s what&apos;s happening with your property</p>
            </div>
          </div>
          <div className={styles.topBarRight}>
            <Link href="/book" className="btn btn-primary btn-md">
              <Plus size={18} />
              Book Service
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className={styles.content}>
          {/* Quick Stats */}
          <div className={styles.statsGrid}>
            {[
              { label: "Total Bookings", value: "12", icon: ClipboardList, change: "+3 this month" },
              { label: "Active Booking", value: "1", icon: Clock, change: "In progress" },
              { label: "Wallet Balance", value: "₦50,000", icon: Wallet, change: "Top up" },
              { label: "Avg. Rating Given", value: "4.8★", icon: Star, change: "5 reviews" },
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

          {/* Recent Bookings */}
          <div className={`card ${styles.tableCard}`}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Recent Bookings</h2>
              <Link href="/dashboard/bookings" className={styles.viewAll}>
                View All <ArrowRight size={16} />
              </Link>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Service</th>
                    <th>Professional</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <span className={styles.refCode}>{b.id}</span>
                      </td>
                      <td className={styles.serviceCol}>{b.service}</td>
                      <td>{b.pro}</td>
                      <td>{b.date}</td>
                      <td className={styles.priceCol}>{b.price}</td>
                      <td>
                        <span
                          className={styles.statusBadge}
                          style={{ color: statusColors[b.status], backgroundColor: `${statusColors[b.status]}15` }}
                        >
                          {b.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <Link href={`/dashboard/bookings/${b.id}`} className={styles.viewLink}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActionsGrid}>
            <Link href="/book" className={`card card-hover ${styles.quickAction}`}>
              <Plus size={24} />
              <h3>Book New Service</h3>
              <p>Schedule a professional for your property</p>
            </Link>
            <Link href="/dashboard/wallet" className={`card card-hover ${styles.quickAction}`}>
              <Wallet size={24} />
              <h3>Top Up Wallet</h3>
              <p>Add funds for faster checkout</p>
            </Link>
            <Link href="/dashboard/addresses" className={`card card-hover ${styles.quickAction}`}>
              <MapPin size={24} />
              <h3>Manage Addresses</h3>
              <p>Add or edit your service addresses</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
