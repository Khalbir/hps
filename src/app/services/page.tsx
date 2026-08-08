"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, Wrench, Zap, Snowflake, Paintbrush, Hammer, Camera, SunMedium,
  CheckCircle2, ArrowRight, ShieldCheck, Star, Clock, MapPin, Users
} from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { PricingRulesConfig, getEffectiveServiceItem } from "@/lib/pricingEngine";

const serviceCatalog = [
  {
    id: "cleaning",
    title: "Residential & Deep Cleaning",
    icon: Sparkles,
    price: "From ₦15,000",
    desc: "Complete home sanitization, kitchen degreasing, bathroom scrubbing, carpet extraction & post-construction cleaning.",
    popularItems: ["Full Flat Deep Cleaning", "Sofa & Upholstery Wash", "Post-Construction Cleaning", "Move-in / Move-out Scrub"],
    badge: "Most Popular",
  },
  {
    id: "plumbing",
    title: "Plumbing & Leak Repairs",
    icon: Wrench,
    price: "From ₦10,000",
    desc: "Burst pipe repairs, sink leaks, water heater/boiler installation, bathroom fitting & borehole pump maintenance.",
    popularItems: ["Leaking Sink & Drain Unclog", "Water Heater Repair", "Toilet Unit Replacement", "Overhead Tank Piping"],
    badge: "Instant Dispatch",
  },
  {
    id: "electrical",
    title: "Electrical Wiring & Fault Fixes",
    icon: Zap,
    price: "From ₦8,500",
    desc: "Certified electricians for circuit breaker repairs, light fitting installation, short circuit diagnosis & DB board wiring.",
    popularItems: ["Socket & Switch Repair", "Circuit Breaker Tripping Fix", "Chandelier & Light Fitting", "Gen Changeover Switch"],
    badge: "Certified Pros",
  },
  {
    id: "hvac",
    title: "AC Servicing & Gas Refill",
    icon: Snowflake,
    price: "From ₦12,000",
    desc: "Split unit & central AC chemical cleaning, R22/R410 gas recharging, compressor repairs & new unit installations.",
    popularItems: ["Split AC Chemical Wash", "Refrigerant Gas Top-Up", "AC Compressor Replacement", "New AC Unit Installation"],
    badge: "100% Guaranteed",
  },
  {
    id: "painting",
    title: "Painting & Wall Decoration",
    icon: Paintbrush,
    price: "From ₦25,000",
    desc: "Premium interior/exterior wall painting, POP screeding, 3D wall panel installation & dampness treatment.",
    popularItems: ["Living Room Painting", "POP Wall Screeding", "Anti-Damp Wall Treatment", "Exterior Building Coating"],
    badge: "Premium Finish",
  },
  {
    id: "carpentry",
    title: "Carpentry & Custom Furniture",
    icon: Hammer,
    price: "From ₦12,000",
    desc: "Kitchen cabinet installation, door lock fittings, wardrobe construction, sofa frame repair & custom woodwork.",
    popularItems: ["Door Lock & Hinge Repair", "Kitchen Cabinet Fitting", "Wardrobe Construction", "Bed Frame Assembly"],
    badge: "Master Artisans",
  },
  {
    id: "cctv",
    title: "CCTV & Smart Security",
    icon: Camera,
    price: "From ₦35,000",
    desc: "HD & IP camera installation, remote smartphone viewing setup, intercom systems & automatic gate openers.",
    popularItems: ["4-Camera Security Kit", "Smartphone Remote Viewing", "Video Doorbell Intercom", "Electric Fence Wiring"],
    badge: "Smart Home",
  },
  {
    id: "solar",
    title: "Solar Panel & Inverter Setup",
    icon: SunMedium,
    price: "From ₦85,000",
    desc: "Clean 24/7 solar energy setup, lithium battery bank installation, pure sine wave inverters & roof panel mounting.",
    popularItems: ["1KVA - 5KVA Inverter Setup", "Lithium Battery Upgrade", "Solar Panel Roof Mounting", "Energy Audit & Load Sizing"],
    badge: "24/7 Power",
  },
];

