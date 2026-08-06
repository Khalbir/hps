"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, X } from "lucide-react";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Google OAuth Quick Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

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
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Store Session Tokens & Cookies according to Role
      if (data.user.role === "ADMIN") {
        localStorage.setItem("handyhub_admin_session", JSON.stringify({
          authenticated: true,
          user: data.user,
          timestamp: Date.now(),
        }));
        document.cookie = "handyhub_admin_session=authenticated; path=/; max-age=86400; SameSite=Lax";
        router.push("/admin/dashboard");
      } else if (data.user.role === "PROFESSIONAL") {
        localStorage.setItem("handyhub_pro_session", JSON.stringify({
          authenticated: true,
          user: data.user,
          timestamp: Date.now(),
        }));
        document.cookie = "handyhub_pro_session=authenticated; path=/; max-age=86400; SameSite=Lax";
        router.push("/pro");
      } else {
        localStorage.setItem("handyhub_user", JSON.stringify(data.user));
        localStorage.setItem("handyhub_user_session", JSON.stringify({
          authenticated: true,
          user: data.user,
          timestamp: Date.now(),
        }));
        document.cookie = "handyhub_user_session=authenticated; path=/; max-age=86400; SameSite=Lax";
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail) return;
    setGoogleLoading(true);

    const nameParts = (googleName || "Google User").split(" ");
    const firstName = nameParts[0] || "Valued";
    const lastName = nameParts.slice(1).join(" ") || "Client";

    const userPayload = {
      email: googleEmail.toLowerCase().trim(),
      firstName,
      lastName,
      role: "CUSTOMER",
    };

    localStorage.setItem("handyhub_user", JSON.stringify(userPayload));
    localStorage.setItem("handyhub_user_session", JSON.stringify({
      authenticated: true,
      user: userPayload,
      timestamp: Date.now(),
    }));
    document.cookie = "handyhub_user_session=authenticated; path=/; max-age=86400; SameSite=Lax";

    window.location.href = `/api/auth/google?email=${encodeURIComponent(googleEmail)}&name=${encodeURIComponent(googleName || "Google User")}&role=CUSTOMER`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <Link href="/" className={styles.logo}>
            <img src="/logo.png" alt="HandyHub Logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain" }} />
            <span>HandyHub <strong>PRO</strong></span>
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
          <h2 className={styles.formTitle}>Log in to your account</h2>
          <p className={styles.formSubtitle}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className={styles.formLink}>Sign up</Link>
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorBanner}>
                {error}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <div className={styles.inputWrap}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username email"
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
                <label htmlFor="password" className={styles.label}>Password</label>
                <Link href="/auth/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
              </div>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  name="password"
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

            <button
              type="submit"
              className={`btn btn-primary btn-lg w-full ${loading ? "btn-loading" : ""}`}
              disabled={loading}
            >
              {loading ? <div className="spinner" /> : (
                <>
                  Log In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <span>or continue with</span>
          </div>

          <div className={styles.socialBtns}>
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className={`btn btn-secondary btn-lg ${styles.socialBtn}`}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", cursor: "pointer" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google / Gmail
            </button>
          </div>
        </motion.div>
      </div>

      {/* Google Account Sign-In Modal */}
      {showGoogleModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(9, 13, 22, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowGoogleModal(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 450, background: "#1E293B", border: "1px solid #334155", borderRadius: 20, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #334155", paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="24" height="24" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Sign in with Google Account</h3>
              </div>
              <button onClick={() => setShowGoogleModal(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleGoogleAuthSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Google Email Address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. khalid.kabir@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  required
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #334155", background: "#0F172A", color: "#F8FAFC", fontSize: 14 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Full Name (on Google Account)
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Khalid Kabir"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  required
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #334155", background: "#0F172A", color: "#F8FAFC", fontSize: 14 }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowGoogleModal(false)}>Cancel</button>
                <button type="submit" disabled={googleLoading} className="btn btn-primary btn-sm" style={{ background: "#0EA5E9" }}>
                  {googleLoading ? "Authenticating..." : "Continue to Dashboard ➔"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
