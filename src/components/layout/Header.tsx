"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, ChevronDown, Phone, MessageSquare } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./Header.module.css";

const services = [
  { name: "Residential Cleaning", href: "/book?category=cleaning&service=residential-cleaning" },
  { name: "Commercial Cleaning", href: "/book?category=cleaning&service=commercial-cleaning" },
  { name: "Plumbing", href: "/book?category=plumbing&service=pipe-repairs" },
  { name: "Electrical Repairs", href: "/book?category=electrical&service=socket-switch" },
  { name: "AC Installation & Repair", href: "/book?category=hvac&service=ac-repair" },
  { name: "Painting", href: "/book?category=painting&service=interior-painting" },
  { name: "View All Services →", href: "/book" },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

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
              <button className={styles.navLink} aria-expanded={servicesOpen} aria-haspopup="true">
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
                  >
                    {services.map((s) => (
                      <Link
                        key={s.name}
                        href={s.href}
                        className={styles.dropdownItem}
                        onClick={() => setServicesOpen(false)}
                      >
                        {s.name}
                      </Link>
                    ))}
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
            <Link href="/book" className="btn btn-primary btn-md">
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
                  <Link
                    href="/services"
                    className={styles.mobileLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    Services
                  </Link>
                  <Link
                    href="/about"
                    className={styles.mobileLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className={styles.mobileLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    Contact
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
