"use client";

import { useState, useEffect } from "react";
import { Star, Clock, CheckCircle } from "lucide-react";
import type { BookingData } from "@/app/book/page";
import styles from "./Steps.module.css";

interface StepProps {
  booking: BookingData;
  updateBooking: (u: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface Technician {
  id: string;
  name: string;
  initials: string;
  rating: number;
  jobs: number;
  specialty: string;
  categories: string[];
  responseTime: number;
  available: boolean;
}

export const technicians: Technician[] = [
  // Cleaning
  { id: "2", name: "Blessing O.", initials: "BO", rating: 4.8, jobs: 312, specialty: "Cleaning Lead", categories: ["cleaning"], responseTime: 15, available: true },
  { id: "7", name: "Grace E.", initials: "GE", rating: 4.9, jobs: 184, specialty: "Deep Cleaning Specialist", categories: ["cleaning"], responseTime: 20, available: true },
  { id: "8", name: "Kemi A.", initials: "KA", rating: 4.7, jobs: 142, specialty: "Residential Cleaner", categories: ["cleaning"], responseTime: 25, available: true },

  // Plumbing
  { id: "3", name: "Ibrahim M.", initials: "IM", rating: 4.9, jobs: 189, specialty: "Master Plumber", categories: ["plumbing"], responseTime: 25, available: true },
  { id: "9", name: "Sunday O.", initials: "SO", rating: 4.8, jobs: 215, specialty: "Pipe & Drainage Pro", categories: ["plumbing"], responseTime: 20, available: true },
  { id: "10", name: "Paul K.", initials: "PK", rating: 4.7, jobs: 96, specialty: "Water Heater Specialist", categories: ["plumbing"], responseTime: 30, available: true },

  // Electrical
  { id: "1", name: "Abubakar T.", initials: "AT", rating: 4.9, jobs: 247, specialty: "Senior Electrician", categories: ["electrical"], responseTime: 20, available: true },
  { id: "11", name: "Samuel I.", initials: "SI", rating: 4.8, jobs: 178, specialty: "Wiring & Breaker Specialist", categories: ["electrical"], responseTime: 15, available: true },

  // AC & HVAC
  { id: "5", name: "Yusuf A.", initials: "YA", rating: 4.7, jobs: 156, specialty: "AC Technician", categories: ["hvac"], responseTime: 20, available: true },
  { id: "12", name: "David O.", initials: "DO", rating: 4.9, jobs: 230, specialty: "Cooling & Servicing Pro", categories: ["hvac"], responseTime: 18, available: true },

  // Painting
  { id: "6", name: "Ngozi N.", initials: "NN", rating: 4.8, jobs: 201, specialty: "Professional Painter", categories: ["painting"], responseTime: 18, available: true },
  { id: "13", name: "Emeka U.", initials: "EU", rating: 4.9, jobs: 165, specialty: "Interior & Exterior Painter", categories: ["painting", "home-improvement"], responseTime: 22, available: true },

  // Carpentry
  { id: "14", name: "Usman B.", initials: "UB", rating: 4.8, jobs: 145, specialty: "Master Carpenter", categories: ["carpentry"], responseTime: 25, available: true },
  { id: "15", name: "John D.", initials: "JD", rating: 4.7, jobs: 110, specialty: "Furniture Assembly Pro", categories: ["carpentry"], responseTime: 30, available: true },

  // Security
  { id: "16", name: "Farouk H.", initials: "FH", rating: 4.9, jobs: 198, specialty: "CCTV & Security Specialist", categories: ["security"], responseTime: 20, available: true },

  // Solar & Power
  { id: "17", name: "Emmanuel K.", initials: "EK", rating: 4.9, jobs: 260, specialty: "Solar & Inverter Engineer", categories: ["solar"], responseTime: 15, available: true },
  { id: "18", name: "Mohammed S.", initials: "MS", rating: 4.7, jobs: 134, specialty: "Generator Specialist", categories: ["solar"], responseTime: 25, available: true },

  // Home Improvement
  { id: "4", name: "Chioma E.", initials: "CE", rating: 5.0, jobs: 78, specialty: "Interior Decorator", categories: ["home-improvement"], responseTime: 30, available: true },
  { id: "19", name: "Jude A.", initials: "JA", rating: 4.8, jobs: 112, specialty: "Renovation Specialist", categories: ["home-improvement"], responseTime: 20, available: true },

  // Gardening
  { id: "20", name: "Patrick O.", initials: "PO", rating: 4.8, jobs: 89, specialty: "Gardener & Landscaper", categories: ["outdoor"], responseTime: 20, available: true },

  // Laundry
  { id: "21", name: "Victoria A.", initials: "VA", rating: 4.9, jobs: 240, specialty: "Laundry & Fabric Care Pro", categories: ["laundry"], responseTime: 15, available: true },

  // Moving
  { id: "22", name: "Victor E.", initials: "VE", rating: 4.8, jobs: 175, specialty: "Relocation & Moving Lead", categories: ["moving"], responseTime: 25, available: true },

  // General Handyman
  { id: "23", name: "Chidi N.", initials: "CN", rating: 4.7, jobs: 310, specialty: "General Handyman Pro", categories: ["general"], responseTime: 15, available: true },
];

export function StepTechnician({ booking, updateBooking, onNext, onBack }: StepProps) {
  const [autoAssign, setAutoAssign] = useState(booking.autoAssign);

  // Filter technicians strictly by the selected service category
  const filteredTechnicians = booking.serviceCategory
    ? technicians.filter((tech) => tech.categories.includes(booking.serviceCategory))
    : technicians;

  const displayedTechnicians = filteredTechnicians.length > 0 ? filteredTechnicians : technicians;

  const selectTechnician = (tech: Technician) => {
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
      <p className={styles.stepSubtitle}>
        Select a verified professional specializing in your chosen service field
      </p>

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
        {displayedTechnicians.map((tech) => (
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
