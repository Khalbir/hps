"use client";

import { useState } from "react";
import { addDays, format, isSameDay, isToday, isTomorrow } from "date-fns";
import { AlertTriangle } from "lucide-react";
import type { BookingData } from "@/app/book/page";
import { calculateJobPrice, PricingModel } from "@/lib/pricingEngine";
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
  const [isEmergency, setIsEmergency] = useState(booking.isEmergency);
  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  const handleDateSelect = (date: Date) => {
    updateBooking({ scheduledDate: format(date, "yyyy-MM-dd") });
  };

  const handleTimeSelect = (time: string) => {
    updateBooking({ scheduledTime: time });
  };

  const toggleEmergency = () => {
    const newVal = !isEmergency;
    setIsEmergency(newVal);
    const calc = calculateJobPrice({
      serviceId: booking.serviceId || booking.serviceCategory || "cleaning",
      pricingModel: (booking.pricingModel as PricingModel) || "FIXED",
      basePrice: booking.servicePrice || 15000,
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
          <AlertTriangle size={20} />
          <div>
            <strong>Emergency Service</strong>
            <p>Need it ASAP? Toggle on for priority dispatch (+50% surcharge)</p>
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

      {/* Date Selection */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Select Date</label>
        <div className={styles.dateScroll}>
          {dates.map((date) => {
            const isSelected = booking.scheduledDate === format(date, "yyyy-MM-dd");
            const dayLabel = isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date, "EEE");
            return (
              <button
                key={date.toISOString()}
                className={`${styles.dateCard} ${isSelected ? styles.dateCardActive : ""}`}
                onClick={() => handleDateSelect(date)}
              >
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
