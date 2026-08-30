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

import styles from "./dashboard.module.css";

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
    const url = `https://handyhubpro.ng/?partner=${partner.referralCode}`;
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
      if (!res.ok) throw new Error(data.error || "Failed to process withdrawal");
      setMessage(data.message || "Withdrawal request submitted successfully!");
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
      <div className={styles.unlockContainer}>
        <div className={styles.unlockCard}>
          <Award size={48} color="#00A8B5" style={{ marginBottom: 14 }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: 8, color: "#FFFFFF" }}>Partner Network Dashboard</h1>
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
                style={{ width: "100%", padding: "12px 14px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#FFFFFF", fontSize: "0.92rem", textAlign: "center", fontWeight: 700, boxSizing: "border-box" }}
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
              className={styles.btnPrimary}
              style={{ width: "100%", padding: 13, fontSize: "0.95rem" }}
            >
              {lookupLoading ? "Locating Partner Account..." : "Unlock Dashboard ➔"}
            </button>
          </form>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, flexWrap: "wrap" }}>
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
    <div className={styles.dashboard}>
      {/* Top Navbar */}
      <nav className={styles.topNav}>
        <div className={styles.topNavInner}>
          <div className={styles.brandGroup}>
            <Link href="/" className={styles.brandLogo}>
              <span style={{ color: "#00A8B5" }}>HandyHub</span> <span style={{ color: "#F59E0B" }}>Pro</span>
            </Link>
            <span className={styles.portalBadge}>
              PARTNER DASHBOARD
            </span>
          </div>

          <div className={styles.navActions}>
            {partner?.category === "ESTATE_MANAGER" && (
              <Link
                href={`/partners/estate?partnerId=${partner.partnerId}`}
                className={styles.switchBtn}
              >
                <Building2 size={14} />
                <span>Switch to Estate Portal</span>
              </Link>
            )}

            <div className={styles.partnerBadgeInfo}>
              <div className={styles.partnerName}>
                {partner?.companyName || partner?.name || "HandyHub Partner"}
              </div>
              <div className={styles.partnerIdLabel}>ID: {partner?.partnerId}</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className={styles.mainContainer}>
        {/* Banner */}
        <div className={styles.bannerCard}>
          <div className={styles.bannerDetails}>
            <div className={styles.badgePills}>
              <span
                className={styles.categoryPill}
                style={{
                  background: `${categoryMeta?.badgeColor || "#00A8B5"}20`,
                  color: categoryMeta?.badgeColor || "#00A8B5",
                  border: `1px solid ${categoryMeta?.badgeColor || "#00A8B5"}40`,
                }}
              >
                {categoryMeta?.label}
              </span>
              <span
                className={styles.tierPill}
                style={{
                  background: `${tierMeta?.color || "#CD7F32"}20`,
                  color: tierMeta?.color || "#CD7F32",
                  border: `1px solid ${tierMeta?.color || "#CD7F32"}40`,
                }}
              >
                ★ {tierMeta?.label} ({tierMeta?.multiplier}x Bonus)
              </span>
            </div>

            <h1 className={styles.bannerTitle}>
              Welcome back, {partner?.name}
            </h1>
            <p className={styles.bannerSubtitle}>
              {categoryMeta?.defaultRateDisplay} &bull; Payouts scheduled on 1st of every month.
            </p>
          </div>

          <div className={styles.bannerActions}>
            <button onClick={handleCopyLink} className={styles.btnPrimary}>
              <Copy size={16} />
              <span>{copiedLink ? "Link Copied!" : "Copy Referral Link"}</span>
            </button>

            <button onClick={() => setIsWithdrawOpen(true)} className={styles.btnOrange}>
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
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>AVAILABLE WALLET</span>
            <div className={styles.kpiValue} style={{ color: "#38BDF8" }}>
              ₦{(partner?.walletBalance || 0).toLocaleString()}
            </div>
            <span className={styles.kpiSubtext} style={{ color: "#10B981" }}>Direct Bank Transfer Ready</span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>LIFETIME EARNINGS</span>
            <div className={styles.kpiValue} style={{ color: "#F59E0B" }}>
              ₦{(partner?.totalEarnings || 0).toLocaleString()}
            </div>
            <span className={styles.kpiSubtext} style={{ color: "#94A3B8" }}>Total commissions accrued</span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>YOUR REFERRAL CODE</span>
            <div className={styles.kpiValue} style={{ color: "#FFFFFF", fontSize: "1.4rem" }}>
              {partner?.referralCode}
            </div>
            <span className={styles.kpiSubtext} style={{ color: "#38BDF8" }}>Vanity Tracking Active</span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>TOTAL REFERRALS</span>
            <div className={styles.kpiValue} style={{ color: "#10B981" }}>
              {attributions.length} Bound
            </div>
            <span className={styles.kpiSubtext} style={{ color: "#94A3B8" }}>Permanently attributed</span>
          </div>
        </div>

        {/* QR Code & Share Toolkit */}
        <div className={styles.qrToolkitCard}>
          <div className={styles.qrImageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={partner?.qrCodeUrl}
              alt="QR Code"
              className={styles.qrImage}
            />
          </div>

          <div className={styles.qrInfo}>
            <h3 className={styles.qrTitle}>
              Partner Marketing &amp; QR Toolkit
            </h3>
            <p className={styles.qrDesc}>
              Use your personalized QR code on physical business cards, tenancy move-in packs, flyers, YouTube video descriptions, and social bios. Every user who scans or visits via this QR is permanently bound to your account.
            </p>

            <div className={styles.qrBtnGroup}>
              <button
                onClick={async () => {
                  if (!partner) return;
                  const deepLink = `https://handyhubpro.ng/?partner=${partner.referralCode}`;
                  await downloadBrandedQrBadge({
                    deepLink,
                    partnerId: partner.partnerId,
                    referralCode: partner.referralCode,
                    title: partner.companyName || partner.name || "PARTNER MARKETING PASS",
                    subtitle: "SCAN TO VISIT HANDYHUB PRO",
                    filename: `HandyHub_Partner_QR_${partner.partnerId}.png`,
                  });
                }}
                className={styles.qrBtnSecondary}
              >
                <Download size={15} />
                <span>Download High-Res QR Badge</span>
              </button>

              <button onClick={handleCopyLink} className={styles.qrBtnTurquoise}>
                <Copy size={15} />
                <span>Copy Referral URL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Permanent Referrals Table */}
        <div className={styles.tableCard}>
          <h3 className={styles.tableTitle}>
            Permanently Bound Referrals (Customers &amp; Artisans)
          </h3>

          <div className={styles.tableScrollWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Referred Entity</th>
                  <th>Type</th>
                  <th>Attribution Mode</th>
                  <th>Completed Jobs</th>
                  <th>Total Revenue</th>
                  <th>Commission Earned</th>
                </tr>
              </thead>
              <tbody>
                {attributions.length > 0 ? (
                  attributions.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#FFFFFF" }}>{a.referredName}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{a.referredEmail}</div>
                      </td>
                      <td>
                        <span style={{ padding: "3px 8px", borderRadius: 4, background: a.referredUserRole === "PROFESSIONAL" ? "rgba(245, 158, 11, 0.15)" : "rgba(0, 168, 181, 0.15)", color: a.referredUserRole === "PROFESSIONAL" ? "#F59E0B" : "#38BDF8", fontSize: "0.75rem", fontWeight: 800 }}>
                          {a.referredUserRole}
                        </span>
                      </td>
                      <td style={{ color: "#94A3B8" }}>{a.attributionType}</td>
                      <td><strong>{a.totalJobs}</strong></td>
                      <td>₦{a.totalRevenueNgn.toLocaleString()}</td>
                      <td><strong style={{ color: "#10B981" }}>+₦{a.totalCommissionEarnedNgn.toLocaleString()}</strong></td>
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
        <div className={styles.modalOverlay} onClick={() => setIsWithdrawOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 6 }}>
              Request Commission Withdrawal
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginBottom: 20 }}>
              Available balance: <strong style={{ color: "#38BDF8" }}>₦{(partner?.walletBalance || 0).toLocaleString()}</strong>
            </p>

            <form onSubmit={handleWithdrawal}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                  Withdrawal Amount (₦)
                </label>
                <input
                  type="number"
                  min={10000}
                  max={partner?.walletBalance || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  style={{ width: "100%", padding: "12px", background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF", fontSize: "1.15rem", fontWeight: 800, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ background: "rgba(0,0,0,0.25)", padding: 14, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ fontSize: "0.75rem", color: "#64748B" }}>DISBURSEMENT DESTINATION</div>
                <div style={{ fontWeight: 800, color: "#FFFFFF" }}>{partner?.bankName || "Zenith Bank"}</div>
                <div style={{ color: "#F59E0B", fontWeight: 700 }}>{partner?.bankAccount || "2087654321"} &bull; {partner?.accountName || partner?.name}</div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setIsWithdrawOpen(false)} style={{ flex: 1, minWidth: 120, padding: 12, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#CBD5E1", fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, minWidth: 120, padding: 12, background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)", border: "none", borderRadius: 8, color: "#FFFFFF", fontWeight: 800, cursor: "pointer" }}>
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
