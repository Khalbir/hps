"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  CreditCard, DollarSign, Lock, ArrowUpRight, ArrowDownLeft, CheckCircle2,
  Clock, Search, Filter, FileSpreadsheet, RefreshCw, AlertCircle, Inbox,
  ShieldCheck, Zap, TrendingUp, Layers, AlertTriangle, Eye, ExternalLink, X
} from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<"PAYMENTS" | "WITHDRAWALS">("PAYMENTS");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [verifyingRef, setVerifyingRef] = useState<string | null>(null);
  const [withdrawalActionLoading, setWithdrawalActionLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSuccessNgn: 0,
    paystackVolumeNgn: 0,
    platformFeeNgn: 0,
    escrowHeldNgn: 0,
    totalWithdrawnNgn: 0,
    pendingWithdrawalNgn: 0,
    pendingWithdrawalsCount: 0,
    failedCount: 0,
    totalCount: 0,
    livePaystackCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/admin/payments?_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.payments) {
        setPayments(
          data.payments.map((p: any) => {
            let meta: any = {};
            try {
              meta = typeof p.metadata === "string" ? JSON.parse(p.metadata || "{}") : p.metadata || {};
            } catch {}

            return {
              id: p.id,
              reference: p.reference,
              bookingId: p.bookingId || p.booking?.id,
              bookingRef: p.booking?.reference || "N/A",
              serviceName: p.booking?.service?.name || "Verified Property Service",
              amount: p.amount,
              provider: p.provider || "PAYSTACK",
              customer: p.user ? `${p.user.firstName} ${p.user.lastName}` : "Customer Client",
              email: p.user?.email || "N/A",
              phone: p.user?.phone || "N/A",
              status: p.status,
              channel: meta.channel || "card",
              cardType: meta.cardType || "N/A",
              last4: meta.last4 || "••••",
              bank: meta.bank || "N/A",
              authorizationCode: meta.authorizationCode || null,
              date: new Date(p.createdAt).toLocaleString(),
              rawDate: p.createdAt,
              isLivePaystack: Boolean(p.isLivePaystack || meta.isLivePaystackApi),
            };
          })
        );
        if (data.withdrawals) setWithdrawals(data.withdrawals);
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

  const handleSyncPaystackLive = async () => {
    setNotice("⚡ Connecting to Live Paystack REST API and syncing transactions...");
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_LIVE_PAYSTACK" }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice("✅ Live Paystack transactions successfully fetched and reconciled!");
        fetchPayments();
      } else {
        setNotice(`⚠️ Paystack sync: ${data.error || "Failed"}`);
      }
    } catch {
      setNotice("❌ Network error during Paystack sync.");
    } finally {
      setTimeout(() => setNotice(""), 5000);
    }
  };

  const handleManualVerify = async (ref: string) => {
    setVerifyingRef(ref);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref, provider: "PAYSTACK" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice(`✅ Payment ${ref} verified live: ${data.verification.status}`);
        fetchPayments();
      } else {
        setNotice(`⚠️ Verification error: ${data.error || "Failed"}`);
      }
    } catch {
      setNotice("❌ Network error during manual verification.");
    } finally {
      setVerifyingRef(null);
      setTimeout(() => setNotice(""), 5000);
    }
  };

  const [escrowActionLoading, setEscrowActionLoading] = useState(false);

  const handleReleaseEscrow = async (bookingRef: string) => {
    if (!bookingRef || bookingRef === "N/A") {
      setNotice("⚠️ No valid booking reference attached to this payment.");
      return;
    }
    if (!confirm(`Are you sure you want to release Escrow payout for booking #${bookingRef} to the assigned artisan's available wallet balance?`)) return;

    setEscrowActionLoading(true);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release_escrow", bookingReference: bookingRef }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice(`✅ ${data.message || "Escrow payout disbursed successfully!"}`);
        fetchPayments();
      } else {
        setNotice(`⚠️ ${data.error || "Failed to release escrow."}`);
      }
    } catch {
      setNotice("❌ Network error releasing escrow.");
    } finally {
      setEscrowActionLoading(false);
      setTimeout(() => setNotice(""), 5000);
    }
  };

  const handleRefundEscrow = async (bookingRef: string, amount: number) => {
    if (!bookingRef || bookingRef === "N/A") {
      setNotice("⚠️ No valid booking reference attached to this payment.");
      return;
    }
    const reason = prompt(`Enter reason for refunding ₦${amount.toLocaleString()} for Booking #${bookingRef}:`, "Service cancellation / dissatisfaction");
    if (!reason) return;

    setEscrowActionLoading(true);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refund_escrow", bookingReference: bookingRef, refundAmount: amount, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice(`✅ ${data.message || "Escrow refund credited to customer wallet successfully!"}`);
        fetchPayments();
      } else {
        setNotice(`⚠️ ${data.error || "Failed to refund escrow."}`);
      }
    } catch {
      setNotice("❌ Network error refunding escrow.");
    } finally {
      setEscrowActionLoading(false);
      setTimeout(() => setNotice(""), 5000);
    }
  };

  const handleSettleWithdrawal = async (ref: string) => {
    if (!confirm(`Confirm that payout for withdrawal ref #${ref} has been transferred and mark as COMPLETED?`)) return;
    setWithdrawalActionLoading(true);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SETTLE_WITHDRAWAL", reference: ref }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice(`✅ ${data.message || "Withdrawal marked as SETTLED / PAID!"}`);
        fetchPayments();
      } else {
        setNotice(`⚠️ ${data.error || "Failed to settle withdrawal"}`);
      }
    } catch {
      setNotice("❌ Network error settling withdrawal.");
    } finally {
      setWithdrawalActionLoading(false);
      setTimeout(() => setNotice(""), 5000);
    }
  };

  const handleRejectWithdrawal = async (ref: string) => {
    const reason = prompt("Enter rejection reason (funds will be refunded to artisan's wallet balance):", "Bank account name mismatch");
    if (!reason) return;
    setWithdrawalActionLoading(true);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT_WITHDRAWAL", reference: ref, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice(`✅ ${data.message || "Withdrawal rejected and funds refunded to artisan wallet!"}`);
        fetchPayments();
      } else {
        setNotice(`⚠️ ${data.error || "Failed to reject withdrawal"}`);
      }
    } catch {
      setNotice("❌ Network error rejecting withdrawal.");
    } finally {
      setWithdrawalActionLoading(false);
      setTimeout(() => setNotice(""), 5000);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchStatus = statusFilter === "ALL" || w.status === statusFilter;
    const matchSearch =
      w.reference.toLowerCase().includes(search.toLowerCase()) ||
      w.artisanName.toLowerCase().includes(search.toLowerCase()) ||
      w.accountNumber.includes(search) ||
      w.bankName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

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

    setNotice("Paystack financial ledger exported to Excel (.CSV) successfully!");
    setTimeout(() => setNotice(""), 4000);
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
      <div className={styles.adminContent}>
        {/* Page Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "32px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#F8FAFC", margin: 0, letterSpacing: "-0.02em" }}>
                Paystack Payments & Escrow Ledger
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
                <Zap size={13} fill="#10B981" /> LIVE PAYSTACK API CONNECTED
              </span>
            </div>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
              Live payment verification, Paystack REST API ingestion, automated escrow holding, and artisan payout disbursement.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleSyncPaystackLive}
              className="btn btn-secondary btn-sm"
              style={{
                background: "#0F172A",
                border: "1px solid #0EA5E9",
                color: "#38BDF8",
                padding: "9px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Zap size={14} color="#38BDF8" /> Sync Paystack Live
            </button>
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

        {notice && (
          <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981", color: "#10B981", padding: "14px 20px", borderRadius: "12px", marginBottom: "28px", fontSize: "14px", fontWeight: 700 }}>
            {notice}
          </div>
        )}

        {/* Financial Summary KPI Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {/* Card 1: Paystack Volume */}
          <div
            style={{
              background: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "20px 22px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Client Payments
              </span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10B981", margin: "6px 0 0", letterSpacing: "-0.02em" }}>
                ₦{stats.paystackVolumeNgn.toLocaleString()}
              </h2>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(16, 185, 129, 0.12)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Card 2: Escrow Held (80%) */}
          <div
            style={{
              background: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "20px 22px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Escrow Vault
              </span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F59E0B", margin: "6px 0 0", letterSpacing: "-0.02em" }}>
                ₦{(stats.escrowHeldNgn || Math.round(stats.totalSuccessNgn * 0.8)).toLocaleString()}
              </h2>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(245, 158, 11, 0.12)", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={20} />
            </div>
          </div>

          {/* Card 3: Platform Commission (20%) */}
          <div
            style={{
              background: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "20px 22px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Platform Fee (20%)
              </span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0EA5E9", margin: "6px 0 0", letterSpacing: "-0.02em" }}>
                ₦{stats.platformFeeNgn.toLocaleString()}
              </h2>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(14, 165, 233, 0.12)", color: "#0EA5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={20} />
            </div>
          </div>

          {/* Card 4: Artisan Withdrawals Settled */}
          <div
            style={{
              background: "#1E293B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "20px 22px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Settled Payouts
              </span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#A855F7", margin: "6px 0 0", letterSpacing: "-0.02em" }}>
                ₦{stats.totalWithdrawnNgn.toLocaleString()}
              </h2>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(168, 85, 247, 0.12)", color: "#A855F7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowUpRight size={20} />
            </div>
          </div>

          {/* Card 5: Pending Payout Requests */}
          <div
            style={{
              background: "#1E293B",
              border: stats.pendingWithdrawalsCount > 0 ? "1px solid #F59E0B" : "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "20px 22px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Pending Payouts ({stats.pendingWithdrawalsCount})
              </span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F59E0B", margin: "6px 0 0", letterSpacing: "-0.02em" }}>
                ₦{stats.pendingWithdrawalNgn.toLocaleString()}
              </h2>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(245, 158, 11, 0.12)", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={20} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs: Incoming Client Escrow vs Artisan Bank Withdrawals */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => { setActiveTab("PAYMENTS"); setStatusFilter("ALL"); }}
            style={{
              background: activeTab === "PAYMENTS" ? "rgba(14, 165, 233, 0.15)" : "transparent",
              color: activeTab === "PAYMENTS" ? "#38BDF8" : "#94A3B8",
              border: activeTab === "PAYMENTS" ? "1px solid #0EA5E9" : "1px solid transparent",
              padding: "10px 20px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s ease",
            }}
          >
            <CreditCard size={16} /> Incoming Client Escrow ({payments.length})
          </button>
          <button
            onClick={() => { setActiveTab("WITHDRAWALS"); setStatusFilter("ALL"); }}
            style={{
              background: activeTab === "WITHDRAWALS" ? "rgba(245, 158, 11, 0.15)" : "transparent",
              color: activeTab === "WITHDRAWALS" ? "#F59E0B" : "#94A3B8",
              border: activeTab === "WITHDRAWALS" ? "1px solid #F59E0B" : "1px solid transparent",
              padding: "10px 20px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s ease",
            }}
          >
            <ArrowUpRight size={16} /> Artisan Bank Withdrawals ({withdrawals.length})
            {stats.pendingWithdrawalsCount > 0 && (
              <span style={{ background: "#EF4444", color: "#FFFFFF", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 800 }}>
                {stats.pendingWithdrawalsCount} PENDING
              </span>
            )}
          </button>
        </div>

        {/* Search & Filter Controls Bar */}
        <div style={{ background: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "18px 24px", marginBottom: "28px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
            <Search size={18} color="#94A3B8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder={activeTab === "PAYMENTS" ? "Search payment reference, booking ref, or payer email..." : "Search withdrawal ref, artisan name, bank, or NUBAN..."}
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
            {(activeTab === "PAYMENTS" ? ["ALL", "SUCCESS", "PENDING", "FAILED", "REFUNDED"] : ["ALL", "PROCESSING", "COMPLETED", "REJECTED"]).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? (activeTab === "PAYMENTS" ? "#0EA5E9" : "#F59E0B") : "#0F172A",
                  color: statusFilter === st ? "#FFFFFF" : "#94A3B8",
                  border: statusFilter === st ? (activeTab === "PAYMENTS" ? "1px solid #0EA5E9" : "1px solid #F59E0B") : "1px solid #334155",
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

          {activeTab === "PAYMENTS" && (
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
          )}
        </div>

        {/* Dynamic Ledger Table Card */}
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
          {activeTab === "PAYMENTS" ? (
            filteredPayments.length === 0 ? (
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
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Gateway</th>
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount (NGN)</th>
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date & Time</th>
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((tx) => {
                      const sb = getStatusBadge(tx.status);
                      return (
                        <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)", transition: "background 0.15s ease" }}>
                          <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "#38BDF8", fontWeight: 700 }}>
                            <button
                              onClick={() => setSelectedTx(tx)}
                              style={{ background: "none", border: "none", color: "#38BDF8", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, padding: 0, textDecoration: "underline" }}
                            >
                              {tx.reference}
                            </button>
                          </td>
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
                          <td style={{ padding: "16px 20px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                              <Link
                                href={`/receipt/${encodeURIComponent(tx.reference)}`}
                                target="_blank"
                                style={{
                                  background: "rgba(14, 165, 233, 0.15)",
                                  border: "1px solid rgba(14, 165, 233, 0.4)",
                                  color: "#38BDF8",
                                  padding: "5px 10px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                                title="View Digital Receipt"
                              >
                                <span>🧾</span> Receipt
                              </Link>

                              <button
                                onClick={() => setSelectedTx(tx)}
                                style={{
                                  background: "#1E293B",
                                  border: "1px solid #475569",
                                  color: "#F8FAFC",
                                  padding: "6px 10px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                }}
                                title="Inspect Details"
                              >
                                <Eye size={14} color="#F8FAFC" />
                              </button>

                              {tx.status === "PENDING" && (
                                <button
                                  onClick={() => handleManualVerify(tx.reference)}
                                  disabled={verifyingRef === tx.reference}
                                  style={{
                                    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                                    border: "none",
                                    color: "#FFFFFF",
                                    fontWeight: 700,
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                  title="Re-Verify with Paystack Live"
                                >
                                  {verifyingRef === tx.reference ? "..." : "Verify 🔄"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Artisan Bank Withdrawals Table */
            filteredWithdrawals.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "#94A3B8" }}>
                <ArrowUpRight size={48} color="#F59E0B" style={{ marginBottom: "16px", opacity: 0.6 }} />
                <h4 style={{ color: "#F8FAFC", margin: "0 0 8px 0", fontSize: "1.1rem" }}>No Withdrawal Requests Found</h4>
                <p style={{ margin: 0, fontSize: "14px", color: "#94A3B8" }}>
                  Artisan wallet payout and bank transfer requests appear here for disbursement & settlement.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto", width: "100%" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#0F172A", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94A3B8" }}>
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Withdrawal Ref</th>
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Artisan Partner</th>
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Bank & NUBAN Account</th>
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Payout Amount</th>
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Request Date</th>
                      <th style={{ padding: "16px 20px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Settlement Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWithdrawals.map((w) => {
                      const isProcessing = w.status === "PROCESSING" || w.status === "PENDING";
                      const isCompleted = w.status === "COMPLETED" || w.status === "APPROVED";
                      return (
                        <tr key={w.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)", transition: "background 0.15s ease" }}>
                          <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "#F59E0B", fontWeight: 700 }}>
                            <button
                              onClick={() => setSelectedWithdrawal(w)}
                              style={{ background: "none", border: "none", color: "#F59E0B", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, padding: 0, textDecoration: "underline" }}
                            >
                              {w.reference}
                            </button>
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            <strong style={{ display: "block", color: "#F8FAFC" }}>{w.artisanName}</strong>
                            <span style={{ fontSize: "12px", color: "#38BDF8" }}>{w.artisanPhone} • {w.digitalId}</span>
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            <strong style={{ display: "block", color: "#F8FAFC" }}>{w.bankName}</strong>
                            <span style={{ fontSize: "13px", color: "#CBD5E1", fontFamily: "monospace", letterSpacing: "1px" }}>
                              {w.accountNumber} ({w.accountName})
                            </span>
                          </td>
                          <td style={{ padding: "16px 20px", fontWeight: 800, color: "#EF4444", fontSize: "15px" }}>
                            -₦{w.amount.toLocaleString()}
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            <span
                              style={{
                                background: isCompleted ? "rgba(16, 185, 129, 0.12)" : isProcessing ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                color: isCompleted ? "#10B981" : isProcessing ? "#F59E0B" : "#EF4444",
                                border: `1px solid ${isCompleted ? "rgba(16, 185, 129, 0.3)" : isProcessing ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                                padding: "4px 12px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 800,
                                display: "inline-block",
                              }}
                            >
                              {w.status}
                            </span>
                          </td>
                          <td style={{ padding: "16px 20px", color: "#94A3B8", fontSize: "13px" }}>{w.date}</td>
                          <td style={{ padding: "16px 20px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                              <button
                                onClick={() => setSelectedWithdrawal(w)}
                                style={{
                                  background: "#1E293B",
                                  border: "1px solid #475569",
                                  color: "#F8FAFC",
                                  padding: "6px 10px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                }}
                                title="Inspect Withdrawal"
                              >
                                <Eye size={14} color="#F8FAFC" />
                              </button>

                              {isProcessing && (
                                <>
                                  <button
                                    onClick={() => handleSettleWithdrawal(w.reference)}
                                    disabled={withdrawalActionLoading}
                                    style={{
                                      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                      border: "none",
                                      color: "#FFFFFF",
                                      fontWeight: 700,
                                      padding: "6px 12px",
                                      borderRadius: 6,
                                      fontSize: 11,
                                      cursor: "pointer",
                                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                    title="Confirm Bank Transfer & Mark Settled"
                                  >
                                    Mark Settled ✅
                                  </button>
                                  <button
                                    onClick={() => handleRejectWithdrawal(w.reference)}
                                    disabled={withdrawalActionLoading}
                                    style={{
                                      background: "rgba(239, 68, 68, 0.15)",
                                      border: "1px solid #EF4444",
                                      color: "#EF4444",
                                      fontWeight: 700,
                                      padding: "6px 10px",
                                      borderRadius: 6,
                                      fontSize: 11,
                                      cursor: "pointer",
                                    }}
                                    title="Reject and Refund to Artisan Wallet"
                                  >
                                    Reject ❌
                                  </button>
                                </>
                              )}

                              {isCompleted && (
                                <span style={{ color: "#10B981", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <CheckCircle2 size={14} /> Settled
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Transaction Detail Inspection Modal */}
        {selectedTx && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 16,
            }}
            onClick={() => setSelectedTx(null)}
          >
            <div
              style={{
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: 16,
                padding: 28,
                maxWidth: 600,
                width: "100%",
                color: "#F8FAFC",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#F8FAFC" }}>
                    Transaction Audit Inspector
                  </h3>
                  <span style={{ fontSize: 12, color: "#38BDF8", fontFamily: "monospace" }}>
                    {selectedTx.reference}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, fontSize: 13 }}>
                <div>
                  <span style={{ color: "#94A3B8", display: "block", fontSize: 11, textTransform: "uppercase" }}>Amount Paid</span>
                  <strong style={{ fontSize: 20, color: "#10B981" }}>₦{selectedTx.amount.toLocaleString()}</strong>
                </div>

                <div>
                  <span style={{ color: "#94A3B8", display: "block", fontSize: 11, textTransform: "uppercase" }}>Status</span>
                  <strong style={{ color: selectedTx.status === "SUCCESS" ? "#10B981" : "#F59E0B" }}>{selectedTx.status}</strong>
                </div>

                <div>
                  <span style={{ color: "#94A3B8", display: "block", fontSize: 11, textTransform: "uppercase" }}>Customer</span>
                  <div>{selectedTx.customer}</div>
                  <div style={{ color: "#94A3B8", fontSize: 12 }}>{selectedTx.email}</div>
                </div>

                <div>
                  <span style={{ color: "#94A3B8", display: "block", fontSize: 11, textTransform: "uppercase" }}>Booking Reference</span>
                  <div style={{ color: "#38BDF8", fontWeight: 700 }}>#{selectedTx.bookingRef}</div>
                  <div style={{ color: "#94A3B8", fontSize: 12 }}>{selectedTx.serviceName}</div>
                </div>

                <div>
                  <span style={{ color: "#94A3B8", display: "block", fontSize: 11, textTransform: "uppercase" }}>Payment Gateway & Channel</span>
                  <div>{selectedTx.provider} ({selectedTx.channel})</div>
                  <div style={{ color: "#94A3B8", fontSize: 12 }}>{selectedTx.cardType} • {selectedTx.last4}</div>
                </div>

                <div>
                  <span style={{ color: "#94A3B8", display: "block", fontSize: 11, textTransform: "uppercase" }}>Issuing Bank</span>
                  <div>{selectedTx.bank}</div>
                </div>
              </div>

              {/* Escrow & Commission Breakdown Box */}
              <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={16} /> Escrow Vault & Platform Commission Breakdown
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
                  <div>
                    <span style={{ color: "#94A3B8" }}>HandyHub Platform Fee (20%):</span>
                    <strong style={{ display: "block", color: "#38BDF8", fontSize: 14 }}>₦{Math.round(selectedTx.amount * 0.20).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#94A3B8" }}>Artisan Net Earnings (80%):</span>
                    <strong style={{ display: "block", color: "#10B981", fontSize: 14 }}>₦{Math.round(selectedTx.amount * 0.80).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderTop: "1px solid #334155", paddingTop: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {selectedTx.status === "SUCCESS" && (
                    <>
                      <button
                        onClick={() => handleReleaseEscrow(selectedTx.bookingRef || selectedTx.bookingId)}
                        disabled={escrowActionLoading}
                        className="btn btn-primary btn-xs"
                        style={{ background: "#10B981", color: "#FFFFFF", fontWeight: 700, padding: "6px 12px", borderRadius: 6, fontSize: 12 }}
                      >
                        Release Escrow Payout 💸
                      </button>
                      <button
                        onClick={() => handleRefundEscrow(selectedTx.bookingRef || selectedTx.bookingId, selectedTx.amount)}
                        disabled={escrowActionLoading}
                        className="btn btn-secondary btn-xs"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid #EF4444", padding: "6px 12px", borderRadius: 6, fontSize: 12 }}
                      >
                        Refund Customer ↩️
                      </button>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <Link
                    href={`/receipt/${encodeURIComponent(selectedTx.reference)}`}
                    target="_blank"
                    className="btn btn-primary btn-sm"
                    style={{ background: "#0EA5E9", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                  >
                    <ExternalLink size={14} /> Open Digital Receipt
                  </Link>
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Artisan Bank Withdrawal Detail Inspection Modal */}
        {selectedWithdrawal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 16,
            }}
            onClick={() => setSelectedWithdrawal(null)}
          >
            <div
              style={{
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: 16,
                padding: 28,
                maxWidth: 600,
                width: "100%",
                color: "#F8FAFC",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#F8FAFC" }}>
                    Artisan Bank Withdrawal Inspector
                  </h3>
                  <span style={{ fontSize: 12, color: "#F59E0B", fontFamily: "monospace" }}>
                    {selectedWithdrawal.reference}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedWithdrawal(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, fontSize: 13 }}>
                <div>
                  <span style={{ color: "#94A3B8", display: "block", fontSize: 11, textTransform: "uppercase" }}>Withdrawal Amount</span>
                  <strong style={{ fontSize: 22, color: "#EF4444" }}>₦{selectedWithdrawal.amount.toLocaleString()}</strong>
                </div>

                <div>
                  <span style={{ color: "#94A3B8", display: "block", fontSize: 11, textTransform: "uppercase" }}>Status</span>
                  <strong style={{ color: selectedWithdrawal.status === "COMPLETED" ? "#10B981" : selectedWithdrawal.status === "PROCESSING" ? "#F59E0B" : "#EF4444" }}>
                    {selectedWithdrawal.status}
                  </strong>
                </div>

                <div>
                  <span style={{ color: "#94A3B8", display: "block", fontSize: 11, textTransform: "uppercase" }}>Artisan Partner</span>
                  <div style={{ fontWeight: 700 }}>{selectedWithdrawal.artisanName}</div>
                  <div style={{ color: "#94A3B8", fontSize: 12 }}>{selectedWithdrawal.artisanEmail}</div>
                  <div style={{ color: "#38BDF8", fontSize: 12 }}>{selectedWithdrawal.artisanPhone}</div>
                </div>

                <div>
                  <span style={{ color: "#94A3B8", display: "block", fontSize: 11, textTransform: "uppercase" }}>Destination Bank</span>
                  <div style={{ fontWeight: 700, color: "#F8FAFC" }}>{selectedWithdrawal.bankName}</div>
                  <div style={{ color: "#CBD5E1", fontSize: 13, fontFamily: "monospace" }}>
                    NUBAN: {selectedWithdrawal.accountNumber}
                  </div>
                  <div style={{ color: "#94A3B8", fontSize: 12 }}>Account Name: {selectedWithdrawal.accountName}</div>
                </div>
              </div>

              {/* Settlement Instructions Box */}
              <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#38BDF8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={16} /> Paystack NUBAN Transfer Settlement
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                  This artisan payout is queued for bank settlement. Confirm transfer via corporate banking or Paystack Transfer API, then click <strong>Mark Settled</strong> to finalize the transaction record.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderTop: "1px solid #334155", paddingTop: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {(selectedWithdrawal.status === "PROCESSING" || selectedWithdrawal.status === "PENDING") && (
                    <>
                      <button
                        onClick={() => {
                          const ref = selectedWithdrawal.reference;
                          setSelectedWithdrawal(null);
                          handleSettleWithdrawal(ref);
                        }}
                        disabled={withdrawalActionLoading}
                        className="btn btn-primary btn-sm"
                        style={{ background: "#10B981", color: "#FFFFFF", fontWeight: 700, padding: "8px 16px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <CheckCircle2 size={16} /> Mark Settled & Paid ✅
                      </button>
                      <button
                        onClick={() => {
                          const ref = selectedWithdrawal.reference;
                          setSelectedWithdrawal(null);
                          handleRejectWithdrawal(ref);
                        }}
                        disabled={withdrawalActionLoading}
                        className="btn btn-secondary btn-sm"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid #EF4444", padding: "8px 16px", borderRadius: 8, fontSize: 13 }}
                      >
                        Reject & Refund ❌
                      </button>
                    </>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => setSelectedWithdrawal(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutShell>
  );
}
