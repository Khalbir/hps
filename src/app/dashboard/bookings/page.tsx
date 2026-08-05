"use client";

import Link from "next/link";
import { Plus, ArrowLeft, ClipboardList } from "lucide-react";

export default function CustomerBookingsPage() {
  const bookings = [
    { id: "HHP-M1K9X", service: "Deep Cleaning", status: "IN_PROGRESS", date: "Today, 2:00 PM", price: "₦25,000", pro: "Blessing O." },
    { id: "HHP-N2L0Y", service: "Electrical Repairs", status: "CONFIRMED", date: "Tomorrow, 9:00 AM", price: "₦15,000", pro: "Abubakar T." },
    { id: "HHP-O3M1Z", service: "Plumbing Repair", status: "PENDING", date: "Aug 5, 2026", price: "₦10,000", pro: "Ibrahim M." },
    { id: "HHP-P4N2A", service: "AC Servicing", status: "COMPLETED", date: "Aug 2, 2026", price: "₦18,500", pro: "Yusuf A." },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "#F59E0B",
    CONFIRMED: "#3B82F6",
    IN_PROGRESS: "#8B5CF6",
    COMPLETED: "#10B981",
    CANCELLED: "#EF4444",
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "40px 20px" }}>
      <div className="container" style={{ maxWidth: 960 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/dashboard" className="btn btn-secondary btn-sm"><ArrowLeft size={16} /> Back to Dashboard</Link>
            <h1 className="h3">My Service Bookings</h1>
          </div>
          <Link href="/book" className="btn btn-primary btn-sm"><Plus size={16} /> New Booking</Link>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)" }}>
                <th style={{ padding: "12px 16px" }}>Ref Code</th>
                <th style={{ padding: "12px 16px" }}>Service Category</th>
                <th style={{ padding: "12px 16px" }}>Assigned Professional</th>
                <th style={{ padding: "12px 16px" }}>Scheduled Date</th>
                <th style={{ padding: "12px 16px" }}>Amount</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "bold", fontFamily: "monospace" }}>{b.id}</td>
                  <td style={{ padding: "12px 16px" }}><strong>{b.service}</strong></td>
                  <td style={{ padding: "12px 16px" }}>{b.pro}</td>
                  <td style={{ padding: "12px 16px" }}>{b.date}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "bold", color: "#0EA5E9" }}>{b.price}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ color: statusColors[b.status], backgroundColor: `${statusColors[b.status]}15`, padding: "4px 8px", borderRadius: 4, fontWeight: "bold", fontSize: "12px" }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Link href={`/track?ref=${b.id}`} className="btn btn-primary btn-xs">
                      Track Status 📍
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
