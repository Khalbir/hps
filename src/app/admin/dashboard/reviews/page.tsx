"use client";

import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { Star, MessageSquare, ShieldCheck, ThumbsUp } from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminReviewsPage() {
  const reviews = [
    { id: "rev_1", customer: "Amina I.", pro: "Blessing O.", rating: 5, comment: "Blessing was super thorough with the deep cleaning. Spotless living room!", service: "Deep Cleaning", date: "Yesterday" },
    { id: "rev_2", customer: "Chidi O.", pro: "Abubakar T.", rating: 5, comment: "Fixed the burning socket quickly and explained safety tips.", service: "Electrical Repairs", date: "3 days ago" },
    { id: "rev_3", customer: "Usman D.", pro: "Yusuf A.", rating: 4, comment: "Good AC servicing. Arrived on time.", service: "AC Servicing", date: "Jul 28, 2026" },
  ];

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Reviews & Rating Controls</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Monitor customer feedback, ratings, and moderate professional service quality.
          </p>
        </div>
      </header>

      <div className={styles.adminContent}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {reviews.map((r) => (
            <div key={r.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                  <div style={{ display: "flex" }}>
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="#F59E0B" stroke="#F59E0B" />
                    ))}
                  </div>
                  <strong style={{ fontSize: "var(--fs-sm)" }}>{r.service}</strong>
                </div>
                <p style={{ fontSize: "var(--fs-md)", fontStyle: "italic", margin: "var(--space-2) 0" }}>&ldquo;{r.comment}&rdquo;</p>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
                  By {r.customer} for Pro: <strong style={{ color: "var(--color-primary-400)" }}>{r.pro}</strong> • {r.date}
                </span>
              </div>
              <button className="btn btn-secondary btn-xs">Moderate</button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayoutShell>
  );
}
