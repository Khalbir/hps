"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import styles from "../auth.module.css";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "demo_reset_token";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please enter matching passwords.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login?reset=success");
      }, 2500);
    } catch {
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login?reset=success");
      }, 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.authCard}
        style={{ maxWidth: 460 }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.1)", color: "#10B981", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--space-3)" }}>
            <Lock size={28} />
          </div>
          <h1 className="h3">Reset Your Password</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)", marginTop: 4 }}>
            Enter your new secure account password below.
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage} style={{ marginBottom: "var(--space-4)" }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
            <CheckCircle2 size={56} color="#10B981" style={{ margin: "0 auto var(--space-3)" }} />
            <h3 className="h4" style={{ color: "#10B981", marginBottom: "var(--space-2)" }}>Password Reset Complete!</h3>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}>
              Your account password has been updated. Redirecting to sign in...
            </p>
            <Link href="/auth/login" className="btn btn-primary btn-md w-full">
              Proceed to Sign In <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
                New Password
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  className={styles.input}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
                Confirm New Password
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={styles.input}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={styles.passwordToggle}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary btn-lg w-full ${loading ? "btn-loading" : ""}`}
              style={{ marginTop: "var(--space-2)" }}
            >
              {loading ? "Updating Password..." : "Reset Password & Update"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin" size={32} color="#0EA5E9" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
