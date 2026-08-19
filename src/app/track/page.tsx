"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Clock, ShieldCheck, Phone, MessageSquare, CheckCircle2,
  Navigation, AlertTriangle, Key, Star, Car, ArrowRight, UserCheck, Shield, Award
} from "lucide-react";
import { RateReviewModal } from "@/components/common/RateReviewModal";

function TrackContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const initialRef = searchParams.get("reference") || searchParams.get("ref") || searchParams.get("id") || "";

  const fetchBookingTrack = async (searchQuery: string) => {
    if (!searchQuery) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/track?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (res.ok && data.booking) {
        setBooking(data.booking);
      } else {
        setError(data.error || "No active booking found for this reference code.");
        setBooking(null);
      }
    } catch {
      setError("Network error fetching tracking status. Please try again.");
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedRef = typeof window !== "undefined" ? localStorage.getItem("handyhub_last_booking_ref") : "";
    const targetRef = initialRef || savedRef || "";
    if (targetRef) {
      setQuery(targetRef);
      fetchBookingTrack(targetRef);
    }
  }, [initialRef]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookingTrack(query);
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "var(--space-12) 0 var(--space-20)" }}>
      <div className="container" style={{ maxWidth: 960 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
          <span className="badge" style={{ background: "rgba(14,165,233,0.15)", color: "#0EA5E9", marginBottom: "var(--space-3)" }}>
            Real-Time GPS & Artisan Dispatch Tracker
          </span>
          <h1 className="h1" style={{ marginBottom: "var(--space-3)" }}>Track My Booking Status</h1>
          <p style={{ fontSize: "var(--fs-lg)", color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto" }}>
            Enter your Booking Reference Number or Phone Number to monitor live artisan dispatch, ETA, and job verification.
          </p>
        </div>

        {/* Search Bar */}
        <div className="card" style={{ padding: "var(--space-4)", marginBottom: "var(--space-10)", boxShadow: "var(--shadow-xl)" }}>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
              <Search size={20} color="var(--text-tertiary)" style={{ position: "absolute", left: 16, top: 14 }} />
              <input
                type="text"
                placeholder="Enter Booking Reference Code (e.g., HHP-XXXXX) or Phone Number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: 48,
                  paddingLeft: 48,
                  paddingRight: 16,
                  background: "var(--bg-tertiary)",
                  border: "1.5px solid var(--border-primary)",
                  borderRadius: "var(--radius-lg)",
                  color: "var(--text-primary)",
                  fontSize: "var(--fs-base)",
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ minWidth: 160, background: "#0EA5E9" }}>
              {loading ? "Locating..." : "Track Order"}
            </button>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="card" style={{ borderLeft: "4px solid #EF4444", marginBottom: "var(--space-8)", padding: "var(--space-4) var(--space-6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#EF4444" }}>
              <AlertTriangle size={24} />
              <div>
                <strong style={{ display: "block" }}>Booking Not Found</strong>
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Booking Tracking Details */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}
          >
            {/* Top Status Card */}
            <div className="card" style={{ borderTop: "4px solid #0EA5E9" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-4)", marginBottom: "var(--space-6)", borderBottom: "1px solid var(--border-primary)", paddingBottom: "var(--space-4)" }}>
                <div>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                    Reference Code
                  </span>
                  <h2 className="h3" style={{ color: "#0EA5E9" }}>{booking.id}</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Link
                    href={`/receipt/${encodeURIComponent(booking.id)}`}
                    className="btn btn-secondary btn-sm"
                    style={{
                      background: "#1E293B",
                      color: "#10B981",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                      padding: "6px 14px",
                      borderRadius: 99,
                      fontSize: "var(--fs-xs)",
                      fontWeight: "bold",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>🧾</span> View Payment Receipt
                  </Link>
                  <div style={{ padding: "6px 14px", background: "rgba(16,185,129,0.15)", color: "#10B981", borderRadius: 99, fontSize: "var(--fs-xs)", fontWeight: "bold" }}>
                    {booking.paymentStatus}
                  </div>
                  <div style={{ padding: "6px 14px", background: "rgba(14,165,233,0.15)", color: "#0EA5E9", borderRadius: 99, fontSize: "var(--fs-xs)", fontWeight: "bold" }}>
                    ETA: ~{booking.etaMinutes} mins
                  </div>
                </div>
              </div>

              {/* Service & Customer Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block" }}>Requested Service</span>
                  <strong style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)" }}>{booking.serviceName}</strong>
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block" }}>Service Location</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", color: "var(--text-primary)" }}>
                    <MapPin size={16} color="#0EA5E9" />
                    <span>{booking.serviceAddress}</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block" }}>Scheduled Time</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", color: "var(--text-primary)" }}>
                    <Clock size={16} color="#F59E0B" />
                    <span>{booking.scheduledDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate & Review Prompt for Completed Job */}
            {booking.status === "COMPLETED" && (
              <div className="card" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(14,165,233,0.15) 100%)", border: "2px solid #F59E0B" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <h3 className="h4" style={{ color: "#F59E0B", display: "flex", alignItems: "center", gap: 8, margin: "0 0 4px 0" }}>
                      <Award size={22} /> Job Completed! How was your experience?
                    </h3>
                    <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: 0 }}>
                      Rate your assigned professional and leave a verified client review.
                    </p>
                  </div>
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="btn btn-primary btn-md"
                    style={{ background: "#F59E0B", borderColor: "#F59E0B", color: "#0F172A", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Star size={18} fill="#0F172A" /> Rate & Review Artisan ⭐
                  </button>
                </div>
              </div>
            )}

            {/* OTP Security Verification Code Card */}
            <div className="card" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(16,185,129,0.12) 100%)", border: "1.5px solid #0EA5E9" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-4)" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0EA5E9", fontWeight: "bold", fontSize: "var(--fs-base)" }}>
                    <Key size={20} /> On-Site OTP Checkmate Verification Code
                  </div>
                  <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5 }}>
                    This 4-digit code is exclusively for you. <strong>Only provide this code to your artisan after you have inspected and are satisfied with the completed work</strong> to authorize escrow payout.
                  </p>
                </div>
                <div style={{ padding: "12px 28px", background: "var(--bg-elevated)", border: "2px dashed #0EA5E9", borderRadius: "var(--radius-xl)", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", letterSpacing: 1.5, fontWeight: 700 }}>YOUR COMPLETION OTP</span>
                  <strong style={{ fontSize: "2rem", letterSpacing: 8, color: "#0EA5E9", fontFamily: "var(--font-mono)", display: "block", marginTop: 2 }}>
                    {booking.otpCode}
                  </strong>
                </div>
              </div>
            </div>

            {/* Assigned Artisan Card */}
            {booking.artisan && (
              <div className="card">
                <h3 className="h4" style={{ marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: 8 }}>
                  <UserCheck size={20} color="#10B981" /> Assigned Professional Partner
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-6)" }}>
                  {booking.artisan.avatar ? (
                    <img
                      src={booking.artisan.avatar}
                      alt={booking.artisan.name}
                      style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2.5px solid #0EA5E9" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #0EA5E9, #8B5CF6)",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        fontWeight: "bold",
                        border: "2.5px solid #0EA5E9",
                        flexShrink: 0,
                      }}
                    >
                      {booking.artisan.name
                        .split(" ")
                        .map((w: string) => w.charAt(0))
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "KK"}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 className="h4" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {booking.artisan.name}
                      <span style={{ padding: "2px 8px", background: "rgba(16,185,129,0.15)", color: "#10B981", borderRadius: 99, fontSize: "10px", fontWeight: "bold" }}>
                        VERIFIED PRO
                      </span>
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--fs-xs)", color: "var(--text-secondary)", marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ color: "#F59E0B", fontWeight: "bold", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ display: "inline-flex", gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              fill={s <= Math.round(Number(booking.artisan.rating) || 5) ? "#F59E0B" : "transparent"}
                              color={s <= Math.round(Number(booking.artisan.rating) || 5) ? "#F59E0B" : "rgba(245,158,11,0.3)"}
                            />
                          ))}
                        </span>
                        <span>{Number(booking.artisan.rating || 5.0).toFixed(1)} Rating</span>
                      </span>
                      <span>• {booking.artisan.totalJobs} Jobs Completed</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "var(--fs-xs)",
                        color: "#38BDF8",
                        background: "rgba(14, 165, 233, 0.12)",
                        border: "1px solid rgba(14, 165, 233, 0.35)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5
                      }}>
                        <ShieldCheck size={14} color="#0EA5E9" /> {booking.artisan.digitalId ? `Digital ID: ${booking.artisan.digitalId}` : (booking.artisan.vehicle || "Verified Digital ID")}
                      </span>
                      <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        🛡️ Authenticated Partner
                      </span>
                    </div>
                  </div>

                  {/* Direct Contact & Rating Buttons */}
                  <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setReviewModalOpen(true)}
                      className="btn btn-secondary btn-md"
                      style={{ color: "#F59E0B", borderColor: "rgba(245,158,11,0.5)", display: "inline-flex", alignItems: "center", gap: 6 }}
                      title="Rate & Review Artisan"
                    >
                      <Star size={16} fill="#F59E0B" /> Rate Artisan
                    </button>
                    <a
                      href={`tel:${booking.artisan.phone}`}
                      className="btn btn-primary btn-md"
                      title="Call Professional"
                    >
                      <Phone size={16} /> Call Artisan
                    </a>
                    <a
                      href={`https://wa.me/2348122222936?text=Hello%20${encodeURIComponent(booking.artisan.name)},%20inquiring%20about%20booking%20${booking.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-md"
                      style={{ color: "#25D366", borderColor: "rgba(37,211,102,0.4)" }}
                      title="WhatsApp Artisan"
                    >
                      <MessageSquare size={16} /> WhatsApp
                    </a>
                  </div>
                </div>

                <div style={{ padding: "var(--space-3) var(--space-4)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)", fontSize: "var(--fs-xs)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Navigation size={16} color="#0EA5E9" />
                  <span>Artisan Live GPS Hub: <strong>{booking.artisan.locationName}</strong></span>
                </div>
              </div>
            )}

            {/* Stepper Progress Timeline */}
            <div className="card">
              <h3 className="h4" style={{ marginBottom: "var(--space-6)" }}>Live Job Execution Timeline</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {booking.timeline.map((item: any) => (
                  <div
                    key={item.step}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "var(--space-4)",
                      padding: "var(--space-3) var(--space-4)",
                      background: item.active ? "rgba(14,165,233,0.08)" : "var(--bg-tertiary)",
                      borderRadius: "var(--radius-lg)",
                      borderLeft: `4px solid ${item.done ? "#10B981" : item.active ? "#0EA5E9" : "var(--border-primary)"}`,
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: item.done ? "#10B981" : item.active ? "#0EA5E9" : "var(--border-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
                      {item.done ? <CheckCircle2 size={16} /> : item.step}
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong style={{ display: "block", fontSize: "var(--fs-sm)", color: item.active ? "#0EA5E9" : "var(--text-primary)" }}>
                        {item.title}
                      </strong>
                      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{item.time}</span>
                    </div>

                    {item.active && (
                      <span style={{ padding: "3px 10px", background: "rgba(14,165,233,0.15)", color: "#0EA5E9", borderRadius: 99, fontSize: "10px", fontWeight: "bold" }}>
                        CURRENT STATUS
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Support Guarantee Footer */}
            <div style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                Need help with your dispatch? <a href="tel:+2348122222936" style={{ color: "#0EA5E9", textDecoration: "underline" }}>Call 24/7 Support Hotline (+234 812 222 2936)</a>
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Rate & Review Modal */}
      {booking && (
        <RateReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          bookingId={booking.id}
          serviceName={booking.serviceName}
          artisanName={booking.artisan?.name || "HandyHub Professional"}
          onReviewSubmitted={() => fetchBookingTrack(query)}
        />
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Track Page...</div>}>
      <TrackContent />
    </Suspense>
  );
}
