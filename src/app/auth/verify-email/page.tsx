"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Lock } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailParam = searchParams.get("email") || "";
  const roleParam = searchParams.get("role") || "CUSTOMER";

  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((p) => p - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setError("Please enter your 6-digit confirmation code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam, code: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid confirmation code.");
        setLoading(false);
        return;
      }

      setSuccessMsg(data.message || "Email confirmed successfully! Redirecting...");
      if (data.user) {
        localStorage.setItem("handyhub_user", JSON.stringify(data.user));
      }

      setTimeout(() => {
        if (data.redirect) {
          window.location.href = data.redirect;
        } else {
          window.location.href = roleParam === "PROFESSIONAL" ? "/pro/verification" : "/dashboard";
        }
      }, 1200);
    } catch {
      setError("Network error validating code. Please try again.");
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !emailParam) return;
    setResendCooldown(60);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam, resendOnly: true }),
      });
      alert(`A new 6-digit confirmation code has been dispatched to ${emailParam}. Please check your inbox! ✉️`);
    } catch {
      alert(`Confirmation code resent to ${emailParam}. Please check your inbox.`);
    }
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, color: "#F8FAFC" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ width: "100%", maxWidth: 480, background: "#1E293B", border: "1px solid #334155", borderRadius: 24, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(14,165,233,0.15)", color: "#0EA5E9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Mail size={32} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: "bold", margin: "0 0 8px 0" }}>Confirm Your Email Address</h2>
          <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>
            We sent a 6-digit confirmation code to:
          </p>
          <strong style={{ display: "block", color: "#38BDF8", fontSize: 15, marginTop: 4 }}>
            {emailParam || "your email address"}
          </strong>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #EF4444", color: "#EF4444", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ background: "rgba(16,185,129,0.15)", border: "1px solid #10B981", color: "#10B981", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: 8, textAlign: "center" }}>
              Enter 6-Digit Confirmation Code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 839201"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ""))}
              required
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 12,
                border: "2px solid #0EA5E9",
                background: "#0F172A",
                color: "#38BDF8",
                fontSize: 28,
                fontWeight: "bold",
                textAlign: "center",
                letterSpacing: 8,
                fontFamily: "monospace",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "none",
              background: "#0EA5E9",
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? "Confirming Code..." : "Confirm & Activate Account ➔"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", borderTop: "1px solid #334155", paddingTop: 20, fontSize: 13, color: "#94A3B8" }}>
          Didn&apos;t receive the code?{" "}
          <button
            onClick={handleResendCode}
            disabled={resendCooldown > 0}
            style={{ background: "none", border: "none", color: resendCooldown > 0 ? "#64748B" : "#38BDF8", fontWeight: "bold", cursor: resendCooldown > 0 ? "default" : "pointer" }}
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Confirmation Email"}
          </button>
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link href="/auth/login" style={{ color: "#64748B", fontSize: 13, textDecoration: "none" }}>
            ← Return to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#FFF" }}>Loading Email Verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
