"use client";

import { useEffect, useState } from "react";
import type { BookingData } from "@/app/book/page";
import { ShieldCheck, MapPin, Tag } from "lucide-react";
import { calculateJobPrice, DEFAULT_PRICING_RULES, PricingRulesConfig, PricingModel } from "@/lib/pricingEngine";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { TrustBadge } from "@/components/common/TrustBadge";
import styles from "./Steps.module.css";

interface Props {
  booking: BookingData;
  currentStep: number;
}

export function BookingSummary({ booking, currentStep }: Props) {
  const [rulesConfig, setRulesConfig] = useState<PricingRulesConfig>(DEFAULT_PRICING_RULES);

  useEffect(() => {
    async function fetchRules() {
      try {
        const res = await fetch("/api/admin/pricing-rules", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });
        const data = await res.json();
        if (res.ok && data.rules) {
          setRulesConfig(data.rules);
        }
      } catch (err) {}
    }
    fetchRules();
  }, []);

  // Look up catalog service item by ID or name (case-insensitive)
  const catalogService = SERVICE_CATEGORIES.flatMap((c) => c.services).find(
    (s) =>
      (booking.serviceId && s.id.toLowerCase() === booking.serviceId.toLowerCase()) ||
      (booking.serviceName && s.name.toLowerCase() === booking.serviceName.toLowerCase())
  );

  const effectiveBasePrice =
    booking.servicePrice && booking.servicePrice > 0
      ? booking.servicePrice
      : catalogService?.price !== undefined && catalogService.price >= 0
      ? catalogService.price
      : booking.totalPrice && booking.totalPrice > 0
      ? booking.totalPrice
      : 0;

  const effectivePricingModel =
    (booking.pricingModel as PricingModel) || catalogService?.pricingModel || "FIXED";

  const effectiveServiceId =
    booking.serviceId || catalogService?.id || booking.serviceCategory || "general-handyman";

  const calc = calculateJobPrice(
    {
      serviceId: effectiveServiceId,
      pricingModel: effectivePricingModel,
      basePrice: effectiveBasePrice,
      bedrooms: booking.bedrooms || 2,
      bathrooms: booking.bathrooms || 1,
      isFurnished: booking.isFurnished || false,
      dirtLevel: booking.dirtLevel || "MODERATE",
      quantity: booking.quantity || 1,
      regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
      isExpressSchedule: booking.isEmergency || false,
    },
    rulesConfig
  );

  const calculatedTotal = calc.isCustomQuote ? 0 : calc.totalPriceNgn;
  const rawPrice =
    booking.totalPrice && booking.totalPrice > 0 && currentStep === 1
      ? booking.totalPrice
      : calculatedTotal > 0
      ? calculatedTotal
      : effectiveBasePrice;

  const finalPrice = Math.max(0, rawPrice - (booking.discountAmount || 0));

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
              <span className={styles.summaryLabel}>Property / Options</span>
              <span className={styles.summaryValue}>
                {booking.bedrooms > 0 ? `${booking.bedrooms} Bed` : ""}
                {booking.bathrooms > 0 ? ` · ${booking.bathrooms} Bath` : ""}
                {booking.isFurnished ? ` · Furnished` : ""}
                {booking.quantity && booking.quantity > 1 ? ` · Qty: ${booking.quantity}` : ""}
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

          {/* Detailed Itemized Price Breakdown */}
          {calc.isCustomQuote ? (
            <div style={{ background: "rgba(139,92,246,0.15)", padding: "12px", borderRadius: "8px", border: "1px solid #8B5CF6", marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", color: "#C084FC", fontWeight: "bold", display: "block" }}>
                🔍 Inspection-First Custom Quote
              </span>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                Free physical inspection dispatched. Written quote will be sent after site assessment.
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
              {calc.breakdown.map((b, idx) => (
                <div key={idx} className={styles.summaryPriceRow} style={{ fontSize: "12px", color: "#94A3B8" }}>
                  <span>{b.label}</span>
                  <span style={{ fontWeight: 600, color: "#F8FAFC" }}>₦{b.amountNgn.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {booking.discountAmount > 0 && (
            <div className={`${styles.summaryPriceRow} ${styles.discount}`}>
              <span>Promo Voucher</span>
              <span>-₦{booking.discountAmount.toLocaleString()}</span>
            </div>
          )}

          <div className={`${styles.summaryPriceRow} ${styles.summaryTotal}`}>
            <span>Total Payable</span>
            <span style={{ color: calc.isCustomQuote ? "#C084FC" : "#10B981" }}>
              {calc.isCustomQuote ? "FREE Quote" : `₦${finalPrice.toLocaleString()}`}
            </span>
          </div>
        </>
      ) : (
        <div className={styles.summaryEmpty}>
          <p>Select a service to see your booking summary</p>
        </div>
      )}

      {/* Trust Badge */}
      <div className={styles.summaryTrust} style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldCheck size={16} color="#10B981" />
          <span>Escrow Protected · 100% Satisfaction Guarantee</span>
        </div>
        <TrustBadge type="ADDRESS_VERIFIED" size="sm" />
      </div>
    </div>
  );
}
