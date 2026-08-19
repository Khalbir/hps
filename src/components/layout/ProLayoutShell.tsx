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
  const [isCustomerAccount, setIsCustomerAccount] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    let activeUserId = "";
    let activeEmail = "";
    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
        if (parsed?.user?.email || parsed?.email) activeEmail = parsed.user?.email || parsed.email;

        const role = parsed?.user?.role || parsed?.role;
        if (role === "CUSTOMER") {
          setIsCustomerAccount(true);
          setCustomerName(`${parsed?.user?.firstName || parsed?.firstName || ""} ${parsed?.user?.lastName || parsed?.lastName || ""}`.trim());
        }
      } catch (err) {}
    }

    if (activeUserId || activeEmail) {
      fetch(`/api/pro/dashboard?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.role === "CUSTOMER" || data.isProfessional === false) {
            setIsCustomerAccount(true);
            if (data.userName) setCustomerName(data.userName);
          }
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
            <BrandLogo size="sm" lightText={false} />
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
          <Link href="/dashboard" className={styles.navLink} style={{ color: "#38BDF8", fontWeight: 700 }}>
            <LogOut size={18} />
            <span>Switch to Client Mode</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div style={{ padding: "0 0 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>

          {!isCustomerAccount && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
              <span style={{ fontSize: "11.5px", color: "var(--text-tertiary)" }}>
                🛠️ Verified Artisan Account
              </span>
              <Link
                href="/dashboard"
                className="btn btn-secondary btn-sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "12px",
                  color: "#38BDF8",
                  borderColor: "rgba(14,165,233,0.3)",
                  background: "rgba(14,165,233,0.1)",
                  textDecoration: "none",
                }}
                title="Switch to Client Portal to book services for your own property"
              >
                🔄 Switch to Client Mode (Book Services)
              </Link>
            </div>
          )}
        </div>

        {isCustomerAccount && (
          <div style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)",
            border: "1.5px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: "28px" }}>🔒</span>
              <div>
                <strong style={{ color: "#F8FAFC", fontSize: "14.5px", display: "block" }}>
                  Artisan Workspace Restricted: Client Account ({customerName || "Customer"})
                </strong>
                <span style={{ color: "var(--text-secondary)", fontSize: "12.5px", display: "block", marginTop: 2, maxWidth: 650 }}>
                  You are signed in as a <strong>Client / Customer</strong>. Access to artisan job dispatches, earnings, and procurement tools is reserved for verified trade professionals. Client accounts cannot switch to an artisan account without completing professional verification.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Link href="/dashboard" className="btn btn-primary btn-sm" style={{ background: "#0EA5E9", borderColor: "#0EA5E9", fontWeight: 700, textDecoration: "none" }}>
                ➔ Return to Client Dashboard
              </Link>
              <Link href="/auth/register" className="btn btn-secondary btn-sm" style={{ fontSize: "12px", textDecoration: "none" }}>
                Apply as an Artisan
              </Link>
            </div>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
