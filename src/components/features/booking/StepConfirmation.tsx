"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle, Calendar, Clock, User, MapPin, Download, MessageCircle, ArrowRight } from "lucide-react";
import type { BookingData } from "@/app/book/page";
import styles from "./Steps.module.css";

interface Props {
  booking: BookingData;
}

export function StepConfirmation({ booking }: Props) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [bookingRef] = useState(() => `HHP-${Date.now().toString(36).toUpperCase()}`);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("handyhub_user");
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);

    async function saveBookingToDatabase() {
      try {
        localStorage.setItem("handyhub_last_booking_ref", bookingRef);

        const stored = typeof window !== "undefined" ? localStorage.getItem("handyhub_user") : null;
        const userObj = stored ? JSON.parse(stored) : null;

        await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: booking.serviceId || booking.serviceCategory,
            serviceCategory: booking.serviceCategory,
            serviceName: booking.serviceName || "Property Maintenance",
            customerEmail: userObj?.email || "customer@handyhubpro.ng",
            propertyType: booking.propertyType || "HOME",
            bedrooms: booking.bedrooms || 1,
            bathrooms: booking.bathrooms || 1,
            specialNotes: booking.specialNotes,
            scheduledDate: booking.scheduledDate || new Date().toISOString(),
            scheduledTime: booking.scheduledTime || "09:00 AM",
            isEmergency: booking.isEmergency || false,
            address: booking.address || "Abuja, FCT, Nigeria",
            landmark: booking.landmark,
            paymentMethod: booking.paymentMethod || "paystack",
            promoCode: booking.promoCode,
            discountAmount: booking.discountAmount || 0,
            totalPrice: booking.totalPrice || booking.servicePrice || 15000,
            technicianId: booking.technicianId,
            autoAssign: booking.autoAssign ?? true,
          }),
        });
      } catch (err) {
        console.warn("Booking save warning:", err);
      }
    }

    saveBookingToDatabase();
    return () => clearTimeout(timer);
  }, [bookingRef, booking]);

  const finalPrice = (booking.totalPrice || booking.servicePrice || 15000) - booking.discountAmount;

  return (
    <div className={styles.confirmationContainer}>
      {/* Success Circle */}
      <motion.div
        className={styles.successCircle}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <CheckCircle size={48} />
        </motion.div>
      </motion.div>

      <motion.h2
        className={styles.confirmTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        Booking Confirmed! 🎉
      </motion.h2>

      <motion.p
        className={styles.confirmSubtitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Your booking has been successfully placed. Your security OTP and dispatch details have been generated.
      </motion.p>

      {/* Booking Reference */}
      <motion.div
        className={styles.refCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <span className={styles.refLabel}>Booking Reference</span>
        <span className={styles.refCode}>{bookingRef}</span>
      </motion.div>

      {/* Details Card */}
      <motion.div
        className={`card ${styles.confirmDetails}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <div className={styles.confirmRow}>
          <div className={styles.confirmRowIcon}><Calendar size={18} /></div>
          <div>
            <span className={styles.confirmRowLabel}>Date</span>
            <span className={styles.confirmRowValue}>
              {booking.scheduledDate || "Scheduled Date"}
            </span>
          </div>
        </div>
        <div className={styles.confirmRow}>
          <div className={styles.confirmRowIcon}><Clock size={18} /></div>
          <div>
            <span className={styles.confirmRowLabel}>Time</span>
            <span className={styles.confirmRowValue}>
              {booking.scheduledTime || "Scheduled Time"}
            </span>
          </div>
        </div>
        <div className={styles.confirmRow}>
          <div className={styles.confirmRowIcon}><User size={18} /></div>
          <div>
            <span className={styles.confirmRowLabel}>Professional</span>
            <span className={styles.confirmRowValue}>
              {booking.technicianName || "Auto-Assigned Verified Artisan"}
            </span>
          </div>
        </div>
        <div className={styles.confirmRow}>
          <div className={styles.confirmRowIcon}><MapPin size={18} /></div>
          <div>
            <span className={styles.confirmRowLabel}>Location</span>
            <span className={styles.confirmRowValue}>
              {booking.address || "Abuja, FCT, Nigeria"}
            </span>
          </div>
        </div>
        <div className={styles.confirmTotal}>
          <span>Total Paid</span>
          <span className={styles.confirmTotalAmount}>₦{Math.max(0, finalPrice).toLocaleString()}</span>
        </div>

        {currentUser && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-primary)", display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            {currentUser.permanentAddressStatus === "VERIFIED" ? (
              <>
                <span style={{ fontSize: "11px", fontWeight: "bold", background: "rgba(16,185,129,0.12)", color: "#10B981", padding: "3px 8px", borderRadius: 4 }}>🏡 Verified Booking Location</span>
                <span style={{ fontSize: "11px", fontWeight: "bold", background: "rgba(16,185,129,0.12)", color: "#10B981", padding: "3px 8px", borderRadius: 4 }}>🛡️ Identity Verified</span>
              </>
            ) : currentUser.permanentAddressStatus === "PENDING" ? (
              <span style={{ fontSize: "11px", fontWeight: "bold", background: "rgba(245,158,11,0.12)", color: "#F59E0B", padding: "3px 8px", borderRadius: 4 }}>⏳ Location Verification Pending</span>
            ) : null}
          </div>
        )}
      </motion.div>

      {/* Prominent Off-Platform Safety Warning Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        style={{
          background: "rgba(245,158,11,0.12)",
          border: "1.5px solid #F59E0B",
          borderRadius: "16px",
          padding: "16px 20px",
          margin: "20px 0",
          textAlign: "left",
        }}
      >
        <h4 style={{ margin: "0 0 6px", color: "#F59E0B", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          🛡️ CRITICAL SAFETY MANDATE: Keep Payments On-Platform!
        </h4>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px", lineHeight: 1.5 }}>
          For your protection, <strong>never pay cash or transact off-platform with artisans</strong>. All escrow guarantees, 14-day workmanship warranties, and customer support apply ONLY to transactions completed within HandyHub Pro. Paying cash off-platform voids all protections under Nigerian Law.
        </p>
      </motion.div>

      {/* WHAT TO DO NEXT — CLIENT SERVICE ROADMAP */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.35 }}
        style={{
          background: "var(--bg-tertiary, #1E293B)",
          border: "1px solid var(--border-primary, #334155)",
          borderRadius: "16px",
          padding: "24px 20px",
          margin: "20px 0",
          textAlign: "left",
        }}
      >
        <h4 style={{ margin: "0 0 4px", color: "#F8FAFC", fontSize: "16px", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
          🧭 What to Do Next (Your Service Roadmap)
        </h4>
        <p style={{ margin: "0 0 16px", color: "#94A3B8", fontSize: "13px" }}>
          Follow these 4 simple steps while our dispatch team prepares your verified artisan:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", display: "block", marginBottom: 4 }}>1. PAYMENT ESCROWED ✅</span>
            <span style={{ fontSize: 12, color: "#CBD5E1" }}>Your money is protected. The artisan is not paid until you inspect the work.</span>
          </div>

          <div style={{ background: "#0F172A", border: "1px solid rgba(14,165,233,0.4)", borderRadius: 10, padding: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", display: "block", marginBottom: 4 }}>2. ARTISAN MATCHING ⚡</span>
            <span style={{ fontSize: 12, color: "#CBD5E1" }}>Top-rated verified technician dispatched to your location within 15 minutes.</span>
          </div>

          <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", display: "block", marginBottom: 4 }}>3. VERIFY ID BADGE 📍</span>
            <span style={{ fontSize: 12, color: "#CBD5E1" }}>The artisan will call before arriving. Check their official digital ID badge.</span>
          </div>

          <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#A855F7", display: "block", marginBottom: 4 }}>4. RELEASE OTP 🛡️</span>
            <span style={{ fontSize: 12, color: "#CBD5E1" }}>Provide your 4-digit completion OTP only when 100% satisfied with the work.</span>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className={styles.confirmActions}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <Link href={`/receipt/${bookingRef}`} className="btn btn-primary btn-lg" style={{ background: "#10B981" }}>
          View Payment Receipt 🧾
        </Link>
        <Link href={`/track?ref=${bookingRef}`} className="btn btn-primary btn-lg" style={{ background: "#0EA5E9" }}>
          Track Your Booking Live 📍
          <ArrowRight size={18} />
        </Link>
        <a
          href={`https://wa.me/2348122222936?text=${encodeURIComponent(`Hello HandyHub Support! I just booked service ${booking.serviceName} (Ref: ${bookingRef}). Please confirm dispatch details.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-lg"
          style={{ background: "#22C55E", color: "#FFFFFF", border: "none" }}
        >
          WhatsApp Concierge 💬
        </a>
        <Link href="/dashboard" className="btn btn-secondary btn-lg" style={{ border: "1.5px solid var(--border-primary)", background: "transparent" }}>
          Go to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
