"use client";

import { useState } from "react";
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
import styles from "./book.module.css";

export interface BookingData {
  serviceCategory: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
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
}

const initialBookingData: BookingData = {
  serviceCategory: "",
  serviceId: "",
  serviceName: "",
  servicePrice: 0,
  propertyType: "HOME",
  bedrooms: 2,
  bathrooms: 1,
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

export default function BookPage() {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingData>(initialBookingData);
  const [direction, setDirection] = useState(1);

  const updateBooking = (updates: Partial<BookingData>) => {
    setBooking((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    setDirection(1);
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const goToStep = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
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
    </div>
  );
}
