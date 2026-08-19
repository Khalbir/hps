"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Wrench, Shield, AlertTriangle, CheckCircle2, Clock, Search, Filter,
  RefreshCw, DollarSign, Store, Ticket, FileText, Eye, ChevronRight,
  Plus, X, AlertCircle, Check, MapPin, Phone, Building2, Lock
} from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminPartsPage() {
  const [loading, setLoading] = useState(true);
  const [parts, setParts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalCount: 0,
    fraudCount: 0,
    totalEscrowAmount: 0,
    pendingApprovalCount: 0,
    activeVouchersCount: 0,
  });

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Drawers
  const [selectedPartForAudit, setSelectedPartForAudit] = useState<any>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    category: "GENERAL",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "Abuja",
    state: "FCT",
    bankName: "",
    bankAccount: "",
    accountName: "",
  });

  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  const fetchPartsData = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/parts?status=${activeTab}&search=${encodeURIComponent(searchQuery)}&_t=${Date.now()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setParts(data.parts || []);
        setSuppliers(data.suppliers || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error("Failed to fetch admin parts data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartsData();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPartsData();
  };

  const handleRedeemVoucher = async (partId: string) => {
    if (!confirm("Confirm voucher redemption by authorized merchant partner?")) return;
    setProcessingAction(true);
    try {
      const res = await fetch("/api/admin/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REDEEM_VOUCHER", partId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({ type: "success", msg: "Voucher marked as redeemed by merchant." });
        fetchPartsData();
      } else {
        setActionFeedback({ type: "error", msg: data.error || "Failed to redeem voucher." });
      }
    } catch {
      setActionFeedback({ type: "error", msg: "Network error executing action." });
    } finally {
      setProcessingAction(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleResolveFraud = async (partId: string) => {
    const reason = prompt("Enter audit verification notes to clear fraud flag:");
    if (!reason) return;

    setProcessingAction(true);
    try {
      const res = await fetch("/api/admin/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESOLVE_FRAUD", partId, adminNotes: reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({ type: "success", msg: "Fraud flag cleared upon administrative verification." });
        fetchPartsData();
      } else {
        setActionFeedback({ type: "error", msg: data.error || "Failed to resolve fraud flag." });
      }
    } catch {
      setActionFeedback({ type: "error", msg: "Network error executing action." });
    } finally {
      setProcessingAction(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingAction(true);
    try {
      const res = await fetch("/api/admin/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SAVE_SUPPLIER",
          supplierData: editingSupplier ? { ...supplierForm, id: editingSupplier.id } : supplierForm,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupplierModalOpen(false);
        setActionFeedback({ type: "success", msg: editingSupplier ? "Supplier updated!" : "New verified supplier added!" });
        fetchPartsData();
      } else {
        setActionFeedback({ type: "error", msg: data.error || "Failed to save supplier." });
      }
    } catch {
      setActionFeedback({ type: "error", msg: "Network error saving supplier." });
    } finally {
      setProcessingAction(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  return (
    <AdminLayoutShell>
      <div className={styles.adminHeader}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 className={styles.adminTitle}>Replacement Parts & Procurement Oversight</h1>
            <span style={{ fontSize: "11px", color: "#38BDF8", background: "rgba(14,165,233,0.15)", padding: "3px 10px", borderRadius: 99, fontWeight: 700, border: "1px solid rgba(14,165,233,0.3)" }}>
              🛡️ Zero-Cash Escrow
            </span>
          </div>
          <p className={styles.adminSubtitle}>
            Audit artisan parts diagnosis, track Paystack escrow procurement, verify single-use supplier vouchers, and monitor duplicate receipt fraud safeguards.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setEditingSupplier(null);
              setSupplierForm({
                name: "",
                category: "GENERAL",
                contactPerson: "",
                phone: "",
                email: "",
                address: "",
                city: "Abuja",
                state: "FCT",
                bankName: "",
                bankAccount: "",
                accountName: "",
              });
              setSupplierModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
            style={{ background: "#8B5CF6", borderColor: "#8B5CF6", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={16} /> Add Verified Supplier
          </button>
          <button onClick={fetchPartsData} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {actionFeedback && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 20,
            fontSize: "13px",
            fontWeight: 600,
            background: actionFeedback.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
            color: actionFeedback.type === "success" ? "#10B981" : "#EF4444",
            border: `1px solid ${actionFeedback.type === "success" ? "#10B981" : "#EF4444"}`,
          }}
        >
          {actionFeedback.msg}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ background: "#0F172A", border: "1px solid #1E293B", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Total Requests</span>
            <Wrench size={18} color="#8B5CF6" />
          </div>
          <strong style={{ fontSize: "24px", color: "#F8FAFC" }}>{stats.totalCount || 0}</strong>
          <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginTop: 4 }}>All-time diagnosed parts</span>
        </div>

        <div className="card" style={{ background: "#0F172A", border: "1px solid #1E293B", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Escrow Procurement</span>
            <DollarSign size={18} color="#10B981" />
          </div>
          <strong style={{ fontSize: "24px", color: "#10B981" }}>₦{Number(stats.totalEscrowAmount || 0).toLocaleString()}</strong>
          <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginTop: 4 }}>Funded into HandyHub Escrow</span>
        </div>

        <div className="card" style={{ background: "#0F172A", border: "1px solid #1E293B", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Active Vouchers</span>
            <Ticket size={18} color="#0EA5E9" />
          </div>
          <strong style={{ fontSize: "24px", color: "#38BDF8" }}>{stats.activeVouchersCount || 0}</strong>
          <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginTop: 4 }}>Issued to verified merchants</span>
        </div>

        <div className="card" style={{ background: "#0F172A", border: "1px solid #1E293B", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Pending Client Auth</span>
            <Clock size={18} color="#F59E0B" />
          </div>
          <strong style={{ fontSize: "24px", color: "#F59E0B" }}>{stats.pendingApprovalCount || 0}</strong>
          <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginTop: 4 }}>Awaiting customer approval</span>
        </div>

        <div className="card" style={{ background: stats.fraudCount > 0 ? "rgba(239, 68, 68, 0.15)" : "#0F172A", border: stats.fraudCount > 0 ? "1.5px solid #EF4444" : "1px solid #1E293B", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "11px", color: stats.fraudCount > 0 ? "#FCA5A5" : "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Fraud Flags (SHA-256)</span>
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <strong style={{ fontSize: "24px", color: "#EF4444" }}>{stats.fraudCount || 0}</strong>
          <span style={{ fontSize: "11px", color: stats.fraudCount > 0 ? "#F87171" : "#64748B", display: "block", marginTop: 4 }}>Duplicate receipt alerts</span>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: "All Requests" },
            { id: "REQUESTED", label: "Pending Client" },
            { id: "VOUCHER_ISSUED", label: "Vouchers Active" },
            { id: "INSTALLED_VERIFIED", label: "Installed & Verified" },
            { id: "FLAGGED_FRAUD", label: "🚨 Fraud Flags" },
            { id: "SUPPLIERS", label: "🏬 Supplier Network" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: "12px",
                fontWeight: 700,
                border: activeTab === tab.id ? "1.5px solid #8B5CF6" : "1px solid #334155",
                background: activeTab === tab.id ? "rgba(139,92,246,0.2)" : "#1E293B",
                color: activeTab === tab.id ? "#C084FC" : "#94A3B8",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== "SUPPLIERS" && (
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Search reference, part, customer, voucher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "#0F172A",
                border: "1px solid #334155",
                borderRadius: 8,
                color: "#F8FAFC",
                fontSize: "13px",
                minWidth: 260,
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ background: "#8B5CF6", borderColor: "#8B5CF6" }}>
              <Search size={14} />
            </button>
          </form>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === "SUPPLIERS" ? (
        /* Verified Suppliers Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {suppliers.map((s) => (
            <div key={s.id} className="card" style={{ background: "#0F172A", border: "1px solid #1E293B", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>{s.name}</h3>
                  <span style={{ fontSize: "11px", color: "#A855F7", background: "rgba(168,85,247,0.15)", padding: "2px 8px", borderRadius: 6, fontWeight: 700, display: "inline-block", marginTop: 4 }}>
                    {s.category}
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#10B981", background: "rgba(16,185,129,0.15)", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>
                  ⭐ {s.rating} Verified
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "12px", color: "#94A3B8", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={14} color="#0EA5E9" /> {s.address}, {s.city} ({s.state})
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Phone size={14} color="#10B981" /> {s.phone} • {s.contactPerson || "Manager"}
                </div>
                {s.bankAccount && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Building2 size={14} color="#F59E0B" /> {s.bankName}: {s.bankAccount} ({s.accountName})
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1E293B", paddingTop: 12 }}>
                <span style={{ fontSize: "11px", color: "#64748B" }}>
                  Procurement Partner
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSupplier(s);
                    setSupplierForm({
                      name: s.name,
                      category: s.category,
                      contactPerson: s.contactPerson || "",
                      phone: s.phone,
                      email: s.email || "",
                      address: s.address,
                      city: s.city,
                      state: s.state,
                      bankName: s.bankName || "",
                      bankAccount: s.bankAccount || "",
                      accountName: s.accountName || "",
                    });
                    setSupplierModalOpen(true);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                >
                  Edit Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Replacement Parts Table */
        <div className="card" style={{ background: "#0F172A", border: "1px solid #1E293B", padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading replacement parts ledger...</div>
          ) : parts.length === 0 ? (
            <div style={{ padding: 50, textAlign: "center", color: "#64748B" }}>
              <Wrench size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <p>No replacement parts found matching current filters.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ background: "#1E293B", color: "#94A3B8", textAlign: "left", borderBottom: "1px solid #334155" }}>
                    <th style={{ padding: "12px 16px" }}>Part Ref & Item</th>
                    <th style={{ padding: "12px 16px" }}>Booking / Customer</th>
                    <th style={{ padding: "12px 16px" }}>Assigned Artisan</th>
                    <th style={{ padding: "12px 16px" }}>Amount & Escrow</th>
                    <th style={{ padding: "12px 16px" }}>Voucher & Supplier</th>
                    <th style={{ padding: "12px 16px" }}>Evidence & Receipts</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p) => {
                    let evidence: string[] = [];
                    let receipts: string[] = [];
                    let installed: string[] = [];
                    try { evidence = JSON.parse(p.evidencePhotos || "[]"); } catch {}
                    try { receipts = JSON.parse(p.receiptPhotos || "[]"); } catch {}
                    try { installed = JSON.parse(p.installedPhotos || "[]"); } catch {}

                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid #1E293B" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <strong style={{ color: "#F8FAFC", display: "block" }}>{p.partName}</strong>
                          <span style={{ fontSize: "11px", color: "#38BDF8", fontFamily: "monospace" }}>#{p.reference}</span>
                          <span style={{ fontSize: "10.5px", color: "#94A3B8", display: "block" }}>Qty: {p.quantity} • {p.category}</span>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ color: "#F8FAFC", display: "block", fontWeight: 600 }}>
                            {p.customer?.firstName} {p.customer?.lastName}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748B" }}>Booking: #{p.booking?.reference}</span>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ color: "#F8FAFC", display: "block", fontWeight: 600 }}>
                            {p.professional?.user?.firstName} {p.professional?.user?.lastName}
                          </span>
                          <span style={{ fontSize: "11px", color: "#10B981" }}>Pro ID: {p.professional?.digitalId || "VERIFIED"}</span>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <strong style={{ color: "#10B981", fontSize: "13.5px", display: "block" }}>
                            ₦{Number(p.approvedCost || p.estimatedCost).toLocaleString()}
                          </strong>
                          <span style={{ fontSize: "10.5px", color: p.paymentStatus === "PAID_ESCROW" ? "#38BDF8" : "#F59E0B" }}>
                            {p.paymentStatus === "PAID_ESCROW" ? "🛡️ Held in Escrow" : "⏳ Unfunded"}
                          </span>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          {p.voucherCode ? (
                            <div>
                              <strong style={{ fontFamily: "monospace", color: "#F8FAFC", background: "rgba(14,165,233,0.15)", padding: "2px 6px", borderRadius: 4, fontSize: "11.5px" }}>
                                {p.voucherCode}
                              </strong>
                              <span style={{ fontSize: "10.5px", color: "#94A3B8", display: "block", marginTop: 2 }}>
                                {p.supplier?.name || "Verified Hub"}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "#64748B", fontSize: "11px" }}>None</span>
                          )}
                        </td>

                        {/* Photos (Damaged, Receipt, Installed) */}
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {evidence[0] && (
                              <div
                                onClick={() => setPreviewPhotoUrl(evidence[0])}
                                title="Damaged Component Evidence"
                                style={{ width: 34, height: 34, borderRadius: 6, overflow: "hidden", border: "1.5px solid #8B5CF6", cursor: "pointer", background: "#000" }}
                              >
                                <img src={evidence[0]} alt="Damaged Part" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                            {receipts[0] && (
                              <div
                                onClick={() => setPreviewPhotoUrl(receipts[0])}
                                title="Merchant Receipt"
                                style={{ width: 34, height: 34, borderRadius: 6, overflow: "hidden", border: "1.5px solid #0EA5E9", cursor: "pointer", background: "#000" }}
                              >
                                <img src={receipts[0]} alt="Merchant Receipt" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                            {installed[0] && (
                              <div
                                onClick={() => setPreviewPhotoUrl(installed[0])}
                                title="Installed Part"
                                style={{ width: 34, height: 34, borderRadius: 6, overflow: "hidden", border: "1.5px solid #10B981", cursor: "pointer", background: "#000" }}
                              >
                                <img src={installed[0]} alt="Installed Part" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: "10.5px",
                              fontWeight: 700,
                              background:
                                p.status === "FLAGGED_FRAUD"
                                  ? "rgba(239,68,68,0.25)"
                                  : p.status === "INSTALLED_VERIFIED"
                                  ? "rgba(16,185,129,0.2)"
                                  : p.status === "VOUCHER_ISSUED"
                                  ? "rgba(14,165,233,0.2)"
                                  : "rgba(245,158,11,0.2)",
                              color:
                                p.status === "FLAGGED_FRAUD"
                                  ? "#EF4444"
                                  : p.status === "INSTALLED_VERIFIED"
                                  ? "#10B981"
                                  : p.status === "VOUCHER_ISSUED"
                                  ? "#38BDF8"
                                  : "#F59E0B",
                              border: p.status === "FLAGGED_FRAUD" ? "1px solid #EF4444" : "none",
                            }}
                          >
                            {p.status === "FLAGGED_FRAUD" && "🚨 FRAUD ALERT"}
                            {p.status === "INSTALLED_VERIFIED" && "✓ INSTALLED"}
                            {p.status === "VOUCHER_ISSUED" && "🎟️ VOUCHER ACTIVE"}
                            {p.status === "REQUESTED" && "⏳ PENDING AUTH"}
                            {p.status === "PURCHASED" && "🛒 PURCHASED"}
                            {p.status === "REJECTED" && "❌ REJECTED"}
                          </span>
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            {p.status === "FLAGGED_FRAUD" && (
                              <button
                                onClick={() => handleResolveFraud(p.id)}
                                className="btn btn-secondary btn-sm"
                                style={{ color: "#EF4444", borderColor: "#EF4444", fontSize: "11px", padding: "3px 8px" }}
                                title="Resolve Fraud Flag"
                              >
                                Resolve Flag
                              </button>
                            )}
                            {p.status === "VOUCHER_ISSUED" && (
                              <button
                                onClick={() => handleRedeemVoucher(p.id)}
                                className="btn btn-primary btn-sm"
                                style={{ background: "#0EA5E9", borderColor: "#0EA5E9", fontSize: "11px", padding: "3px 8px" }}
                                title="Confirm merchant redemption"
                              >
                                Redeem
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedPartForAudit(p)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: "11px", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              <FileText size={12} /> Audit Trail
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Drawer / Modal */}
      {selectedPartForAudit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setSelectedPartForAudit(null)}
        >
          <div
            style={{
              background: "#0F172A",
              borderRadius: 16,
              border: "1.5px solid #8B5CF6",
              padding: 24,
              maxWidth: 600,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              color: "#F8FAFC",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="h4" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#C084FC" }}>
                <Shield size={20} color="#A855F7" /> Immutable Audit Ledger • #{selectedPartForAudit.reference}
              </h3>
              <button onClick={() => setSelectedPartForAudit(null)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: "#1E293B", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{selectedPartForAudit.partName}</strong>
                <span style={{ color: "#10B981", fontWeight: 700 }}>₦{Number(selectedPartForAudit.approvedCost || selectedPartForAudit.estimatedCost).toLocaleString()}</span>
              </div>
              <span style={{ color: "#94A3B8", display: "block", marginTop: 2 }}>
                Booking: #{selectedPartForAudit.booking?.reference} • Artisan: {selectedPartForAudit.professional?.user?.firstName} {selectedPartForAudit.professional?.user?.lastName}
              </span>
              {selectedPartForAudit.receiptHash && (
                <div style={{ marginTop: 6, fontSize: "10.5px", color: "#38BDF8", fontFamily: "monospace", wordBreak: "break-all" }}>
                  SHA-256 Receipt Hash: {selectedPartForAudit.receiptHash}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedPartForAudit.auditLogs?.map((log: any, idx: number) => (
                <div key={log.id || idx} style={{ background: "rgba(255,255,255,0.03)", borderLeft: "3px solid #8B5CF6", padding: "10px 14px", borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <strong style={{ color: "#38BDF8", fontSize: "12px" }}>{log.action}</strong>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <span style={{ fontSize: "11.5px", color: "#E2E8F0", display: "block" }}>{log.notes}</span>
                  <span style={{ fontSize: "10.5px", color: "#64748B", marginTop: 4, display: "block" }}>
                    Actor: {log.actorRole} {log.ipAddress ? `• IP: ${log.ipAddress}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {supplierModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => !processingAction && setSupplierModalOpen(false)}
        >
          <div
            style={{
              background: "#0F172A",
              borderRadius: 16,
              border: "1.5px solid #8B5CF6",
              padding: 24,
              maxWidth: 550,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              color: "#F8FAFC",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="h4" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#C084FC" }}>
                <Store size={22} color="#A855F7" /> {editingSupplier ? "Edit Partner Merchant" : "Add Verified Parts Supplier"}
              </h3>
              <button onClick={() => setSupplierModalOpen(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="e.g. Garki Electrical Mart Ltd"
                  style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F8FAFC", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Specialty Category
                  </label>
                  <select
                    value={supplierForm.category}
                    onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F8FAFC", fontSize: "13px" }}
                  >
                    <option value="GENERAL">General Hardware</option>
                    <option value="HVAC">HVAC & AC Parts</option>
                    <option value="ELECTRICAL">Electrical & Inverters</option>
                    <option value="PLUMBING">Plumbing & Sanitary</option>
                    <option value="CARPENTRY">Carpentry & Locks</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="+234 800 000 0000"
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F8FAFC", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 4 }}>
                  Store / Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  placeholder="Plot 12, Commercial Area, Abuja"
                  style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F8FAFC", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 4 }}>Bank Name</label>
                  <input
                    type="text"
                    value={supplierForm.bankName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, bankName: e.target.value })}
                    placeholder="GTBank"
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid #334155", borderRadius: 6, color: "#F8FAFC", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 4 }}>Account Number</label>
                  <input
                    type="text"
                    value={supplierForm.bankAccount}
                    onChange={(e) => setSupplierForm({ ...supplierForm, bankAccount: e.target.value })}
                    placeholder="0123456789"
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid #334155", borderRadius: 6, color: "#F8FAFC", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 4 }}>Account Name</label>
                  <input
                    type="text"
                    value={supplierForm.accountName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, accountName: e.target.value })}
                    placeholder="Merchant Ltd"
                    style={{ width: "100%", padding: 8, background: "#1E293B", border: "1px solid #334155", borderRadius: 6, color: "#F8FAFC", fontSize: "12px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setSupplierModalOpen(false)} disabled={processingAction} className="btn btn-secondary btn-md">
                  Cancel
                </button>
                <button type="submit" disabled={processingAction} className="btn btn-primary btn-md" style={{ background: "#8B5CF6", borderColor: "#8B5CF6" }}>
                  {processingAction ? "Saving..." : "Save Verified Merchant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {previewPhotoUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div style={{ maxWidth: "800px", maxHeight: "85vh", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhotoUrl}
              alt="Part Evidence Preview"
              style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: 12, border: "2px solid #334155" }}
            />
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              style={{
                position: "absolute",
                top: -12,
                right: -12,
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
