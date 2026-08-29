"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Shield, CheckCircle2, XCircle, Search, Filter, Eye, FileText,
  MapPin, Phone, Mail, Award, Clock, AlertTriangle, ExternalLink, Inbox, Trash2,
  Edit, Wrench, Sparkles, Check, Save, User, ShieldCheck, UserCheck, CheckCircle
} from "lucide-react";
import { MASTER_TRADE_CATEGORIES, normalizeTradeSlug, getTradeCategoryLabel } from "@/lib/trade-categories";
import { useActiveStates } from "@/hooks/useActiveStates";
import styles from "../../admin.module.css";

export const GUARANTOR_ROLE_OPTIONS = [
  "Landlord / Property Owner",
  "Community Leader / Village Head / CDA Chairman",
  "Former Employer / Work Supervisor",
  "Master Craftsman / Apprenticeship Mentor",
  "Religious Leader / Clergy (Pastor / Imam)",
  "Civil Servant / Public Officer",
  "Family Head / Elder / Relative",
  "Senior Colleague / Registered Professional",
  "Other / Custom Role",
];

export default function ProfessionalVerificationPage() {
  const { activeStates } = useActiveStates();
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectPro, setInspectPro] = useState<any>(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  // Full Manual Audit Dossier Editing State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editIdType, setEditIdType] = useState("NIN");
  const [editIdNumber, setEditIdNumber] = useState("");
  const [editNinStatus, setEditNinStatus] = useState("PENDING");
  const [editOperatingState, setEditOperatingState] = useState("FCT Abuja");
  const [editLga, setEditLga] = useState("AMAC");
  const [editHomeAddress, setEditHomeAddress] = useState("");
  const [editAddressStatus, setEditAddressStatus] = useState("PENDING");
  const [editGuarantor1, setEditGuarantor1] = useState<any>({ name: "", phone: "", relationship: "Landlord / Property Owner", nin: "" });
  const [editGuarantor2, setEditGuarantor2] = useState<any>({ name: "", phone: "", relationship: "Master Craftsman / Apprenticeship Mentor", nin: "" });
  const [editPrimaryTrade, setEditPrimaryTrade] = useState("cleaning");
  const [editSecondaryTrade, setEditSecondaryTrade] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editQuizScore, setEditQuizScore] = useState<number>(85);
  const [editVerificationStatus, setEditVerificationStatus] = useState("PENDING");
  const [editOfficerNotes, setEditOfficerNotes] = useState("");
  const [savingDossier, setSavingDossier] = useState(false);

  // Open Modal and populate all state variables from artisan record
  const openInspectModal = (p: any) => {
    setInspectPro(p);
    setEditName(p.name || "");
    setEditEmail(p.email || "");
    setEditPhone(p.phone || "");
    setEditIdType(p.idType || "NIN");
    setEditIdNumber(p.idNumber || "");
    setEditNinStatus((p.ninStatus || (p.verificationStatus === "VERIFIED" ? "VERIFIED" : "PENDING")).toUpperCase());
    setEditOperatingState(p.operatingState || p.city || "FCT Abuja");
    setEditLga(p.lga || "AMAC");
    setEditHomeAddress(p.homeAddress || "");
    setEditAddressStatus(p.addressVerified || p.verificationStatus === "VERIFIED" ? "VERIFIED" : "PENDING");
    
    setEditGuarantor1(p.guarantor1 ? {
      name: p.guarantor1.name || "",
      phone: p.guarantor1.phone || "",
      relationship: p.guarantor1.relationship || "Landlord / Property Owner",
      nin: p.guarantor1.nin || "",
    } : { name: "", phone: "", relationship: "Landlord / Property Owner", nin: "" });

    setEditGuarantor2(p.guarantor2 ? {
      name: p.guarantor2.name || "",
      phone: p.guarantor2.phone || "",
      relationship: p.guarantor2.relationship || "Master Craftsman / Apprenticeship Mentor",
      nin: p.guarantor2.nin || "",
    } : { name: "", phone: "", relationship: "Master Craftsman / Apprenticeship Mentor", nin: "" });

    // Robust normalized trade selection - avoids defaulting to cleaning
    const primarySlug = normalizeTradeSlug(p.primaryField || p.field || p.serviceCategory || "cleaning");
    const secondarySlug = p.secondaryField || p.secondaryCategory ? normalizeTradeSlug(p.secondaryField || p.secondaryCategory) : "";

    setEditPrimaryTrade(primarySlug);
    setEditSecondaryTrade(secondarySlug);
    setEditSkills(Array.isArray(p.skills) ? p.skills.join(", ") : p.field || "");
    setEditQuizScore(p.quizScore !== undefined ? Number(p.quizScore) : 85);
    setEditVerificationStatus(p.verificationStatus || "PENDING");
    setEditOfficerNotes(p.notes || p.verificationNotes || "Approved by Admin Compliance Team");
  };

  const handleSaveFullDossier = async () => {
    if (!inspectPro) return;
    setSavingDossier(true);

    try {
      const res = await fetch("/api/admin/verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proId: inspectPro.id,
          userId: inspectPro.userId,
          name: editName,
          email: editEmail,
          phone: editPhone,
          idType: editIdType,
          idNumber: editIdNumber,
          ninStatus: editNinStatus,
          operatingState: editOperatingState,
          lga: editLga,
          homeAddress: editHomeAddress,
          addressStatus: editAddressStatus,
          guarantor1: editGuarantor1,
          guarantor2: editGuarantor2,
          primaryField: editPrimaryTrade,
          secondaryField: editSecondaryTrade,
          skills: editSkills,
          quizScore: Number(editQuizScore),
          verificationStatus: editVerificationStatus,
          verificationNotes: editOfficerNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(`Artisan dossier for ${editName} saved & updated successfully! 🎉`);
        setPros((prev) =>
          prev.map((p) =>
            p.id === inspectPro.id || p.userId === inspectPro.userId
              ? {
                  ...p,
                  name: editName,
                  email: editEmail,
                  phone: editPhone,
                  field: getTradeCategoryLabel(editPrimaryTrade),
                  primaryField: editPrimaryTrade,
                  secondaryField: editSecondaryTrade,
                  operatingState: editOperatingState,
                  city: editOperatingState,
                  homeAddress: editHomeAddress,
                  lga: editLga,
                  idType: editIdType,
                  idNumber: editIdNumber,
                  verificationStatus: editVerificationStatus,
                  addressVerified: editAddressStatus === "VERIFIED",
                  guarantor1: editGuarantor1,
                  guarantor2: editGuarantor2,
                  quizScore: editQuizScore,
                  notes: editOfficerNotes,
                }
              : p
          )
        );
        setInspectPro((prev: any) =>
          prev
            ? {
                ...prev,
                name: editName,
                field: getTradeCategoryLabel(editPrimaryTrade),
                verificationStatus: editVerificationStatus,
              }
            : null
        );
      } else {
        setToast(`Error: ${data.error || "Failed to update audit dossier"}`);
      }
    } catch {
      setToast("Failed to connect to server to save dossier.");
    } finally {
      setSavingDossier(false);
      setTimeout(() => setToast(""), 6000);
    }
  };

  const handleDecision = async (status: "VERIFIED" | "REJECTED") => {
    if (!inspectPro) return;
    setSavingDossier(true);

    try {
      const res = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId: inspectPro.id,
          userId: inspectPro.userId,
          email: inspectPro.email,
          status,
          verificationNotes: editOfficerNotes || (status === "VERIFIED" ? "Approved by Admin Compliance Team" : "Rejected by Admin Compliance Team"),
          skills: editSkills || editPrimaryTrade,
          field: editPrimaryTrade,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(`Artisan application ${status === "VERIFIED" ? "APPROVED & Verified" : "REJECTED"} successfully!`);
        setPros((prev) =>
          prev.map((p) =>
            p.id === inspectPro.id || p.userId === inspectPro.userId
              ? { ...p, verificationStatus: status, status }
              : p
          )
        );
        setInspectPro(null);
        setTimeout(fetchPros, 500);
      } else {
        setToast(`Error: ${data.error || "Failed to update verification status"}`);
      }
    } catch {
      setToast("Failed to connect to server.");
    } finally {
      setSavingDossier(false);
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
    const rawStatus = (p.verificationStatus || p.status || "").toUpperCase();
    const isVerified = rawStatus === "VERIFIED" || rawStatus === "APPROVED";
    const isRejected = rawStatus === "REJECTED";
    const isPending = !isVerified && !isRejected;
    const isOnline = Boolean(p.isAvailable);

    const matchStatus =
      filterStatus === "ALL"
        ? true
        : filterStatus === "ONLINE"
        ? isOnline
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

  const onlineCount = pros.filter((p) => Boolean(p.isAvailable)).length;
  const pendingCount = pros.filter((p) => {
    const s = (p.verificationStatus || p.status || "").toUpperCase();
    return s !== "VERIFIED" && s !== "APPROVED" && s !== "REJECTED";
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

  const handleToggleProAvailability = async (pro: any) => {
    const newAvail = !pro.isAvailable;
    try {
      const res = await fetch("/api/pro/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: pro.userId,
          isAvailable: newAvail,
        }),
      });
      if (res.ok) {
        setPros((prev) =>
          prev.map((p) => (p.id === pro.id ? { ...p, isAvailable: newAvail } : p))
        );
        setToast(`Artisan ${pro.name} set to ${newAvail ? "ONLINE" : "OFFLINE"}`);
      }
    } catch {
      setToast("Failed to toggle availability");
    }
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Artisan 5-Pillar Verification & Compliance Registry</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Review NIMC government identity, live biometric selfies, address tenancy proofs, trade credentials, and guarantors with full Super Admin manual configuration control.
          </p>
        </div>
      </header>

      {toast && (
        <div style={{ background: "#065F46", color: "#ECFDF5", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontWeight: "bold", border: "1px solid #059669", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{toast}</span>
          <button onClick={() => setToast("")} style={{ background: "none", border: "none", color: "#ECFDF5", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Metric Counters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "var(--space-6)" }}>
        <div
          onClick={() => setFilterStatus("ALL")}
          style={{
            background: "#1E293B",
            borderRadius: "12px",
            padding: "18px",
            cursor: "pointer",
            border: filterStatus === "ALL" ? "2px solid #38BDF8" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
          }}
        >
          <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Total Artisans</span>
          <h3 className="h3" style={{ margin: "6px 0", color: "#F8FAFC" }}>{pros.length}</h3>
          <span style={{ fontSize: "11px", color: "#38BDF8" }}>Active registered registry</span>
        </div>

        <div
          onClick={() => setFilterStatus("ONLINE")}
          style={{
            background: "#1E293B",
            borderRadius: "12px",
            padding: "18px",
            cursor: "pointer",
            border: filterStatus === "ONLINE" ? "2px solid #10B981" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
          }}
        >
          <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Online &amp; Available</span>
          <h3 className="h3" style={{ margin: "6px 0", color: "#10B981" }}>{onlineCount}</h3>
          <span style={{ fontSize: "11px", color: "#10B981" }}>Ready for live dispatch</span>
        </div>

        <div
          onClick={() => setFilterStatus("PENDING")}
          style={{
            background: "#1E293B",
            borderRadius: "12px",
            padding: "18px",
            cursor: "pointer",
            border: filterStatus === "PENDING" ? "2px solid #F59E0B" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
          }}
        >
          <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Pending Review</span>
          <h3 className="h3" style={{ margin: "6px 0", color: "#F59E0B" }}>{pendingCount}</h3>
          <span style={{ fontSize: "11px", color: "#F59E0B" }}>Awaiting audit decision</span>
        </div>

        <div
          onClick={() => setFilterStatus("VERIFIED")}
          style={{
            background: "#1E293B",
            borderRadius: "12px",
            padding: "18px",
            cursor: "pointer",
            border: filterStatus === "VERIFIED" ? "2px solid #10B981" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
          }}
        >
          <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Fully Verified</span>
          <h3 className="h3" style={{ margin: "6px 0", color: "#10B981" }}>{verifiedCount}</h3>
          <span style={{ fontSize: "11px", color: "#10B981" }}>Badge issued &amp; active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: "#1E293B", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", marginBottom: "var(--space-6)", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["ALL", "PENDING", "VERIFIED", "REJECTED", "ONLINE"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`btn btn-xs ${filterStatus === status ? "btn-primary" : "btn-secondary"}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search by name, email, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: "8px", background: "#0F172A", border: "1px solid #334155", color: "#F8FAFC", fontSize: "13px" }}
          />
        </div>
      </div>

      {/* Table of Professionals */}
      <div style={{ background: "#1E293B", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", overflowX: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
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
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Artisan Name</th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Online Status</th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Primary Trade</th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Operating State</th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Govt ID Check</th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Address Check</th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Compliance Status</th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Audit Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPros.map((p, idx) => (
                <tr key={p.id} style={{ background: idx % 2 === 0 ? "#1E293B" : "#162032", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <strong style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 700, display: "block" }}>{p.name}</strong>
                    <span style={{ fontSize: "12px", color: "#94A3B8", display: "block", marginTop: 2 }}>{p.phone}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => handleToggleProAvailability(p)}
                      style={{
                        background: p.isAvailable ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                        border: `1px solid ${p.isAvailable ? "rgba(16,185,129,0.4)" : "rgba(100,116,139,0.4)"}`,
                        color: p.isAvailable ? "#10B981" : "#94A3B8",
                        borderRadius: "20px",
                        padding: "4px 12px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      title="Click to toggle artisan availability"
                    >
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.isAvailable ? "#10B981" : "#64748B", boxShadow: p.isAvailable ? "0 0 6px #10B981" : "none" }} />
                      {p.isAvailable ? "ONLINE" : "OFFLINE"}
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontWeight: 700, color: "#38BDF8", fontSize: "13px", display: "block" }}>{getTradeCategoryLabel(p.field)}</span>
                    {p.secondaryField && (
                      <span style={{ display: "block", fontSize: "11px", color: "#94A3B8", marginTop: 2 }}>
                        + {getTradeCategoryLabel(p.secondaryField)}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#F8FAFC", fontWeight: 600 }}>{p.operatingState || p.city}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#38BDF8", background: "rgba(56, 189, 248, 0.12)", padding: "3px 8px", borderRadius: "4px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                      {p.idType} ({p.idNumber || "Not Provided"})
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: p.addressVerified ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: p.addressVerified ? "#10B981" : "#F59E0B", border: `1px solid ${p.addressVerified ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"}`, padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                      {p.addressVerified ? "VERIFIED ✓" : "PENDING ⏳"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        background: p.verificationStatus === "VERIFIED" ? "rgba(16,185,129,0.15)" : p.verificationStatus === "REJECTED" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                        color: p.verificationStatus === "VERIFIED" ? "#10B981" : p.verificationStatus === "REJECTED" ? "#EF4444" : "#F59E0B",
                        border: `1px solid ${p.verificationStatus === "VERIFIED" ? "rgba(16,185,129,0.4)" : p.verificationStatus === "REJECTED" ? "rgba(239,68,68,0.4)" : "rgba(245,158,11,0.4)"}`,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {p.verificationStatus}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => openInspectModal(p)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}
                      >
                        <Eye size={12} /> Audit Dossier
                      </button>
                      <button
                        onClick={() => handlePurgeArtisan(p)}
                        className="btn btn-secondary btn-xs"
                        style={{ color: "#EF4444", borderColor: "rgba(239,68,68,0.4)" }}
                        title="Purge artisan test record"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SUPER ADMIN AUDIT DOSSIER CONFIGURATION MODAL */}
      {inspectPro && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setInspectPro(null)}
        >
          <div
            style={{
              background: "#1E293B",
              border: "1px solid #38BDF8",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "920px",
              maxHeight: "92vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "14px", marginBottom: "18px" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 8px", background: "rgba(56, 189, 248, 0.15)", borderRadius: "6px", color: "#38BDF8", fontSize: "11px", fontWeight: 700, marginBottom: 4 }}>
                  <ShieldCheck size={13} /> Super Admin Audit &amp; Configuration Center
                </div>
                <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Artisan Compliance Dossier &amp; Manual Controls</h3>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Applicant: <strong>{editName}</strong> &bull; {editEmail} &bull; ID: {inspectPro.digitalId || inspectPro.id}
                </span>
              </div>
              <button onClick={() => setInspectPro(null)} style={{ background: "transparent", border: "none", color: "#94A3B8", fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>

            {/* Editable Dossier Container */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>

              {/* 1. Identity, Name & NIMC Government ID Section */}
              <div style={{ background: "#0F172A", padding: "16px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ fontSize: "12px", color: "#0EA5E9", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <User size={14} color="#0EA5E9" /> 1️⃣ Government Identity, Contact &amp; Biometrics (Admin Editable)
                </strong>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "12px", marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Phone Number</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "12px", marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>ID Document Type</label>
                    <select
                      value={editIdType}
                      onChange={(e) => setEditIdType(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    >
                      <option value="NIN">National Identity Number (NIN)</option>
                      <option value="DRIVERS_LICENSE">FRSC Driver&apos;s License</option>
                      <option value="VOTERS_CARD">INEC Voter&apos;s Card</option>
                      <option value="PASSPORT">International Passport</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>ID Number / 11-Digit NIN</label>
                    <input
                      type="text"
                      value={editIdNumber}
                      onChange={(e) => setEditIdNumber(e.target.value)}
                      placeholder="e.g. 99657332775"
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px", fontFamily: "monospace" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>NIN Check Status</label>
                    <select
                      value={editNinStatus}
                      onChange={(e) => setEditNinStatus(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: editNinStatus === "VERIFIED" ? "#10B981" : "#F59E0B", fontSize: "13px", fontWeight: 700 }}
                    >
                      <option value="VERIFIED">VERIFIED ✓</option>
                      <option value="PENDING">PENDING REVIEW ⏳</option>
                      <option value="REJECTED">REJECTED ✕</option>
                    </select>
                  </div>
                </div>

                {/* Media Preview Links */}
                <div style={{ display: "flex", gap: 16, alignItems: "center", borderTop: "1px solid #334155", paddingTop: 10, flexWrap: "wrap" }}>
                  {inspectPro.idUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewMediaUrl(inspectPro.idUrl)}
                      style={{ background: "none", border: "none", color: "#38BDF8", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}
                    >
                      👁️ View Uploaded ID Document <ExternalLink size={12} />
                    </button>
                  ) : (
                    <span style={{ color: "#EF4444", fontSize: "12px" }}>⚠️ No ID document attached</span>
                  )}

                  {inspectPro.selfieUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewMediaUrl(inspectPro.selfieUrl)}
                      style={{ background: "none", border: "none", color: "#10B981", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}
                    >
                      📷 View Biometric Selfie <ExternalLink size={12} />
                    </button>
                  ) : (
                    <span style={{ color: "#EF4444", fontSize: "12px" }}>⚠️ No selfie attached</span>
                  )}
                </div>
              </div>

              {/* 2. Residential & Workshop Address Dossier */}
              <div style={{ background: "#0F172A", padding: "16px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ fontSize: "12px", color: "#F59E0B", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <MapPin size={14} color="#F59E0B" /> 2️⃣ Residential &amp; Workshop Address Dossier (Admin Editable)
                </strong>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Operating State</label>
                    <select
                      value={editOperatingState}
                      onChange={(e) => setEditOperatingState(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    >
                      {activeStates.map((st) => (
                        <option key={st.code} value={st.name}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>LGA / Corridor</label>
                    <input
                      type="text"
                      value={editLga}
                      onChange={(e) => setEditLga(e.target.value)}
                      placeholder="e.g. AMAC, Ikeja, Bodija"
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Address Status</label>
                    <select
                      value={editAddressStatus}
                      onChange={(e) => setEditAddressStatus(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: editAddressStatus === "VERIFIED" ? "#10B981" : "#F59E0B", fontSize: "13px", fontWeight: 700 }}
                    >
                      <option value="VERIFIED">VERIFIED ✓</option>
                      <option value="PENDING">PENDING REVIEW ⏳</option>
                      <option value="REJECTED">REJECTED ✕</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Full Residential / Workshop Street Address</label>
                  <input
                    type="text"
                    value={editHomeAddress}
                    onChange={(e) => setEditHomeAddress(e.target.value)}
                    placeholder="e.g. Plot 104, Aminu Kano Crescent, Wuse 2, Abuja"
                    style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                  />
                </div>

                {inspectPro.addressProofUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewMediaUrl(inspectPro.addressProofUrl)}
                    style={{ background: "none", border: "none", color: "#38BDF8", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}
                  >
                    👁️ Inspect Utility Bill / Tenancy Receipt <ExternalLink size={12} />
                  </button>
                )}
              </div>

              {/* 3. Guarantor 1 & Guarantor 2 Records */}
              <div style={{ background: "#0F172A", padding: "16px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ fontSize: "12px", color: "#F59E0B", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <UserCheck size={14} color="#F59E0B" /> 3️⃣ 2 Guarantor Verification Records (Admin Editable)
                </strong>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {/* Guarantor 1 */}
                  <div style={{ background: "#1E293B", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#38BDF8", display: "block", marginBottom: 8 }}>Guarantor #1</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Guarantor 1 Full Name"
                        value={editGuarantor1.name || ""}
                        onChange={(e) => setEditGuarantor1({ ...editGuarantor1, name: e.target.value })}
                        style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "6px", padding: "6px 10px", color: "#F8FAFC", fontSize: "12px" }}
                      />
                      <input
                        type="tel"
                        placeholder="Guarantor 1 Phone (11 digits)"
                        value={editGuarantor1.phone || ""}
                        onChange={(e) => setEditGuarantor1({ ...editGuarantor1, phone: e.target.value })}
                        style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "6px", padding: "6px 10px", color: "#F8FAFC", fontSize: "12px" }}
                      />
                      <select
                        value={editGuarantor1.relationship || "Landlord / Property Owner"}
                        onChange={(e) => setEditGuarantor1({ ...editGuarantor1, relationship: e.target.value })}
                        style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "6px", padding: "6px 10px", color: "#F8FAFC", fontSize: "12px" }}
                      >
                        {GUARANTOR_ROLE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Guarantor 1 NIN (11 digits)"
                        value={editGuarantor1.nin || ""}
                        onChange={(e) => setEditGuarantor1({ ...editGuarantor1, nin: e.target.value })}
                        style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "6px", padding: "6px 10px", color: "#F8FAFC", fontSize: "12px", fontFamily: "monospace" }}
                      />
                    </div>
                  </div>

                  {/* Guarantor 2 */}
                  <div style={{ background: "#1E293B", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#38BDF8", display: "block", marginBottom: 8 }}>Guarantor #2</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Guarantor 2 Full Name"
                        value={editGuarantor2.name || ""}
                        onChange={(e) => setEditGuarantor2({ ...editGuarantor2, name: e.target.value })}
                        style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "6px", padding: "6px 10px", color: "#F8FAFC", fontSize: "12px" }}
                      />
                      <input
                        type="tel"
                        placeholder="Guarantor 2 Phone (11 digits)"
                        value={editGuarantor2.phone || ""}
                        onChange={(e) => setEditGuarantor2({ ...editGuarantor2, phone: e.target.value })}
                        style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "6px", padding: "6px 10px", color: "#F8FAFC", fontSize: "12px" }}
                      />
                      <select
                        value={editGuarantor2.relationship || "Master Craftsman / Apprenticeship Mentor"}
                        onChange={(e) => setEditGuarantor2({ ...editGuarantor2, relationship: e.target.value })}
                        style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "6px", padding: "6px 10px", color: "#F8FAFC", fontSize: "12px" }}
                      >
                        {GUARANTOR_ROLE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Guarantor 2 NIN (11 digits)"
                        value={editGuarantor2.nin || ""}
                        onChange={(e) => setEditGuarantor2({ ...editGuarantor2, nin: e.target.value })}
                        style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "6px", padding: "6px 10px", color: "#F8FAFC", fontSize: "12px", fontFamily: "monospace" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Trade Specialization & Skill Categories */}
              <div style={{ background: "#0F172A", padding: "16px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ fontSize: "12px", color: "#38BDF8", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Wrench size={14} color="#38BDF8" /> 4️⃣ Trade Specialization &amp; Skill Categories (Admin Configurable)
                </strong>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Select Primary Trade Category
                    </label>
                    <select
                      value={editPrimaryTrade}
                      onChange={(e) => setEditPrimaryTrade(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    >
                      {MASTER_TRADE_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Select Secondary Trade Category (Optional)
                    </label>
                    <select
                      value={editSecondaryTrade}
                      onChange={(e) => setEditSecondaryTrade(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    >
                      <option value="">-- None / Single Trade --</option>
                      {MASTER_TRADE_CATEGORIES.filter((c) => c.value !== editPrimaryTrade).map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Specific Skills / Sub-Trades
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pipe repairs, Water heaters, Conduit wiring"
                      value={editSkills}
                      onChange={(e) => setEditSkills(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Quiz Assessment Score (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editQuizScore}
                      onChange={(e) => setEditQuizScore(Number(e.target.value))}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#10B981", fontSize: "13px", fontWeight: 700 }}
                    />
                  </div>
                </div>

                {inspectPro.tradeCertUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewMediaUrl(inspectPro.tradeCertUrl)}
                    style={{ background: "none", border: "none", color: "#38BDF8", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}
                  >
                    👁️ Inspect Uploaded Trade Certificate / License <ExternalLink size={12} />
                  </button>
                )}
              </div>

              {/* 5. Compliance Audit Notes & Status Decision */}
              <div style={{ background: "#0F172A", padding: "16px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ fontSize: "12px", color: "#A855F7", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Shield size={14} color="#A855F7" /> 5️⃣ Verification Officer Compliance Audit Decision
                </strong>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Overall Compliance Status
                    </label>
                    <select
                      value={editVerificationStatus}
                      onChange={(e) => setEditVerificationStatus(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#1E293B",
                        border: "1px solid #334155",
                        borderRadius: "6px",
                        padding: "8px 10px",
                        color: editVerificationStatus === "VERIFIED" ? "#10B981" : editVerificationStatus === "REJECTED" ? "#EF4444" : "#F59E0B",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      <option value="VERIFIED">VERIFIED (Full Approval) ✓</option>
                      <option value="PENDING">PENDING REVIEW ⏳</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW 🔍</option>
                      <option value="REJECTED">REJECTED (Missing / Invalid) ✕</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Officer Compliance Audit Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Approved by Admin Compliance Team"
                      value={editOfficerNotes}
                      onChange={(e) => setEditOfficerNotes(e.target.value)}
                      style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderTop: "1px solid #334155", paddingTop: 16 }}>
              <button
                type="button"
                onClick={() => handlePurgeArtisan(inspectPro)}
                className="btn btn-secondary btn-sm"
                style={{ color: "#EF4444", borderColor: "rgba(239,68,68,0.4)", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Trash2 size={14} /> Purge / Delete Artisan
              </button>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => handleDecision("REJECTED")}
                  disabled={savingDossier}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "#EF4444", borderColor: "#EF4444", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <XCircle size={14} /> Deny Application
                </button>

                <button
                  type="button"
                  onClick={handleSaveFullDossier}
                  disabled={savingDossier}
                  className="btn btn-primary btn-sm"
                  style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
                >
                  <Save size={14} /> {savingDossier ? "Saving Dossier..." : "Save & Update Artisan Audit Dossier"}
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision("VERIFIED")}
                  disabled={savingDossier}
                  className="btn btn-primary btn-sm"
                  style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
                >
                  <CheckCircle size={14} /> Approve &amp; Issue Verified Badge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Inspection Modal */}
      {previewMediaUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={() => setPreviewMediaUrl(null)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={previewMediaUrl}
              alt="Verification Document"
              style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "8px", objectFit: "contain", border: "2px solid #38BDF8" }}
            />
            <button
              onClick={() => setPreviewMediaUrl(null)}
              style={{
                position: "absolute",
                top: -16,
                right: -16,
                background: "#EF4444",
                color: "#FFFFFF",
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
