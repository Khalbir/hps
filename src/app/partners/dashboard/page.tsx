"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Wallet,
  Users,
  Award,
  Copy,
  Download,
  Share2,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  QrCode,
  Calendar,
  ExternalLink,
  ChevronRight,
  Building2,
} from "lucide-react";
import { PartnerProfile, PartnerAttribution, PartnerPayoutTransaction } from "@/lib/partners/types";
import { PARTNER_CATEGORIES_METADATA, PARTNER_TIERS } from "@/lib/partners/config";
import { downloadBrandedQrBadge } from "@/lib/qr-code";

export default function PartnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#0B132B", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8", fontWeight: 700 }}>
          Loading Partner Dashboard...
        </div>
      }
    >
      <PartnerDashboardContent />
    </Suspense>
  );
}

function PartnerDashboardContent() {
  const searchParams = useSearchParams();
  const partnerParam = searchParams.get("partnerId") || searchParams.get("code") || searchParams.get("email") || "";

  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [attributions, setAttributions] = useState<PartnerAttribution[]>([]);
  const [payouts, setPayouts] = useState<PartnerPayoutTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(30000);
  const [message, setMessage] = useState("");

  const [lookupIdentifier, setLookupIdentifier] = useState(partnerParam || "");
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const fetchDashboardData = async (overrideIdentifier?: string) => {
    let identifier = overrideIdentifier || partnerParam;

    if (!identifier && typeof window !== "undefined") {
      identifier = sessionStorage.getItem("hhp_partner_id") || "";
      if (!identifier) {
        try {
          const cached = localStorage.getItem("hhp_current_partner");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.partnerId) identifier = parsed.partnerId;
          }
        } catch {}
      }
    }

    if (!identifier) {
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem("hhp_current_partner");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && (parsed.partnerId || parsed.id)) {
              setPartner(parsed);
              setLoading(false);
              return;
            }
          }
        } catch {}
      }
      setPartner(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLookupError("");
      const queryParams = new URLSearchParams();
      if (identifier) queryParams.set("partnerId", identifier);
      const codeParam = searchParams.get("code");
      if (codeParam) queryParams.set("code", codeParam);
      const emailParam = searchParams.get("email");
      if (emailParam) queryParams.set("email", emailParam);

      const res = await fetch(`/api/partners/me?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success && data.partner) {
        setPartner(data.partner);
        setAttributions(data.attributions || []);
        setPayouts(data.payouts || []);
        if (typeof window !== "undefined") {
          localStorage.setItem("hhp_current_partner", JSON.stringify(data.partner));
          sessionStorage.setItem("hhp_partner_id", data.partner.partnerId);
        }
      } else {
        if (typeof window !== "undefined") {
          try {
            const cached = localStorage.getItem("hhp_current_partner");
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && (parsed.partnerId || parsed.id || parsed.email)) {
                setPartner(parsed);
                setLoading(false);
                return;
              }
            }
          } catch {}
        }
        setPartner(null);
        if (overrideIdentifier) {
          setLookupError("No partner account found with this Partner ID, Code, or Email.");
        }
      }
    } catch (err) {
      console.error("Failed to load partner dashboard", err);
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem("hhp_current_partner");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed) {
              setPartner(parsed);
              setLoading(false);
              return;
            }
          }
        } catch {}
      }
      setPartner(null);
    } finally {
      setLoading(false);
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [partnerParam]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupIdentifier.trim()) return;
    setLookupLoading(true);
    fetchDashboardData(lookupIdentifier.trim());
  };

  const handleCopyLink = () => {
    if (!partner) return;
    const url = `https://handyhubpro.ng/book?partner=${partner.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    try {
      const res = await fetch("/api/partners/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: partner.id,
          amount: withdrawAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal failed");
      setMessage(data.message);
      setIsWithdrawOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const categoryMeta = partner ? PARTNER_CATEGORIES_METADATA[partner.category] : null;
  const tierMeta = partner ? PARTNER_TIERS[partner.tierLevel] : null;

  if (!loading && !partner) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B132B", color: "#F8FAFC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 480, width: "100%", background: "#1E293B", border: "1px solid rgba(0, 168, 181, 0.3)", borderRadius: 16, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
          <Award size={48} color="#00A8B5" style={{ marginBottom: 14 }} />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: 8, color: "#FFFFFF" }}>Partner Network Dashboard</h1>
          <p style={{ color: "#94A3B8", fontSize: "0.88rem", margin: "0 auto 20px", lineHeight: 1.5 }}>
            Enter your credentials to unlock your referral statistics, wallet balance, and marketing assets.
          </p>

          <form onSubmit={handleLookupSubmit} style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <input
                type="text"
                value={lookupIdentifier}
                onChange={(e) => setLookupIdentifier(e.target.value)}
                placeholder="Enter Partner ID, Referral Code, or Email"
                style={{ width: "100%", padding: "12px 16px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#FFFFFF", fontSize: "0.95rem", textAlign: "center", fontWeight: 700 }}
              />
            </div>

            {lookupError && (
              <div style={{ color: "#EF4444", fontSize: "0.82rem", marginBottom: 12, fontWeight: 600 }}>
                {lookupError}
              </div>
            )}

            <button
              type="submit"
              disabled={lookupLoading || !lookupIdentifier.trim()}
              style={{ width: "100%", padding: 12, borderRadius: 10, background: "linear-gradient(135deg, #00A8B5 0%, #0284C7 100%)", color: "#FFFFFF", fontWeight: 800, fontSize: "1rem", border: "none", cursor: "pointer" }}
            >
              {lookupLoading ? "Locating Partner Account..." : "Unlock Dashboard ➔"}
            </button>
          </form>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
            <Link href="/partners" style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: "#CBD5E1", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>
              Join Partner Network
            </Link>
            <Link href="/" style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: "#CBD5E1", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B132B", color: "#F8FAFC", paddingBottom: 80 }}>
      {/* Top Navbar */}
      <nav
        style={{
          background: "#070D1E",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ textDecoration: "none", color: "#FFFFFF", fontWeight: 900, fontSize: "1.2rem" }}>
            <span style={{ color: "#00A8B5" }}>HandyHub</span> <span style={{ color: "#F59E0B" }}>Pro</span>
          </Link>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 9999,
              background: "rgba(0, 168, 181, 0.15)",
              color: "#38BDF8",
              fontSize: "0.75rem",
              fontWeight: 800,
            }}
          >
            PARTNER DASHBOARD
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {partner?.category === "ESTATE_MANAGER" && (
            <Link
              href={`/partners/estate?partnerId=${partner.partnerId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                background: "rgba(0, 168, 181, 0.2)",
                color: "#38BDF8",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              <Building2 size={14} />
              <span>Switch to Estate Portal</span>
            </Link>
          )}

          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.92rem" }}>
              {partner?.companyName || partner?.name || "HandyHub Partner"}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>ID: {partner?.partnerId}</div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        {/* Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
            border: "1px solid rgba(0, 168, 181, 0.3)",
            borderRadius: 20,
            padding: 32,
            marginBottom: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: `${categoryMeta?.badgeColor || "#00A8B5"}20`,
                  color: categoryMeta?.badgeColor || "#00A8B5",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                }}
              >
                {categoryMeta?.label}
              </span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: `${tierMeta?.color || "#CD7F32"}20`,
                  color: tierMeta?.color || "#CD7F32",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                }}
              >
                ★ {tierMeta?.label} ({tierMeta?.multiplier}x Bonus)
              </span>
            </div>

            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#FFFFFF", margin: "0 0 6px 0" }}>
              Welcome back, {partner?.name}
            </h1>
            <p style={{ color: "#94A3B8", margin: 0, fontSize: "0.95rem" }}>
              {categoryMeta?.defaultRateDisplay} &bull; Payouts scheduled on 1st of every month.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleCopyLink}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #00A8B5 0%, #0284C7 100%)",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <Copy size={16} />
              <span>{copiedLink ? "Link Copied!" : "Copy Booking Link"}</span>
            </button>

            <button
              onClick={() => setIsWithdrawOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <ArrowUpRight size={16} />
              <span>Withdraw Commissions</span>
            </button>
          </div>
        </div>

        {message && (
          <div
            style={{
              padding: 16,
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 10,
              color: "#6EE7B7",
              marginBottom: 24,
            }}
          >
            {message}
          </div>
        )}

        {/* KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 36 }}>
          <div style={{ background: "#1E293B", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>AVAILABLE WALLET</span>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#38BDF8", margin: "6px 0" }}>
              ₦{(partner?.walletBalance || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: "0.8rem", color: "#10B981" }}>Direct Bank Transfer Ready</span>
          </div>

          <div style={{ background: "#1E293B", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>LIFETIME EARNINGS</span>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#F59E0B", margin: "6px 0" }}>
              ₦{(partner?.totalEarnings || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>Total commissions accrued</span>
          </div>

          <div style={{ background: "#1E293B", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>YOUR REFERRAL CODE</span>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#FFFFFF", margin: "6px 0" }}>
              {partner?.referralCode}
            </div>
            <span style={{ fontSize: "0.8rem", color: "#38BDF8" }}>Vanity Tracking Active</span>
          </div>

          <div style={{ background: "#1E293B", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>TOTAL REFERRALS</span>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#10B981", margin: "6px 0" }}>
              {attributions.length} Bound
            </div>
            <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>Permanently attributed</span>
          </div>
        </div>

        {/* QR Code & Share Toolkit */}
        <div
          style={{
            background: "#1E293B",
            border: "1px solid rgba(0, 168, 181, 0.25)",
            borderRadius: 18,
            padding: 28,
            marginBottom: 36,
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 28,
            alignItems: "center",
          }}
        >
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={partner?.qrCodeUrl}
              alt="QR Code"
              style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>
              Partner Marketing &amp; QR Toolkit
            </h3>
            <p style={{ color: "#94A3B8", fontSize: "0.92rem", lineHeight: 1.5, marginBottom: 20 }}>
              Use your personalized QR code on physical business cards, tenancy move-in packs, flyers, YouTube video descriptions, and social bios. Every user who scans or books via this QR is permanently bound to your account.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={async () => {
                  if (!partner) return;
                  const deepLink = `https://handyhubpro.ng/book?partner=${partner.referralCode}`;
                  await downloadBrandedQrBadge({
                    deepLink,
                    partnerId: partner.partnerId,
                    referralCode: partner.referralCode,
                    title: partner.companyName || partner.name || "PARTNER MARKETING PASS",
                    subtitle: "SCAN TO BOOK VERIFIED ARTISANS",
                    filename: `HandyHub_Partner_QR_${partner.partnerId}.png`,
                  });
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.08)",
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                <Download size={15} />
                <span>Download High-Res QR Badge</span>
              </button>

              <button
                onClick={handleCopyLink}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 8,
                  background: "rgba(0, 168, 181, 0.2)",
                  color: "#38BDF8",
                  border: "1px solid rgba(0, 168, 181, 0.4)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                <Copy size={15} />
                <span>Copy Referral URL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Permanent Referrals Table */}
        <div style={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 28 }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 16 }}>
            Permanently Bound Referrals (Customers &amp; Artisans)
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", fontSize: "0.8rem", textTransform: "uppercase" }}>
                  <th style={{ padding: 12 }}>Referred Entity</th>
                  <th style={{ padding: 12 }}>Type</th>
                  <th style={{ padding: 12 }}>Attribution Mode</th>
                  <th style={{ padding: 12 }}>Completed Jobs</th>
                  <th style={{ padding: 12 }}>Total Revenue</th>
                  <th style={{ padding: 12 }}>Commission Earned</th>
                </tr>
              </thead>
              <tbody>
                {attributions.length > 0 ? (
                  attributions.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.9rem" }}>
                      <td style={{ padding: 14 }}>
                        <div style={{ fontWeight: 700, color: "#FFFFFF" }}>{a.referredName}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{a.referredEmail}</div>
                      </td>
                      <td style={{ padding: 14 }}>
                        <span style={{ padding: "3px 8px", borderRadius: 4, background: a.referredUserRole === "PROFESSIONAL" ? "rgba(245, 158, 11, 0.15)" : "rgba(0, 168, 181, 0.15)", color: a.referredUserRole === "PROFESSIONAL" ? "#F59E0B" : "#38BDF8", fontSize: "0.75rem", fontWeight: 800 }}>
                          {a.referredUserRole}
                        </span>
                      </td>
                      <td style={{ padding: 14, color: "#94A3B8" }}>{a.attributionType}</td>
                      <td style={{ padding: 14 }}><strong>{a.totalJobs}</strong></td>
                      <td style={{ padding: 14 }}>₦{a.totalRevenueNgn.toLocaleString()}</td>
                      <td style={{ padding: 14 }}><strong style={{ color: "#10B981" }}>+₦{a.totalCommissionEarnedNgn.toLocaleString()}</strong></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#94A3B8", padding: 24 }}>
                      No referrals registered yet. Share your code <strong>{partner?.referralCode}</strong> to start earning!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {isWithdrawOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 9999,
          }}
          onClick={() => setIsWithdrawOpen(false)}
        >
          <div
            style={{
              background: "#0F172A",
              border: "1px solid rgba(0, 168, 181, 0.4)",
              borderRadius: 18,
              maxWidth: 480,
              width: "100%",
              padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 6 }}>
              Request Commission Withdrawal
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginBottom: 20 }}>
              Available balance: <strong style={{ color: "#38BDF8" }}>₦{(partner?.walletBalance || 0).toLocaleString()}</strong>
            </p>

            <form onSubmit={handleWithdrawal}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                  Withdrawal Amount (₦)
                </label>
                <input
                  type="number"
                  min={10000}
                  max={partner?.walletBalance || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  style={{ width: "100%", padding: "12px", background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF", fontSize: "1.2rem", fontWeight: 800 }}
                />
              </div>

              <div style={{ background: "rgba(0,0,0,0.25)", padding: 14, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ fontSize: "0.75rem", color: "#64748B" }}>DISBURSEMENT DESTINATION</div>
                <div style={{ fontWeight: 800, color: "#FFFFFF" }}>{partner?.bankName || "Zenith Bank"}</div>
                <div style={{ color: "#F59E0B", fontWeight: 700 }}>{partner?.bankAccount || "2087654321"} &bull; {partner?.accountName || partner?.name}</div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setIsWithdrawOpen(false)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#CBD5E1", fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: 12, background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)", border: "none", borderRadius: 8, color: "#FFFFFF", fontWeight: 800, cursor: "pointer" }}>
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
