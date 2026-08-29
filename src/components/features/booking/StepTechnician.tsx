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

const CATEGORY_TRADE_SYNONYMS: Record<string, string[]> = {
  outdoor: ["outdoor", "gardening", "gardener", "landscaping", "lawn", "grass", "tree", "groundskeeping", "horticulture", "compound"],
  gardening: ["outdoor", "gardening", "gardener", "landscaping", "lawn", "grass", "tree", "groundskeeping", "horticulture", "compound"],
  cleaning: ["cleaning", "cleaner", "housekeeping", "maid", "janitor", "janitorial", "dusting", "sweeping", "mopping", "deep cleaning"],
  fumigation: ["fumigation", "fumigator", "pest", "pest control", "pest-control", "exterminator", "bedbug", "termite", "disinfection"],
  upholstery: ["upholstery", "carpet", "rug", "sofa", "couch", "mattress", "curtain", "steam cleaning"],
  plumbing: ["plumbing", "plumber", "pipe", "drain", "drainage", "leak", "faucet", "water pump", "sewage", "sanitary", "borehole"],
  electrical: ["electrical", "electrician", "wiring", "power", "lighting", "fuse", "inverter", "generator", "appliance", "circuit"],
  hvac: ["hvac", "ac", "air conditioner", "air conditioning", "cooling", "refrigeration", "fridge"],
  painting: ["painting", "painter", "screeding", "wall", "coating", "plastering"],
  carpentry: ["carpentry", "carpenter", "woodwork", "wood", "furniture", "cabinet", "joinery", "roofing"],
  security: ["security", "cctv", "camera", "alarm", "access control", "surveillance", "intercom", "electric fence"],
  solar: ["solar", "solar installation", "inverter", "battery", "photovoltaic", "renewable"],
  "home-improvement": ["home improvement", "renovation", "tiling", "tile", "masonry", "mason", "bricklayer", "interior decor", "pop", "drywall", "building"],
  laundry: ["laundry", "dry clean", "dry cleaning", "washing", "ironing", "wash & fold"],
  moving: ["moving", "relocation", "mover", "hauling", "logistics", "packing", "transport"],
  general: ["handyman", "general handyman", "odd jobs", "repairs", "maintenance"],
};

function matchesSkillset(artisanCategories: string[], bookingCategory: string, bookingServiceId?: string): boolean {
  if (!bookingCategory) return true;
  const targetCategoryKey = bookingCategory.toLowerCase().trim();
  const serviceKey = (bookingServiceId || "").toLowerCase().trim();

  // Get all synonym tokens for this category
  const targetTokens = new Set<string>([
    targetCategoryKey,
    ...(CATEGORY_TRADE_SYNONYMS[targetCategoryKey] || []),
  ]);
  if (serviceKey) {
    targetTokens.add(serviceKey);
    const words = serviceKey.split("-");
    words.forEach((w) => {
      if (w.length > 2) targetTokens.add(w);
    });
  }

  // Check if any of the artisan's registered categories/fields matches the trade tokens
  return artisanCategories.some((cat) => {
    const cleanCat = cat.toLowerCase().trim();
    if (!cleanCat) return false;

    for (const token of targetTokens) {
      if (cleanCat.includes(token) || token.includes(cleanCat)) {
        return true;
      }
    }
    return false;
  });
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
            .filter((p: any) => p.verificationStatus === "VERIFIED" || p.verificationStatus === "APPROVED" || p.status === "VERIFIED")
            .map((p: any) => {
              const fullName = p.name || "Verified Partner";
              const parts = fullName.split(" ");
              const initials = parts.length >= 2 ? `${parts[0].charAt(0)}${parts[1].charAt(0)}` : "VP";

              // Extract all verified trade categories for this artisan
              const tradeCats: string[] = [];
              if (p.field) tradeCats.push(p.field.toLowerCase());
              if (p.primaryField) tradeCats.push(p.primaryField.toLowerCase());
              if (p.secondaryField) tradeCats.push(p.secondaryField.toLowerCase());
              if (p.secondaryCategory) tradeCats.push(p.secondaryCategory.toLowerCase());
              if (Array.isArray(p.tradeVerifications)) {
                p.tradeVerifications.forEach((tv: any) => {
                  if (tv.tradeCategory) tradeCats.push(tv.tradeCategory.toLowerCase());
                  if (tv.tradeName) tradeCats.push(tv.tradeName.toLowerCase());
                });
              }

              return {
                id: p.id,
                name: fullName,
                initials: initials.toUpperCase(),
                rating: Number(p.rating || 4.9),
                jobs: Number(p.totalJobs || 0),
                specialty: p.field || p.primaryField || "Certified Service Partner",
                categories: Array.from(new Set(tradeCats.filter(Boolean))),
                responseTime: 15,
                available: true,
                isTradeCertified: false,
              };
            });

          // Sort by rating (descending) then jobs (descending)
          verified.sort((a: any, b: any) => {
            if (b.rating !== a.rating) {
              return b.rating - a.rating;
            }
            return b.jobs - a.jobs;
          });

          // STRICT FILTER: Only show specialists that match the selected trade skillsets
          const selectedCat = (booking.serviceCategory || "").toLowerCase().trim();
          const selectedSvc = (booking.serviceId || "").toLowerCase().trim();
          const matchingSpecialists = verified.filter((tech: any) =>
            matchesSkillset(tech.categories, selectedCat, selectedSvc)
          );

          // Only display actual matching technicians. Do not fall back to unrelated trades.
          setRealTechnicians(matchingSpecialists);
        }
      } catch (err) {
        console.warn("Failed to fetch real database artisans:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRealArtisans();
  }, [booking.serviceCategory, booking.serviceId]);

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
            padding: "26px 20px",
            textAlign: "center",
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "14px",
            border: "1px solid #334155",
            marginBottom: "24px",
          }}
        >
          <UserCheck size={36} color="#0EA5E9" style={{ opacity: 0.8, marginBottom: 8 }} />
          <strong style={{ display: "block", color: "#F8FAFC", fontSize: "14px", marginBottom: 4 }}>
            Automated Smart Dispatch Active
          </strong>
          <span style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.5, display: "block", maxWidth: "500px", margin: "0 auto" }}>
            No individual technicians for this specific trade are currently available for manual selection. Keep <strong>&ldquo;Auto-assign best available&rdquo;</strong> selected above and our dispatch system will match the highest-rated verified specialist in your area upon booking.
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
