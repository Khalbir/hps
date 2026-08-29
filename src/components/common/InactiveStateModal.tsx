"use client";

import { useState } from "react";
import { Sparkles, MapPin, CheckCircle2, AlertTriangle, X, Bell, ShieldCheck } from "lucide-react";

interface InactiveStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  stateName: string;
  defaultEmail?: string;
  defaultPhone?: string;
  userType?: "CUSTOMER" | "ARTISAN" | "ESTATE_MANAGER" | "MERCHANT";
}

export function InactiveStateModal({
  isOpen,
  onClose,
  stateName,
  defaultEmail = "",
  defaultPhone = "",
  userType = "CUSTOMER",
}: InactiveStateModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [cityOrLga, setCityOrLga] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      setError("Please provide your name and email address.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/states/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateName,
          fullName,
          email,
          phone,
          userType,
          city: cityOrLga,
          lga: cityOrLga,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to join waitlist.");
      }
    } catch {
      setError("Network connection issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(3, 7, 18, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(180deg, #0F172A 0%, #070D18 100%)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(14, 165, 233, 0.15)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "520px",
          padding: "32px",
          color: "#F8FAFC",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "rgba(255, 255, 255, 0.08)",
            border: "none",
            borderRadius: "50%",
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94A3B8",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.15)",
                border: "2px solid #10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                color: "#10B981",
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>
              You&apos;re on the Priority List!
            </h3>
            <p style={{ color: "#94A3B8", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 24 }}>
              Thank you for your interest in HandyHub Pro in <strong style={{ color: "#38BDF8" }}>{stateName}</strong>.
              We will send your <strong>₦5,000 launch coupon</strong> and dispatch notification to <span style={{ color: "#F59E0B" }}>{email}</span> the moment operations go live.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                padding: "12px 28px",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Got it, Thank You
            </button>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "30px",
                color: "#F59E0B",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              <MapPin size={13} /> Expanding Soon to {stateName}
            </div>

            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>
              HandyHub Pro is coming to {stateName}!
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: 20 }}>
              Official artisan vetting and dispatch infrastructure for <strong>{stateName}</strong> is currently in progress. Join our priority waitlist to get <strong>₦5,000 in free service credits</strong> upon launch!
            </p>

            {error && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#FCA5A5",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 5 }}>
                  Full Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chukwuemeka Adeleke"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 5 }}>
                    Email Address <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 5 }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="08012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 5 }}>
                  City or Local Government Area (LGA)
                </label>
                <input
                  type="text"
                  placeholder="e.g. GRA Phase 2, Central Area"
                  value={cityOrLga}
                  onChange={(e) => setCityOrLga(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "none",
                    borderRadius: "10px",
                    color: "#94A3B8",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: "12px",
                    background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
                    border: "none",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Bell size={16} />
                  {submitting ? "Joining Waitlist..." : "Get Priority Launch Access"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
