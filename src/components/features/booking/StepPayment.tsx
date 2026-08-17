"use client";

import { useState, useEffect } from "react";
import { CreditCard, Building, Wallet, Tag, MapPin, CheckCircle, AlertCircle, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { BookingData } from "@/app/book/page";
import { BookingRiskGateModal } from "@/components/features/booking/BookingRiskGateModal";
import { TrustBadge } from "@/components/common/TrustBadge";
import { evaluateBookingRiskGate, isServiceHighRisk } from "@/lib/verification/verification-service";
import styles from "./Steps.module.css";

interface StepProps {
  booking: BookingData;
  updateBooking: (u: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const paymentMethods = [
  { id: "paystack", label: "Pay with Card / Paystack", desc: "Debit/Credit Card via Paystack NGN", icon: CreditCard },
  { id: "wallet", label: "Wallet Balance", desc: "Pay from your HandyHub wallet", icon: Wallet },
];

const isHighRiskService = (categoryId: string) => {
  const highRisk = ["electrical", "security", "solar", "locksmith"];
  return highRisk.includes((categoryId || "").toLowerCase());
};

export function StepPayment({ booking, updateBooking, onNext, onBack }: StepProps) {
  const [promoInput, setPromoInput] = useState(booking.promoCode);
  const [promoApplied, setPromoApplied] = useState(booking.discountAmount > 0);
  const [promoError, setPromoError] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [geocodedBadge, setGeocodedBadge] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRiskGateModal, setShowRiskGateModal] = useState(false);
  const [offPlatformAgreed, setOffPlatformAgreed] = useState(false);

  // Active Client Session State
  const [activeUser, setActiveUser] = useState<any>(null);

  const [profileFetched, setProfileFetched] = useState(false);

  // Inline address verification states
  const [inlineStreet, setInlineStreet] = useState("");
  const [inlineUploading, setInlineUploading] = useState(false);
  const [inlineUploadUrl, setInlineUploadUrl] = useState("");
  const [inlineSubmitting, setInlineSubmitting] = useState(false);

  const handleInlineAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineStreet.trim()) return alert("Please enter your street address.");
    if (!inlineUploadUrl) return alert("Please upload proof of address document.");

    setInlineSubmitting(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activeUser?.email,
          permanentAddress: inlineStreet.trim(),
          permanentAddressProof: inlineUploadUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const updatedUser = {
          ...activeUser,
          permanentAddress: inlineStreet.trim(),
          permanentAddressProof: inlineUploadUrl,
          permanentAddressStatus: "PENDING",
        };
        setActiveUser(updatedUser);
        localStorage.setItem("handyhub_user", JSON.stringify(updatedUser));
        updateBooking({ address: inlineStreet.trim() });
        alert("Address submitted successfully! Verification is now pending.");
      } else {
        alert(data.error || "Failed to submit address verification.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to profile server.");
    } finally {
      setInlineSubmitting(false);
    }
  };

  const handleInlineUpload = async (file: File) => {
    setInlineUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setInlineUploadUrl(data.url);
      } else {
        alert(data.error || "File upload failed.");
      }
    } catch {
      alert("Error uploading file to server.");
    } finally {
      setInlineUploading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("handyhub_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setActiveUser(parsed);
          
          fetch(`/api/user/profile?email=${encodeURIComponent(parsed.email)}`)
            .then((r) => r.json())
            .then((data) => {
              if (data && data.user) {
                setActiveUser((prev: any) => ({
                  ...prev,
                  ...data.user
                }));
                if (data.user.permanentAddressStatus === "VERIFIED" && data.user.permanentAddress) {
                  updateBooking({ address: data.user.permanentAddress });
                }
              }
            })
            .catch((err) => console.error("Error fetching live user profile:", err))
            .finally(() => setProfileFetched(true));
        } else {
          setProfileFetched(true);
        }
      } catch (e) {
        setProfileFetched(true);
      }
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
    if (!offPlatformAgreed) {
      setPayError("You must acknowledge and agree to keep all payments and bookings on HandyHub Pro before proceeding.");
      return;
    }

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
          preferredGateway: "PAYSTACK",
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

  const isHighRisk = isHighRiskService(booking.serviceCategory || "");
  const addressStatus = activeUser?.permanentAddressStatus || "NOT_SUBMITTED";
  const isCheckoutBlocked = isPaying || (
    activeUser ? (
      isHighRisk 
        ? addressStatus !== "VERIFIED" 
        : (addressStatus === "NOT_SUBMITTED" || addressStatus === "REJECTED" || addressStatus === "SUSPENDED")
    ) : false
  );

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Location & Payment</h2>
      <p className={styles.stepSubtitle}>Enter your address and choose your payment method</p>

      {/* Account Login Notice if not signed in */}
      {!activeUser && (
        <div style={{ background: "rgba(14,165,233,0.1)", border: "1px solid #0EA5E9", color: "#0EA5E9", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, overflowWrap: "break-word" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Lock size={18} style={{ flexShrink: 0 }} />
            <span><strong>Registered Client Gating:</strong> Please sign in to complete booking and payment.</span>
          </div>
          <button onClick={() => setShowAuthModal(true)} className="btn btn-primary btn-xs" style={{ background: "#0EA5E9", flexShrink: 0 }}>
            Sign In / Register ➔
          </button>
        </div>
      )}

      {payError && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #EF4444", color: "#EF4444", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", display: "flex", alignItems: "flex-start", gap: "8px", overflowWrap: "break-word" }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ wordBreak: "break-word" }}>{payError}</span>
        </div>
      )}

      {/* Address & Autocomplete Section */}
      <div className={styles.fieldGroup} style={{ position: "relative" }}>
        <label className={styles.fieldLabel}>
          <MapPin size={16} /> Service Address
        </label>
        
        {activeUser ? (
          (() => {
            const status = activeUser.permanentAddressStatus || "NOT_SUBMITTED";
            const isHighRisk = isHighRiskService(booking.serviceCategory || "");

            // 1. Fully Verified status
            if (status === "VERIFIED") {
              let bookingAddressesParsed = [];
              if (activeUser.bookingAddresses) {
                try {
                  bookingAddressesParsed = typeof activeUser.bookingAddresses === "string" 
                    ? JSON.parse(activeUser.bookingAddresses) 
                    : activeUser.bookingAddresses;
                  if (!Array.isArray(bookingAddressesParsed)) bookingAddressesParsed = [];
                } catch {
                  bookingAddressesParsed = [];
                }
              }

              return (
                <div>
                  <select
                    value={booking.address}
                    onChange={(e) => updateBooking({ address: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg-tertiary)", border: "1.5px solid var(--border-primary)", color: "var(--text-primary)", cursor: "pointer", fontSize: "14px", fontWeight: "600", outline: "none" }}
                  >
                    <option value={activeUser.permanentAddress}>🏡 Verified Permanent Address: {activeUser.permanentAddress}</option>
                    {bookingAddressesParsed.map((addr: any) => (
                      <option key={addr.id} value={addr.address}>📍 {addr.label}: {addr.address}</option>
                    ))}
                    {activeUser.secondaryAddress && (
                      <option value={activeUser.secondaryAddress}>🏢 Secondary Booking Address: {activeUser.secondaryAddress}</option>
                    )}
                  </select>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", fontSize: "10px", padding: "2px 8px", borderRadius: 4, fontWeight: "bold" }}>🏡 Address Verified</span>
                    <span style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", fontSize: "10px", padding: "2px 8px", borderRadius: 4, fontWeight: "bold" }}>🛡️ Identity Verified</span>
                  </div>
                </div>
              );
            }

            // 2. Pending verification status
            if (status === "PENDING") {
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ background: isHighRisk ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)", border: `1px solid ${isHighRisk ? "#EF4444" : "#F59E0B"}`, padding: "16px", borderRadius: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: isHighRisk ? "#EF4444" : "#F59E0B", fontWeight: 700, marginBottom: 8 }}>
                      <AlertCircle size={18} />
                      <span>{isHighRisk ? "⚠️ High-Risk Gating Activated" : "⏳ Verification Pending"}</span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 10px 0", lineHeight: 1.5 }}>
                      {isHighRisk ? (
                        <strong>This is a high-risk installation service (Electrical, Security, or Solar). Platform safety policies require a fully verified permanent address before checkout can proceed. Please await administrator audit.</strong>
                      ) : (
                        <span>This is a low-risk maintenance service. You are permitted to book and pay while your utility bill audit is pending verification in the background.</span>
                      )}
                    </p>
                    <div style={{ background: "#0F172A", padding: 10, borderRadius: 8, border: "1px solid #334155", fontSize: "12px" }}>
                      <span style={{ display: "block", color: "#64748B", fontWeight: "bold", textTransform: "uppercase", marginBottom: 4 }}>Submission checklist:</span>
                      <span style={{ display: "block", color: "#10B981" }}>✓ Permanent Address details saved</span>
                      <span style={{ display: "block", color: "#F59E0B" }}>⏳ Awaiting administrator file audit (~15 mins turnaround)</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    readOnly
                    className="input"
                    value={activeUser.permanentAddress || ""}
                    style={{ opacity: 0.8, cursor: "not-allowed" }}
                  />
                </div>
              );
            }

            // 3. Not submitted, Rejected, or Suspended statuses (Render inline form!)
            return (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px dashed rgba(239,68,68,0.3)", padding: "20px", borderRadius: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#EF4444", fontWeight: 700, marginBottom: 8 }}>
                  <AlertCircle size={18} />
                  <span>🏡 Complete Address Verification Inline</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                  {status === "REJECTED" ? (
                    <strong style={{ color: "#EF4444" }}>Your previous address proof was rejected. Notes: {activeUser.permanentAddressNotes || "Invalid document"}. Please resubmit below.</strong>
                  ) : status === "SUSPENDED" ? (
                    <strong style={{ color: "#A855F7" }}>Your verification has been suspended. Please upload fresh utility bill proof below.</strong>
                  ) : (
                    <span>Register your permanent home address and upload a utility bill proof document to complete your safety verification and unlock dispatches.</span>
                  )}
                </p>

                <form onSubmit={handleInlineAddressSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "var(--text-primary)" }}>Street Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Plot 104, Aminu Kano Crescent, Wuse 2, Abuja"
                      value={inlineStreet}
                      onChange={(e) => setInlineStreet(e.target.value)}
                      required
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "var(--text-primary)" }}>Upload Utility Bill / Lease Contract (Image/PDF)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleInlineUpload(file);
                      }}
                      required
                      style={{ width: "100%", padding: 6, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: 13 }}
                    />
                    {inlineUploading && <span style={{ fontSize: 11, color: "#F59E0B", marginTop: 4, display: "block" }}>Uploading document...</span>}
                    {inlineUploadUrl && <span style={{ fontSize: 11, color: "#10B981", marginTop: 4, display: "block" }}>✓ Proof uploaded successfully!</span>}
                  </div>
                  <button
                    type="submit"
                    disabled={inlineSubmitting || inlineUploading || !inlineUploadUrl}
                    className="btn btn-primary btn-sm"
                    style={{ background: "#0EA5E9", alignSelf: "flex-start" }}
                  >
                    {inlineSubmitting ? "Submitting Audit..." : "Submit Address Verification"}
                  </button>
                </form>
              </div>
            );
          })()
        ) : (
          <div>
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
          </div>
        )}

        {geocodedBadge && !activeUser && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-2)", fontSize: "var(--fs-xs)", color: "#10B981", fontWeight: "var(--fw-semibold)" }}>
            <CheckCircle size={14} /> Coordinates Matched & Cached (Nearest Verified Pros Found)
          </div>
        )}

        {(!activeUser || activeUser.permanentAddressStatus === "VERIFIED") && (
          <input
            type="text"
            className="input"
            placeholder="Landmark (e.g., Opposite Transcorp Hilton)"
            value={booking.landmark}
            onChange={(e) => updateBooking({ landmark: e.target.value })}
            style={{ marginTop: "var(--space-3)" }}
          />
        )}
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

      {/* Mandatory Safety Warning & Off-Platform Checkbox */}
      <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid #F59E0B", borderRadius: "12px", padding: "14px 16px", margin: "20px 0 16px" }}>
        <div style={{ color: "#D97706", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          🛡️ SAFETY MANDATE: Keep All Payments & Bookings On-Platform!
        </div>
        <p style={{ margin: "0 0 10px", color: "var(--text-secondary)", fontSize: "12px", lineHeight: 1.5, overflowWrap: "break-word" }}>
          Never pay artisans cash off-platform. Off-platform cash transactions void your Escrow Security, 14-Day Workmanship Warranty, and Dispute Resolution support under Nigerian Law.
        </p>
        <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12px", color: "var(--text-primary)", fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={offPlatformAgreed}
            onChange={(e) => setOffPlatformAgreed(e.target.checked)}
            style={{ width: 18, height: 18, minWidth: 18, accentColor: "#0EA5E9", cursor: "pointer", marginTop: 1 }}
            required
          />
          <span style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>I confirm I will keep all transactions on HandyHub Pro to retain Escrow & Warranty protection.</span>
        </label>
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
          disabled={isCheckoutBlocked}
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
              <Link
                href="/auth/login?redirect=/book"
                className="btn btn-primary btn-md w-full"
                style={{ background: "#0EA5E9", color: "#FFFFFF", fontWeight: "bold", fontSize: 15, justifyContent: "center", borderRadius: 12, padding: "12px 16px" }}
              >
                Log In to Existing Account ➔
              </Link>

              <Link
                href="/auth/register?redirect=/book"
                className="btn btn-md w-full"
                style={{
                  background: "#0F172A",
                  color: "#38BDF8",
                  border: "1.5px solid #0EA5E9",
                  fontWeight: "bold",
                  fontSize: 15,
                  justifyContent: "center",
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                }}
              >
                Create Free Client Account
              </Link>

              <button
                onClick={() => setShowAuthModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#CBD5E1",
                  fontSize: 14,
                  fontWeight: "500",
                  cursor: "pointer",
                  marginTop: 8,
                  textDecoration: "underline",
                }}
              >
                Cancel and return to booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Risk Service Gating Modal */}
      <BookingRiskGateModal
        isOpen={showRiskGateModal}
        onClose={() => setShowRiskGateModal(false)}
        serviceName={booking.serviceName || "Technical Service"}
        categorySlug={booking.serviceCategory || ""}
        userEmail={activeUser?.email}
        currentStatus={activeUser?.permanentAddressStatus || "NOT_SUBMITTED"}
        onVerificationSubmitted={() => {
          setShowRiskGateModal(false);
          alert("Verification submitted! Your status is now PENDING review.");
        }}
      />
    </div>
  );
}
