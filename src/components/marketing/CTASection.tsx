"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import styles from "./CTASection.module.css";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.bg}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgGrid} />
      </div>
      <div className="container">
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.headline}>
            Ready to transform your property?
          </h2>
          <p className={styles.subheadline}>
            Join 5,000+ satisfied customers in Abuja. Book your first service today and experience
            the HandyHub difference.
          </p>
          <div className={styles.ctas}>
            <Link href="/book" className={`btn btn-xl ${styles.ctaPrimary}`}>
              Book Your First Service
              <ArrowRight size={20} />
            </Link>
            <a href="tel:+2348122222936" className={`btn btn-xl ${styles.ctaSecondary}`} title="Call Customer Support (+234 812 222 2936)">
              <Phone size={18} />
              Call Us (+234 812 222 2936)
            </a>
          </div>
          <p className={styles.note}>
            No account needed • Free estimates • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
