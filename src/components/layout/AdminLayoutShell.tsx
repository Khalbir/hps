"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, CreditCard, Star,
  Settings, Shield, BarChart3, Tag, Bell, LogOut, Menu, X,
  MapPin, DollarSign, Lock,
} from "lucide-react";
import styles from "@/app/admin/admin.module.css";

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/map", label: "Live Map & Radius", icon: MapPin },
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

export function AdminLayoutShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check if Admin Session token exists in localStorage or cookies
    const sessionStr = localStorage.getItem("handyhub_admin_session");
    const hasCookie = document.cookie.includes("handyhub_admin_session=authenticated");

    if (!sessionStr && !hasCookie) {
      setAuthenticated(false);
      router.replace("/admin?unauthorized=1");
      return;
    }

    try {
      if (sessionStr) {
        const sess = JSON.parse(sessionStr);
        if (!sess.authenticated) {
          setAuthenticated(false);
          router.replace("/admin?unauthorized=1");
          return;
        }
      }
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
      router.replace("/admin?unauthorized=1");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("handyhub_admin_session");
    document.cookie = "handyhub_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.replace("/admin");
  };

  if (authenticated === false) {
    return null;
  }

  if (authenticated === null) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Lock size={40} color="#0EA5E9" style={{ animation: "pulse 1.5s infinite" }} />
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>Authenticating Admin Credentials & Security Session...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminDashLayout}>
      {sidebarOpen && (
        <div className={styles.adminOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.adminSidebar} ${sidebarOpen ? styles.adminSidebarOpen : ""}`}>
        <div className={styles.adminSidebarHeader}>
          <Link href="/admin/dashboard" className={styles.adminLogo}>
            <img src="/logo.png" alt="HandyHub Admin Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <div>
              <span>HandyHub</span>
              <span style={{ fontSize: "10px", color: "var(--color-primary-400)" }}>ADMIN PORTAL</span>
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
          {adminNav.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.adminNavLink} ${isActive ? styles.adminNavLinkActive : ""}`}
              >
                <link.icon size={18} />
                <span>{link.label}</span>
                {link.badge && <span className={styles.adminNavBadge}>{link.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.adminSidebarFooter}>
          <button onClick={handleLogout} className={styles.adminNavLink} style={{ width: "100%", cursor: "pointer" }}>
            <LogOut size={18} />
            <span>Sign Out & Lock</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.adminMain}>
        <div style={{ padding: "0 0 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className={styles.adminMenuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
