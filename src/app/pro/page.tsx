"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import {
  ClipboardList, Calendar, Star, Wallet, ShieldCheck,
  TrendingUp, Clock, DollarSign, MapPin, ArrowRight,
  Phone, CheckCircle2, Inbox, RefreshCw
} from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProDashboard() {
  const [loading, setLoading] = useState(true);
  const [proData, setProData] = useState<any>({
    proName: "Artisan Partner",
    verificationStatus: "PENDING",
    walletBalance: 0,
    pendingEscrow: 0,
    completedJobs: 0,
    rating: 5.0,
    activeJobs: [],
  });

  const fetchProDashboardTelemetry = async () => {
    setLoading(true);
    let activeUserId = "";
    let activeEmail = "";

    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
        if (parsed?.user?.email || parsed?.email) activeEmail = parsed.user?.email || parsed.email;
      } catch (err) {
        console.warn("Session read warning:", err);
      }
    }

    try {
      const res = await fetch(`/api/pro/dashboard?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok) {
        setProData(data);
      }
    } catch (err) {
      console.warn("Failed to fetch pro dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProDashboardTelemetry();
  }, []);

  const isVerified = proData.verificationStatus === "VERIFIED";

  return (
    <ProLayoutShell>
      {/* Header Banner */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
          <h1 className="h2">Professional Dashboard</h1>
          <span
            className="badge"
            style={{
              background: isVerified ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
              color: isVerified ? "#10B981" : "#F59E0B",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 700,
            }}
          >
            <ShieldCheck size={14} /> {isVerified ? "Verified Partner" : "Pending Verification Audit"}
          </span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
          Welcome back, <strong style={{ color: "var(--text-primary)" }}>{proData.proName}</strong>! Here is your live job dispatch overview and earnings.
        </p>
      </div>

      {/* Verification Checkmate Alert Banner */}
      <div style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(139,92,246,0.1) 100%)", border: "1.5px solid rgba(14,165,233,0.3)", padding: "var(--space-5)", borderRadius: "var(--radius-xl)", marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: isVerified ? "#10B981" : "#0EA5E9", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <strong style={{ fontSize: "var(--fs-base)", color: "var(--text-primary)", display: "block" }}>
              {isVerified ? "Multi-Stage Verification Audit Complete ✅" : "Complete Your 4-Step Professional Verification"}
            </strong>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>
              {isVerified
                ? "Government NIN Verified • Trade Cert Audited • 2 Guarantors Approved • Trade Quiz Passed"
                : "Submit your Govt NIN ID, facial selfie, trade certificate, 2 guarantors & trade quiz for Admin review."}
            </span>
          </div>
        </div>
        <Link href="/pro/verification" className="btn btn-primary btn-sm" style={{ background: "#0EA5E9" }}>
          {isVerified ? "View Verification Dossier" : "Start Verification Audit ➔"}
        </Link>
      </div>

      {/* Real Database Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #0EA5E9" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>Wallet Balance</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#0EA5E9" }}>₦{proData.walletBalance.toLocaleString()}</h3>
        </div>
        <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #F59E0B" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#F59E0B" }}>Pending Escrow Hold</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#F59E0B" }}>₦{proData.pendingEscrow.toLocaleString()}</h3>
        </div>
        <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #10B981" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#10B981" }}>Completed Jobs</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#10B981" }}>{proData.completedJobs}</h3>
        </div>
        <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #8B5CF6" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#8B5CF6" }}>Customer Rating</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#8B5CF6" }}>{proData.rating}★</h3>
        </div>
      </div>

      {/* Active Jobs Dispatch Card */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: 12 }}>
          <h3 className="h4">Active & Upcoming Job Dispatches</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchProDashboardTelemetry} className="btn btn-secondary btn-xs" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <RefreshCw size={12} /> Sync
            </button>
            <Link href="/pro/jobs" className="btn btn-secondary btn-xs">
              Job Execution Controls <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>Loading real database job dispatches...</div>
        ) : proData.activeJobs.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", background: "var(--bg-tertiary)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-primary)" }}>
            <Inbox size={40} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 12 }} />
            <h4 className="h4" style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>No Active Job Dispatches</h4>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-secondary)", maxWidth: "450px", marginLeft: "auto", marginRight: "auto" }}>
              You currently have 0 active job assignments. When customers book your category services in your area, new dispatches will arrive here for 1-click acceptance.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {proData.activeJobs.map((job: any) => (
              <div key={job.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-primary)", flexWrap: "wrap", gap: "var(--space-3)" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "var(--fs-base)" }}>{job.service}</strong>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>Client: {job.customer} • Address: {job.address}</span>
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
        )}
      </div>
    </ProLayoutShell>
  );
}
