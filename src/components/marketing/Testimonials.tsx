"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import styles from "./Testimonials.module.css";

const testimonials = [
  {
    name: "Amina Ibrahim",
    location: "Maitama, Abuja",
    avatar: "AI",
    rating: 5,
    service: "Deep Cleaning",
    text: "I was skeptical at first, but HandyHub completely exceeded my expectations. The cleaning team was professional, thorough, and punctual. My 4-bedroom apartment has never looked this good. Booking was incredibly easy — literally took me 30 seconds!",
  },
  {
    name: "Chidi Okonkwo",
    location: "Wuse 2, Abuja",
    avatar: "CO",
    rating: 5,
    service: "Electrical Repairs",
    text: "Had a critical electrical fault on a Sunday evening. Used HandyHub's emergency service and an electrician arrived within 45 minutes. The pricing was transparent and fair. This is how services should work in Nigeria. Truly impressive.",
  },
  {
    name: "Fatima Yusuf",
    location: "Gwarinpa, Abuja",
    avatar: "FY",
    rating: 5,
    service: "AC Installation",
    text: "HandyHub installed 3 split AC units in my new apartment. The technician was knowledgeable, clean, and explained everything clearly. The best part? The price I saw during booking was exactly what I paid. No hidden charges!",
  },
  {
    name: "David Adekunle",
    location: "Jabi, Abuja",
    avatar: "DA",
    rating: 5,
    service: "Plumbing",
    text: "Managing 8 rental properties used to be a nightmare. Since discovering HandyHub, I can schedule maintenance for all my properties from one dashboard. The quality is consistent, and my tenants are happier than ever.",
  },
  {
    name: "Grace Nwosu",
    location: "Asokoro, Abuja",
    avatar: "GN",
    rating: 5,
    service: "Home Renovation",
    text: "Our kitchen renovation was handled flawlessly. From the initial estimate to the final touch-up, HandyHub's team was professional and communicative. The before-and-after difference is stunning. Worth every naira!",
  },
  {
    name: "Mohammed Bello",
    location: "Garki, Abuja",
    avatar: "MB",
    rating: 5,
    service: "CCTV Installation",
    text: "Security is paramount for my business. HandyHub's CCTV team installed an 8-camera system with remote monitoring. Setup was clean, wiring was hidden, and they configured everything on my phone. Top-notch service.",
  },
];

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [current, setCurrent] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);

  const next = () => setCurrent((p) => (p + 1) % totalPages);
  const prev = () => setCurrent((p) => (p - 1 + totalPages) % totalPages);

  const visibleTestimonials = testimonials.slice(
    current * itemsPerPage,
    current * itemsPerPage + itemsPerPage
  );

  return (
    <section className={`section ${styles.section}`} ref={ref}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.eyebrow}>Testimonials</span>
          <h2 className="h2">Loved by homeowners across Abuja</h2>
          <p className={styles.subtitle}>
            Don&apos;t take our word for it. Here&apos;s what our customers are saying.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className={styles.carousel}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              className={styles.grid}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {visibleTestimonials.map((t) => (
                <div key={t.name} className={`card ${styles.testimonialCard}`}>
                  <Quote size={32} className={styles.quoteIcon} />
                  <div className={styles.stars}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={16} fill="#F59E0B" stroke="#F59E0B" />
                    ))}
                  </div>
                  <p className={styles.text}>{t.text}</p>
                  <div className={styles.author}>
                    <div className={styles.avatar}>
                      <span>{t.avatar}</span>
                    </div>
                    <div>
                      <div className={styles.name}>{t.name}</div>
                      <div className={styles.meta}>
                        {t.service} · {t.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className={styles.nav}>
            <button onClick={prev} className={styles.navBtn} aria-label="Previous testimonials">
              <ChevronLeft size={20} />
            </button>
            <div className={styles.dots}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
            <button onClick={next} className={styles.navBtn} aria-label="Next testimonials">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
