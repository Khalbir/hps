"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  ShieldCheck,
  Power,
  PowerOff,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Building2,
  FileText,
  TrendingUp,
  RefreshCw,
  Edit3,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import { NigerianState, StateAuditLog, StateSystemMetrics, StateWaitlistEntry, GeopoliticalZone } from "@/lib/states/types";

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
      s.coverageSummary.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (zoneFilter === "ACTIVE") return s.isActive;
    if (zoneFilter === "INACTIVE") return !s.isActive;
    if (zoneFilter === "ALL") return true;

    return s.zone === zoneFilter;
  });

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "#070E1A", color: "#F8FAFC" }}>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(14, 165, 233, 0.12)", border: "1px solid rgba(14, 165, 233, 0.3)", borderRadius: "30px", color: "#38BDF8", fontSize: "12px", fontWeight: 700, marginBottom: 8 }}>
            <ShieldCheck size={14} /> Super Admin Sovereign Controls
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Nigerian State Operating Control System
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "0.9rem", marginTop: 4 }}>
            Control live state operating status across all 36 Nigerian States + FCT Abuja. Deactivated states automatically disappear from customer registration, pro signups, booking flows, and dropdowns with zero code deployment required.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 10,
            color: "#CBD5E1",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh System
        </button>
      </div>

      {/* Metric KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "20px", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.8rem", color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={14} /> ACTIVE OPERATING STATES
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#FFFFFF", marginTop: 6 }}>
            {metrics?.activeStatesCount ?? 5} <span style={{ fontSize: "1rem", color: "#64748B" }}>/ 37</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: 4 }}>Live bookings &amp; pro signups enabled</div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(100, 116, 139, 0.3)", padding: "20px", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <PowerOff size={14} /> INACTIVE / EXPANSION STATES
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#94A3B8", marginTop: 6 }}>
            {metrics?.inactiveStatesCount ?? 32}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 4 }}>Hidden from public form dropdowns</div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "20px", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.8rem", color: "#F59E0B", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={14} /> WAITLIST EXPANSION LEADS
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#FFFFFF", marginTop: 6 }}>
            {(metrics?.totalWaitlistSubscribers ?? 11520).toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: 4 }}>Prospective clients &amp; artisans registered</div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "20px", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.8rem", color: "#38BDF8", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} /> SUPER ADMIN AUDIT TRAIL
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#FFFFFF", marginTop: 6 }}>
            {metrics?.totalAuditLogsCount ?? auditLogs.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: 4 }}>Immutable state modifications logged</div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: "flex", gap: 12, borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: 12, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("STATES")}
          style={{
            padding: "10px 20px",
            background: activeTab === "STATES" ? "rgba(14, 165, 233, 0.2)" : "transparent",
            border: activeTab === "STATES" ? "1px solid #0EA5E9" : "1px solid transparent",
            borderRadius: 10,
            color: activeTab === "STATES" ? "#38BDF8" : "#94A3B8",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MapPin size={16} /> State Operations Directory ({filteredStates.length})
        </button>

        <button
          onClick={() => setActiveTab("AUDIT")}
          style={{
            padding: "10px 20px",
            background: activeTab === "AUDIT" ? "rgba(14, 165, 233, 0.2)" : "transparent",
            border: activeTab === "AUDIT" ? "1px solid #0EA5E9" : "1px solid transparent",
            borderRadius: 10,
            color: activeTab === "AUDIT" ? "#38BDF8" : "#94A3B8",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FileText size={16} /> Audit Logs Ledger ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab("WAITLIST")}
          style={{
            padding: "10px 20px",
            background: activeTab === "WAITLIST" ? "rgba(14, 165, 233, 0.2)" : "transparent",
            border: activeTab === "WAITLIST" ? "1px solid #0EA5E9" : "1px solid transparent",
            borderRadius: 10,
            color: activeTab === "WAITLIST" ? "#38BDF8" : "#94A3B8",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Users size={16} /> Expansion Waitlist Subscribers ({waitlist.length})
        </button>
      </div>

      {activeTab === "STATES" && (
        <div>
          {/* Controls: Search & Zone Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ position: "relative", minWidth: 320 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748B" }} />
              <input
                type="text"
                placeholder="Search state name, capital, or corridor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 10,
                  color: "#FFFFFF",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ZONE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setZoneFilter(f.id)}
                  style={{
                    padding: "6px 12px",
                    background: zoneFilter === f.id ? "rgba(14, 165, 233, 0.2)" : "rgba(255, 255, 255, 0.04)",
                    border: zoneFilter === f.id ? "1px solid #0EA5E9" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 8,
                    color: zoneFilter === f.id ? "#38BDF8" : "#94A3B8",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* States Table / Grid */}
          <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "rgba(0, 0, 0, 0.3)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", color: "#94A3B8" }}>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>STATE / CAPITAL</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>GEOPOLITICAL ZONE</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>CURRENT STATUS</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>COVERAGE CORRIDORS</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>ACTIVE STATS</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>SUPER ADMIN ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStates.map((state) => {
                  const isActive = state.isActive;
                  return (
                    <tr
                      key={state.code}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        background: isActive ? "rgba(16, 185, 129, 0.03)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "14px", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: 4, color: "#94A3B8" }}>
                            {state.code}
                          </span>
                          {state.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: 2 }}>Capital: {state.capital}</div>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "20px", background: "rgba(255, 255, 255, 0.06)", color: "#CBD5E1", fontSize: "11px", fontWeight: 600 }}>
                          {state.zoneLabel}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        {isActive ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "20px", color: "#10B981", fontSize: "11px", fontWeight: 800 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                            OPERATING (ACTIVE)
                          </div>
                        ) : (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(100, 116, 139, 0.15)", border: "1px solid rgba(100, 116, 139, 0.3)", borderRadius: "20px", color: "#94A3B8", fontSize: "11px", fontWeight: 700 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#64748B" }} />
                            INACTIVE (WAITLIST)
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "14px 18px", maxWidth: 300 }}>
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

                      <td style={{ padding: "14px 18px" }}>
                        {isActive ? (
                          <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                            <div><strong style={{ color: "#FFFFFF" }}>{state.activeArtisansCount}</strong> Artisans</div>
                            <div><strong style={{ color: "#FFFFFF" }}>{state.activeEstatesCount}</strong> Estates</div>
                          </div>
                        ) : (
                          <div style={{ fontSize: "12px", color: "#F59E0B" }}>
                            <strong>{state.waitlistCount || 0}</strong> Waitlist Leads
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedState(state)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "none",
                            fontWeight: 800,
                            fontSize: "12px",
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
                          {isActive ? <PowerOff size={13} /> : <Power size={13} />}
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
      )}

      {/* Audit Logs Tab */}
      {activeTab === "AUDIT" && (
        <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#FFFFFF" }}>
              Super Admin Operating State Audit Ledger
            </h3>
            <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
              Permanent record of state activations &amp; deactivations
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(0, 0, 0, 0.3)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", color: "#94A3B8" }}>
                <th style={{ padding: "12px 18px" }}>TIMESTAMP</th>
                <th style={{ padding: "12px 18px" }}>STATE</th>
                <th style={{ padding: "12px 18px" }}>ACTION</th>
                <th style={{ padding: "12px 18px" }}>SUPER ADMIN ACTOR</th>
                <th style={{ padding: "12px 18px" }}>OPERATIONAL REASON</th>
                <th style={{ padding: "12px 18px" }}>IP / CLIENT</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <td style={{ padding: "12px 18px", color: "#94A3B8" }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 18px", fontWeight: 700, color: "#FFFFFF" }}>
                    {log.stateName} ({log.stateCode})
                  </td>
                  <td style={{ padding: "12px 18px" }}>
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
                  <td style={{ padding: "12px 18px", color: "#38BDF8", fontWeight: 600 }}>
                    {log.actorEmail}
                  </td>
                  <td style={{ padding: "12px 18px", color: "#CBD5E1", maxWidth: 320 }}>
                    {log.reason}
                  </td>
                  <td style={{ padding: "12px 18px", color: "#64748B", fontSize: "11px" }}>
                    {log.ipAddress || "admin_console"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Waitlist Tab */}
      {activeTab === "WAITLIST" && (
        <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#FFFFFF" }}>
              Inactive State Expansion Waitlist Leads
            </h3>
            <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
              Prospective customers and artisans awaiting regional launch
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(0, 0, 0, 0.3)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", color: "#94A3B8" }}>
                <th style={{ padding: "12px 18px" }}>DATE</th>
                <th style={{ padding: "12px 18px" }}>TARGET STATE</th>
                <th style={{ padding: "12px 18px" }}>NAME</th>
                <th style={{ padding: "12px 18px" }}>EMAIL</th>
                <th style={{ padding: "12px 18px" }}>PHONE</th>
                <th style={{ padding: "12px 18px" }}>CITY / LGA</th>
                <th style={{ padding: "12px 18px" }}>USER TYPE</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>
                    No waitlist subscribers yet. Inactive state modals will capture leads automatically.
                  </td>
                </tr>
              ) : (
                waitlist.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "12px 18px", color: "#94A3B8" }}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 18px", fontWeight: 700, color: "#38BDF8" }}>
                      {entry.stateName}
                    </td>
                    <td style={{ padding: "12px 18px", color: "#FFFFFF", fontWeight: 600 }}>
                      {entry.fullName}
                    </td>
                    <td style={{ padding: "12px 18px", color: "#CBD5E1" }}>
                      {entry.email}
                    </td>
                    <td style={{ padding: "12px 18px", color: "#94A3B8" }}>
                      {entry.phone || "—"}
                    </td>
                    <td style={{ padding: "12px 18px", color: "#CBD5E1" }}>
                      {entry.city || entry.lga || "—"}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
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
              background: "linear-gradient(180deg, #0F172A 0%, #070D18 100%)",
              border: `1px solid ${selectedState.isActive ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
              borderRadius: "18px",
              padding: "28px",
              maxWidth: "480px",
              width: "100%",
              color: "#FFFFFF",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              {selectedState.isActive ? (
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
                  <PowerOff size={20} />
                </div>
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
                  <Power size={20} />
                </div>
              )}
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                  {selectedState.isActive ? "Deactivate State Operations" : "Activate State Operations"}
                </h3>
                <div style={{ fontSize: "0.82rem", color: "#94A3B8" }}>
                  Target: <strong>{selectedState.name} ({selectedState.code})</strong>
                </div>
              </div>
            </div>

            <p style={{ fontSize: "0.88rem", color: "#CBD5E1", lineHeight: 1.5, marginBottom: 20 }}>
              {selectedState.isActive
                ? `Deactivating ${selectedState.name} will immediately hide it from all public registration dropdowns, pro verification forms, and booking address selectors across the platform. Existing users can still log in, but new bookings and signups in ${selectedState.name} will be paused.`
                : `Activating ${selectedState.name} will immediately make it visible across all public registration forms, artisan signups, and booking flows platform-wide with zero server downtime.`}
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
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
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedState(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#94A3B8",
                  fontWeight: 700,
                  cursor: "pointer",
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
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontWeight: 800,
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
              background: "linear-gradient(180deg, #0F172A 0%, #070D18 100%)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "18px",
              padding: "28px",
              maxWidth: "500px",
              width: "100%",
              color: "#FFFFFF",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 6 }}>
              Edit Coverage Summary — {editingCoverageState.name}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#94A3B8", marginBottom: 16 }}>
              Define the municipal corridors, zones, and key estates serviced within {editingCoverageState.name}.
            </p>

            <textarea
              rows={4}
              value={newCoverageSummary}
              onChange={(e) => setNewCoverageSummary(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                color: "#FFFFFF",
                fontSize: "13px",
                fontFamily: "inherit",
                marginBottom: 20,
              }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setEditingCoverageState(null)}
                style={{ flex: 1, padding: "10px", background: "rgba(255, 255, 255, 0.08)", border: "none", borderRadius: 8, color: "#94A3B8", fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateCoverage}
                style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)", border: "none", borderRadius: 8, color: "#FFFFFF", fontWeight: 800, cursor: "pointer" }}
              >
                Save Coverage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
