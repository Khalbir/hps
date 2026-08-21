"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Gift, Shield, AlertTriangle, CheckCircle2, TrendingUp, Users,
  Sliders, Save, RefreshCw, Bot, Sparkles, Award, Star, Zap, Crown,
  ArrowRight, Check, X, ShieldAlert, Eye, Search, Filter, Lock
} from "lucide-react";
import { ReferralRulesConfig, RecruiterTierLevel } from "@/lib/referrals/types";
import { DEFAULT_REFERRAL_RULES } from "@/lib/referrals/constants";
import styles from "../../admin.module.css";

export default function AdminReferralsGovernancePage() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [rules, setRules] = useState<ReferralRulesConfig>(DEFAULT_REFERRAL_RULES);
  const [fraudQueue, setFraudQueue] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "FRAUD_QUEUE" | "CAMPAIGNS" | "CONFIG_RULES" | "AUDIT_LOGS">("OVERVIEW");

  const fetchAdminReferrals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/referrals", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        setTelemetry(data.telemetry);
        if (data.rulesConfig) setRules(data.rulesConfig);
        setFraudQueue(data.fraudQueue || []);
        setCampaigns(data.campaignRecommendations || []);
        setRecentRecords(data.recentRecords || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.warn("Failed to load admin referral intelligence:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReferrals();
  }, []);

  const handleSaveRules = async () => {
    setSavingRules(true);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SAVE_RULES", rules }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast("Referral policies and reward values saved successfully! ⚙️");
        fetchAdminReferrals();
      } else {
        setToast(data.error || "Failed to save referral rules.");
      }
    } catch {
      setToast("Network error saving rules.");
    } finally {
      setSavingRules(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const handleFraudOverride = async (recordId: string, overrideDecision: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "FRAUD_OVERRIDE", recordId, overrideDecision }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast(data.message || `Referral record status updated to ${overrideDecision}!`);
        fetchAdminReferrals();
      } else {
        setToast(data.error || "Failed to update record.");
      }
    } catch {
      setToast("Network error during fraud override.");
    } finally {
      setTimeout(() => setToast(""), 4000);
    }
  };

  return (
    <AdminLayoutShell>
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

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 className={styles.pageTitle} style={{ margin: 0 }}>
              Enterprise Referral & AI Agent Center
            </h1>
            <span style={{
              fontSize: "11px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
              color: "#FFFFFF",
              padding: "3px 10px",
              borderRadius: 99,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}>
              <Bot size={13} /> AI Anti-Fraud Active
            </span>
          </div>
          <p className={styles.pageSubtitle} style={{ margin: 0 }}>
            Super Admin & CAO Referral Telemetry, Multi-Vector Fraud Queue, Dynamic Non-Cash Configuration, and Campaign Intelligence.
          </p>
        </div>
        <button onClick={fetchAdminReferrals} className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10 }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Telemetry
        </button>
      </div>

      {/* Top KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <span style={{ fontSize: "11.5px", color: "var(--text-secondary, #64748B)", fontWeight: 700, display: "block" }}>TOTAL REFERRAL CODES</span>
          <strong style={{ fontSize: "1.75rem", color: "var(--text-primary, #0F172A)", display: "block", marginTop: 4 }}>
            {telemetry?.totalCodesCount ?? 0}
          </strong>
          <span style={{ fontSize: "11px", color: "#008B97", fontWeight: 600 }}>Active in ecosystem</span>
        </div>

        <div className="card" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <span style={{ fontSize: "11.5px", color: "var(--text-secondary, #64748B)", fontWeight: 700, display: "block" }}>LINK CLICKS & SCANS</span>
          <strong style={{ fontSize: "1.75rem", color: "#3B82F6", display: "block", marginTop: 4 }}>
            {telemetry?.totalClicks ?? 0}
          </strong>
          <span style={{ fontSize: "11px", color: "var(--text-secondary, #64748B)" }}>Deep-links & QR scans</span>
        </div>

        <div className="card" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <span style={{ fontSize: "11.5px", color: "var(--text-secondary, #64748B)", fontWeight: 700, display: "block" }}>QUALIFIED CONVERSIONS</span>
          <strong style={{ fontSize: "1.75rem", color: "#10B981", display: "block", marginTop: 4 }}>
            {telemetry?.totalQualified ?? 0}
          </strong>
          <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700 }}>
            {telemetry?.conversionRate ?? "0%"} Conversion Rate
          </span>
        </div>

        <div className="card" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <span style={{ fontSize: "11.5px", color: "var(--text-secondary, #64748B)", fontWeight: 700, display: "block" }}>NON-CASH VALUE DISBURSED</span>
          <strong style={{ fontSize: "1.75rem", color: "#F59E0B", display: "block", marginTop: 4 }}>
            ₦{(telemetry?.totalNonCashDisbursedNgn ?? 0).toLocaleString()}
          </strong>
          <span style={{ fontSize: "11px", color: "var(--text-secondary, #64748B)" }}>
            {telemetry?.totalRedeemedRewards ?? 0} Vouchers/Tokens Redeemed
          </span>
        </div>
      </div>

      {/* Recruiter Tier Distribution Breakdown */}
      <div className="card" style={{ padding: "18px 20px", borderRadius: 16, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "14.5px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
          Recruiter Tier Progression Distribution
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          <div style={{ background: "rgba(205, 127, 50, 0.08)", border: "1px solid rgba(205, 127, 50, 0.3)", padding: "12px 14px", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#CD7F32" }}>🥉 Bronze</span>
              <span style={{ fontSize: "10px", background: "#CD7F32", color: "#FFF", padding: "1px 5px", borderRadius: 4 }}>1.0x</span>
            </div>
            <strong style={{ fontSize: "1.4rem", color: "var(--text-primary, #0F172A)", display: "block", marginTop: 4 }}>
              {telemetry?.tierBreakdown?.BRONZE ?? 0}
            </strong>
            <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #64748B)" }}>1–3 Referrals</span>
          </div>

          <div style={{ background: "rgba(148, 163, 184, 0.12)", border: "1px solid rgba(148, 163, 184, 0.4)", padding: "12px 14px", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#64748B" }}>🥈 Silver</span>
              <span style={{ fontSize: "10px", background: "#64748B", color: "#FFF", padding: "1px 5px", borderRadius: 4 }}>1.15x</span>
            </div>
            <strong style={{ fontSize: "1.4rem", color: "var(--text-primary, #0F172A)", display: "block", marginTop: 4 }}>
              {telemetry?.tierBreakdown?.SILVER ?? 0}
            </strong>
            <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #64748B)" }}>4–9 Referrals</span>
          </div>

          <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "12px 14px", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#D97706" }}>🥇 Gold</span>
              <span style={{ fontSize: "10px", background: "#D97706", color: "#FFF", padding: "1px 5px", borderRadius: 4 }}>1.30x</span>
            </div>
            <strong style={{ fontSize: "1.4rem", color: "var(--text-primary, #0F172A)", display: "block", marginTop: 4 }}>
              {telemetry?.tierBreakdown?.GOLD ?? 0}
            </strong>
            <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #64748B)" }}>10–24 Referrals</span>
          </div>

          <div style={{ background: "rgba(0, 196, 212, 0.08)", border: "1px solid rgba(0, 196, 212, 0.3)", padding: "12px 14px", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#00A8B5" }}>💎 Platinum</span>
              <span style={{ fontSize: "10px", background: "#00A8B5", color: "#FFF", padding: "1px 5px", borderRadius: 4 }}>1.50x</span>
            </div>
            <strong style={{ fontSize: "1.4rem", color: "var(--text-primary, #0F172A)", display: "block", marginTop: 4 }}>
              {telemetry?.tierBreakdown?.PLATINUM ?? 0}
            </strong>
            <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #64748B)" }}>25–49 Referrals</span>
          </div>

          <div style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.3)", padding: "12px 14px", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#8B5CF6" }}>👑 Ambassador</span>
              <span style={{ fontSize: "10px", background: "#8B5CF6", color: "#FFF", padding: "1px 5px", borderRadius: 4 }}>2.00x</span>
            </div>
            <strong style={{ fontSize: "1.4rem", color: "var(--text-primary, #0F172A)", display: "block", marginTop: 4 }}>
              {telemetry?.tierBreakdown?.AMBASSADOR ?? 0}
            </strong>
            <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #64748B)" }}>50+ Referrals</span>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "OVERVIEW", label: "Referral Records Ledger" },
          { key: "FRAUD_QUEUE", label: `AI Anti-Fraud Queue (${fraudQueue.length})` },
          { key: "CAMPAIGNS", label: `AI Recommendations (${campaigns.length})` },
          { key: "CONFIG_RULES", label: "Configure Reward Rules & Tiers" },
          { key: "AUDIT_LOGS", label: "Immutable Audit Trail" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            style={{
              background: activeTab === t.key ? "#00A8B5" : "var(--bg-elevated, #FFFFFF)",
              color: activeTab === t.key ? "#FFFFFF" : "var(--text-primary, #0F172A)",
              border: "1px solid var(--border-primary, #E2E8F0)",
              padding: "8px 16px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: "12.5px",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW LEDGER */}
      {activeTab === "OVERVIEW" && (
        <div className="card" style={{ padding: "20px", borderRadius: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
            Recent Multi-Channel Referral Records
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--border-primary, #E2E8F0)", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Referrer (Recruiter)</th>
                  <th style={{ padding: "10px" }}>Referee (Invited)</th>
                  <th style={{ padding: "10px" }}>Program</th>
                  <th style={{ padding: "10px" }}>Vetting / Job</th>
                  <th style={{ padding: "10px" }}>AI Fraud Score</th>
                  <th style={{ padding: "10px" }}>Status</th>
                  <th style={{ padding: "10px" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary, #64748B)" }}>No referral records found.</td></tr>
                ) : (
                  recentRecords.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border-primary, #E2E8F0)" }}>
                      <td style={{ padding: "10px" }}>
                        <strong style={{ display: "block" }}>{r.referrerName}</strong>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary, #64748B)" }}>{r.referrerEmail}</span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <strong style={{ display: "block" }}>{r.refereeName}</strong>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary, #64748B)" }}>{r.refereeEmail}</span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#008B97" }}>
                          {r.programType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ padding: "10px", fontSize: "11.5px" }}>
                        <div>{r.isVerifiedReferee ? "✅ Vetted" : "⏳ Pending"}</div>
                        <div>{r.hasCompletedFirstJob ? "✅ 1st Job Done" : "⏳ No Job Yet"}</div>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: r.fraudScore > 40 ? "#DC2626" : r.fraudScore > 10 ? "#D97706" : "#059669",
                        }}>
                          {r.fraudScore}/100
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 99,
                          color: r.status === "QUALIFIED" ? "#047857" : r.status === "FLAGGED_FRAUD" ? "#DC2626" : "#D97706",
                          background: r.status === "QUALIFIED" ? "#D1FAE5" : r.status === "FLAGGED_FRAUD" ? "#FEE2E2" : "#FEF3C7",
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px", fontSize: "11.5px", color: "var(--text-secondary, #64748B)" }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AI ANTI-FRAUD QUEUE */}
      {activeTab === "FRAUD_QUEUE" && (
        <div className="card" style={{ padding: "20px", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
                AI Referral Anti-Fraud Investigation Queue
              </h3>
              <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
                Evaluates self-referral vectors, IP clustering, identity collision, and mutual booking cycles.
              </p>
            </div>
          </div>

          {fraudQueue.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", background: "rgba(16, 185, 129, 0.06)", borderRadius: 12 }}>
              <CheckCircle2 size={36} color="#10B981" style={{ marginBottom: 8 }} />
              <strong style={{ display: "block", fontSize: "14px", color: "var(--text-primary, #0F172A)" }}>Zero Fraud Anomalies Detected</strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary, #64748B)" }}>All referral events have passed AI biometric, IP, and collision checks.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {fraudQueue.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "var(--bg-elevated, #FFFFFF)",
                    border: "1.5px solid #FCA5A5",
                    borderRadius: 12,
                    padding: "16px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 14,
                  }}
                >
                  <div style={{ maxWidth: 550 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        background: "#DC2626",
                        color: "#FFFFFF",
                        padding: "2px 8px",
                        borderRadius: 99,
                      }}>
                        Risk Score: {item.fraudScore}/100
                      </span>
                      <strong style={{ fontSize: "13.5px", color: "var(--text-primary, #0F172A)" }}>
                        {item.programType.replace(/_/g, " ")}
                      </strong>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-secondary, #64748B)", marginBottom: 6 }}>
                      Referrer: <strong>{item.referrerName}</strong> ({item.referrerPhone}) ➔ Referee: <strong>{item.refereeName}</strong> ({item.refereePhone})
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {item.fraudFlags.map((flag: string, idx: number) => (
                        <span key={idx} style={{
                          fontSize: "10.5px",
                          background: "#FEE2E2",
                          color: "#DC2626",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontFamily: "monospace",
                          fontWeight: 700,
                        }}>
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleFraudOverride(item.id, "APPROVE")}
                      className="btn btn-primary btn-xs"
                      style={{ background: "#10B981", border: "none", borderRadius: 8, fontWeight: 700 }}
                    >
                      <Check size={13} /> Approve Override
                    </button>
                    <button
                      onClick={() => handleFraudOverride(item.id, "REJECT")}
                      className="btn btn-secondary btn-xs"
                      style={{ color: "#DC2626", borderColor: "#FCA5A5", borderRadius: 8, fontWeight: 700 }}
                    >
                      <X size={13} /> Block Referral
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI CAMPAIGN RECOMMENDATIONS */}
      {activeTab === "CAMPAIGNS" && (
        <div className="card" style={{ padding: "20px", borderRadius: 16 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
            AI-Synthesized Regional Referral Campaigns
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
            Autonomous campaign recommendations generated by analyzing live artisan dispatch density and booking queues.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                style={{
                  background: "linear-gradient(135deg, rgba(0, 168, 181, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%)",
                  border: "1.5px solid rgba(0, 168, 181, 0.3)",
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#8B5CF6", background: "rgba(139, 92, 246, 0.12)", padding: "2px 7px", borderRadius: 6 }}>
                      {camp.targetAudience} • {camp.regionOrZone}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#10B981" }}>
                      +{camp.projectedGrowthPercent}% Growth Projection
                    </span>
                  </div>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary, #0F172A)", display: "block", marginBottom: 4 }}>
                    {camp.title}
                  </strong>
                  <p style={{ margin: "0 0 8px", fontSize: "12px", color: "var(--text-secondary, #64748B)", lineHeight: 1.4 }}>
                    <strong>Rationale:</strong> {camp.rationale}
                  </p>
                  <div style={{ fontSize: "12px", color: "#008B97", background: "rgba(0, 168, 181, 0.08)", padding: "8px 10px", borderRadius: 8 }}>
                    <strong>Suggested Action:</strong> {camp.suggestedAction}
                  </div>
                </div>

                <button
                  onClick={() => setToast(`Campaign "${camp.title}" activated across regional push triggers! 🚀`)}
                  className="btn btn-primary btn-xs"
                  style={{ borderRadius: 8, fontWeight: 700, width: "100%" }}
                >
                  <Sparkles size={13} /> Activate Campaign Booster
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURE RULES */}
      {activeTab === "CONFIG_RULES" && (
        <div className="card" style={{ padding: "22px 24px", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
                Dynamic Program Rule & Reward Value Configurator
              </h3>
              <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary, #64748B)" }}>
                Adjust non-cash reward amounts, qualification criteria, and tier multipliers in real time.
              </p>
            </div>
            <button
              onClick={handleSaveRules}
              disabled={savingRules}
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Save size={14} /> {savingRules ? "Saving..." : "Save Policies"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
            {/* Section 1: Artisan to Artisan */}
            <div style={{ background: "var(--bg-tertiary, #F1F5F9)", padding: "16px 18px", borderRadius: 12, border: "1px solid var(--border-primary, #E2E8F0)" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "13.5px", fontWeight: 800, color: "#008B97" }}>
                1. Artisan-to-Artisan (Pro ➔ Pro) Rules
              </h4>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: 4 }}>
                  0% Commission Pass Jobs for Recruiter
                </label>
                <input
                  type="number"
                  value={rules.artisanToArtisan.referrerCommissionPassJobs}
                  onChange={(e) => setRules({
                    ...rules,
                    artisanToArtisan: { ...rules.artisanToArtisan, referrerCommissionPassJobs: parseInt(e.target.value) || 1 }
                  })}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "13px" }}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Recruiter Tool Marketplace Voucher (₦)
                </label>
                <input
                  type="number"
                  step="500"
                  value={rules.artisanToArtisan.referrerToolVoucherNgn}
                  onChange={(e) => setRules({
                    ...rules,
                    artisanToArtisan: { ...rules.artisanToArtisan, referrerToolVoucherNgn: parseFloat(e.target.value) || 0 }
                  })}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Referee Welcome Tool Voucher (₦)
                </label>
                <input
                  type="number"
                  step="500"
                  value={rules.artisanToArtisan.refereeToolVoucherNgn}
                  onChange={(e) => setRules({
                    ...rules,
                    artisanToArtisan: { ...rules.artisanToArtisan, refereeToolVoucherNgn: parseFloat(e.target.value) || 0 }
                  })}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "13px" }}
                />
              </div>
            </div>

            {/* Section 2: Customer to Customer */}
            <div style={{ background: "var(--bg-tertiary, #F1F5F9)", padding: "16px 18px", borderRadius: 12, border: "1px solid var(--border-primary, #E2E8F0)" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "13.5px", fontWeight: 800, color: "#3B82F6" }}>
                2. Customer-to-Customer (Client ➔ Client) Rules
              </h4>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Referrer Service Credit Grant (₦)
                </label>
                <input
                  type="number"
                  step="500"
                  value={rules.customerToCustomer.referrerServiceCreditNgn}
                  onChange={(e) => setRules({
                    ...rules,
                    customerToCustomer: { ...rules.customerToCustomer, referrerServiceCreditNgn: parseFloat(e.target.value) || 0 }
                  })}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "13px" }}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Referee Welcome Booking Discount Voucher (₦)
                </label>
                <input
                  type="number"
                  step="500"
                  value={rules.customerToCustomer.refereeBookingDiscountNgn}
                  onChange={(e) => setRules({
                    ...rules,
                    customerToCustomer: { ...rules.customerToCustomer, refereeBookingDiscountNgn: parseFloat(e.target.value) || 0 }
                  })}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Free Express Urgent Dispatch Upgrade Tokens
                </label>
                <input
                  type="number"
                  value={rules.customerToCustomer.referrerExpressTokens}
                  onChange={(e) => setRules({
                    ...rules,
                    customerToCustomer: { ...rules.customerToCustomer, referrerExpressTokens: parseInt(e.target.value) || 1 }
                  })}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "13px" }}
                />
              </div>
            </div>

            {/* Section 3: Customer to Artisan */}
            <div style={{ background: "var(--bg-tertiary, #F1F5F9)", padding: "16px 18px", borderRadius: 12, border: "1px solid var(--border-primary, #E2E8F0)" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "13.5px", fontWeight: 800, color: "#D97706" }}>
                3. Customer-to-Artisan (Discovery Bounty) Rules
              </h4>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Customer Discovery Service Credit Grant (₦)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={rules.customerToArtisan.referrerServiceCreditNgn}
                  onChange={(e) => setRules({
                    ...rules,
                    customerToArtisan: { ...rules.customerToArtisan, referrerServiceCreditNgn: parseFloat(e.target.value) || 0 }
                  })}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Referred Artisan 0% Commission Jobs
                </label>
                <input
                  type="number"
                  value={rules.customerToArtisan.refereeCommissionPassJobs}
                  onChange={(e) => setRules({
                    ...rules,
                    customerToArtisan: { ...rules.customerToArtisan, refereeCommissionPassJobs: parseInt(e.target.value) || 1 }
                  })}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: "13px" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === "AUDIT_LOGS" && (
        <div className="card" style={{ padding: "20px", borderRadius: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
            Immutable Referral & Recruiter Audit Ledger
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--border-primary, #E2E8F0)", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Action</th>
                  <th style={{ padding: "10px" }}>Actor Role</th>
                  <th style={{ padding: "10px" }}>IP Address</th>
                  <th style={{ padding: "10px" }}>Payload Details</th>
                  <th style={{ padding: "10px" }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary, #64748B)" }}>No audit records found.</td></tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--border-primary, #E2E8F0)" }}>
                      <td style={{ padding: "10px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#008B97", background: "rgba(0,168,181,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: "10px", fontWeight: 600 }}>{log.actorRole}</td>
                      <td style={{ padding: "10px", fontFamily: "monospace", fontSize: "11.5px" }}>{log.ipAddress || "Internal"}</td>
                      <td style={{ padding: "10px", fontFamily: "monospace", fontSize: "11px", color: "var(--text-secondary, #64748B)" }}>
                        {JSON.stringify(log.details)}
                      </td>
                      <td style={{ padding: "10px", fontSize: "11.5px", color: "var(--text-secondary, #64748B)" }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
