"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, CreditCard, Star,
  Settings, Shield, ShieldCheck, BarChart3, Tag, Bell, LogOut, Menu, X,
  MapPin, Lock, Search, AlertCircle, Download, HelpCircle, Wrench, ShoppingBag
} from "lucide-react";
import styles from "@/app/admin/admin.module.css";
import { GlobalSearchModal } from "@/components/admin/GlobalSearchModal";
import { hasPermission, getRoleBadgeInfo, RolePermissions } from "@/lib/rbac";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  permissionKey: keyof RolePermissions;
  badge?: number;
}

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "KPI Command Center", icon: LayoutDashboard, permissionKey: "dashboard" },
  { href: "/admin/dashboard/marketplace", label: "HandyHub Marketplace", icon: ShoppingBag, permissionKey: "marketplace" },
  { href: "/admin/dashboard/map", label: "Live Map & Radius", icon: MapPin, permissionKey: "map" },
  { href: "/admin/dashboard/bookings", label: "Bookings Workflow", icon: ClipboardList, permissionKey: "bookings" },
  { href: "/admin/dashboard/parts", label: "Replacement Parts & Vouchers", icon: Wrench, permissionKey: "parts" },
  { href: "/admin/dashboard/users", label: "Users & Staff Roles", icon: Users, permissionKey: "users" },
  { href: "/admin/dashboard/verification", label: "Client Address Verification", icon: ShieldCheck, permissionKey: "verification" },
  { href: "/admin/dashboard/professionals", label: "Artisan Verification", icon: Shield, permissionKey: "professionals" },
  { href: "/admin/dashboard/disputes", label: "Dispute & Refund Center", icon: AlertCircle, permissionKey: "disputes" },
  { href: "/admin/dashboard/payments", label: "Payments & Escrow", icon: CreditCard, permissionKey: "payments" },
  { href: "/admin/dashboard/reviews", label: "Customer Reviews", icon: Star, permissionKey: "reviews" },
  { href: "/admin/dashboard/promo-codes", label: "Promo Codes", icon: Tag, permissionKey: "promoCodes" },
  { href: "/admin/dashboard/analytics", label: "Analytics & Reports", icon: BarChart3, permissionKey: "analytics" },
  { href: "/admin/dashboard/notifications", label: "Notifications", icon: Bell, permissionKey: "notifications" },
  { href: "/admin/dashboard/settings", label: "Settings & Backups", icon: Settings, permissionKey: "settings" },
];

