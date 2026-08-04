"use client";

import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Star, ThumbsUp, Award } from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProReviewsPage() {
  const reviews = [
    { id: "r1", customer: "Amina I.", rating: 5, service: "Deep Cleaning", comment: "Blessing was super thorough and professional. The house smelled amazing and was spotless!", date: "Yesterday" },
    { id: "r2", customer: "Chidi O.", rating: 5, service: "Residential Cleaning", comment: "On time and very efficient. Highly recommended!", date: "3 days ago" },
    { id: "r3", customer: "Grace N.", rating: 4, service: "Post Construction", comment: "Good quality service. Friendly attitude.", date: "Jul 15, 2026" },
  ];

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 className="h2">Customer Reviews & Rating Breakdown</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
          Track your overall client feedback, star rating, and service quality awards.
        </p>
      </div>

      {/* Summary Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: "var(--fs-5xl)", fontWeight: "var(--fw-extrabold)", color: "#F59E0B", lineHeight: 1 }}>
            4.9
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, margin: "var(--space-2) 0" }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} fill="#F59E0B" stroke="#F59E0B" />
            ))}
          </div>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>Based on 48 verified customer ratings</span>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ fontSize: "var(--fs-xs)", width: 50 }}>5 Stars</span>
            <div style={{ flex: 1, height: 8, background: "var(--bg-tertiary)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: "90%", height: "100%", background: "#F59E0B" }} />
            </div>
            <span style={{ fontSize: "var(--fs-xs)", fontWeight: "bold" }}>90%</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ fontSize: "var(--fs-xs)", width: 50 }}>4 Stars</span>
            <div style={{ flex: 1, height: 8, background: "var(--bg-tertiary)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: "10%", height: "100%", background: "#F59E0B" }} />
            </div>
            <span style={{ fontSize: "var(--fs-xs)", fontWeight: "bold" }}>10%</span>
          </div>
        </div>
      </div>

      {/* Review List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {reviews.map((r) => (
          <div key={r.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
              <strong style={{ fontSize: "var(--fs-base)" }}>{r.customer}</strong>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{r.date}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
              <div style={{ display: "flex" }}>
                {[...Array(r.rating)].map((_, i) => (
                  <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                ))}
              </div>
              <span className="badge" style={{ background: "rgba(14,165,233,0.1)", color: "#0EA5E9" }}>
                {r.service}
              </span>
            </div>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>&ldquo;{r.comment}&rdquo;</p>
          </div>
        ))}
      </div>
    </ProLayoutShell>
  );
}
