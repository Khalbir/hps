"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Star, Award, Inbox, RefreshCw, CheckCircle2, ShieldCheck, MessageSquareQuote, Filter } from "lucide-react";

interface ReviewItem {
  id: string;
  customer: string;
  customerAvatar?: string | null;
  rating: number;
  service: string;
  comment: string;
  date: string;
  verified?: boolean;
}

interface StatsData {
  avg: number;
  count: number;
  fiveStarPct: string;
  fourStarPct: string;
  threeStarPct: string;
  twoStarPct: string;
  oneStarPct: string;
  breakdown: Record<number, number>;
}

export default function ProReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<number | "ALL">("ALL");
  const [ratingStats, setRatingStats] = useState<StatsData>({
    avg: 5.0,
    count: 0,
    fiveStarPct: "100%",
    fourStarPct: "0%",
    threeStarPct: "0%",
    twoStarPct: "0%",
    oneStarPct: "0%",
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [artisanInfo, setArtisanInfo] = useState<{ name: string; digitalId: string }>({
    name: "Professional Artisan",
    digitalId: "HHP-PRO-VERIFIED",
  });
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
      const res = await fetch(`/api/pro/reviews?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.reviews) {
          setReviews(data.reviews);
        }
        if (data.stats) {
          setRatingStats(data.stats);
        }
        if (data.artisanName || data.digitalId) {
          setArtisanInfo({
            name: data.artisanName || "Professional Artisan",
            digitalId: data.digitalId || "HHP-PRO-VERIFIED",
          });
        }
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

  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === "ALL") return true;
    return Math.round(r.rating) === selectedFilter;
  });

  return (
    <ProLayoutShell>
      {/* Header */}
      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h1 className="h2" style={{ margin: 0 }}>Customer Reviews & Rating Breakdown</h1>
            <span style={{ fontSize: "11px", background: "rgba(14,165,233,0.15)", color: "#0EA5E9", padding: "2px 8px", borderRadius: 6, fontWeight: "bold" }}>
              {artisanInfo.digitalId}
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)", margin: 0 }}>
            Track client ratings transcribed to your verified profile and escrow service performance.
          </p>
        </div>
        <button onClick={fetchRealReviews} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Reviews
        </button>
      </div>

      {/* Summary Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        {/* Rating Score Card */}
        <div className="card" style={{ textAlign: "center", padding: "var(--space-6)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#F59E0B", lineHeight: 1, textShadow: "0 0 25px rgba(245,158,11,0.3)" }}>
            {ratingStats.avg.toFixed(1)}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, margin: "10px 0" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={22}
                fill={star <= Math.round(ratingStats.avg) ? "#F59E0B" : "none"}
                stroke="#F59E0B"
              />
            ))}
          </div>
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-primary)", fontWeight: 600 }}>
            {ratingStats.count} Verified Client Reviews
          </span>
          <span style={{ fontSize: "var(--fs-xs)", color: "#10B981", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <ShieldCheck size={14} /> 100% Escrow Verified Transcriptions
          </span>
        </div>

        {/* 5-Star Breakdown Progress Bars */}
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "10px", padding: "var(--space-6)" }}>
          <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Rating Distribution
          </span>

          {[
            { stars: 5, label: "5 Stars", pct: ratingStats.fiveStarPct, count: ratingStats.breakdown?.[5] || 0, color: "#F59E0B" },
            { stars: 4, label: "4 Stars", pct: ratingStats.fourStarPct, count: ratingStats.breakdown?.[4] || 0, color: "#10B981" },
            { stars: 3, label: "3 Stars", pct: ratingStats.threeStarPct || "0%", count: ratingStats.breakdown?.[3] || 0, color: "#0EA5E9" },
            { stars: 2, label: "2 Stars", pct: ratingStats.twoStarPct || "0%", count: ratingStats.breakdown?.[2] || 0, color: "#F97316" },
            { stars: 1, label: "1 Star", pct: ratingStats.oneStarPct || "0%", count: ratingStats.breakdown?.[1] || 0, color: "#EF4444" },
          ].map((item) => (
            <div key={item.stars} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <span style={{ fontSize: "12px", width: 48, color: "var(--text-secondary)", fontWeight: 500 }}>
                {item.label}
              </span>
              <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: item.pct, height: "100%", background: item.color, borderRadius: 4, transition: "width 0.4s ease" }} />
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)", width: 45, textAlign: "right", fontWeight: "bold" }}>
                {item.pct} ({item.count})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--space-4)", overflowX: "auto", paddingBottom: 4 }}>
        <button
          onClick={() => setSelectedFilter("ALL")}
          className={`btn btn-sm ${selectedFilter === "ALL" ? "btn-primary" : "btn-secondary"}`}
          style={{ borderRadius: 20, fontSize: "12px", padding: "6px 14px" }}
        >
          All Reviews ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map((s) => {
          const c = ratingStats.breakdown?.[s] || 0;
          return (
            <button
              key={s}
              onClick={() => setSelectedFilter(s)}
              className={`btn btn-sm ${selectedFilter === s ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: 20, fontSize: "12px", padding: "6px 14px" }}
            >
              {s} Stars ({c})
            </button>
          );
        })}
      </div>

      {/* Review List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px", color: "#0EA5E9" }} />
            Loading transcribed client feedback...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center", background: "var(--bg-tertiary)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-primary)" }}>
            <Inbox size={48} color="#F59E0B" style={{ opacity: 0.6, marginBottom: 14 }} />
            <h3 className="h3" style={{ margin: "0 0 8px 0", color: "var(--text-primary)" }}>
              {selectedFilter === "ALL" ? "No Customer Reviews Yet" : `No ${selectedFilter}-Star Reviews`}
            </h3>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-secondary)", maxWidth: "460px", marginLeft: "auto", marginRight: "auto" }}>
              {selectedFilter === "ALL"
                ? "When clients complete service bookings with you, their ratings and reviews are transcribed directly to this ledger."
                : `You currently do not have any ${selectedFilter}-star reviews in this filter.`}
            </p>
          </div>
        ) : (
          filteredReviews.map((r) => (
            <div
              key={r.id}
              className="card"
              style={{
                background: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "var(--radius-xl)",
                padding: "20px",
                transition: "transform 0.2s, border-color 0.2s",
              }}
            >
              {/* Review Card Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0EA5E9, #2563EB)",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textTransform: "uppercase",
                      boxShadow: "0 2px 8px rgba(14,165,233,0.3)",
                    }}
                  >
                    {r.customer.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <strong style={{ fontSize: "var(--fs-base)", color: "var(--text-primary)" }}>
                        {r.customer}
                      </strong>
                      <span style={{ fontSize: "10px", color: "#10B981", background: "rgba(16,185,129,0.15)", padding: "2px 6px", borderRadius: 4, fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <CheckCircle2 size={11} /> Verified Client
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{r.date}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 2, background: "rgba(245,158,11,0.1)", padding: "4px 8px", borderRadius: 8 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < Math.round(r.rating) ? "#F59E0B" : "none"}
                        stroke="#F59E0B"
                      />
                    ))}
                    <span style={{ fontSize: "12px", color: "#F59E0B", fontWeight: "bold", marginLeft: 4 }}>
                      {r.rating}.0
                    </span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: "rgba(14,165,233,0.12)",
                      color: "#38BDF8",
                      border: "1px solid rgba(14,165,233,0.3)",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {r.service}
                  </span>
                </div>
              </div>

              {/* Review Comment Box */}
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  borderLeft: "3px solid #0EA5E9",
                  position: "relative",
                }}
              >
                <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic" }}>
                  &ldquo;{r.comment}&rdquo;
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </ProLayoutShell>
  );
}
