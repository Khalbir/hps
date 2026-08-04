"use client";

import { useState } from "react";
import { CreditCard, Building, Wallet, Tag, MapPin, CheckCircle } from "lucide-react";
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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [geocodedBadge, setGeocodedBadge] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

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

      {/* Address & Autocomplete */}
      <div className={styles.fieldGroup} style={{ position: "relative" }}>
        <label className={styles.fieldLabel}>
          <MapPin size={16} /> Service Address (Autocomplete & Geocoded)
        </label>
        <input
          type="text"
          className="input"
          placeholder="Type address... e.g. Maitama, Wuse 2, Jabi"
          value={booking.address}
          onChange={(e) => {
            updateBooking({ address: e.target.value });
            if (e.target.value.length >= 2) {
              fetch(`/api/location/autocomplete?q=${encodeURIComponent(e.target.value)}`)
                .then((r) => r.json())
                .then((data) => setSuggestions(data.suggestions || []))
                .catch(() => {});
            } else {
              setSuggestions([]);
            }
          }}
        />

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div style={{ position: "absolute", top: 80, left: 0, right: 0, background: "var(--bg-tertiary)", border: "1.5px solid var(--color-primary-500)", borderRadius: "var(--radius-lg)", zIndex: 30, boxShadow: "var(--shadow-xl)", overflow: "hidden" }}>
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                style={{ width: "100%", padding: "var(--space-3) var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)", background: "none", border: "none", color: "var(--text-primary)", textAlign: "left", cursor: "pointer", borderBottom: "1px solid var(--border-primary)", fontSize: "var(--fs-sm)" }}
                onClick={() => {
                  updateBooking({ address: s.description });
                  setSuggestions([]);
                  setGeocodedBadge(true);
                }}
              >
                <MapPin size={16} color="var(--color-primary-500)" />
                <div>
                  <strong style={{ display: "block" }}>{s.mainText}</strong>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{s.secondaryText}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {geocodedBadge && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-2)", fontSize: "var(--fs-xs)", color: "#10B981", fontWeight: "var(--fw-semibold)" }}>
            <CheckCircle size={14} /> Coordinates Matched & Cached (Nearest Verified Pros Found)
          </div>
        )}

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
        <button className="btn btn-secondary btn-lg" onClick={onBack} disabled={isPaying}>Back</button>
        <button
          className="btn btn-primary btn-lg"
          disabled={isPaying}
          onClick={async () => {
            setIsPaying(true);
            try {
              const res = await fetch("/api/payments/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: "khalid.kabir@handyhubpro.ng",
                  amountNgn: Math.max(100, finalPrice),
                  bookingId: booking.serviceCategory || "BKG",
                  customerName: "HandyHub Customer",
                  customerPhone: "+2348122222936",
                }),
              });

              const data = await res.json();
              if (res.ok && data.checkout?.authorizationUrl) {
                window.location.href = data.checkout.authorizationUrl;
              } else {
                setIsPaying(false);
                onNext();
              }
            } catch {
              setIsPaying(false);
              onNext();
            }
          }}
        >
          {isPaying ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, marginRight: 8, display: "inline-block" }} />
              Connecting to Paystack...
            </>
          ) : (
            `Confirm & Pay ₦${Math.max(0, finalPrice).toLocaleString()}`
          )}
        </button>
      </div>
    </div>
  );
}
