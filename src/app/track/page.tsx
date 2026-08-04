"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Clock, ShieldCheck, Phone, MessageSquare, CheckCircle2,
  Navigation, AlertTriangle, Key, Star, Car, ArrowRight, UserCheck, Shield
} from "lucide-react";

function TrackContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<any>(null);

  const initialRef = searchParams.get("reference") || searchParams.get("ref") || searchParams.get("id") || "";

  useEffect(() => {
    if (initialRef) {
      setQuery(initialRef);
      fetchBookingTrack(initialRef);
    } else {
      // Default to sample trackable booking HHP-M1K9X for immediate demonstration
      fetchBookingTrack("HHP-M1K9X");
    }
  }, [initialRef]);

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
                placeholder="Enter Reference (e.g. HHP-M1K9X) or Phone Number..."
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
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ minWidth: 160 }}>
              {loading ? "Locating..." : "Track Order"}
            </button>
          </form>

          {/* Quick Demo Reference Suggestions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "var(--space-3)", fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", flexWrap: "wrap" }}>
            <span>Quick Sample Tracks:</span>
            {["HHP-M1K9X", "HHP-N2L0Y", "HHP-O3M1Z"].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  fetchBookingTrack(sample);
                }}
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", padding: "3px 10px", borderRadius: 99, color: "#0EA5E9", cursor: "pointer" }}
              >
                {sample}
              </button>
            ))}
          </div>
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

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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

            {/* OTP Security Verification Code Card */}
            <div className="card" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(249,115,22,0.12) 100%)", border: "1.5px solid rgba(14,165,233,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-4)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0EA5E9", fontWeight: "bold", fontSize: "var(--fs-sm)" }}>
                    <Key size={18} /> Job Checkmate Security OTP Code
                  </div>
                  <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", marginTop: 4 }}>
                    Share this 4-digit OTP code with your professional ONLY when they arrive at your property.
                  </p>
                </div>
                <div style={{ padding: "10px 24px", background: "var(--bg-elevated)", border: "2px dashed #0EA5E9", borderRadius: "var(--radius-xl)", textAlign: "center" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-tertiary)", display: "block", letterSpacing: 1 }}>YOUR OTP CODE</span>
                  <strong style={{ fontSize: "1.75rem", letterSpacing: 6, color: "#0EA5E9", fontFamily: "var(--font-mono)" }}>
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
                  <img
                    src={booking.artisan.avatar}
                    alt={booking.artisan.name}
                    style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2.5px solid #0EA5E9" }}
                  />

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 className="h4" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {booking.artisan.name}
                      <span style={{ padding: "2px 8px", background: "rgba(16,185,129,0.15)", color: "#10B981", borderRadius: 99, fontSize: "10px", fontWeight: "bold" }}>
                        VERIFIED PRO
                      </span>
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "var(--fs-xs)", color: "var(--text-secondary)", marginTop: 4 }}>
                      <span style={{ color: "#F59E0B", fontWeight: "bold", display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={14} fill="#F59E0B" /> {booking.artisan.rating} Rating
                      </span>
                      <span>• {booking.artisan.totalJobs} Jobs Completed</span>
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <Car size={14} color="#0EA5E9" /> {booking.artisan.vehicle}
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
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
