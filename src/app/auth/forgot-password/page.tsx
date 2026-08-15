"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      setSuccessMsg(data.message);
      if (data.resetUrlPreview) {
        setPreviewUrl(data.resetUrlPreview);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
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
        <Link href="/auth/login" className={styles.backLink} style={{ marginBottom: "var(--space-4)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "14px", color: "var(--text-secondary)", textDecoration: "none" }}>
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(14,165,233,0.1)", color: "#0EA5E9", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--space-3)" }}>
            <Mail size={28} />
          </div>
          <h1 className="h3">Forgot Your Password?</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)", marginTop: 4 }}>
            Enter your registered email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage} style={{ marginBottom: "var(--space-4)" }}>
            {error}
          </div>
        )}

        {successMsg ? (
          <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
            <CheckCircle2 size={48} color="#10B981" style={{ margin: "0 auto var(--space-3)" }} />
            <h3 className="h4" style={{ color: "#10B981", marginBottom: "var(--space-2)" }}>Reset Link Sent!</h3>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              {successMsg}
            </p>
            {previewUrl && (
              <div style={{ padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-primary)", textAlign: "left", marginBottom: "var(--space-4)" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#0EA5E9", display: "block", marginBottom: 2 }}>
                  🔗 Direct Demo Link (Click below to test reset flow):
                </span>
                <a href={previewUrl} style={{ fontSize: "12px", color: "var(--color-primary-400)", wordBreak: "break-all" }}>
                  {previewUrl}
                </a>
              </div>
            )}
            <Link href="/auth/login" className="btn btn-secondary btn-md w-full">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-md w-full" disabled={loading}>
              {loading ? "Sending Reset Link..." : "Send Password Reset Link"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
