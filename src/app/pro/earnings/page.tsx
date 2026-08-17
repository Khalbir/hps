"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Wallet, DollarSign, Lock, Clock, ArrowDownLeft, ArrowUpRight, CheckCircle2, RefreshCw, Inbox, ShieldCheck, AlertCircle } from "lucide-react";
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
  const [bankName, setBankName] = useState("Guaranty Trust Bank (GTB)");
  const [bankCode, setBankCode] = useState("058");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
        if (parsed?.user?.email || parsed?.email) activeEmail = parsed.user?.email || parsed.email;
        if (parsed?.user?.firstName) {
          setAccountName(`${parsed.user.firstName} ${parsed.user.lastName || ""}`.trim());
        }
      } catch (err) {}
    }

    try {
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
    } catch (err) {
      console.warn("Failed to fetch real earnings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealEarnings();
  }, []);

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
      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="h2">Earnings & Wallet Payouts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
            Withdraw available earnings to your Nigerian bank account and monitor real-time escrow protection.
          </p>
        </div>
        <button onClick={fetchRealEarnings} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Sync Wallet
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ padding: "var(--space-5)", borderLeft: "4px solid #0EA5E9", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>Available for Withdrawal</span>
              <Wallet size={18} color="#0EA5E9" />
            </div>
            <h2 className="h2" style={{ color: "#0EA5E9", margin: "8px 0 var(--space-4)" }}>₦{walletStats.walletBalance.toLocaleString()}</h2>
          </div>
          <button className="btn btn-primary btn-sm w-full" style={{ background: "#0EA5E9" }} onClick={() => setWithdrawModal(true)}>
            Withdraw Funds to Bank ➔
          </button>
        </div>

        <div className="card" style={{ padding: "var(--space-5)", borderLeft: "4px solid #F59E0B" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "#F59E0B", fontWeight: 600, textTransform: "uppercase" }}>Pending Escrow Vault</span>
            <Lock size={18} color="#F59E0B" />
          </div>
          <h2 className="h2" style={{ color: "#F59E0B", margin: "8px 0 4px" }}>₦{walletStats.pendingEscrow.toLocaleString()}</h2>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
            <ShieldCheck size={12} color="#F59E0B" /> 100% Protected — Disburses automatically on job completion
          </span>
        </div>

        <div className="card" style={{ padding: "var(--space-5)", borderLeft: "4px solid #10B981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "#10B981", fontWeight: 600, textTransform: "uppercase" }}>Lifetime Net Earnings</span>
            <DollarSign size={18} color="#10B981" />
          </div>
          <h2 className="h2" style={{ color: "#10B981", margin: "8px 0 4px" }}>₦{walletStats.lifetimeEarnings.toLocaleString()}</h2>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Completed {walletStats.completedJobs} verified jobs</span>
        </div>
      </div>

      {/* Real-Time Wallet Transaction Ledger */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="h4" style={{ margin: 0 }}>Live Escrow & Payout Ledger</h3>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{walletStats.transactions.length} record(s)</span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>Loading database transactions...</div>
        ) : walletStats.transactions.length === 0 ? (
          <div style={{ padding: "50px 20px", textAlign: "center", color: "var(--text-tertiary)" }}>
            <Inbox size={40} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 8 }} />
            <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "var(--fs-sm)" }}>No Ledger Transactions Recorded Yet</strong>
            <p style={{ fontSize: "var(--fs-xs)", margin: "4px 0 0" }}>Escrow holds from assigned bookings and bank payout withdrawals will log here automatically.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-sm)" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "var(--space-4)" }}>Reference</th>
                  <th style={{ padding: "var(--space-4)" }}>Type</th>
                  <th style={{ padding: "var(--space-4)" }}>Description</th>
                  <th style={{ padding: "var(--space-4)" }}>Amount</th>
                  <th style={{ padding: "var(--space-4)" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {walletStats.transactions.map((tx) => {
                  const isDebit = tx.type === "DEBIT";
                  return (
                    <tr key={tx.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                      <td style={{ padding: "var(--space-4)", fontFamily: "monospace", fontSize: "12px" }}>{tx.reference}</td>
                      <td style={{ padding: "var(--space-4)" }}>{getTxBadge(tx.type)}</td>
                      <td style={{ padding: "var(--space-4)" }}>{tx.description}</td>
                      <td style={{ padding: "var(--space-4)", fontWeight: "bold", color: isDebit ? "#EF4444" : "#10B981" }}>
                        {isDebit ? `-₦${tx.amount.toLocaleString()}` : `+₦${tx.amount.toLocaleString()}`}
                      </td>
                      <td style={{ padding: "var(--space-4)", color: "var(--text-tertiary)", fontSize: "12px" }}>{tx.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bank Withdrawal Request Modal */}
      {withdrawModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(9, 13, 22, 0.92)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => !isSubmitting && setWithdrawModal(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "480px", background: "#1E293B", border: "1px solid #334155", borderRadius: 20, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #334155", paddingBottom: 12 }}>
              <div>
                <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Withdraw Wallet Balance</h3>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>Available: ₦{walletStats.walletBalance.toLocaleString()}</span>
              </div>
              <button
                disabled={isSubmitting}
                onClick={() => setWithdrawModal(false)}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #EF4444", color: "#EF4444", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {success && (
              <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <form onSubmit={handleWithdraw}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
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
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Destination Bank
                </label>
                <select
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    const selected = e.target.selectedOptions[0]?.getAttribute("data-code") || "058";
                    setBankCode(selected);
                  }}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 10, color: "#F8FAFC", fontSize: 14 }}
                >
                  <option value="Guaranty Trust Bank (GTB)" data-code="058">Guaranty Trust Bank (GTB)</option>
                  <option value="Access Bank" data-code="044">Access Bank</option>
                  <option value="Zenith Bank" data-code="057">Zenith Bank</option>
                  <option value="First Bank of Nigeria" data-code="011">First Bank of Nigeria</option>
                  <option value="United Bank for Africa (UBA)" data-code="033">United Bank for Africa (UBA)</option>
                  <option value="Kuda Microfinance Bank" data-code="50211">Kuda Bank</option>
                  <option value="OPay Digital Services" data-code="999992">OPay</option>
                  <option value="PalmPay" data-code="999991">PalmPay</option>
                  <option value="Moniepoint Microfinance Bank" data-code="50515">Moniepoint</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  10-Digit NUBAN Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  required
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 10, color: "#F8FAFC", fontSize: 14, letterSpacing: 2 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="Verified Full Name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 10, color: "#94A3B8", fontSize: 14 }}
                />
              </div>

              <div className="modal-actions">
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
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#0EA5E9", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {isSubmitting ? "Processing..." : "Submit Payout Request ➔"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProLayoutShell>
  );
}
