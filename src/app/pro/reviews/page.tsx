"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Star, ThumbsUp, Award, Inbox, RefreshCw } from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState({ avg: 5.0, count: 0, fiveStarPct: "100%", fourStarPct: "0%" });
  const [loading, setLoading] = useState(true);

  const fetchRealReviews = async () => {
    setLoading(true);
    let activeUserId = "";
    let activeEmail = "";

    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
        if (parsed?.user?.email || parsed?.email) activeEmail = parsed.user?.email || parsed.email;
      } catch (err) {}
    }

    try {
      const res = await fetch(`/api/pro/dashboard?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok && data.rating) {
        setRatingStats({
          avg: data.rating || 5.0,
          count: data.completedJobs || 0,
          fiveStarPct: data.completedJobs > 0 ? "100%" : "0%",
          fourStarPct: "0%",
        });
      }
    } catch (err) {
      console.warn("Failed to fetch real reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealReviews();
  }, []);

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="h2">Customer Reviews & Rating Breakdown</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
            Track your overall client feedback, star rating, and service quality awards.
          </p>
        </div>
        <button onClick={fetchRealReviews} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refresh Reviews
        </button>
      </div>

      {/* Summary Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: "var(--fs-5xl)", fontWeight: "var(--fw-extrabold)", color: "#F59E0B", lineHeight: 1 }}>
            {ratingStats.avg}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, margin: "var(--space-2) 0" }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} fill="#F59E0B" stroke="#F59E0B" />
            ))}
          </div>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>
            Based on {ratingStats.count} verified completed jobs
          </span>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ fontSize: "var(--fs-xs)", width: 50 }}>5 Stars</span>
            <div style={{ flex: 1, height: 8, background: "var(--bg-tertiary)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: ratingStats.fiveStarPct, height: "100%", background: "#F59E0B" }} />
            </div>
            <span style={{ fontSize: "var(--fs-xs)", fontWeight: "bold" }}>{ratingStats.fiveStarPct}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ fontSize: "var(--fs-xs)", width: 50 }}>4 Stars</span>
            <div style={{ flex: 1, height: 8, background: "var(--bg-tertiary)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: ratingStats.fourStarPct, height: "100%", background: "#F59E0B" }} />
            </div>
            <span style={{ fontSize: "var(--fs-xs)", fontWeight: "bold" }}>{ratingStats.fourStarPct}</span>
          </div>
        </div>
      </div>

      {/* Review List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--text-tertiary)" }}>Loading customer reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="card" style={{ padding: "40px", textAlign: "center", background: "var(--bg-tertiary)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-primary)" }}>
            <Inbox size={40} color="#F59E0B" style={{ opacity: 0.6, marginBottom: 12 }} />
            <h4 className="h4" style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>No Customer Reviews Yet</h4>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-secondary)", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
              When clients complete service bookings with you, their ratings and reviews will display here.
            </p>
          </div>
        ) : (
          reviews.map((r) => (
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
          ))
        )}
      </div>
    </ProLayoutShell>
  );
}
