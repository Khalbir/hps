"use client";

import { useState } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Wallet, DollarSign, Lock, Clock, ArrowDownLeft, CheckCircle2 } from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProEarningsPage() {
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [success, setSuccess] = useState("");

  const handleWithdraw = () => {
    if (!amountInput) return;
    setSuccess(`Withdrawal request for ₦${Number(amountInput).toLocaleString()} submitted to bank account!`);
    setTimeout(() => {
      setWithdrawModal(false);
      setSuccess("");
      setAmountInput("");
    }, 2000);
  };

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 className="h2">Earnings & Wallet Payouts</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
          Withdraw your available wallet balance to your Nigerian bank account and track escrow holds.
        </p>
      </div>

      {/* Financial Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ padding: "var(--space-5)" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>Available Wallet Balance</span>
          <h2 className="h2" style={{ color: "var(--color-primary-400)", margin: "4px 0 var(--space-4)" }}>₦142,500</h2>
          <button className="btn btn-primary btn-sm w-full" onClick={() => setWithdrawModal(true)}>
            Withdraw Funds to Bank
          </button>
        </div>

        <div className="card" style={{ padding: "var(--space-5)", borderLeft: "4px solid #F59E0B" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#F59E0B" }}>Pending Escrow Release (24h Hold)</span>
          <h2 className="h2" style={{ color: "#F59E0B", margin: "4px 0 0" }}>₦25,000</h2>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Disburses automatically after 24h</span>
        </div>

        <div className="card" style={{ padding: "var(--space-5)", borderLeft: "4px solid #10B981" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#10B981" }}>Total Lifetime Earnings</span>
          <h2 className="h2" style={{ color: "#10B981", margin: "4px 0 0" }}>₦1,240,000</h2>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Completed 48 jobs</span>
        </div>
      </div>

      {/* Recent Payout History */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border-primary)" }}>
          <h3 className="h4">Transaction History</h3>
        </div>
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
            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
              <td style={{ padding: "var(--space-4)", fontFamily: "monospace" }}>HHP-M1K9X</td>
              <td style={{ padding: "var(--space-4)" }}>Deep Cleaning — Amina I.</td>
              <td style={{ padding: "var(--space-4)", fontWeight: "bold", color: "#F59E0B" }}>+₦21,250 (Net)</td>
              <td style={{ padding: "var(--space-4)" }}>
                <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>Escrow Hold (24h)</span>
              </td>
              <td style={{ padding: "var(--space-4)" }}>Today</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
              <td style={{ padding: "var(--space-4)", fontFamily: "monospace" }}>WTH-89012</td>
              <td style={{ padding: "var(--space-4)" }}>Bank Withdrawal (GTBank)</td>
              <td style={{ padding: "var(--space-4)", fontWeight: "bold", color: "#EF4444" }}>-₦50,000</td>
              <td style={{ padding: "var(--space-4)" }}>
                <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>Processed</span>
              </td>
              <td style={{ padding: "var(--space-4)" }}>Jul 28, 2026</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Withdrawal Modal */}
      {withdrawModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "var(--space-4)" }}>
          <div className="card" style={{ width: "100%", maxWidth: 450 }}>
            <h3 className="h4" style={{ marginBottom: "var(--space-2)" }}>Withdraw to Bank Account</h3>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              Bank Account: GTBank — 0123456789 (Blessing Okon)
            </p>

            {success ? (
              <div style={{ padding: "var(--space-4)", background: "rgba(16,185,129,0.1)", color: "#10B981", borderRadius: 8, fontSize: "14px", fontWeight: "bold", textAlign: "center" }}>
                <CheckCircle2 size={32} style={{ margin: "0 auto 8px" }} />
                {success}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount e.g. 50000"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    style={{ width: "100%", height: 48, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)", fontSize: "var(--fs-base)" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                  <button className="btn btn-secondary btn-md" onClick={() => setWithdrawModal(false)}>Cancel</button>
                  <button className="btn btn-primary btn-md" onClick={handleWithdraw} disabled={!amountInput}>
                    Confirm Withdrawal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ProLayoutShell>
  );
}
