"use client";

import { useState, useEffect } from "react";
import { addDays, format, isToday, isTomorrow } from "date-fns";
import { AlertTriangle, Zap, Lock } from "lucide-react";
import type { BookingData } from "@/app/book/page";
import { calculateJobPrice, PricingModel, ServicePlanTier } from "@/lib/pricingEngine";
import { SERVICE_CATEGORIES } from "@/lib/services";
import styles from "./Steps.module.css";

interface StepProps {
  booking: BookingData;
  updateBooking: (u: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const timeSlots = [
  { id: "08:00", label: "8:00 AM", period: "Morning" },
  { id: "09:00", label: "9:00 AM", period: "Morning" },
  { id: "10:00", label: "10:00 AM", period: "Morning" },
  { id: "11:00", label: "11:00 AM", period: "Morning" },
  { id: "12:00", label: "12:00 PM", period: "Afternoon" },
  { id: "13:00", label: "1:00 PM", period: "Afternoon" },
  { id: "14:00", label: "2:00 PM", period: "Afternoon" },
  { id: "15:00", label: "3:00 PM", period: "Afternoon" },
  { id: "16:00", label: "4:00 PM", period: "Evening" },
  { id: "17:00", label: "5:00 PM", period: "Evening" },
];

export function StepSchedule({ booking, updateBooking, onNext, onBack }: StepProps) {
  const [isEmergency, setIsEmergency] = useState(booking.isEmergency || false);
  const [showEmergencyPrompt, setShowEmergencyPrompt] = useState(false);
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  // Initial safety validation: if standard booking has today selected or no date, default to tomorrow
  useEffect(() => {
    const todayStr = format(today, "yyyy-MM-dd");
    const tomorrowStr = format(tomorrow, "yyyy-MM-dd");

    if (!isEmergency) {
      if (!booking.scheduledDate || booking.scheduledDate === todayStr) {
        updateBooking({ scheduledDate: tomorrowStr });
      }
    } else {
      if (!booking.scheduledDate) {
        updateBooking({ scheduledDate: todayStr });
      }
    }
  }, [isEmergency]);

  const handleDateSelect = (date: Date) => {
    if (isToday(date) && !isEmergency) {
      setShowEmergencyPrompt(true);
      return;
    }
    setShowEmergencyPrompt(false);
    updateBooking({ scheduledDate: format(date, "yyyy-MM-dd") });
  };

  const handleTimeSelect = (time: string) => {
    updateBooking({ scheduledTime: time });
  };

  const enableEmergencyAndSelectToday = () => {
    setIsEmergency(true);
    setShowEmergencyPrompt(false);
    const todayStr = format(today, "yyyy-MM-dd");

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

    const calc = calculateJobPrice({
      serviceId: effectiveServiceId,
      pricingModel: effectivePricingModel,
      basePrice: effectiveBasePrice,
      plan: (booking.planTier as ServicePlanTier) || "SILVER",
      bedrooms: booking.bedrooms || 2,
      bathrooms: booking.bathrooms || 1,
      isFurnished: booking.isFurnished || false,
      dirtLevel: booking.dirtLevel || "MODERATE",
      quantity: booking.quantity || 1,
      regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
      isExpressSchedule: true,
    });
    updateBooking({
      isEmergency: true,
      scheduledDate: todayStr,
      totalPrice: calc.totalPriceNgn,
    });
  };

  const toggleEmergency = () => {
    const newVal = !isEmergency;
    setIsEmergency(newVal);
    setShowEmergencyPrompt(false);

    const todayStr = format(today, "yyyy-MM-dd");
    const tomorrowStr = format(tomorrow, "yyyy-MM-dd");

    let nextScheduledDate = booking.scheduledDate;
    if (newVal) {
      nextScheduledDate = todayStr;
    } else {
      if (booking.scheduledDate === todayStr || !booking.scheduledDate) {
        nextScheduledDate = tomorrowStr;
      }
    }

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

    const calc = calculateJobPrice({
      serviceId: effectiveServiceId,
      pricingModel: effectivePricingModel,
      basePrice: effectiveBasePrice,
      plan: (booking.planTier as ServicePlanTier) || "SILVER",
      bedrooms: booking.bedrooms || 2,
      bathrooms: booking.bathrooms || 1,
      isFurnished: booking.isFurnished || false,
      dirtLevel: booking.dirtLevel || "MODERATE",
      quantity: booking.quantity || 1,
      regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
      isExpressSchedule: newVal,
    });

    updateBooking({
      isEmergency: newVal,
      scheduledDate: nextScheduledDate,
      totalPrice: calc.totalPriceNgn,
    });
  };

  const canProceed = booking.scheduledDate && booking.scheduledTime;

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>When do you need the service?</h2>
      <p className={styles.stepSubtitle}>Choose your preferred date and time</p>

      {/* Emergency Toggle */}
      <div className={`${styles.emergencyBanner} ${isEmergency ? styles.emergencyActive : ""}`}>
        <div className={styles.emergencyContent}>
          <AlertTriangle size={20} color={isEmergency ? "#F97316" : "var(--text-secondary)"} />
          <div>
            <strong>Emergency & Same-Day Service</strong>
            <p>Need it today? Toggle on for priority emergency dispatch (+50% surcharge)</p>
          </div>
        </div>
        <button
          className={`${styles.toggle} ${isEmergency ? styles.toggleOn : ""}`}
          onClick={toggleEmergency}
          role="switch"
          aria-checked={isEmergency}
        >
          <div className={styles.toggleThumb} />
        </button>
      </div>

      {/* Emergency Prompt Banner if user clicks Today while Emergency is OFF */}
      {showEmergencyPrompt && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.08) 100%)",
            border: "1.5px solid rgba(249,115,22,0.4)",
            borderRadius: "14px",
            padding: "14px 16px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "200px" }}>
            <Zap size={20} color="#F97316" />
            <div>
              <strong style={{ fontSize: "13px", color: "#F97316", display: "block" }}>
                Same-Day Booking Requires Emergency Dispatch
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Standard appointments start tomorrow. Turn on Emergency for today&apos;s priority dispatch (+50%).
              </span>
            </div>
          </div>
          <button
            onClick={enableEmergencyAndSelectToday}
            className="btn btn-sm"
            style={{
              background: "#F97316",
              color: "#FFF",
              fontWeight: 700,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Enable Today ➔
          </button>
        </div>
      )}

      {/* Date Selection */}
      <div className={styles.fieldGroup}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label className={styles.fieldLabel} style={{ margin: 0 }}>Select Date</label>
          {!isEmergency && (
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
              Standard bookings start from tomorrow
            </span>
          )}
        </div>
        <div className={styles.dateScroll}>
          {dates.map((date) => {
            const isSelected = booking.scheduledDate === format(date, "yyyy-MM-dd");
            const isTodayDate = isToday(date);
            const isLockedToday = isTodayDate && !isEmergency;
            const dayLabel = isTodayDate ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date, "EEE");

            return (
              <button
                key={date.toISOString()}
                className={`${styles.dateCard} ${isSelected ? styles.dateCardActive : ""}`}
                onClick={() => handleDateSelect(date)}
                style={{
                  position: "relative",
                  opacity: isLockedToday ? 0.65 : 1,
                  borderStyle: isLockedToday ? "dashed" : "solid",
                  borderColor: isSelected ? "#0EA5E9" : isLockedToday ? "rgba(249,115,22,0.3)" : undefined,
                }}
                title={isLockedToday ? "Same-day booking requires Emergency Dispatch toggle" : undefined}
              >
                {isLockedToday && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      color: "#F97316",
                      background: "rgba(249,115,22,0.15)",
                      padding: "1px 4px",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                      marginBottom: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <Lock size={8} /> EMERGENCY
                  </span>
                )}
                {isTodayDate && isEmergency && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      color: "#F97316",
                      background: "rgba(249,115,22,0.2)",
                      padding: "1px 4px",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                      marginBottom: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <Zap size={8} /> EXPRESS
                  </span>
                )}
                <span className={styles.dateDay}>{dayLabel}</span>
                <span className={styles.dateNum}>{format(date, "d")}</span>
                <span className={styles.dateMonth}>{format(date, "MMM")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {booking.scheduledDate && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Select Time</label>
          {["Morning", "Afternoon", "Evening"].map((period) => {
            const slots = timeSlots.filter((s) => s.period === period);
            if (slots.length === 0) return null;
            return (
              <div key={period} className={styles.timePeriod}>
                <span className={styles.timePeriodLabel}>{period}</span>
                <div className={styles.timeSlotGrid}>
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      className={`${styles.timeSlot} ${booking.scheduledTime === slot.id ? styles.timeSlotActive : ""}`}
                      onClick={() => handleTimeSelect(slot.id)}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.stepActions}>
        <button className="btn btn-secondary btn-lg" onClick={onBack}>Back</button>
        <button className="btn btn-primary btn-lg" onClick={onNext} disabled={!canProceed}>
          Continue
        </button>
      </div>
    </div>
  );
}
