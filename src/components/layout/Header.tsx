"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Bug, Sofa, Wrench, Zap, Snowflake, Paintbrush, Hammer, Camera, SunMedium,
  Menu, X, Sun, Moon, ChevronDown, PhoneCall, MessageSquare, ArrowRight, Layers, User, ShoppingBag, LogOut
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { BrandLogo } from "@/components/common/BrandLogo";
import styles from "./Header.module.css";

const services = [
  { name: "Cleaning Services", desc: "Residential, Deep & Office Cleaning", href: "/book?category=cleaning", icon: Sparkles },
  { name: "Fumigation & Pest Control", desc: "NAFDAC-Certified Safe Eradication", href: "/book?category=fumigation", icon: Bug },
  { name: "Upholstery & Carpet", desc: "Deep Steam Sofa & Mattress Extraction", href: "/book?category=upholstery", icon: Sofa },
  { name: "Plumbing Services", desc: "Pipe Leak Repairs, Pumps & Drainage", href: "/book?category=plumbing", icon: Wrench },
  { name: "Electrical Repairs", desc: "Wiring, Socket Fixes & Fault Checks", href: "/book?category=electrical", icon: Zap },
  { name: "AC Servicing & Repair", desc: "Gas Refill, Installation & Maintenance", href: "/book?category=hvac", icon: Snowflake },
  { name: "Painting & Wall Deco", desc: "Interior, Exterior & POP Finishing", href: "/book?category=painting", icon: Paintbrush },
  { name: "Carpentry & Woodwork", desc: "Furniture Assembly, Doors & Locks", href: "/book?category=carpentry", icon: Hammer },
  { name: "CCTV & Security", desc: "Smart Cameras & Intercom Setup", href: "/book?category=cctv", icon: Camera },
  { name: "Solar & Inverter Setup", desc: "Clean Power & Solar System Install", href: "/book?category=solar", icon: SunMedium },
  { name: "View Full Service Catalog →", desc: "Explore all 25+ verified home solutions", href: "/services", icon: Layers },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isProfessional, setIsProfessional] = useState(false);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const hasCookieSession = document.cookie.includes("handyhub_user_session=authenticated") ||
                               document.cookie.includes("handyhub_pro_session=authenticated") ||
                               document.cookie.includes("handyhub_admin_session=authenticated");
      const localRole = localStorage.getItem("handyhub_user_role");
      const localEmail = localStorage.getItem("handyhub_user_email") || localStorage.getItem("userEmail");
      const localName = localStorage.getItem("handyhub_user_name");

      if (hasCookieSession || localEmail) {
        setIsLoggedIn(true);
        setUserRole(localRole || "CUSTOMER");
        setIsProfessional(localRole === "PROFESSIONAL");
        if (localName) setUserName(localName);
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
        setIsProfessional(false);
        setUserName("");
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("handyhub_user_role");
    localStorage.removeItem("handyhub_user_email");
    localStorage.removeItem("handyhub_user_name");
    localStorage.removeItem("userEmail");
    document.cookie = "handyhub_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "handyhub_pro_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "handyhub_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsLoggedIn(false);
    setUserRole(null);
    setIsProfessional(false);
    window.location.href = "/";
  };

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
        <div className={styles.container}>
          {/* Logo */}
          <Link href="/" className={styles.logo} aria-label="HandyHub Pro Home">
            <BrandLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className={styles.nav} aria-label="Main Navigation">
            <div
              className={styles.navItem}
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                className={styles.navLink}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                onClick={() => setServicesOpen(!servicesOpen)}
              >
                <span>Services</span>
                <ChevronDown
                  size={14}
                  className={`${styles.chevron} ${servicesOpen ? styles.chevronOpen : ""}`}
                />
              </button>
              <AnimatePresence>
                {servicesOpen && (
                  <motion.div
                    className={styles.dropdown}
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
                    style={{ width: 340 }}
                  >
                    {services.map((s) => {
                      const IconComponent = s.icon;
                      return (
                        <Link
                          key={s.name}
                          href={s.href}
                          className={styles.dropdownItem}
                          onClick={() => setServicesOpen(false)}
                          style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 12px" }}
                        >
                          <IconComponent size={18} color="var(--color-primary-500)" style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <strong style={{ display: "block", fontSize: "13px", color: "var(--text-primary)" }}>{s.name}</strong>
                            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{s.desc}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link href="/track" className={styles.navLink} style={{ color: "#10B981", fontWeight: 700 }}>
              Track Booking
            </Link>
            <Link href="/partners" className={styles.navLink} style={{ color: "#38BDF8", fontWeight: 700 }}>
              Partner Network
            </Link>
            <Link
              href="/auth/register?role=PROFESSIONAL"
              className={styles.becomeProLink}
              title="Sign up as an Artisan / Verified Professional"
            >
              <Wrench size={12} color="#FF6B00" /> Become a Pro
            </Link>
          </nav>

          {/* Right Section */}
          <div className={styles.actions}>
            {/* Clickable 24/7 Helpline Card (Calls without displaying plain text digits) */}
            <a
              href="tel:+2348122222936"
              className={styles.callSupportBtn}
              title="Call 24/7 Customer Support Hotline"
              aria-label="Call 24/7 Support Hotline"
            >
              <PhoneCall size={14} className={styles.callIconPulse} />
              <span>Call Support</span>
            </a>

            {/* WhatsApp Chat Card */}
            <a
              href="https://wa.me/2348122222936?text=Hello%20HandyHub%20Support"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappBtn}
              title="Chat on WhatsApp"
              aria-label="Chat on WhatsApp"
            >
              <MessageSquare size={14} />
              <span>WhatsApp</span>
            </a>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={styles.themeBtn}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Auth / Role Switch Group */}
            {isLoggedIn ? (
              <div className={styles.authGroup}>
                {userRole === "SUPER_ADMIN" || userRole === "ADMIN" ? (
                  <Link href="/admin/dashboard" className={`${styles.portalBtn} ${styles.adminBadge}`} title="Admin Control Center">
                    <User size={13} />
                    <span>Admin</span>
                  </Link>
                ) : isProfessional ? (
                  <Link href="/pro" className={`${styles.portalBtn} ${styles.artisanBadge}`} title="Artisan Workspace">
                    <Wrench size={13} color="#A855F7" />
                    <span>Artisan Portal</span>
                  </Link>
                ) : (
                  <Link href="/dashboard" className={styles.portalBtn} title="Client Dashboard">
                    <User size={13} />
                    <span>Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className={styles.logoutBtn}
                  title="Log Out"
                  aria-label="Log Out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className={styles.loginBtn}>
                Log In
              </Link>
            )}

            {/* Slide-over Menu Drawer Toggle (Always available on desktop, tablet, and mobile) */}
            <button
              className={`${styles.menuBtn} ${mobileOpen ? styles.menuBtnActive : ""}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu drawer"
              aria-expanded={mobileOpen}
              title="Open Navigation Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              className={styles.mobileMenu}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              aria-label="Main menu drawer"
            >
              <div className={styles.mobileMenuContent}>
                <div className={styles.mobileMenuHeader}>
                  <BrandLogo size="sm" />
                  <button
                    onClick={() => setMobileOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 6 }}
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className={styles.mobileLinks}>
                  {/* Marketplace Drawer Link (Moved here from top navbar) */}
                  <Link
                    href="/marketplace"
                    className={styles.mobileLink}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      color: "#00A8B5",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "rgba(0, 168, 181, 0.08)",
                      border: "1.5px solid rgba(0, 168, 181, 0.25)",
                      borderRadius: 10,
                      padding: "10px 14px",
                    }}
                  >
                    <ShoppingBag size={18} color="#00A8B5" />
                    <span>Marketplace & Spare Parts</span>
                  </Link>

                  {/* Services Accordion */}
                  <div>
                    <button
                      className={styles.mobileLink}
                      onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Layers size={18} color="var(--color-primary-500)" />
                        <span>All Home Services</span>
                      </span>
                      <ChevronDown
                        size={18}
                        style={{ transform: mobileServicesOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
                      />
                    </button>
                    {mobileServicesOpen && (
                      <div style={{ paddingLeft: 12, borderLeft: "2px solid var(--color-primary-500)", margin: "4px 0 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                        {services.map((s) => {
                          const IconComp = s.icon;
                          return (
                            <Link
                              key={s.name}
                              href={s.href}
                              className={styles.mobileSubLink}
                              onClick={() => setMobileOpen(false)}
                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, fontSize: "13px", color: "var(--text-secondary)" }}
                            >
                              <IconComp size={16} color="var(--color-primary-500)" style={{ flexShrink: 0 }} />
                              <span>{s.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Link
                    href="/track"
                    className={styles.mobileLink}
                    onClick={() => setMobileOpen(false)}
                    style={{ color: "#10B981", fontWeight: "bold" }}
                  >
                    Track Booking Status
                  </Link>

                  <Link
                    href="/about"
                    className={styles.mobileLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    About Us
                  </Link>

                  <Link
                    href="/contact"
                    className={styles.mobileLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    Contact & Customer Support
                  </Link>

                  <div className={styles.mobileDivider} />

                  {/* Pro / Artisan Registration Card */}
                  <Link
                    href="/auth/register?role=PROFESSIONAL"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      color: "#FF6B00",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      background: "linear-gradient(135deg, rgba(255, 107, 0, 0.08) 0%, rgba(249, 115, 22, 0.14) 100%)",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1.5px solid rgba(255, 107, 0, 0.4)",
                      fontSize: "14px",
                      textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(255, 107, 0, 0.12)",
                      transition: "all 0.2s ease",
                      boxSizing: "border-box",
                    }}
                  >
                    <Wrench size={16} color="#FF6B00" />
                    <span>Become a Verified Pro (Artisan Sign Up)</span>
                  </Link>

                  <Link
                    href="/partners"
                    className={styles.mobileLink}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#38BDF8",
                      fontWeight: 700,
                    }}
                  >
                    <span>🤝 HandyHub Partner Network</span>
                  </Link>

                  {isLoggedIn ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      {userRole === "SUPER_ADMIN" || userRole === "ADMIN" ? (
                        <Link
                          href="/admin/dashboard"
                          className={styles.mobileLink}
                          onClick={() => setMobileOpen(false)}
                          style={{ color: "#8B5CF6", fontWeight: "bold", display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <User size={18} />
                          <span>Admin Control Center</span>
                        </Link>
                      ) : isProfessional ? (
                        <>
                          <Link
                            href="/pro"
                            className={styles.mobileLink}
                            onClick={() => setMobileOpen(false)}
                            style={{ color: "#FF6B00", fontWeight: "bold", display: "flex", alignItems: "center", gap: 8 }}
                          >
                            <Wrench size={18} />
                            <span>Artisan Workspace (Pro Portal)</span>
                          </Link>
                          <Link
                            href="/dashboard"
                            className={styles.mobileLink}
                            onClick={() => setMobileOpen(false)}
                            style={{
                              color: "#0EA5E9",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              background: "rgba(14, 165, 233, 0.08)",
                              padding: "10px 14px",
                              borderRadius: 10,
                              border: "1.5px solid rgba(14, 165, 233, 0.25)",
                              fontWeight: 600,
                            }}
                          >
                            <User size={18} color="#0EA5E9" />
                            <span>Switch to Client Mode (Book Services)</span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/dashboard"
                          className={styles.mobileLink}
                          onClick={() => setMobileOpen(false)}
                          style={{ color: "#0EA5E9", fontWeight: "bold", display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <User size={18} />
                          <span>Client Dashboard</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          handleLogout();
                        }}
                        className={styles.mobileLink}
                        style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#EF4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <LogOut size={16} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      <Link
                        href="/auth/login"
                        className={styles.mobileLink}
                        onClick={() => setMobileOpen(false)}
                      >
                        Log In
                      </Link>
                    </div>
                  )}
                </div>

                <div className={styles.mobileMenuFooter}>
                  {/* Contact Hotline & WhatsApp Cards for Mobile */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <a
                      href="tel:+2348122222936"
                      className={styles.callSupportBtn}
                      style={{ justifyContent: "center", padding: "10px 12px", fontSize: "13px" }}
                      title="Call 24/7 Support Hotline"
                    >
                      <PhoneCall size={15} />
                      <span>Call Support</span>
                    </a>
                    <a
                      href="https://wa.me/2348122222936?text=Hello%20HandyHub%20Support"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.whatsappBtn}
                      style={{ justifyContent: "center", padding: "10px 12px", fontSize: "13px" }}
                      title="Chat on WhatsApp"
                    >
                      <MessageSquare size={15} />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <Link
                    href="/book"
                    className="btn btn-primary w-full"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                      boxShadow: "0 4px 16px rgba(14, 165, 233, 0.35)",
                      fontWeight: 700,
                      fontSize: "14px",
                      height: 44,
                      minHeight: 44,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                      color: "#FFFFFF",
                    }}
                  >
                    Book a Service ➔
                  </Link>
                  <button
                    onClick={toggleTheme}
                    className={styles.mobileThemeBtn}
                  >
                    {theme === "light" ? (
                      <>
                        <Moon size={18} /> Dark Mode
                      </>
                    ) : (
                      <>
                        <Sun size={18} /> Light Mode
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Header;
