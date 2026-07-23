"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, CheckCircle, Star, Zap } from "lucide-react";
import styles from "./Stats.module.css";

const stats = [
  { icon: CheckCircle, value: 5000, suffix: "+", label: "Jobs Completed" },
  { icon: Users, value: 500, suffix: "+", label: "Verified Professionals" },
  { icon: Star, value: 4.9, suffix: "★", label: "Average Rating", isDecimal: true },
  { icon: Zap, value: 30, suffix: "min", label: "Avg. Response Time" },
];

function AnimatedNumber({ target, isDecimal, suffix }: { target: number; isDecimal?: boolean; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className={styles.value}>
      {isDecimal ? count.toFixed(1) : Math.floor(count).toLocaleString()}
      <span className={styles.suffix}>{suffix}</span>
    </span>
  );
}

export function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
              <stat.icon size={22} />
            </div>
            <AnimatedNumber target={stat.value} isDecimal={stat.isDecimal} suffix={stat.suffix} />
            <span className={styles.label}>{stat.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
