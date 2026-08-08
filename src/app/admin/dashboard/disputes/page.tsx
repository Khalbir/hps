"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  AlertCircle, CheckCircle2, XCircle, Search, Filter, RefreshCw,
  DollarSign, Image as ImageIcon, MessageSquare, ShieldAlert, ArrowRight, User, Inbox
} from "lucide-react";
import styles from "../../admin.module.css";

export default function DisputesCenterPage() {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState("");

  const fetchDisputes = async () => {
    try {
      const res = await fetch(`/api/admin/disputes?_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.disputes) {
        setDisputes(
          data.disputes.map((d: any) => ({
            id: d.id,
            reference: d.reference,
            bookingRef: d.booking?.reference || "BKG",
            service: d.booking?.service?.name || "Service",
            customer: {
              name: `${d.customer?.firstName || "Customer"} ${d.customer?.lastName || ""}`,
              email: d.customer?.email || "N/A",
              phone: d.customer?.phone || "N/A",
            },
            pro: {
              name: d.professional ? `${d.professional.user?.firstName || ""} ${d.professional.user?.lastName || ""}` : "N/A",
            },
            reason: d.reason,
            description: d.description,
            evidencePhotos: d.evidencePhotos ? JSON.parse(d.evidencePhotos) : [],
            status: d.status,
            estimatedPrice: d.booking?.estimatedPrice || 0,
            refundAmount: d.refundAmount || 0,
            resolutionNotes: d.resolutionNotes || "",
            createdAt: new Date(d.createdAt).toLocaleString(),
          }))
        );
      }
    } catch (err) {
      console.warn("Failed to fetch disputes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
    const interval = setInterval(fetchDisputes, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = disputes.filter((d) => filterStatus === "ALL" || d.status === filterStatus);

  const handleResolveDispute = async (status: string) => {
    if (!selectedDispute) return;

    try {
      await fetch("/api/admin/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESOLVE",
          disputeId: selectedDispute.id,
          resolutionStatus: status,
          refundAmount: refundAmount || selectedDispute.estimatedPrice,
          resolutionNotes: notes || selectedDispute.resolutionNotes,
        }),
      });
    } catch {}

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === selectedDispute.id
          ? { ...d, status, refundAmount: refundAmount || d.estimatedPrice, resolutionNotes: notes }
          : d
      )
    );

    setToast(`Dispute #${selectedDispute.reference} updated to ${status}. Notification dispatched!`);
    setSelectedDispute(null);
    setRefundAmount(0);
    setNotes("");
    setTimeout(() => setToast(""), 4000);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "OPEN": return { bg: "rgba(239,68,68,0.15)", color: "#EF4444" };
      case "UNDER_REVIEW": return { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" };
      case "RESOLVED_REFUNDED": return { bg: "rgba(16,185,129,0.15)", color: "#10B981" };
      case "RESOLVED_PARTIAL_REFUND": return { bg: "rgba(14,165,233,0.15)", color: "#0EA5E9" };
      case "RESOLVED_REJECTED": return { bg: "rgba(100,116,139,0.15)", color: "#64748B" };
      default: return { bg: "rgba(148,163,184,0.15)", color: "#94A3B8" };
    }
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="h3">Complaints & Dispute Center (Production DB Tickets)</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Review real customer complaints, evidence attachments, and execute wallet refunds directly from database records.
          </p>
        </div>
      </header>

      {toast && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          ✅ {toast}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto" }}>
        {["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED_REFUNDED", "RESOLVED_PARTIAL_REFUND", "RESOLVED_REJECTED"].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              background: filterStatus === st ? "#0EA5E9" : "#1E293B",
              color: filterStatus === st ? "#FFFFFF" : "#94A3B8",
              border: "1px solid #334155",
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Table & Drawer Layout */}
      <div className={selectedDispute ? styles.gridMainDrawer : ""} style={{ gap: "20px" }}>
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "50px", textAlign: "center", color: "#94A3B8" }}>
              <Inbox size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
              <h4 className="h4" style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>No Disputes Found</h4>
              <p style={{ margin: 0, fontSize: "13px" }}>Dispute tickets submitted by customers will appear here automatically from the database.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                  <th style={{ padding: "12px 16px" }}>Ticket Ref</th>
                  <th style={{ padding: "12px 16px" }}>Booking</th>
                  <th style={{ padding: "12px 16px" }}>Customer</th>
                  <th style={{ padding: "12px 16px" }}>Reason</th>
                  <th style={{ padding: "12px 16px" }}>Booking Value</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const sb = getStatusBadge(d.status);
                  return (
                    <tr
                      key={d.id}
                      style={{
                        borderBottom: "1px solid #334155",
                        background: selectedDispute?.id === d.id ? "rgba(14,165,233,0.08)" : "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => { setSelectedDispute(d); setRefundAmount(d.estimatedPrice); }}
                    >
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#EF4444", fontWeight: 700 }}>{d.reference}</td>
                      <td style={{ padding: "12px 16px", color: "#0EA5E9", fontWeight: 600 }}>#{d.bookingRef}</td>
                      <td style={{ padding: "12px 16px", color: "#F8FAFC" }}>{d.customer.name}</td>
                      <td style={{ padding: "12px 16px", color: "#F59E0B", fontWeight: 600 }}>{d.reason}</td>
                      <td style={{ padding: "12px 16px", color: "#10B981", fontWeight: 700 }}>₦{d.estimatedPrice.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="badge" style={{ background: sb.bg, color: sb.color, fontSize: "11px", fontWeight: 700 }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button className="btn btn-secondary btn-xs" onClick={(e) => { e.stopPropagation(); setSelectedDispute(d); setRefundAmount(d.estimatedPrice); }}>
                          Review Ticket
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Dispute Resolution Drawer */}
        {selectedDispute && (
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #334155", paddingBottom: "12px" }}>
              <div>
                <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Ticket: {selectedDispute.reference}</h3>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>Booking #{selectedDispute.bookingRef}</span>
              </div>
              <button onClick={() => setSelectedDispute(null)} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ background: "#0F172A", padding: "12px", borderRadius: "8px", border: "1px solid #334155", marginBottom: "16px" }}>
              <strong style={{ fontSize: "12px", color: "#EF4444", textTransform: "uppercase", display: "block" }}>Complaint Description</strong>
              <p style={{ fontSize: "13px", color: "#E2E8F0", margin: "6px 0 10px 0" }}>{selectedDispute.description}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Refund Amount (NGN ₦)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  style={{
                    width: "100%",
                    background: "#0F172A",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "10px",
                    color: "#10B981",
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Resolution Audit Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter resolution reasoning..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#0F172A",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "10px",
                    color: "#F8FAFC",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                <button
                  onClick={() => handleResolveDispute("RESOLVED_REFUNDED")}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#10B981", width: "100%" }}
                >
                  <DollarSign size={16} /> Execute Full Refund & Deposit to Customer Wallet
                </button>

                <button
                  onClick={() => handleResolveDispute("RESOLVED_PARTIAL_REFUND")}
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: "#0EA5E9", color: "#0EA5E9", width: "100%" }}
                >
                  Execute Partial Refund (₦{refundAmount.toLocaleString()})
                </button>

                <button
                  onClick={() => handleResolveDispute("RESOLVED_REJECTED")}
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: "#64748B", color: "#94A3B8", width: "100%" }}
                >
                  Reject Dispute & Release Escrow to Artisan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutShell>
  );
}
