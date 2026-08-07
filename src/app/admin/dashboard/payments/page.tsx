"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  CreditCard, DollarSign, Lock, ArrowUpRight, ArrowDownLeft, CheckCircle2,
  Clock, Search, Filter, FileSpreadsheet, RefreshCw, AlertCircle, Inbox, ShieldCheck, Zap, TrendingUp, Layers, AlertTriangle
} from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSuccessNgn: 0,
    paystackVolumeNgn: 0,
    platformFeeNgn: 0,
    failedCount: 0,
    totalCount: 0,
  });
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
            provider: p.provider || "PAYSTACK",
            customer: p.user ? `${p.user.firstName} ${p.user.lastName}` : "Customer Client",
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
    const interval = setInterval(fetchPayments, 4000);
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
    link.setAttribute("download", `handyhub_paystack_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice("Paystack financial ledger exported to Excel (.CSV) successfully!");
    setTimeout(() => setExportNotice(""), 4000);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "SUCCESS": return { bg: "rgba(16,185,129,0.12)", color: "#10B981", border: "rgba(16,185,129,0.3)" };
      case "PENDING": return { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "rgba(245,158,11,0.3)" };
      case "FAILED": return { bg: "rgba(239,68,68,0.12)", color: "#EF4444", border: "rgba(239,68,68,0.3)" };
      case "REFUNDED": return { bg: "rgba(139,92,246,0.12)", color: "#8B5CF6", border: "rgba(139,92,246,0.3)" };
      default: return { bg: "rgba(100,116,139,0.12)", color: "#64748B", border: "rgba(100,116,139,0.3)" };
    }
  };

  return (
    <AdminLayoutShell>
      <div style={{ padding: "32px" }}>
        {/* Page Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "32px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#F8FAFC", margin: 0, letterSpacing: "-0.02em" }}>
                Paystack Live Transaction & Escrow Command
              </h1>
              <span
                style={{
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10B981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Zap size={13} fill="#10B981" /> PAYSTACK LIVE GATEWAY ACTIVE
              </span>
            </div>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
              Real production Paystack NGN transactions, automatic webhooks, and 15% platform escrow tracking.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={fetchPayments}
              className="btn btn-secondary btn-sm"
              style={{
                background: "#1E293B",
                border: "1px solid #334155",
                color: "#CBD5E1",
                padding: "9px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} color="#38BDF8" /> Refresh
            </button>
            <button
              onClick={handleExportCSV}
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                border: "none",
                color: "#FFFFFF",
                padding: "9px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
              }}
            >
              <FileSpreadsheet size={16} /> Export Ledger (.csv)
            </button>
          </div>
        </div>

        {exportNotice && (
          <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981", color: "#10B981", padding: "14px 20px", borderRadius: "12px", marginBottom: "28px", fontSize: "14px", fontWeight: 700 }}>
            ✅ {exportNotice}
          </div>
        )}

        {/* Financial Summary KPI Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          {/* Card 1: Paystack Volume */}
          <div
            style={{
              background: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "22px 24px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Paystack Verified Volume
              </span>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#10B981", margin: "6px 0 0", letterSpacing: "-0.02em" }}>
                ₦{stats.paystackVolumeNgn.toLocaleString()}
              </h2>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(16, 185, 129, 0.12)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={22} />
            </div>
          </div>

          {/* Card 2: Total Transactions */}
          <div
            style={{
              background: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "22px 24px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Transactions
              </span>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#F59E0B", margin: "6px 0 0", letterSpacing: "-0.02em" }}>
                {stats.totalCount}
              </h2>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(245, 158, 11, 0.12)", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={22} />
            </div>
          </div>

          {/* Card 3: Platform Net Fee */}
          <div
            style={{
              background: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "22px 24px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Platform Net Fee (15%)
              </span>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0EA5E9", margin: "6px 0 0", letterSpacing: "-0.02em" }}>
                ₦{stats.platformFeeNgn.toLocaleString()}
              </h2>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(14, 165, 233, 0.12)", color: "#0EA5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={22} />
            </div>
          </div>

          {/* Card 4: Failed Transactions */}
          <div
            style={{
              background: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "22px 24px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Failed Transactions
              </span>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#EF4444", margin: "6px 0 0", letterSpacing: "-0.02em" }}>
                {stats.failedCount}
              </h2>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(239, 68, 68, 0.12)", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        <div style={{ background: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "18px 24px", marginBottom: "28px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
            <Search size={18} color="#94A3B8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search payment reference, booking ref, or payer email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: "44px",
                background: "#0F172A",
                border: "1px solid #334155",
                borderRadius: "10px",
                paddingLeft: "42px",
                paddingRight: "16px",
                color: "#F8FAFC",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Status Filter Badges */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["ALL", "SUCCESS", "PENDING", "FAILED", "REFUNDED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? "#0EA5E9" : "#0F172A",
                  color: statusFilter === st ? "#FFFFFF" : "#94A3B8",
                  border: statusFilter === st ? "1px solid #0EA5E9" : "1px solid #334155",
                  borderRadius: "24px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Provider Select Dropdown */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            style={{
              height: "44px",
              background: "#0F172A",
              border: "1px solid #334155",
              borderRadius: "10px",
              padding: "0 16px",
              color: "#F8FAFC",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Gateways</option>
            <option value="PAYSTACK">Paystack</option>
            <option value="MONNIFY">Monnify</option>
            <option value="FLUTTERWAVE">Flutterwave</option>
            <option value="WALLET">Wallet</option>
          </select>
        </div>

        {/* Payments Ledger Table Card */}
        <div
          style={{
            background: "#1E293B",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
            overflow: "hidden",
            width: "100%",
          }}
        >
          {filteredPayments.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#94A3B8" }}>
              <Inbox size={48} color="#0EA5E9" style={{ marginBottom: "16px", opacity: 0.6 }} />
              <h4 style={{ color: "#F8FAFC", margin: "0 0 8px 0", fontSize: "1.1rem" }}>No Transactions Found</h4>
              <p style={{ margin: 0, fontSize: "14px", color: "#94A3B8" }}>
                Real production Paystack payments created by clients stream live to this ledger.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto", width: "100%" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#0F172A", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94A3B8" }}>
                    <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Transaction Ref</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Booking Ref</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Payer Customer</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Gateway Provider</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount (NGN)</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                    <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((tx) => {
                    const sb = getStatusBadge(tx.status);
                    return (
                      <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)", transition: "background 0.15s ease" }}>
                        <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "#38BDF8", fontWeight: 700 }}>{tx.reference}</td>
                        <td style={{ padding: "16px 20px", fontWeight: 700, color: "#F8FAFC" }}>#{tx.bookingRef}</td>
                        <td style={{ padding: "16px 20px" }}>
                          <strong style={{ display: "block", color: "#F8FAFC" }}>{tx.customer}</strong>
                          <span style={{ fontSize: "12px", color: "#94A3B8" }}>{tx.email}</span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              background: tx.provider === "PAYSTACK" ? "rgba(14, 165, 233, 0.12)" : "rgba(245, 158, 11, 0.12)",
                              color: tx.provider === "PAYSTACK" ? "#0EA5E9" : "#F59E0B",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            {tx.provider}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", fontWeight: 800, color: "#10B981", fontSize: "15px" }}>
                          ₦{tx.amount.toLocaleString()}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span
                            style={{
                              background: sb.bg,
                              color: sb.color,
                              border: `1px solid ${sb.border}`,
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: 800,
                              display: "inline-block",
                            }}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", color: "#94A3B8", fontSize: "13px" }}>{tx.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayoutShell>
  );
}
