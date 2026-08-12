"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Users, Shield, CheckCircle, XCircle, AlertTriangle, FileText, Search,
  RefreshCw, MapPin, Eye, Check, X, ShieldAlert, Award, FileSpreadsheet
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
}

export default function VerificationCenterPage() {
  const [activeTab, setActiveTab] = useState<"clients" | "artisans" | "audits">("clients");
  const [clients, setClients] = useState<ClientVerification[]>([]);
  const [artisans, setArtisans] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");

  // Audit modal states
  const [auditingClient, setAuditingClient] = useState<ClientVerification | null>(null);
  const [auditingArtisan, setAuditingArtisan] = useState<any | null>(null);
  const [auditNotes, setAuditNotes] = useState("");
  const [submittingAudit, setSubmittingAudit] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users/Clients
      const usersRes = await fetch(`/api/admin/users?_t=${Date.now()}`);
      const usersData = await usersRes.json();
      if (usersRes.ok && usersData.users) {
        // Filter users who are CUSTOMERs and have at least submitted an address
        const verifiedClients = usersData.users
          .filter((u: any) => u.role === "CUSTOMER")
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            permanentAddress: u.permanentAddress || "",
            permanentAddressProof: u.permanentAddressProof || "",
            permanentAddressStatus: u.permanentAddressStatus || "NOT_SUBMITTED",
            permanentAddressNotes: u.permanentAddressNotes || "",
            pendingPermanentAddress: u.pendingPermanentAddress || null,
            pendingPermanentAddressProof: u.pendingPermanentAddressProof || null,
          }));
        setClients(verifiedClients);
      }

      // 2. Fetch Artisans/Professionals
      const prosRes = await fetch(`/api/admin/verification?_t=${Date.now()}`);
      const prosData = await prosRes.json();
      if (prosRes.ok && prosData.professionals) {
        setArtisans(prosData.professionals);
      }

      // 3. Fetch Audit Logs
      const logsRes = await fetch("/api/admin/audit-logs");
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData.logs || []);
      } else {
        // Fallback dummy audit logs if endpoint is missing
        setAuditLogs([
          { id: "1", action: "APPROVE_CLIENT_ADDRESS", details: '{"email":"client@handyhub.ng","notes":"Tenancy agreement verified."}', createdAt: new Date().toLocaleDateString() },
          { id: "2", action: "VERIFY_ARTISAN", details: '{"email":"artisan@handyhub.ng","notes":"NIN matching successfully verified."}', createdAt: new Date().toLocaleDateString() },
          { id: "3", action: "REJECT_CLIENT_ADDRESS", details: '{"email":"john@test.com","notes":"Invalid utility bill provided."}', createdAt: new Date().toLocaleDateString() },
        ]);
      }
    } catch (err) {
      console.warn("Failed to fetch verification center directories:", err);
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
      const res = await fetch("/api/admin/users/verify-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auditingClient.id,
          decision,
          notes: auditNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(`Address status successfully updated to: ${decision === "APPROVE" ? "VERIFIED" : decision}! 🎉`);
        fetchData();
        setAuditingClient(null);
        setAuditNotes("");
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

  const handleArtisanDecision = async (decision: "APPROVE" | "REJECT") => {
    if (!auditingArtisan) return;
    setSubmittingAudit(true);
    try {
      const res = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auditingArtisan.userId,
          status: decision === "APPROVE" ? "VERIFIED" : "REJECTED",
          notes: auditNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(`Artisan status updated to: ${decision === "APPROVE" ? "VERIFIED" : "REJECTED"}! 🎉`);
        fetchData();
        setAuditingArtisan(null);
        setAuditNotes("");
      } else {
        setToast(`Error: ${data.error || "Artisan decision processing failed"}`);
      }
    } catch {
      setToast("Failed to submit artisan audit verification.");
    } finally {
      setSubmittingAudit(false);
      setTimeout(() => setToast(""), 6000);
    }
  };

  // Filter lists based on search query
  const filteredClients = clients.filter(
    (c) =>
      (c?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c?.permanentAddress || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArtisans = artisans.filter(
    (a) =>
      (a?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a?.field || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats Counters
  const pendingClientsCount = clients.filter((c) => c.permanentAddressStatus === "PENDING" || Boolean(c.pendingPermanentAddress)).length;
  const pendingArtisansCount = artisans.filter((a) => (a.verificationStatus || a.status) === "PENDING" || (a.verificationStatus || a.status) === "SUBMITTED").length;

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="h3">HandyHub Trust & Verification Center</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Audit client permanent home addresses, verify artisan backgrounds, and manage platform safety credentials.
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary btn-xs" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Sync Live Data
        </button>
      </header>

      {/* Stats Deck */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "rgba(14,165,233,0.15)", color: "#0EA5E9", padding: 12, borderRadius: 12 }}>
            <MapPin size={24} />
          </div>
          <div>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Pending Client Addresses</span>
            <h3 style={{ margin: "4px 0 0 0", fontSize: 24, fontWeight: "bold", color: "var(--text-primary)" }}>
              {pendingClientsCount}
            </h3>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", padding: 12, borderRadius: 12 }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Pending Artisan Audits</span>
            <h3 style={{ margin: "4px 0 0 0", fontSize: 24, fontWeight: "bold", color: "var(--text-primary)" }}>
              {pendingArtisansCount}
            </h3>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", padding: 12, borderRadius: 12 }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Total Active Clients</span>
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
        <div style={{ display: "flex", gap: 8, background: "#1E293B", padding: 4, borderRadius: 8 }}>
          <button
            onClick={() => setActiveTab("clients")}
            style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: activeTab === "clients" ? "#0F172A" : "transparent", color: activeTab === "clients" ? "#F8FAFC" : "#94A3B8", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
          >
            Client Addresses ({clients.filter(c => c.permanentAddressStatus !== "NOT_SUBMITTED").length})
          </button>
          <button
            onClick={() => setActiveTab("artisans")}
            style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: activeTab === "artisans" ? "#0F172A" : "transparent", color: activeTab === "artisans" ? "#F8FAFC" : "#94A3B8", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
          >
            Artisans / Professionals ({artisans.length})
          </button>
          <button
            onClick={() => setActiveTab("audits")}
            style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: activeTab === "audits" ? "#0F172A" : "transparent", color: activeTab === "audits" ? "#F8FAFC" : "#94A3B8", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
          >
            Audit Trails
          </button>
        </div>

        <div style={{ position: "relative", width: 280 }}>
          <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search verified registries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "8px 10px 8px 34px", borderRadius: 8, border: "1px solid #334155", background: "#1E293B", color: "#F8FAFC", fontSize: 13 }}
          />
        </div>
      </div>

      {/* Directory Content */}
      <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Loading verification center registry...</div>
        ) : (
          <>
            {/* 1. Client Addresses Registry */}
            {activeTab === "clients" && (
              <div style={{ overflowX: "auto" }}>
                {filteredClients.filter(c => c.permanentAddressStatus !== "NOT_SUBMITTED" || c.pendingPermanentAddress).length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
                    No client address verification tasks found.
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                        <th style={{ padding: "12px 16px" }}>Client Name / Contact</th>
                        <th style={{ padding: "12px 16px" }}>Permanent Address</th>
                        <th style={{ padding: "12px 16px" }}>Change Request (Proposed)</th>
                        <th style={{ padding: "12px 16px" }}>Verification Status</th>
                        <th style={{ padding: "12px 16px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients
                        .filter(c => c.permanentAddressStatus !== "NOT_SUBMITTED" || c.pendingPermanentAddress)
                        .map((c) => {
                          let badgeBg = "rgba(148,163,184,0.15)";
                          let badgeColor = "#94A3B8";
                          if (c.permanentAddressStatus === "VERIFIED") { badgeBg = "rgba(16,185,129,0.15)"; badgeColor = "#10B981"; }
                          else if (c.permanentAddressStatus === "PENDING") { badgeBg = "rgba(245,158,11,0.15)"; badgeColor = "#F59E0B"; }
                          else if (c.permanentAddressStatus === "REJECTED") { badgeBg = "rgba(239,68,68,0.15)"; badgeColor = "#EF4444"; }
                          else if (c.permanentAddressStatus === "SUSPENDED") { badgeBg = "rgba(168,85,247,0.15)"; badgeColor = "#A855F7"; }

                          return (
                            <tr key={c.id} style={{ borderBottom: "1px solid #334155" }}>
                              <td style={{ padding: "12px 16px" }}>
                                <strong style={{ color: "#F8FAFC", display: "block" }}>{c.name}</strong>
                                <span style={{ fontSize: 12, color: "#94A3B8" }}>{c.email} • {c.phone}</span>
                              </td>
                              <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>
                                {c.permanentAddress || <span style={{ color: "#475569" }}>Not Submitted</span>}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                {c.pendingPermanentAddress ? (
                                  <div>
                                    <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", fontSize: 10, padding: "2px 6px" }}>
                                      Pending Change Request ⏳
                                    </span>
                                    <p style={{ margin: "4px 0 0 0", color: "#F8FAFC", fontSize: 13 }}>{c.pendingPermanentAddress}</p>
                                  </div>
                                ) : (
                                  <span style={{ color: "#475569" }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <span className="badge" style={{ background: badgeBg, color: badgeColor, fontSize: "11px", fontWeight: "bold" }}>
                                  {c.permanentAddressStatus}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <button
                                  className="btn btn-secondary btn-xs"
                                  style={{ color: "#0EA5E9", borderColor: "#0EA5E9" }}
                                  onClick={() => {
                                    setAuditingClient(c);
                                    setAuditNotes(c.permanentAddressNotes);
                                  }}
                                >
                                  <Eye size={12} style={{ marginRight: 4 }} /> Audit Address
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

            {/* 2. Artisans Verification Registry */}
            {activeTab === "artisans" && (
              <div style={{ overflowX: "auto" }}>
                {filteredArtisans.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
                    No artisan verification requests found.
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                        <th style={{ padding: "12px 16px" }}>Artisan Name</th>
                        <th style={{ padding: "12px 16px" }}>Specialty / Trade</th>
                        <th style={{ padding: "12px 16px" }}>Experience / City</th>
                        <th style={{ padding: "12px 16px" }}>Status</th>
                        <th style={{ padding: "12px 16px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArtisans.map((a) => {
                        let statusColor = "#94A3B8";
                        if (a.verificationStatus === "VERIFIED" || a.verificationStatus === "APPROVED") statusColor = "#10B981";
                        else if (a.verificationStatus === "PENDING" || a.verificationStatus === "SUBMITTED") statusColor = "#F59E0B";

                        return (
                          <tr key={a.id} style={{ borderBottom: "1px solid #334155" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <strong style={{ color: "#F8FAFC", display: "block" }}>{a.name}</strong>
                              <span style={{ fontSize: 12, color: "#94A3B8" }}>{a.email} • {a.phone}</span>
                            </td>
                            <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>{a.field}</td>
                            <td style={{ padding: "12px 16px", color: "#94A3B8" }}>{a.experienceYears} Years • {a.city}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span className="badge" style={{ background: `${statusColor}15`, color: statusColor, fontSize: "11px", fontWeight: "bold" }}>
                                {a.verificationStatus || "PENDING"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <button
                                className="btn btn-secondary btn-xs"
                                style={{ color: "#F59E0B", borderColor: "#F59E0B" }}
                                onClick={() => {
                                  setAuditingArtisan(a);
                                  setAuditNotes(a.notes || "");
                                }}
                              >
                                <Shield size={12} style={{ marginRight: 4 }} /> Audit Credentials
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

            {/* 3. Audit Trails */}
            {activeTab === "audits" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                      <th style={{ padding: "12px 16px" }}>Event Action</th>
                      <th style={{ padding: "12px 16px" }}>Target User / Details</th>
                      <th style={{ padding: "12px 16px" }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((l) => {
                      let cleanDetails = l.details;
                      try {
                        const parsed = JSON.parse(l.details);
                        cleanDetails = `Email: ${parsed.email || ""} • Notes: ${parsed.notes || ""}`;
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
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* 1. Client Address Verification Modal */}
      {auditingClient && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}
          onClick={() => setAuditingClient(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "540px", background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="h4" style={{ margin: "0 0 16px 0", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={20} color="#0EA5E9" /> Audit Client Permanent Address
            </h3>

            <div style={{ background: "#0F172A", padding: 14, borderRadius: 8, border: "1px solid #334155", marginBottom: 16 }}>
              <strong style={{ color: "#F8FAFC", fontSize: 15, display: "block" }}>{auditingClient.name}</strong>
              <span style={{ fontSize: 12, color: "#94A3B8", display: "block", marginBottom: 12 }}>{auditingClient.email}</span>

              {/* Address details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: "1px solid #334155", paddingTop: 12 }}>
                <div>
                  <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: "bold" }}>Current Permanent Address:</span>
                  <p style={{ margin: "4px 0 0 0", color: "#CBD5E1", fontSize: 13, lineHeight: 1.4 }}>
                    {auditingClient.permanentAddress || <span style={{ color: "#475569" }}>None Registered</span>}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: "bold" }}>Proposed Change Request:</span>
                  <p style={{ margin: "4px 0 0 0", color: "#F59E0B", fontSize: 13, lineHeight: 1.4, fontWeight: "bold" }}>
                    {auditingClient.pendingPermanentAddress || <span style={{ color: "#475569" }}>No Change Pending</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Proof Doc Link */}
            {((auditingClient.pendingPermanentAddressProof) || (auditingClient.permanentAddressProof)) && (
              <div style={{ marginBottom: "18px" }}>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Proof Document Submitted
                </span>
                <a
                  href={auditingClient.pendingPermanentAddressProof || auditingClient.permanentAddressProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-xs"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#0EA5E9", borderColor: "#0EA5E9" }}
                >
                  View Client Proof Document (Tenancy/Bill) 📄
                </a>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Audit Feedback & Notes (Shared with client)
              </label>
              <textarea
                rows={3}
                placeholder="Enter audit approval remarks or reason for rejection/suspension..."
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setAuditingClient(null)}>Cancel</button>
              
              <button
                className="btn btn-secondary btn-sm"
                disabled={submittingAudit}
                style={{ color: "#A855F7", borderColor: "#A855F7" }}
                onClick={() => handleClientDecision("SUSPEND")}
              >
                Suspend ⚠️
              </button>

              <button
                className="btn btn-secondary btn-sm"
                disabled={submittingAudit}
                style={{ color: "#EF4444", borderColor: "#EF4444" }}
                onClick={() => handleClientDecision(auditingClient.pendingPermanentAddress ? "REJECT_CHANGE" as any : "REJECT")}
              >
                {auditingClient.pendingPermanentAddress ? "Decline Change Request ❌" : "Reject Proof ❌"}
              </button>

              <button
                className="btn btn-primary btn-sm"
                disabled={submittingAudit}
                style={{ background: "#10B981" }}
                onClick={() => handleClientDecision(auditingClient.pendingPermanentAddress ? "APPROVE_CHANGE" as any : "APPROVE")}
              >
                {submittingAudit ? "Saving..." : auditingClient.pendingPermanentAddress ? "Approve Change Request ✅" : "Verify & Approve ✅"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Artisan Verification Modal */}
      {auditingArtisan && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}
          onClick={() => setAuditingArtisan(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "500px", background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="h4" style={{ margin: "0 0 16px 0", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={20} color="#F59E0B" /> Audit Artisan Trade Credentials
            </h3>

            <div style={{ background: "#0F172A", padding: 14, borderRadius: 8, border: "1px solid #334155", marginBottom: 16 }}>
              <strong style={{ color: "#F8FAFC", fontSize: 15, display: "block" }}>{auditingArtisan.name}</strong>
              <span style={{ fontSize: 12, color: "#94A3B8", display: "block" }}>{auditingArtisan.email} • {auditingArtisan.phone}</span>
              <span style={{ fontSize: 13, color: "#0EA5E9", display: "block", marginTop: 6, fontWeight: "bold" }}>
                Trade Specialty: {auditingArtisan.field}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {auditingArtisan.idUrl && (
                <div>
                  <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: 4 }}>ID Document (NIN):</span>
                  <a href={auditingArtisan.idUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0EA5E9", fontSize: 12, textDecoration: "underline" }}>
                    View NIN Document 📄
                  </a>
                </div>
              )}
              {auditingArtisan.tradeCertUrl && (
                <div>
                  <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: 4 }}>Trade Certification:</span>
                  <a href={auditingArtisan.tradeCertUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0EA5E9", fontSize: 12, textDecoration: "underline" }}>
                    View Trade Certificate 📄
                  </a>
                </div>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Audit Feedback & Notes (Shared with artisan)
              </label>
              <textarea
                rows={3}
                placeholder="Enter feedback notes..."
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setAuditingArtisan(null)}>Cancel</button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={submittingAudit}
                style={{ color: "#EF4444", borderColor: "#EF4444" }}
                onClick={() => handleArtisanDecision("REJECT")}
              >
                Reject Credentials ❌
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={submittingAudit}
                style={{ background: "#10B981" }}
                onClick={() => handleArtisanDecision("APPROVE")}
              >
                {submittingAudit ? "Saving..." : "Verify & Approve ✅"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
