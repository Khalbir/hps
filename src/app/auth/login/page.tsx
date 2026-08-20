"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Wrench, Shield } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check URL reasons (e.g. multi-window auto-logout)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const reason = urlParams.get("reason");
      if (reason === "multi_window_logout") {
        setError("Signed out automatically for security.");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.unverified && data.email) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}&role=${encodeURIComponent(data.role || "CUSTOMER")}`);
          return;
        }
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Always enforce persistent sign-in by default for seamless multi-window & restart support
      localStorage.setItem("handyhub_stay_signed_in", "true");

      const sessionPayload = {
        authenticated: true,
        user: data.user,
        timestamp: Date.now(),
      };

      const cookiePayload = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
        phone: data.user.phone || null,
        avatar: data.user.avatar || null,
        isProfessional: Boolean(data.user.isProfessional || data.user.role === "PROFESSIONAL"),
        digitalId: data.user.digitalId || null,
      };

      // Always save active session to sessionStorage for single-window context scoping
      sessionStorage.setItem("handyhub_active_session", JSON.stringify(sessionPayload));
      localStorage.setItem("handyhub_user", JSON.stringify(data.user));

      const ADMIN_ROLES = ["SUPER_ADMIN", "EXECUTIVE_OPERATIONS_MANAGER", "ADMIN", "OPERATIONS_MANAGER", "MARKETPLACE_MANAGER", "VERIFICATION_OFFICER", "CUSTOMER_SUPPORT", "FINANCE"];
      const cookieDataStr = encodeURIComponent(JSON.stringify(cookiePayload));

      if (ADMIN_ROLES.includes(data.user.role)) {
        localStorage.setItem("handyhub_admin_session", JSON.stringify(sessionPayload));
        document.cookie = "handyhub_admin_session=authenticated; path=/; max-age=2592000; SameSite=Lax";
        document.cookie = `handyhub_user_data=${cookieDataStr}; path=/; max-age=2592000; SameSite=Lax`;
        window.location.href = data.redirect || "/admin/dashboard";
      } else if (data.user.role === "PROFESSIONAL" || data.user.isProfessional) {
        localStorage.setItem("handyhub_pro_session", JSON.stringify(sessionPayload));
        document.cookie = "handyhub_pro_session=authenticated; path=/; max-age=2592000; SameSite=Lax";
        document.cookie = `handyhub_user_data=${cookieDataStr}; path=/; max-age=2592000; SameSite=Lax`;
        window.location.href = "/pro";
      } else {
        localStorage.setItem("handyhub_user_session", JSON.stringify(sessionPayload));
        document.cookie = "handyhub_user_session=authenticated; path=/; max-age=2592000; SameSite=Lax";
        document.cookie = `handyhub_user_data=${cookieDataStr}; path=/; max-age=2592000; SameSite=Lax`;
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Login client error:", err);
      setError("Something went wrong. Please check your network connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <Link href="/" className={styles.logo} style={{ textDecoration: "none" }}>
            <BrandLogo size="md" lightText={true} />
          </Link>
          <h1 className={styles.leftTitle}>Welcome back</h1>
          <p className={styles.leftDesc}>
            Your trusted platform for professional home services. Log in to manage your bookings, track your professionals, and more.
          </p>
          <div className={styles.leftStats}>
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>5,000+</span>
              <span className={styles.leftStatLabel}>Jobs Completed</span>
            </div>
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>4.9★</span>
              <span className={styles.leftStatLabel}>Average Rating</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <motion.div
          className={styles.formCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.formTitle}>Welcome Back</h2>
          <p className={styles.formSubtitle}>
            Don&apos;t have an account yet?{" "}
            <Link href="/auth/register" className={styles.formLink}>Sign up here</Link>
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.inputGroup}>
              <label htmlFor="login-email" className={styles.label}>Email Address</label>
              <div className={styles.inputWrap}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className={styles.input}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="login-password" className={styles.label}>Password</label>
                <Link href="/auth/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", margin: "4px 0 16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-primary)", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={staySignedIn}
                  onChange={(e) => setStaySignedIn(e.target.checked)}
                  style={{ accentColor: "#00A8B5", width: 16, height: 16, cursor: "pointer" }}
                />
                <span>Stay signed in on this device</span>
              </label>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg w-full ${loading ? "btn-loading" : ""}`}
              disabled={loading}
              style={{ background: "#00A8B5", borderColor: "#00A8B5" }}
            >
              {loading ? <div className="spinner" /> : (
                <>
                  Log In to Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Prominent Artisan Registration Callout */}
          <div
            style={{
              marginTop: "var(--space-6)",
              padding: "16px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(0, 168, 181, 0.08) 100%)",
              border: "1.5px solid rgba(139, 92, 246, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8B5CF6", fontWeight: 700, fontSize: "13.5px" }}>
              <Wrench size={18} color="#8B5CF6" />
              <span>Are You an Artisan, Technician, or Craftsman?</span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Join HandyHub Pro&apos;s verified artisan network. Get matched with jobs in your area, grow your earnings, and enjoy guaranteed escrow payouts.
            </p>
            <Link
              href="/auth/register?role=PROFESSIONAL"
              style={{
                color: "#00A8B5",
                fontWeight: 700,
                fontSize: "13px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "2px",
              }}
            >
              Join as a Verified Professional &rarr;
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
