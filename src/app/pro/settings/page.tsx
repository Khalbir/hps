"use client";

import { useState } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Settings, Save, CheckCircle2, Building, MapPin, Bell } from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProSettingsPage() {
  const [bankName, setBankName] = useState("Guaranty Trust Bank (GTBank)");
  const [accountNumber, setAccountNumber] = useState("0123456789");
  const [accountName, setAccountName] = useState("Blessing Okon");
  const [radius, setRadius] = useState("15");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 className="h2">Account Settings & Bank Payout Details</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
          Manage your bank account details for instant withdrawals and set your preferred service radius.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <h3 className="h4" style={{ marginBottom: "var(--space-4)" }}>Bank Account & Dispatch Preferences</h3>

        {saved && (
          <div style={{ padding: 12, background: "rgba(16,185,129,0.1)", color: "#10B981", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: "14px", fontWeight: "bold" }}>
            <CheckCircle2 size={16} /> Account settings saved successfully!
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
              Bank Name
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
              10-Digit NUBAN Account Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
              Preferred Service Dispatch Radius (KM)
            </label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
            />
          </div>

          <button className="btn btn-primary btn-md" onClick={handleSave} style={{ marginTop: 12 }}>
            <Save size={16} /> Save Settings
          </button>
        </div>
      </div>
    </ProLayoutShell>
  );
}
