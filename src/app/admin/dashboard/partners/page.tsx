"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Wallet,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Save,
  Search,
  Filter,
  DollarSign,
  Award,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Home,
  Briefcase,
  Video,
} from "lucide-react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { PartnerProfile, PartnerPayoutTransaction, PartnerCommissionConfig, PartnerCategory } from "@/lib/partners/types";
import { PARTNER_CATEGORIES_METADATA, PARTNER_TIERS } from "@/lib/partners/config";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [payouts, setPayouts] = useState<PartnerPayoutTransaction[]>([]);
  const [config, setConfig] = useState<PartnerCommissionConfig | null>(null);
  const [metrics, setMetrics] = useState({
    totalPartners: 0,
    totalEstates: 0,
    totalEarningsDisbursed: 0,
    totalPendingPayouts: 0,
  });

  const [activeTab, setActiveTab] = useState<"partners" | "rules" | "payouts">("partners");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Config editing state
  const [editableRates, setEditableRates] = useState({
    estateManagerBookingPercent: 5.0,
    estateManagerResidentBonusNgn: 1000,
    realtorBookingPercent: 6.0,
    realtorMoveInBonusNgn: 2000,
    influencerBookingPercent: 4.0,
    influencerFirstBookingBonusNgn: 500,
    communityLeaderBookingPercent: 5.0,
    corporatePartnerBookingPercent: 7.5,
    artisanRecruitmentBonusNgn: 2500,
  });

  const [editablePayoutRules, setEditablePayoutRules] = useState({
    minimumPayoutNgn: 10000,
    monthlyPayoutDay: 1,
    autoPayoutEnabled: true,
    requireBankVerification: true,
    maxFraudRiskScore: 25,
  });

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/partners");
      const data = await res.json();
      if (data.success) {
        setPartners(data.partners || []);
        setPayouts(data.payouts || []);
        setMetrics(data.metrics || {});
        if (data.config) {
          setConfig(data.config);
          setEditableRates(data.config.rates);
          setEditablePayoutRules(data.config.payoutRules);
        }
      }
    } catch (err) {
      console.error("Failed to load admin partners data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveCommissionRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setStatusMessage("");
    try {
      const res = await fetch("/api/admin/partners/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rates: editableRates,
          payoutRules: editablePayoutRules,
          updatedBy: "SUPER_ADMIN",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update commission rules");
      setStatusMessage("Dynamic commission rules successfully saved and active!");
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handlePartnerStatusUpdate = async (partnerId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PARTNER",
          partnerId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update partner");
      setStatusMessage(`Partner updated to ${newStatus}`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleProcessPayout = async (payoutId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROCESS_PAYOUT",
          payoutId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process payout");
      setStatusMessage(`Payout marked as ${newStatus}`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getCategoryBadge = (category: PartnerCategory) => {
    switch (category) {
      case "ESTATE_MANAGER":
        return { bg: "rgba(0, 168, 181, 0.15)", border: "rgba(0, 168, 181, 0.35)", color: "#38BDF8", icon: <Building2 size={13} /> };
      case "REALTOR":
        return { bg: "rgba(234, 88, 12, 0.15)", border: "rgba(234, 88, 12, 0.35)", color: "#FB923C", icon: <Home size={13} /> };
      case "INFLUENCER":
        return { bg: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.35)", color: "#C084FC", icon: <Sparkles size={13} /> };
      case "COMMUNITY_LEADER":
        return { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.35)", color: "#34D399", icon: <Users size={13} /> };
      case "CORPORATE_PARTNER":
        return { bg: "rgba(14, 165, 233, 0.15)", border: "rgba(14, 165, 233, 0.35)", color: "#60A5FA", icon: <Briefcase size={13} /> };
      case "CONTENT_CREATOR":
        return { bg: "rgba(236, 72, 153, 0.15)", border: "rgba(236, 72, 153, 0.35)", color: "#F472B6", icon: <Video size={13} /> };
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", border: "rgba(148, 163, 184, 0.35)", color: "#CBD5E1", icon: <Users size={13} /> };
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "PLATINUM":
        return { bg: "rgba(168, 85, 247, 0.18)", border: "rgba(168, 85, 247, 0.4)", color: "#E9D5FF" };
      case "GOLD":
        return { bg: "rgba(234, 179, 8, 0.18)", border: "rgba(234, 179, 8, 0.4)", color: "#FEF08A" };
      case "SILVER":
        return { bg: "rgba(148, 163, 184, 0.18)", border: "rgba(148, 163, 184, 0.4)", color: "#E2E8F0" };
      case "BRONZE":
      default:
        return { bg: "rgba(217, 119, 6, 0.18)", border: "rgba(217, 119, 6, 0.4)", color: "#FDE68A" };
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.partnerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.companyName && p.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayoutShell>
      <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Building2 size={28} color="#00A8B5" />
              <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#FFFFFF", margin: 0 }}>
                HandyHub Partner Network Manager
              </h1>
            </div>
            <p style={{ color: "#94A3B8", margin: 0, fontSize: "0.95rem" }}>
              Enterprise partner administration, dynamic commission rules engine, estate tracking &amp; monthly settlement audit.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/partners/estate"
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                background: "rgba(0, 168, 181, 0.15)",
                border: "1px solid rgba(0, 168, 181, 0.35)",
                color: "#38BDF8",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.88rem",
              }}
            >
              <Building2 size={15} />
              <span>Preview Estate Portal</span>
            </Link>
          </div>
        </div>

        {statusMessage && (
          <div
            style={{
              padding: 14,
              borderRadius: 8,
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#6EE7B7",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage("")} style={{ background: "none", border: "none", color: "#6EE7B7", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 28 }}>
          <div style={{ background: "#1E293B", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>TOTAL PARTNERS</span>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#FFFFFF", margin: "4px 0" }}>{partners.length} Active</div>
            <span style={{ fontSize: "0.78rem", color: "#38BDF8" }}>Across 6 Archetypes</span>
          </div>

          <div style={{ background: "#1E293B", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>GATED ESTATES</span>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#F59E0B", margin: "4px 0" }}>{metrics.totalEstates || 0} Estates</div>
            <span style={{ fontSize: "0.78rem", color: "#94A3B8" }}>With security gate passes</span>
          </div>

          <div style={{ background: "#1E293B", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>TOTAL COMMISSIONS PAID</span>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#10B981", margin: "4px 0" }}>
              ₦{(metrics.totalEarningsDisbursed || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: "0.78rem", color: "#10B981" }}>Settled to Bank Accounts</span>
          </div>

          <div style={{ background: "#1E293B", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>PENDING WITHDRAWALS</span>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#38BDF8", margin: "4px 0" }}>
              ₦{(metrics.totalPendingPayouts || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: "0.78rem", color: "#94A3B8" }}>Monthly batch queue</span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: "flex", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 14, marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab("partners")}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background: activeTab === "partners" ? "rgba(0, 168, 181, 0.2)" : "transparent",
              color: activeTab === "partners" ? "#38BDF8" : "#94A3B8",
              border: activeTab === "partners" ? "1px solid rgba(0, 168, 181, 0.4)" : "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Partner Directory ({partners.length})
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background: activeTab === "rules" ? "rgba(245, 158, 11, 0.2)" : "transparent",
              color: activeTab === "rules" ? "#F59E0B" : "#94A3B8",
              border: activeTab === "rules" ? "1px solid rgba(245, 158, 11, 0.4)" : "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Configurable Commission Rules (Live)
          </button>

          <button
            onClick={() => setActiveTab("payouts")}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background: activeTab === "payouts" ? "rgba(16, 185, 129, 0.2)" : "transparent",
              color: activeTab === "payouts" ? "#10B981" : "#94A3B8",
              border: activeTab === "payouts" ? "1px solid rgba(16, 185, 129, 0.4)" : "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Monthly Payout Settlements ({payouts.length})
          </button>
        </div>

        {/* TAB 1: PARTNER DIRECTORY */}
        {activeTab === "partners" && (
          <div style={{ background: "#1E293B", borderRadius: 14, padding: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <input
                  type="text"
                  placeholder="Search by Partner ID, Name, Email, or Referral Code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF" }}
                />
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ padding: "10px 14px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF" }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="ESTATE_MANAGER">Estate &amp; Facility Managers</option>
                  <option value="REALTOR">Realtors &amp; Brokers</option>
                  <option value="INFLUENCER">Influencers &amp; Creators</option>
                  <option value="COMMUNITY_LEADER">Community Leaders</option>
                  <option value="CORPORATE_PARTNER">Corporate Fleet</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "14px 16px" }}>Partner Details</th>
                    <th style={{ padding: "14px 16px" }}>Category</th>
                    <th style={{ padding: "14px 16px" }}>Referral Code</th>
                    <th style={{ padding: "14px 16px" }}>Tier Level</th>
                    <th style={{ padding: "14px 16px" }}>Wallet Balance</th>
                    <th style={{ padding: "14px 16px" }}>Total Earned</th>
                    <th style={{ padding: "14px 16px" }}>Status</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "48px 20px" }}>
                        <Building2 size={40} color="#00A8B5" style={{ opacity: 0.6, marginBottom: 12, display: "inline-block" }} />
                        <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "1rem" }}>No registered partners found</div>
                        <div style={{ fontSize: "0.85rem", color: "#94A3B8", marginTop: 4, maxWidth: 440, margin: "6px auto 0" }}>
                          When partners sign up via the Partner Network portal, their live profiles, referral codes, and estate metrics will appear here in real time.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((p) => {
                      const catBadge = getCategoryBadge(p.category);
                      const tierBadge = getTierBadge(p.tierLevel);
                      const portalHref =
                        p.category === "ESTATE_MANAGER"
                          ? `/partners/estate?partnerId=${encodeURIComponent(p.partnerId)}&code=${encodeURIComponent(p.referralCode)}`
                          : `/partners/dashboard?partnerId=${encodeURIComponent(p.partnerId)}&code=${encodeURIComponent(p.referralCode)}`;

                      return (
                        <tr
                          key={p.id}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            transition: "background 0.2s ease",
                          }}
                        >
                          {/* 1. PARTNER DETAILS */}
                          <td style={{ padding: "16px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: 10,
                                  background: "linear-gradient(135deg, rgba(0, 168, 181, 0.3) 0%, rgba(2, 132, 199, 0.2) 100%)",
                                  border: "1px solid rgba(0, 168, 181, 0.4)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#38BDF8",
                                  fontWeight: 900,
                                  fontSize: "1.05rem",
                                  flexShrink: 0,
                                }}
                              >
                                {(p.companyName || p.name || "P").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.95rem" }}>
                                  {p.companyName || p.name}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                                  <span
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: "0.75rem",
                                      background: "rgba(0, 168, 181, 0.12)",
                                      color: "#38BDF8",
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      border: "1px solid rgba(0, 168, 181, 0.25)",
                                    }}
                                  >
                                    {p.partnerId}
                                  </span>
                                  <span style={{ fontSize: "0.78rem", color: "#94A3B8" }}>&bull; {p.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. CATEGORY */}
                          <td style={{ padding: "16px 14px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: catBadge.bg,
                                border: `1px solid ${catBadge.border}`,
                                color: catBadge.color,
                                fontSize: "0.78rem",
                                fontWeight: 700,
                              }}
                            >
                              {catBadge.icon}
                              <span>{PARTNER_CATEGORIES_METADATA[p.category]?.label || p.category}</span>
                            </span>
                          </td>

                          {/* 3. REFERRAL CODE */}
                          <td style={{ padding: "16px 14px" }}>
                            <button
                              onClick={() => handleCopyCode(p.referralCode)}
                              title="Click to copy referral code"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "5px 10px",
                                borderRadius: 6,
                                background: "rgba(245, 158, 11, 0.12)",
                                border: "1px solid rgba(245, 158, 11, 0.3)",
                                color: "#F59E0B",
                                fontFamily: "monospace",
                                fontWeight: 800,
                                fontSize: "0.82rem",
                                cursor: "pointer",
                              }}
                            >
                              <span>{p.referralCode}</span>
                              {copiedCode === p.referralCode ? (
                                <Check size={13} color="#10B981" />
                              ) : (
                                <Copy size={13} style={{ opacity: 0.7 }} />
                              )}
                            </button>
                          </td>

                          {/* 4. TIER LEVEL */}
                          <td style={{ padding: "16px 14px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 9px",
                                borderRadius: 5,
                                background: tierBadge.bg,
                                border: `1px solid ${tierBadge.border}`,
                                color: tierBadge.color,
                                fontWeight: 900,
                                fontSize: "0.75rem",
                                letterSpacing: "0.03em",
                              }}
                            >
                              {p.tierLevel}
                            </span>
                          </td>

                          {/* 5. WALLET BALANCE */}
                          <td style={{ padding: "16px 14px" }}>
                            <div style={{ fontWeight: 900, color: "#38BDF8", fontSize: "1rem" }}>
                              ₦{(p.walletBalance || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: 2 }}>
                              Withdrawable
                            </div>
                          </td>

                          {/* 6. TOTAL EARNED (HIGH VISIBILITY EMERALD GLOW) */}
                          <td style={{ padding: "16px 14px" }}>
                            <div
                              style={{
                                fontWeight: 900,
                                color: "#10B981",
                                fontSize: "1.05rem",
                                textShadow: "0 0 10px rgba(16, 185, 129, 0.25)",
                              }}
                            >
                              ₦{(p.totalEarnings || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#34D399", opacity: 0.8, marginTop: 2 }}>
                              Gross Comm.
                            </div>
                          </td>

                          {/* 7. STATUS */}
                          <td style={{ padding: "16px 14px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 10px",
                                borderRadius: 20,
                                background: p.status === "ACTIVE" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                border: p.status === "ACTIVE" ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
                                color: p.status === "ACTIVE" ? "#34D399" : "#F87171",
                                fontSize: "0.75rem",
                                fontWeight: 800,
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: p.status === "ACTIVE" ? "#10B981" : "#EF4444",
                                }}
                              />
                              {p.status}
                            </span>
                          </td>

                          {/* 8. ACTIONS */}
                          <td style={{ padding: "16px 14px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              <Link
                                href={portalHref}
                                target="_blank"
                                title="Open Live Partner Portal"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "6px 11px",
                                  borderRadius: 6,
                                  background: "rgba(0, 168, 181, 0.15)",
                                  border: "1px solid rgba(0, 168, 181, 0.35)",
                                  color: "#38BDF8",
                                  textDecoration: "none",
                                  fontWeight: 700,
                                  fontSize: "0.78rem",
                                }}
                              >
                                <span>Portal</span>
                                <ExternalLink size={12} />
                              </Link>

                              <button
                                onClick={() => handlePartnerStatusUpdate(p.id, p.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  background: p.status === "ACTIVE" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                  border: p.status === "ACTIVE" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                                  color: p.status === "ACTIVE" ? "#FCA5A5" : "#6EE7B7",
                                  fontWeight: 700,
                                  fontSize: "0.78rem",
                                  cursor: "pointer",
                                }}
                              >
                                {p.status === "ACTIVE" ? "Suspend" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CONFIGURABLE COMMISSION RULES (NOT HARDCODED) */}
        {activeTab === "rules" && (
          <div style={{ background: "#1E293B", borderRadius: 14, padding: 32, border: "1px solid rgba(0, 168, 181, 0.3)" }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Settings size={22} color="#00A8B5" />
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                  Dynamic Partner Commission Rates &amp; Payout Engine
                </h2>
              </div>
              <p style={{ color: "#94A3B8", fontSize: "0.9rem", margin: 0 }}>
                Configure live commission % rates, recruitment bonuses, and payout rules. Changes update calculations in real-time across the database without code redeployment.
              </p>
            </div>

            <form onSubmit={handleSaveCommissionRules}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#38BDF8", marginBottom: 16 }}>
                1. Category Booking Commission Rates (%)
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 28 }}>
                <div style={{ background: "#0F172A", padding: 16, borderRadius: 10 }}>
                  <label style={{ fontSize: "0.82rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Estate Managers Booking Rev-Share (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editableRates.estateManagerBookingPercent}
                    onChange={(e) => setEditableRates({ ...editableRates, estateManagerBookingPercent: Number(e.target.value) })}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 800 }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 16, borderRadius: 10 }}>
                  <label style={{ fontSize: "0.82rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Estate Resident Activation Bonus (₦)
                  </label>
                  <input
                    type="number"
                    value={editableRates.estateManagerResidentBonusNgn}
                    onChange={(e) => setEditableRates({ ...editableRates, estateManagerResidentBonusNgn: Number(e.target.value) })}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 800 }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 16, borderRadius: 10 }}>
                  <label style={{ fontSize: "0.82rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Realtors Move-in Setup Rev-Share (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editableRates.realtorBookingPercent}
                    onChange={(e) => setEditableRates({ ...editableRates, realtorBookingPercent: Number(e.target.value) })}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 800 }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 16, borderRadius: 10 }}>
                  <label style={{ fontSize: "0.82rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Influencers &amp; Creators Rev-Share (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editableRates.influencerBookingPercent}
                    onChange={(e) => setEditableRates({ ...editableRates, influencerBookingPercent: Number(e.target.value) })}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 800 }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 16, borderRadius: 10 }}>
                  <label style={{ fontSize: "0.82rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Corporate Fleet Maintenance (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editableRates.corporatePartnerBookingPercent}
                    onChange={(e) => setEditableRates({ ...editableRates, corporatePartnerBookingPercent: Number(e.target.value) })}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 800 }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 16, borderRadius: 10 }}>
                  <label style={{ fontSize: "0.82rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Artisan Recruitment Bonus (₦)
                  </label>
                  <input
                    type="number"
                    value={editableRates.artisanRecruitmentBonusNgn}
                    onChange={(e) => setEditableRates({ ...editableRates, artisanRecruitmentBonusNgn: Number(e.target.value) })}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 800 }}
                  />
                </div>
              </div>

              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#F59E0B", marginBottom: 16 }}>
                2. Monthly Settlement &amp; Anti-Fraud Rules
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 32 }}>
                <div style={{ background: "#0F172A", padding: 16, borderRadius: 10 }}>
                  <label style={{ fontSize: "0.82rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Minimum Withdrawal Threshold (₦)
                  </label>
                  <input
                    type="number"
                    value={editablePayoutRules.minimumPayoutNgn}
                    onChange={(e) => setEditablePayoutRules({ ...editablePayoutRules, minimumPayoutNgn: Number(e.target.value) })}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 800 }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 16, borderRadius: 10 }}>
                  <label style={{ fontSize: "0.82rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Monthly Automated Payout Day (Day of Month)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={editablePayoutRules.monthlyPayoutDay}
                    onChange={(e) => setEditablePayoutRules({ ...editablePayoutRules, monthlyPayoutDay: Number(e.target.value) })}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 800 }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 16, borderRadius: 10 }}>
                  <label style={{ fontSize: "0.82rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Max Fraud Risk Score (Threshold to Block)
                  </label>
                  <input
                    type="number"
                    value={editablePayoutRules.maxFraudRiskScore}
                    onChange={(e) => setEditablePayoutRules({ ...editablePayoutRules, maxFraudRiskScore: Number(e.target.value) })}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 800 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingConfig}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 28px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #00A8B5 0%, #0284C7 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                <Save size={18} />
                <span>{savingConfig ? "Saving Configuration..." : "Save Live Commission Rules"}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: MONTHLY PAYOUT SETTLEMENTS */}
        {activeTab === "payouts" && (
          <div style={{ background: "#1E293B", borderRadius: 14, padding: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 16 }}>
              Monthly Partner Commission Payout Queue
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", fontSize: "0.78rem", textTransform: "uppercase" }}>
                    <th style={{ padding: 12 }}>Batch Ref</th>
                    <th style={{ padding: 12 }}>Partner</th>
                    <th style={{ padding: 12 }}>Bank Destination</th>
                    <th style={{ padding: 12 }}>Amount</th>
                    <th style={{ padding: 12 }}>Requested Date</th>
                    <th style={{ padding: 12 }}>Status</th>
                    <th style={{ padding: 12 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length > 0 ? (
                    payouts.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.9rem" }}>
                        <td style={{ padding: 14 }}><strong style={{ color: "#38BDF8" }}>{p.reference}</strong></td>
                        <td style={{ padding: 14 }}>{p.partnerName}</td>
                        <td style={{ padding: 14 }}>{p.bankName} &bull; {p.accountNumber} ({p.accountName})</td>
                        <td style={{ padding: 14 }}><strong style={{ color: "#10B981" }}>₦{p.amount.toLocaleString()}</strong></td>
                        <td style={{ padding: 14 }}>{p.requestedAt?.split("T")[0]}</td>
                        <td style={{ padding: 14 }}>
                          <span style={{ padding: "3px 8px", borderRadius: 4, background: p.status === "PAID" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)", color: p.status === "PAID" ? "#10B981" : "#F59E0B", fontSize: "0.75rem", fontWeight: 800 }}>
                            ● {p.status}
                          </span>
                        </td>
                        <td style={{ padding: 14 }}>
                          {p.status === "PENDING" && (
                            <button
                              onClick={() => handleProcessPayout(p.id, "PAID")}
                              style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(16, 185, 129, 0.2)", color: "#6EE7B7", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                            >
                              Approve &amp; Settle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "#94A3B8", padding: 24 }}>
                        No pending payouts in queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutShell>
  );
}
