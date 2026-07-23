"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ShieldCheck,
  BadgeCheck,
  HeartHandshake,
  Zap,
  Banknote,
  MapPin,
} from "lucide-react";
import styles from "./TrustBuilders.module.css";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Verified & Background-Checked",
    description: "Every professional undergoes thorough identity verification and background checks before joining our platform.",
  },
  {
    icon: BadgeCheck,
    title: "Fully Insured Services",
    description: "All services are backed by insurance. If anything goes wrong, we've got you covered — no questions asked.",
  },
  {
    icon: HeartHandshake,
    title: "100% Satisfaction Guarantee",
    description: "Not happy with the service? We'll send another professional at no extra cost or give you a full refund.",
  },
  {
    icon: Zap,
    title: "Same-Day Service Available",
    description: "Urgent issue? We have professionals available for emergency same-day bookings across Abuja.",
  },
  {
    icon: Banknote,
    title: "Transparent, Upfront Pricing",
    description: "No hidden fees, no surprises. See the exact price before you book. What you see is what you pay.",
  },
  {
    icon: MapPin,
    title: "Real-Time Tracking",
    description: "Track your assigned professional in real-time. Know exactly when they'll arrive at your doorstep.",
  },
];

export function TrustBuilders() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={`section ${styles.section}`} ref={ref}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.eyebrow}>Why Choose Us</span>
          <h2 className="h2">
            Why <span className="text-gradient">5,000+ customers</span> trust HandyHub
          </h2>
          <p className={styles.subtitle}>
            We set the highest standards in the industry so you can hire with complete confidence.
          </p>
        </motion.div>

        <div className={styles.grid}>
          {trustItems.map((item, i) => (
            <motion.div
              key={item.title}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className={styles.iconWrap}>
                <item.icon size={24} />
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
