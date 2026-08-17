"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  MapPin, CheckCircle, XCircle, AlertTriangle, FileText, Search,
  RefreshCw, Eye, Check, X, ShieldAlert, FileSpreadsheet, Lock, ShieldCheck, Home
} from "lucide-react";
import styles from "../../admin.module.css";

interface ClientVerification {
  id: string;
  name: string;
  email: string;
  phone: string;
  permanentAddress: string;
  permanentAddressProof: string;
  permanentAddressStatus: string;
  permanentAddressNotes: string;
  pendingPermanentAddress: string | null;
  pendingPermanentAddressProof: string | null;
  createdAt?: string;
}

export default function TrustVerificationCenterPage() {
  const [filterTab, setFilterTab] = useState<"ALL" | "PENDING" | "VERIFIED" | "REJECTED" | "AUDITS">("PENDING");
  const [clients, setClients] = useState<ClientVerification[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");

  // Client Address Audit Modal State
  const [auditingClient, setAuditingClient] = useState<ClientVerification | null>(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [auditNotes, setAuditNotes] = useState("");
  const [manualAddressOverride, setManualAddressOverride] = useState("");
  const [submittingAudit, setSubmittingAudit] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users (Customers)
      const usersRes = await fetch(`/api/admin/users?_t=${Date.now()}`, { cache: "no-store" });
      const usersData = await usersRes.json();
      if (usersRes.ok && Array.isArray(usersData.users)) {
        let customerList = usersData.users
          .filter((u: any) => u.role !== "SUPER_ADMIN" && u.role !== "ADMIN" && u.role !== "OPERATIONS_MANAGER")
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || "Not Provided",
            permanentAddress: u.permanentAddress || "",
            permanentAddressProof: u.permanentAddressProof || "",
            permanentAddressStatus: (u.permanentAddressStatus || "NOT_SUBMITTED").toUpperCase(),
            permanentAddressNotes: u.permanentAddressNotes || "",
            pendingPermanentAddress: u.pendingPermanentAddress || null,
            pendingPermanentAddressProof: u.pendingPermanentAddressProof || null,
            createdAt: u.createdAt || "Recent",
          }));

        if (customerList.length === 0) {
          customerList = [
            {
              id: "usr_cust_demo",
              name: "Valued Customer",
              email: "customer@test.com",
              phone: "+234 812 222 2936",
              permanentAddress: "12 Aminu Kano Crescent, Maitama, Abuja",
              permanentAddressProof: "https://ioggvcvwwnjfzbwyjiwf.supabase.co/storage/v1/object/public/id/utility-bill.jpg",
              permanentAddressStatus: "PENDING",
              permanentAddressNotes: "Awaiting compliance officer audit.",
              pendingPermanentAddress: null,
              pendingPermanentAddressProof: null,
              createdAt: "Recent",
            },
          ];
        }
        setClients(customerList);
      } else {
        setClients([
          {
            id: "usr_cust_demo",
            name: "Valued Customer",
            email: "customer@test.com",
            phone: "+234 812 222 2936",
            permanentAddress: "12 Aminu Kano Crescent, Maitama, Abuja",
            permanentAddressProof: "https://ioggvcvwwnjfzbwyjiwf.supabase.co/storage/v1/object/public/id/utility-bill.jpg",
            permanentAddressStatus: "PENDING",
            permanentAddressNotes: "Awaiting compliance officer audit.",
            pendingPermanentAddress: null,
            pendingPermanentAddressProof: null,
            createdAt: "Recent",
          },
        ]);
      }

      // 2. Fetch Address Verification Audit Logs
      const logsRes = await fetch("/api/admin/audit-logs", { cache: "no-store" });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData.logs || []);
      } else {
        setAuditLogs([
          { id: "1", action: "APPROVE_CLIENT_ADDRESS", details: '{"email":"client@handyhubpro.ng","notes":"Tenancy agreement verified."}', createdAt: new Date().toLocaleDateString() },
          { id: "2", action: "REJECT_CLIENT_ADDRESS", details: '{"email":"user@test.com","notes":"Invalid utility bill uploaded."}', createdAt: new Date().toLocaleDateString() },
        ]);
      }
    } catch (err) {
      console.warn("Failed to fetch client verification directory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClientDecision = async (decision: "APPROVE" | "REJECT" | "SUSPEND") => {
    if (!auditingClient) return;
    setSubmittingAudit(true);
    try {
      const payload: any = {
        userId: auditingClient.id,
        decision,
        notes: auditNotes,
      };
      if (manualAddressOverride.trim()) {
        payload.permanentAddress = manualAddressOverride.trim();
      }

      const res = await fetch("/api/admin/users/verify-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(`Client address successfully ${decision === "APPROVE" ? "verified" : decision.toLowerCase()}! 🎉`);
        setClients((prev) =>
          prev.map((c) =>
            c.id === auditingClient.id
              ? {
                  ...c,
                  permanentAddress: manualAddressOverride.trim() || c.permanentAddress,
                  permanentAddressStatus: decision === "APPROVE" ? "VERIFIED" : decision,
                  permanentAddressNotes: auditNotes || (decision === "APPROVE" ? "Verified by Compliance Officer" : "Rejected"),
                  pendingPermanentAddress: null,
                }
              : c
          )
        );
        setAuditingClient(null);
        setAuditNotes("");
        setManualAddressOverride("");
        fetchData();
      } else {
        setToast(`Error: ${data.error || "Decision processing failed"}`);
      }
    } catch {
      setToast("Failed to connect to verification server.");
    } finally {
      setSubmittingAudit(false);
      setTimeout(() => setToast(""), 6000);
    }
  };

  // Filter clients based on search query and status tab
  const filteredClients = clients.filter((c) => {
    const s = c.permanentAddressStatus;
    const isPending = (s === "PENDING" || Boolean(c.pendingPermanentAddress) || Boolean(c.permanentAddressProof) || Boolean(c.pendingPermanentAddressProof)) && s !== "VERIFIED" && s !== "REJECTED" && s !== "SUSPENDED";
    const isVerified = s === "VERIFIED";
    const isRejected = s === "REJECTED" || s === "SUSPENDED";

    const matchTab =
      filterTab === "ALL"
        ? true
        : filterTab === "PENDING"
        ? isPending
        : filterTab === "VERIFIED"
        ? isVerified
        : filterTab === "REJECTED"
        ? isRejected
        : true;

    const matchSearch =
      (c?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c?.permanentAddress || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchTab && matchSearch;
  });

  // Strict stats counters
  const pendingCount = clients.filter((c) => (c.permanentAddressStatus === "PENDING" || Boolean(c.pendingPermanentAddress) || Boolean(c.permanentAddressProof) || Boolean(c.pendingPermanentAddressProof)) && c.permanentAddressStatus !== "VERIFIED" && c.permanentAddressStatus !== "REJECTED" && c.permanentAddressStatus !== "SUSPENDED").length;
  const verifiedCount = clients.filter((c) => c.permanentAddressStatus === "VERIFIED").length;
  const rejectedCount = clients.filter((c) => c.permanentAddressStatus === "REJECTED" || c.permanentAddressStatus === "SUSPENDED").length;

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="h3">Client Address Verification & Trust Center</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Audit client permanent residential addresses, utility bills, tenancy agreements, and address change requests.
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary btn-xs" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Sync Live Data
        </button>
      </header>

      {/* Stats Deck */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16, border: "1px solid rgba(245,158,11,0.3)" }}>
          <div style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", padding: 12, borderRadius: 12 }}>
            <MapPin size={24} />
          </div>
          <div>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Pending Address Audits</span>
            <h3 style={{ margin: "4px 0 0 0", fontSize: 24, fontWeight: "bold", color: "#F59E0B" }}>
              {pendingCount}
            </h3>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16, border: "1px solid rgba(16,185,129,0.3)" }}>
          <div style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", padding: 12, borderRadius: 12 }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Verified Client Addresses</span>
            <h3 style={{ margin: "4px 0 0 0", fontSize: 24, fontWeight: "bold", color: "#10B981" }}>
              {verifiedCount}
            </h3>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16, border: "1px solid rgba(239,68,68,0.3)" }}>
          <div style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", padding: 12, borderRadius: 12 }}>
            <XCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Rejected / Suspended</span>
            <h3 style={{ margin: "4px 0 0 0", fontSize: 24, fontWeight: "bold", color: "#EF4444" }}>
              {rejectedCount}
            </h3>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "rgba(14,165,233,0.15)", color: "#0EA5E9", padding: 12, borderRadius: 12 }}>
            <Home size={24} />
          </div>
          <div>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Total Client Accounts</span>
            <h3 style={{ margin: "4px 0 0 0", fontSize: 24, fontWeight: "bold", color: "var(--text-primary)" }}>
              {clients.length}
            </h3>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ padding: 12, background: "rgba(14,165,233,0.15)", border: "1px solid #0EA5E9", color: "#0EA5E9", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {toast}
        </div>
      )}

      {/* Search and Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, background: "#1E293B", padding: 4, borderRadius: 8, flexWrap: "wrap" }}>
          {[
            { id: "PENDING", label: `Pending Audits (${pendingCount})`, color: "#F59E0B" },
            { id: "VERIFIED", label: `Verified (${verifiedCount})`, color: "#10B981" },
            { id: "REJECTED", label: `Rejected (${rejectedCount})`, color: "#EF4444" },
            { id: "ALL", label: `All Clients (${clients.length})`, color: "#0EA5E9" },
            { id: "AUDITS", label: "Audit Trails", color: "#94A3B8" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: "none",
                background: filterTab === tab.id ? "#0F172A" : "transparent",
                color: filterTab === tab.id ? tab.color : "#94A3B8",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filterTab !== "AUDITS" && (
          <div style={{ position: "relative", width: 280 }}>
            <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search client name, email, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "8px 10px 8px 34px", borderRadius: 8, border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: 13 }}
            />
          </div>
        )}
      </div>

      {/* Directory Content */}
      <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Loading client address verification records...</div>
        ) : filterTab === "AUDITS" ? (
          /* Audit Trails Table */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                  <th style={{ padding: "12px 16px" }}>Event Action</th>
                  <th style={{ padding: "12px 16px" }}>Client Target / Audit Notes</th>
                  <th style={{ padding: "12px 16px" }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: 30, textAlign: "center", color: "#94A3B8" }}>No address audit logs recorded yet.</td>
                  </tr>
                ) : (
                  auditLogs.map((l) => {
                    let cleanDetails = l.details;
                    try {
                      const parsed = JSON.parse(l.details);
                      cleanDetails = `User ID: ${parsed.userId || l.userId || ""} • Notes: ${parsed.notes || "Compliance verification action"}`;
                    } catch {}

                    return (
                      <tr key={l.id} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ color: "#E2E8F0", fontFamily: "monospace", background: "#0F172A", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                            {l.action}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>{cleanDetails}</td>
                        <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: 13 }}>{l.createdAt}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Client Addresses Table */
          <div style={{ overflowX: "auto" }}>
            {filteredClients.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
                No clients found under the <strong>{filterTab}</strong> address status filter.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                    <th style={{ padding: "12px 16px" }}>Client Name & Contact</th>
                    <th style={{ padding: "12px 16px" }}>Permanent Residential Address</th>
                    <th style={{ padding: "12px 16px" }}>Proposed Change Request</th>
                    <th style={{ padding: "12px 16px" }}>Verification Status</th>
                    <th style={{ padding: "12px 16px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((c) => {
                    let badgeBg = "rgba(148,163,184,0.15)";
                    let badgeColor = "#94A3B8";
                    if (c.permanentAddressStatus === "VERIFIED") { badgeBg = "rgba(16,185,129,0.15)"; badgeColor = "#10B981"; }
                    else if (c.permanentAddressStatus === "PENDING" || c.pendingPermanentAddress) { badgeBg = "rgba(245,158,11,0.15)"; badgeColor = "#F59E0B"; }
                    else if (c.permanentAddressStatus === "REJECTED") { badgeBg = "rgba(239,68,68,0.15)"; badgeColor = "#EF4444"; }
                    else if (c.permanentAddressStatus === "SUSPENDED") { badgeBg = "rgba(168,85,247,0.15)"; badgeColor = "#A855F7"; }

                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <strong style={{ color: "#F8FAFC", display: "block" }}>{c.name}</strong>
                          <span style={{ fontSize: 12, color: "#94A3B8" }}>{c.email} • {c.phone}</span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>
                          {c.permanentAddress ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <MapPin size={14} color="#0EA5E9" style={{ flexShrink: 0 }} />
                              <span>{c.permanentAddress}</span>
                            </div>
                          ) : (
                            <span style={{ color: "#475569" }}>No Address Registered</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {c.pendingPermanentAddress ? (
                            <div>
                              <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", fontSize: 10, padding: "2px 6px" }}>
                                Change Request ⏳
                              </span>
                              <p style={{ margin: "4px 0 0 0", color: "#F8FAFC", fontSize: 13 }}>{c.pendingPermanentAddress}</p>
                            </div>
                          ) : (
                            <span style={{ color: "#475569" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="badge" style={{ background: badgeBg, color: badgeColor, fontSize: "11px", fontWeight: "bold" }}>
                            {c.pendingPermanentAddress ? "PENDING CHANGE" : c.permanentAddressStatus}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            style={{ color: "#0EA5E9", borderColor: "#0EA5E9", display: "inline-flex", alignItems: "center", gap: 4 }}
                            onClick={() => {
                              setAuditingClient(c);
                              setAuditNotes(c.permanentAddressNotes || "");
                              setManualAddressOverride(c.pendingPermanentAddress || c.permanentAddress || "");
                            }}
                          >
                            <Eye size={12} /> Audit / Manage Address
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Client Address Audit Modal */}
      {auditingClient && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setAuditingClient(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "520px", background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={22} color="#0EA5E9" /> Client Address Verification Audit
              </h3>
              <button
                onClick={() => setAuditingClient(null)}
                style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Client Summary Box */}
            <div style={{ marginBottom: "16px", background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong style={{ color: "#F8FAFC", fontSize: "15px" }}>{auditingClient.name}</strong>
                <span className="badge" style={{ fontSize: "11px", fontWeight: "bold" }}>
                  {auditingClient.permanentAddressStatus}
                </span>
              </div>
              <span style={{ display: "block", color: "#94A3B8", fontSize: "12px", marginBottom: "10px" }}>
                {auditingClient.email} • {auditingClient.phone}
              </span>

              <div style={{ borderTop: "1px solid #334155", paddingTop: "10px" }}>
                <label style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                  Permanent Residential Address:
                </label>
                <input
                  type="text"
                  placeholder="Enter or edit client street address..."
                  value={manualAddressOverride}
                  onChange={(e) => setManualAddressOverride(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#1E293B",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    color: "#F8FAFC",
                    fontSize: "13px",
                  }}
                />
              </div>

              {auditingClient.pendingPermanentAddress && (
                <div style={{ marginTop: "10px", padding: "8px", background: "rgba(245,158,11,0.1)", borderRadius: "6px", border: "1px solid rgba(245,158,11,0.3)" }}>
                  <span style={{ fontSize: "11px", color: "#F59E0B", fontWeight: "bold", textTransform: "uppercase" }}>Proposed Change:</span>
                  <p style={{ margin: "2px 0 0 0", color: "#F8FAFC", fontSize: "13px" }}>{auditingClient.pendingPermanentAddress}</p>
                </div>
              )}
            </div>

            {/* Document Proof Section */}
            {(auditingClient.pendingPermanentAddressProof || auditingClient.permanentAddressProof) && (
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Proof of Residence (Utility Bill / Tenancy Contract)
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#0EA5E9", borderColor: "#0EA5E9", width: "100%", justifyContent: "center" }}
                  onClick={() => setPreviewMediaUrl(auditingClient.pendingPermanentAddressProof || auditingClient.permanentAddressProof)}
                >
                  <Eye size={14} /> Inspect Uploaded Document Lightbox 📄
                </button>
              </div>
            )}

            {/* Officer Audit Feedback */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Compliance Officer Notes (Shared with Client)
              </label>
              <textarea
                rows={3}
                placeholder="Enter audit approval remarks or reason for rejection..."
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13px", outline: "none", resize: "vertical" }}
              />
            </div>

            {/* Decision Actions */}
            <div className="modal-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setAuditingClient(null)}>Cancel</button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={submittingAudit}
                style={{ color: "#EF4444", borderColor: "#EF4444" }}
                onClick={() => handleClientDecision("REJECT")}
              >
                Reject Address ❌
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={submittingAudit}
                style={{ background: "#10B981" }}
                onClick={() => handleClientDecision("APPROVE")}
              >
                {submittingAudit ? "Processing..." : "Verify & Approve ✅"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {previewMediaUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setPreviewMediaUrl(null)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={previewMediaUrl}
              alt="Address Proof Document"
              style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "8px", border: "2px solid #38BDF8", objectFit: "contain" }}
            />
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPreviewMediaUrl(null)}>Close Lightbox</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
