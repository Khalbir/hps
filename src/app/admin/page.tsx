"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight } from "lucide-react";
import styles from "./admin.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER", "VERIFICATION_OFFICER", "CUSTOMER_SUPPORT", "FINANCE"];
      if (!ADMIN_ROLES.includes(data.user.role)) {
        setError("Unauthorized access. Designated Admin/Staff role required.");
        setLoading(false);
        return;
      }

      // Store Secure Admin Session Token & Cookie
      localStorage.setItem("handyhub_admin_session", JSON.stringify({
        authenticated: true,
        user: data.user,
        timestamp: Date.now(),
      }));

      document.cookie = "handyhub_admin_session=authenticated; path=/; max-age=86400; SameSite=Lax";

      window.location.href = data.redirect || "/admin/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginBg}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgGrid} />
      </div>

      <motion.div
        className={styles.loginCard}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.loginHeader}>
          <div className={styles.adminShield}>
            <Shield size={28} />
          </div>
          <h1 className={styles.loginTitle}>Admin Portal</h1>
          <p className={styles.loginSubtitle}>HandyHub Pro Solutions — System Administrator</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Admin Email</label>
            <div className={styles.inputWrap}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="email"
                className={styles.input}
                placeholder="admin@handyhubpro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                className={styles.input}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg ${styles.submitBtn}`}
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? <div className="spinner" /> : (
              <>
                Access Admin Panel
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className={styles.footer}>
          This area is restricted to authorized administrators only.<br />
          <Link href="/" className={styles.homeLink}>← Return to main site</Link>
        </p>
      </motion.div>
    </div>
  );
}
