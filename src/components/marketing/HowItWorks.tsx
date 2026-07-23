"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, CalendarDays, UserCheck, Star } from "lucide-react";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Choose Your Service",
    description:
      "Browse our services or tell us what you need. Our AI will recommend the perfect match.",
  },
  {
    icon: CalendarDays,
    step: "02",
    title: "Pick Date & Time",
    description:
      "Select a convenient date and time slot. Same-day service available for urgent needs.",
  },
  {
    icon: UserCheck,
    step: "03",
    title: "Get Matched with a Pro",
    description:
      "We assign a verified, background-checked professional — or choose your favorite.",
  },
  {
    icon: Star,
    step: "04",
    title: "Relax & Review",
    description:
      "Sit back while your pro handles everything. Rate and review when the job is done.",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={`section ${styles.section}`} id="how-it-works" ref={ref}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.eyebrow}>How It Works</span>
          <h2 className="h2">Book a professional in 60 seconds</h2>
          <p className={styles.subtitle}>
            Four simple steps to a beautifully maintained property.
          </p>
        </motion.div>

        <div className={styles.stepsContainer}>
          {/* Connecting line */}
          <div className={styles.connector} />

          <div className={styles.steps}>
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                className={styles.step}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className={styles.stepNumber}>{step.step}</div>
                <div className={styles.stepIcon}>
                  <step.icon size={28} />
                </div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
