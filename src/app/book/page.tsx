"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StepService } from "@/components/features/booking/StepService";
import { StepDetails } from "@/components/features/booking/StepDetails";
import { StepSchedule } from "@/components/features/booking/StepSchedule";
import { StepTechnician } from "@/components/features/booking/StepTechnician";
import { StepPayment } from "@/components/features/booking/StepPayment";
import { StepConfirmation } from "@/components/features/booking/StepConfirmation";
import { BookingSummary } from "@/components/features/booking/BookingSummary";
import { resolveServiceCategory } from "@/lib/services";
import { STORAGE_KEYS, saveToStorage, loadFromStorage, removeFromStorage } from "@/lib/localStorage-utils";
import styles from "./book.module.css";

export interface BookingData {
  serviceCategory: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  pricingModel?: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  isFurnished?: boolean;
  dirtLevel?: "LIGHT" | "MODERATE" | "HEAVY";
  quantity?: number;
  regionalZoneId?: string;
  specialNotes: string;
  scheduledDate: string;
  scheduledTime: string;
  isEmergency: boolean;
  technicianId: string;
  technicianName: string;
  autoAssign: boolean;
  address: string;
  addressLabel: string;
  landmark: string;
  paymentMethod: string;
  promoCode: string;
  discountAmount: number;
  totalPrice: number;
  initialQuery?: string;
}

const initialBookingData: BookingData = {
  serviceCategory: "",
  serviceId: "",
  serviceName: "",
  servicePrice: 0,
  pricingModel: "FIXED",
  propertyType: "HOME",
  bedrooms: 2,
  bathrooms: 1,
  isFurnished: false,
  dirtLevel: "MODERATE",
  quantity: 1,
  regionalZoneId: "abuja-suburbs",
  specialNotes: "",
  scheduledDate: "",
  scheduledTime: "",
  isEmergency: false,
  technicianId: "",
  technicianName: "",
  autoAssign: true,
  address: "",
  addressLabel: "",
  landmark: "",
  paymentMethod: "paystack",
  promoCode: "",
  discountAmount: 0,
  totalPrice: 0,
};

const stepTitles = [
  "Choose Service",
  "Property Details",
  "Schedule",
  "Select Technician",
  "Payment",
  "Confirmation",
];

