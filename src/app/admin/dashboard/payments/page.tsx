"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  CreditCard, DollarSign, Lock, ArrowUpRight, ArrowDownLeft, CheckCircle2,
  Clock, Search, Filter, FileSpreadsheet, RefreshCw, AlertCircle, Inbox
} from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSuccessNgn: 0, platformFeeNgn: 0, failedCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState("");

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/admin/payments?_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.payments) {
        setPayments(
          data.payments.map((p: any) => ({
            id: p.id,
            reference: p.reference,
            bookingRef: p.booking?.reference || "BKG",
            amount: p.amount,
            provider: p.provider,
            customer: p.user ? `${p.user.firstName} ${p.user.lastName}` : "Customer",
            email: p.user?.email || "N/A",
            status: p.status,
            date: new Date(p.createdAt).toLocaleString(),
          }))
        );
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.warn("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchProvider = providerFilter === "ALL" || p.provider === providerFilter;
    const matchSearch =
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      p.bookingRef.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchProvider && matchSearch;
  });

  const handleExportCSV = () => {
    const headers = ["Transaction ID,Reference,Booking Ref,Payer Name,Email,Amount (NGN),Provider,Status,Date\n"];
    const rows = filteredPayments.map(
      (p) => `"${p.id}","${p.reference}","${p.bookingRef}","${p.customer}","${p.email}",${p.amount},"${p.provider}","${p.status}","${p.date}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `handyhub_payments_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice("Payments ledger exported to Excel (CSV) successfully!");
    setTimeout(() => setExportNotice(""), 4000);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "SUCCESS": return { bg: "rgba(16,185,129,0.15)", color: "#10B981" };
      case "PENDING": return { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" };
      case "FAILED": return { bg: "rgba(239,68,68,0.15)", color: "#EF4444" };
      case "REFUNDED": return { bg: "rgba(139,92,246,0.15)", color: "#8B5CF6" };
      default: return { bg: "rgba(100,116,139,0.15)", color: "#64748B" };
    }
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="h3">Paystack & Escrow Financial Command Center</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Real production Paystack NGN transactions and escrow balances from database records.
          </p>
        </div>

        <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <FileSpreadsheet size={16} color="#10B981" /> Export Ledger (.csv)
        </button>
      </header>

      {exportNotice && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          ✅ {exportNotice}
        </div>
      )}

      <div className={styles.adminContent}>
        {/* Financial Summary KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "var(--space-5)" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "#94A3B8" }}>Total Verified Volume</span>
            <h2 className="h2" style={{ color: "#10B981", margin: "4px 0 0" }}>₦{stats.totalSuccessNgn.toLocaleString()}</h2>
          </div>

          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "var(--space-5)", borderLeft: "4px solid #F59E0B" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "#F59E0B" }}>Total Transactions</span>
            <h2 className="h2" style={{ color: "#F59E0B", margin: "4px 0 0" }}>{stats.totalCount}</h2>
          </div>

          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "var(--space-5)", borderLeft: "4px solid #0EA5E9" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "#0EA5E9" }}>Platform Net Fee (15%)</span>
            <h2 className="h2" style={{ color: "#0EA5E9", margin: "4px 0 0" }}>₦{stats.platformFeeNgn.toLocaleString()}</h2>
          </div>

          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "var(--space-5)", borderLeft: "4px solid #EF4444" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "#EF4444" }}>Failed Transactions</span>
            <h2 className="h2" style={{ color: "#EF4444", margin: "4px 0 0" }}>{stats.failedCount}</h2>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search reference, booking ref, or payer email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "10px 12px 10px 38px",
                color: "#F8FAFC",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Status Filter Badges */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["ALL", "SUCCESS", "PENDING", "FAILED", "REFUNDED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? "#0EA5E9" : "#1E293B",
                  color: statusFilter === st ? "#FFFFFF" : "#94A3B8",
                  border: "1px solid #334155",
                  borderRadius: "20px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#F8FAFC",
              fontSize: "13px",
            }}
          >
            <option value="ALL">All Gateways</option>
            <option value="PAYSTACK">Paystack</option>
            <option value="MONNIFY">Monnify</option>
            <option value="FLUTTERWAVE">Flutterwave</option>
            <option value="WALLET">Wallet</option>
          </select>
        </div>

        {/* Payments Ledger Table */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden" }}>
          {filteredPayments.length === 0 ? (
            <div style={{ padding: "50px", textAlign: "center", color: "#94A3B8" }}>
              <Inbox size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
              <h4 className="h4" style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>No Transactions in Database</h4>
              <p style={{ margin: 0, fontSize: "13px" }}>Real Paystack payments made by customers will stream here live.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-sm)" }}>
              <thead>
                <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                  <th style={{ padding: "12px 16px" }}>Reference</th>
                  <th style={{ padding: "12px 16px" }}>Booking Ref</th>
                  <th style={{ padding: "12px 16px" }}>Payer Customer</th>
                  <th style={{ padding: "12px 16px" }}>Provider</th>
                  <th style={{ padding: "12px 16px" }}>Amount (NGN)</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((tx) => {
                  const sb = getStatusBadge(tx.status);
                  return (
                    <tr key={tx.id} style={{ borderBottom: "1px solid #334155" }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#0EA5E9", fontWeight: 700 }}>{tx.reference}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#F8FAFC" }}>#{tx.bookingRef}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <strong style={{ display: "block", color: "#F8FAFC" }}>{tx.customer}</strong>
                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>{tx.email}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: tx.provider === "PAYSTACK" ? "#0EA5E9" : "#F59E0B" }}>{tx.provider}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#10B981" }}>₦{tx.amount.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="badge" style={{ background: sb.bg, color: sb.color, fontSize: "11px", fontWeight: 700 }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#94A3B8" }}>{tx.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayoutShell>
  );
}
