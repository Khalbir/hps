"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Wrench, Zap, SnowFlake, Paintbrush, Hammer, Camera, SunMedium,
  Menu, X, Sun, Moon, ChevronDown, Phone, MessageSquare, ArrowRight, Layers
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./Header.module.css";

const services = [
  { name: "Cleaning Services", desc: "Residential, Deep & Office Cleaning", href: "/book?category=cleaning", icon: Sparkles },
  { name: "Plumbing Services", desc: "Pipe Leak Repairs, Pumps & Drainage", href: "/book?category=plumbing", icon: Wrench },
  { name: "Electrical Repairs", desc: "Wiring, Socket Fixes & Fault Checks", href: "/book?category=electrical", icon: Zap },
  { name: "AC Servicing & Repair", desc: "Gas Refill, Installation & Maintenance", href: "/book?category=hvac", icon: SnowFlake },
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            <div className={styles.logoIcon}>
              <img src="/logo.png" alt="HandyHub Pro Solutions Logo" className={styles.logoImage} />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoName}>HandyHub</span>
              <span className={styles.logoPro}>PRO</span>
            </div>
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
            <Link href="/about" className={styles.navLink}>
              About
            </Link>
            <Link href="/contact" className={styles.navLink}>
              Contact
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
            <Link href="/auth/login" className={`${styles.loginBtn}`}>
              Log In
            </Link>
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
                  <div className={styles.mobileDivider} />
                  <Link
                    href="/auth/login"
                    className={styles.mobileLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    Log In
                  </Link>
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
