"use client";

import { useState, useEffect } from "react";
import { CreditCard, Building, Wallet, Tag, MapPin, CheckCircle, AlertCircle, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { BookingData } from "@/app/book/page";
import styles from "./Steps.module.css";

interface StepProps {
  booking: BookingData;
  updateBooking: (u: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const paymentMethods = [
  { id: "paystack", label: "Pay with Card / Paystack", desc: "Debit/Credit Card via Paystack NGN", icon: CreditCard },
  { id: "monnify", label: "Bank Transfer (Monnify)", desc: "Instant NUBAN transfer", icon: Building },
  { id: "wallet", label: "Wallet Balance", desc: "Pay from your HandyHub wallet", icon: Wallet },
];

export function StepPayment({ booking, updateBooking, onNext, onBack }: StepProps) {
  const [promoInput, setPromoInput] = useState(booking.promoCode);
  const [promoApplied, setPromoApplied] = useState(booking.discountAmount > 0);
  const [promoError, setPromoError] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [geocodedBadge, setGeocodedBadge] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Active Client Session State
  const [activeUser, setActiveUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("handyhub_user");
        if (stored) {
          setActiveUser(JSON.parse(stored));
        }
      } catch (e) {}
    }
  }, []);

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

  const handlePaymentProceed = async () => {
    // Check if user is logged in
    if (!activeUser || !activeUser.email) {
      // Save draft booking to localStorage and show Auth Modal
      localStorage.setItem("handyhub_pending_booking", JSON.stringify({
        ...booking,
        totalPrice: Math.max(0, finalPrice || 15000),
      }));
      setShowAuthModal(true);
      return;
    }

    setIsPaying(true);
    setPayError("");
    try {
      localStorage.setItem("handyhub_pending_booking", JSON.stringify({
        ...booking,
        totalPrice: Math.max(0, finalPrice || 15000),
      }));

      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activeUser.email,
          amountNgn: Math.max(100, finalPrice || 15000),
          bookingId: booking.serviceCategory || "BKG",
          customerName: `${activeUser.firstName || "Client"} ${activeUser.lastName || ""}`.trim(),
          customerPhone: activeUser.phone || "+2348122222936",
          preferredGateway: booking.paymentMethod === "monnify" ? "MONNIFY" : "PAYSTACK",
        }),
      });

      const data = await res.json();
      if (res.ok && data.checkout?.authorizationUrl) {
        window.location.href = data.checkout.authorizationUrl;
      } else {
        if (res.status === 401) {
          setShowAuthModal(true);
        } else {
          setPayError(data.error || "Failed to initialize payment gateway.");
        }
        setIsPaying(false);
      }
    } catch (err: any) {
      setPayError("Network error initializing Paystack gateway. Please try again.");
      setIsPaying(false);
    }
  };

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Location & Payment</h2>
      <p className={styles.stepSubtitle}>Enter your address and choose your payment method</p>

      {/* Account Login Notice if not signed in */}
      {!activeUser && (
        <div style={{ background: "rgba(14,165,233,0.1)", border: "1px solid #0EA5E9", color: "#0EA5E9", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={18} />
            <span><strong>Registered Client Gating:</strong> Please sign in to complete booking and payment.</span>
          </div>
          <button onClick={() => setShowAuthModal(true)} className="btn btn-primary btn-xs" style={{ background: "#0EA5E9" }}>
            Sign In / Register ➔
          </button>
        </div>
      )}

      {payError && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #EF4444", color: "#EF4444", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{payError}</span>
        </div>
      )}

      {/* Address & Autocomplete */}
      <div className={styles.fieldGroup} style={{ position: "relative" }}>
        <label className={styles.fieldLabel}>
          <MapPin size={16} /> Service Address (Autocomplete & Geocoded)
        </label>
        <input
          type="text"
          className="input"
          placeholder="Type address... e.g. Maitama, Wuse 2, Jabi, Ikeja"
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

      {/* Payment Method Selector */}
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
          <span>{booking.serviceName || "Home Service"}</span>
          <span>₦{(booking.totalPrice || booking.servicePrice || 15000).toLocaleString()}</span>
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
          <span>₦{Math.max(0, finalPrice || 15000).toLocaleString()}</span>
        </div>
      </div>

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
          onClick={handlePaymentProceed}
          style={{ background: "#0EA5E9" }}
        >
          {isPaying ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, marginRight: 8, display: "inline-block" }} />
              Connecting to Paystack Gateway...
            </>
          ) : (
            `Confirm & Pay ₦${Math.max(0, finalPrice || 15000).toLocaleString()}`
          )}
        </button>
      </div>

      {/* Auth Modal for Gated Clients */}
      {showAuthModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(9, 13, 22, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 450, background: "#1E293B", border: "1px solid #334155", borderRadius: 20, padding: 24, textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(14,165,233,0.15)", color: "#0EA5E9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Lock size={28} />
            </div>

            <h3 className="h4" style={{ margin: "0 0 8px 0", color: "#F8FAFC" }}>Client Sign-In Required</h3>
            <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.5, marginBottom: 24 }}>
              Only registered HandyHub clients can schedule dispatches and make payments. Please log in or create a free account to complete your booking.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link href="/auth/login?redirect=/book" className="btn btn-primary btn-md w-full" style={{ background: "#0EA5E9", justifyContent: "center" }}>
                Log In to Existing Account ➔
              </Link>
              <Link href="/auth/register?redirect=/book" className="btn btn-secondary btn-md w-full" style={{ justifyContent: "center", color: "#F8FAFC", borderColor: "#334155" }}>
                Create Free Client Account
              </Link>
              <button onClick={() => setShowAuthModal(false)} style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", marginTop: 8 }}>
                Cancel and return to booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
