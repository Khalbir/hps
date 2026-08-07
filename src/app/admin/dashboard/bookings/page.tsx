"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  ClipboardList, Search, Filter, CheckCircle2, Clock, MapPin,
  User, Shield, Phone, Mail, ArrowRight, AlertCircle, RefreshCw, Send, Inbox, UserCheck, Wrench
} from "lucide-react";
import styles from "../../admin.module.css";

const ALL_STATUSES = [
  "ALL",
  "PENDING",
  "ASSIGNED",
  "ACCEPTED",
  "EN_ROUTE",
  "WORK_IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export default function BookingsWorkflowPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProId, setSelectedProId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState("");

  const fetchBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.bookings) {
        setBookings(
          data.bookings.map((b: any) => ({
            id: b.id,
            reference: b.reference,
            customer: {
              name: `${b.customer?.firstName || "Customer"} ${b.customer?.lastName || ""}`,
              email: b.customer?.email || "N/A",
              phone: b.customer?.phone || "N/A",
            },
            pro: b.professional
              ? {
                  id: b.professional.id,
                  name: `${b.professional.user?.firstName || "Artisan"} ${b.professional.user?.lastName || ""}`,
                  email: b.professional.user?.email || "",
                }
              : null,
            service: b.service?.name || "Home Service",
            city: b.address || "Abuja",
            scheduledDate: new Date(b.scheduledDate).toLocaleDateString(),
            scheduledTime: b.scheduledTime,
            status: b.status,
            amount: b.estimatedPrice,
            paymentStatus: b.paymentStatus,
          }))
        );
      }
    } catch (err) {
      console.warn("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const res = await fetch("/api/admin/verification?status=VERIFIED");
      const data = await res.json();
      if (res.ok && data.professionals) {
        setProfessionals(data.professionals || []);
      }
    } catch (err) {
      console.warn("Error fetching professionals:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchProfessionals();
    const interval = setInterval(fetchBookings, 6000);
    return () => clearInterval(interval);
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    const matchesSearch =
      b.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_BOOKING_STATUS", bookingId, status: newStatus }),
      });
    } catch {}

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking({ ...selectedBooking, status: newStatus });
    }
    setToastMsg(`Booking status changed to ${newStatus}. Dispatched to notifications engine.`);
    setTimeout(() => setToastMsg(""), 4000);
  };

  // Manually Assign Professional to Job
  const handleAssignArtisan = async () => {
    if (!selectedBooking || !selectedProId) return;
    setAssigning(true);

    try {
      const targetPro = professionals.find((p) => p.id === selectedProId || p.userId === selectedProId);
      const proName = targetPro ? targetPro.name : "Artisan Partner";

      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_artisan",
          bookingId: selectedBooking.id,
          proId: selectedProId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id
              ? { ...b, status: "ASSIGNED", pro: { id: selectedProId, name: proName } }
              : b
          )
        );
        setSelectedBooking({
          ...selectedBooking,
          status: "ASSIGNED",
          pro: { id: selectedProId, name: proName },
        });
        setToastMsg(`✅ Manually assigned ${proName} to Booking #${selectedBooking.reference}! Notification dispatched to customer & artisan.`);
        setTimeout(() => setToastMsg(""), 5000);
      } else {
        alert(data.error || "Failed to assign professional to job");
      }
    } catch (err) {
      console.error("Assign artisan error:", err);
    } finally {
      setAssigning(false);
    }
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case "COMPLETED": return "#10B981";
      case "WORK_IN_PROGRESS": return "#8B5CF6";
      case "EN_ROUTE": return "#0EA5E9";
      case "ACCEPTED": return "#3B82F6";
      case "ASSIGNED": return "#6366F1";
      case "PENDING": return "#F59E0B";
      case "CANCELLED": return "#64748B";
      case "REFUNDED": return "#EF4444";
      default: return "#94A3B8";
    }
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="h3">Production 8-State Booking & Artisan Dispatch Engine</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Real Database Records: PENDING → ASSIGNED → ACCEPTED → EN_ROUTE → WORK_IN_PROGRESS → COMPLETED / CANCELLED / REFUNDED
          </p>
        </div>
      </header>

      {toastMsg && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "bold" }}>
          {toastMsg}
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search Ref, Customer name, or Service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
          {ALL_STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                background: statusFilter === st ? "#0EA5E9" : "#1E293B",
                color: statusFilter === st ? "#FFFFFF" : "#94A3B8",
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
      </div>

      {/* Bookings Table & Drawer Grid */}
      <div style={{ display: "grid", gridTemplateColumns: selectedBooking ? "1.6fr 1fr" : "1fr", gap: "20px" }}>
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden" }}>
          {filteredBookings.length === 0 ? (
            <div style={{ padding: "50px", textAlign: "center", color: "#94A3B8" }}>
              <Inbox size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
              <h4 className="h4" style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>No Bookings Match Selected Filter</h4>
              <p style={{ margin: 0, fontSize: "13px" }}>Real customer bookings stored in the database will display here automatically.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                  <th style={{ padding: "12px 16px" }}>Ref</th>
                  <th style={{ padding: "12px 16px" }}>Customer</th>
                  <th style={{ padding: "12px 16px" }}>Service</th>
                  <th style={{ padding: "12px 16px" }}>Amount</th>
                  <th style={{ padding: "12px 16px" }}>State</th>
                  <th style={{ padding: "12px 16px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: "1px solid #334155",
                      background: selectedBooking?.id === b.id ? "rgba(14,165,233,0.08)" : "transparent",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedBooking(b)}
                  >
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#0EA5E9", fontWeight: 700 }}>#{b.reference}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#F8FAFC" }}>{b.customer.name}</td>
                    <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>{b.service}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#10B981" }}>₦{b.amount.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="badge" style={{ background: getStatusColor(b.status) + "25", color: getStatusColor(b.status), fontSize: "11px", fontWeight: 700 }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button className="btn btn-secondary btn-xs" onClick={(e) => { e.stopPropagation(); setSelectedBooking(b); }}>
                        Manage & Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Selected Booking Management Drawer */}
        {selectedBooking && (
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #334155", paddingBottom: "12px" }}>
              <div>
                <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Booking #{selectedBooking.reference}</h3>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>{selectedBooking.service}</span>
              </div>
              <button onClick={() => setSelectedBooking(null)} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                Current Workflow State
              </label>
              <span className="badge" style={{ background: getStatusColor(selectedBooking.status) + "25", color: getStatusColor(selectedBooking.status), fontSize: "13px", fontWeight: 700, padding: "6px 12px" }}>
                {selectedBooking.status}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#0F172A", padding: "14px", borderRadius: "8px", border: "1px solid #334155", marginBottom: "20px" }}>
              <div style={{ fontSize: "13px" }}>
                <strong style={{ color: "#0EA5E9" }}>Customer:</strong> {selectedBooking.customer.name} ({selectedBooking.customer.email})
              </div>
              <div style={{ fontSize: "13px" }}>
                <strong style={{ color: "#8B5CF6" }}>Assigned Artisan:</strong> {selectedBooking.pro?.name || "Unassigned"}
              </div>
              <div style={{ fontSize: "13px" }}>
                <strong style={{ color: "#10B981" }}>Escrow Amount:</strong> ₦{selectedBooking.amount.toLocaleString()}
              </div>
            </div>

            {/* MANUAL ARTISAN ASSIGNMENT PANEL */}
            <div style={{ background: "rgba(14, 165, 233, 0.1)", border: "1.5px solid #0EA5E9", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
              <h4 className="h4" style={{ color: "#38BDF8", fontSize: "14px", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <UserCheck size={18} /> Manual Artisan Assignment
              </h4>
              <p style={{ fontSize: "12px", color: "#CBD5E1", margin: "0 0 12px 0" }}>
                Select a verified professional matching the requested skillset (<strong>{selectedBooking.service}</strong>):
              </p>

              <select
                value={selectedProId}
                onChange={(e) => setSelectedProId(e.target.value)}
                style={{
                  width: "100%",
                  height: 42,
                  padding: "0 12px",
                  background: "#0F172A",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#F8FAFC",
                  fontSize: "13px",
                  marginBottom: "12px",
                  fontWeight: 600,
                }}
              >
                <option value="">-- Choose Verified Professional / Artisan --</option>
                {professionals.map((p) => {
                  const matchesCategory = selectedBooking.service && p.field.toLowerCase().includes(selectedBooking.service.toLowerCase());
                  return (
                    <option key={p.id} value={p.id}>
                      {matchesCategory ? "⭐ " : ""}[{p.field}] {p.name} ({p.operatingState || p.city}) • {p.rating}★
                    </option>
                  );
                })}
              </select>

              <button
                className="btn btn-primary btn-md w-full"
                onClick={handleAssignArtisan}
                disabled={!selectedProId || assigning}
                style={{
                  background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <UserCheck size={16} />
                {assigning ? "Assigning Artisan..." : "Assign Selected Professional to Job 👤"}
              </button>
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                Trigger Workflow State Transition
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {["ASSIGNED", "ACCEPTED", "EN_ROUTE", "WORK_IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"].map((st) => (
                  <button
                    key={st}
                    disabled={selectedBooking.status === st}
                    onClick={() => handleStatusChange(selectedBooking.id, st)}
                    className="btn btn-secondary btn-xs"
                    style={{
                      borderColor: getStatusColor(st),
                      color: selectedBooking.status === st ? "#64748B" : getStatusColor(st),
                    }}
                  >
                    Set to {st.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutShell>
  );
}
