"use client";

import { useRef, useState, useEffect } from "react";
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
  Bug,
} from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { PricingRulesConfig, getEffectiveServiceItem } from "@/lib/pricingEngine";
import styles from "./ServiceGrid.module.css";

const services = [
  {
    icon: Sparkles,
    name: "Residential Cleaning (One-Time)",
    category: "cleaning",
    slug: "residential-cleaning",
    description: "Deep detailed cleaning for apartments & houses",
    price: "₦15,000",
    color: "#0EA5E9",
    bgColor: "rgba(14, 165, 233, 0.08)",
  },
  {
    icon: Sparkles,
    name: "Residential Cleaning (Monthly Plan)",
    category: "cleaning",
    slug: "residential-cleaning-monthly",
    description: "Recurring housekeeping: Silver (2d/wk), Gold (3d/wk), Plat (6d/wk)",
    price: "₦45,000/mo",
    color: "#0284C7",
    bgColor: "rgba(2, 132, 199, 0.10)",
  },
  {
    icon: Bug,
    name: "Fumigation & Pest Control",
    category: "fumigation",
    slug: "residential-fumigation",
    description: "Eco-safe pest, termite & bedbug eradication",
    price: "₦25,000",
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.08)",
  },
  {
    icon: Sofa,
    name: "Upholstery & Carpet",
    category: "upholstery",
    slug: "sofa-couch-cleaning",
    description: "Deep steam extraction for sofas & mattresses",
    price: "₦15,000",
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.08)",
  },
  {
    icon: Droplets,
    name: "Plumbing",
    category: "plumbing",
    slug: "pipe-repairs",
    description: "Pipe repairs, installations & maintenance",
    price: "₦10,000",
    color: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.08)",
  },
  {
    icon: Zap,
    name: "Electrical Repairs",
    category: "electrical",
    slug: "socket-switch",
    description: "Wiring, sockets, breakers & panels",
    price: "₦12,000",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.08)",
  },
  {
    icon: Paintbrush,
    name: "Painting",
    category: "painting",
    slug: "interior-painting",
    description: "Interior & exterior painting services",
    price: "₦20,000",
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.08)",
  },
  {
    icon: Wind,
    name: "AC Installation & Repair",
    category: "hvac",
    slug: "ac-repair",
    description: "Split unit installation, servicing & gas refill",
    price: "₦12,000",
    color: "#06B6D4",
    bgColor: "rgba(6, 182, 212, 0.08)",
  },
  {
    icon: Camera,
    name: "CCTV Installation",
    category: "security",
    slug: "cctv-installation",
    description: "Security camera setup & configuration",
    price: "₦25,000",
    color: "#6366F1",
    bgColor: "rgba(99, 102, 241, 0.08)",
  },
  {
    icon: Sun,
    name: "Solar & Inverter",
    category: "solar",
    slug: "solar-installation",
    description: "Solar panel & inverter installation",
    price: "₦50,000",
    color: "#F97316",
    bgColor: "rgba(249, 115, 22, 0.08)",
  },
  {
    icon: Hammer,
    name: "Carpentry",
    category: "carpentry",
    slug: "furniture-assembly",
    description: "Custom furniture, repairs & installations",
    price: "₦18,000",
    color: "#A16207",
    bgColor: "rgba(161, 98, 7, 0.08)",
  },
  {
    icon: Sofa,
    name: "Interior Decoration",
    category: "home-improvement",
    slug: "interior-decoration",
    description: "Space planning & interior design",
    price: "₦30,000",
    color: "#DC2626",
    bgColor: "rgba(220, 38, 38, 0.08)",
  },
  {
    icon: Home,
    name: "Home Renovation",
    category: "home-improvement",
    slug: "home-renovation",
    description: "Complete home remodeling & upgrades",
    price: "₦100,000",
    color: "#059669",
    bgColor: "rgba(5, 150, 105, 0.08)",
  },
  {
    icon: Wrench,
    name: "Generator Repairs",
    category: "solar",
    slug: "generator-repairs",
    description: "Generator servicing & maintenance",
    price: "₦8,000",
    color: "#7C3AED",
    bgColor: "rgba(124, 58, 237, 0.08)",
  },
  {
    icon: TreePine,
    name: "Gardening & Lawn",
    category: "outdoor",
    slug: "gardening",
    description: "One-time service & monthly routine plans",
    price: "₦12,000",
    color: "#16A34A",
    bgColor: "rgba(22, 163, 74, 0.08)",
  },
  {
    icon: Shirt,
    name: "Laundry Services",
    category: "laundry",
    slug: "laundry-services",
    description: "Professional washing, ironing & dry cleaning",
    price: "₦5,000",
    color: "#0891B2",
    bgColor: "rgba(8, 145, 178, 0.08)",
  },
  {
    icon: Truck,
    name: "Moving Services",
    category: "moving",
    slug: "moving-services",
    description: "Home & office relocation services",
    price: "₦25,000",
    color: "#CA8A04",
    bgColor: "rgba(202, 138, 4, 0.08)",
  },
  {
    icon: Settings,
    name: "General Handyman",
    category: "general",
    slug: "general-handyman",
    description: "Furniture assembly, odd jobs & repairs",
    price: "₦15,000",
    color: "#64748B",
    bgColor: "rgba(100, 116, 139, 0.08)",
  },
];

export function ServiceGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [pricingRules, setPricingRules] = useState<PricingRulesConfig | undefined>(undefined);

  useEffect(() => {
    async function loadRules() {
      try {
        const res = await fetch("/api/admin/pricing-rules", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });
        const data = await res.json();
        if (res.ok && data.rules) {
          setPricingRules(data.rules);
        }
      } catch (err) {}
    }
    loadRules();
  }, []);

  const getDynamicPriceDisplay = (serviceSlug: string, fallbackPriceStr: string) => {
    let foundSvc: any = null;
    for (const cat of SERVICE_CATEGORIES) {
      const s = cat.services.find((svc) => svc.id === serviceSlug);
      if (s) {
        foundSvc = s;
        break;
      }
    }

    if (!foundSvc) return fallbackPriceStr;

    const effective = getEffectiveServiceItem(foundSvc, pricingRules);
    const pModel = effective.pricingModel || "FIXED";

    if (pModel === "CUSTOM_QUOTE") {
      return "FREE Quote";
    }
    if (pModel === "SUBSCRIPTION") {
      return `₦${effective.price.toLocaleString()}/mo`;
    }
    if (pModel === "QUANTITY_BASED") {
      return `₦${effective.price.toLocaleString()} ${effective.unitLabel || "per unit"}`;
    }
    return `₦${effective.price.toLocaleString()}`;
  };

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
          {services.map((service, i) => {
            const dynamicPriceStr = getDynamicPriceDisplay(service.slug, service.price);
            const isFreeQuote = dynamicPriceStr.includes("FREE Quote");

            return (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
              >
                <Link
                  href={`/book?category=${service.category}&service=${service.slug}`}
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
                      {isFreeQuote ? (
                        <strong style={{ color: "#C084FC" }}>{dynamicPriceStr}</strong>
                      ) : (
                        <>
                          From <strong>{dynamicPriceStr}</strong>
                        </>
                      )}
                    </span>
                    <span className={styles.serviceArrow}>→</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
