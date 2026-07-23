"use client";

import { useState } from "react";
import { CreditCard, Building, Wallet, Tag, MapPin } from "lucide-react";
import type { BookingData } from "@/app/book/page";
import styles from "./Steps.module.css";

interface StepProps {
  booking: BookingData;
  updateBooking: (u: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const paymentMethods = [
  { id: "paystack", label: "Pay with Card", desc: "Debit/Credit Card via Paystack", icon: CreditCard },
  { id: "bank-transfer", label: "Bank Transfer", desc: "Direct bank transfer", icon: Building },
  { id: "wallet", label: "Wallet Balance", desc: "Pay from your HandyHub wallet", icon: Wallet },
];

export function StepPayment({ booking, updateBooking, onNext, onBack }: StepProps) {
  const [promoInput, setPromoInput] = useState(booking.promoCode);
  const [promoApplied, setPromoApplied] = useState(booking.discountAmount > 0);
  const [promoError, setPromoError] = useState("");

  const applyPromo = () => {
    setPromoError("");
    if (promoInput.toUpperCase() === "WELCOME50") {
      const discount = Math.min((booking.totalPrice || booking.servicePrice) * 0.5, 5000);
      updateBooking({ promoCode: promoInput.toUpperCase(), discountAmount: discount });
      setPromoApplied(true);
    } else if (promoInput.toUpperCase() === "HANDY2000") {
      if ((booking.totalPrice || booking.servicePrice) >= 10000) {
        updateBooking({ promoCode: promoInput.toUpperCase(), discountAmount: 2000 });
        setPromoApplied(true);
      } else {
        setPromoError("Minimum order of ₦10,000 required for this code");
      }
    } else {
      setPromoError("Invalid promo code");
    }
  };

  const removePromo = () => {
    updateBooking({ promoCode: "", discountAmount: 0 });
    setPromoApplied(false);
    setPromoInput("");
  };

  const finalPrice = (booking.totalPrice || booking.servicePrice) - booking.discountAmount;

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Location & Payment</h2>
      <p className={styles.stepSubtitle}>Enter your address and choose how to pay</p>

      {/* Address */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <MapPin size={16} /> Service Address
        </label>
        <input
          type="text"
          className="input"
          placeholder="Enter your full address"
          value={booking.address}
          onChange={(e) => updateBooking({ address: e.target.value })}
        />
        <input
          type="text"
          className="input"
          placeholder="Landmark (e.g., Opposite Transcorp Hilton)"
          value={booking.landmark}
          onChange={(e) => updateBooking({ landmark: e.target.value })}
          style={{ marginTop: "var(--space-3)" }}
        />
      </div>

      {/* Payment Method */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Payment Method</label>
        <div className={styles.paymentMethods}>
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              className={`${styles.paymentOption} ${booking.paymentMethod === pm.id ? styles.paymentOptionActive : ""}`}
              onClick={() => updateBooking({ paymentMethod: pm.id })}
            >
              <pm.icon size={22} />
              <div>
                <div className={styles.paymentLabel}>{pm.label}</div>
                <div className={styles.paymentDesc}>{pm.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Promo Code */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>
          <Tag size={16} /> Promo Code
        </label>
        {promoApplied ? (
          <div className={styles.promoApplied}>
            <span>✅ <strong>{booking.promoCode}</strong> applied — ₦{booking.discountAmount.toLocaleString()} off</span>
            <button className={styles.promoRemove} onClick={removePromo}>Remove</button>
          </div>
        ) : (
          <div className={styles.promoRow}>
            <input
              type="text"
              className="input"
              placeholder="Enter promo code"
              value={promoInput}
              onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary btn-md" onClick={applyPromo} disabled={!promoInput}>
              Apply
            </button>
          </div>
        )}
        {promoError && <p className={styles.errorText}>{promoError}</p>}
      </div>

      {/* Price Summary */}
      <div className={styles.priceSummary}>
        <div className={styles.priceRow}>
          <span>{booking.serviceName}</span>
          <span>₦{(booking.totalPrice || booking.servicePrice).toLocaleString()}</span>
        </div>
        {booking.isEmergency && (
          <div className={styles.priceRow}>
            <span>Emergency surcharge</span>
            <span className={styles.surcharge}>+50%</span>
          </div>
        )}
        {booking.discountAmount > 0 && (
          <div className={`${styles.priceRow} ${styles.discount}`}>
            <span>Promo discount ({booking.promoCode})</span>
            <span>-₦{booking.discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className={`${styles.priceRow} ${styles.priceTotal}`}>
          <span>Total</span>
          <span>₦{Math.max(0, finalPrice).toLocaleString()}</span>
        </div>
      </div>

      {/* Terms */}
      <p className={styles.termsText}>
        By proceeding, you agree to our{" "}
        <a href="/terms" className={styles.termsLink}>Terms of Service</a> and{" "}
        <a href="/privacy" className={styles.termsLink}>Privacy Policy</a>.
      </p>

      <div className={styles.stepActions}>
        <button className="btn btn-secondary btn-lg" onClick={onBack}>Back</button>
        <button
          className="btn btn-primary btn-lg"
          onClick={onNext}
          disabled={!booking.address}
        >
          Confirm & Pay ₦{Math.max(0, finalPrice).toLocaleString()}
        </button>
      </div>
    </div>
  );
}
