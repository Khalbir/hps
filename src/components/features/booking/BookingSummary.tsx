"use client";

import type { BookingData } from "@/app/book/page";
import { ShieldCheck } from "lucide-react";
import styles from "./Steps.module.css";

interface Props {
  booking: BookingData;
  currentStep: number;
}

export function BookingSummary({ booking, currentStep }: Props) {
  const finalPrice = (booking.totalPrice || booking.servicePrice) - booking.discountAmount;

  return (
    <div className={`card ${styles.summaryCard}`}>
      <h3 className={styles.summaryTitle}>Booking Summary</h3>

      {booking.serviceName ? (
        <>
          <div className={styles.summarySection}>
            <span className={styles.summaryLabel}>Service</span>
            <span className={styles.summaryValue}>{booking.serviceName}</span>
          </div>

          {currentStep >= 2 && (
            <div className={styles.summarySection}>
              <span className={styles.summaryLabel}>Property</span>
              <span className={styles.summaryValue}>
                {booking.propertyType}
                {booking.bedrooms > 0 ? ` · ${booking.bedrooms} Bed` : ""}
                {booking.bathrooms > 0 ? ` · ${booking.bathrooms} Bath` : ""}
              </span>
            </div>
          )}

          {currentStep >= 3 && booking.scheduledDate && (
            <div className={styles.summarySection}>
              <span className={styles.summaryLabel}>Schedule</span>
              <span className={styles.summaryValue}>
                {booking.scheduledDate}
                {booking.scheduledTime ? ` at ${booking.scheduledTime}` : ""}
              </span>
            </div>
          )}

          {currentStep >= 4 && (
            <div className={styles.summarySection}>
              <span className={styles.summaryLabel}>Professional</span>
              <span className={styles.summaryValue}>
                {booking.autoAssign ? "Auto-assign" : booking.technicianName || "Not selected"}
              </span>
            </div>
          )}

          <div className={styles.summaryDivider} />

          <div className={styles.summaryPriceRow}>
            <span>Base Price</span>
            <span>₦{(booking.totalPrice || booking.servicePrice).toLocaleString()}</span>
          </div>

          {booking.isEmergency && (
            <div className={`${styles.summaryPriceRow} ${styles.surcharge}`}>
              <span>Emergency</span>
              <span>+50%</span>
            </div>
          )}

          {booking.discountAmount > 0 && (
            <div className={`${styles.summaryPriceRow} ${styles.discount}`}>
              <span>Discount</span>
              <span>-₦{booking.discountAmount.toLocaleString()}</span>
            </div>
          )}

          <div className={`${styles.summaryPriceRow} ${styles.summaryTotal}`}>
            <span>Total</span>
            <span>₦{Math.max(0, finalPrice).toLocaleString()}</span>
          </div>
        </>
      ) : (
        <div className={styles.summaryEmpty}>
          <p>Select a service to see your booking summary</p>
        </div>
      )}

      {/* Trust Badge */}
      <div className={styles.summaryTrust}>
        <ShieldCheck size={16} />
        <span>Secure booking · 100% satisfaction guarantee</span>
      </div>
    </div>
  );
}
