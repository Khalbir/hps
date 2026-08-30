"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./BeforeAfter.module.css";

const projects = [
  {
    id: 1,
    title: "Kitchen Deep Clean",
    location: "Maitama, Abuja",
    service: "Deep Cleaning",
    beforeImage: "/portfolio/kitchen-before.png",
    afterImage: "/portfolio/kitchen-after.png",
  },
  {
    id: 2,
    title: "Living Room Repaint",
    location: "Asokoro, Abuja",
    service: "Painting",
    beforeImage: "/portfolio/living-room-before.png",
    afterImage: "/portfolio/living-room-after.png",
  },
  {
    id: 3,
    title: "Bathroom Renovation",
    location: "Wuse 2, Abuja",
    service: "Home Renovation",
    beforeImage: "/portfolio/bathroom-before.png",
    afterImage: "/portfolio/bathroom-after.png",
  },
];

export function BeforeAfter() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [sliderPositions, setSliderPositions] = useState<Record<number, number>>({});

  const handleSlider = (id: number, clientX: number, currentTarget: HTMLDivElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPositions((prev) => ({ ...prev, [id]: Math.max(5, Math.min(95, x)) }));
  };

  const handleSliderMove = (id: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleSlider(id, e.clientX, e.currentTarget);
  };

  const handleTouchSlider = (id: number, e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches[0]) return;
    handleSlider(id, e.touches[0].clientX, e.currentTarget);
  };

  return (
    <section className={`section ${styles.section}`} ref={ref}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.eyebrow}>Our Work</span>
          <h2 className="h2">See the transformation</h2>
          <p className={styles.subtitle}>
            Drag the slider to compare before and after results from real HandyHub projects.
          </p>
        </motion.div>

        <div className={styles.grid}>
          {projects.map((project, i) => {
            const pos = sliderPositions[project.id] ?? 50;
            return (
              <motion.div
                key={project.id}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div
                  className={styles.slider}
                  onMouseDown={(e) => handleSlider(project.id, e.clientX, e.currentTarget)}
                  onMouseMove={(e) => handleSliderMove(project.id, e)}
                  onTouchStart={(e) => handleTouchSlider(project.id, e)}
                  onTouchMove={(e) => handleTouchSlider(project.id, e)}
                >
                  {/* Before */}
                  <div className={styles.before}>
                    <img
                      src={project.beforeImage}
                      alt={`${project.title} Before`}
                      className={styles.projectImage}
                    />
                    <div className={styles.sliderLabel}>
                      <span>BEFORE</span>
                    </div>
                  </div>

                  {/* After */}
                  <div
                    className={styles.after}
                    style={{
                      clipPath: `inset(0 0 0 ${pos}%)`,
                    }}
                  >
                    <img
                      src={project.afterImage}
                      alt={`${project.title} After`}
                      className={styles.projectImage}
                    />
                    <div className={styles.sliderLabel} style={{ right: 16, left: "auto" }}>
                      <span>AFTER</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div
                    className={styles.divider}
                    style={{ left: `${pos}%` }}
                  >
                    <div className={styles.dividerHandle}>
                      <div className={styles.dividerArrows}>
                        ◀ ▶
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{project.title}</h3>
                  <span className={styles.cardMeta}>
                    {project.service} · {project.location}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
