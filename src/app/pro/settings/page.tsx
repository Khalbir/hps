"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Settings, Save, CheckCircle2, Building, MapPin, Bell } from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProSettingsPage() {
  const [bankName, setBankName] = useState("Access Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [radius, setRadius] = useState("25");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user) {
          setAccountName(`${parsed.user.firstName || ""} ${parsed.user.lastName || ""}`.trim());
        } else if (parsed?.firstName) {
          setAccountName(`${parsed.firstName || ""} ${parsed.lastName || ""}`.trim());
        }
      } catch (err) {}
    }
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
            <CheckCircle2 size={16} /> Account payout preferences saved successfully!
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
              Bank Name
            </label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
            >
              <option value="Access Bank">Access Bank</option>
              <option value="GTBank">Guaranty Trust Bank (GTB)</option>
              <option value="First Bank">First Bank of Nigeria</option>
              <option value="Zenith Bank">Zenith Bank</option>
              <option value="UBA">United Bank for Africa (UBA)</option>
              <option value="Kuda Bank">Kuda Microfinance Bank</option>
              <option value="Opay">OPay Digital Services</option>
              <option value="Palmpay">PalmPay</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
              10-Digit NUBAN Account Number
            </label>
            <input
              type="text"
              maxLength={10}
              placeholder="Enter 10-digit NUBAN account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", letterSpacing: 2 }}
            />
          </div>

          <div>
            <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
              Bank Account Name
            </label>
            <input
              type="text"
              placeholder="Enter bank account full name"
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

          <div style={{ marginTop: "var(--space-2)" }}>
            <button className="btn btn-primary btn-md" onClick={handleSave} style={{ background: "#0EA5E9" }}>
              Save Account Settings ➔
            </button>
          </div>
        </div>
      </div>
    </ProLayoutShell>
  );
}
