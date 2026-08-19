"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Wrench, Zap, Snowflake, Paintbrush, Hammer, Camera, SunMedium,
  Menu, X, Sun, Moon, ChevronDown, Phone, MessageSquare, ArrowRight, Layers, User, ShoppingBag
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { BrandLogo } from "@/components/common/BrandLogo";
import styles from "./Header.module.css";

const services = [
  { name: "Cleaning Services", desc: "Residential, Deep & Office Cleaning", href: "/book?category=cleaning", icon: Sparkles },
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
    // Check if user is logged in across cookies, localStorage, and sessionStorage
    const checkAuth = () => {
      const hasCookieSession = document.cookie.includes("handyhub_user_session=authenticated") ||
                               document.cookie.includes("handyhub_pro_session=authenticated") ||
                               document.cookie.includes("handyhub_admin_session=authenticated");
      
      const hasStorageSession = typeof window !== "undefined" && (
        Boolean(localStorage.getItem("handyhub_user")) ||
        Boolean(localStorage.getItem("handyhub_user_session")) ||
        Boolean(localStorage.getItem("handyhub_pro_session")) ||
        Boolean(localStorage.getItem("handyhub_admin_session")) ||
        Boolean(sessionStorage.getItem("handyhub_active_session")) ||
        Boolean(sessionStorage.getItem("handyhub_user_session"))
      );

      if (hasCookieSession || hasStorageSession) {
        setIsLoggedIn(true);
        if (typeof window !== "undefined") {
          try {
            const rawUser = localStorage.getItem("handyhub_user");
            const rawSession = localStorage.getItem("handyhub_user_session") || sessionStorage.getItem("handyhub_active_session");
            const parsed = rawUser ? JSON.parse(rawUser) : rawSession ? JSON.parse(rawSession).user : null;
            if (parsed?.role) {
              setUserRole(parsed.role);
              setIsProfessional(parsed.role === "PROFESSIONAL" || Boolean(parsed.isProfessional));
              if (parsed.firstName) setUserName(parsed.firstName);
            }
          } catch {}
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
        setIsProfessional(false);
        setUserName("");
      }
    };
    
    checkAuth();
    window.addEventListener("focus", checkAuth);
    return () => window.removeEventListener("focus", checkAuth);
  }, []);

  const handleLogout = () => {
    // Clear all auth cookies
    document.cookie = "handyhub_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "handyhub_pro_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "handyhub_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "handyhub_user_data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    
    // Clear all localStorage session keys
    localStorage.removeItem("handyhub_user");
    localStorage.removeItem("handyhub_user_session");
    localStorage.removeItem("handyhub_pro_session");
    localStorage.removeItem("handyhub_admin_session");
    
    // Clear all sessionStorage session keys
    sessionStorage.removeItem("handyhub_active_session");
    sessionStorage.removeItem("handyhub_user_session");
    
    setIsLoggedIn(false);
    setUserRole(null);
    
    window.location.href = "/";
  };

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}
      >
        <div className={styles.container}>
          {/* Logo */}
          <Link href="/" className={styles.logo} aria-label="HandyHub Pro Solutions Home" title="HandyHub Pro Solutions">
            <BrandLogo size="md" />
          </Link>

          {/* Desktop Nav */}
          <nav className={styles.nav} aria-label="Main navigation">
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
                Services
                <ChevronDown
                  size={16}
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
            <Link href="/marketplace" className={styles.navLink} style={{ color: "#0EA5E9", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <ShoppingBag size={15} /> Marketplace
            </Link>
            <Link href="/about" className={styles.navLink}>
              About
            </Link>
            <Link href="/track" className={styles.navLink} style={{ color: "#10B981", fontWeight: "bold" }}>
              Track Booking
            </Link>
            <Link
              href="/auth/register?role=PROFESSIONAL"
              className={styles.navLink}
              style={{
                color: "#8B5CF6",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(139, 92, 246, 0.1)",
                padding: "5px 12px",
                borderRadius: "99px",
                border: "1px solid rgba(139, 92, 246, 0.25)",
              }}
              title="Sign up as an Artisan / Verified Professional"
            >
              <Wrench size={13} color="#8B5CF6" /> Become a Pro
            </Link>
          </nav>

          {/* Right Section */}
          <div className={styles.actions}>
            <a href="https://wa.me/2348122222936?text=Hello%20HandyHub%20Support" target="_blank" rel="noopener noreferrer" className={styles.phoneLink} style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", borderColor: "rgba(37,211,102,0.3)" }} title="Chat on WhatsApp">
              <MessageSquare size={16} />
              <span>WhatsApp</span>
            </a>
            <a href="tel:+2348122222936" className={styles.phoneLink} title="Call Customer Support (+234 812 222 2936)">
              <Phone size={16} />
              <span>+234 812 222 2936</span>
            </a>
            <button
              onClick={toggleTheme}
              className={`btn btn-icon btn-ghost ${styles.themeBtn}`}
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
                  {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                </motion.div>
              </AnimatePresence>
            </button>
            {isLoggedIn ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {userRole === "SUPER_ADMIN" || userRole === "ADMIN" ? (
                  <Link href="/admin/dashboard" className={styles.profileBtn} title="Admin Control Center">
                    <User size={16} />
                    <span className={styles.profileText}>Admin Portal</span>
                  </Link>
                ) : isProfessional ? (
                  <>
                    <Link href="/pro" className={styles.profileBtn} style={{ background: "rgba(139, 92, 246, 0.15)", borderColor: "#8B5CF6", color: "#C084FC" }} title="Artisan Workspace">
                      <Wrench size={15} color="#A855F7" />
                      <span className={styles.profileText}>Artisan Portal</span>
                    </Link>
                    <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ fontSize: "12px", color: "#38BDF8", padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }} title="Switch to Client Mode">
                      <User size={14} /> Switch to Client View
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className={styles.profileBtn} title="Client Dashboard">
                    <User size={16} />
                    <span className={styles.profileText}>Client Dashboard</span>
                  </Link>
                )}
                <button onClick={handleLogout} className={`${styles.loginBtn}`} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", opacity: 0.8 }}>
                  Log Out
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className={`${styles.loginBtn}`}>
                Log In
              </Link>
            )}
            <Link href="/book" className={`btn btn-primary btn-md ${styles.bookNowBtn}`}>
              Book Now
            </Link>
            <button
              className={styles.menuBtn}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
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
              aria-label="Mobile navigation"
            >
              <div className={styles.mobileMenuContent}>
                <div className={styles.mobileMenuHeader}>
                  <span className={styles.mobileMenuTitle}>Menu</span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="btn btn-icon btn-ghost"
                    aria-label="Close menu"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className={styles.mobileLinks}>
                  <div>
                    <button
                      className={styles.mobileLink}
                      onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    >
                      <span>Our Services</span>
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
                    Contact & Support
                  </Link>
                  <Link
                    href="/track"
                    className={styles.mobileLink}
                    onClick={() => setMobileOpen(false)}
                    style={{ color: "#0EA5E9", fontWeight: "bold" }}
                  >
                    Track My Booking
                  </Link>
                  <div className={styles.mobileDivider} />
                  {isLoggedIn ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                            style={{ color: "#C084FC", fontWeight: "bold", display: "flex", alignItems: "center", gap: 8 }}
                          >
                            <Wrench size={18} />
                            <span>Artisan Workspace (Pro)</span>
                          </Link>
                          <Link
                            href="/dashboard"
                            className={styles.mobileLink}
                            onClick={() => setMobileOpen(false)}
                            style={{ color: "#38BDF8", display: "flex", alignItems: "center", gap: 8 }}
                          >
                            <User size={18} />
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
                        style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", opacity: 0.8 }}
                      >
                        Log Out
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <Link
                        href="/auth/login"
                        className={styles.mobileLink}
                        onClick={() => setMobileOpen(false)}
                      >
                        Log In
                      </Link>
                      <Link
                        href="/auth/register?role=PROFESSIONAL"
                        className={styles.mobileLink}
                        onClick={() => setMobileOpen(false)}
                        style={{
                          color: "#8B5CF6",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "rgba(139, 92, 246, 0.08)",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1.5px solid rgba(139, 92, 246, 0.25)",
                        }}
                      >
                        <Wrench size={18} color="#8B5CF6" />
                        <span>Join as a Pro (Artisan Sign Up)</span>
                      </Link>
                    </div>
                  )}
                </div>
                <div className={styles.mobileMenuFooter}>
                  <Link
                    href="/book"
                    className="btn btn-primary btn-lg w-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    Book a Service
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
