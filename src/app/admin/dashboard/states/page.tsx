"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  ShieldCheck,
  Power,
  PowerOff,
  Search,
  CheckCircle2,
  Users,
  FileText,
  RefreshCw,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { NigerianState, StateAuditLog, StateSystemMetrics, StateWaitlistEntry, GeopoliticalZone } from "@/lib/states/types";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import styles from "../../admin.module.css";

const ZONE_FILTERS: { id: string; label: string; zone?: GeopoliticalZone }[] = [
  { id: "ALL", label: "All 37 Regions" },
  { id: "ACTIVE", label: "🟢 Active Only" },
  { id: "INACTIVE", label: "⚪ Inactive Only" },
  { id: "NORTH_CENTRAL", label: "North Central (FCT, Plateau, etc.)", zone: "NORTH_CENTRAL" },
  { id: "SOUTH_WEST", label: "South West (Lagos, Oyo, etc.)", zone: "SOUTH_WEST" },
  { id: "SOUTH_SOUTH", label: "South South (Rivers, Delta, etc.)", zone: "SOUTH_SOUTH" },
  { id: "NORTH_WEST", label: "North West (Kano, Kaduna, etc.)", zone: "NORTH_WEST" },
  { id: "SOUTH_EAST", label: "South East (Enugu, Anambra, etc.)", zone: "SOUTH_EAST" },
  { id: "NORTH_EAST", label: "North East (Borno, Adamawa, etc.)", zone: "NORTH_EAST" },
];

