"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Settings, Download, Database, Shield, MapPin, CreditCard,
  Bell, CheckCircle2, RefreshCw, Lock, Save, Inbox, Sliders, DollarSign
} from "lucide-react";
import { DEFAULT_PRICING_RULES, PricingRulesConfig } from "@/lib/pricingEngine";
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

  const fetchPricingRules = async () => {
    try {
      const res = await fetch("/api/admin/pricing-rules");
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
                    Condition Multipliers (Light / Moderate / Heavy)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "#94A3B8" }}>Light (1.0x)</span>
                      <input
                        type="number"
                        step="0.05"
                        value={rulesConfig.dirtLevelMultipliers.LIGHT}
                        onChange={(e) => setRulesConfig({ ...rulesConfig, dirtLevelMultipliers: { ...rulesConfig.dirtLevelMultipliers, LIGHT: Number(e.target.value) } })}
                        style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#F59E0B" }}>Moderate (1.15x)</span>
                      <input
                        type="number"
                        step="0.05"
                        value={rulesConfig.dirtLevelMultipliers.MODERATE}
                        onChange={(e) => setRulesConfig({ ...rulesConfig, dirtLevelMultipliers: { ...rulesConfig.dirtLevelMultipliers, MODERATE: Number(e.target.value) } })}
                        style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#EF4444" }}>Heavy/Post (1.35x)</span>
                      <input
                        type="number"
                        step="0.05"
                        value={rulesConfig.dirtLevelMultipliers.HEAVY}
                        onChange={(e) => setRulesConfig({ ...rulesConfig, dirtLevelMultipliers: { ...rulesConfig.dirtLevelMultipliers, HEAVY: Number(e.target.value) } })}
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