export function AdminLayoutShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const sessionStr = localStorage.getItem("handyhub_admin_session");
    const hasCookie = document.cookie.includes("handyhub_admin_session=authenticated");

    if (!sessionStr && !hasCookie) {
      queueMicrotask(() => {
        setAuthenticated(false);
        router.replace("/admin?unauthorized=1");
      });
      return;
    }

    try {
      if (sessionStr) {
        const sess = JSON.parse(sessionStr);
        if (!sess.authenticated) {
          queueMicrotask(() => {
            setAuthenticated(false);
            router.replace("/admin?unauthorized=1");
          });
          return;
        }
        setAdminUser(sess.user || { role: "SUPER_ADMIN", firstName: "System", lastName: "Admin" });
      } else {
        setAdminUser({ role: "SUPER_ADMIN", firstName: "System", lastName: "Admin" });
      }
      setAuthenticated(true);
    } catch {
      queueMicrotask(() => {
        setAuthenticated(false);
        router.replace("/admin?unauthorized=1");
      });
    }
  }, [router]);

  // Global Keyboard Shortcut (Ctrl+K or Cmd+K for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    // Clear all auth cookies
    document.cookie = "handyhub_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "handyhub_pro_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "handyhub_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "handyhub_user_data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    // Clear all storage session keys
    localStorage.removeItem("handyhub_user");
    localStorage.removeItem("handyhub_user_session");
    localStorage.removeItem("handyhub_pro_session");
    localStorage.removeItem("handyhub_admin_session");
    sessionStorage.removeItem("handyhub_active_session");
    sessionStorage.removeItem("handyhub_user_session");
    router.replace("/admin");
  };

  if (authenticated === false) return null;

  if (authenticated === null) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Lock size={40} color="#0EA5E9" style={{ animation: "pulse 1.5s infinite" }} />
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>Authenticating Admin Role Credentials & Permissions...</p>
      </div>
    );
  }

  const role = adminUser?.role || "SUPER_ADMIN";
  const badgeInfo = getRoleBadgeInfo(role);

  // Filter allowed navigation items based on active role permissions
  const filteredNav = adminNav.filter((item) => hasPermission(role, item.permissionKey));

  // Check if current page is allowed for active staff role
  const activeNavItem = adminNav.find((item) => item.href === pathname);
  const isPageAllowed = !activeNavItem || hasPermission(role, activeNavItem.permissionKey);
  const firstAllowedHref = filteredNav[0]?.href || "/admin/dashboard";

  return (
    <div className={styles.adminDashLayout}>
      {sidebarOpen && (
        <div className={styles.adminOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Sidebar */}
      <aside className={`${styles.adminSidebar} ${sidebarOpen ? styles.adminSidebarOpen : ""}`}>
        <div className={styles.adminSidebarHeader}>
          <Link href="/admin/dashboard" className={styles.adminLogo} style={{ gap: "12px", textDecoration: "none" }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(14, 165, 233, 0.4)",
              flexShrink: 0,
            }}>
              <Shield size={20} color="#FFFFFF" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.4px" }}>HandyHub</span>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #38BDF8, #818CF8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}>COMMAND</span>
              </div>
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748B", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                EXECUTIVE SUITE
              </span>
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

        {/* User Identity & Role Badge Card */}
        <div style={{
          padding: "12px 14px",
          margin: "12px 12px 16px 12px",
          background: "linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
          borderRadius: "14px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: "13px",
            flexShrink: 0,
            border: "2px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}>
            {adminUser?.firstName ? adminUser.firstName[0].toUpperCase() : "A"}{adminUser?.lastName ? adminUser.lastName[0].toUpperCase() : "A"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#F8FAFC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {adminUser?.firstName} {adminUser?.lastName}
            </div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 8px",
              borderRadius: "20px",
              background: badgeInfo.badgeColor + "20",
              color: badgeInfo.badgeColor,
              border: `1px solid ${badgeInfo.badgeColor}40`,
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.4px",
              width: "fit-content",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: badgeInfo.badgeColor }} />
              {badgeInfo.label}
            </div>
          </div>
        </div>

        <nav className={styles.adminNav}>
          {filteredNav.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
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

      {/* Main Content Area */}
      <main className={styles.adminMain}>
        {/* Top Command Bar */}
        <div style={{ padding: "14px 20px", background: "#0B132B", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", maxWidth: "500px" }}>
            <button className={styles.adminMenuBtn} onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>

            {/* Quick Global Search Trigger Button */}
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "20px",
                padding: "8px 14px",
                color: "#94A3B8",
                fontSize: "13px",
                cursor: "pointer",
                flex: 1,
              }}
            >
              <Search size={16} color="#0EA5E9" />
              <span>Search customers, pros, ref...</span>
              <kbd style={{ marginLeft: "auto", background: "#0F172A", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", color: "#64748B" }}>Ctrl+K</kbd>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "#10B981", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse 2s infinite" }} />
              Live Server: Abuja & Expansion
            </span>
          </div>
        </div>

        {isPageAllowed ? (
          children
        ) : (
          <div className="card" style={{ background: "#1E293B", border: "1px solid #EF4444", borderRadius: "16px", padding: "40px", textAlign: "center", maxWidth: "600px", margin: "40px auto" }}>
            <Lock size={48} color="#EF4444" style={{ marginBottom: "16px" }} />
            <h2 className="h3" style={{ color: "#F8FAFC", margin: "0 0 8px 0" }}>Access Restricted 🔒</h2>
            <p style={{ color: "#CBD5E1", fontSize: "14px", marginBottom: "20px" }}>
              Your assigned staff role (<strong style={{ color: badgeInfo.badgeColor }}>{badgeInfo.label}</strong>) does not have administrative permission to view <strong>{activeNavItem?.label}</strong>.
            </p>
            <div style={{ background: "#0F172A", padding: "14px", borderRadius: "8px", border: "1px solid #334155", marginBottom: "24px", textAlign: "left", fontSize: "13px", color: "#94A3B8" }}>
              🛡️ <strong>RBAC Policy Notice:</strong> Only <strong style={{ color: "#EF4444" }}>Chief Commander</strong> or <strong style={{ color: "#F97316" }}>Admin General</strong> can modify staff privileges or system settings. Contact your administrator if you require additional operational privileges.
            </div>
            <Link href={firstAllowedHref} className="btn btn-primary btn-md" style={{ background: "#0EA5E9", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Return to My Authorized Dashboard ↗
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