export default function AdminStateOperationsPage() {
  const [states, setStates] = useState<NigerianState[]>([]);
  const [metrics, setMetrics] = useState<StateSystemMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<StateAuditLog[]>([]);
  const [waitlist, setWaitlist] = useState<StateWaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"STATES" | "AUDIT" | "WAITLIST">("STATES");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for Toggle Action
  const [selectedState, setSelectedState] = useState<NigerianState | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Coverage Edit Modal
  const [editingCoverageState, setEditingCoverageState] = useState<NigerianState | null>(null);
  const [newCoverageSummary, setNewCoverageSummary] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/states");
      const data = await res.json();
      if (data.success) {
        setStates(data.states || []);
        setMetrics(data.metrics || null);
        setAuditLogs(data.auditLogs || []);
        setWaitlist(data.waitlist || []);
      }
    } catch (err) {
      console.error("Failed to load state operations data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleState = async () => {
    if (!selectedState) return;
    if (!actionReason.trim() || actionReason.trim().length < 5) {
      alert("Please provide an audit reason of at least 5 characters for this operational change.");
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await fetch("/api/admin/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_STATUS",
          stateCode: selectedState.code,
          isActive: !selectedState.isActive,
          reason: actionReason.trim(),
          actorRole: "SUPER_ADMIN",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToastMessage(data.message);
        setSelectedState(null);
        setActionReason("");
        fetchData();
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        alert(data.error || "Failed to update state status.");
      }
    } catch {
      alert("Failed to connect to state operations server.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateCoverage = async () => {
    if (!editingCoverageState) return;
    try {
      const res = await fetch("/api/admin/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_COVERAGE",
          stateCode: editingCoverageState.code,
          coverageSummary: newCoverageSummary,
          actorRole: "SUPER_ADMIN",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage(data.message);
        setEditingCoverageState(null);
        fetchData();
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(data.error || "Failed to update coverage.");
      }
    } catch {
      alert("Failed to connect to server.");
    }
  };

  // Filtering
  const filteredStates = states.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.capital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.coverageSummary && s.coverageSummary.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (zoneFilter === "ACTIVE") return s.isActive;
    if (zoneFilter === "INACTIVE") return !s.isActive;
    if (zoneFilter === "ALL") return true;

    return s.zone === zoneFilter;
  });

  return (
    <AdminLayoutShell>
      <div className={styles.adminContent}>
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 99999,
              background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
              color: "#FFFFFF",
              padding: "14px 22px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            <CheckCircle2 size={18} /> {toastMessage}
          </div>
        )}

        {/* Header Banner */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px", width: "100%" }}>
          <div style={{ minWidth: 0, flex: "1 1 300px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(14, 165, 233, 0.12)", border: "1px solid rgba(14, 165, 233, 0.3)", borderRadius: "30px", color: "#38BDF8", fontSize: "12px", fontWeight: 700, marginBottom: 8 }}>
              <ShieldCheck size={14} /> Super Admin Sovereign Controls
            </div>
            <h1 style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: 900, color: "#FFFFFF", margin: 0, letterSpacing: "-0.02em" }}>
              Nigerian State Operating Control System
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginTop: 4, lineHeight: 1.5 }}>
              Control live state operating status across all 36 Nigerian States + FCT Abuja. Deactivated states automatically disappear from customer registration, pro signups, booking flows, and dropdowns with zero code deployment required.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: "#1E293B",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 8,
                color: "#CBD5E1",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} color="#38BDF8" /> Refresh System
            </button>
          </div>
        </div>

        {/* Real Live Metric KPI Cards (Zero Mockup Data) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24, width: "100%" }}>
          <div style={{ background: "#1E293B", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "16px 18px", borderRadius: 12, minWidth: 0 }}>
            <div style={{ fontSize: "0.72rem", color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <MapPin size={13} /> ACTIVE OPERATING STATES
            </div>
            <div style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)", fontWeight: 900, color: "#FFFFFF", margin: "4px 0", wordBreak: "break-word" }}>
              {metrics?.activeStatesCount ?? states.filter((s) => s.isActive).length} <span style={{ fontSize: "0.9rem", color: "#64748B" }}>/ 37</span>
            </div>
            <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>Live bookings &amp; pro signups enabled</div>
          </div>

          <div style={{ background: "#1E293B", border: "1px solid rgba(100, 116, 139, 0.3)", padding: "16px 18px", borderRadius: 12, minWidth: 0 }}>
            <div style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <PowerOff size={13} /> INACTIVE / EXPANSION STATES
            </div>
            <div style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)", fontWeight: 900, color: "#94A3B8", margin: "4px 0", wordBreak: "break-word" }}>
              {metrics?.inactiveStatesCount ?? states.filter((s) => !s.isActive).length}
            </div>
            <div style={{ fontSize: "0.76rem", color: "#64748B" }}>Hidden from public form dropdowns</div>
          </div>

          <div style={{ background: "#1E293B", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "16px 18px", borderRadius: 12, minWidth: 0 }}>
            <div style={{ fontSize: "0.72rem", color: "#F59E0B", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <Users size={13} /> WAITLIST EXPANSION LEADS
            </div>
            <div style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)", fontWeight: 900, color: "#FFFFFF", margin: "4px 0", wordBreak: "break-word" }}>
              {(metrics?.totalWaitlistSubscribers ?? waitlist.length).toLocaleString()}
            </div>
            <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>Prospective clients &amp; artisans registered</div>
          </div>

          <div style={{ background: "#1E293B", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "16px 18px", borderRadius: 12, minWidth: 0 }}>
            <div style={{ fontSize: "0.72rem", color: "#38BDF8", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <FileText size={13} /> SUPER ADMIN AUDIT TRAIL
            </div>
            <div style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)", fontWeight: 900, color: "#FFFFFF", margin: "4px 0", wordBreak: "break-word" }}>
              {metrics?.totalAuditLogsCount ?? auditLogs.length}
            </div>
            <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>Immutable state modifications logged</div>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: 12,
            marginBottom: 20,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            width: "100%",
          }}
        >
          <button
            onClick={() => setActiveTab("STATES")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: activeTab === "STATES" ? "rgba(14, 165, 233, 0.2)" : "rgba(255,255,255,0.04)",
              color: activeTab === "STATES" ? "#38BDF8" : "#94A3B8",
              border: activeTab === "STATES" ? "1px solid #0EA5E9" : "1px solid rgba(255,255,255,0.06)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <MapPin size={15} /> State Operations Directory ({filteredStates.length})
          </button>

          <button
            onClick={() => setActiveTab("AUDIT")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: activeTab === "AUDIT" ? "rgba(14, 165, 233, 0.2)" : "rgba(255,255,255,0.04)",
              color: activeTab === "AUDIT" ? "#38BDF8" : "#94A3B8",
              border: activeTab === "AUDIT" ? "1px solid #0EA5E9" : "1px solid rgba(255,255,255,0.06)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <FileText size={15} /> Audit Logs Ledger ({auditLogs.length})
          </button>

          <button
            onClick={() => setActiveTab("WAITLIST")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: activeTab === "WAITLIST" ? "rgba(14, 165, 233, 0.2)" : "rgba(255,255,255,0.04)",
              color: activeTab === "WAITLIST" ? "#38BDF8" : "#94A3B8",
              border: activeTab === "WAITLIST" ? "1px solid #0EA5E9" : "1px solid rgba(255,255,255,0.06)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <Users size={15} /> Expansion Waitlist Subscribers ({waitlist.length})
          </button>
        </div>

        {/* TAB 1: STATES DIRECTORY */}
        {activeTab === "STATES" && (
          <div style={{ width: "100%" }}>
            {/* Controls: Search & Zone Filters */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ position: "relative", flex: "1 1 240px", minWidth: 0 }}>
                <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748B" }} />
                <input
                  type="text"
                  placeholder="Search state name, capital, or corridor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 14px 9px 36px",
                    background: "#1E293B",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    color: "#FFFFFF",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0 }}>
                {ZONE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setZoneFilter(f.id)}
                    style={{
                      padding: "6px 11px",
                      background: zoneFilter === f.id ? "rgba(14, 165, 233, 0.2)" : "rgba(255, 255, 255, 0.04)",
                      border: zoneFilter === f.id ? "1px solid #0EA5E9" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: 6,
                      color: zoneFilter === f.id ? "#38BDF8" : "#94A3B8",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* States Responsive Table Card */}
            <div style={{ background: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, overflow: "hidden", width: "100%" }}>
              <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", minWidth: 880, borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "rgba(15, 23, 42, 0.6)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94A3B8", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      <th style={{ padding: "12px 16px", fontWeight: 700, whiteSpace: "nowrap" }}>STATE / CAPITAL</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700, whiteSpace: "nowrap" }}>GEOPOLITICAL ZONE</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700, whiteSpace: "nowrap" }}>CURRENT STATUS</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700 }}>COVERAGE CORRIDORS</th>
                      <th style={{ padding: "12px 14px", fontWeight: 700, whiteSpace: "nowrap" }}>LIVE DB STATS</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>SUPER ADMIN ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStates.map((state) => {
                      const isActive = state.isActive;
                      return (
                        <tr
                          key={state.code}
                          style={{
                            borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                            background: isActive ? "rgba(16, 185, 129, 0.02)" : "transparent",
                          }}
                        >
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "14px", display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: 4, color: "#94A3B8", fontFamily: "monospace" }}>
                                {state.code}
                              </span>
                              {state.name}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: 2 }}>Capital: {state.capital}</div>
                          </td>

                          <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                            <span style={{ padding: "3px 8px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.06)", color: "#CBD5E1", fontSize: "11px", fontWeight: 600 }}>
                              {state.zoneLabel}
                            </span>
                          </td>

                          <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                            {isActive ? (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "20px", color: "#10B981", fontSize: "11px", fontWeight: 800 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                                OPERATING (ACTIVE)
                              </div>
                            ) : (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", background: "rgba(100, 116, 139, 0.15)", border: "1px solid rgba(100, 116, 139, 0.3)", borderRadius: "20px", color: "#94A3B8", fontSize: "11px", fontWeight: 700 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#64748B" }} />
                                INACTIVE (WAITLIST)
                              </div>
                            )}
                          </td>

                          <td style={{ padding: "14px 14px", maxWidth: 280 }}>
                            <div style={{ fontSize: "12px", color: "#CBD5E1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={state.coverageSummary}>
                              {state.coverageSummary || "Municipal coverage pending definition"}
                            </div>
                            <button
                              onClick={() => {
                                setEditingCoverageState(state);
                                setNewCoverageSummary(state.coverageSummary || "");
                              }}
                              style={{ background: "none", border: "none", color: "#38BDF8", fontSize: "11px", cursor: "pointer", padding: 0, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <Edit3 size={10} /> Edit Coverage
                            </button>
                          </td>

                          <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                            {isActive ? (
                              <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                                <div><strong style={{ color: "#FFFFFF" }}>{state.activeArtisansCount || 0}</strong> Registered Artisans</div>
                                <div><strong style={{ color: "#38BDF8" }}>{state.totalBookingsCount || 0}</strong> Bookings</div>
                              </div>
                            ) : (
                              <div style={{ fontSize: "12px", color: "#F59E0B" }}>
                                <strong>{state.waitlistCount || 0}</strong> Waitlist Leads
                              </div>
                            )}
                          </td>

                          <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <button
                              onClick={() => setSelectedState(state)}
                              style={{
                                padding: "6px 14px",
                                borderRadius: 6,
                                border: "none",
                                fontWeight: 800,
                                fontSize: "11.5px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                background: isActive
                                  ? "rgba(239, 68, 68, 0.15)"
                                  : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                color: isActive ? "#F87171" : "#FFFFFF",
                                borderWidth: isActive ? "1px" : "0",
                                borderStyle: "solid",
                                borderColor: isActive ? "rgba(239, 68, 68, 0.3)" : "transparent",
                              }}
                            >
                              {isActive ? <PowerOff size={12} /> : <Power size={12} />}
                              {isActive ? "Deactivate State" : "Activate State"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT LOGS */}
        {activeTab === "AUDIT" && (
          <div style={{ background: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, overflow: "hidden", width: "100%" }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                Super Admin Operating State Audit Ledger
              </h3>
              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                Permanent record of state activations &amp; deactivations
              </div>
            </div>

            <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: 740, borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "rgba(15, 23, 42, 0.6)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94A3B8", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>TIMESTAMP</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>STATE</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>ACTION</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>SUPER ADMIN ACTOR</th>
                    <th style={{ padding: "12px 14px" }}>OPERATIONAL REASON</th>
                    <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>IP / CLIENT</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "#64748B", fontSize: "0.88rem" }}>
                        No state status modifications recorded yet. Super Admin activation and deactivation events will appear here in real-time.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                        <td style={{ padding: "12px 16px", color: "#94A3B8", whiteSpace: "nowrap" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>
                          {log.stateName} ({log.stateCode})
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: 800,
                              background: log.action === "ACTIVATED" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                              color: log.action === "ACTIVATED" ? "#10B981" : "#F87171",
                            }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#38BDF8", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {log.actorEmail}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#CBD5E1", maxWidth: 300 }}>
                          {log.reason}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748B", fontSize: "11px", whiteSpace: "nowrap" }}>
                          {log.ipAddress || "admin_console"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: WAITLIST */}
        {activeTab === "WAITLIST" && (
          <div style={{ background: "#1E293B", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, overflow: "hidden", width: "100%" }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                Inactive State Expansion Waitlist Leads
              </h3>
              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                Prospective customers and artisans awaiting regional launch
              </div>
            </div>

            <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "rgba(15, 23, 42, 0.6)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#94A3B8", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>DATE</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>TARGET STATE</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>NAME</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>EMAIL</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>PHONE</th>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>CITY / LGA</th>
                    <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>USER TYPE</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "36px", textAlign: "center", color: "#64748B", fontSize: "0.88rem" }}>
                        No waitlist subscribers yet. Inactive state modals will capture leads automatically.
                      </td>
                    </tr>
                  ) : (
                    waitlist.map((entry) => (
                      <tr key={entry.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                        <td style={{ padding: "12px 16px", color: "#94A3B8", whiteSpace: "nowrap" }}>
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#38BDF8", whiteSpace: "nowrap" }}>
                          {entry.stateName}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#FFFFFF", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {entry.fullName}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#CBD5E1", whiteSpace: "nowrap" }}>
                          {entry.email}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#94A3B8", whiteSpace: "nowrap" }}>
                          {entry.phone || "—"}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#CBD5E1", whiteSpace: "nowrap" }}>
                          {entry.city || entry.lga || "—"}
                        </td>
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          <span style={{ padding: "3px 8px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", fontSize: "11px", fontWeight: 700 }}>
                            {entry.userType}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Confirmation Modal for State Toggle */}
        {selectedState && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(3, 7, 18, 0.85)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999,
              padding: 16,
            }}
            onClick={() => setSelectedState(null)}
          >
            <div
              style={{
                background: "#0F172A",
                border: `1px solid ${selectedState.isActive ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                borderRadius: "16px",
                padding: "24px",
                maxWidth: "480px",
                width: "100%",
                color: "#FFFFFF",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                {selectedState.isActive ? (
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", flexShrink: 0 }}>
                    <PowerOff size={18} />
                  </div>
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981", flexShrink: 0 }}>
                    <Power size={18} />
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
                    {selectedState.isActive ? "Deactivate State Operations" : "Activate State Operations"}
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "#94A3B8", marginTop: 2 }}>
                    Target: <strong>{selectedState.name} ({selectedState.code})</strong>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: "0.85rem", color: "#CBD5E1", lineHeight: 1.5, marginBottom: 18 }}>
                {selectedState.isActive
                  ? `Deactivating ${selectedState.name} will immediately hide it from all public registration dropdowns, pro verification forms, and booking address selectors across the platform. Existing users can still log in, but new bookings and signups in ${selectedState.name} will be paused.`
                  : `Activating ${selectedState.name} will immediately make it visible across all public registration forms, artisan signups, and booking flows platform-wide with zero server downtime.`}
              </p>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                  Mandatory Operational Reason / Audit Note <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={selectedState.isActive ? "e.g. Temporary service pause during dispatch logistics upgrade" : "e.g. Completed initial artisan recruitment and launched dispatch operations"}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedState(null)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#94A3B8",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleToggleState}
                  disabled={submittingAction}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "none",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: submittingAction ? "not-allowed" : "pointer",
                    background: selectedState.isActive
                      ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                      : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  }}
                >
                  {submittingAction ? "Updating..." : selectedState.isActive ? "Confirm Deactivation" : "Confirm Activation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Coverage Modal */}
        {editingCoverageState && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(3, 7, 18, 0.85)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999,
              padding: 16,
            }}
            onClick={() => setEditingCoverageState(null)}
          >
            <div
              style={{
                background: "#0F172A",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: "16px",
                padding: "24px",
                maxWidth: "480px",
                width: "100%",
                color: "#FFFFFF",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 6px 0" }}>
                Edit Coverage Summary — {editingCoverageState.name}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "#94A3B8", margin: "0 0 16px 0", lineHeight: 1.4 }}>
                Define the municipal corridors, zones, and key estates serviced within {editingCoverageState.name}.
              </p>

              <textarea
                rows={4}
                value={newCoverageSummary}
                onChange={(e) => setNewCoverageSummary(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  marginBottom: 18,
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingCoverageState(null)}
                  style={{ flex: 1, padding: "10px", background: "rgba(255, 255, 255, 0.08)", border: "none", borderRadius: 8, color: "#94A3B8", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateCoverage}
                  style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)", border: "none", borderRadius: 8, color: "#FFFFFF", fontWeight: 800, cursor: "pointer", fontSize: "13px" }}
                >
                  Save Coverage
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutShell>
  );
}
