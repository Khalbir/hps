"use client";

import { useEffect, useState } from "react";
import type { BookingData } from "@/app/book/page";
import { ShieldCheck, Tag } from "lucide-react";
import {
  calculateJobPrice,
  DEFAULT_PRICING_RULES,
  PricingRulesConfig,
  PricingModel,
  ServicePlanTier,
  SERVICE_PLANS,
} from "@/lib/pricingEngine";
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

  const hasSelectedService = Boolean(booking.serviceId || booking.serviceName);

  // Look up catalog service item by ID or name (case-insensitive) strictly if selected
  const catalogService = hasSelectedService
    ? SERVICE_CATEGORIES.flatMap((c) => c.services).find(
        (s) =>
          (booking.serviceId && s.id.toLowerCase() === booking.serviceId.toLowerCase()) ||
          (booking.serviceName && s.name.toLowerCase() === booking.serviceName.toLowerCase())
      )
    : undefined;

  const effectiveBasePrice = hasSelectedService
    ? booking.servicePrice && booking.servicePrice > 0
      ? booking.servicePrice
      : catalogService?.price !== undefined && catalogService.price >= 0
      ? catalogService.price
      : booking.totalPrice && booking.totalPrice > 0
      ? booking.totalPrice
      : 0
    : 0;

  const effectivePricingModel =
    (booking.pricingModel as PricingModel) || catalogService?.pricingModel || "FIXED";

  const effectiveServiceId = booking.serviceId || catalogService?.id || "";

  const planTier: ServicePlanTier = (booking.planTier as ServicePlanTier) || "SILVER";

  const isProp = effectivePricingModel === "PROPERTY_BASED";
  const calc = calculateJobPrice(
    {
      serviceId: effectiveServiceId,
      pricingModel: effectivePricingModel,
      basePrice: effectiveBasePrice,
      plan: planTier,
      bedrooms: isProp ? (booking.bedrooms || 2) : 1,
      bathrooms: isProp ? (booking.bathrooms || 1) : 1,
      isFurnished: isProp ? Boolean(booking.isFurnished) : false,
      dirtLevel: isProp ? (booking.dirtLevel || "MODERATE") : "LIGHT",
      quantity: booking.quantity || 1,
      regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
      isExpressSchedule: booking.isEmergency || false,
    },
    rulesConfig
  );

  const calculatedTotal = !hasSelectedService || calc.isCustomQuote ? 0 : calc.totalPriceNgn;
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

      {hasSelectedService && booking.serviceName ? (
        <>
          <div className={styles.summarySection}>
            <span className={styles.summaryLabel}>Service</span>
            <span className={styles.summaryValue}>{booking.serviceName}</span>
          </div>

          {currentStep >= 2 && (
            <div className={styles.summarySection}>
              <span className={styles.summaryLabel}>Options</span>
              <span className={styles.summaryValue}>
                {effectivePricingModel === "SUBSCRIPTION"
                  ? `${SERVICE_PLANS[planTier]?.name || planTier}`
                  : isProp
                  ? `${booking.bedrooms || 1} Bed · ${booking.bathrooms || 1} Bath${booking.isFurnished ? " · Furnished" : ""}`
                  : booking.quantity && booking.quantity > 1
                  ? `Quantity: ${booking.quantity}`
                  : "Standard Service"}
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
            <span>{effectivePricingModel === "SUBSCRIPTION" ? "Monthly Total" : "Total Payable"}</span>
            <span style={{ color: calc.isCustomQuote ? "#C084FC" : "#10B981" }}>
              {calc.isCustomQuote ? "FREE Quote" : effectivePricingModel === "SUBSCRIPTION" ? `₦${finalPrice.toLocaleString()}/mo` : `₦${finalPrice.toLocaleString()}`}
            </span>
          </div>
        </>
      ) : (
        <div className={styles.summaryEmpty} style={{ padding: "20px 8px", textAlign: "center" }}>
          <Tag size={24} style={{ opacity: 0.4, margin: "0 auto 8px", color: "#38BDF8", display: "block" }} />
          <p style={{ margin: 0, fontWeight: 600, color: "#94A3B8", fontSize: "13px" }}>
            No Service Selected
          </p>
          <span style={{ fontSize: "11px", color: "#64748B", marginTop: "4px", display: "block", lineHeight: 1.4 }}>
            Choose any service card to view its live itemized price and details.
          </span>
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
