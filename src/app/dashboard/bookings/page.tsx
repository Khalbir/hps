"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ArrowLeft, ClipboardList, RefreshCw, Inbox, Star } from "lucide-react";
import { RateReviewModal } from "@/components/common/RateReviewModal";

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeReviewBooking, setActiveReviewBooking] = useState<{ id: string; service: string; pro: string } | null>(null);

  const fetchRealCustomerBookings = async () => {
    setLoading(true);
    let activeUserId = "";
    let activeEmail = "";

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("handyhub_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.id) activeUserId = parsed.id;
          if (parsed.email) activeEmail = parsed.email;
        }
      } catch (e) {}
    }

    try {
      const res = await fetch(`/api/customer/dashboard?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok && data.bookings) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.warn("Failed to fetch customer bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealCustomerBookings();
  }, []);

  const openReviewModal = (booking: any) => {
    setActiveReviewBooking({
      id: booking.id,
      service: booking.service || "Home Service",
      pro: booking.pro || "Assigned Artisan",
    });
    setReviewModalOpen(true);
  };

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/dashboard" className="btn btn-secondary btn-sm"><ArrowLeft size={16} /> Back to Dashboard</Link>
            <h1 className="h3">My Service Bookings</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchRealCustomerBookings} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <Link href="/book" className="btn btn-primary btn-sm"><Plus size={16} /> New Booking</Link>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--text-tertiary)" }}>Loading service bookings...</div>
          ) : bookings.length === 0 ? (
            <div style={{ padding: "50px 20px", textAlign: "center" }}>
              <Inbox size={48} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 12 }} />
              <h4 className="h4">No Service Bookings Found</h4>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: 16 }}>Click below to schedule your first verified artisan service.</p>
              <Link href="/book" className="btn btn-primary btn-sm">Book Service Now ➔</Link>
            </div>
          ) : (
            <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
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
                        <span style={{ color: statusColors[b.status] || "#0EA5E9", backgroundColor: `${statusColors[b.status] || "#0EA5E9"}15`, padding: "4px 8px", borderRadius: 4, fontWeight: "bold", fontSize: "12px" }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Link href={`/track?ref=${b.id}`} className="btn btn-primary btn-xs">
                            Track Status 📍
                          </Link>
                          {b.status === "COMPLETED" && (
                            <button
                              onClick={() => openReviewModal(b)}
                              className="btn btn-xs"
                              style={{ background: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", border: "1px solid #F59E0B", fontWeight: 700 }}
                            >
                              Rate & Review ⭐
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Rate & Review Modal */}
      {activeReviewBooking && (
        <RateReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          bookingId={activeReviewBooking.id}
          serviceName={activeReviewBooking.service}
          artisanName={activeReviewBooking.pro}
          onReviewSubmitted={fetchRealCustomerBookings}
        />
      )}
    </div>
  );
}
