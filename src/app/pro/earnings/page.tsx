"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import {
  Wallet,
  DollarSign,
  Lock,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Inbox,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Loader2,
  Building,
} from "lucide-react";
import { NIGERIAN_BANKS } from "@/lib/banks";
import styles from "../dashboard/dashboard.module.css";

interface WalletTransactionItem {
  id: string;
  reference: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  date: string;
}

export default function ProEarningsPage() {
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [bankName, setBankName] = useState("Access Bank");
  const [bankCode, setBankCode] = useState("044");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [registeredName, setRegisteredName] = useState("");
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvingBank, setResolvingBank] = useState(false);
  const [nameMatchStatus, setNameMatchStatus] = useState<{
    status: "IDLE" | "MATCH" | "MISMATCH" | "ERROR";
    message: string;
  }>({ status: "IDLE", message: "" });

  const [loading, setLoading] = useState(true);
  const [walletStats, setWalletStats] = useState({
    walletBalance: 0,
    pendingEscrow: 0,
    lifetimeEarnings: 0,
    completedJobs: 0,
    transactions: [] as WalletTransactionItem[],
  });

  const fetchRealEarnings = async () => {
    setLoading(true);
    let activeUserId = "";
    let activeEmail = "";

    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro
          ? JSON.parse(storedPro)
          : storedUser
          ? JSON.parse(storedUser)
          : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
        if (parsed?.user?.email || parsed?.email) activeEmail = parsed.user?.email || parsed.email;
        if (parsed?.user?.firstName) {
          const name = `${parsed.user.firstName} ${parsed.user.lastName || ""}`.trim();
          setRegisteredName(name);
        }
      } catch (err) {}
    }

    try {
      // 1. Fetch Earnings Metrics
      const res = await fetch(`/api/pro/dashboard?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok) {
        setWalletStats({
          walletBalance: data.walletBalance || 0,
          pendingEscrow: data.pendingEscrow || 0,
          lifetimeEarnings: data.lifetimeEarnings || (data.walletBalance || 0) + (data.completedJobs * 15000),
          completedJobs: data.completedJobs || 0,
          transactions: data.transactions || [],
        });
      }

      // 2. Fetch Verified Bank Details from Settings
      if (activeUserId) {
        const settingsRes = await fetch(`/api/pro/settings?userId=${activeUserId}`);
        const settingsData = await settingsRes.json();
        if (settingsRes.ok && settingsData.settings) {
          if (settingsData.registeredName) setRegisteredName(settingsData.registeredName);
          if (settingsData.settings.bankName) setBankName(settingsData.settings.bankName);
          if (settingsData.settings.bankCode) setBankCode(settingsData.settings.bankCode);
          if (settingsData.settings.accountNumber) setAccountNumber(settingsData.settings.accountNumber);
          if (settingsData.settings.accountName) {
            setAccountName(settingsData.settings.accountName);
            setNameMatchStatus({
              status: "MATCH",
              message: `Verified: Account belongs to ${settingsData.settings.accountName}`,
            });
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch real earnings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealEarnings();
  }, []);

  // Handle Bank Selection Change in Modal
  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const found = NIGERIAN_BANKS.find((b) => b.code === selectedCode);
    if (found) {
      setBankName(found.name);
      setBankCode(found.code);
    }
  };

  // Live Auto-Resolve Bank Name when 10 digits are in modal
  useEffect(() => {
    if (!accountNumber || accountNumber.length !== 10) {
      return;
    }

    const timer = setTimeout(async () => {
      setResolvingBank(true);
      try {
        let activeUserId = "";
        if (typeof window !== "undefined") {
          try {
            const storedPro = localStorage.getItem("handyhub_pro_session");
            const parsed = storedPro ? JSON.parse(storedPro) : null;
            activeUserId = parsed?.user?.id || parsed?.id || "";
          } catch {}
        }

        const res = await fetch("/api/bank/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountNumber,
            bankCode,
            userId: activeUserId,
            registeredName,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setAccountName(data.accountName);
          if (data.nameMatches) {
            setNameMatchStatus({
              status: "MATCH",
              message: `✅ Verified: Account name "${data.accountName}" matches your registered profile.`,
            });
            setErrorMsg("");
          } else {
            setNameMatchStatus({
              status: "MISMATCH",
              message: `❌ Name Mismatch: "${data.accountName}" does not match profile name "${data.registeredName || registeredName}". Transfers to this account are blocked.`,
            });
          }
        } else {
          setNameMatchStatus({
            status: "ERROR",
            message: data.error || "Could not resolve bank account details.",
          });
        }
      } catch (err) {
        setNameMatchStatus({
          status: "ERROR",
          message: "Network error resolving account details.",
        });
      } finally {
        setResolvingBank(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [accountNumber, bankCode, registeredName]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccess("");

    const withdrawAmt = Number(amountInput);
    if (!withdrawAmt || withdrawAmt <= 0) {
      setErrorMsg("Please enter a valid amount to withdraw.");
      return;
    }
    if (withdrawAmt > walletStats.walletBalance) {
      setErrorMsg(`Insufficient funds. Your available balance is ₦${walletStats.walletBalance.toLocaleString()}.`);
      return;
    }
    if (!accountNumber || accountNumber.length < 10) {
      setErrorMsg("Please enter a valid 10-digit NUBAN account number.");
      return;
    }
    if (nameMatchStatus.status === "MISMATCH") {
      setErrorMsg(
        `Transfer Blocked: Bank account holder name (${accountName}) does not match your registered profile name (${registeredName}). Payouts can only be made to the verified artisan.`
      );
      return;
    }

    let activeUserId = "";
    let activeEmail = "";
    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
        if (parsed?.user?.email || parsed?.email) activeEmail = parsed.user?.email || parsed.email;
      } catch (err) {}
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          email: activeEmail,
          amount: withdrawAmt,
          bankCode,
          bankName,
          accountNumber,
          accountName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message || `Withdrawal of ₦${withdrawAmt.toLocaleString()} submitted successfully!`);
        setTimeout(() => {
          setWithdrawModal(false);
          setSuccess("");
          setAmountInput("");
          fetchRealEarnings();
        }, 2500);
      } else {
        setErrorMsg(data.error || "Failed to process withdrawal request.");
      }
    } catch (err: any) {
      setErrorMsg("Network error submitting withdrawal request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTxBadge = (type: string) => {
    switch (type) {
      case "ESCROW_RELEASE":
        return <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>Escrow Payout</span>;
      case "ESCROW_HOLD":
        return <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>Escrow Secured</span>;
      case "DEBIT":
        return <span className="badge" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>Bank Withdrawal</span>;
      case "REFUND":
        return <span className="badge" style={{ background: "rgba(168,85,247,0.15)", color: "#A855F7" }}>Escrow Refund</span>;
      default:
        return <span className="badge" style={{ background: "rgba(14,165,233,0.15)", color: "#0EA5E9" }}>{type}</span>;
    }
  };

  return (
    <ProLayoutShell>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.85rem)", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
            Artisan Wallet & Escrow Vault
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 0" }}>
            Real-time balance, verified automated payouts, and completed job revenue history.
          </p>
        </div>

        <button
          className="btn btn-primary btn-md"
          onClick={() => setWithdrawModal(true)}
          style={{ background: "#0EA5E9", display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}
        >
          <ArrowUpRight size={18} /> Request Instant Withdrawal
        </button>
      </div>

      {/* Metrics Row */}
      <div className={styles.statsGrid} style={{ marginBottom: "32px" }}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
            <Wallet size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Available Balance</span>
            <strong className={styles.statValue} style={{ color: "#10B981" }}>
              ₦{walletStats.walletBalance.toLocaleString()}
            </strong>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: 4, display: "block" }}>
              Cleared funds ready for bank withdrawal
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
            <Lock size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Escrow Vault (In Progress)</span>
            <strong className={styles.statValue} style={{ color: "#F59E0B" }}>
              ₦{walletStats.pendingEscrow.toLocaleString()}
            </strong>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: 4, display: "block" }}>
              Secured in escrow until customer confirms job
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(14,165,233,0.15)", color: "#0EA5E9" }}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Lifetime Gross Revenue</span>
            <strong className={styles.statValue}>
              ₦{walletStats.lifetimeEarnings.toLocaleString()}
            </strong>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: 4, display: "block" }}>
              Across {walletStats.completedJobs} completed jobs
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="card" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)", borderRadius: "16px", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="h4" style={{ margin: 0, color: "var(--text-primary)" }}>Wallet & Escrow Ledger</h3>
          <button
            onClick={fetchRealEarnings}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {walletStats.transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <Inbox size={36} color="var(--text-tertiary)" style={{ margin: "0 auto 12px" }} />
            <h4 style={{ margin: "0 0 6px", color: "var(--text-primary)" }}>No Transactions Yet</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>
              Completed service jobs and escrow releases will appear here automatically.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-primary)", textAlign: "left", color: "var(--text-tertiary)" }}>
                  <th style={{ padding: "12px 10px" }}>Type</th>
                  <th style={{ padding: "12px 10px" }}>Description</th>
                  <th style={{ padding: "12px 10px" }}>Reference</th>
                  <th style={{ padding: "12px 10px" }}>Date</th>
                  <th style={{ padding: "12px 10px", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {walletStats.transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                    <td style={{ padding: "12px 10px" }}>{getTxBadge(tx.type)}</td>
                    <td style={{ padding: "12px 10px", color: "var(--text-primary)", fontWeight: 600 }}>{tx.description}</td>
                    <td style={{ padding: "12px 10px", color: "var(--text-secondary)", fontFamily: "monospace" }}>{tx.reference}</td>
                    <td style={{ padding: "12px 10px", color: "var(--text-secondary)" }}>{tx.date}</td>
                    <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700, color: tx.type === "DEBIT" ? "#EF4444" : "#10B981" }}>
                      {tx.type === "DEBIT" ? "-" : "+"}₦{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {withdrawModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div className="modal-content" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 16, padding: 24, maxWidth: 480, width: "100%", color: "#F8FAFC" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
                <Wallet size={20} color="#0EA5E9" /> Request Bank Withdrawal
              </h3>
              <button onClick={() => setWithdrawModal(false)} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 20 }}>
                ✕
              </button>
            </div>

            <div style={{ background: "#0F172A", padding: "12px 14px", borderRadius: 8, marginBottom: 16, border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#94A3B8" }}>
                <span>Available Balance:</span>
                <strong style={{ color: "#10B981", fontSize: "14px" }}>₦{walletStats.walletBalance.toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94A3B8", marginTop: 4 }}>
                <span>Artisan Profile Name:</span>
                <strong style={{ color: "#38BDF8" }}>{registeredName || "Verified Artisan"}</strong>
              </div>
            </div>

            {errorMsg && (
              <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.15)", border: "1px solid #EF4444", color: "#FCA5A5", borderRadius: 8, marginBottom: 14, fontSize: 13, display: "flex", alignItems: "flex-start", gap: 6 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>{errorMsg}</div>
              </div>
            )}

            {success && (
              <div style={{ padding: "10px 12px", background: "rgba(16,185,129,0.15)", border: "1px solid #10B981", color: "#10B981", borderRadius: 8, marginBottom: 14, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <form onSubmit={handleWithdraw}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Withdrawal Amount (NGN ₦)
                </label>
                <input
                  type="number"
                  placeholder="Enter amount (min. ₦2,000)"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  required
                  min={2000}
                  max={walletStats.walletBalance}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 12, color: "#0EA5E9", fontSize: 18, fontWeight: "bold" }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Destination Bank
                </label>
                <select
                  value={bankCode}
                  onChange={handleBankChange}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 10, color: "#F8FAFC", fontSize: 14 }}
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>
                    10-Digit NUBAN Account Number
                  </label>
                  {resolvingBank && (
                    <span style={{ fontSize: "11px", color: "#38BDF8", display: "flex", alignItems: "center", gap: 4 }}>
                      <Loader2 size={12} className="animate-spin" /> Verifying...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  required
                  style={{ width: "100%", background: "#0F172A", border: nameMatchStatus.status === "MATCH" ? "1px solid #10B981" : nameMatchStatus.status === "MISMATCH" ? "1px solid #EF4444" : "1px solid #334155", borderRadius: 8, padding: 10, color: "#F8FAFC", fontSize: 14, letterSpacing: 2 }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Resolved Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="Account holder name..."
                  value={accountName}
                  readOnly
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 10, color: accountName ? "#F8FAFC" : "#64748B", fontSize: 14, fontWeight: 600 }}
                />
              </div>

              {/* Status Badge */}
              {nameMatchStatus.status !== "IDLE" && (
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                    background:
                      nameMatchStatus.status === "MATCH"
                        ? "rgba(16,185,129,0.12)"
                        : nameMatchStatus.status === "MISMATCH"
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(14,165,233,0.12)",
                    color:
                      nameMatchStatus.status === "MATCH"
                        ? "#10B981"
                        : nameMatchStatus.status === "MISMATCH"
                        ? "#EF4444"
                        : "#38BDF8",
                    border:
                      nameMatchStatus.status === "MATCH"
                        ? "1px solid #10B981"
                        : nameMatchStatus.status === "MISMATCH"
                        ? "1px solid #EF4444"
                        : "1px solid #0EA5E9",
                  }}
                >
                  {nameMatchStatus.status === "MATCH" && <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
                  {nameMatchStatus.status === "MISMATCH" && <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
                  <div>{nameMatchStatus.message}</div>
                </div>
              )}

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="btn btn-secondary btn-sm"
                  onClick={() => setWithdrawModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || resolvingBank || nameMatchStatus.status === "MISMATCH"}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: nameMatchStatus.status === "MISMATCH" ? "#475569" : "#0EA5E9",
                    cursor: nameMatchStatus.status === "MISMATCH" ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
                  {isSubmitting ? "Processing Transfer..." : "Submit Payout Request ➔"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProLayoutShell>
  );
}
