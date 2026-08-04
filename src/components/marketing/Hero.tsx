"use client";

import { useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { Search, ArrowRight, Shield, Star, Clock, Sparkles } from "lucide-react";
import { POPULAR_SUGGESTIONS, getBookingUrl } from "@/lib/services";
import styles from "./Hero.module.css";

export function Hero() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/book?query=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/book");
    }
  };

  return (
    <section className={styles.hero} ref={ref}>
      {/* Animated background elements */}
      <div className={styles.bgElements}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgOrb3} />
        <div className={styles.gridLines} />
      </div>

      <div className={`container ${styles.container}`}>
        <div className={styles.content}>
          {/* Badge */}
          <motion.div
            className={styles.badge}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Sparkles size={14} />
            <span>#1 Home Services Platform in Abuja</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className={styles.headline}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Professional Home Services,{" "}
            <span className={styles.headlineAccent}>One Tap Away.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className={styles.subheadline}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Book verified cleaners, plumbers, electricians & more. Transparent pricing.
            Insured professionals. 100% satisfaction guaranteed.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            className={styles.searchWrapper}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
              <Search size={22} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search services... e.g. Leaking sink, AC repair"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Search for a service"
                id="hero-search"
              />
              <button type="submit" className={styles.searchBtn}>
                <span>Search</span>
                <ArrowRight size={18} />
              </button>
            </form>
            <div className={styles.suggestions}>
              <span className={styles.suggestionsLabel}>Popular:</span>
              {POPULAR_SUGGESTIONS.map((s) => (
                <Link
                  key={s.text}
                  href={getBookingUrl(s.categoryId, s.serviceId, s.text)}
                  className={styles.suggestion}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            className={styles.ctas}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link href="/book" className="btn btn-primary btn-xl">
              Book a Service
              <ArrowRight size={18} />
            </Link>
            <Link href="#how-it-works" className="btn btn-secondary btn-xl">
              See How It Works
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            className={styles.trustBadges}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className={styles.trustBadge}>
              <Shield size={18} className={styles.trustIcon} />
              <span>Verified Professionals</span>
            </div>
            <div className={styles.trustDivider} />
            <div className={styles.trustBadge}>
              <Star size={18} className={styles.trustIcon} />
              <span>4.9★ Average Rating</span>
            </div>
            <div className={styles.trustDivider} />
            <div className={styles.trustBadge}>
              <Clock size={18} className={styles.trustIcon} />
              <span>Same-Day Service</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Visual */}
        <motion.div
          className={styles.visual}
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className={styles.visualCard}>
            <div className={styles.visualCardInner}>
              {/* Floating mini cards */}
              <motion.div
                className={styles.floatingCard1}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className={styles.floatingCardIcon}>🧹</div>
                <div>
                  <div className={styles.floatingCardTitle}>Deep Cleaning</div>
                  <div className={styles.floatingCardPrice}>From ₦25,000</div>
                </div>
              </motion.div>

              <motion.div
                className={styles.floatingCard2}
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <div className={styles.miniAvatar}>
                  <span>AT</span>
                </div>
                <div>
                  <div className={styles.floatingCardTitle}>Abubakar T.</div>
                  <div className={styles.floatingCardSub}>
                    <Star size={12} fill="#F59E0B" stroke="#F59E0B" />
                    <span>4.9 · Electrician</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className={styles.floatingCard3}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className={styles.successPulse} />
                <span>Booking Confirmed!</span>
              </motion.div>

              {/* Main visual — Illustration placeholder */}
              <div className={styles.heroIllustration}>
                <div className={styles.illustrationHouse}>
                  <svg viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* House body */}
                    <rect x="40" y="100" width="200" height="130" rx="8" fill="var(--color-primary-100)" stroke="var(--color-primary-300)" strokeWidth="2"/>
                    {/* Roof */}
                    <path d="M20 105L140 30L260 105" stroke="var(--color-primary-500)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="var(--color-primary-50)"/>
                    {/* Door */}
                    <rect x="115" y="155" width="50" height="75" rx="6" fill="var(--color-accent-400)" stroke="var(--color-accent-500)" strokeWidth="2"/>
                    <circle cx="155" cy="195" r="4" fill="var(--color-accent-200)"/>
                    {/* Windows */}
                    <rect x="60" y="125" width="40" height="35" rx="4" fill="var(--color-primary-200)" stroke="var(--color-primary-400)" strokeWidth="1.5"/>
                    <line x1="80" y1="125" x2="80" y2="160" stroke="var(--color-primary-400)" strokeWidth="1.5"/>
                    <line x1="60" y1="142" x2="100" y2="142" stroke="var(--color-primary-400)" strokeWidth="1.5"/>
                    <rect x="180" y="125" width="40" height="35" rx="4" fill="var(--color-primary-200)" stroke="var(--color-primary-400)" strokeWidth="1.5"/>
                    <line x1="200" y1="125" x2="200" y2="160" stroke="var(--color-primary-400)" strokeWidth="1.5"/>
                    <line x1="180" y1="142" x2="220" y2="142" stroke="var(--color-primary-400)" strokeWidth="1.5"/>
                    {/* Chimney */}
                    <rect x="190" y="45" width="25" height="40" rx="3" fill="var(--color-neutral-300)" stroke="var(--color-neutral-400)" strokeWidth="1.5"/>
                    {/* Wrench icon overlay */}
                    <circle cx="140" cy="85" r="20" fill="var(--color-primary-500)" opacity="0.9"/>
                    <path d="M133 85L140 78L147 85L140 92Z" fill="white"/>
                    <path d="M136 82L144 82M136 88L144 88" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
