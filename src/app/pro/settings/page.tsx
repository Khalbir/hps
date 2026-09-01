"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import {
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Save,
  MapPin,
} from "lucide-react";
import { NIGERIAN_BANKS } from "@/lib/banks";

export default function ProSettingsPage() {
  const [bankName, setBankName] = useState("Access Bank");
  const [bankCode, setBankCode] = useState("044");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [registeredName, setRegisteredName] = useState("");
  const [radius, setRadius] = useState("25");

  const [resolving, setResolving] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: "IDLE" | "RESOLVING" | "MATCH" | "MISMATCH" | "ERROR";
    message: string;
    resolvedName?: string;
    matchScore?: number;
  }>({ status: "IDLE", message: "" });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [userId, setUserId] = useState("");

  // Load Active Session & Current Settings
  useEffect(() => {
    let activeUserId = "";
    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro
          ? JSON.parse(storedPro)
          : storedUser
          ? JSON.parse(storedUser)
          : null;
        if (parsed?.user?.id || parsed?.id) {
          activeUserId = parsed.user?.id || parsed.id;
          setUserId(activeUserId);
        }
        if (parsed?.user) {
          const name = `${parsed.user.firstName || ""} ${parsed.user.lastName || ""}`.trim() || parsed.user.name || "";
          setRegisteredName(name);
        } else if (parsed?.firstName) {
          const name = `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim() || parsed.name || "";
          setRegisteredName(name);
        }
      } catch (err) {}
    }

    if (activeUserId) {
      fetch(`/api/pro/settings?userId=${activeUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.registeredName) setRegisteredName(data.registeredName);
          if (data.settings) {
            if (data.settings.bankName) {
              setBankName(data.settings.bankName);
              const foundBank = NIGERIAN_BANKS.find(
                (b) => b.name.toLowerCase() === data.settings.bankName.toLowerCase()
              );
              if (foundBank) setBankCode(foundBank.code);
            }
            if (data.settings.bankCode) setBankCode(data.settings.bankCode);
            if (data.settings.accountNumber) setAccountNumber(data.settings.accountNumber);
            if (data.settings.accountName) {
              setAccountName(data.settings.accountName);
              setVerificationResult({
                status: "MATCH",
                message: `Verified: Account linked to ${data.settings.accountName}`,
                resolvedName: data.settings.accountName,
                matchScore: 100,
              });
            }
            if (data.settings.radius) setRadius(data.settings.radius);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Handle Bank Selection Change
  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const foundBank = NIGERIAN_BANKS.find((b) => b.code === selectedCode);
    if (foundBank) {
      setBankName(foundBank.name);
      setBankCode(foundBank.code);
    }
  };

  // Auto-Resolve Account Name when 10 digits are typed
  useEffect(() => {
    if (!accountNumber || accountNumber.length !== 10) {
      if (accountNumber.length > 0 && accountNumber.length < 10) {
        setVerificationResult({
          status: "IDLE",
          message: "Please enter a complete 10-digit NUBAN account number.",
        });
      }
      return;
    }

    const timer = setTimeout(async () => {
      setResolving(true);
      setVerificationResult({ status: "RESOLVING", message: "Verifying with bank..." });
      try {
        const res = await fetch("/api/bank/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountNumber,
            bankCode,
            userId,
            registeredName,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setAccountName(data.accountName);
          if (data.nameMatches) {
            setVerificationResult({
              status: "MATCH",
              message: `✅ Name Verified: "${data.accountName}" matches your registered profile.`,
              resolvedName: data.accountName,
              matchScore: data.matchScore,
            });
          } else {
            setVerificationResult({
              status: "MISMATCH",
              message: `❌ Name Mismatch: Bank account name "${data.accountName}" does not match registered name "${data.registeredName || registeredName}". Transfers to this account will be rejected.`,
              resolvedName: data.accountName,
              matchScore: data.matchScore,
            });
          }
        } else {
          setVerificationResult({
            status: "ERROR",
            message: data.error || "Could not resolve bank account. Please check account number and bank.",
          });
        }
      } catch (err) {
        setVerificationResult({
          status: "ERROR",
          message: "Network error verifying bank account with NIBSS.",
        });
      } finally {
        setResolving(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [accountNumber, bankCode, userId, registeredName]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaved(false);

    if (!accountNumber || accountNumber.length !== 10) {
      setSaveError("Please enter a valid 10-digit NUBAN account number.");
      setSaving(false);
      return;
    }

    if (verificationResult.status === "MISMATCH") {
      setSaveError(
        `Cannot save bank account: The bank account name (${verificationResult.resolvedName || accountName}) does not match your registered profile (${registeredName}). Payouts can only be made to the registered artisan.`
      );
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/pro/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          bankName,
          bankCode,
          accountNumber,
          accountName,
          radius,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      } else {
        setSaveError(data.error || "Failed to save bank payout settings.");
      }
    } catch (err: any) {
      setSaveError("Network error saving bank payout settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "clamp(1.3rem, 3vw, 1.85rem)",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Account Settings & Bank Payout Details
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 0" }}>
          Configure verified Nigerian bank details for instant wallet payouts and set your dispatch radius.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", maxWidth: 900 }}>
        {/* Left Column: Bank Payout Settings */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "10px", background: "rgba(14,165,233,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8" }}>
              <Building size={20} />
            </div>
            <div>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>
                Bank Payout Details (NUBAN)
              </h3>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                Protected by Paystack & NIBSS Name Verification
              </span>
            </div>
          </div>

          {saved && (
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(16,185,129,0.15)",
                border: "1px solid #10B981",
                color: "#10B981",
                borderRadius: "8px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              <CheckCircle2 size={18} /> Bank payout details verified & saved successfully to database!
            </div>
          )}

          {saveError && (
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(239,68,68,0.15)",
                border: "1px solid #EF4444",
                color: "#FCA5A5",
                borderRadius: "8px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: "13px",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>{saveError}</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Registered Name Reference */}
            <div style={{ background: "#0F172A", padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155" }}>
              <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", display: "block" }}>
                Verified Artisan Profile Name
              </span>
              <strong style={{ fontSize: "14px", color: "#38BDF8", marginTop: 2, display: "block" }}>
                {registeredName || "Loading profile..."}
              </strong>
              <span style={{ fontSize: "11px", color: "#64748B", marginTop: 4, display: "block" }}>
                🔒 Bank account name must match this name to approve transfer payouts.
              </span>
            </div>

            {/* Bank Name Dropdown */}
            <div>
              <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                Select Nigerian Bank
              </label>
              <select
                value={bankCode}
                onChange={handleBankChange}
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 12px",
                  background: "#0F172A",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#F8FAFC",
                  fontSize: "14px",
                  fontWeight: 600,
                  outline: "none",
                }}
              >
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 10-Digit Account Number */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700 }}>
                  10-Digit NUBAN Account Number
                </label>
                {resolving && (
                  <span style={{ fontSize: "11px", color: "#38BDF8", display: "flex", alignItems: "center", gap: 4 }}>
                    <Loader2 size={12} className="animate-spin" /> Resolving...
                  </span>
                )}
              </div>
              <input
                type="text"
                maxLength={10}
                placeholder="e.g. 0123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 12px",
                  background: "#0F172A",
                  border:
                    verificationResult.status === "MATCH"
                      ? "1px solid #10B981"
                      : verificationResult.status === "MISMATCH"
                      ? "1px solid #EF4444"
                      : "1px solid #334155",
                  borderRadius: "8px",
                  color: "#F8FAFC",
                  fontSize: "16px",
                  fontWeight: 700,
                  letterSpacing: 3,
                  outline: "none",
                }}
              />
            </div>

            {/* Bank Account Name Display & Resolution Feedback */}
            <div>
              <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                Resolved Bank Account Name
              </label>
              <input
                type="text"
                placeholder="Account name will resolve automatically..."
                value={accountName}
                readOnly
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 12px",
                  background: "#0F172A",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: accountName ? "#F8FAFC" : "#64748B",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              />
            </div>

            {/* Verification Status Badge */}
            {verificationResult.status !== "IDLE" && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  background:
                    verificationResult.status === "MATCH"
                      ? "rgba(16,185,129,0.12)"
                      : verificationResult.status === "MISMATCH"
                      ? "rgba(239,68,68,0.12)"
                      : "rgba(14,165,233,0.12)",
                  color:
                    verificationResult.status === "MATCH"
                      ? "#10B981"
                      : verificationResult.status === "MISMATCH"
                      ? "#EF4444"
                      : "#38BDF8",
                  border:
                    verificationResult.status === "MATCH"
                      ? "1px solid #10B981"
                      : verificationResult.status === "MISMATCH"
                      ? "1px solid #EF4444"
                      : "1px solid #0EA5E9",
                }}
              >
                {verificationResult.status === "MATCH" && <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
                {verificationResult.status === "MISMATCH" && <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
                {verificationResult.status === "RESOLVING" && <Loader2 size={16} className="animate-spin" style={{ flexShrink: 0, marginTop: 1 }} />}
                <div>{verificationResult.message}</div>
              </div>
            )}

            <button
              className="btn btn-primary btn-md"
              onClick={handleSave}
              disabled={saving || resolving || verificationResult.status === "MISMATCH"}
              style={{
                background: verificationResult.status === "MISMATCH" ? "#475569" : "#0EA5E9",
                cursor: verificationResult.status === "MISMATCH" ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: 700,
                marginTop: "6px",
              }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Saving & Verifying..." : "Save Verified Bank Details ➔"}
            </button>
          </div>
        </div>

        {/* Right Column: Dispatch & Safety Preferences */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Dispatch Radius */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: 36, height: 36, borderRadius: "10px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>
                  Service Dispatch Radius
                </h3>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Maximum distance you are willing to travel for service requests
                </span>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700 }}>
                  Coverage Radius (Kilometers)
                </label>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#10B981" }}>{radius} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                style={{ width: "100%", accentColor: "#10B981" }}
              />
              <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginTop: 6 }}>
                Jobs within {radius}km of your location will be routed to your artisan queue with high priority.
              </span>
            </div>
          </div>

          {/* Safety & Compliance Card */}
          <div className="card" style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "16px", padding: "20px" }}>
            <h4 style={{ margin: "0 0 8px", color: "#38BDF8", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={16} /> Artisan Payout Policy Notice
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8", lineHeight: 1.5 }}>
              To ensure full compliance with Central Bank of Nigeria (CBN) regulations and protect artisan escrow earnings, HandyHub Pro requires that payout accounts match the registered artisan’s verified profile name. Third-party accounts cannot receive automatic payouts.
            </p>
          </div>
        </div>
      </div>
    </ProLayoutShell>
  );
}
