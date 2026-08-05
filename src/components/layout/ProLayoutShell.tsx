"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Calendar, Star, Wallet,
  User, Settings, LogOut, Menu, X, Bell, ShieldCheck,
  ToggleLeft, ToggleRight, ArrowLeft,
} from "lucide-react";
import styles from "@/app/dashboard/dashboard.module.css";

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

export function ProLayoutShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [available, setAvailable] = useState(true);
  const pathname = usePathname();

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/pro" className={styles.sidebarLogo}>
            <img src="/logo.png" alt="HandyHub Pro Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <span>HandyHub <strong style={{ fontSize: "var(--fs-xs)", color: "var(--color-accent-500)" }}>PRO</strong></span>
          </Link>
          <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Pro Card summary in sidebar */}
        <div style={{ padding: "var(--space-3) var(--space-4)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)", margin: "0 var(--space-4) var(--space-4)", border: "1px solid var(--border-primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: available ? "#10B981" : "#64748B" }} />
            <strong style={{ fontSize: "var(--fs-xs)", color: "var(--text-primary)" }}>
              {available ? "Online & Ready for Jobs" : "Offline"}
            </strong>
          </div>
          <button
            onClick={() => setAvailable(!available)}
            style={{ background: "none", border: "none", color: "var(--color-primary-400)", fontSize: "11px", cursor: "pointer", padding: 0, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}
          >
            {available ? <ToggleRight size={18} color="#10B981" /> : <ToggleLeft size={18} />} Switch Availability
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {proNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="badge" style={{ marginLeft: "auto", background: "rgba(14,165,233,0.15)", color: "#0EA5E9", fontSize: "10px" }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter} style={{ padding: "var(--space-4)", borderTop: "1px solid var(--border-primary)" }}>
          <Link href="/" className={styles.navLink} style={{ color: "var(--text-tertiary)" }}>
            <LogOut size={18} />
            <span>Switch to Customer</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div style={{ padding: "0 0 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
