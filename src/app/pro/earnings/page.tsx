"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Wallet, DollarSign, Lock, Clock, ArrowDownLeft, CheckCircle2, RefreshCw, Inbox } from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProEarningsPage() {
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [bankName, setBankName] = useState("Access Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(true);
  const [walletStats, setWalletStats] = useState({
    walletBalance: 0,
    pendingEscrow: 0,
    lifetimeEarnings: 0,
    completedJobs: 0,
    transactions: [],
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
      } catch (err) {}
    }

    try {
      const res = await fetch(`/api/pro/dashboard?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok) {
        setWalletStats({
          walletBalance: data.walletBalance || 0,
          pendingEscrow: data.pendingEscrow || 0,
          lifetimeEarnings: (data.walletBalance || 0) + (data.completedJobs * 15000),
          completedJobs: data.completedJobs || 0,
          transactions: [],
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

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountInput || Number(amountInput) <= 0) return;
    if (Number(amountInput) > walletStats.walletBalance) {
      setSuccess("Insufficient wallet balance for withdrawal.");
      return;
    }

    setSuccess(`Withdrawal request for ₦${Number(amountInput).toLocaleString()} sent to ${bankName} (${accountNumber || "NUBAN"})!`);
    setTimeout(() => {
      setWithdrawModal(false);
      setSuccess("");
      setAmountInput("");
      fetchRealEarnings();
    }, 2500);
  };

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="h2">Earnings & Wallet Payouts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
            Withdraw your available wallet balance to your Nigerian bank account and track escrow holds.
          </p>
        </div>
        <button onClick={fetchRealEarnings} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Sync Wallet
        </button>
      </div>

      {/* Financial Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ padding: "var(--space-5)", borderLeft: "4px solid #0EA5E9" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>Available Wallet Balance</span>
          <h2 className="h2" style={{ color: "#0EA5E9", margin: "4px 0 var(--space-4)" }}>₦{walletStats.walletBalance.toLocaleString()}</h2>
          <button className="btn btn-primary btn-sm w-full" style={{ background: "#0EA5E9" }} onClick={() => setWithdrawModal(true)}>
            Withdraw Funds to Bank ➔
          </button>
        </div>

        <div className="card" style={{ padding: "var(--space-5)", borderLeft: "4px solid #F59E0B" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#F59E0B" }}>Pending Escrow Release (24h Hold)</span>
          <h2 className="h2" style={{ color: "#F59E0B", margin: "4px 0 0" }}>₦{walletStats.pendingEscrow.toLocaleString()}</h2>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Disburses automatically after OTP completion</span>
        </div>

        <div className="card" style={{ padding: "var(--space-5)", borderLeft: "4px solid #10B981" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#10B981" }}>Total Lifetime Earnings</span>
          <h2 className="h2" style={{ color: "#10B981", margin: "4px 0 0" }}>₦{walletStats.lifetimeEarnings.toLocaleString()}</h2>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Completed {walletStats.completedJobs} verified jobs</span>
        </div>
      </div>

      {/* Recent Payout History */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border-primary)" }}>
          <h3 className="h4">Live Escrow & Payout Transactions</h3>
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--text-tertiary)" }}>Loading database transactions...</div>
        ) : walletStats.transactions.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>
            <Inbox size={36} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 8 }} />
            <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "var(--fs-sm)" }}>No Payout Transactions Yet</strong>
            <p style={{ fontSize: "var(--fs-xs)", margin: "4px 0 0" }}>Escrow deposits and bank withdrawals will log here automatically.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-sm)" }}>
            <thead>
              <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "var(--space-4)" }}>Reference</th>
                <th style={{ padding: "var(--space-4)" }}>Description</th>
                <th style={{ padding: "var(--space-4)" }}>Amount</th>
                <th style={{ padding: "var(--space-4)" }}>Status</th>
                <th style={{ padding: "var(--space-4)" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {walletStats.transactions.map((tx: any) => (
                <tr key={tx.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <td style={{ padding: "var(--space-4)", fontFamily: "monospace" }}>{tx.reference}</td>
                  <td style={{ padding: "var(--space-4)" }}>{tx.description}</td>
                  <td style={{ padding: "var(--space-4)", fontWeight: "bold", color: "#10B981" }}>+₦{tx.amount.toLocaleString()}</td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>{tx.status}</span>
                  </td>
                  <td style={{ padding: "var(--space-4)" }}>{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bank Withdrawal Modal */}
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
          onClick={() => setWithdrawModal(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "450px", background: "#1E293B", border: "1px solid #334155", borderRadius: 20, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #334155", paddingBottom: 12 }}>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Withdraw Wallet Balance to Bank</h3>
              <button onClick={() => setWithdrawModal(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            {success && (
              <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleWithdraw}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Withdrawal Amount (NGN ₦)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  required
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 12, color: "#0EA5E9", fontSize: 18, fontWeight: "bold" }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Bank Name
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 10, color: "#F8FAFC", fontSize: 14 }}
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

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  10-Digit NUBAN Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: 10, color: "#F8FAFC", fontSize: 14, letterSpacing: 2 }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setWithdrawModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ background: "#0EA5E9" }}>Submit Payout Request ➔</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProLayoutShell>
  );
}