function BookingContent() {
  const searchParams = useSearchParams();

  // Restore booking draft and step from localStorage for refresh resilience
  const [step, setStep] = useState(() => {
    if (typeof window !== "undefined") {
      const savedStep = localStorage.getItem(STORAGE_KEYS.BOOKING_STEP);
      return savedStep ? Math.min(Math.max(Number(savedStep), 1), 5) : 1;
    }
    return 1;
  });
  const [booking, setBooking] = useState<BookingData>(() => {
    if (typeof window !== "undefined") {
      return loadFromStorage<BookingData>(STORAGE_KEYS.PENDING_BOOKING, initialBookingData);
    }
    return initialBookingData;
  });
  const [direction, setDirection] = useState(1);
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const serviceParam = searchParams.get("service");
    const queryParam = searchParams.get("query");
    const statusParam = searchParams.get("status");
    const refParam = searchParams.get("reference") || searchParams.get("trxref");

    // Handle Paystack / Gateway Payment Success Callback
    if (statusParam === "success" || refParam) {
      const savedDraft = localStorage.getItem("handyhub_pending_booking");
      let restoredData: Partial<BookingData> = {};
      if (savedDraft) {
        try {
          restoredData = JSON.parse(savedDraft);
          localStorage.removeItem("handyhub_pending_booking");
        } catch {}
      }

      setBooking((prev) => ({
        ...prev,
        ...restoredData,
        paymentMethod: "paystack",
        serviceName: restoredData.serviceName || prev.serviceName || "Verified Property Service",
        totalPrice: restoredData.totalPrice || prev.totalPrice || 15000,
        address: restoredData.address || prev.address || "Abuja, FCT, Nigeria",
      }));

      setStep(6);
      // Clean up persisted step since booking is confirmed
      removeFromStorage(STORAGE_KEYS.BOOKING_STEP);
      removeFromStorage(STORAGE_KEYS.PENDING_BOOKING);
      return;
    }

    if (categoryParam || serviceParam || queryParam) {
      const resolved = resolveServiceCategory({
        categoryParam,
        serviceParam,
        queryParam,
      });

      if (resolved.categoryId) {
        setStep(1);
        saveToStorage(STORAGE_KEYS.BOOKING_STEP, 1);

        const matched = resolved.matchedService;
        const pModel = matched?.pricingModel || "FIXED";
        const price = matched?.price || 0;

        setBooking((prev) => {
          const updated: BookingData = {
            ...prev,
            serviceCategory: resolved.categoryId || "",
            serviceId: matched ? matched.id : prev.serviceId,
            serviceName: matched ? matched.name : prev.serviceName,
            servicePrice: matched ? price : prev.servicePrice,
            pricingModel: matched ? pModel : prev.pricingModel,
            totalPrice: matched ? price : (prev.totalPrice || price),
            initialQuery: queryParam || undefined,
          };
          saveToStorage(STORAGE_KEYS.PENDING_BOOKING, updated);
          return updated;
        });
      }
    }
  }, [searchParams]);

  const updateBooking = (updates: Partial<BookingData>) => {
    setBooking((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("handyhub_pending_booking", JSON.stringify(updated));
      return updated;
    });
  };

  const nextStep = () => {
    setDirection(1);
    setStep((prev) => {
      const next = Math.min(prev + 1, 6);
      if (next === 6) {
        // Booking confirmed — clean up draft & step
        removeFromStorage(STORAGE_KEYS.BOOKING_STEP);
        removeFromStorage(STORAGE_KEYS.PENDING_BOOKING);
      } else {
        saveToStorage(STORAGE_KEYS.BOOKING_STEP, next);
      }
      return next;
    });
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => {
      const next = Math.max(prev - 1, 1);
      saveToStorage(STORAGE_KEYS.BOOKING_STEP, next);
      return next;
    });
  };

  const goToStep = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
    saveToStorage(STORAGE_KEYS.BOOKING_STEP, s);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepService booking={booking} updateBooking={updateBooking} onNext={nextStep} />;
      case 2:
        return <StepDetails booking={booking} updateBooking={updateBooking} onNext={nextStep} onBack={prevStep} />;
      case 3:
        return <StepSchedule booking={booking} updateBooking={updateBooking} onNext={nextStep} onBack={prevStep} />;
      case 4:
        return <StepTechnician booking={booking} updateBooking={updateBooking} onNext={nextStep} onBack={prevStep} />;
      case 5:
        return <StepPayment booking={booking} updateBooking={updateBooking} onNext={nextStep} onBack={prevStep} />;
      case 6:
        return <StepConfirmation booking={booking} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          {step > 1 && step < 6 ? (
            <button onClick={prevStep} className={styles.backBtn}>
              <ArrowLeft size={20} />
              Back
            </button>
          ) : (
            <Link href="/" className={styles.backBtn}>
              <ArrowLeft size={20} />
              Home
            </Link>
          )}
          <div className={styles.headerTitle}>
            <span className={styles.stepLabel}>Step {step} of 6</span>
            <h1 className={styles.stepName}>{stepTitles[step - 1]}</h1>
          </div>
          <div className={styles.headerSpacer} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressWrapper}>
        <div className={styles.progressBar}>
          <motion.div
            className={styles.progressFill}
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
        <div className={styles.progressSteps}>
          {stepTitles.map((title, i) => (
            <button
              key={title}
              className={`${styles.progressStep} ${i + 1 <= step ? styles.progressStepActive : ""} ${
                i + 1 === step ? styles.progressStepCurrent : ""
              }`}
              onClick={() => i + 1 < step && goToStep(i + 1)}
              disabled={i + 1 > step}
            >
              <div className={styles.progressDot}>
                {i + 1 < step ? "✓" : i + 1}
              </div>
              <span className={styles.progressDotLabel}>{title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`container ${styles.content}`}>
        <div className={styles.mainCol}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
        {step < 6 && (
          <div className={styles.sideCol}>
            <BookingSummary booking={booking} currentStep={step} />
          </div>
        )}
      </div>

      {/* Sticky Mobile Summary Bar */}
      {step < 6 && (
        <div className={styles.mobileStickyBar}>
          <div className={styles.mobileStickyInfo}>
            <span className={styles.mobileStickyLabel}>
              {booking.serviceName ? booking.serviceName : "Select Service"}
            </span>
            <span className={styles.mobileStickyPrice}>
              ₦{booking.totalPrice.toLocaleString()}
            </span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              const sideCol = document.querySelector(`.${styles.sideCol}`);
              if (sideCol) {
                sideCol.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center" }}>Loading booking page...</div>}>
      <BookingContent />
    </Suspense>
  );
}
