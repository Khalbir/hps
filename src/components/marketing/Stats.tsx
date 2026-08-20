"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, CheckCircle, Star, Zap } from "lucide-react";
import styles from "./Stats.module.css";

export function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [liveStats, setLiveStats] = useState({
    jobsCount: 623,
    verifiedProsCount: 1062,
    rating: 5.0,
    responseTime: 30,
  });

  useEffect(() => {
    async function fetchLiveStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (res.ok) {
          setLiveStats({
            jobsCount: data.jobsCount || 623,
            verifiedProsCount: data.verifiedProsCount || 1062,
            rating: data.rating || 5.0,
            responseTime: data.responseTime || 30,
          });
        }
      } catch (err) {
        console.warn("Failed to fetch live stats:", err);
      }
    }
    fetchLiveStats();
  }, []);

  const stats = [
    { icon: CheckCircle, value: liveStats.jobsCount, suffix: "", label: "Completed Dispatches" },
    { icon: Users, value: liveStats.verifiedProsCount, suffix: "", label: "Verified Professionals" },
    { icon: Star, value: liveStats.rating, suffix: "★", label: "Satisfaction Rating", isDecimal: true },
    { icon: Zap, value: liveStats.responseTime, suffix: "min", label: "Dispatch SLA" },
  ];

  return (
    <section className={styles.stats} ref={ref}>
      <div className={`container ${styles.container}`}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={styles.stat}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className={styles.iconWrap}>
              <stat.icon size={24} />
            </div>
            <div className={styles.info}>
              <span className={styles.value}>
                {stat.isDecimal ? stat.value.toFixed(1) : stat.value.toLocaleString()}
                <span className={styles.suffix}>{stat.suffix}</span>
              </span>
              <span className={styles.label}>{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
