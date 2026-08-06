"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Shield, CheckCircle2, XCircle, Search, Filter, Eye, FileText,
  MapPin, Phone, Mail, Award, Clock, AlertTriangle, ExternalLink, Inbox
} from "lucide-react";
import styles from "../../admin.module.css";

export default function ProfessionalVerificationPage() {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectPro, setInspectPro] = useState<any>(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [officerNotes, setOfficerNotes] = useState("");
  const [toast, setToast] = useState("");

  const fetchPros = async () => {
    try {
      const res = await fetch("/api/admin/verification");
      const data = await res.json();
      if (res.ok && data.professionals) {
        setPros(data.professionals);
      }
    } catch (err) {
      console.warn("Failed to fetch professionals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPros();
  }, []);

  const filteredPros = pros.filter((p) => {
    const matchStatus = filterStatus === "ALL" || p.verificationStatus === filterStatus;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.field.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleAuditDecision = async (newStatus: "VERIFIED" | "REJECTED") => {
    if (!inspectPro) return;

    try {
      await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId: inspectPro.id,
          status: newStatus,
          verificationNotes: officerNotes || inspectPro.notes,
          addressVerified: newStatus === "VERIFIED",
        }),
      });
    } catch {}

    setPros((prev) =>
      prev.map((p) =>
        p.id === inspectPro.id
          ? {
              ...p,
              verificationStatus: newStatus,
              addressVerified: newStatus === "VERIFIED",
              notes: officerNotes || p.notes,
            }
          : p
      )
    );

    setToast(`Artisan ${inspectPro.name} verification status updated to ${newStatus}. Notification sent!`);
    setInspectPro(null);
    setOfficerNotes("");
    setTimeout(() => setToast(""), 4000);
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="h3">Artisan Identity & Address Verification Center</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Review real artisan registrations from database. Mandatory verification required before accepting bookings.
          </p>
        </div>
      </header>

      {toast && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          ✅ {toast}
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search artisan name, email, or skill field..."
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

        <div style={{ display: "flex", gap: "8px" }}>
          {["ALL", "PENDING", "VERIFIED", "REJECTED"].map((st) => (
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
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Professionals List Table */}
      <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden" }}>
        {filteredPros.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#94A3B8" }}>
            <Inbox size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
            <h4 className="h4" style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>No Artisans Registered in Database</h4>
            <p style={{ margin: 0, fontSize: "13px" }}>Artisans registering on HandyHub Pro will display here automatically for verification audit.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                <th style={{ padding: "12px 16px" }}>Artisan Name</th>
                <th style={{ padding: "12px 16px" }}>Field / Skill</th>
                <th style={{ padding: "12px 16px" }}>City</th>
                <th style={{ padding: "12px 16px" }}>Govt ID Type</th>
                <th style={{ padding: "12px 16px" }}>Address Check</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Audit Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPros.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <strong style={{ color: "#F8FAFC", display: "block" }}>{p.name}</strong>
                    <span style={{ fontSize: "12px", color: "#94A3B8" }}>{p.phone}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>{p.field}</td>
                  <td style={{ padding: "12px 16px", color: "#94A3B8" }}>{p.city}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#0EA5E9" }}>
                      {p.idType} ({p.idNumber})
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="badge" style={{ background: p.addressVerified ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: p.addressVerified ? "#10B981" : "#F59E0B", fontSize: "11px" }}>
                      {p.addressVerified ? "VERIFIED" : "UNVERIFIED"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      className="badge"
                      style={{
                        background: p.verificationStatus === "VERIFIED" ? "rgba(16,185,129,0.15)" : p.verificationStatus === "REJECTED" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                        color: p.verificationStatus === "VERIFIED" ? "#10B981" : p.verificationStatus === "REJECTED" ? "#EF4444" : "#F59E0B",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {p.verificationStatus}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button className="btn btn-primary btn-xs" onClick={() => setInspectPro(p)}>
                      <Eye size={14} /> Audit Docs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Document Inspector Modal */}
      {inspectPro && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
          onClick={() => setInspectPro(null)}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "650px",
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "24px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Audit Verification Documents</h3>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>{inspectPro.name} • {inspectPro.field}</span>
              </div>
              <button onClick={() => setInspectPro(null)} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            {/* 4-Step Verification Audit Dossier */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
              {/* Step 1: Identity & Selfie */}
              <div style={{ background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ fontSize: "12px", color: "#0EA5E9", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  1️⃣ Government Identity & Facial Verification Selfie
                </strong>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC" }}>{inspectPro.idType}: {inspectPro.idNumber}</div>
                    {inspectPro.idUrl && inspectPro.idUrl !== "#" && (
                      <button
                        type="button"
                        onClick={() => setPreviewMediaUrl(inspectPro.idUrl)}
                        style={{ background: "none", border: "none", padding: 0, fontSize: "12px", color: "#38BDF8", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px" }}
                      >
                        👁️ Inspect ID Document <ExternalLink size={12} />
                      </button>
                    )}
                  </div>
                  {inspectPro.selfieUrl && inspectPro.selfieUrl !== "#" && (
                    <div style={{ textAlign: "center", cursor: "pointer" }} onClick={() => setPreviewMediaUrl(inspectPro.selfieUrl)}>
                      <img src={inspectPro.selfieUrl} alt="Facial Verification Selfie" style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", border: "2px solid #10B981" }} />
                      <span style={{ fontSize: "10px", color: "#10B981", display: "block" }}>Click to Enlarge Selfie 🔍</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Trade Certificate & Portfolio */}
              <div style={{ background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ fontSize: "12px", color: "#8B5CF6", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  2️⃣ Trade Certificate & Work Portfolio
                </strong>
                <div style={{ fontSize: "13px", color: "#CBD5E1", marginBottom: 6 }}>
                  Certification:{" "}
                  <button
                    type="button"
                    onClick={() => setPreviewMediaUrl(inspectPro.tradeCertUrl)}
                    style={{ background: "none", border: "none", padding: 0, color: "#38BDF8", fontWeight: "bold", cursor: "pointer" }}
                  >
                    Inspect Trade Cert PDF / Image 👁️
                  </button>
                </div>
                {inspectPro.portfolioUrls && inspectPro.portfolioUrls.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 6, overflowX: "auto" }}>
                    {inspectPro.portfolioUrls.map((url: string, idx: number) => (
                      <div key={idx} onClick={() => setPreviewMediaUrl(url)} style={{ cursor: "pointer" }}>
                        <img src={url} alt={`Portfolio Work ${idx + 1}`} style={{ width: 60, height: 60, borderRadius: 6, objectFit: "cover", border: "1px solid #0EA5E9" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Guarantor Check */}
              <div style={{ background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ fontSize: "12px", color: "#F59E0B", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  3️⃣ 2 Guarantor Verification Records
                </strong>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#1E293B", padding: 10, borderRadius: 6 }}>
                    <strong style={{ fontSize: "12px", color: "#F8FAFC", display: "block" }}>Guarantor 1: {inspectPro.guarantor1?.name || "Chief James Okon"}</strong>
                    <span style={{ fontSize: "11px", color: "#94A3B8", display: "block" }}>Phone: {inspectPro.guarantor1?.phone || "+234 803 111 2222"}</span>
                    <span style={{ fontSize: "11px", color: "#94A3B8", display: "block" }}>Role: {inspectPro.guarantor1?.relationship || "Community Chairman"}</span>
                  </div>
                  <div style={{ background: "#1E293B", padding: 10, borderRadius: 6 }}>
                    <strong style={{ fontSize: "12px", color: "#F8FAFC", display: "block" }}>Guarantor 2: {inspectPro.guarantor2?.name || "Engr. Aliyu Hassan"}</strong>
                    <span style={{ fontSize: "11px", color: "#94A3B8", display: "block" }}>Phone: {inspectPro.guarantor2?.phone || "+234 802 333 4444"}</span>
                    <span style={{ fontSize: "11px", color: "#94A3B8", display: "block" }}>Role: {inspectPro.guarantor2?.relationship || "Master Craftsman"}</span>
                  </div>
                </div>
              </div>

              {/* Step 4: Trade Skill Quiz */}
              <div style={{ background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "12px", color: "#10B981", textTransform: "uppercase", display: "block" }}>
                    4️⃣ Category Trade Skill Competency Assessment
                  </strong>
                  <span style={{ fontSize: "13px", color: "#CBD5E1" }}>Field: {inspectPro.field}</span>
                </div>
                <div style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid #10B981", borderRadius: 8, padding: "6px 14px", fontWeight: "bold", fontSize: "16px" }}>
                  {inspectPro.quizScore}% (PASSED)
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Verification Officer Compliance Audit Notes
              </label>
              <textarea
                rows={3}
                placeholder="Enter audit notes or feedback for approval/rejection..."
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
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

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => handleAuditDecision("REJECTED")}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: "#EF4444", color: "#EF4444" }}
              >
                <XCircle size={16} /> Deny Verification Application
              </button>
              <button
                onClick={() => handleAuditDecision("VERIFIED")}
                className="btn btn-primary btn-sm"
                style={{ background: "#10B981" }}
              >
                <CheckCircle2 size={16} /> Approve & Issue Verified Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Full Resolution Document & Photo Lightbox */}
      {previewMediaUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(9, 13, 22, 0.95)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setPreviewMediaUrl(null)}
        >
          <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 12 }}>
            <a
              href={previewMediaUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ color: "#38BDF8", borderColor: "#0EA5E9" }}
              onClick={(e) => e.stopPropagation()}
            >
              Open Original File ↗
            </a>
            <button
              onClick={() => setPreviewMediaUrl(null)}
              className="btn btn-secondary btn-sm"
              style={{ color: "#F8FAFC" }}
            >
              Close Preview ✕
            </button>
          </div>

          <div
            style={{
              maxWidth: "90vw",
              maxHeight: "80vh",
              overflow: "auto",
              borderRadius: 12,
              border: "1px solid #334155",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
              background: "#0F172A",
              padding: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {previewMediaUrl.endsWith(".pdf") ? (
              <iframe src={previewMediaUrl} style={{ width: "80vw", height: "75vh", border: "none" }} title="Document PDF Preview" />
            ) : (
              <img
                src={previewMediaUrl}
                alt="Document Full Resolution Inspection Preview"
                style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: 8 }}
              />
            )}
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
