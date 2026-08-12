"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Calendar, Star, Wallet,
  User, Settings, LogOut, Menu, X, Bell, ShieldCheck,
  ToggleLeft, ToggleRight, ArrowLeft,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import styles from "@/app/dashboard/dashboard.module.css";

const proNav = [
  { href: "/pro", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/pro/jobs", label: "My Jobs", icon: ClipboardList, key: "jobs" },
  { href: "/pro/calendar", label: "Calendar", icon: Calendar, key: "calendar" },
  { href: "/pro/reviews", label: "Reviews", icon: Star, key: "reviews" },
  { href: "/pro/earnings", label: "Earnings", icon: Wallet, key: "earnings" },
  { href: "/pro/profile", label: "Profile", icon: User, key: "profile" },
  { href: "/pro/notifications", label: "Notifications", icon: Bell, key: "notifications" },
  { href: "/pro/settings", label: "Settings", icon: Settings, key: "settings" },
];

export function ProLayoutShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [available, setAvailable] = useState(true);
  const [jobCount, setJobCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const staySignedIn = localStorage.getItem("handyhub_stay_signed_in") === "true";
      const activeWindowSession = sessionStorage.getItem("handyhub_active_session") || sessionStorage.getItem("handyhub_pro_session");
      if (!staySignedIn && !activeWindowSession) {
        document.cookie = "handyhub_pro_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        localStorage.removeItem("handyhub_pro_session");
        window.location.href = "/auth/login?reason=multi_window_logout";
        return;
      }
    }

    let activeUserId = "";
    let activeEmail = "";
    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
        if (parsed?.user?.email || parsed?.email) activeEmail = parsed.user?.email || parsed.email;
      } catch (err) {}
    }

    if (activeUserId || activeEmail) {
      fetch(`/api/pro/dashboard?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.activeJobs) {
            setJobCount(data.activeJobs.length);
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/pro" className={styles.sidebarLogo} style={{ textDecoration: "none" }}>
            <BrandLogo size="sm" lightText={true} />
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
            const badgeValue = item.key === "jobs" ? jobCount : item.key === "notifications" ? notifCount : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {badgeValue > 0 && (
                  <span className="badge" style={{ marginLeft: "auto", background: "rgba(14,165,233,0.15)", color: "#0EA5E9", fontSize: "10px" }}>
                    {badgeValue}
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
