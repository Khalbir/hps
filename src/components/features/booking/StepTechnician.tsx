"use client";

import { useState, useEffect } from "react";
import { Star, Clock, CheckCircle, UserCheck } from "lucide-react";
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

export function StepTechnician({ booking, updateBooking, onNext, onBack }: StepProps) {
  const [autoAssign, setAutoAssign] = useState(booking.autoAssign ?? true);
  const [realTechnicians, setRealTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRealArtisans() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/verification");
        const data = await res.json();
        if (res.ok && data.professionals) {
          const verified = data.professionals
            .filter((p: any) => p.verificationStatus === "VERIFIED" || p.verificationStatus === "APPROVED")
            .map((p: any) => {
              const fullName = p.name || "Verified Partner";
              const parts = fullName.split(" ");
              const initials = parts.length >= 2 ? `${parts[0].charAt(0)}${parts[1].charAt(0)}` : "VP";
              return {
                id: p.id,
                name: fullName,
                initials: initials.toUpperCase(),
                rating: Number(p.rating || 4.9),
                jobs: Number(p.totalJobs || 0),
                specialty: p.field || "Certified Service Partner",
                categories: [p.field ? p.field.toLowerCase() : "general"],
                responseTime: 15,
                available: true,
              };
            });

          // Sort by rating (descending) then jobs (descending)
          verified.sort((a: any, b: any) => {
            if (b.rating !== a.rating) {
              return b.rating - a.rating;
            }
            return b.jobs - a.jobs;
          });

          // Filter by required field (booking.serviceCategory)
          let filtered = verified;
          if (booking.serviceCategory) {
            const selectedCat = booking.serviceCategory.toLowerCase().trim();
            filtered = verified.filter((tech: any) => {
              const specialties = tech.categories.join(" ");
              return specialties.includes(selectedCat) || selectedCat.includes(specialties) || specialties.includes("general");
            });

            // If no match in the specific field, fall back to all verified professionals so list is not empty
            if (filtered.length === 0) {
              filtered = verified;
            }
          }

          setRealTechnicians(filtered);
        }
      } catch (err) {
        console.warn("Failed to fetch real database artisans:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRealArtisans();
  }, [booking.serviceCategory]);

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
      technicianName: "Auto-assign",
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
        style={{ border: autoAssign ? "2px solid #0EA5E9" : "1px solid var(--border-primary)" }}
      >
        <div className={styles.autoAssignIcon}>
          <CheckCircle size={24} color={autoAssign ? "#0EA5E9" : "var(--text-tertiary)"} />
        </div>
        <div className={styles.autoAssignContent}>
          <h3>Auto-assign best available</h3>
          <p>We&apos;ll match you with the highest-rated verified professional available for your time slot</p>
        </div>
        <div className={styles.recommendBadge}>Recommended</div>
      </button>

      <div className={styles.dividerWithText}>
        <span>or choose a professional</span>
      </div>

      {/* Technician List */}
      {loading ? (
        <div style={{ padding: "30px", textAlign: "center", color: "var(--text-tertiary)" }}>
          Checking registered verified artisans...
        </div>
      ) : realTechnicians.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "24px",
            textAlign: "center",
            background: "var(--bg-tertiary)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-primary)",
            marginBottom: "24px",
          }}
        >
          <UserCheck size={32} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 8 }} />
          <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "14px", marginBottom: 4 }}>
            Location Dispatch Active
          </strong>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, display: "block", maxWidth: "480px", margin: "0 auto" }}>
            Select &quot;Auto-assign best available&quot; above and our location intelligence will dispatch the nearest verified partner in your area upon booking confirmation.
          </span>
        </div>
      ) : (
        <div className={styles.techList}>
          {realTechnicians.map((tech) => (
            <button
              key={tech.id}
              className={`card ${styles.techCard} ${
                !autoAssign && booking.technicianId === tech.id ? styles.techCardActive : ""
              }`}
              onClick={() => selectTechnician(tech)}
            >
              <div className={styles.techAvatar}>
                <span>{tech.initials}</span>
              </div>
              <div className={styles.techInfo}>
                <div className={styles.techHeader}>
                  <h3 className={styles.techName}>{tech.name}</h3>
                </div>
                <span className={styles.techSpecialty}>{tech.specialty}</span>
                <div className={styles.techStats}>
                  <span className={styles.techStat}>
                    <Star size={14} fill="#F59E0B" stroke="#F59E0B" />
                    {tech.rating} ({tech.jobs} {tech.jobs === 1 ? "job" : "jobs"})
                  </span>
                  <span className={styles.techStat}>
                    <CheckCircle size={14} />
                    Verified Partner
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className={styles.stepActions}>
        <button className="btn btn-secondary btn-lg" onClick={onBack}>Back</button>
        <button className="btn btn-primary btn-lg" onClick={onNext} style={{ background: "#0EA5E9" }}>
          Continue to Payment ➔
        </button>
      </div>
    </div>
  );
}
