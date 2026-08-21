"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Gift, QrCode, Copy, Check, Share2, Award, ShieldCheck,
  Star, Zap, Crown, ArrowLeft, RefreshCw, Users, CheckCircle2,
  Clock, AlertTriangle, Sparkles, Wrench, Wallet, ArrowRight, UserPlus
} from "lucide-react";
import { ReferralUserSummary, RecruiterTierLevel } from "@/lib/referrals/types";
import styles from "../dashboard.module.css";

export default function CustomerReferralsPage() {
  const [summary, setSummary] = useState<ReferralUserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"INVITE_FRIENDS" | "RECOMMEND_ARTISAN">("INVITE_FRIENDS");
  const [toast, setToast] = useState<string>("");

  // Recommend artisan form state
  const [artisanName, setArtisanName] = useState("");
  const [artisanPhone, setArtisanPhone] = useState("");
  const [artisanTrade, setArtisanTrade] = useState("Electrician");
  const [submittingArtisan, setSubmittingArtisan] = useState(false);

  const fetchReferralData = async () => {
    setLoading(true);
    let activeUserId = "";
    let activeEmail = "";

    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.id) activeUserId = parsed.id;
        if (parsed?.email) activeEmail = parsed.email;
      } catch {}
    }

    try {
      const res = await fetch(`/api/referrals/me?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok && data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.warn("Failed to fetch customer referral summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const handleCopyLink = () => {
    if (!summary?.referralLink) return;
    navigator.clipboard.writeText(summary.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    if (!summary) return;
    const isArtisanTab = activeSubTab === "RECOMMEND_ARTISAN";
    const text = isArtisanTab
      ? encodeURIComponent(
          `Hello! HandyHub Pro is recruiting top-tier verified artisans in Abuja & Lagos. Join the verified network using my link to get fast-track vetting + 0% platform commission on your first jobs! 👉 ${summary.referralLink}`
        )
      : encodeURIComponent(
          `Hey! I use HandyHub Pro for home repairs, plumbing, electricals & AC servicing. Use my referral link for an instant ₦2,000 voucher on your first booking! 👉 ${summary.referralLink}`
        );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleRecommendArtisanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artisanName || !artisanPhone) {
      setToast("Please provide the artisan's name and phone number.");
      return;
    }
    setSubmittingArtisan(true);
    setTimeout(() => {
      setSubmittingArtisan(false);
      setToast(`Recommendation logged! We will send a fast-track invite to ${artisanName}. 🎉`);
      setArtisanName("");
      setArtisanPhone("");
      setTimeout(() => setToast(""), 4500);
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#0F172A",
          color: "#FFFFFF",
          padding: "12px 20px",
          borderRadius: 10,
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          border: "1px solid #00A8B5",
          zIndex: 9999,
          fontSize: "13.5px",
          fontWeight: 600,
        }}>
          {toast}
        </div>
      )}

      {/* QR Modal */}
      {showQrModal && summary && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: 16,
        }} onClick={() => setShowQrModal(false)}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "28px 24px",
            maxWidth: 360,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 4px", fontSize: "1.25rem", color: "#0F172A", fontWeight: 800 }}>
              Scan Referral QR
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "#64748B" }}>
              Show this QR code to friends or neighbors to scan with their mobile camera.
            </p>
            <div style={{
              background: "#FFFFFF",
              padding: 16,
              borderRadius: 16,
              display: "inline-block",
              border: "2px solid #00A8B5",
              boxShadow: "0 4px 16px rgba(0, 168, 181, 0.15)",
              marginBottom: 16,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={summary.qrDataUrl} alt="Referral QR Code" style={{ width: 180, height: 180, display: "block" }} />
            </div>
            <div style={{ fontFamily: "monospace", fontWeight: 800, color: "#008B97", fontSize: "15px", marginBottom: 16 }}>
              {summary.referralCode}
            </div>
            <button onClick={() => setShowQrModal(false)} className="btn btn-primary btn-sm" style={{ width: "100%", borderRadius: 10 }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Top Breadcrumb / Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary, #64748B)", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <button onClick={fetchReferralData} className="btn btn-secondary btn-xs" style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 8 }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Hero Header */}
      <div style={{
        background: "linear-gradient(135deg, #00A8B5 0%, #007A87 100%)",
        borderRadius: 20,
        padding: "28px 24px",
        color: "#FFFFFF",
        marginBottom: 24,
        boxShadow: "0 10px 30px rgba(0, 168, 181, 0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ maxWidth: 620 }}>
            <span style={{
              fontSize: "11.5px",
              background: "rgba(255,255,255,0.2)",
              padding: "4px 10px",
              borderRadius: 99,
              fontWeight: 700,
              display: "inline-block",
              marginBottom: 8,
            }}>
              🎁 HandyHub Rewards & Discovery Center
            </span>
            <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, margin: "0 0 8px", color: "#FFFFFF" }}>
              Earn Up to ₦5,000 Service Credits per Referral
            </h1>
            <p style={{ fontSize: "13.5px", margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
              Invite your neighbors and family to HandyHub Pro or recommend your trusted offline handyman to earn non-cash platform credits applied automatically to your next home service!
            </p>
          </div>

          {/* Wallet Credit Capsule */}
          <div style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 16,
            padding: "16px 20px",
            textAlign: "right",
            minWidth: 200,
          }}>
            <span style={{ fontSize: "11.5px", opacity: 0.85, display: "block" }}>Available Service Credits</span>
            <strong style={{ fontSize: "1.8rem", fontWeight: 800, color: "#FFFFFF", display: "block" }}>
              ₦{(summary?.activeBenefits.serviceCreditBalanceNgn || 0).toLocaleString()}
            </strong>
            <Link href="/book" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: "11.5px",
              color: "#FFFFFF",
              background: "rgba(0,0,0,0.2)",
              padding: "4px 10px",
              borderRadius: 6,
              marginTop: 6,
              textDecoration: "none",
              fontWeight: 700,
            }}>
              Use on Booking <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Sub-Tab Selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: "1px solid var(--border-primary, #E2E8F0)", paddingBottom: 12 }}>
        <button
          onClick={() => setActiveSubTab("INVITE_FRIENDS")}
          style={{
            background: activeSubTab === "INVITE_FRIENDS" ? "#00A8B5" : "transparent",
            color: activeSubTab === "INVITE_FRIENDS" ? "#FFFFFF" : "var(--text-secondary, #64748B)",
            border: "none",
            padding: "8px 16px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Gift size={15} /> 1. Invite a Neighbor (Client ➔ Client)
        </button>
        <button
          onClick={() => setActiveSubTab("RECOMMEND_ARTISAN")}
          style={{
            background: activeSubTab === "RECOMMEND_ARTISAN" ? "#00A8B5" : "transparent",
            color: activeSubTab === "RECOMMEND_ARTISAN" ? "#FFFFFF" : "var(--text-secondary, #64748B)",
            border: "none",
            padding: "8px 16px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Wrench size={15} /> 2. Recommend an Artisan (₦5,000 Credit)
        </button>
      </div>

      {/* Program 1: Client to Client */}
      {activeSubTab === "INVITE_FRIENDS" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: "22px 24px", borderRadius: 16 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
              Share Your Client Referral Code
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
              Your friend gets ₦2,000 off their first booking. You receive ₦2,500 platform service credit upon completion!
            </p>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-tertiary, #F1F5F9)",
              border: "1px solid var(--border-primary, #E2E8F0)",
              padding: "10px 14px",
              borderRadius: 10,
              marginBottom: 14,
            }}>
              <input
                type="text"
                readOnly
                value={summary?.referralLink || "Generating..."}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "13px",
                  color: "var(--text-primary, #0F172A)",
                  width: "100%",
                  fontFamily: "monospace",
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  background: copied ? "#10B981" : "#00A8B5",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy Link"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={handleWhatsAppShare}
                style={{
                  flex: 1,
                  background: "#25D366",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Share2 size={15} /> WhatsApp Invite
              </button>
              <button
                onClick={() => setShowQrModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <QrCode size={15} /> Show QR Code
              </button>
            </div>
          </div>

          {/* Benefits Info Box */}
          <div className="card" style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(0, 168, 181, 0.04)", border: "1px solid rgba(0, 168, 181, 0.2)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 800, color: "#008B97" }}>
              How Customer Referral Works:
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "13px", color: "var(--text-secondary, #64748B)", lineHeight: 1.8 }}>
              <li>Send your link to friends, neighbors, or colleagues in Abuja and Lagos.</li>
              <li>They sign up and receive a <strong>₦2,000 Welcome Voucher</strong>.</li>
              <li>Once their verified technician completes their 1st booking, you get <strong>₦2,500 Service Credit</strong> automatically deposited in your wallet!</li>
              <li>Level up from <strong>Bronze</strong> to <strong>Ambassador</strong> for up to 2.0x bonus credits!</li>
            </ul>
          </div>
        </div>
      )}

      {/* Program 2: Client to Pro (Recommend Artisan) */}
      {activeSubTab === "RECOMMEND_ARTISAN" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: "22px 24px", borderRadius: 16 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
              Recommend Your Trusted Offline Handyman
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
              Know a great electrician, plumber, AC technician, or carpenter? We will fast-track their physical vetting.
            </p>

            <form onSubmit={handleRecommendArtisanSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 4 }}>
                  Artisan Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ibrahim Lawal"
                  value={artisanName}
                  onChange={(e) => setArtisanName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-primary, #E2E8F0)",
                    background: "var(--bg-elevated, #FFFFFF)",
                    color: "var(--text-primary, #0F172A)",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 4 }}>
                  Artisan Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0803 123 4567"
                  value={artisanPhone}
                  onChange={(e) => setArtisanPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-primary, #E2E8F0)",
                    background: "var(--bg-elevated, #FFFFFF)",
                    color: "var(--text-primary, #0F172A)",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 4 }}>
                  Primary Trade / Skill
                </label>
                <select
                  value={artisanTrade}
                  onChange={(e) => setArtisanTrade(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-primary, #E2E8F0)",
                    background: "var(--bg-elevated, #FFFFFF)",
                    color: "var(--text-primary, #0F172A)",
                    fontSize: "13px",
                  }}
                >
                  <option value="Electrician">Electrical Repairs & Wiring</option>
                  <option value="Plumber">Plumbing & Water Systems</option>
                  <option value="HVAC">AC Servicing & Gas Refill</option>
                  <option value="Carpentry">Carpentry & Furniture Works</option>
                  <option value="Painter">Painting & Wall Deco</option>
                  <option value="Solar">Solar & Inverter Installation</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingArtisan}
                className="btn btn-primary"
                style={{ width: "100%", borderRadius: 10, fontWeight: 700 }}
              >
                {submittingArtisan ? "Submitting..." : "Submit Handyman Recommendation"}
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(245, 158, 11, 0.04)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 800, color: "#D97706" }}>
              Artisan Discovery Bounty:
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "13px", color: "var(--text-secondary, #64748B)", lineHeight: 1.8 }}>
              <li>HandyHub Pro compliance officers conduct standard NIN/CAC & background verification.</li>
              <li>The referred artisan receives <strong>0% platform commission on their first 2 jobs</strong>.</li>
              <li>When they complete their first client job, you receive an instant <strong>₦5,000 Service Credit</strong> in your wallet!</li>
            </ul>
          </div>
        </div>
      )}

      {/* Recruiter Activity Feed */}
      <div className="card" style={{ padding: "22px 24px", borderRadius: 16 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
          Your Referral Activity
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
          Live status of all invitations sent from your account.
        </p>

        {!summary?.recentActivity || summary.recentActivity.length === 0 ? (
          <div style={{ padding: "30px 16px", textAlign: "center", background: "var(--bg-tertiary, #F1F5F9)", borderRadius: 12 }}>
            <Users size={36} color="#00A8B5" style={{ opacity: 0.6, marginBottom: 8 }} />
            <strong style={{ display: "block", fontSize: "13.5px", color: "var(--text-primary, #0F172A)" }}>No Referrals Recorded Yet</strong>
            <span style={{ fontSize: "12px", color: "var(--text-secondary, #64748B)" }}>
              Share your link to invite your first friend or recommend an artisan!
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {summary.recentActivity.map((act) => (
              <div
                key={act.id}
                style={{
                  background: "var(--bg-elevated, #FFFFFF)",
                  border: "1px solid var(--border-primary, #E2E8F0)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <strong style={{ fontSize: "13.5px", color: "var(--text-primary, #0F172A)", display: "block" }}>{act.refereeName}</strong>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary, #64748B)" }}>
                    Program: {act.programType.replace(/_/g, " ")} • {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "3px 9px",
                  borderRadius: 99,
                  color: act.status === "QUALIFIED" ? "#047857" : "#D97706",
                  background: act.status === "QUALIFIED" ? "#D1FAE5" : "#FEF3C7",
                }}>
                  {act.status === "QUALIFIED" ? "🏆 ₦2,500+ Credited" : "⏳ Pending First Booking"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
