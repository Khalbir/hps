"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import {
  ClipboardList, Calendar, Star, Wallet, ShieldCheck,
  TrendingUp, Clock, DollarSign, MapPin, ArrowRight,
  Phone, CheckCircle2,
} from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

const upcomingJobs = [
  { id: "HHP-M1K9X", service: "Deep Cleaning", customer: "Amina I.", address: "12 Aminu Kano, Maitama", date: "Today", time: "2:00 PM", price: "₦25,000", status: "CONFIRMED" },
  { id: "HHP-N2L0Y", service: "Residential Cleaning", customer: "Chidi O.", address: "Plot 5, Wuse 2", date: "Tomorrow", time: "9:00 AM", price: "₦15,000", status: "PENDING" },
  { id: "HHP-O3M1Z", service: "Post Construction", customer: "Grace N.", address: "7 Alex Ekwueme Way, Jabi", date: "Jul 22", time: "10:00 AM", price: "₦40,000", status: "CONFIRMED" },
];

export default function ProDashboard() {
  return (
    <ProLayoutShell>
      {/* Header Banner */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
          <h1 className="h2">Professional Dashboard</h1>
          <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ShieldCheck size={14} /> Verified Partner
          </span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
          Welcome back, Blessing! Here is your job dispatch overview and earnings.
        </p>
      </div>

      {/* Verification Checkmate Alert Banner if needed */}
      <div style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(139,92,246,0.1) 100%)", border: "1.5px solid rgba(14,165,233,0.3)", padding: "var(--space-5)", borderRadius: "var(--radius-xl)", marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#0EA5E9", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <strong style={{ fontSize: "var(--fs-base)", color: "var(--text-primary)", display: "block" }}>
              Multi-Stage Professional Verification Active
            </strong>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>
              Government NIN Verified • Trade Cert Audited • 2 Guarantors Approved • Quiz Score: 100%
            </span>
          </div>
        </div>
        <Link href="/pro/verification" className="btn btn-primary btn-sm">
          Update Verification Audit
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>Wallet Balance</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#0EA5E9" }}>₦142,500</h3>
        </div>
        <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #F59E0B" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#F59E0B" }}>Pending Escrow Hold</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#F59E0B" }}>₦25,000</h3>
        </div>
        <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #10B981" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#10B981" }}>Completed Jobs</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#10B981" }}>48</h3>
        </div>
        <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #F59E0B" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#F59E0B" }}>Customer Rating</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#F59E0B" }}>4.9★</h3>
        </div>
      </div>

      {/* Upcoming Jobs */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h3 className="h4">Active & Upcoming Job Dispatches</h3>
          <Link href="/pro/jobs" className="btn btn-secondary btn-xs">
            Job Execution Controls <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {upcomingJobs.map((job) => (
            <div key={job.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-primary)", flexWrap: "wrap", gap: "var(--space-3)" }}>
              <div>
                <strong style={{ display: "block", fontSize: "var(--fs-base)" }}>{job.service}</strong>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>Client: {job.customer} • Location: {job.address}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                <span style={{ fontSize: "var(--fs-md)", fontWeight: "bold", color: "var(--color-primary-400)" }}>{job.price}</span>
                <Link href="/pro/jobs" className="btn btn-primary btn-xs">
                  Execution Proof & OTP <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProLayoutShell>
  );
}
