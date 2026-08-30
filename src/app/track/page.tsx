"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Clock, ShieldCheck, Phone, MessageSquare, CheckCircle2,
  Navigation, AlertTriangle, Key, Star, Car, ArrowRight, UserCheck, Shield, Award, Camera,
  Wrench, DollarSign, Wallet, CreditCard, ExternalLink, RefreshCw, X, Copy, Check, MessageCircle
} from "lucide-react";
import { RateReviewModal } from "@/components/common/RateReviewModal";
import { getArtisanContactChannels, syncCommunicationWithConcierge } from "@/lib/artisan-contact";

function TrackContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [interventionRequested, setInterventionRequested] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Replacement Part Authorization State
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [partAction, setPartAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [partPaymentMethod, setPartPaymentMethod] = useState<"PAYSTACK" | "WALLET">("WALLET");
  const [rejectionNote, setRejectionNote] = useState("");
  const [processingPart, setProcessingPart] = useState(false);
  const [partFeedback, setPartFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const initialRef = searchParams.get("reference") || searchParams.get("ref") || searchParams.get("id") || "";

  const handleAuthorizePart = async () => {
    if (!selectedPart) return;
    setProcessingPart(true);
    setPartFeedback(null);

    try {
      const res = await fetch("/api/parts/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: selectedPart.id,
          action: partAction,
          rejectionReason: rejectionNote,
          paymentMethod: partPaymentMethod,
          paymentReference: `PAY-PART-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPartFeedback({
          type: "success",
          msg: partAction === "APPROVE"
            ? `Part authorized successfully! Purchase voucher issued: ${data.part?.voucherCode || ""}`
            : "Part replacement request declined.",
        });
        setTimeout(() => {
          setPartModalOpen(false);
          fetchBookingTrack(query);
        }, 1800);
      } else {
        setPartFeedback({ type: "error", msg: data.error || "Failed to process authorization." });
      }
    } catch (err: any) {
      setPartFeedback({ type: "error", msg: "Network connection error. Please try again." });
    } finally {
      setProcessingPart(false);
    }
  };

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

            {/* Replacement Parts Management & Authorization Module */}
            {booking.replacementParts && booking.replacementParts.length > 0 && (
              <div className="card" style={{ background: "rgba(15, 23, 42, 0.95)", border: "2px solid #8B5CF6", boxShadow: "0 10px 30px rgba(139, 92, 246, 0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3 className="h4" style={{ margin: 0, color: "#C084FC", display: "flex", alignItems: "center", gap: 8 }}>
                      <Wrench size={22} color="#A855F7" /> Replacement Parts & Procurement
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                      Artisan on-site diagnosed replacement components for your property.
                    </p>
                  </div>
                  <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, background: "rgba(16,185,129,0.15)", padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)" }}>
                    ⚡ Direct Supplier Settlement (Second Account)
                  </span>
                </div>

                {/* Zero Cash Safety Banner */}
                <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Shield size={18} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: "12px", color: "#A7F3D0", lineHeight: 1.5 }}>
                    <strong>Direct Merchant Settlement:</strong> Never pay artisans cash. When authorized, funds are credited directly to the verified supplier's merchant account, issuing an instant voucher so the artisan collects the authentic part without delay.
                  </span>
                </div>

                {/* List of Parts */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {booking.replacementParts.map((part: any) => {
                    let parsedEvidence: string[] = [];
                    try {
                      parsedEvidence = JSON.parse(part.evidencePhotos || "[]");
                    } catch {
                      if (part.evidencePhotos) parsedEvidence = [part.evidencePhotos];
                    }

                    return (
                      <div
                        key={part.id}
                        style={{
                          background: "var(--bg-tertiary)",
                          border: "1px solid var(--border-primary)",
                          borderRadius: "var(--radius-lg)",
                          padding: "16px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>{part.partName}</strong>
                              <span style={{ fontSize: "11px", color: "#A855F7", background: "rgba(168,85,247,0.15)", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                                {part.category}
                              </span>
                            </div>
                            <span style={{ fontSize: "12px", color: "var(--text-tertiary)", display: "block", marginTop: 2 }}>
                              Ref: {part.reference} • Qty: {part.quantity}
                            </span>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "16px", fontWeight: 800, color: "#10B981" }}>
                              ₦{Number(part.approvedCost || part.estimatedCost || 0).toLocaleString()}
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 6,
                                display: "inline-block",
                                marginTop: 4,
                                background:
                                  part.status === "REQUESTED"
                                    ? "rgba(245,158,11,0.2)"
                                    : part.status === "VOUCHER_ISSUED" || part.status === "PURCHASED"
                                    ? "rgba(14,165,233,0.2)"
                                    : part.status === "INSTALLED_VERIFIED"
                                    ? "rgba(16,185,129,0.2)"
                                    : "rgba(239,68,68,0.2)",
                                color:
                                  part.status === "REQUESTED"
                                    ? "#F59E0B"
                                    : part.status === "VOUCHER_ISSUED" || part.status === "PURCHASED"
                                    ? "#38BDF8"
                                    : part.status === "INSTALLED_VERIFIED"
                                    ? "#10B981"
                                    : "#EF4444",
                              }}
                            >
                              {part.status === "REQUESTED" && "⏳ Pending Your Authorization"}
                              {part.status === "VOUCHER_ISSUED" && "🎟️ Voucher Issued to Supplier"}
                              {part.status === "PURCHASED" && "🛒 Collected from Supplier"}
                              {part.status === "INSTALLED_VERIFIED" && "✨ Installed & Verified"}
                              {part.status === "REJECTED" && "❌ Rejected by Customer"}
                            </span>
                          </div>
                        </div>

                        {/* Reason / Diagnosis */}
                        <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: 12, background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 6 }}>
                          <strong>Artisan Diagnosis:</strong> {part.reason}
                          {part.description && <span style={{ display: "block", marginTop: 2 }}>{part.description}</span>}
                        </div>

                        {/* Damaged Part Photo Preview */}
                        {parsedEvidence.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <span style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: 6, fontWeight: 600 }}>
                              📸 Damaged Component Photo Evidence:
                            </span>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {parsedEvidence.map((photoUrl, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setPreviewPhotoUrl(photoUrl)}
                                  style={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    border: "1px solid rgba(139,92,246,0.4)",
                                    cursor: "pointer",
                                    background: "#000",
                                  }}
                                >
                                  <img src={photoUrl} alt="Damaged Part Evidence" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Voucher Code info if issued */}
                        {part.voucherCode && (
                          <div style={{ background: "rgba(14,165,233,0.1)", border: "1px dashed #0EA5E9", borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                            <div>
                              <span style={{ fontSize: "10.5px", color: "#38BDF8", display: "block", fontWeight: 700 }}>AUTHORIZED PROCUREMENT VOUCHER</span>
                              <strong style={{ fontSize: "14px", color: "#F8FAFC", fontFamily: "monospace", letterSpacing: 1 }}>{part.voucherCode}</strong>
                            </div>
                            <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                              Supplier: <strong>{part.supplier?.name || "Verified Partner Hub"}</strong>
                            </div>
                          </div>
                        )}

                        {/* Actions for Pending Requests */}
                        {part.status === "REQUESTED" && (
                          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                            <button
                              onClick={() => {
                                setSelectedPart(part);
                                setPartAction("APPROVE");
                                setPartModalOpen(true);
                                setPartFeedback(null);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ background: "#10B981", borderColor: "#10B981", color: "#FFFFFF", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
                            >
                              <CheckCircle2 size={16} /> Approve & Fund Part (₦{Number(part.estimatedCost).toLocaleString()})
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPart(part);
                                setPartAction("REJECT");
                                setPartModalOpen(true);
                                setPartFeedback(null);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ color: "#EF4444", borderColor: "rgba(239,68,68,0.4)" }}
                            >
                              <X size={16} /> Decline Request
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                        <span>{Number(booking.artisan.rating || 4.5).toFixed(1)} Rating</span>
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
                  {(() => {
                    const channels = getArtisanContactChannels(booking.artisan, booking);
                    const handleWhatsAppAction = (e: React.MouseEvent) => {
                      e.preventDefault();
                      window.open(channels.whatsappUrl, "_blank", "noopener,noreferrer");
                      setContactModalOpen(true);
                      syncCommunicationWithConcierge({
                        bookingRef: booking.id,
                        clientName: booking.customerName,
                        clientPhone: booking.customerPhone,
                        artisanName: channels.artisanName,
                        artisanPhone: channels.displayNumber,
                        serviceName: booking.serviceName,
                        messageCopy: channels.prewrittenMessage,
                        channel: "WHATSAPP",
                      });
                    };

                    const handleSmsAction = () => {
                      syncCommunicationWithConcierge({
                        bookingRef: booking.id,
                        clientName: booking.customerName,
                        clientPhone: booking.customerPhone,
                        artisanName: channels.artisanName,
                        artisanPhone: channels.displayNumber,
                        serviceName: booking.serviceName,
                        messageCopy: channels.prewrittenMessage,
                        channel: "SMS",
                      });
                    };

                    const handleCallAction = () => {
                      syncCommunicationWithConcierge({
                        bookingRef: booking.id,
                        clientName: booking.customerName,
                        clientPhone: booking.customerPhone,
                        artisanName: channels.artisanName,
                        artisanPhone: channels.displayNumber,
                        serviceName: booking.serviceName,
                        messageCopy: channels.prewrittenMessage,
                        channel: "CALL",
                      });
                    };

                    return (
                      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
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
                          href={channels.callUrl}
                          onClick={handleCallAction}
                          className="btn btn-primary btn-md"
                          title={`Call ${channels.artisanName} (${channels.displayNumber})`}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                        >
                          <Phone size={16} /> Call Artisan
                        </a>
                        <button
                          type="button"
                          onClick={handleWhatsAppAction}
                          className="btn btn-whatsapp btn-md"
                          style={{
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            cursor: "pointer",
                          }}
                          title={`Chat with ${channels.artisanName} on WhatsApp (${channels.whatsappNumber})`}
                        >
                          <MessageSquare size={16} color="#FFFFFF" /> WhatsApp
                        </button>
                        <a
                          href={channels.smsUrl}
                          onClick={handleSmsAction}
                          className="btn btn-secondary btn-md"
                          style={{
                            color: "#38BDF8",
                            borderColor: "rgba(56,189,248,0.4)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          title="Send SMS text message with pre-written text"
                        >
                          <MessageCircle size={16} /> SMS Text
                        </a>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ padding: "var(--space-3) var(--space-4)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)", fontSize: "var(--fs-xs)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Navigation size={16} color="#0EA5E9" />
                  <span>Artisan Live GPS Hub: <strong>{booking.artisan.locationName}</strong></span>
                </div>
              </div>
            )}

            {/* Verified Job Execution Proof Photos (Before & After) */}
            {((booking.beforePhoto && !brokenImages["before"]) || (booking.afterPhoto && !brokenImages["after"])) && (
              <div className="card" style={{ background: "rgba(15, 23, 42, 0.95)", border: "1.5px solid rgba(14, 165, 233, 0.35)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <h3 className="h4" style={{ margin: 0, color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
                    <Camera size={18} color="#0EA5E9" /> Verified Work Execution Evidence
                  </h3>
                  <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, background: "rgba(16,185,129,0.15)", padding: "3px 8px", borderRadius: 6 }}>
                    🛡️ Escrow Cloud Verified
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                  {booking.beforePhoto && !brokenImages["before"] && (
                    <div
                      onClick={() => setPreviewPhotoUrl(booking.beforePhoto)}
                      style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 12, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}
                    >
                      <span style={{ fontSize: "11px", color: "#38BDF8", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        📸 Before-Work Inspection (Click to Zoom)
                      </span>
                      <div style={{ width: "100%", height: "160px", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(14,165,233,0.3)" }}>
                        <img
                          src={booking.beforePhoto}
                          alt="Before Work Inspection"
                          onError={() => setBrokenImages((prev) => ({ ...prev, before: true }))}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    </div>
                  )}
                  {booking.afterPhoto && !brokenImages["after"] && (
                    <div
                      onClick={() => setPreviewPhotoUrl(booking.afterPhoto)}
                      style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 12, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}
                    >
                      <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        ✨ Completed Work Proof (Click to Zoom)
                      </span>
                      <div style={{ width: "100%", height: "160px", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <img
                          src={booking.afterPhoto}
                          alt="Completed Work Proof"
                          onError={() => setBrokenImages((prev) => ({ ...prev, after: true }))}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    </div>
                  )}
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
            <div style={{ textAlign: "center", marginTop: "var(--space-4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                Need help with your dispatch?
              </span>
              <a
                href="tel:+2348122222936"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0EA5E9",
                  background: "rgba(14, 165, 233, 0.1)",
                  border: "1px solid rgba(14, 165, 233, 0.3)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  textDecoration: "none",
                }}
                title="Call 24/7 Support Hotline"
              >
                <Phone size={12} />
                <span>Call 24/7 Support Hotline</span>
              </a>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {previewPhotoUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div style={{ maxWidth: "800px", maxHeight: "85vh", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhotoUrl}
              alt="Execution Evidence Preview"
              style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: 12, border: "2px solid #334155" }}
            />
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              style={{
                position: "absolute",
                top: -12,
                right: -12,
                background: "#EF4444",
                color: "white",
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

      {/* Artisan Direct Contact & Fallback Hub Modal */}
      {contactModalOpen && booking?.artisan && (() => {
        const channels = getArtisanContactChannels(booking.artisan, booking);

        const handleCopy = () => {
          navigator.clipboard.writeText(channels.prewrittenMessage);
          setCopiedMessage(true);
          setTimeout(() => setCopiedMessage(false), 2500);
        };

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setContactModalOpen(false)}
          >
            <div
              style={{
                background: "var(--bg-elevated)",
                borderRadius: 20,
                border: "1.5px solid rgba(37, 211, 102, 0.4)",
                padding: "24px 28px",
                maxWidth: 540,
                width: "100%",
                boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
                color: "var(--text-primary)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "rgba(37, 211, 102, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <MessageSquare size={20} color="#25D366" />
                  </div>
                  <div>
                    <h3 className="h4" style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>
                      Contact Assigned Artisan
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Direct communication channel for {channels.artisanName}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Artisan Profile Snapshot */}
              <div style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                borderRadius: 14,
                padding: "14px 16px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {booking.artisan.avatar ? (
                    <img
                      src={booking.artisan.avatar}
                      alt={channels.artisanName}
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #10B981" }}
                    />
                  ) : (
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0EA5E9, #8B5CF6)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}>
                      {channels.artisanName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <strong style={{ fontSize: "14px", display: "block", color: "var(--text-primary)" }}>
                      {channels.artisanName}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#38BDF8", fontFamily: "monospace" }}>
                      📞 {channels.displayNumber}
                    </span>
                  </div>
                </div>
                <span style={{
                  padding: "4px 10px",
                  background: "rgba(16,185,129,0.15)",
                  color: "#10B981",
                  borderRadius: 99,
                  fontSize: "11px",
                  fontWeight: 700,
                }}>
                  VERIFIED PRO
                </span>
              </div>

              {/* Pre-written Message Box */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                    Pre-written Message for Artisan:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    style={{
                      background: "none",
                      border: "none",
                      color: copiedMessage ? "#10B981" : "#38BDF8",
                      fontSize: "12px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                    }}
                  >
                    {copiedMessage ? <Check size={14} /> : <Copy size={14} />}
                    {copiedMessage ? "Copied!" : "Copy Text"}
                  </button>
                </div>
                <div style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: "13px",
                  color: "#E2E8F0",
                  lineHeight: 1.5,
                  fontFamily: "sans-serif",
                }}>
                  "{channels.prewrittenMessage}"
                </div>
              </div>

              {/* Proactive Dispute Protection Banner */}
              <div style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(14, 165, 233, 0.12) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <ShieldCheck size={22} color="#10B981" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.45 }}>
                  <strong style={{ color: "#10B981", display: "block" }}>🛡️ HandyHub Dispute Prevention & Concierge Shield Active</strong>
                  A copy of this communication session is automatically forwarded to HandyHub Support Concierge (<code>wa.me/2348122222936</code>) for proactive monitoring and fast dispute mediation before any escalation.
                </div>
              </div>

              {/* Direct Channels & Fallback Options */}
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 10 }}>
                  Artisan not registered on WhatsApp or unreachable? Try these direct fallback channels:
                </span>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  {/* WhatsApp Primary */}
                  <a
                    href={channels.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      syncCommunicationWithConcierge({
                        bookingRef: booking.id,
                        clientName: booking.customerName,
                        clientPhone: booking.customerPhone,
                        artisanName: channels.artisanName,
                        artisanPhone: channels.displayNumber,
                        serviceName: booking.serviceName,
                        messageCopy: channels.prewrittenMessage,
                        channel: "WHATSAPP",
                      });
                    }}
                    className="btn btn-whatsapp btn-md"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <MessageSquare size={18} color="#FFFFFF" /> Open WhatsApp Chat ({channels.whatsappNumber})
                  </a>

                  {/* SMS Text Fallback */}
                  <a
                    href={channels.smsUrl}
                    onClick={() => {
                      syncCommunicationWithConcierge({
                        bookingRef: booking.id,
                        clientName: booking.customerName,
                        clientPhone: booking.customerPhone,
                        artisanName: channels.artisanName,
                        artisanPhone: channels.displayNumber,
                        serviceName: booking.serviceName,
                        messageCopy: channels.prewrittenMessage,
                        channel: "SMS",
                      });
                    }}
                    className="btn btn-secondary btn-md"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      background: "rgba(56, 189, 248, 0.12)",
                      borderColor: "#38BDF8",
                      color: "#38BDF8",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <MessageCircle size={16} /> Send SMS Text Message (Pre-written Text Included)
                  </a>

                  {/* Direct Phone Call Fallback */}
                  <a
                    href={channels.callUrl}
                    onClick={() => {
                      syncCommunicationWithConcierge({
                        bookingRef: booking.id,
                        clientName: booking.customerName,
                        clientPhone: booking.customerPhone,
                        artisanName: channels.artisanName,
                        artisanPhone: channels.displayNumber,
                        serviceName: booking.serviceName,
                        messageCopy: channels.prewrittenMessage,
                        channel: "CALL",
                      });
                    }}
                    className="btn btn-primary btn-md"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Phone size={16} /> Direct Voice Call ({channels.displayNumber})
                  </a>

                  {/* Urgent Dispute Intervention Action */}
                  <button
                    type="button"
                    disabled={interventionRequested}
                    onClick={async () => {
                      setInterventionRequested(true);
                      await syncCommunicationWithConcierge({
                        bookingRef: booking.id,
                        clientName: booking.customerName,
                        clientPhone: booking.customerPhone,
                        artisanName: channels.artisanName,
                        artisanPhone: channels.displayNumber,
                        serviceName: booking.serviceName,
                        messageCopy: channels.prewrittenMessage,
                        channel: "INTERVENTION_REQUEST",
                        isUrgent: true,
                      });
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      background: interventionRequested ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.12)",
                      borderColor: interventionRequested ? "#10B981" : "#EF4444",
                      color: interventionRequested ? "#10B981" : "#EF4444",
                      fontWeight: 700,
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {interventionRequested ? (
                      <>
                        <CheckCircle2 size={16} color="#10B981" /> Urgent Dispute Alert Logged with Support Concierge Desk
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={16} color="#EF4444" /> Request Immediate Concierge Dispute Intervention
                      </>
                    )}
                  </button>

                  {/* Platform Concierge Support Hotline */}
                  <a
                    href={channels.conciergeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: 4,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "transparent",
                      border: "1px dashed var(--border-primary)",
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      textAlign: "center",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <ShieldCheck size={14} color="#10B981" /> Open HandyHub 24/7 Priority Support Hotline Directly
                  </a>
                </div>
              </div>

              {/* Close Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ width: "100%" }}
                >
                  Close Communication Hub
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Replacement Part Authorization & Rejection Modal */}
      {partModalOpen && selectedPart && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => !processingPart && setPartModalOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-elevated)",
              borderRadius: 16,
              border: `1.5px solid ${partAction === "APPROVE" ? "#10B981" : "#EF4444"}`,
              padding: 24,
              maxWidth: 500,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              color: "var(--text-primary)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="h4" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: partAction === "APPROVE" ? "#10B981" : "#EF4444" }}>
                {partAction === "APPROVE" ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                {partAction === "APPROVE" ? "Authorize Part Replacement" : "Decline Part Request"}
              </h3>
              <button
                onClick={() => setPartModalOpen(false)}
                disabled={processingPart}
                style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Part summary */}
            <div style={{ background: "var(--bg-tertiary)", padding: 14, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <strong style={{ fontSize: "15px" }}>{selectedPart.partName}</strong>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#10B981" }}>
                  ₦{Number(selectedPart.estimatedCost).toLocaleString()}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>
                Ref: {selectedPart.reference} • Qty: {selectedPart.quantity} • Category: {selectedPart.category}
              </span>
              <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: "6px 0 0" }}>
                Diagnosis: {selectedPart.reason}
              </p>
            </div>

            {partAction === "APPROVE" ? (
              <div>
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: "12px", color: "#34D399", display: "block", lineHeight: 1.5 }}>
                    ⚡ <strong>Direct Supplier Settlement:</strong> Payment is routed to our <strong>Dedicated Procurement Account</strong> for instant disbursement to the verified merchant. A <strong>single-use digital voucher</strong> is issued so your artisan collects the part immediately. Zero cash to artisan.
                  </span>
                </div>

                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Select Payment Method:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => setPartPaymentMethod("WALLET")}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: `2px solid ${partPaymentMethod === "WALLET" ? "#10B981" : "var(--border-primary)"}`,
                      background: partPaymentMethod === "WALLET" ? "rgba(16,185,129,0.15)" : "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <Wallet size={20} color={partPaymentMethod === "WALLET" ? "#10B981" : "var(--text-secondary)"} />
                    HandyHub Wallet
                  </button>

                  <button
                    type="button"
                    onClick={() => setPartPaymentMethod("PAYSTACK")}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: `2px solid ${partPaymentMethod === "PAYSTACK" ? "#0EA5E9" : "var(--border-primary)"}`,
                      background: partPaymentMethod === "PAYSTACK" ? "rgba(14,165,233,0.15)" : "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <CreditCard size={20} color={partPaymentMethod === "PAYSTACK" ? "#0EA5E9" : "var(--text-secondary)"} />
                    Paystack / Card
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Reason for Rejection:
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="e.g. Existing part is still functional, will provide own part, price too high..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: 8,
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                />
              </div>
            )}

            {/* Feedback Message */}
            {partFeedback && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 14,
                  fontSize: "12px",
                  background: partFeedback.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                  color: partFeedback.type === "success" ? "#10B981" : "#EF4444",
                  border: `1px solid ${partFeedback.type === "success" ? "#10B981" : "#EF4444"}`,
                }}
              >
                {partFeedback.msg}
              </div>
            )}

            {/* Submit Button */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setPartModalOpen(false)}
                disabled={processingPart}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAuthorizePart}
                disabled={processingPart}
                className="btn btn-primary btn-md"
                style={{
                  background: partAction === "APPROVE" ? "#10B981" : "#EF4444",
                  borderColor: partAction === "APPROVE" ? "#10B981" : "#EF4444",
                }}
              >
                {processingPart ? "Processing..." : partAction === "APPROVE" ? `Confirm & Pay ₦${Number(selectedPart.estimatedCost).toLocaleString()}` : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
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
