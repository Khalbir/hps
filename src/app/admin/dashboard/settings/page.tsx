"use client";

import { useState } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Settings, Download, Database, Shield, MapPin, CreditCard,
  Bell, CheckCircle2, RefreshCw, Lock, Save
} from "lucide-react";
import styles from "../../admin.module.css";

const expansionCities = [
  { name: "Abuja (FCT)", state: "FCT", active: true, artisans: 142 },
  { name: "Lagos", state: "Lagos State", active: true, artisans: 98 },
  { name: "Port Harcourt", state: "Rivers State", active: true, artisans: 38 },
  { name: "Ibadan", state: "Oyo State", active: true, artisans: 24 },
  { name: "Kano", state: "Kano State", active: true, artisans: 14 },
  { name: "Benin City", state: "Edo State", active: true, artisans: 10 },
  { name: "Enugu", state: "Enugu State", active: false, artisans: 0 },
  { name: "Abeokuta", state: "Ogun State", active: false, artisans: 0 },
  { name: "Kaduna", state: "Kaduna State", active: false, artisans: 0 },
];

export default function SettingsAndBackupsPage() {
  const [cities, setCities] = useState(expansionCities);
  const [backupLoading, setBackupLoading] = useState(false);
  const [toast, setToast] = useState("");

  const toggleCity = (cityName: string) => {
    setCities((prev) =>
      prev.map((c) => (c.name === cityName ? { ...c, active: !c.active } : c))
    );
    setToast("Multi-City Expansion coverage updated!");
    setTimeout(() => setToast(""), 3000);
  };

  const handleDownloadBackup = () => {
    setBackupLoading(true);
    window.open("/api/admin/backup?adminId=SUPER_ADMIN", "_blank");
    setTimeout(() => {
      setBackupLoading(false);
      setToast("Database snapshot JSON generated and downloaded!");
      setTimeout(() => setToast(""), 4000);
    }, 1200);
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="h3">System Settings, Database Backups & Expansion</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Database backup snapshots, multi-city state expansion (Abuja & beyond), Paystack/Monnify gateway config, and notification switches.
          </p>
        </div>
      </header>

      {toast && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          ✅ {toast}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Database Snapshot & Disaster Recovery Section */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <Database size={18} color="#0EA5E9" /> Database Snapshot & Backups
              </h3>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>Generate full JSON database dump of users, bookings, payments, disputes, and audit logs.</span>
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
            🔒 <strong>Disaster Recovery Protocol:</strong> Backups are encrypted and contain complete system telemetry. Super Admin role credentials required.
          </p>
        </div>

        {/* Multi-City Expansion Beyond Abuja Section */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={18} color="#10B981" /> Multi-City & Regional Expansion Controls
              </h3>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>Enable/disable marketplace operations for states beyond Abuja</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {cities.map((c) => (
              <div
                key={c.name}
                style={{
                  background: "#0F172A",
                  border: c.active ? "1px solid #10B981" : "1px solid #334155",
                  borderRadius: "8px",
                  padding: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "14px", color: "#F8FAFC", display: "block" }}>{c.name}</strong>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>{c.state} • {c.artisans} Artisans</span>
                </div>
                <button
                  onClick={() => toggleCity(c.name)}
                  className="btn btn-xs"
                  style={{
                    background: c.active ? "rgba(16,185,129,0.2)" : "rgba(100,116,139,0.2)",
                    color: c.active ? "#10B981" : "#64748B",
                    border: "none",
                  }}
                >
                  {c.active ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Gateways Config */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px" }}>
          <h3 className="h4" style={{ margin: "0 0 16px 0", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
            <CreditCard size={18} color="#8B5CF6" /> Payment Gateways & Currency (NGN ₦)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "#0F172A", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <strong style={{ color: "#0EA5E9" }}>Paystack Gateway Primary</strong>
                <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", fontSize: "10px" }}>ONLINE</span>
              </div>
              <p style={{ fontSize: "12px", color: "#94A3B8" }}>Processes NGN Card Payments, USSD, Bank Transfer, and Escrow Payouts.</p>
            </div>

            <div style={{ background: "#0F172A", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <strong style={{ color: "#F59E0B" }}>Monnify Gateway Secondary</strong>
                <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", fontSize: "10px" }}>ONLINE</span>
              </div>
              <p style={{ fontSize: "12px", color: "#94A3B8" }}>Processes Direct NUBAN Accounts, Instant Transfers & Refunds.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
