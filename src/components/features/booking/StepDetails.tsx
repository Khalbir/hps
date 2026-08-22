"use client";

import { useEffect, useState } from "react";
import type { BookingData } from "@/app/book/page";
import { Home, Building2, Briefcase, Store, ShieldCheck, Sparkles, Award } from "lucide-react";
import {
  calculateJobPrice,
  DEFAULT_PRICING_RULES,
  PricingModel,
  PricingRulesConfig,
  SERVICE_PLANS,
  ServicePlanTier,
} from "@/lib/pricingEngine";
import { SERVICE_CATEGORIES } from "@/lib/services";
import styles from "./Steps.module.css";

const propertyTypes = [
  { id: "HOME", label: "House", icon: Home, desc: "Standalone house or duplex" },
  { id: "APARTMENT", label: "Apartment", icon: Building2, desc: "Flat in a building" },
  { id: "OFFICE", label: "Office", icon: Briefcase, desc: "Office or workspace" },
  { id: "COMMERCIAL", label: "Commercial", icon: Store, desc: "Shop, warehouse, etc." },
];

interface StepProps {
  booking: BookingData;
  updateBooking: (u: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepDetails({ booking, updateBooking, onNext, onBack }: StepProps) {
  const [pricingRules, setPricingRules] = useState<PricingRulesConfig>(DEFAULT_PRICING_RULES);

  useEffect(() => {
    async function loadPricingRules() {
      try {
        const res = await fetch("/api/admin/pricing-rules", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });
        const data = await res.json();
        if (res.ok && data.rules) {
          setPricingRules(data.rules);
        }
      } catch (err) {}
    }
    loadPricingRules();
  }, []);

  const isCleaning = booking.serviceCategory === "cleaning";
  const isFumigation = booking.serviceCategory === "fumigation" || (booking.serviceId && booking.serviceId.includes("fumigation"));
  const isUpholstery = booking.serviceCategory === "upholstery" || (booking.serviceId && (booking.serviceId.includes("sofa") || booking.serviceId.includes("mattress") || booking.serviceId.includes("rug") || booking.serviceId.includes("upholstery")));
  const isSubscription = booking.pricingModel === "SUBSCRIPTION";
  const isPropertyBased = !isSubscription && (isCleaning || isFumigation || booking.pricingModel === "PROPERTY_BASED");

  const getComputedPrice = (bedrooms: number, bathrooms: number, qty?: number, plan?: ServicePlanTier) => {
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

    const pModel: PricingModel = isSubscription
      ? "SUBSCRIPTION"
      : isPropertyBased
      ? "PROPERTY_BASED"
      : isUpholstery
      ? "QUANTITY_BASED"
      : ((booking.pricingModel as PricingModel) || catalogService?.pricingModel || "FIXED");

    const effectiveServiceId =
      booking.serviceId || catalogService?.id || booking.serviceCategory || "general-handyman";

    const calc = calculateJobPrice(
      {
        serviceId: effectiveServiceId,
        pricingModel: pModel,
        basePrice: effectiveBasePrice,
        plan: plan || (booking.planTier as ServicePlanTier) || "SILVER",
        bedrooms,
        bathrooms,
        isFurnished: booking.isFurnished || false,
        dirtLevel: booking.dirtLevel || "MODERATE",
        quantity: qty !== undefined ? qty : (booking.quantity || 1),
        regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
        isExpressSchedule: booking.isEmergency || false,
      },
      pricingRules
    );
    return calc.totalPriceNgn;
  };

  const handlePropertyType = (type: string) => {
    const total = getComputedPrice(booking.bedrooms || 2, booking.bathrooms || 1, booking.quantity || 1, booking.planTier as ServicePlanTier);
    updateBooking({ propertyType: type, totalPrice: total });
  };

  const handleBedrooms = (n: number) => {
    const total = getComputedPrice(n, booking.bathrooms || 1, booking.quantity || 1, booking.planTier as ServicePlanTier);
    updateBooking({ bedrooms: n, totalPrice: total });
  };

  const handleBathrooms = (n: number) => {
    const total = getComputedPrice(booking.bedrooms || 2, n, booking.quantity || 1, booking.planTier as ServicePlanTier);
    updateBooking({ bathrooms: n, totalPrice: total });
  };

  const handleQuantity = (q: number) => {
    const safeQ = Math.max(1, q);
    const total = getComputedPrice(booking.bedrooms || 2, booking.bathrooms || 1, safeQ, booking.planTier as ServicePlanTier);
    updateBooking({ quantity: safeQ, totalPrice: total });
  };

  const handlePlanSelect = (tier: ServicePlanTier) => {
    const total = getComputedPrice(booking.bedrooms || 2, booking.bathrooms || 1, booking.quantity || 1, tier);
    updateBooking({ planTier: tier, totalPrice: total });
  };

  const activePlanTier: ServicePlanTier = (booking.planTier as ServicePlanTier) || "SILVER";

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Tell us about your property & requirements</h2>
      <p className={styles.stepSubtitle}>This helps our smart pricing engine give you an accurate upfront estimate</p>

      {/* Property Type */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Property / Space Type</label>
        <div className={styles.optionGrid4}>
          {propertyTypes.map((pt) => (
            <button
              key={pt.id}
              className={`${styles.optionCard} ${booking.propertyType === pt.id ? styles.optionCardActive : ""}`}
              onClick={() => handlePropertyType(pt.id)}
            >
              <pt.icon size={24} />
              <span className={styles.optionLabel}>{pt.label}</span>
              <span className={styles.optionDesc}>{pt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Service Plan Tier Selection (Silver, Gold, Platinum) */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Sparkles size={16} color="#0EA5E9" /> Service Plan Package
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {(["SILVER", "GOLD", "PLATINUM"] as ServicePlanTier[]).map((tierKey) => {
            const planMeta = SERVICE_PLANS[tierKey];
            const isSelected = activePlanTier === tierKey;
            const multVal = pricingRules.planMultipliers?.[tierKey] ?? planMeta.multiplier;
            const multBadge = multVal > 1.0 ? `+${Math.round((multVal - 1.0) * 100)}%` : "Standard";

            return (
              <button
                key={tierKey}
                type="button"
                onClick={() => handlePlanSelect(tierKey)}
                style={{
                  background: isSelected ? "rgba(14,165,233,0.12)" : "#1E293B",
                  border: isSelected ? "2px solid #0EA5E9" : "1px solid #334155",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "0 0 16px rgba(14,165,233,0.2)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 800, fontSize: "14px", color: isSelected ? "#38BDF8" : "#F8FAFC" }}>
                    {planMeta.name}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: isSelected ? "#0EA5E9" : "#0F172A",
                      color: isSelected ? "#FFFFFF" : "#94A3B8",
                      border: "1px solid #334155",
                    }}
                  >
                    {multBadge}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", lineHeight: 1.4 }}>
                  {planMeta.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bedrooms & Bathrooms (For Cleaning & Fumigation) */}
      {isPropertyBased && (
        <>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isFumigation ? "Number of Bedrooms / Main Rooms to Fumigate" : "Number of Bedrooms"}
            </label>
            <div className={styles.counterRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`${styles.counterBtn} ${booking.bedrooms === n ? styles.counterBtnActive : ""}`}
                  onClick={() => handleBedrooms(n)}
                >
                  {n}{n === 5 ? "+" : ""}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Number of Bathrooms / Wet Areas</label>
            <div className={styles.counterRow}>
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  className={`${styles.counterBtn} ${booking.bathrooms === n ? styles.counterBtnActive : ""}`}
                  onClick={() => handleBathrooms(n)}
                >
                  {n}{n === 4 ? "+" : ""}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Upholstery Item Count Selector */}
      {isUpholstery && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Number of Items / Units to Deep Clean</label>
          <div className={styles.counterRow}>
            {[1, 2, 3, 4, 5, 6].map((q) => (
              <button
                key={q}
                className={`${styles.counterBtn} ${(booking.quantity || 1) === q ? styles.counterBtnActive : ""}`}
                onClick={() => handleQuantity(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: 6, display: "block" }}>
            Select quantity of sofa seats, mattresses, rugs, or vehicles.
          </span>
        </div>
      )}

      {/* Fumigation Safety Advisory Notice */}
      {isFumigation && (
        <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px" }}>
          <strong style={{ color: "#10B981", fontSize: "13px", display: "block", marginBottom: 4 }}>
            🛡️ Certified Fumigation Safety Protocol
          </strong>
          <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
            Our verified pest control specialists use NAFDAC-approved eco-safe formulations. All humans and pets must vacate the treated premises for 4 to 6 hours following treatment, with all open food stored away safely.
          </p>
        </div>
      )}

      {/* Special Notes */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Specific Requirements & Pests / Stains (Optional)</label>
        <textarea
          className={styles.textarea}
          placeholder={isFumigation ? "E.g. High cockroach infestation in kitchen, termite traces in roof, or outdoor compound spraying..." : isUpholstery ? "E.g. Wine/coffee stain on light beige velvet couch, pet odor on master mattress..." : "Any specific instructions or areas of focus..."}
          value={booking.specialNotes}
          onChange={(e) => updateBooking({ specialNotes: e.target.value })}
          rows={3}
        />
      </div>

      {/* Price Preview */}
      <div className={styles.pricePreview}>
        <span>Estimated Price</span>
        <span className={styles.pricePreviewAmount}>₦{(booking.totalPrice || booking.servicePrice || 0).toLocaleString()}</span>
      </div>

      {/* Actions */}
      <div className={styles.stepActions}>
        <button className="btn btn-secondary btn-lg" onClick={onBack}>Back</button>
        <button className="btn btn-primary btn-lg" onClick={onNext}>
          Continue to Schedule
        </button>
      </div>
    </div>
  );
}
