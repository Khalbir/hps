"use client";

import { useState } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { CreditCard, DollarSign, Lock, ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock } from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminPaymentsPage() {
  const transactions = [
    { id: "tx_901", bookingId: "HHP-M1K9X", type: "PAYMENT_IN", amount: "₦25,000", gateway: "Paystack", customer: "Amina I.", pro: "Blessing O.", status: "ESCROW_HELD", date: "Today, 2:05 PM" },
    { id: "tx_902", bookingId: "HHP-P4N2A", type: "DISBURSEMENT", amount: "₦16,650", gateway: "HandyHub Wallet", customer: "Usman D.", pro: "Yusuf A.", status: "RELEASED", date: "Aug 2, 2026" },
    { id: "tx_903", bookingId: "HHP-Q5O3B", type: "REFUND", amount: "₦45,000", gateway: "Paystack Refund", customer: "Fatima B.", pro: "N/A", status: "REFUNDED", date: "Jul 29, 2026" },
  ];

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Payments & Escrow Management</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Monitor Paystack transactions, 24-hour escrow holding balances, and artisan disbursements.
          </p>
        </div>
      </header>

      <div className={styles.adminContent}>
        {/* Financial Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>Total Gross Platform Volume</span>
            <h2 className="h2" style={{ color: "var(--color-primary-400)", margin: "4px 0 0" }}>₦2,450,000</h2>
          </div>
          <div className="card" style={{ padding: "var(--space-5)", borderLeft: "4px solid #F59E0B" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "#F59E0B" }}>Held in Escrow (24h Window)</span>
            <h2 className="h2" style={{ color: "#F59E0B", margin: "4px 0 0" }}>₦185,000</h2>
          </div>
          <div className="card" style={{ padding: "var(--space-5)", borderLeft: "4px solid #10B981" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "#10B981" }}>Platform Revenue (15% Fee)</span>
            <h2 className="h2" style={{ color: "#10B981", margin: "4px 0 0" }}>₦367,500</h2>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-sm)" }}>
            <thead>
              <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "var(--space-4)" }}>Transaction ID</th>
                <th style={{ padding: "var(--space-4)" }}>Booking Ref</th>
                <th style={{ padding: "var(--space-4)" }}>Type</th>
                <th style={{ padding: "var(--space-4)" }}>Amount</th>
                <th style={{ padding: "var(--space-4)" }}>Gateway / Method</th>
                <th style={{ padding: "var(--space-4)" }}>Escrow Status</th>
                <th style={{ padding: "var(--space-4)" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <td style={{ padding: "var(--space-4)", fontFamily: "monospace" }}>{tx.id}</td>
                  <td style={{ padding: "var(--space-4)", fontWeight: "bold" }}>{tx.bookingId}</td>
                  <td style={{ padding: "var(--space-4)" }}>{tx.type}</td>
                  <td style={{ padding: "var(--space-4)", fontWeight: "bold", color: "var(--color-primary-400)" }}>{tx.amount}</td>
                  <td style={{ padding: "var(--space-4)" }}>{tx.gateway}</td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <span className="badge" style={{ background: tx.status === "ESCROW_HELD" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)", color: tx.status === "ESCROW_HELD" ? "#F59E0B" : "#10B981" }}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-4)" }}>{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
