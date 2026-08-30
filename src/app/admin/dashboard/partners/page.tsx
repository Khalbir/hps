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
import styles from "../../admin.module.css";

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
      <div className={styles.adminContent}>
        {/* Page Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px", width: "100%" }}>
          <div style={{ minWidth: 0, flex: "1 1 300px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(0, 168, 181, 0.15)", border: "1px solid rgba(0, 168, 181, 0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8", flexShrink: 0 }}>
                <Building2 size={22} />
              </div>
              <h1 style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: 900, color: "#FFFFFF", margin: 0, letterSpacing: "-0.02em" }}>
                HandyHub Partner Network Manager
              </h1>
            </div>
            <p style={{ color: "#94A3B8", margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>
              Enterprise partner administration, dynamic commission rules engine, estate tracking &amp; monthly settlement audit.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
            <button
              onClick={fetchAdminData}
              className="btn btn-secondary btn-sm"
              style={{
                background: "#1E293B",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#CBD5E1",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: "12.5px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} color="#38BDF8" /> Refresh
            </button>
            <Link
              href="/partners/estate"
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "rgba(0, 168, 181, 0.15)",
                border: "1px solid rgba(0, 168, 181, 0.35)",
                color: "#38BDF8",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "12.5px",
              }}
            >
              <Building2 size={14} />
              <span>Preview Estate Portal</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {statusMessage && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34D399",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px",
              fontWeight: 600,
              gap: 12,
            }}
          >
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage("")} style={{ background: "none", border: "none", color: "#34D399", cursor: "pointer", fontSize: "16px", padding: 0 }}>✕</button>
          </div>
        )}

        {/* Responsive Financial & Estate KPI Cards Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24, width: "100%" }}>
          <div style={{ background: "#1E293B", padding: "16px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", minWidth: 0 }}>
            <span style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>TOTAL PARTNERS</span>
            <div style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)", fontWeight: 900, color: "#FFFFFF", margin: "4px 0", wordBreak: "break-word" }}>{partners.length} Active</div>
            <span style={{ fontSize: "0.76rem", color: "#38BDF8", fontWeight: 600 }}>Across 6 Archetypes</span>
          </div>

          <div style={{ background: "#1E293B", padding: "16px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", minWidth: 0 }}>
            <span style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>GATED ESTATES</span>
            <div style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)", fontWeight: 900, color: "#F59E0B", margin: "4px 0", wordBreak: "break-word" }}>{metrics.totalEstates || 0} Estates</div>
            <span style={{ fontSize: "0.76rem", color: "#94A3B8" }}>With security gate passes</span>
          </div>

          <div style={{ background: "#1E293B", padding: "16px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", minWidth: 0 }}>
            <span style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>COMMISSIONS PAID</span>
            <div style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)", fontWeight: 900, color: "#10B981", margin: "4px 0", wordBreak: "break-word" }}>
              ₦{(metrics.totalEarningsDisbursed || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: "0.76rem", color: "#10B981", fontWeight: 600 }}>Settled to Bank Accounts</span>
          </div>

          <div style={{ background: "#1E293B", padding: "16px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", minWidth: 0 }}>
            <span style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>PENDING WITHDRAWALS</span>
            <div style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)", fontWeight: 900, color: "#38BDF8", margin: "4px 0", wordBreak: "break-word" }}>
              ₦{(metrics.totalPendingPayouts || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: "0.76rem", color: "#94A3B8" }}>Monthly batch queue</span>
          </div>
        </div>

        {/* Smooth Responsive Tab Buttons Bar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: 12,
            marginBottom: 20,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            width: "100%",
          }}
        >
          <button
            onClick={() => setActiveTab("partners")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: activeTab === "partners" ? "rgba(0, 168, 181, 0.2)" : "rgba(255,255,255,0.04)",
              color: activeTab === "partners" ? "#38BDF8" : "#94A3B8",
              border: activeTab === "partners" ? "1px solid rgba(0, 168, 181, 0.4)" : "1px solid rgba(255,255,255,0.06)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Partner Directory ({partners.length})
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: activeTab === "rules" ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.04)",
              color: activeTab === "rules" ? "#F59E0B" : "#94A3B8",
              border: activeTab === "rules" ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(255,255,255,0.06)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Configurable Commission Rules (Live)
          </button>

          <button
            onClick={() => setActiveTab("payouts")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: activeTab === "payouts" ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.04)",
              color: activeTab === "payouts" ? "#10B981" : "#94A3B8",
              border: activeTab === "payouts" ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255,255,255,0.06)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Monthly Payout Settlements ({payouts.length})
          </button>
        </div>

        {/* TAB 1: PARTNER DIRECTORY */}
        {activeTab === "partners" && (
          <div
            style={{
              background: "#1E293B",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
              width: "100%",
            }}
          >
            {/* Search & Filter Header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: "1 1 240px", minWidth: 0, position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search by Partner ID, Name, Email, or Referral Code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 14px 9px 36px",
                    background: "#0F172A",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#FFFFFF",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
                <Search size={15} color="#64748B" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              </div>

              <div style={{ flex: "0 1 auto", minWidth: 160 }}>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    background: "#0F172A",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#FFFFFF",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
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

            {/* Responsive Table Viewport Container */}
            <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: 840, borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(15, 23, 42, 0.6)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Partner Details</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Category</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Referral Code</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Tier Level</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Wallet Balance</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Total Earned</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>Action</th>
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
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 10,
                                  background: "linear-gradient(135deg, rgba(0, 168, 181, 0.3) 0%, rgba(2, 132, 199, 0.2) 100%)",
                                  border: "1px solid rgba(0, 168, 181, 0.4)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#38BDF8",
                                  fontWeight: 900,
                                  fontSize: "0.95rem",
                                  flexShrink: 0,
                                }}
                              >
                                {(p.companyName || p.name || "P").charAt(0).toUpperCase()}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {p.companyName || p.name}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                                  <span
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: "0.72rem",
                                      background: "rgba(0, 168, 181, 0.12)",
                                      color: "#38BDF8",
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      border: "1px solid rgba(0, 168, 181, 0.25)",
                                    }}
                                  >
                                    {p.partnerId}
                                  </span>
                                  <span style={{ fontSize: "0.76rem", color: "#94A3B8" }}>&bull; {p.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. CATEGORY */}
                          <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 9px",
                                borderRadius: 6,
                                background: catBadge.bg,
                                border: `1px solid ${catBadge.border}`,
                                color: catBadge.color,
                                fontSize: "0.76rem",
                                fontWeight: 700,
                              }}
                            >
                              {catBadge.icon}
                              <span>{PARTNER_CATEGORIES_METADATA[p.category]?.label || p.category}</span>
                            </span>
                          </td>

                          {/* 3. REFERRAL CODE */}
                          <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                            <button
                              onClick={() => handleCopyCode(p.referralCode)}
                              title="Click to copy referral code"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "rgba(245, 158, 11, 0.12)",
                                border: "1px solid rgba(245, 158, 11, 0.3)",
                                color: "#F59E0B",
                                fontFamily: "monospace",
                                fontWeight: 800,
                                fontSize: "0.78rem",
                                cursor: "pointer",
                              }}
                            >
                              <span>{p.referralCode}</span>
                              {copiedCode === p.referralCode ? (
                                <Check size={12} color="#10B981" />
                              ) : (
                                <Copy size={12} style={{ opacity: 0.7 }} />
                              )}
                            </button>
                          </td>

                          {/* 4. TIER LEVEL */}
                          <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: 5,
                                background: tierBadge.bg,
                                border: `1px solid ${tierBadge.border}`,
                                color: tierBadge.color,
                                fontWeight: 900,
                                fontSize: "0.72rem",
                                letterSpacing: "0.03em",
                              }}
                            >
                              {p.tierLevel}
                            </span>
                          </td>

                          {/* 5. WALLET BALANCE */}
                          <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                            <div style={{ fontWeight: 900, color: "#38BDF8", fontSize: "0.95rem" }}>
                              ₦{(p.walletBalance || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 1 }}>
                              Withdrawable
                            </div>
                          </td>

                          {/* 6. TOTAL EARNED */}
                          <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                            <div
                              style={{
                                fontWeight: 900,
                                color: "#10B981",
                                fontSize: "0.98rem",
                                textShadow: "0 0 8px rgba(16, 185, 129, 0.2)",
                              }}
                            >
                              ₦{(p.totalEarnings || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#34D399", opacity: 0.8, marginTop: 1 }}>
                              Gross Comm.
                            </div>
                          </td>

                          {/* 7. STATUS */}
                          <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "3px 8px",
                                borderRadius: 20,
                                background: p.status === "ACTIVE" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                border: p.status === "ACTIVE" ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
                                color: p.status === "ACTIVE" ? "#34D399" : "#F87171",
                                fontSize: "0.72rem",
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
                          <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <Link
                                href={portalHref}
                                target="_blank"
                                title="Open Live Partner Portal"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "5px 10px",
                                  borderRadius: 6,
                                  background: "rgba(0, 168, 181, 0.15)",
                                  border: "1px solid rgba(0, 168, 181, 0.35)",
                                  color: "#38BDF8",
                                  textDecoration: "none",
                                  fontWeight: 700,
                                  fontSize: "0.76rem",
                                }}
                              >
                                <span>Portal</span>
                                <ExternalLink size={11} />
                              </Link>

                              <button
                                onClick={() => handlePartnerStatusUpdate(p.id, p.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: 6,
                                  background: p.status === "ACTIVE" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                  border: p.status === "ACTIVE" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                                  color: p.status === "ACTIVE" ? "#FCA5A5" : "#6EE7B7",
                                  fontWeight: 700,
                                  fontSize: "0.76rem",
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
          <div style={{ background: "#1E293B", borderRadius: 14, padding: "20px 22px", border: "1px solid rgba(0, 168, 181, 0.3)", width: "100%", boxSizing: "border-box" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Settings size={20} color="#00A8B5" />
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                  Dynamic Partner Commission Rates &amp; Payout Engine
                </h2>
              </div>
              <p style={{ color: "#94A3B8", fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                Configure live commission % rates, recruitment bonuses, and payout rules. Changes update calculations in real-time across the database without code redeployment.
              </p>
            </div>

            <form onSubmit={handleSaveCommissionRules}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#38BDF8", marginBottom: 14 }}>
                1. Category Booking Commission Rates (%)
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24, width: "100%" }}>
                <div style={{ background: "#0F172A", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Estate Managers Booking Rev-Share (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editableRates.estateManagerBookingPercent}
                    onChange={(e) => setEditableRates({ ...editableRates, estateManagerBookingPercent: Number(e.target.value) })}
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1rem", fontWeight: 800, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Estate Resident Activation Bonus (₦)
                  </label>
                  <input
                    type="number"
                    value={editableRates.estateManagerResidentBonusNgn}
                    onChange={(e) => setEditableRates({ ...editableRates, estateManagerResidentBonusNgn: Number(e.target.value) })}
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1rem", fontWeight: 800, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Realtors Move-in Setup Rev-Share (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editableRates.realtorBookingPercent}
                    onChange={(e) => setEditableRates({ ...editableRates, realtorBookingPercent: Number(e.target.value) })}
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1rem", fontWeight: 800, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Influencers &amp; Creators Rev-Share (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editableRates.influencerBookingPercent}
                    onChange={(e) => setEditableRates({ ...editableRates, influencerBookingPercent: Number(e.target.value) })}
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1rem", fontWeight: 800, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Corporate Fleet Maintenance (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editableRates.corporatePartnerBookingPercent}
                    onChange={(e) => setEditableRates({ ...editableRates, corporatePartnerBookingPercent: Number(e.target.value) })}
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1rem", fontWeight: 800, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Artisan Recruitment Bonus (₦)
                  </label>
                  <input
                    type="number"
                    value={editableRates.artisanRecruitmentBonusNgn}
                    onChange={(e) => setEditableRates({ ...editableRates, artisanRecruitmentBonusNgn: Number(e.target.value) })}
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1rem", fontWeight: 800, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#F59E0B", marginBottom: 14 }}>
                2. Monthly Settlement &amp; Anti-Fraud Rules
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28, width: "100%" }}>
                <div style={{ background: "#0F172A", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Minimum Withdrawal Threshold (₦)
                  </label>
                  <input
                    type="number"
                    value={editablePayoutRules.minimumPayoutNgn}
                    onChange={(e) => setEditablePayoutRules({ ...editablePayoutRules, minimumPayoutNgn: Number(e.target.value) })}
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1rem", fontWeight: 800, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Monthly Automated Payout Day
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={editablePayoutRules.monthlyPayoutDay}
                    onChange={(e) => setEditablePayoutRules({ ...editablePayoutRules, monthlyPayoutDay: Number(e.target.value) })}
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1rem", fontWeight: 800, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ background: "#0F172A", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <label style={{ fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Max Fraud Risk Score Threshold
                  </label>
                  <input
                    type="number"
                    value={editablePayoutRules.maxFraudRiskScore}
                    onChange={(e) => setEditablePayoutRules({ ...editablePayoutRules, maxFraudRiskScore: Number(e.target.value) })}
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#FFFFFF", fontSize: "1rem", fontWeight: 800, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingConfig}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #00A8B5 0%, #0284C7 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                }}
              >
                <Save size={16} />
                <span>{savingConfig ? "Saving Configuration..." : "Save Live Commission Rules"}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: MONTHLY PAYOUT SETTLEMENTS */}
        {activeTab === "payouts" && (
          <div style={{ background: "#1E293B", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", width: "100%" }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                Monthly Partner Commission Payout Queue
              </h3>
            </div>

            <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(15, 23, 42, 0.6)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Batch Ref</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Partner</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Bank Destination</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Amount</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Requested Date</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Status</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length > 0 ? (
                    payouts.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.88rem" }}>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}><strong style={{ color: "#38BDF8" }}>{p.reference}</strong></td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{p.partnerName}</td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{p.bankName} &bull; {p.accountNumber} ({p.accountName})</td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}><strong style={{ color: "#10B981" }}>₦{p.amount.toLocaleString()}</strong></td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{p.requestedAt?.split("T")[0]}</td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <span style={{ padding: "3px 8px", borderRadius: 4, background: p.status === "PAID" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)", color: p.status === "PAID" ? "#10B981" : "#F59E0B", fontSize: "0.72rem", fontWeight: 800 }}>
                            ● {p.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {p.status === "PENDING" && (
                            <button
                              onClick={() => handleProcessPayout(p.id, "PAID")}
                              style={{ padding: "5px 10px", borderRadius: 6, background: "rgba(16, 185, 129, 0.2)", color: "#6EE7B7", border: "none", fontWeight: 700, fontSize: "0.76rem", cursor: "pointer" }}
                            >
                              Approve &amp; Settle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "#94A3B8", padding: 24, fontSize: "0.88rem" }}>
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
