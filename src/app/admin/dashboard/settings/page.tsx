"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Settings, Download, Database, Shield, MapPin, CreditCard,
  Bell, CheckCircle2, RefreshCw, Lock, Save, Inbox, Sliders, DollarSign,
  Search, Tag, RotateCcw, Edit3
} from "lucide-react";
import { DEFAULT_PRICING_RULES, PricingRulesConfig, PricingModel } from "@/lib/pricingEngine";
import { DEFAULT_COMMISSION_RULES, CommissionRulesConfig } from "@/lib/escrow-types";
import { SERVICE_CATEGORIES } from "@/lib/services";
import styles from "../../admin.module.css";

interface CityControl {
  name: string;
  state: string;
  active: boolean;
  artisans: number;
}

export default function SettingsAndBackupsPage() {
  const [cities, setCities] = useState<CityControl[]>([
    { name: "Abuja (FCT)", state: "FCT", active: true, artisans: 0 },
    { name: "Lagos", state: "Lagos State", active: true, artisans: 0 },
    { name: "Port Harcourt", state: "Rivers State", active: true, artisans: 0 },
    { name: "Ibadan", state: "Oyo State", active: false, artisans: 0 },
    { name: "Kano", state: "Kano State", active: false, artisans: 0 },
    { name: "Benin City", state: "Edo State", active: false, artisans: 0 },
    { name: "Enugu", state: "Enugu State", active: false, artisans: 0 },
    { name: "Abeokuta", state: "Ogun State", active: false, artisans: 0 },
    { name: "Kaduna", state: "Kaduna State", active: false, artisans: 0 },
  ]);

  const [backupLoading, setBackupLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [loadingCities, setLoadingCities] = useState(true);

  // Pricing Rules State
  const [rulesConfig, setRulesConfig] = useState<PricingRulesConfig>(DEFAULT_PRICING_RULES);
  const [savingRules, setSavingRules] = useState(false);

  // Platform Commission & Escrow State
  const [commissionRules, setCommissionRules] = useState<CommissionRulesConfig>(DEFAULT_COMMISSION_RULES);
  const [savingCommission, setSavingCommission] = useState(false);
  const [commissionMetrics, setCommissionMetrics] = useState({
    totalEscrowHeld: 0,
    totalEscrowReleased: 0,
    totalPlatformCommissionEarned: 0,
    pendingWithdrawalCount: 0,
    pendingWithdrawalTotal: 0,
  });

  // Executive Service Pricing Filters & Overrides State
  const [modelFilter, setModelFilter] = useState<string>("ALL");
  const [serviceSearch, setServiceSearch] = useState<string>("");

  const fetchCommissionRules = async () => {
    try {
      const res = await fetch("/api/admin/commission-rules", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.rules) {
        setCommissionRules(data.rules);
        if (data.metrics) setCommissionMetrics(data.metrics);
      }
    } catch (err) {
      console.warn("Failed to fetch admin commission rules:", err);
    }
  };

  const handleSaveCommissionRules = async () => {
    setSavingCommission(true);
    try {
      const res = await fetch("/api/admin/commission-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: commissionRules }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast("Platform Commission & Escrow Policy saved successfully! 💳");
        fetchCommissionRules();
      } else {
        setToast(data.error || "Failed to save commission rules.");
      }
    } catch {
      setToast("Network error saving commission rules.");
    } finally {
      setSavingCommission(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const updateServiceOverride = (serviceId: string, field: "basePrice" | "pricingModel" | "unitLabel", value: any) => {
    const currentOverrides = rulesConfig.serviceOverrides || {};
    const existing = currentOverrides[serviceId] || {};
    const updated = { ...existing, [field]: value };
    setRulesConfig({
      ...rulesConfig,
      serviceOverrides: {
        ...currentOverrides,
        [serviceId]: updated,
      },
    });
  };

  const resetServiceOverride = (serviceId: string) => {
    if (!rulesConfig.serviceOverrides?.[serviceId]) return;
    const updated = { ...rulesConfig.serviceOverrides };
    delete updated[serviceId];
    setRulesConfig({
      ...rulesConfig,
      serviceOverrides: updated,
    });
  };

  const fetchPricingRules = async () => {
    try {
      const res = await fetch("/api/admin/pricing-rules", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
      const data = await res.json();
      if (res.ok && data.rules) {
        setRulesConfig(data.rules);
      }
    } catch (err) {
      console.warn("Failed to fetch admin pricing rules:", err);
    }
  };

  const fetchRealCityMetrics = async () => {
    setLoadingCities(true);
    try {
      const res = await fetch("/api/admin/telemetry");
      const data = await res.json();
      if (res.ok && data.cityArtisans) {
        setCities((prev) =>
          prev.map((c) => {
            const cityNameKey = c.name.split(" ")[0].toLowerCase();
            const realCount = data.cityArtisans[cityNameKey] || data.cityArtisans[c.name.toLowerCase()] || 0;
            return {
              ...c,
              artisans: realCount,
            };
          })
        );
      }
    } catch (err) {
      console.warn("Failed to fetch real city metrics:", err);
    } finally {
      setLoadingCities(false);
    }
  };

  useEffect(() => {
    fetchRealCityMetrics();
    fetchPricingRules();
    fetchCommissionRules();
  }, []);

  const toggleCity = (cityName: string) => {
    setCities((prev) =>
      prev.map((c) => (c.name === cityName ? { ...c, active: !c.active } : c))
    );
    setToast("Multi-City Expansion coverage updated!");
    setTimeout(() => setToast(""), 3000);
  };

  const [purgeLoading, setPurgeLoading] = useState(false);

  const handlePurgeDemo = async () => {
    if (!confirm("Are you sure you want to purge all demo mockup artisans, payments, reviews, and bookings from the database? This action cannot be undone.")) return;
    setPurgeLoading(true);
    try {
      const res = await fetch("/api/purge-all-demo-data-now", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setToast(`Database purged successfully! ${data.purged?.deletedPros || 0} demo pros & ${data.purged?.deletedPayments || 0} demo payments removed.`);
      }
    } catch (err) {
      setToast("Purge failed. Check server logs.");
    } finally {
      setPurgeLoading(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/admin/backup");
      const data = await res.json();
      if (res.ok) {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `handyhub_db_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setToast("Full Database Snapshot downloaded successfully!");
      }
    } catch (err) {
      setToast("Failed to generate database backup.");
    } finally {
      setBackupLoading(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const handleSavePricingRules = async () => {
    setSavingRules(true);
    try {
      const res = await fetch("/api/admin/pricing-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: rulesConfig }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast(data.message || "Pricing rules saved successfully!");
      } else {
        setToast(data.error || "Failed to save pricing rules.");
      }
    } catch (err: any) {
      setToast("Error saving pricing rules.");
    } finally {
      setSavingRules(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="h3">System Settings, Pricing Rules & Disaster Recovery</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Editable Nigerian pricing matrix, regional zone surcharges, multi-city state controls, and system database backups.
          </p>
        </div>
      </header>

      {toast && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          ✅ {toast}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Platform Commission Rates & Escrow Vault Policy Editor */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #10B981", padding: "24px", borderRadius: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <CreditCard size={20} color="#10B981" /> Platform Commission & Escrow Vault Policy Management
              </h3>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                Configure platform fee splits, dispute escrow hold timers, withdrawal limits, and per-category commission rules.
              </span>
            </div>

            <button
              onClick={handleSaveCommissionRules}
              disabled={savingCommission}
              className="btn btn-primary btn-md"
              style={{ background: "#10B981", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Save size={16} /> {savingCommission ? "Saving Policy..." : "Save Commission Policy Live 💾"}
            </button>
          </div>

          {/* Escrow Telemetry Metric Chips */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "10px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#F59E0B", fontWeight: 700, textTransform: "uppercase" }}>Escrow Vault Active</span>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#F59E0B", marginTop: 4 }}>₦{commissionMetrics.totalEscrowHeld.toLocaleString()}</div>
            </div>
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "10px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, textTransform: "uppercase" }}>Total Escrow Released</span>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#10B981", marginTop: 4 }}>₦{commissionMetrics.totalEscrowReleased.toLocaleString()}</div>
            </div>
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "10px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#38BDF8", fontWeight: 700, textTransform: "uppercase" }}>Platform Revenue Earned</span>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#38BDF8", marginTop: 4 }}>₦{commissionMetrics.totalPlatformCommissionEarned.toLocaleString()}</div>
            </div>
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "10px", padding: "12px 16px" }}>
              <span style={{ fontSize: "11px", color: "#A855F7", fontWeight: 700, textTransform: "uppercase" }}>Pending Withdrawals</span>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#A855F7", marginTop: 4 }}>
                {commissionMetrics.pendingWithdrawalCount} (₦{commissionMetrics.pendingWithdrawalTotal.toLocaleString()})
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Global Rules */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "12px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#10B981", fontSize: "14px", fontWeight: 700 }}>
                ⚙️ Global Financial & Escrow Controls
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>Default Platform Commission Rate (%)</label>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#10B981" }}>{commissionRules.defaultRatePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    step="1"
                    value={commissionRules.defaultRatePercent}
                    onChange={(e) => setCommissionRules({ ...commissionRules, defaultRatePercent: Number(e.target.value) })}
                    style={{ width: "100%", accentColor: "#10B981" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Escrow Dispute Protection Window (Hours before Auto-Release)
                  </label>
                  <input
                    type="number"
                    value={commissionRules.escrowHoldHours}
                    onChange={(e) => setCommissionRules({ ...commissionRules, escrowHoldHours: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "14px", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Minimum Artisan Withdrawal (NGN ₦)
                  </label>
                  <input
                    type="number"
                    value={commissionRules.minWithdrawalNgn}
                    onChange={(e) => setCommissionRules({ ...commissionRules, minWithdrawalNgn: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "14px", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Max Daily Withdrawal Threshold (NGN ₦)
                  </label>
                  <input
                    type="number"
                    value={commissionRules.maxDailyWithdrawalNgn}
                    onChange={(e) => setCommissionRules({ ...commissionRules, maxDailyWithdrawalNgn: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "14px", fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>

            {/* Category Commission Overrides */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "12px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#38BDF8", fontSize: "14px", fontWeight: 700 }}>
                🏷️ Category-Specific Commission Overrides (%)
              </h4>
              <span style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "12px" }}>
                Artisans keep 100% minus the platform rate.
              </span>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxHeight: "250px", overflowY: "auto", paddingRight: "4px" }}>
                {[
                  { slug: "cleaning", name: "Cleaning Services" },
                  { slug: "plumbing", name: "Plumbing" },
                  { slug: "electrical", name: "Electrical" },
                  { slug: "painting", name: "Painting" },
                  { slug: "hvac", name: "AC & Refrigeration" },
                  { slug: "solar", name: "Solar & Inverter" },
                  { slug: "carpentry", name: "Carpentry" },
                  { slug: "security", name: "CCTV & Security" },
                  { slug: "home-improvement", name: "Home Renovation" },
                  { slug: "outdoor", name: "Gardening & Lawn" },
                  { slug: "laundry", name: "Laundry Services" },
                  { slug: "moving", name: "Relocation & Moving" },
                ].map((cat) => {
                  const currentRate = commissionRules.categoryRates[cat.slug] ?? commissionRules.defaultRatePercent;
                  return (
                    <div key={cat.slug} style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", padding: "8px 10px" }}>
                      <label style={{ fontSize: "11px", color: "#F8FAFC", fontWeight: 600, display: "block", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {cat.name}
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          value={currentRate}
                          onChange={(e) => {
                            setCommissionRules({
                              ...commissionRules,
                              categoryRates: {
                                ...commissionRules.categoryRates,
                                [cat.slug]: Number(e.target.value),
                              },
                            });
                          }}
                          style={{ width: "60px", padding: "4px 6px", borderRadius: "4px", border: "1px solid #475569", background: "#0F172A", color: "#10B981", fontSize: "13px", fontWeight: "bold" }}
                        />
                        <span style={{ fontSize: "12px", color: "#94A3B8" }}>% (Pro: {100 - currentRate}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Nigerian Pricing Rules & Regional Surcharge Matrix Editor */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #0EA5E9", padding: "24px", borderRadius: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sliders size={20} color="#0EA5E9" /> Nigerian Pricing Rules & Regional Surcharge Matrix
              </h3>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                Configure property size add-ons, furnished surcharges, grime multipliers, and regional zone percentages live across all customer booking flows.
              </span>
            </div>

            <button
              onClick={handleSavePricingRules}
              disabled={savingRules}
              className="btn btn-primary btn-md"
              style={{ background: "#0EA5E9", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Save size={16} /> {savingRules ? "Saving Rules..." : "Save Pricing Matrix Live 💾"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Column 1: Property Size & Condition Add-ons */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "12px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#38BDF8", fontSize: "14px", fontWeight: 700 }}>
                🏠 Property Size & Condition Add-ons (Deep Cleaning & Residential)
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Additional Bedroom Fee (NGN ₦ / room)
                  </label>
                  <input
                    type="number"
                    value={rulesConfig.bedroomAddonNgn}
                    onChange={(e) => setRulesConfig({ ...rulesConfig, bedroomAddonNgn: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "14px", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Additional Bathroom Fee (NGN ₦ / bath)
                  </label>
                  <input
                    type="number"
                    value={rulesConfig.bathroomAddonNgn}
                    onChange={(e) => setRulesConfig({ ...rulesConfig, bathroomAddonNgn: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "14px", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Furnished Property Surcharge (NGN ₦ flat)
                  </label>
                  <input
                    type="number"
                    value={rulesConfig.furnishedSurchargeNgn}
                    onChange={(e) => setRulesConfig({ ...rulesConfig, furnishedSurchargeNgn: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "14px", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Service Plan Multipliers (Silver / Gold / Platinum)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>🥈 Silver</span>
                      <input
                        type="number"
                        step="0.05"
                        value={rulesConfig.planMultipliers?.SILVER ?? 1.0}
                        onChange={(e) => setRulesConfig({ ...rulesConfig, planMultipliers: { ...(rulesConfig.planMultipliers || DEFAULT_PRICING_RULES.planMultipliers), SILVER: Number(e.target.value) } })}
                        style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "12px", fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#F59E0B", fontWeight: 700 }}>🥇 Gold</span>
                      <input
                        type="number"
                        step="0.05"
                        value={rulesConfig.planMultipliers?.GOLD ?? 1.25}
                        onChange={(e) => setRulesConfig({ ...rulesConfig, planMultipliers: { ...(rulesConfig.planMultipliers || DEFAULT_PRICING_RULES.planMultipliers), GOLD: Number(e.target.value) } })}
                        style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "12px", fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#38BDF8", fontWeight: 700 }}>💎 Platinum</span>
                      <input
                        type="number"
                        step="0.05"
                        value={rulesConfig.planMultipliers?.PLATINUM ?? 1.5}
                        onChange={(e) => setRulesConfig({ ...rulesConfig, planMultipliers: { ...(rulesConfig.planMultipliers || DEFAULT_PRICING_RULES.planMultipliers), PLATINUM: Number(e.target.value) } })}
                        style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "12px", fontWeight: 600 }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Condition Multipliers (Light / Moderate / Heavy)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "#94A3B8" }}>Light (1.0x)</span>
                      <input
                        type="number"
                        step="0.05"
                        value={rulesConfig.dirtLevelMultipliers?.LIGHT ?? 1.0}
                        onChange={(e) => setRulesConfig({ ...rulesConfig, dirtLevelMultipliers: { ...(rulesConfig.dirtLevelMultipliers || DEFAULT_PRICING_RULES.dirtLevelMultipliers), LIGHT: Number(e.target.value) } })}
                        style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#F59E0B" }}>Moderate (1.15x)</span>
                      <input
                        type="number"
                        step="0.05"
                        value={rulesConfig.dirtLevelMultipliers?.MODERATE ?? 1.15}
                        onChange={(e) => setRulesConfig({ ...rulesConfig, dirtLevelMultipliers: { ...(rulesConfig.dirtLevelMultipliers || DEFAULT_PRICING_RULES.dirtLevelMultipliers), MODERATE: Number(e.target.value) } })}
                        style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#EF4444" }}>Heavy/Post (1.35x)</span>
                      <input
                        type="number"
                        step="0.05"
                        value={rulesConfig.dirtLevelMultipliers?.HEAVY ?? 1.35}
                        onChange={(e) => setRulesConfig({ ...rulesConfig, dirtLevelMultipliers: { ...(rulesConfig.dirtLevelMultipliers || DEFAULT_PRICING_RULES.dirtLevelMultipliers), HEAVY: Number(e.target.value) } })}
                        style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "12px" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Regional Zone Surcharge Modifiers */}
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "12px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#F59E0B", fontSize: "14px", fontWeight: 700 }}>
                📍 Regional Zone Modifiers (% Surcharge per Location Tier)
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {rulesConfig.regionalZones.map((z, idx) => (
                  <div key={z.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1E293B", padding: "8px 12px", borderRadius: "8px", border: "1px solid #334155" }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <span style={{ fontSize: "12px", color: "#F8FAFC", fontWeight: 600, display: "block" }}>{z.name}</span>
                      <span style={{ fontSize: "10px", color: "#94A3B8" }}>State: {z.state}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: "12px", color: "#F59E0B", fontWeight: 700 }}>+</span>
                      <input
                        type="number"
                        value={z.modifierPercent}
                        onChange={(e) => {
                          const updatedZones = [...rulesConfig.regionalZones];
                          updatedZones[idx].modifierPercent = Number(e.target.value);
                          setRulesConfig({ ...rulesConfig, regionalZones: updatedZones });
                        }}
                        style={{ width: 60, padding: "4px 6px", borderRadius: "6px", border: "1px solid #334155", background: "#0F172A", color: "#10B981", fontWeight: "bold", fontSize: "13px", textAlign: "center" }}
                      />
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Executive Service Price & Pricing Model Manager Card */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #10B981", padding: "24px", borderRadius: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <Edit3 size={20} color="#10B981" /> Executive Service Price & Model Manager
              </h3>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                Adjust base prices, per-unit rates, unit labels, and pricing models (Fixed, Property-Based, Quantity-Based & Custom Quote) live without editing database code.
              </span>
            </div>

            <button
              onClick={handleSavePricingRules}
              disabled={savingRules}
              className="btn btn-primary btn-md"
              style={{ background: "#10B981", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}
            >
              <Save size={16} /> {savingRules ? "Saving Adjustments..." : "Save Executive Adjustments Live 💾"}
            </button>
          </div>

          {/* Controls Bar: Search & Model Filter Tabs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px", flexWrap: "wrap", background: "#0F172A", padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1E293B", padding: "6px 12px", borderRadius: "8px", border: "1px solid #334155", flex: "1", maxWidth: "340px" }}>
              <Search size={16} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search services (e.g. 'Pipe', 'AC', 'Cleaning')..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                style={{ background: "transparent", border: "none", color: "#F8FAFC", outline: "none", width: "100%", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "ALL", label: "All Models" },
                { id: "FIXED", label: "Fixed Price" },
                { id: "PROPERTY_BASED", label: "Property-Based" },
                { id: "QUANTITY_BASED", label: "Quantity-Based" },
                { id: "CUSTOM_QUOTE", label: "Custom Quote" },
                { id: "SUBSCRIPTION", label: "Monthly Subscription" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setModelFilter(f.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: modelFilter === f.id ? "#10B981" : "#334155",
                    background: modelFilter === f.id ? "rgba(16,185,129,0.15)" : "#1E293B",
                    color: modelFilter === f.id ? "#10B981" : "#94A3B8",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service Categories Accordion / List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {SERVICE_CATEGORIES.map((cat) => {
              // Filter services in this category by search & model
              const filteredServices = cat.services.filter((svc) => {
                const override = rulesConfig.serviceOverrides?.[svc.id];
                const activeModel = override?.pricingModel || svc.pricingModel || "FIXED";
                const matchesModel = modelFilter === "ALL" || activeModel === modelFilter;
                const matchesSearch = !serviceSearch || svc.name.toLowerCase().includes(serviceSearch.toLowerCase()) || svc.desc.toLowerCase().includes(serviceSearch.toLowerCase());
                return matchesModel && matchesSearch;
              });

              if (filteredServices.length === 0) return null;

              return (
                <div key={cat.id} style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", borderBottom: "1px solid #1E293B", paddingBottom: "10px" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: cat.color }} />
                    <h4 style={{ margin: 0, color: "#F8FAFC", fontSize: "15px", fontWeight: 700 }}>{cat.name}</h4>
                    <span style={{ fontSize: "11px", color: "#94A3B8", background: "#1E293B", padding: "2px 8px", borderRadius: "10px" }}>
                      {filteredServices.length} service{filteredServices.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {filteredServices.map((svc) => {
                      const override = rulesConfig.serviceOverrides?.[svc.id];
                      const isOverridden = !!override && (override.basePrice !== undefined || override.pricingModel !== undefined || override.unitLabel !== undefined);
                      const currentModel = override?.pricingModel || svc.pricingModel || "FIXED";
                      const currentPrice = override?.basePrice !== undefined ? override.basePrice : svc.price;
                      const currentUnitLabel = override?.unitLabel !== undefined ? override.unitLabel : (svc.unitLabel || "per unit");

                      return (
                        <div
                          key={svc.id}
                          style={{
                            background: "#1E293B",
                            border: isOverridden ? "1px solid #10B981" : "1px solid #334155",
                            borderRadius: "10px",
                            padding: "14px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "14px",
                          }}
                        >
                          {/* Service Info */}
                          <div style={{ flex: 1, minWidth: "220px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <strong style={{ color: "#F8FAFC", fontSize: "14px" }}>{svc.name}</strong>
                              {isOverridden && (
                                <span style={{ fontSize: "10px", fontWeight: 800, background: "rgba(16,185,129,0.2)", color: "#10B981", padding: "2px 6px", borderRadius: "4px" }}>
                                  EXECUTIVE ADJUSTED
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "12px", color: "#94A3B8", display: "block" }}>{svc.desc}</span>
                          </div>

                          {/* Controls: Model Dropdown & Price Input */}
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            {/* Pricing Model Selector */}
                            <div>
                              <span style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginBottom: 2 }}>Pricing Model</span>
                              <select
                                value={currentModel}
                                onChange={(e) => updateServiceOverride(svc.id, "pricingModel", e.target.value as PricingModel)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #334155",
                                  background: "#0F172A",
                                  color:
                                    currentModel === "PROPERTY_BASED"
                                      ? "#38BDF8"
                                      : currentModel === "QUANTITY_BASED"
                                      ? "#F59E0B"
                                      : currentModel === "CUSTOM_QUOTE"
                                      ? "#C084FC"
                                      : "#10B981",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  outline: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <option value="FIXED">FIXED (Flat Rate)</option>
                                <option value="PROPERTY_BASED">PROPERTY_BASED (Property Size)</option>
                                <option value="QUANTITY_BASED">QUANTITY_BASED (Per Unit)</option>
                                <option value="CUSTOM_QUOTE">CUSTOM_QUOTE (Inspection)</option>
                                <option value="SUBSCRIPTION">SUBSCRIPTION (Monthly Plan)</option>
                              </select>
                            </div>

                            {/* Base Price / Unit Price / Monthly Fee Input */}
                            <div>
                              <span style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginBottom: 2 }}>
                                {currentModel === "QUANTITY_BASED"
                                  ? "Per-Unit Rate (₦)"
                                  : currentModel === "SUBSCRIPTION"
                                  ? "Monthly Fee (₦)"
                                  : currentModel === "CUSTOM_QUOTE"
                                  ? "Quote Cost"
                                  : "Base Rate (₦)"}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", background: "#0F172A", border: "1px solid #334155", borderRadius: "6px", padding: "0 8px" }}>
                                <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 700, marginRight: 4 }}>₦</span>
                                <input
                                  type="number"
                                  disabled={currentModel === "CUSTOM_QUOTE"}
                                  value={currentModel === "CUSTOM_QUOTE" ? 0 : currentPrice}
                                  onChange={(e) => updateServiceOverride(svc.id, "basePrice", Number(e.target.value))}
                                  style={{
                                    width: "90px",
                                    padding: "6px 0",
                                    border: "none",
                                    background: "transparent",
                                    color: currentModel === "CUSTOM_QUOTE" ? "#94A3B8" : "#F8FAFC",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    outline: "none",
                                  }}
                                />
                              </div>
                            </div>

                            {/* Unit Label Input (shown for Quantity-based) */}
                            {currentModel === "QUANTITY_BASED" && (
                              <div>
                                <span style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginBottom: 2 }}>Unit Label</span>
                                <input
                                  type="text"
                                  value={currentUnitLabel}
                                  onChange={(e) => updateServiceOverride(svc.id, "unitLabel", e.target.value)}
                                  placeholder="e.g. per socket"
                                  style={{
                                    width: "110px",
                                    padding: "6px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid #334155",
                                    background: "#0F172A",
                                    color: "#F8FAFC",
                                    fontSize: "12px",
                                    outline: "none",
                                  }}
                                />
                              </div>
                            )}

                            {/* Reset Button */}
                            {isOverridden && (
                              <button
                                type="button"
                                onClick={() => resetServiceOverride(svc.id)}
                                title="Reset to system default"
                                style={{
                                  background: "rgba(239,68,68,0.15)",
                                  border: "1px solid #EF4444",
                                  color: "#EF4444",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  marginTop: "16px",
                                }}
                              >
                                <RotateCcw size={12} /> Reset
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database Snapshot & Disaster Recovery Section */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <Database size={18} color="#0EA5E9" /> Database Snapshot & Backups
              </h3>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>Generate full JSON database dump of real users, bookings, payments, disputes, and audit logs.</span>
            </div>
            <button
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              className="btn btn-primary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Download size={16} /> {backupLoading ? "Generating..." : "Download System Backup (.json)"}
            </button>
          </div>
          <p style={{ fontSize: "13px", color: "#CBD5E1", background: "#0F172A", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
            🔒 <strong>Disaster Recovery Protocol:</strong> Backups are encrypted and contain complete system telemetry. Chief Commander or Admin General role credentials required.
          </p>
        </div>

        {/* Purge Demo Mockups Section */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #EF4444", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 className="h4" style={{ margin: 0, color: "#EF4444", display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={18} color="#EF4444" /> Purge Demo Mockups & Seed Data
              </h3>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>Purge all test mockups, fake demo artisans, and simulated payment logs. Leave ONLY live registered artisans and real transactions.</span>
            </div>
            <button
              onClick={handlePurgeDemo}
              disabled={purgeLoading}
              className="btn btn-secondary btn-sm"
              style={{ color: "#EF4444", borderColor: "#EF4444", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={14} className={purgeLoading ? "animate-spin" : ""} /> {purgeLoading ? "Purging Demo..." : "Purge All Demo Data 🗑️"}
            </button>
          </div>
        </div>

        {/* Multi-City Expansion Beyond Abuja Section */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={18} color="#10B981" /> Multi-City & Regional Expansion Controls
              </h3>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>Enable/disable marketplace operations based on real registered artisan density per state.</span>
            </div>
            <button onClick={fetchRealCityMetrics} className="btn btn-secondary btn-xs" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <RefreshCw size={12} /> Sync Database Counts
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {cities.map((c) => (
              <div
                key={c.name}
                style={{
                  background: "#0F172A",
                  border: c.active ? "1px solid #10B981" : "1px solid #334155",
                  borderRadius: "10px",
                  padding: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "14px", color: "#F8FAFC", display: "block" }}>{c.name}</strong>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                    {c.state} • <strong style={{ color: "#0EA5E9" }}>{c.artisans} Registered Artisans</strong>
                  </span>
                </div>
                <button
                  onClick={() => toggleCity(c.name)}
                  style={{
                    background: c.active ? "rgba(16,185,129,0.15)" : "rgba(148,163,184,0.1)",
                    color: c.active ? "#10B981" : "#94A3B8",
                    border: c.active ? "1px solid #10B981" : "1px solid #334155",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {c.active ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Payment Gateways & Currency Section */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px" }}>
          <h3 className="h4" style={{ margin: "0 0 16px 0", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
            <CreditCard size={18} color="#F59E0B" /> Payment Gateways & Currency (NGN ₦)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "10px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ color: "#0EA5E9" }}>Paystack Gateway Primary</strong>
                <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", fontSize: "10px" }}>ONLINE</span>
              </div>
              <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>Processes NGN Card Payments, USSD, Bank Transfer, and Escrow Payouts.</p>
            </div>
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "10px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ color: "#F59E0B" }}>Monnify Gateway Secondary</strong>
                <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", fontSize: "10px" }}>ONLINE</span>
              </div>
              <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>Processes Direct NUBAN Accounts, Instant Transfers & Refunds.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
