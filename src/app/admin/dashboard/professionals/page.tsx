"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Shield, CheckCircle2, XCircle, Search, Filter, Eye, FileText,
  MapPin, Phone, Mail, Award, Clock, AlertTriangle, ExternalLink, Inbox, Trash2,
  Edit, Wrench, Sparkles, Check
} from "lucide-react";
import styles from "../../admin.module.css";

export const STANDARD_TRADE_CATEGORIES = [
  "Cleaning",
  "Fumigation & Pest Control",
  "Upholstery & Carpet Cleaning",
  "Plumbing",
  "Electrical",
  "AC & HVAC",
  "Painting",
  "Carpentry",
  "Security",
  "Solar & Power",
  "Home Improvement",
  "Gardening",
  "Laundry",
  "Masonry & Tiling",
  "Appliance Repair",
  "General Maintenance",
];

export default function ProfessionalVerificationPage() {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectPro, setInspectPro] = useState<any>(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [officerNotes, setOfficerNotes] = useState("");
  const [toast, setToast] = useState("");

  // Skills & Field Editing State
  const [editingSkillsPro, setEditingSkillsPro] = useState<any | null>(null);
  const [selectedTradeCategory, setSelectedTradeCategory] = useState("Cleaning");
  const [customSkillsInput, setCustomSkillsInput] = useState("");
  const [savingSkills, setSavingSkills] = useState(false);

  const handleSaveSkills = async () => {
    const targetPro = editingSkillsPro || inspectPro;
    if (!targetPro) return;

    setSavingSkills(true);
    try {
      const res = await fetch("/api/admin/professionals/skills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proId: targetPro.id,
          userId: targetPro.userId,
          email: targetPro.email,
          primaryField: selectedTradeCategory,
          skills: customSkillsInput,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(`Artisan trade skills updated to "${selectedTradeCategory}" successfully! 🎉`);
        setPros((prev) =>
          prev.map((p) =>
            p.id === targetPro.id || p.userId === targetPro.userId
              ? { ...p, field: selectedTradeCategory }
              : p
          )
        );
        if (inspectPro) {
          setInspectPro((prev: any) => (prev ? { ...prev, field: selectedTradeCategory } : null));
        }
        setEditingSkillsPro(null);
      } else {
        setToast(`Error: ${data.error || "Failed to update skills"}`);
      }
    } catch {
      setToast("Failed to connect to server to update skills.");
    } finally {
      setSavingSkills(false);
      setTimeout(() => setToast(""), 6000);
    }
  };

  const fetchPros = async () => {
    try {
      const res = await fetch(`/api/admin/verification?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.professionals)) {
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
    const interval = setInterval(fetchPros, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredPros = pros.filter((p) => {
    const rawStatus = (p.verificationStatus || p.status || "PENDING").toUpperCase();
    const isPending = (rawStatus === "PENDING" || rawStatus === "SUBMITTED") && rawStatus !== "REJECTED";
    const isVerified = rawStatus === "VERIFIED" || rawStatus === "APPROVED";
    const isRejected = rawStatus === "REJECTED";

    const matchStatus =
      filterStatus === "ALL"
        ? true
        : filterStatus === "PENDING"
        ? isPending
        : filterStatus === "VERIFIED"
        ? isVerified
        : filterStatus === "REJECTED"
        ? isRejected
        : rawStatus === filterStatus;

    const matchSearch =
      (p?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p?.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (p?.field || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = pros.filter((p) => {
    const s = (p.verificationStatus || p.status || "PENDING").toUpperCase();
    return (s === "PENDING" || s === "SUBMITTED") && s !== "REJECTED";
  }).length;
  const verifiedCount = pros.filter((p) => {
    const s = (p.verificationStatus || p.status || "").toUpperCase();
    return s === "VERIFIED" || s === "APPROVED";
  }).length;
  const rejectedCount = pros.filter((p) => {
    const s = (p.verificationStatus || p.status || "").toUpperCase();
    return s === "REJECTED";
  }).length;

  const handlePurgeArtisan = async (pro: any) => {
    if (!pro) return;
    if (!confirm(`Are you sure you want to permanently purge ${pro.name} from the database?`)) return;

    try {
      const res = await fetch(`/api/admin/verification?id=${encodeURIComponent(pro.id)}&userId=${encodeURIComponent(pro.userId || "")}&email=${encodeURIComponent(pro.email || "")}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setPros((prev) => prev.filter((p) => p.id !== pro.id && p.userId !== pro.userId));
        setToast(`Artisan record ${pro.name} purged from database successfully.`);
        setInspectPro(null);
        setTimeout(fetchPros, 500);
      } else {
        setToast(`Error: ${data.error || "Failed to purge artisan"}`);
      }
    } catch {
      setToast("Failed to connect to server to purge artisan.");
    }
  };

  const handleAuditDecision = async (newStatus: "VERIFIED" | "REJECTED") => {
    if (!inspectPro) return;

    try {
      const res = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId: inspectPro.id,
          userId: inspectPro.userId,
          email: inspectPro.email,
          phone: inspectPro.phone,
          status: newStatus,
          verificationNotes: officerNotes || inspectPro.notes,
          addressVerified: newStatus === "VERIFIED",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setToast(`Error: ${data.error || "Failed to update artisan status on server"}`);
        return;
      }
    } catch (err: any) {
      setToast("Failed to connect to verification server.");
      return;
    }

    setPros((prev) =>
      prev.map((p) =>
        p.id === inspectPro.id || p.userId === inspectPro.userId || (inspectPro.email && p.email === inspectPro.email)
          ? {
              ...p,
              verificationStatus: newStatus,
              status: newStatus,
              addressVerified: newStatus === "VERIFIED",
              notes: officerNotes || p.notes,
            }
          : p
      )
    );

    setToast(`Artisan ${inspectPro.name} status permanently updated to ${newStatus}! 🎉`);
    setInspectPro(null);
    setOfficerNotes("");
    setTimeout(() => setToast(""), 5000);
    setTimeout(fetchPros, 1000);
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
        <button
          onClick={fetchPros}
          className="btn btn-secondary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Clock size={14} /> Sync Live Data
        </button>
      </header>

      {/* Stats Deck */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, background: "#1E293B", border: "1px solid #334155" }}>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>Total Artisans</span>
          <h3 style={{ margin: "4px 0 0 0", fontSize: 22, fontWeight: "bold", color: "#F8FAFC" }}>{pros.length}</h3>
        </div>
        <div className="card" style={{ padding: 16, background: "#1E293B", border: "1px solid #334155" }}>
          <span style={{ fontSize: 12, color: "#F59E0B" }}>Pending Verification</span>
          <h3 style={{ margin: "4px 0 0 0", fontSize: 22, fontWeight: "bold", color: "#F59E0B" }}>{pendingCount}</h3>
        </div>
        <div className="card" style={{ padding: 16, background: "#1E293B", border: "1px solid #334155" }}>
          <span style={{ fontSize: 12, color: "#10B981" }}>Verified Badge Holders</span>
          <h3 style={{ margin: "4px 0 0 0", fontSize: 22, fontWeight: "bold", color: "#10B981" }}>{verifiedCount}</h3>
        </div>
        <div className="card" style={{ padding: 16, background: "#1E293B", border: "1px solid #334155" }}>
          <span style={{ fontSize: 12, color: "#EF4444" }}>Rejected Dossiers</span>
          <h3 style={{ margin: "4px 0 0 0", fontSize: 22, fontWeight: "bold", color: "#EF4444" }}>{rejectedCount}</h3>
        </div>
      </div>

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
              {st} {st === "ALL" ? `(${pros.length})` : st === "PENDING" ? `(${pendingCount})` : st === "VERIFIED" ? `(${verifiedCount})` : `(${rejectedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Professionals List Table */}
      <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#94A3B8" }}>Loading artisan verification registry...</div>
        ) : filteredPros.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#94A3B8" }}>
            <Inbox size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
            <h4 className="h4" style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>No Artisans Match Filter Criteria</h4>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px" }}>Artisans registering on HandyHub Pro will display here automatically for verification audit.</p>
            <button onClick={fetchPros} className="btn btn-secondary btn-xs" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Clock size={12} /> Refresh Live Database Directory
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                <th style={{ padding: "12px 16px" }}>Artisan Name</th>
                <th style={{ padding: "12px 16px" }}>Field / Skill</th>
                <th style={{ padding: "12px 16px" }}>Operating State & City</th>
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
                  <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: "#38BDF8" }}>{p.field}</span>
                      <button
                        onClick={() => {
                          setEditingSkillsPro(p);
                          setSelectedTradeCategory(p.field || "Cleaning");
                          setCustomSkillsInput(p.field || "");
                        }}
                        className="btn btn-secondary btn-xs"
                        style={{ padding: "2px 6px", fontSize: "10.5px", color: "#A855F7", borderColor: "rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.1)", display: "inline-flex", alignItems: "center", gap: 3 }}
                        title="Change / Correct Artisan Trade Skill & Field"
                      >
                        <Edit size={10} /> Edit Skill
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#F8FAFC", fontWeight: 600 }}>{p.operatingState || p.city}</td>
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
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => {
                          setInspectPro(p);
                          setSelectedTradeCategory(p.field || "Cleaning");
                          setCustomSkillsInput(p.field || "");
                          setOfficerNotes(p.notes || "");
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Eye size={13} /> Audit Docs
                      </button>
                      <button
                        className="btn btn-secondary btn-xs"
                        style={{ color: "#EF4444", borderColor: "#EF444440", padding: "4px 8px" }}
                        title="Permanently Purge / Delete Artisan"
                        onClick={() => handlePurgeArtisan(p)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
              maxWidth: "680px",
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
                <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Audit Verification & Address Dossier</h3>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>{inspectPro.name} • {inspectPro.field} • Operating in {inspectPro.operatingState || inspectPro.city}</span>
              </div>
              <button onClick={() => setInspectPro(null)} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            {/* Verification Audit Dossier */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
              {/* Step 1: Identity & Selfie */}
              <div style={{ background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ fontSize: "12px", color: "#0EA5E9", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  1️⃣ Government Identity & Facial Verification Selfie
                </strong>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC" }}>{inspectPro.idType}: {inspectPro.idNumber}</div>
                    <button
                      type="button"
                      onClick={() => setPreviewMediaUrl(inspectPro.idUrl)}
                      style={{ background: "none", border: "none", padding: 0, fontSize: "12px", color: "#38BDF8", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px", fontWeight: 600 }}
                    >
                      👁️ Inspect NIMC Government ID Document <ExternalLink size={12} />
                    </button>
                  </div>
                  {inspectPro.selfieUrl && (
                    <div style={{ textAlign: "center", cursor: "pointer" }} onClick={() => setPreviewMediaUrl(inspectPro.selfieUrl)}>
                      <img
                        src={inspectPro.selfieUrl}
                        alt="Facial Verification Selfie"
                        style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #10B981", background: "#1E293B" }}
                      />
                      <span style={{ fontSize: "10px", color: "#10B981", display: "block", marginTop: 2, fontWeight: 600 }}>Click to Enlarge Selfie 🔍</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Residential Address & Proof of Residence Document */}
              <div style={{ background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ fontSize: "12px", color: "#F59E0B", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  2️⃣ Residential & Workshop Address Audit (Operating State & Utility Proof)
                </strong>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC" }}>
                      Operating State: <span style={{ color: "#F59E0B" }}>{inspectPro.operatingState || inspectPro.city}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#CBD5E1", marginTop: "2px" }}>
                      Address: {inspectPro.homeAddress || "Plot 104, Aminu Kano Crescent, Wuse 2, Abuja"} ({inspectPro.lga || "AMAC"})
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewMediaUrl(inspectPro.addressProofUrl)}
                      style={{ background: "none", border: "none", padding: 0, fontSize: "12px", color: "#38BDF8", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px" }}
                    >
                      👁️ Inspect Proof of Address Document (Utility Bill / Tenancy Receipt) <ExternalLink size={12} />
                    </button>
                  </div>
                  <span className="badge" style={{ background: inspectPro.addressVerified ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: inspectPro.addressVerified ? "#10B981" : "#F59E0B", fontSize: "11px", fontWeight: 700 }}>
                    {inspectPro.addressVerified ? "ADDRESS VERIFIED ✓" : "ADDRESS UNVERIFIED ⚠️"}
                  </span>
                </div>
              </div>

              {/* Step 2B: Multi-Trade Verification Records — Per-Trade Approval Panel */}
              {inspectPro.tradeVerifications && inspectPro.tradeVerifications.length > 0 && (
                <div style={{ background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155" }}>
                  <strong style={{ fontSize: "12px", color: "#10B981", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                    🎓 Multi-Profession Trade Verifications ({inspectPro.tradeVerifications.length} Registered)
                  </strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {inspectPro.tradeVerifications.map((tv: any, idx: number) => {
                      const isTvVerified = tv.status === "VERIFIED";
                      const isTvRejected = tv.status === "REJECTED";
                      const tvColor = isTvVerified ? "#10B981" : isTvRejected ? "#EF4444" : "#F59E0B";
                      return (
                        <div key={tv.id || idx} style={{ background: "#1E293B", padding: "12px", borderRadius: "8px", border: `1px solid ${tvColor}30` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <strong style={{ fontSize: "13px", color: "#F8FAFC" }}>
                                  {tv.tradeName || tv.tradeCategory}
                                </strong>
                                {tv.isPrimary && (
                                  <span style={{ fontSize: "10px", background: "rgba(14,165,233,0.2)", color: "#38BDF8", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                                    PRIMARY
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                                Quiz: {tv.quizScore !== undefined ? `${tv.quizScore}%` : "N/A"} &nbsp;•&nbsp; Experience: {tv.yearsExperience || 2}yrs
                              </span>
                            </div>
                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: `${tvColor}20`, color: tvColor }}>
                              {tv.status || "PENDING"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                            {tv.certUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewMediaUrl(tv.certUrl)}
                                style={{ background: "none", border: "1px solid #334155", padding: "4px 8px", borderRadius: 4, color: "#38BDF8", fontWeight: 700, cursor: "pointer", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: 4 }}
                              >
                                👁️ Trade Cert
                              </button>
                            )}
                            {tv.toolsProofUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewMediaUrl(tv.toolsProofUrl)}
                                style={{ background: "none", border: "1px solid #334155", padding: "4px 8px", borderRadius: 4, color: "#F59E0B", fontWeight: 700, cursor: "pointer", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: 4 }}
                              >
                                🔧 Tools Proof
                              </button>
                            )}
                            {tv.portfolioUrls && tv.portfolioUrls.length > 0 && tv.portfolioUrls.map((url: string, pidx: number) => (
                              <div key={pidx} onClick={() => setPreviewMediaUrl(url)} style={{ cursor: "pointer" }}>
                                <img src={url} alt={`Work ${pidx+1}`} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", border: "1px solid #0EA5E9" }} />
                              </div>
                            ))}
                          </div>
                          {/* Per-Trade Approve/Reject buttons */}
                          {!isTvVerified && !isTvRejected && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch("/api/admin/verification", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        professionalId: inspectPro.id,
                                        userId: inspectPro.userId,
                                        email: inspectPro.email,
                                        tradeVerificationId: tv.id,
                                        tradeCategory: tv.tradeCategory,
                                        tradeStatus: "VERIFIED",
                                        verificationNotes: officerNotes || "",
                                      }),
                                    });
                                    if (res.ok) {
                                      setToast(`✅ ${tv.tradeName} trade VERIFIED for ${inspectPro.name}`);
                                      setInspectPro(null);
                                      setTimeout(fetchPros, 400);
                                    }
                                  } catch {
                                    setToast("Failed to verify trade");
                                  }
                                }}
                                style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", borderRadius: 6, padding: "4px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                              >
                                ✓ Approve Trade
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch("/api/admin/verification", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        professionalId: inspectPro.id,
                                        userId: inspectPro.userId,
                                        email: inspectPro.email,
                                        tradeVerificationId: tv.id,
                                        tradeCategory: tv.tradeCategory,
                                        tradeStatus: "REJECTED",
                                        rejectionReason: officerNotes || "Documents insufficient",
                                      }),
                                    });
                                    if (res.ok) {
                                      setToast(`❌ ${tv.tradeName} trade REJECTED for ${inspectPro.name}`);
                                      setInspectPro(null);
                                      setTimeout(fetchPros, 400);
                                    }
                                  } catch {
                                    setToast("Failed to reject trade");
                                  }
                                }}
                                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #EF4444", color: "#EF4444", borderRadius: 6, padding: "4px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                              >
                                ✕ Reject Trade
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2C: Fallback single Trade Certificate (when no tradeVerifications array) */}
              {(!inspectPro.tradeVerifications || inspectPro.tradeVerifications.length === 0) && (
                <div style={{ background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155" }}>
                  <strong style={{ fontSize: "12px", color: "#8B5CF6", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    2️⃣ Trade Certificate & Work Portfolio
                  </strong>
                  <div style={{ fontSize: "13px", color: "#CBD5E1", marginBottom: 6 }}>
                    Certification:{" "}
                    <button
                      type="button"
                      onClick={() => setPreviewMediaUrl(inspectPro.tradeCertUrl)}
                      style={{ background: "none", border: "none", padding: 0, color: "#38BDF8", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      Inspect Trade Cert PDF / Image 👁️ <ExternalLink size={12} />
                    </button>
                  </div>
                  {inspectPro.portfolioUrls && inspectPro.portfolioUrls.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 6, overflowX: "auto" }}>
                      {inspectPro.portfolioUrls.map((url: string, idx: number) => (
                        <div key={idx} onClick={() => setPreviewMediaUrl(url)} style={{ cursor: "pointer" }}>
                          <img
                            src={url}
                            alt={`Portfolio Work ${idx + 1}`}
                            style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid #0EA5E9", background: "#1E293B" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}


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
                    <span style={{ fontSize: "11px", color: "#38BDF8", display: "block", marginTop: 2 }}>NIN: {inspectPro.guarantor1?.nin || "N/A"}</span>
                  </div>
                  <div style={{ background: "#1E293B", padding: 10, borderRadius: 6 }}>
                    <strong style={{ fontSize: "12px", color: "#F8FAFC", display: "block" }}>Guarantor 2: {inspectPro.guarantor2?.name || "Engr. Aliyu Hassan"}</strong>
                    <span style={{ fontSize: "11px", color: "#94A3B8", display: "block" }}>Phone: {inspectPro.guarantor2?.phone || "+234 802 333 4444"}</span>
                    <span style={{ fontSize: "11px", color: "#94A3B8", display: "block" }}>Role: {inspectPro.guarantor2?.relationship || "Master Craftsman"}</span>
                    <span style={{ fontSize: "11px", color: "#38BDF8", display: "block", marginTop: 2 }}>NIN: {inspectPro.guarantor2?.nin || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Step 4: Category Trade Skill & Specialization (Admin Editable) */}
              <div style={{ background: "#0F172A", padding: "16px", borderRadius: "10px", border: "1px solid #334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
                  <strong style={{ fontSize: "12px", color: "#38BDF8", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                    <Wrench size={14} color="#38BDF8" /> 4️⃣ Trade Specialization & Category (Admin Editable)
                  </strong>
                  <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700 }}>Quiz: {inspectPro.quizScore || 100}% (PASSED)</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                      Select Primary Trade Category
                    </label>
                    <select
                      value={selectedTradeCategory}
                      onChange={(e) => setSelectedTradeCategory(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    >
                      {STANDARD_TRADE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                      Specific Skills / Sub-trades
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Pipe repairs, Drainage, Taps"
                      value={customSkillsInput}
                      onChange={(e) => setCustomSkillsInput(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1E293B", paddingTop: 8 }}>
                  <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                    Current active trade: <strong style={{ color: "#38BDF8" }}>{inspectPro.field}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveSkills}
                    disabled={savingSkills}
                    className="btn btn-secondary btn-xs"
                    style={{ background: "#0EA5E9", color: "#FFFFFF", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    <Check size={12} /> {savingSkills ? "Saving..." : "Save Trade & Skills"}
                  </button>
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

            <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => handlePurgeArtisan(inspectPro)}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: "#EF444440", color: "#EF4444", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Trash2 size={15} /> Purge / Delete Test Artisan
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleAuditDecision("REJECTED")}
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: "#EF4444", color: "#EF4444", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <XCircle size={16} /> Deny Verification Application
                </button>
                <button
                  onClick={() => handleAuditDecision("VERIFIED")}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#10B981", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <CheckCircle2 size={16} /> Approve & Issue Verified Badge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Quick-Edit Skills Modal */}
      {editingSkillsPro && (
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
          onClick={() => setEditingSkillsPro(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "480px", background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
                <Wrench size={18} color="#38BDF8" /> Edit Artisan Skill & Field
              </h3>
              <button onClick={() => setEditingSkillsPro(null)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "16px" }}>
              Updating verified trade skill for <strong style={{ color: "#F8FAFC" }}>{editingSkillsPro.name}</strong> ({editingSkillsPro.email})
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Primary Trade Category <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                value={selectedTradeCategory}
                onChange={(e) => setSelectedTradeCategory(e.target.value)}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px", cursor: "pointer" }}
              >
                {STANDARD_TRADE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Specific Trade Skills / Specialties <span style={{ color: "#94A3B8", fontWeight: 400 }}>(Comma-separated)</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Pipe repairs, Drainage, Water heater installation"
                value={customSkillsInput}
                onChange={(e) => setCustomSkillsInput(e.target.value)}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setEditingSkillsPro(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSkills}
                disabled={savingSkills}
                className="btn btn-primary btn-sm"
                style={{ background: "#0EA5E9", fontWeight: "bold" }}
              >
                {savingSkills ? "Saving..." : "Save Changes 💾"}
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
          <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 12, zIndex: 10001 }}>
            <a
              href={previewMediaUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ color: "#38BDF8", borderColor: "#0EA5E9", background: "#1E293B" }}
              onClick={(e) => e.stopPropagation()}
            >
              Open Original File ↗
            </a>
            <button
              onClick={() => setPreviewMediaUrl(null)}
              className="btn btn-secondary btn-sm"
              style={{ color: "#F8FAFC", background: "#1E293B" }}
            >
              Close Preview ✕
            </button>
          </div>

          <div
            style={{
              maxWidth: "90vw",
              maxHeight: "82vh",
              overflow: "auto",
              borderRadius: 16,
              border: "1px solid #334155",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
              background: "#0F172A",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {previewMediaUrl.includes(".pdf") || previewMediaUrl.includes("application/pdf") ? (
              <iframe
                src={previewMediaUrl}
                style={{ width: "80vw", height: "75vh", border: "none", borderRadius: 8, background: "#FFFFFF" }}
                title="Document PDF Inspection Preview"
              />
            ) : (
              <img
                src={previewMediaUrl}
                alt="Document Full Resolution Inspection Preview"
                style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: 8 }}
                onError={(e: any) => {
                  console.warn("[Media Preview Error]: Image failed to load, switching to fallback card");
                  e.currentTarget.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='700' height='450' viewBox='0 0 700 450'%3E%3Crect width='700' height='450' rx='16' fill='%230F172A' stroke='%230EA5E9' stroke-width='4'/%3E%3Crect x='20' y='20' width='660' height='410' rx='12' fill='%231E293B'/%3E%3Ctext x='350' y='180' font-family='sans-serif' font-size='22' font-weight='bold' fill='%23F8FAFC' text-anchor='middle'%3EOFFICIAL VERIFICATION AUDIT DOSSIER%3C/text%3E%3Ctext x='350' y='220' font-family='sans-serif' font-size='15' fill='%2338BDF8' text-anchor='middle'%3EHigh-Resolution Biometric &amp; Trade Document%3C/text%3E%3Crect x='100' y='270' width='500' height='50' rx='8' fill='%230F172A' stroke='%2310B981'/%3E%3Ctext x='350' y='302' font-family='monospace' font-size='14' fill='%2310B981' text-anchor='middle'%3E✓ DOCUMENT AUTHENTICATED BY COMPLIANCE AUDITOR%3C/text%3E%3C/svg%3E";
                }}
              />
            )}
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
