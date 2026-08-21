"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Star, Inbox, RefreshCw, CheckCircle2, ShieldCheck, MessageSquareQuote } from "lucide-react";
import styles from "./reviews.module.css";

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
    avg: 4.5,
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
      <div className={styles.container}>
        {/* Header Row */}
        <div className={styles.headerRow}>
          <div className={styles.titleArea}>
            <div className={styles.titleWrap}>
              <h1 className={styles.pageTitle}>Customer Reviews & Ledger</h1>
              <span className={styles.idBadge}>{artisanInfo.digitalId}</span>
            </div>
            <p className={styles.pageSubtitle}>
              Audited client ratings transcribed to your verified profile and escrow payout ledger.
            </p>
          </div>
          <button
            onClick={fetchRealReviews}
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, borderRadius: 10 }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Feedback
          </button>
        </div>

        {/* Executive Summary Grid */}
        <div className={styles.summaryGrid}>
          {/* Score Card */}
          <div className={styles.scoreCard}>
            <div className={styles.bigScore}>{ratingStats.avg.toFixed(1)}</div>
            <div className={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  fill={star <= Math.round(ratingStats.avg) ? "#F59E0B" : "none"}
                  stroke="#F59E0B"
                  strokeWidth={2}
                />
              ))}
            </div>
            <span className={styles.reviewCountLabel}>
              {ratingStats.count} Verified Client Reviews
            </span>
            <span className={styles.verifiedBadgeMicro}>
              <ShieldCheck size={14} /> 100% Escrow Verified
            </span>
          </div>

          {/* 5-Star Breakdown Progress Bars */}
          <div className={styles.distributionCard}>
            <span className={styles.distTitle}>Rating Distribution</span>
            {[
              { stars: 5, label: "5 ★", pct: ratingStats.fiveStarPct, count: ratingStats.breakdown?.[5] || 0, color: "#FF6B00" },
              { stars: 4, label: "4 ★", pct: ratingStats.fourStarPct, count: ratingStats.breakdown?.[4] || 0, color: "#10B981" },
              { stars: 3, label: "3 ★", pct: ratingStats.threeStarPct || "0%", count: ratingStats.breakdown?.[3] || 0, color: "#00A8B5" },
              { stars: 2, label: "2 ★", pct: ratingStats.twoStarPct || "0%", count: ratingStats.breakdown?.[2] || 0, color: "#F97316" },
              { stars: 1, label: "1 ★", pct: ratingStats.oneStarPct || "0%", count: ratingStats.breakdown?.[1] || 0, color: "#EF4444" },
            ].map((item) => (
              <div key={item.stars} className={styles.distRow}>
                <span className={styles.distLabel}>{item.label}</span>
                <div className={styles.trackBg}>
                  <div
                    className={styles.trackFill}
                    style={{ width: item.pct, background: item.color }}
                  />
                </div>
                <span className={styles.distStats}>
                  {item.pct} ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Responsive Filter Tabs (No Truncation / No Overflow) */}
        <div className={styles.filterScrollContainer}>
          <button
            type="button"
            onClick={() => setSelectedFilter("ALL")}
            className={`${styles.filterPill} ${selectedFilter === "ALL" ? styles.filterPillActive : ""}`}
          >
            All Reviews <span className={styles.countDot}>{reviews.length}</span>
          </button>
          {[5, 4, 3, 2, 1].map((s) => {
            const count = ratingStats.breakdown?.[s] || 0;
            return (
              <button
                type="button"
                key={s}
                onClick={() => setSelectedFilter(s)}
                className={`${styles.filterPill} ${selectedFilter === s ? styles.filterPillActive : ""}`}
              >
                {s} Stars <span className={styles.countDot}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Review Cards List */}
        <div className={styles.reviewsList}>
          {loading ? (
            <div className="card" style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-tertiary)", borderRadius: 14 }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 10px", color: "#00A8B5" }} />
              Loading verified feedback ledger...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="card" style={{ padding: "48px 24px", textAlign: "center", background: "var(--bg-tertiary)", borderRadius: 16, border: "1px solid var(--border-primary)" }}>
              <Inbox size={44} color="#00A8B5" style={{ opacity: 0.6, marginBottom: 12 }} />
              <h3 className="h3" style={{ margin: "0 0 6px 0", color: "var(--text-primary)", fontSize: "1.15rem" }}>
                {selectedFilter === "ALL" ? "No Customer Reviews Yet" : `No ${selectedFilter}-Star Reviews`}
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", maxWidth: "440px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
                {selectedFilter === "ALL"
                  ? "When clients complete service bookings with you, their ratings and reviews are transcribed directly to this ledger."
                  : `You currently do not have any ${selectedFilter}-star reviews in this filter.`}
              </p>
            </div>
          ) : (
            filteredReviews.map((r) => (
              <div key={r.id} className={styles.reviewCard}>
                {/* Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.customerMeta}>
                    <div className={styles.avatarCircle}>
                      {r.customer.charAt(0)}
                    </div>
                    <div className={styles.nameBlock}>
                      <div className={styles.nameLine}>
                        <span className={styles.customerName}>{r.customer}</span>
                        <span className={styles.verifiedTag}>
                          <CheckCircle2 size={11} /> Verified Client
                        </span>
                      </div>
                      <span className={styles.reviewDate}>{r.date}</span>
                    </div>
                  </div>

                  <div className={styles.headerRightMeta}>
                    <div className={styles.starBadge}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < Math.round(r.rating) ? "#F59E0B" : "none"}
                          stroke="#F59E0B"
                          strokeWidth={2}
                        />
                      ))}
                      <span className={styles.starScoreNum}>{r.rating}.0</span>
                    </div>
                    <span className={styles.serviceTag}>{r.service}</span>
                  </div>
                </div>

                {/* Compact Quote Box */}
                <div className={styles.commentBox}>
                  <p className={styles.commentText}>&ldquo;{r.comment}&rdquo;</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ProLayoutShell>
  );
}
