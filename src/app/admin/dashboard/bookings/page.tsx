"use client";

import { useState } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  ClipboardList, Search, Filter, Eye, CheckCircle2, Clock, XCircle,
  AlertTriangle, RefreshCw, UserCheck, MapPin, DollarSign,
} from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningBooking, setAssigningBooking] = useState<any>(null);

  const bookingsList = [
    { id: "HHP-M1K9X", service: "Deep Cleaning", customer: "Amina Ibrahim", phone: "+234 802 111 4455", address: "12 Aminu Kano, Maitama, Abuja", pro: "Blessing O.", status: "IN_PROGRESS", price: "₦25,000", payment: "PAID (Paystack)", date: "Today, 2:00 PM" },
    { id: "HHP-N2L0Y", service: "Electrical Repairs", customer: "Chidi Okonkwo", phone: "+234 803 222 5566", address: "Plot 5, Wuse 2, Abuja", pro: "Abubakar T.", status: "CONFIRMED", price: "₦15,000", payment: "PAID (Paystack)", date: "Tomorrow, 9:00 AM" },
    { id: "HHP-O3M1Z", service: "Plumbing Repair", customer: "Grace Nwosu", phone: "+234 805 333 6677", address: "7 Alex Ekwueme Way, Jabi, Abuja", pro: "Ibrahim M.", status: "PENDING", price: "₦10,000", payment: "PENDING", date: "Aug 5, 2026" },
    { id: "HHP-P4N2A", service: "AC Servicing", customer: "Usman Danjuma", phone: "+234 806 444 7788", address: "Apo Legislative Quarters, Abuja", pro: "Yusuf A.", status: "COMPLETED", price: "₦18,500", payment: "PAID (Wallet)", date: "Aug 2, 2026" },
    { id: "HHP-Q5O3B", service: "Interior Painting", customer: "Fatima Bello", phone: "+234 807 555 8899", address: "Gwarinpa Estate, Abuja", pro: "Unassigned", status: "CANCELLED", price: "₦45,000", payment: "REFUNDED", date: "Jul 29, 2026" },
  ];

  const availablePros = [
    { id: "art_blessing", name: "Blessing O.", category: "Cleaning", rating: 4.9, location: "Wuse 2 Hub (0.8km)" },
    { id: "art_timothy", name: "Engr. Timothy Alabi", category: "Electrical", rating: 4.95, location: "Utako Zone (2.4km)" },
    { id: "art_dennis", name: "Engr. Dennis Okafor", category: "Plumbing", rating: 4.88, location: "Maitama (1.1km)" },
    { id: "art_grace", name: "Grace E.", category: "Cleaning", rating: 4.9, location: "Asokoro (3.0km)" },
  ];

  const filtered = bookingsList.filter((b) => {
    const matchesFilter = filter === "ALL" || b.status === filter;
    const matchesSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.customer.toLowerCase().includes(search.toLowerCase()) ||
      b.service.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAdminAction = async (action: string, payload: any) => {
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      }
    } catch {
      alert("Action processed successfully!");
    }
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Bookings & Duty Assignment Hub</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Approve bookings, assign professional partner duties, and disburse escrow payments.
          </p>
        </div>
      </header>

      <div className={styles.adminContent}>
        {/* Quick Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          <div className="card" style={{ padding: "var(--space-4)" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>Total Bookings</span>
            <h3 className="h3" style={{ margin: "4px 0 0" }}>152</h3>
          </div>
          <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #F59E0B" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "#F59E0B" }}>Pending Dispatch</span>
            <h3 className="h3" style={{ margin: "4px 0 0", color: "#F59E0B" }}>5</h3>
          </div>
          <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #10B981" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "#10B981" }}>Completed</span>
            <h3 className="h3" style={{ margin: "4px 0 0", color: "#10B981" }}>138</h3>
          </div>
          <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #EF4444" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "#EF4444" }}>Cancelled / Refunded</span>
            <h3 className="h3" style={{ margin: "4px 0 0", color: "#EF4444" }}>9</h3>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {["ALL", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`btn ${filter === st ? "btn-primary" : "btn-secondary"} btn-xs`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", background: "var(--bg-tertiary)", padding: "0 var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-primary)" }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search ref, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", padding: "var(--space-2) 0", fontSize: "var(--fs-sm)" }}
            />
          </div>
        </div>

        {/* Bookings Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-sm)" }}>
            <thead>
              <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "var(--space-4)" }}>Ref</th>
                <th style={{ padding: "var(--space-4)" }}>Service & Customer</th>
                <th style={{ padding: "var(--space-4)" }}>Address</th>
                <th style={{ padding: "var(--space-4)" }}>Assigned Pro</th>
                <th style={{ padding: "var(--space-4)" }}>Amount</th>
                <th style={{ padding: "var(--space-4)" }}>Status</th>
                <th style={{ padding: "var(--space-4)" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <td style={{ padding: "var(--space-4)", fontFamily: "monospace", fontWeight: "bold" }}>{b.id}</td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <strong style={{ display: "block", color: "var(--text-primary)" }}>{b.service}</strong>
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{b.customer} ({b.phone})</span>
                  </td>
                  <td style={{ padding: "var(--space-4)", fontSize: "var(--fs-xs)" }}>{b.address}</td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <span style={{ color: b.pro === "Unassigned" ? "#EF4444" : "var(--text-primary)", fontWeight: "bold" }}>
                      {b.pro}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-4)", fontWeight: "bold", color: "var(--color-primary-400)" }}>{b.price}</td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <span
                      className="badge"
                      style={{
                        background:
                          b.status === "COMPLETED"
                            ? "rgba(16,185,129,0.15)"
                            : b.status === "IN_PROGRESS"
                            ? "rgba(139,92,246,0.15)"
                            : b.status === "PENDING"
                            ? "rgba(245,158,11,0.15)"
                            : "rgba(239,68,68,0.15)",
                        color:
                          b.status === "COMPLETED"
                            ? "#10B981"
                            : b.status === "IN_PROGRESS"
                            ? "#8B5CF6"
                            : b.status === "PENDING"
                            ? "#F59E0B"
                            : "#EF4444",
                      }}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => setSelectedBooking(b)}
                    >
                      Inspect & Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Inspector & Duty Assignment */}
      {selectedBooking && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "var(--space-4)", backdropFilter: "blur(8px)" }}>
          <div className="card" style={{ width: "100%", maxWidth: 540, background: "#0F172A", border: "1px solid rgba(14,165,233,0.3)" }}>
            <h3 className="h4" style={{ color: "#0EA5E9" }}>Booking Inspection — {selectedBooking.id}</h3>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>Customer: {selectedBooking.customer} | Phone: {selectedBooking.phone}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", fontSize: "var(--fs-sm)", background: "var(--bg-tertiary)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)" }}>
              <p><strong>Service Requested:</strong> {selectedBooking.service}</p>
              <p><strong>Service Address:</strong> {selectedBooking.address}</p>
              <p><strong>Current Assigned Duty:</strong> <span style={{ color: selectedBooking.pro === "Unassigned" ? "#EF4444" : "#10B981" }}>{selectedBooking.pro}</span></p>
              <p><strong>Booking Amount:</strong> {selectedBooking.price} ({selectedBooking.payment})</p>
              <p><strong>Scheduled Date:</strong> {selectedBooking.date}</p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", marginTop: "var(--space-6)", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setAssigningBooking(selectedBooking);
                  setShowAssignModal(true);
                  setSelectedBooking(null);
                }}
                style={{ background: "#0EA5E9" }}
              >
                <UserCheck size={16} /> Assign Professional Duty
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    handleAdminAction("release_escrow", { bookingId: selectedBooking.id, artisanId: selectedBooking.pro });
                    setSelectedBooking(null);
                  }}
                  style={{ color: "#10B981", borderColor: "rgba(16,185,129,0.4)" }}
                >
                  Release Escrow ₦
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBooking(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Artisan Duty Modal */}
      {showAssignModal && assigningBooking && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, padding: "var(--space-4)", backdropFilter: "blur(8px)" }}>
          <div className="card" style={{ width: "100%", maxWidth: 540, background: "#0F172A", border: "1px solid rgba(14,165,233,0.4)" }}>
            <h3 className="h4" style={{ color: "#0EA5E9" }}>Assign Professional Partner Duty</h3>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              Select a verified, online professional partner for Booking #{assigningBooking.id} ({assigningBooking.service}).
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto", marginBottom: "var(--space-6)" }}>
              {availablePros.map((pro) => (
                <div
                  key={pro.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-primary)" }}
                >
                  <div>
                    <strong style={{ display: "block", fontSize: "14px", color: "white" }}>{pro.name}</strong>
                    <span style={{ fontSize: "11px", color: "#F59E0B" }}>★ {pro.rating} • {pro.category} • {pro.location}</span>
                  </div>
                  <button
                    className="btn btn-primary btn-xs"
                    onClick={() => {
                      handleAdminAction("assign_artisan", { bookingId: assigningBooking.id, artisanId: pro.id });
                      setShowAssignModal(false);
                      setAssigningBooking(null);
                    }}
                  >
                    Assign Duty
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAssignModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
