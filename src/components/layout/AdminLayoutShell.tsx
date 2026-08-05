"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, CreditCard, Star,
  Settings, Shield, BarChart3, Tag, Bell, LogOut, Menu, X,
  MapPin, Lock, Search, AlertCircle, Download, HelpCircle
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
  { href: "/admin/dashboard/map", label: "Live Map & Radius", icon: MapPin, permissionKey: "map" },
  { href: "/admin/dashboard/bookings", label: "Bookings Workflow", icon: ClipboardList, permissionKey: "bookings" },
  { href: "/admin/dashboard/users", label: "Users & Staff Roles", icon: Users, permissionKey: "users" },
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
        setAdminUser(sess.user || { role: "SUPER_ADMIN", firstName: "System", lastName: "Admin" });
      } else {
        setAdminUser({ role: "SUPER_ADMIN", firstName: "System", lastName: "Admin" });
      }
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
      router.replace("/admin?unauthorized=1");
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
    localStorage.removeItem("handyhub_admin_session");
    document.cookie = "handyhub_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
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
          <Link href="/admin/dashboard" className={styles.adminLogo}>
            <img src="/logo.png" alt="HandyHub Admin Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <div>
              <span>HandyHub</span>
              <span style={{ fontSize: "10px", color: "#0EA5E9" }}>COMMAND CENTER</span>
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
        <div style={{ padding: "12px 16px", margin: "0 12px 16px 12px", background: "rgba(15,23,42,0.6)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#F8FAFC" }}>
            {adminUser?.firstName} {adminUser?.lastName}
          </div>
          <div style={{ marginTop: "4px", display: "inline-block", padding: "2px 8px", borderRadius: "12px", background: badgeInfo.badgeColor + "25", color: badgeInfo.badgeColor, fontSize: "10px", fontWeight: 700 }}>
            {badgeInfo.label}
          </div>
        </div>

        <nav className={styles.adminNav}>
          {filteredNav.map((link) => {
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

      {/* Main Content Area */}
      <main className={styles.adminMain}>
        {/* Top Command Bar */}
        <div style={{ padding: "0 0 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className={styles.adminMenuBtn} onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
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
                padding: "8px 16px",
                color: "#94A3B8",
                fontSize: "13px",
                cursor: "pointer",
                minWidth: "260px",
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