export default function ServicesPage() {
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

  const getCategoryStartingPrice = (catId: string, fallbackPrice: string) => {
    const cat = SERVICE_CATEGORIES.find((c) => c.id === catId || c.id.includes(catId));
    if (!cat || cat.services.length === 0) return fallbackPrice;

    let minPrice = Infinity;
    let hasCustomQuoteOnly = true;

    for (const s of cat.services) {
      const effective = getEffectiveServiceItem(s, pricingRules);
      const pModel = effective.pricingModel || "FIXED";
      if (pModel !== "CUSTOM_QUOTE" && effective.price > 0) {
        hasCustomQuoteOnly = false;
        if (effective.price < minPrice) {
          minPrice = effective.price;
        }
      }
    }

    if (hasCustomQuoteOnly || minPrice === Infinity) {
      return "FREE Quote";
    }

    return `From ₦${minPrice.toLocaleString()}`;
  };

  return (
    <div style={{ background: "var(--bg-primary)", padding: "var(--space-12) 0" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", maxWidth: 750, margin: "0 auto var(--space-12)" }}>
          <span className="badge" style={{ background: "rgba(14,165,233,0.15)", color: "#0EA5E9", marginBottom: "var(--space-3)" }}>
            Verified Artisans & Property Maintenance
          </span>
          <h1 className="h1" style={{ marginBottom: "var(--space-4)" }}>HandyHub Pro Services Catalog</h1>
          <p style={{ fontSize: "var(--fs-lg)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Browse our full range of vetted, background-checked, and insured home maintenance solutions in Abuja.
          </p>
        </div>

        {/* Services Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-16)" }}>
          {serviceCatalog.map((service) => {
            const IconComp = service.icon;
            const startPriceDisplay = getCategoryStartingPrice(service.id, service.price);

            return (
              <div
                key={service.id}
                className="card card-hover"
                style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", padding: "var(--space-6)" }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "var(--radius-xl)", background: "rgba(14,165,233,0.12)", color: "#0EA5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IconComp size={26} />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "bold", background: "rgba(249,115,22,0.15)", color: "#F97316", padding: "4px 10px", borderRadius: 99 }}>
                      {service.badge}
                    </span>
                  </div>

                  <h3 className="h4" style={{ marginBottom: "var(--space-2)" }}>{service.title}</h3>
                  <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-4)", lineHeight: 1.5 }}>
                    {service.desc}
                  </p>

                  <div style={{ borderTop: "1px solid var(--border-primary)", paddingTop: "var(--space-3)", marginBottom: "var(--space-6)" }}>
                    <strong style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                      Popular Jobs Covered:
                    </strong>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {service.popularItems.map((item) => (
                        <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-xs)", color: "var(--text-primary)" }}>
                          <CheckCircle2 size={14} color="#10B981" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-primary)", paddingTop: "var(--space-4)", marginTop: "auto" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block" }}>Starting Price</span>
                    <strong style={{ fontSize: "var(--fs-base)", color: startPriceDisplay.includes("FREE") ? "#C084FC" : "#0EA5E9" }}>
                      {startPriceDisplay}
                    </strong>
                  </div>
                  <Link href={`/book?category=${service.id}`} className="btn btn-primary btn-md">
                    Book Now <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(249,115,22,0.1) 100%)", border: "1px solid rgba(14,165,233,0.25)", padding: "var(--space-8)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-6)" }}>
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0EA5E9", fontWeight: "bold", marginBottom: 6 }}>
              <ShieldCheck size={20} /> HandyHub 100% Satisfaction Guarantee
            </div>
            <h3 className="h3" style={{ marginBottom: 6 }}>Need a custom or multi-service corporate quote?</h3>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>
              Our facility management team handles residential estates, corporate offices, and emergency call-outs across Abuja.
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <a href="tel:+2348122222936" className="btn btn-secondary btn-lg">
              Call Support (+234 812 222 2936)
            </a>
            <Link href="/book" className="btn btn-primary btn-lg">
              Instant Booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
