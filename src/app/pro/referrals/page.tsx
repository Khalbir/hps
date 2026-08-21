"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import {
  Gift, QrCode, Copy, Check, Share2, Award, ShieldCheck,
  Star, Zap, Crown, ArrowRight, RefreshCw, Users, CheckCircle2,
  Clock, AlertTriangle, Sparkles, ShoppingBag, Percent, Wrench
} from "lucide-react";
import { ReferralUserSummary, RecruiterTierLevel } from "@/lib/referrals/types";

export default function ProReferralsPage() {
  const [summary, setSummary] = useState<ReferralUserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");

  const fetchReferralData = async () => {
    setLoading(true);
    let activeUserId = "";
    let activeEmail = "";

    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
        if (parsed?.user?.email || parsed?.email) activeEmail = parsed.user?.email || parsed.email;
      } catch {}
    }

    try {
      const res = await fetch(`/api/referrals/me?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok && data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.warn("Failed to fetch referral summary:", err);
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

  const handleCopyCode = () => {
    if (!summary?.referralCode) return;
    navigator.clipboard.writeText(summary.referralCode);
    setToast("Referral code copied to clipboard! 📋");
    setTimeout(() => setToast(""), 3000);
  };

  const handleWhatsAppShare = () => {
    if (!summary) return;
    const text = encodeURIComponent(
      `Hello! Join HandyHub Pro's verified artisan network using my invite link and get an instant ₦3,000 Tool Voucher + 50% commission discount on your first jobs! 👉 ${summary.referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleRedeemReward = async (rewardId: string) => {
    setRedeemingId(rewardId);
    try {
      const res = await fetch("/api/referrals/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast(data.message || "Reward token redeemed successfully! 🎉");
        fetchReferralData();
      } else {
        setToast(data.error || "Failed to redeem reward.");
      }
    } catch {
      setToast("Network error redeeming reward.");
    } finally {
      setRedeemingId(null);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const getTierIcon = (level: RecruiterTierLevel) => {
    switch (level) {
      case "AMBASSADOR": return <Crown size={22} color="#8B5CF6" />;
      case "PLATINUM": return <Zap size={22} color="#00C4D4" />;
      case "GOLD": return <Star size={22} color="#F59E0B" />;
      case "SILVER": return <ShieldCheck size={22} color="#94A3B8" />;
      default: return <Award size={22} color="#CD7F32" />;
    }
  };

  return (
    <ProLayoutShell>
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
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span>{toast}</span>
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
            background: "var(--bg-elevated, #FFFFFF)",
            border: "1px solid var(--border-primary, #E2E8F0)",
            borderRadius: 20,
            padding: "28px 24px",
            maxWidth: 360,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 4px", fontSize: "1.25rem", color: "var(--text-primary, #0F172A)", fontWeight: 800 }}>
              On-Site QR Invite
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
              Have fellow technicians or clients scan this QR code with their phone camera to join instantly.
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
              Close QR Window
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
            <h1 style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.85rem)", fontWeight: 800, color: "var(--text-primary, #0F172A)", margin: 0 }}>
              Artisan Referral Hub & Milestone Rewards
            </h1>
            <span style={{
              fontSize: "11.5px",
              background: "rgba(0, 168, 181, 0.12)",
              color: "#008B97",
              padding: "3px 10px",
              borderRadius: 99,
              fontWeight: 700,
              border: "1px solid rgba(0, 168, 181, 0.3)",
            }}>
              Non-Cash Benefit Vault 🛡️
            </span>
          </div>
          <p style={{ color: "var(--text-secondary, #64748B)", fontSize: "13.5px", margin: 0 }}>
            Invite fellow verified artisans to HandyHub Pro. Unlock 0% commission waiver passes, marketplace tool vouchers, and level up your Recruiter Tier.
          </p>
        </div>
        <button onClick={fetchReferralData} className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10 }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Ledger
        </button>
      </div>

      {/* Recruiter Tier Progression Banner */}
      {summary && (
        <div style={{
          background: "linear-gradient(135deg, rgba(0, 168, 181, 0.08) 0%, rgba(255, 122, 26, 0.08) 100%)",
          border: "1.5px solid rgba(0, 168, 181, 0.25)",
          borderRadius: 18,
          padding: "20px 22px",
          marginBottom: 24,
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "var(--bg-elevated, #FFFFFF)",
                border: `2px solid ${summary.currentTier.badgeColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 12px ${summary.currentTier.badgeColor}33`,
              }}>
                {getTierIcon(summary.currentTier.level)}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: "16px", color: "var(--text-primary, #0F172A)" }}>
                    {summary.currentTier.name}
                  </strong>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    background: summary.currentTier.badgeColor,
                    padding: "2px 8px",
                    borderRadius: 99,
                  }}>
                    {summary.currentTier.multiplier}x Multiplier
                  </span>
                </div>
                <span style={{ fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
                  {summary.totalQualifiedReferrals} Qualified Artisan Referrals Credited
                </span>
              </div>
            </div>

            {summary.nextTier && (
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary, #64748B)", display: "block" }}>
                  Next Milestone: <strong style={{ color: summary.nextTier.badgeColor }}>{summary.nextTier.name}</strong>
                </span>
                <span style={{ fontSize: "11px", color: "#008B97", fontWeight: 700 }}>
                  {summary.nextTier.minReferrals - summary.totalQualifiedReferrals} more verified referral(s) needed for {summary.nextTier.multiplier}x rewards
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {summary.nextTier && (
            <div>
              <div style={{ height: 8, background: "rgba(0,0,0,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                <div style={{
                  width: `${summary.progressToNextTierPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #00A8B5, #FF7A1A)",
                  borderRadius: 99,
                  transition: "width 0.5s ease",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "var(--text-secondary, #64748B)", fontWeight: 600 }}>
                <span>{summary.currentTier.name} ({summary.currentTier.minReferrals} refs)</span>
                <span>{summary.progressToNextTierPercent}% Progress</span>
                <span>{summary.nextTier.name} ({summary.nextTier.minReferrals} refs)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Referral Link & Share Suite */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 24 }}>
        {/* Share Card */}
        <div className="card" style={{ padding: "20px 22px", borderRadius: 16 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>
            Your Unique Artisan Invite Link
          </h3>
          <p style={{ margin: "0 0 14px", fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
            Share with colleagues, technicians, and apprentice masters.
          </p>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-tertiary, #F1F5F9)",
            border: "1px solid var(--border-primary, #E2E8F0)",
            padding: "8px 12px",
            borderRadius: 10,
            marginBottom: 12,
          }}>
            <input
              type="text"
              readOnly
              value={summary?.referralLink || "Generating invite link..."}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "12.5px",
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
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                flexShrink: 0,
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={handleWhatsAppShare}
              style={{
                flex: 1,
                minWidth: 130,
                background: "#25D366",
                color: "#FFFFFF",
                border: "none",
                padding: "9px 14px",
                borderRadius: 10,
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Share2 size={14} /> WhatsApp Invite
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, minWidth: 120, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <QrCode size={14} /> Scan QR Code
            </button>
          </div>
        </div>

        {/* Benefits Overview Box */}
        <div className="card" style={{ padding: "20px 22px", borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>
              Active Benefit Balances
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
              All rewards are non-cash platform utility assets.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "rgba(0, 168, 181, 0.08)", border: "1px solid rgba(0, 168, 181, 0.25)", padding: "10px 12px", borderRadius: 10 }}>
                <span style={{ fontSize: "11px", color: "#008B97", fontWeight: 700, display: "block" }}>0% Commission Passes</span>
                <strong style={{ fontSize: "1.4rem", color: "#008B97" }}>{summary?.activeBenefits.activeCommissionPasses || 0}</strong>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #64748B)", display: "block" }}>Jobs with zero fees</span>
              </div>
              <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", padding: "10px 12px", borderRadius: 10 }}>
                <span style={{ fontSize: "11px", color: "#D97706", fontWeight: 700, display: "block" }}>Marketplace Tool Vouchers</span>
                <strong style={{ fontSize: "1.4rem", color: "#D97706" }}>{summary?.activeBenefits.activeMarketplaceVouchersCount || 0}</strong>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #64748B)", display: "block" }}>Active vouchers</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: "11.5px", color: "#10B981", display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
            <CheckCircle2 size={13} /> Multiplier applied automatically upon referee audit qualification.
          </div>
        </div>
      </div>

      {/* Non-Cash Rewards Vault */}
      <div className="card" style={{ marginBottom: 24, padding: "20px 22px", borderRadius: 16 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
          Your Non-Cash Rewards Vault
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
          Redeem your unlocked commission waiver tokens and tool vouchers.
        </p>

        {!summary?.rewardsVault || summary.rewardsVault.length === 0 ? (
          <div style={{ padding: "30px 16px", textAlign: "center", background: "var(--bg-tertiary, #F1F5F9)", borderRadius: 12 }}>
            <Gift size={36} color="#00A8B5" style={{ opacity: 0.6, marginBottom: 8 }} />
            <strong style={{ display: "block", fontSize: "13.5px", color: "var(--text-primary, #0F172A)" }}>No Rewards Unlocked Yet</strong>
            <span style={{ fontSize: "12px", color: "var(--text-secondary, #64748B)" }}>
              Share your invite link with artisans. When they pass verification and complete their 1st job, rewards will appear here!
            </span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {summary.rewardsVault.map((rew) => (
              <div
                key={rew.id}
                style={{
                  background: rew.isRedeemed ? "var(--bg-tertiary, #F1F5F9)" : "var(--bg-elevated, #FFFFFF)",
                  border: rew.isRedeemed ? "1px dashed #CBD5E1" : "1.5px solid rgba(0, 168, 181, 0.3)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  opacity: rew.isRedeemed ? 0.65 : 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{
                      fontSize: "10.5px",
                      fontWeight: 800,
                      color: rew.benefitType === "COMMISSION_DISCOUNT_TOKEN" ? "#008B97" : "#D97706",
                      background: rew.benefitType === "COMMISSION_DISCOUNT_TOKEN" ? "rgba(0,168,181,0.12)" : "rgba(245,158,11,0.12)",
                      padding: "2px 7px",
                      borderRadius: 6,
                    }}>
                      {rew.benefitType === "COMMISSION_DISCOUNT_TOKEN" ? "0% Fee Pass" : "Tool Voucher"}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary, #64748B)", fontFamily: "monospace" }}>
                      {rew.referenceCode}
                    </span>
                  </div>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary, #0F172A)", display: "block", marginBottom: 3 }}>
                    {rew.title}
                  </strong>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary, #64748B)", lineHeight: 1.4 }}>
                    {rew.description}
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-primary, #E2E8F0)", paddingTop: 10 }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary, #64748B)" }}>
                    {rew.isRedeemed ? "Redeemed" : `${rew.remainingUses} use(s) remaining`}
                  </span>
                  {!rew.isRedeemed && (
                    <button
                      onClick={() => handleRedeemReward(rew.id)}
                      disabled={redeemingId === rew.id}
                      className="btn btn-primary btn-xs"
                      style={{ borderRadius: 8, fontSize: "11px", padding: "4px 10px" }}
                    >
                      {redeemingId === rew.id ? "Applying..." : "Use Reward"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Referral Activity Ledger */}
      <div className="card" style={{ padding: "20px 22px", borderRadius: 16 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
          Artisan Recruitment Activity Ledger
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
          Track the verification audit and first completed job progress of all your invited artisans.
        </p>

        {!summary?.recentActivity || summary.recentActivity.length === 0 ? (
          <div style={{ padding: "30px 16px", textAlign: "center", background: "var(--bg-tertiary, #F1F5F9)", borderRadius: 12 }}>
            <Users size={36} color="#00A8B5" style={{ opacity: 0.6, marginBottom: 8 }} />
            <strong style={{ display: "block", fontSize: "13.5px", color: "var(--text-primary, #0F172A)" }}>No Referrals Recorded Yet</strong>
            <span style={{ fontSize: "12px", color: "var(--text-secondary, #64748B)" }}>
              Share your code <strong style={{ color: "#008B97" }}>{summary?.referralCode}</strong> to start recruiting!
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
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #00A8B5, #008B97)",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {act.refereeName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <strong style={{ fontSize: "13.5px", color: "var(--text-primary, #0F172A)" }}>{act.refereeName}</strong>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary, #64748B)" }}>({act.refereeEmail})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, fontSize: "11px", color: "var(--text-secondary, #64748B)" }}>
                      <span>Audit Vetting: {act.isVerifiedReferee ? "✅ Complete" : "⏳ Pending"}</span>
                      <span>•</span>
                      <span>1st Job: {act.hasCompletedFirstJob ? "✅ Completed" : "⏳ In Progress"}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "3px 9px",
                    borderRadius: 99,
                    color: act.status === "QUALIFIED" ? "#047857" : act.status === "FLAGGED_FRAUD" ? "#DC2626" : "#D97706",
                    background: act.status === "QUALIFIED" ? "#D1FAE5" : act.status === "FLAGGED_FRAUD" ? "#FEE2E2" : "#FEF3C7",
                    border: `1px solid ${act.status === "QUALIFIED" ? "#A7F3D0" : act.status === "FLAGGED_FRAUD" ? "#FECACA" : "#FDE68A"}`,
                  }}>
                    {act.status === "QUALIFIED" ? "🏆 Qualified & Rewarded" : act.status === "FLAGGED_FRAUD" ? "⚠️ Under Fraud Review" : "⏳ Pending Triggers"}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary, #64748B)" }}>
                    {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProLayoutShell>
  );
}
