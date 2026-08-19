"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, ShieldCheck, Wrench, CheckCircle2,
  Truck, ArrowRight, Zap, RefreshCw, AlertCircle,
  MapPin, Building2, Globe, Clock, Sparkles, KeyRound,
  Store, ChevronRight, Check
} from "lucide-react";

export default function MarketplaceComingSoonPage() {
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("Abuja (FCT)");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
    }, 600);
  };

  const previewCategories = [
    {
      name: "Air Conditioning & HVAC",
      desc: "Rotary compressors (R410A/R22), capacitors, fan motors, copper piping & thermostats.",
      badge: "Top Requested",
      icon: "❄️",
    },
    {
      name: "Electrical & Inverters",
      desc: "Schneider/Havells MCBs, pure sine wave inverters, lithium batteries, surge protectors & changeovers.",
      badge: "Certified OEM",
      icon: "⚡",
    },
    {
      name: "Plumbing & Water Flow",
      desc: "Submersible pumps, PPR fittings, brass pressure valves, automatic float switches & PPR heaters.",
      badge: "High Demand",
      icon: "🚰",
    },
    {
      name: "Generator & Engine Spares",
      desc: "AVRs, carburetors, fuel injectors, solenoid switches, filters & genuine gaskets.",
      badge: "Abuja Stocked",
      icon: "⚙️",
    },
  ];

  const previewFeatures = [
    {
      title: "100% Genuine Certified Parts",
      desc: "Every component is verified against manufacturer specifications. Zero counterfeit or sub-standard materials.",
      icon: ShieldCheck,
      color: "#10B981",
    },
    {
      title: "GPS-Verified Abuja Merchants",
      desc: "Physical store inspection across Maitama, Wuse 2, Garki, Jabi, Gwarinpa, Apo, Kubwa & Lugbe.",
      icon: MapPin,
      color: "#0EA5E9",
    },
    {
      title: "Smart Select Auto-Procurement",
      desc: "HandyHub algorithmically matches the nearest verified supplier with live inventory for instant dispatch.",
      icon: Zap,
      color: "#F59E0B",
    },
    {
      title: "6-Digit Delivery OTP & Escrow",
      desc: "Supplier payouts are held safely in procurement escrow until you inspect the delivered part and verify with PIN.",
      icon: KeyRound,
      color: "#8B5CF6",
    },
  ];

  return (
    <div style={{ background: "#0B1120", minHeight: "100vh", color: "#F8FAFC" }}>
      {/* Top Launch Status Bar */}
      <div
        style={{
          background: "linear-gradient(90deg, rgba(14,165,233,0.18) 0%, rgba(16,185,129,0.18) 100%)",
          borderBottom: "1px solid rgba(14,165,233,0.25)",
          padding: "10px 20px",
          textAlign: "center",
          fontSize: "13px",
          color: "#E2E8F0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span
          style={{
            background: "rgba(14,165,233,0.25)",
            color: "#38BDF8",
            padding: "2px 10px",
            borderRadius: "20px",
            fontWeight: 800,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Phase 2 In Development
        </span>
        <span style={{ color: "#94A3B8" }}>
          HandyHub Marketplace for certified replacement components is launching soon in <strong>Abuja (FCT)</strong>.
        </span>
        <Link
          href="/book"
          style={{
            color: "#10B981",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          Book Verified Services Now →
        </Link>
      </div>

      {/* Hero Section */}
      <section
        style={{
          padding: "70px 20px 50px",
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14, 165, 233, 0.25), rgba(11, 17, 32, 0))",
          textAlign: "center",
          borderBottom: "1px solid #1E293B",
        }}
      >
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(14, 165, 233, 0.12)",
              border: "1px solid rgba(14, 165, 233, 0.3)",
              padding: "6px 18px",
              borderRadius: "30px",
              color: "#38BDF8",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "20px",
            }}
          >
            <Sparkles size={16} /> HandyHub Marketplace — Coming Soon
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              lineHeight: 1.15,
              margin: "0 0 18px 0",
              letterSpacing: "-1px",
              color: "#F8FAFC",
            }}
          >
            Genuine Replacement Parts, <br />
            <span style={{ color: "#0EA5E9" }}>Delivered With Zero Compromise.</span>
          </h1>

          <p
            style={{
              fontSize: "16.5px",
              color: "#94A3B8",
              maxWidth: "680px",
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            We are building Nigeria&apos;s most reliable ecosystem for authentic appliance components, HVAC spares, electrical fixtures, and plumbing hardware directly from GPS-verified merchants in Abuja.
          </p>

          {/* Primary Action Card: Core Booking Workflow CTA */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "16px",
              padding: "24px 28px",
              maxWidth: "680px",
              margin: "0 auto 40px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10B981", fontWeight: 800, fontSize: "14px", marginBottom: 4 }}>
                <CheckCircle2 size={16} /> Verified Artisans Ready for Booking
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#CBD5E1", lineHeight: 1.5 }}>
                Need emergency repairs, AC servicing, electrical wiring, or home cleaning today? Our vetted professionals are live and dispatching across Abuja.
              </p>
            </div>
            <Link
              href="/book"
              className="btn btn-primary"
              style={{
                background: "#10B981",
                fontWeight: 800,
                padding: "12px 22px",
                fontSize: "14px",
                whiteSpace: "nowrap",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Book an Artisan Now <ArrowRight size={16} />
            </Link>
          </div>

          {/* Priority Launch Waitlist Box */}
          <div
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "26px",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", color: "#F8FAFC" }}>
              Get Early Access & 15% Off Your First Part Order 🎁
            </h3>
            <p style={{ margin: "0 0 18px 0", fontSize: "13px", color: "#94A3B8" }}>
              Be the first to browse verified merchant inventory when the storefront officially opens.
            </p>

            {submitted ? (
              <div
                style={{
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid #10B981",
                  borderRadius: "10px",
                  padding: "14px",
                  color: "#10B981",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={18} /> You&apos;re on the priority launch list! We&apos;ll notify you at {email}.
              </div>
            ) : (
              <form onSubmit={handleJoinWaitlist} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    minWidth: "220px",
                    background: "#0F172A",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    color: "#F8FAFC",
                    fontSize: "14px",
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    background: "#0EA5E9",
                    fontWeight: 700,
                    padding: "12px 20px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {submitting ? "Joining..." : "Notify Me at Launch 🚀"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Preview 1: Upcoming Product Categories */}
      <section style={{ padding: "60px 20px", maxWidth: "1140px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span style={{ fontSize: "12px", color: "#0EA5E9", textTransform: "uppercase", fontWeight: 800, letterSpacing: "1px" }}>
            Storefront Catalog Preview
          </span>
          <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "6px 0 10px 0", color: "#F8FAFC" }}>
            Certified Replacement Components Coming to HandyHub
          </h2>
          <p style={{ fontSize: "14px", color: "#94A3B8", maxWidth: "560px", margin: "0 auto" }}>
            Every component is sourced exclusively from registered, background-verified merchants with physical storefronts in Abuja.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
          {previewCategories.map((cat) => (
            <div
              key={cat.name}
              className="card"
              style={{
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "14px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: "28px" }}>{cat.icon}</span>
                <span
                  className="badge"
                  style={{
                    background: "rgba(14,165,233,0.15)",
                    color: "#38BDF8",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {cat.badge}
                </span>
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 8px 0" }}>
                {cat.name}
              </h3>
              <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.5, margin: "0 0 16px 0", flex: 1 }}>
                {cat.desc}
              </p>
              <div style={{ borderTop: "1px solid #334155", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#64748B" }}>
                <span>Phase 1 Scope: Spares Only</span>
                <span style={{ color: "#38BDF8", fontWeight: 600 }}>Coming Soon</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preview 2: Marketplace Trust & Security Architecture */}
      <section style={{ padding: "50px 20px 70px", background: "#0F172A", borderTop: "1px solid #1E293B" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ fontSize: "12px", color: "#10B981", textTransform: "uppercase", fontWeight: 800, letterSpacing: "1px" }}>
              Built for Absolute Trust
            </span>
            <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "6px 0 10px 0", color: "#F8FAFC" }}>
              Why HandyHub Marketplace is Different
            </h2>
            <p style={{ fontSize: "14px", color: "#94A3B8", maxWidth: "560px", margin: "0 auto" }}>
              We eliminate counterfeit parts and fraudulent artisan pricing through GPS store audits and automated escrow security.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            {previewFeatures.map((feat) => (
              <div
                key={feat.title}
                className="card"
                style={{
                  background: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "14px",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: `${feat.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <feat.icon size={22} color={feat.color} />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 8px 0" }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Merchant Registration Callout */}
          <div
            style={{
              marginTop: "50px",
              background: "linear-gradient(90deg, #1E293B 0%, #172554 100%)",
              border: "1px solid rgba(14, 165, 233, 0.4)",
              borderRadius: "16px",
              padding: "30px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#38BDF8", fontWeight: 800, fontSize: "14px", textTransform: "uppercase" }}>
                <Store size={18} /> Are You a Certified Spare Part Merchant in Abuja?
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#F8FAFC", margin: "6px 0 6px 0" }}>
                Register Early & Get Your Storefront GPS-Verified
              </h3>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#CBD5E1", maxWidth: "600px" }}>
                Connect directly with thousands of verified artisans and property owners. Complete your CAC & business audit ahead of the official launch.
              </p>
            </div>
            <Link
              href="/merchant/register"
              className="btn btn-primary"
              style={{
                background: "#0EA5E9",
                fontWeight: 800,
                padding: "12px 24px",
                whiteSpace: "nowrap",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Merchant Early Registration <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
