"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote, MessageSquare } from "lucide-react";
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

  return (
    <section className={`section ${styles.section}`} ref={ref}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="badge badge-primary">Client Feedback</span>
          <h2 className="h2">What Our Clients Say</h2>
          <p className="subtitle">Real experiences from property owners who used HandyHub PRO</p>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
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
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <MessageSquare size={40} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 12 }} />
            <h3 className="h4" style={{ marginBottom: 6, color: "var(--text-primary)" }}>No Client Reviews Yet</h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
              Be the first client to schedule a service and share your experience with our verified artisans.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {reviews.map((r) => (
              <motion.div key={r.id} className={`card ${styles.card}`}>
                <Quote size={32} className={styles.quoteIcon} />
                <div className={styles.rating}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < r.rating ? "#F59E0B" : "none"}
                      stroke={i < r.rating ? "#F59E0B" : "var(--text-tertiary)"}
                    />
                  ))}
                </div>
                <p className={styles.text}>&ldquo;{r.text}&rdquo;</p>
                <div className={styles.author}>
                  <div>
                    <strong className={styles.authorName}>{r.name}</strong>
                    <span className={styles.authorMeta}>{r.service} • {r.location}</span>
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
