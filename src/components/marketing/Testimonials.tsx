"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote, ShieldCheck, MapPin, MessageSquare } from "lucide-react";
import styles from "./Testimonials.module.css";

interface ReviewItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  service: string;
  text: string;
}

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRealReviews() {
      setLoading(true);
      try {
        const res = await fetch("/api/reviews");
        const data = await res.json();
        if (res.ok && data.reviews) {
          setReviews(data.reviews);
        }
      } catch (err) {
        console.warn("Failed to fetch client reviews:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRealReviews();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "VC";
    const parts = name.replace(/Engr\.|Dr\.|Chief|Mrs\.|Barrister/g, "").trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.substring(0, 2).toUpperCase() || "VC";
  };

  return (
    <section className={styles.section} ref={ref}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="badge badge-primary" style={{ marginBottom: "12px", background: "rgba(14,165,233,0.15)", color: "#0EA5E9" }}>
            ⭐ Verified Client Feedback
          </span>
          <h2 className="h2" style={{ color: "#F8FAFC" }}>What Our Clients Say</h2>
          <p className="subtitle">Real experiences from property owners and facility managers using HandyHub PRO</p>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#94A3B8", fontSize: "15px" }}>
            Loading verified reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              maxWidth: 600,
              margin: "0 auto",
              background: "#1E293B",
              border: "1px solid #334155",
            }}
          >
            <MessageSquare size={40} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 12 }} />
            <h3 className="h4" style={{ marginBottom: 6, color: "#F8FAFC" }}>No Client Reviews Yet</h3>
            <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0 }}>
              Be the first client to schedule a service and share your experience with our verified artisans.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {reviews.map((r, idx) => (
              <motion.div
                key={r.id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <Quote size={36} className={styles.quoteIcon} />
                
                <div>
                  <div className={styles.starsRow}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < r.rating ? "#F59E0B" : "none"}
                        stroke={i < r.rating ? "#F59E0B" : "#475569"}
                      />
                    ))}
                    <span className={styles.verifiedBadge}>
                      <ShieldCheck size={12} /> Verified Client
                    </span>
                  </div>

                  <p className={styles.text}>&ldquo;{r.text}&rdquo;</p>
                </div>

                <div className={styles.authorBox}>
                  <div className={styles.avatar}>{getInitials(r.name)}</div>
                  <div className={styles.authorMeta}>
                    <span className={styles.authorName}>{r.name}</span>
                    <span className={styles.serviceTitle}>{r.service}</span>
                    <span className={styles.locationTag}>
                      <MapPin size={11} color="#0EA5E9" /> {r.location}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
