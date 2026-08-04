"use client";

import { useState } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { Settings, Save, ShieldCheck, CheckCircle2 } from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminSettingsPage() {
  const [commissionRate, setCommissionRate] = useState("15");
  const [escrowHours, setEscrowHours] = useState("24");
  const [autoAssign, setAutoAssign] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Admin System Settings</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Configure platform fees, escrow window duration, and matching parameters.
          </p>
        </div>
      </header>

      <div className={styles.adminContent}>
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 className="h4" style={{ marginBottom: "var(--space-4)" }}>Platform Controls</h3>

          {saved && (
            <div style={{ padding: 12, background: "rgba(16,185,129,0.1)", color: "#10B981", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: "14px", fontWeight: "bold" }}>
              <CheckCircle2 size={16} /> System settings saved successfully!
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
                Platform Commission Fee (%)
              </label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
                Escrow Payout Holding Window (Hours)
              </label>
              <input
                type="number"
                value={escrowHours}
                onChange={(e) => setEscrowHours(e.target.value)}
                style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="checkbox"
                id="autoAssign"
                checked={autoAssign}
                onChange={(e) => setAutoAssign(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#0EA5E9" }}
              />
              <label htmlFor="autoAssign" style={{ fontSize: "var(--fs-sm)", cursor: "pointer" }}>
                Enable Automatic Location Intelligence Pro Matching
              </label>
            </div>

            <button className="btn btn-primary btn-md" onClick={handleSave} style={{ marginTop: 12 }}>
              <Save size={16} /> Save Configuration
            </button>
          </div>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
