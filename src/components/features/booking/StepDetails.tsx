"use client";

import type { BookingData } from "@/app/book/page";
import { Home, Building2, Briefcase, Store } from "lucide-react";
import { calculateJobPrice, DEFAULT_PRICING_RULES, PricingModel } from "@/lib/pricingEngine";
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
  const isCleaning = booking.serviceCategory === "cleaning";

  const getComputedPrice = (bedrooms: number, bathrooms: number) => {
    const pModel: PricingModel = isCleaning ? "PROPERTY_BASED" : ((booking.pricingModel as PricingModel) || "FIXED");
    const calc = calculateJobPrice({
      serviceId: booking.serviceId || booking.serviceCategory || "cleaning",
      pricingModel: pModel,
      basePrice: booking.servicePrice || 15000,
      bedrooms,
      bathrooms,
      isFurnished: booking.isFurnished || false,
      dirtLevel: booking.dirtLevel || "MODERATE",
      quantity: booking.quantity || 1,
      regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
      isExpressSchedule: booking.isEmergency || false,
    });
    return calc.totalPriceNgn;
  };

  const handlePropertyType = (type: string) => {
    const total = getComputedPrice(booking.bedrooms || 2, booking.bathrooms || 1);
    updateBooking({ propertyType: type, totalPrice: total });
  };

  const handleBedrooms = (n: number) => {
    const total = getComputedPrice(n, booking.bathrooms || 1);
    updateBooking({ bedrooms: n, totalPrice: total });
  };

  const handleBathrooms = (n: number) => {
    const total = getComputedPrice(booking.bedrooms || 2, n);
    updateBooking({ bathrooms: n, totalPrice: total });
  };

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Tell us about your property</h2>
      <p className={styles.stepSubtitle}>This helps us give you an accurate estimate</p>

      {/* Property Type */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Property Type</label>
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

      {/* Bedrooms (only for cleaning) */}
      {isCleaning && (
        <>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Number of Bedrooms</label>
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
            <label className={styles.fieldLabel}>Number of Bathrooms</label>
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

      {/* Special Notes */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Special Requirements (Optional)</label>
        <textarea
          className={styles.textarea}
          placeholder="Any specific instructions or areas of focus..."
          value={booking.specialNotes}
          onChange={(e) => updateBooking({ specialNotes: e.target.value })}
          rows={3}
        />
      </div>

      {/* Price Preview */}
      <div className={styles.pricePreview}>
        <span>Estimated Price</span>
        <span className={styles.pricePreviewAmount}>₦{(booking.totalPrice || booking.servicePrice).toLocaleString()}</span>
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
