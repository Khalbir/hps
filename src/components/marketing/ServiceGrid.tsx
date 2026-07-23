"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Sparkles,
  Droplets,
  Zap,
  Paintbrush,
  Wrench,
  Wind,
  Camera,
  Sun,
  Hammer,
  Sofa,
  Home,
  TreePine,
  Shirt,
  Truck,
  Settings,
} from "lucide-react";
import styles from "./ServiceGrid.module.css";

const services = [
  {
    icon: Sparkles,
    name: "Residential Cleaning",
    description: "Professional deep cleaning for your home",
    price: "₦15,000",
    color: "#0EA5E9",
    bgColor: "rgba(14, 165, 233, 0.08)",
  },
  {
    icon: Sparkles,
    name: "Commercial Cleaning",
    description: "Office and business space cleaning",
    price: "₦35,000",
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.08)",
  },
  {
    icon: Droplets,
    name: "Plumbing",
    description: "Pipe repairs, installations & maintenance",
    price: "₦10,000",
    color: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.08)",
  },
  {
    icon: Zap,
    name: "Electrical Repairs",
    description: "Wiring, sockets, breakers & panels",
    price: "₦12,000",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.08)",
  },
  {
    icon: Paintbrush,
    name: "Painting",
    description: "Interior & exterior painting services",
    price: "₦20,000",
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.08)",
  },
  {
    icon: Wind,
    name: "AC Installation & Repair",
    description: "Split unit installation, servicing & gas refill",
    price: "₦15,000",
    color: "#06B6D4",
    bgColor: "rgba(6, 182, 212, 0.08)",
  },
  {
    icon: Camera,
    name: "CCTV Installation",
    description: "Security camera setup & configuration",
    price: "₦25,000",
    color: "#6366F1",
    bgColor: "rgba(99, 102, 241, 0.08)",
  },
  {
    icon: Sun,
    name: "Solar & Inverter",
    description: "Solar panel & inverter installation",
    price: "₦50,000",
    color: "#F97316",
    bgColor: "rgba(249, 115, 22, 0.08)",
  },
  {
    icon: Hammer,
    name: "Carpentry",
    description: "Custom furniture, repairs & installations",
    price: "₦18,000",
    color: "#A16207",
    bgColor: "rgba(161, 98, 7, 0.08)",
  },
  {
    icon: Sofa,
    name: "Interior Decoration",
    description: "Space planning & interior design",
    price: "₦30,000",
    color: "#DC2626",
    bgColor: "rgba(220, 38, 38, 0.08)",
  },
  {
    icon: Home,
    name: "Home Renovation",
    description: "Complete home remodeling & upgrades",
    price: "₦100,000",
    color: "#059669",
    bgColor: "rgba(5, 150, 105, 0.08)",
  },
  {
    icon: Wrench,
    name: "Generator Repairs",
    description: "Generator servicing & maintenance",
    price: "₦8,000",
    color: "#7C3AED",
    bgColor: "rgba(124, 58, 237, 0.08)",
  },
  {
    icon: TreePine,
    name: "Gardening",
    description: "Lawn care, landscaping & plant maintenance",
    price: "₦12,000",
    color: "#16A34A",
    bgColor: "rgba(22, 163, 74, 0.08)",
  },
  {
    icon: Shirt,
    name: "Laundry Services",
    description: "Professional washing, ironing & dry cleaning",
    price: "₦5,000",
    color: "#0891B2",
    bgColor: "rgba(8, 145, 178, 0.08)",
  },
  {
    icon: Truck,
    name: "Moving Services",
    description: "Home & office relocation services",
    price: "₦25,000",
    color: "#CA8A04",
    bgColor: "rgba(202, 138, 4, 0.08)",
  },
  {
    icon: Settings,
    name: "General Handyman",
    description: "Furniture assembly, odd jobs & repairs",
    price: "₦8,000",
    color: "#64748B",
    bgColor: "rgba(100, 116, 139, 0.08)",
  },
];

export function ServiceGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={`section ${styles.section}`} id="services" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.eyebrow}>Our Services</span>
          <h2 className="h2">Everything your property needs</h2>
          <p className={styles.subtitle}>
            From routine cleaning to complex installations — we have verified professionals
            for every task.
          </p>
        </motion.div>

        {/* Grid */}
        <div className={styles.grid}>
          {services.map((service, i) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
            >
              <Link
                href={`/book?service=${service.name.toLowerCase().replace(/\s+/g, "-")}`}
                className={`card card-hover ${styles.serviceCard}`}
              >
                <div
                  className={styles.iconWrap}
                  style={{ backgroundColor: service.bgColor, color: service.color }}
                >
                  <service.icon size={24} />
                </div>
                <h3 className={styles.serviceName}>{service.name}</h3>
                <p className={styles.serviceDesc}>{service.description}</p>
                <div className={styles.serviceBottom}>
                  <span className={styles.servicePrice}>
                    From <strong>{service.price}</strong>
                  </span>
                  <span className={styles.serviceArrow}>→</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
