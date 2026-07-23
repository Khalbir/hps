"use client";

import type { BookingData } from "@/app/book/page";
import { Home, Building2, Briefcase, Store } from "lucide-react";
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

  const calculatePrice = (bedrooms: number, bathrooms: number) => {
    let price = booking.servicePrice;
    if (isCleaning) {
      price = booking.servicePrice + (bedrooms - 1) * 3000 + (bathrooms - 1) * 2000;
    }
    return price;
  };

  const handlePropertyType = (type: string) => {
    updateBooking({ propertyType: type });
  };

  const handleBedrooms = (n: number) => {
    const total = calculatePrice(n, booking.bathrooms);
    updateBooking({ bedrooms: n, totalPrice: total });
  };

  const handleBathrooms = (n: number) => {
    const total = calculatePrice(booking.bedrooms, n);
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
