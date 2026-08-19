"use client";

import Link from "next/link";
import {
  Store, ShieldCheck, CreditCard, Truck, ArrowRight, Zap,
  CheckCircle2, Users, DollarSign, Award, Clock
} from "lucide-react";

export default function MerchantLandingPage() {
  return (
    <div style={{ background: "#0B1120", minHeight: "100vh", color: "#F8FAFC" }}>

      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(180deg, rgba(14, 165, 233, 0.15) 0%, rgba(11, 17, 32, 0) 100%)",
          padding: "80px 20px 60px",
          textAlign: "center",
          borderBottom: "1px solid #1E293B",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(14, 165, 233, 0.15)",
              border: "1px solid rgba(14, 165, 233, 0.3)",
              padding: "6px 18px",
              borderRadius: "30px",
              color: "#38BDF8",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "20px",
            }}
          >
            <Store size={16} /> HandyHub Verified Merchant Network
          </div>

          <h1 style={{ fontSize: "44px", fontWeight: 900, margin: "0 0 16px 0", letterSpacing: "-1px", lineHeight: 1.2 }}>
            Sell Replacement Parts to Thousands of <span style={{ color: "#0EA5E9" }}>Homeowners & Artisans</span> in Abuja
          </h1>

          <p style={{ fontSize: "17px", color: "#94A3B8", maxWidth: "700px", margin: "0 auto 34px", lineHeight: 1.6 }}>
            Join Abuja&apos;s most trusted verified supplier network. Gain direct access to live repair requests, automated procurement dispatches, and guaranteed bank disbursements with zero direct cash friction.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <Link
              href="/merchant/register"
              className="btn btn-primary btn-lg"
              style={{
                background: "#0EA5E9",
                fontWeight: 800,
                padding: "14px 28px",
                borderRadius: "10px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Register Your Business & Physical Store <ArrowRight size={18} />
            </Link>
            <Link
              href="/merchant/dashboard"
              className="btn btn-secondary btn-lg"
              style={{
                background: "#1E293B",
                borderColor: "#334155",
                fontWeight: 700,
                padding: "14px 24px",
                borderRadius: "10px",
                textDecoration: "none",
              }}
            >
              Merchant Portal Login
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Pillars of Merchant Value */}
      <section style={{ maxWidth: "1140px", margin: "0 auto", padding: "70px 20px" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: 800, margin: "0 0 40px 0" }}>
          Why Verified Suppliers Partner with HandyHub
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: "24px" }}>
            <Zap size={32} color="#0EA5E9" style={{ marginBottom: "14px" }} />
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px 0", color: "#F8FAFC" }}>HandyHub Smart Select Dispatches</h3>
            <p style={{ fontSize: "13.5px", color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>
              Our auto-procurement algorithm automatically routes customer part requests directly to your store based on stock availability and proximity in Abuja.
            </p>
          </div>

          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: "24px" }}>
            <DollarSign size={32} color="#10B981" style={{ marginBottom: "14px" }} />
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px 0", color: "#F8FAFC" }}>Guaranteed Bank Disbursements</h3>
            <p style={{ fontSize: "13.5px", color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>
              All customer funds are pre-funded in HandyHub&apos;s Dedicated Procurement Account and disbursed directly to your bank account upon 6-digit OTP delivery confirmation.
            </p>
          </div>

          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: "24px" }}>
            <Truck size={32} color="#38BDF8" style={{ marginBottom: "14px" }} />
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px 0", color: "#F8FAFC" }}>Integrated Courier Pickup</h3>
            <p style={{ fontSize: "13.5px", color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>
              No logistics headaches. Simply pack the certified component in your store and our Priority Dispatch riders handle pickup and doorstep delivery.
            </p>
          </div>

          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: "24px" }}>
            <ShieldCheck size={32} color="#F59E0B" style={{ marginBottom: "14px" }} />
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px 0", color: "#F8FAFC" }}>Verified Merchant Badge</h3>
            <p style={{ fontSize: "13.5px", color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>
              Distinguish your business from unverified retailers with an official verified badge, customer trust scores, and priority search placement.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Pricing */}
      <section style={{ background: "#1E293B", borderTop: "1px solid #334155", borderBottom: "1px solid #334155", padding: "60px 20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <span className="badge" style={{ background: "rgba(14,165,233,0.15)", color: "#38BDF8", marginBottom: "12px" }}>
            Transparent Flat Subscription
          </span>
          <h2 style={{ fontSize: "30px", fontWeight: 900, margin: "0 0 8px 0" }}>
            ₦15,000 <span style={{ fontSize: "16px", color: "#94A3B8", fontWeight: 400 }}>/ Month</span>
          </h2>
          <p style={{ fontSize: "14px", color: "#94A3B8", marginBottom: "24px" }}>
            Unlimited product listings, real-time inventory management, priority dispatch matching, and automated Paystack billing reminders.
          </p>

          <Link
            href="/merchant/register"
            className="btn btn-primary btn-lg"
            style={{ background: "#0EA5E9", fontWeight: 800, padding: "14px 32px", textDecoration: "none", display: "inline-block" }}
          >
            Get Started as a Verified Merchant 🚀
          </Link>
        </div>
      </section>
    </div>
  );
}
