"use client";

import { useState } from "react";
import { Star, Clock, CheckCircle } from "lucide-react";
import type { BookingData } from "@/app/book/page";
import styles from "./Steps.module.css";

interface StepProps {
  booking: BookingData;
  updateBooking: (u: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const technicians = [
  { id: "1", name: "Abubakar T.", initials: "AT", rating: 4.9, jobs: 247, specialty: "Electrician", responseTime: 20, available: true },
  { id: "2", name: "Blessing O.", initials: "BO", rating: 4.8, jobs: 312, specialty: "Cleaning Lead", responseTime: 15, available: true },
  { id: "3", name: "Ibrahim M.", initials: "IM", rating: 4.9, jobs: 189, specialty: "Master Plumber", responseTime: 25, available: true },
  { id: "4", name: "Chioma E.", initials: "CE", rating: 5.0, jobs: 78, specialty: "Interior Decorator", responseTime: 30, available: false },
  { id: "5", name: "Yusuf A.", initials: "YA", rating: 4.7, jobs: 156, specialty: "AC Technician", responseTime: 20, available: true },
  { id: "6", name: "Ngozi N.", initials: "NN", rating: 4.8, jobs: 201, specialty: "Professional Painter", responseTime: 18, available: true },
];

export function StepTechnician({ booking, updateBooking, onNext, onBack }: StepProps) {
  const [autoAssign, setAutoAssign] = useState(booking.autoAssign);

  const selectTechnician = (tech: typeof technicians[0]) => {
    setAutoAssign(false);
    updateBooking({
      autoAssign: false,
      technicianId: tech.id,
      technicianName: tech.name,
    });
  };

  const selectAutoAssign = () => {
    setAutoAssign(true);
    updateBooking({
      autoAssign: true,
      technicianId: "",
      technicianName: "",
    });
  };

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Choose your professional</h2>
      <p className={styles.stepSubtitle}>Select a specific pro or let us find the best match</p>

      {/* Auto-assign Option */}
      <button
        className={`card ${styles.autoAssignCard} ${autoAssign ? styles.autoAssignActive : ""}`}
        onClick={selectAutoAssign}
      >
        <div className={styles.autoAssignIcon}>
          <CheckCircle size={24} />
        </div>
        <div className={styles.autoAssignContent}>
          <h3>Auto-assign best available</h3>
          <p>We&apos;ll match you with the highest-rated professional available for your time slot</p>
        </div>
        <div className={styles.recommendBadge}>Recommended</div>
      </button>

      <div className={styles.dividerWithText}>
        <span>or choose a professional</span>
      </div>

      {/* Technician List */}
      <div className={styles.techList}>
        {technicians.map((tech) => (
          <button
            key={tech.id}
            className={`card ${styles.techCard} ${
              !autoAssign && booking.technicianId === tech.id ? styles.techCardActive : ""
            } ${!tech.available ? styles.techCardDisabled : ""}`}
            onClick={() => tech.available && selectTechnician(tech)}
            disabled={!tech.available}
          >
            <div className={styles.techAvatar}>
              <span>{tech.initials}</span>
            </div>
            <div className={styles.techInfo}>
              <div className={styles.techHeader}>
                <h3 className={styles.techName}>{tech.name}</h3>
                {!tech.available && <span className={styles.unavailableBadge}>Unavailable</span>}
              </div>
              <span className={styles.techSpecialty}>{tech.specialty}</span>
              <div className={styles.techStats}>
                <span className={styles.techStat}>
                  <Star size={14} fill="#F59E0B" stroke="#F59E0B" />
                  {tech.rating}
                </span>
                <span className={styles.techStat}>
                  <CheckCircle size={14} />
                  {tech.jobs} jobs
                </span>
                <span className={styles.techStat}>
                  <Clock size={14} />
                  ~{tech.responseTime}min
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.stepActions}>
        <button className="btn btn-secondary btn-lg" onClick={onBack}>Back</button>
        <button className="btn btn-primary btn-lg" onClick={onNext}>
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
