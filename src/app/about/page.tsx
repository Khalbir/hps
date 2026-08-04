"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, ShieldCheck, HeartHandshake, ArrowRight, Award,
  Users, CheckCircle, Wrench, Building2, Quote, Lightbulb,
} from "lucide-react";
import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <section className={styles.hero}>
        <div className="container">
          <motion.div
            className={styles.heroBadge}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles size={14} />
            <span>Our Story & Mission</span>
          </motion.div>

          <motion.h1
            className={styles.heroHeadline}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Transforming Property Maintenance,{" "}
            <span className={styles.heroAccent}>Building Lasting Trust.</span>
          </motion.h1>

          <motion.p
            className={styles.heroSubheadline}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            From a curious kid supervising repairs to Nigeria&apos;s premier verified home services platform — bridging the gap between property owners and trusted professionals.
          </motion.p>
        </div>
      </section>

      {/* Founder Story Section */}
      <section className={styles.storySection}>
        <div className="container">
          <motion.div
            className={styles.storyCard}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Founder Bio Column */}
            <div className={styles.founderColumn}>
              <div className={styles.founderAvatar}>
                <span>KK</span>
              </div>
              <h2 className={styles.founderName}>Khalid Kabir</h2>
              <span className={styles.founderTitle}>Founder & CEO, HandyHub Pro</span>
              <div className={styles.founderQuoteBadge}>
                <Quote size={14} color="var(--color-primary-500)" />
                <span>Founder&apos;s Personal Narrative</span>
              </div>
            </div>

            {/* Verbatim Narrative Column */}
            <div className={styles.narrativeColumn}>
              <span className="eyebrow" style={{ color: "var(--color-primary-500)", fontWeight: "var(--fw-bold)", textTransform: "uppercase" }}>
                The Vision Behind HandyHub Pro
              </span>
              <h2 className={styles.storyTitle}>
                &ldquo;It&apos;s not just about fixing what&apos;s broken. It&apos;s about building trust and opportunity.&rdquo;
              </h2>

              <p className={styles.narrativeParagraph}>
                Some businesses are born from market trends. Ours was born from a lifetime of small moments that added up to a big vision. I&apos;m <span className={styles.highlightText}>Khalid Kabir</span>, founder of <span className={styles.highlightText}>HandyHub Pro Solutions</span>.
              </p>

              <p className={styles.narrativeParagraph}>
                Growing up as the only son, I was always roped into supervising repairs. Plumbing, electrical, carpentry, even when I had zero clue what the artisans were doing. At first, I just followed instructions, but curiosity crept in. I started watching closely, fascinated by how broken things could be brought back to life. That fascination followed me for years.
              </p>

              <p className={styles.narrativeParagraph}>
                By the time I reached university I pursued civil engineering, thinking I&apos;d build structures that stand the test of time. But then I asked myself, who gives engineers the chance to build? <span className={styles.highlightText}>Entrepreneurs.</span> That&apos;s when I shifted gears into business administration, learning how to turn ideas into ventures that create jobs and better lives.
              </p>

              <div className={styles.quoteCallout}>
                &ldquo;Every move meant starting over, asking neighbors, friends, anyone, just to figure out who could be trusted. It was exhausting. And I kept thinking, why isn&apos;t there a one-stop place for finding reliable professionals?&rdquo;
              </div>

              <p className={styles.narrativeParagraph}>
                Around the same time, constant relocations with my family kept forcing us to find new handymen. Every move meant starting over, asking neighbors, friends, anyone, just to figure out who could be trusted. It was exhausting. And I kept thinking, why isn&apos;t there a one-stop place for finding reliable professionals?
              </p>

              <p className={styles.narrativeParagraph}>
                That question lingered until it finally became <span className={styles.highlightText}>HandyHub Pro Solutions</span>. What began as a curious kid standing beside artisans grew into a mission, to transform how people experience property maintenance in Nigeria, and one day beyond. It&apos;s not just about fixing what&apos;s broken. It&apos;s about building trust and opportunity. And that&apos;s only the beginning.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className={styles.valuesSection}>
        <div className="container">
          <div style={{ textAlign: "center" }}>
            <span className="eyebrow" style={{ color: "var(--color-primary-500)" }}>Our Core Pillars</span>
            <h2 className="h2">Driven by Purpose & Excellence</h2>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <ShieldCheck size={24} />
              </div>
              <h3 className={styles.valueTitle}>100% Verified Trust</h3>
              <p className={styles.valueDesc}>
                We eliminate the anxiety of hiring handymen through multi-stage NIN verification, trade certifications, and background audits.
              </p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <HeartHandshake size={24} />
              </div>
              <h3 className={styles.valueTitle}>Artisan Empowerment</h3>
              <p className={styles.valueDesc}>
                We create sustainable job opportunities and economic dignity for skilled craftsmen and service providers across Nigeria.
              </p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Lightbulb size={24} />
              </div>
              <h3 className={styles.valueTitle}>Seamless Innovation</h3>
              <p className={styles.valueDesc}>
                A modern 60-second booking experience with transparent pricing, instant auto-assignment, and complete escrow protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className="container">
          <h2 className="h2">Making a Real Impact in Nigeria</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>500+</div>
              <div className={styles.statLabel}>Verified Artisans & Pros</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>10,000+</div>
              <div className={styles.statLabel}>Successful Property Repairs</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>4.9★</div>
              <div className={styles.statLabel}>Average Customer Satisfaction</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>100%</div>
              <div className={styles.statLabel}>Escrow Protection Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="container" style={{ marginTop: "var(--space-8)" }}>
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, #0C4A6E 0%, #0284C7 100%)",
            color: "white",
            padding: "var(--space-12)",
            textAlign: "center",
            borderRadius: "var(--radius-2xl)",
          }}
        >
          <h2 className="h2" style={{ color: "white", marginBottom: "var(--space-3)" }}>
            Ready to experience reliable property maintenance?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "var(--fs-lg)", maxWidth: 560, margin: "0 auto var(--space-8)" }}>
            Join thousands of satisfied home & business owners in Abuja. Book verified professionals in under 60 seconds.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <Link href="/book" className="btn btn-accent btn-xl">
              Book a Service Now
              <ArrowRight size={18} />
            </Link>
            <Link href="/auth/register?role=PROFESSIONAL" className="btn btn-secondary btn-xl" style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}>
              Join as a Professional
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
