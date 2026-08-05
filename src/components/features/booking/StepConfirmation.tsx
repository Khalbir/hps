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

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    if (bookingRef) {
      try {
        localStorage.setItem("handyhub_last_booking_ref", bookingRef);
      } catch (err) {
        console.warn("LocalStorage save warning:", err);
      }
    }
    return () => clearTimeout(timer);
  }, [bookingRef]);

  const finalPrice = (booking.totalPrice || booking.servicePrice) - booking.discountAmount;

  return (
    <div className={styles.confirmationContainer}>
      {/* Success Animation */}
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
        Your booking has been successfully placed. A confirmation has been sent to your email.
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
              {booking.scheduledDate || "Not set"}
            </span>
          </div>
        </div>
        <div className={styles.confirmRow}>
          <div className={styles.confirmRowIcon}><Clock size={18} /></div>
          <div>
            <span className={styles.confirmRowLabel}>Time</span>
            <span className={styles.confirmRowValue}>
              {booking.scheduledTime || "Not set"}
            </span>
          </div>
        </div>
        <div className={styles.confirmRow}>
          <div className={styles.confirmRowIcon}><User size={18} /></div>
          <div>
            <span className={styles.confirmRowLabel}>Professional</span>
            <span className={styles.confirmRowValue}>
              {booking.autoAssign ? "Auto-assigned (Best available)" : booking.technicianName}
            </span>
          </div>
        </div>
        <div className={styles.confirmRow}>
          <div className={styles.confirmRowIcon}><MapPin size={18} /></div>
          <div>
            <span className={styles.confirmRowLabel}>Location</span>
            <span className={styles.confirmRowValue}>
              {booking.address || "Not set"}
            </span>
          </div>
        </div>
        <div className={styles.confirmTotal}>
          <span>Total Paid</span>
          <span className={styles.confirmTotalAmount}>₦{Math.max(0, finalPrice).toLocaleString()}</span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className={styles.confirmActions}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <Link href={`/track?ref=${bookingRef}`} className="btn btn-primary btn-lg">
          Track Your Booking Live 📍
          <ArrowRight size={18} />
        </Link>
        <Link href="/" className="btn btn-secondary btn-lg">
          Back to Home
        </Link>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className={styles.quickActions}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <button className={styles.quickAction}>
          <Download size={16} />
          Download Invoice
        </button>
        <button className={styles.quickAction}>
          <MessageCircle size={16} />
          Share via WhatsApp
        </button>
        <button className={styles.quickAction}>
          <Calendar size={16} />
          Add to Calendar
        </button>
      </motion.div>
    </div>
  );
}
