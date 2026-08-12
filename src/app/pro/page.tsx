"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import {
  ShieldCheck, Clock, AlertTriangle, ArrowRight,
  RefreshCw, Inbox, CheckCircle2, XCircle
} from "lucide-react";

export default function ProDashboard() {
  const [loading, setLoading] = useState(true);
  const [proData, setProData] = useState<any>({
    proName: "Artisan Partner",
    verificationStatus: "UNVERIFIED",
    hasSubmittedDocs: false,
    verificationNotes: "",
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
    let localName = "";

    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
        if (parsed?.user?.email || parsed?.email) activeEmail = parsed.user?.email || parsed.email;
        if (parsed?.user?.firstName || parsed?.firstName) {
          const fn = parsed?.user?.firstName || parsed?.firstName;
          const ln = parsed?.user?.lastName || parsed?.lastName || "";
          localName = `${fn} ${ln}`.trim();
        }
      } catch (err) {}
    }

    try {
      const res = await fetch(`/api/pro/dashboard?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}&_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setProData({
          ...data,
          proName: localName || data.proName || "Artisan Partner",
        });
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

  const status = proData.verificationStatus; // VERIFIED | PENDING_REVIEW | REJECTED | UNVERIFIED
  const isVerified = status === "VERIFIED";
  const isPendingReview = status === "PENDING_REVIEW";
  const isRejected = status === "REJECTED";

  return (
    <ProLayoutShell>
      {/* Header Banner */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)", flexWrap: "wrap" }}>
          <h1 className="h2">Professional Dashboard</h1>
          
          {/* Dynamic Verification Badge */}
          {isVerified ? (
            <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
              <ShieldCheck size={14} /> Account Fully Verified
            </span>
          ) : isPendingReview ? (
            <span className="badge" style={{ background: "rgba(14,165,233,0.15)", color: "#0EA5E9", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
              <Clock size={14} /> Audit Pending Admin Review
            </span>
          ) : isRejected ? (
            <span className="badge" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
              <XCircle size={14} /> Audit Action Required
            </span>
          ) : (
            <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
              <AlertTriangle size={14} /> Verification Required
            </span>
          )}
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
          Welcome back, <strong style={{ color: "var(--text-primary)" }}>{proData.proName}</strong>! Here is your live job dispatch overview and earnings.
        </p>
      </div>

      {/* Anti-Circumvention Mandate Banner */}
      <div style={{ background: "rgba(239,68,68,0.12)", border: "1.5px solid #EF4444", borderRadius: "14px", padding: "14px 20px", marginBottom: "var(--space-6)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🚫</span>
          <div>
            <strong style={{ color: "var(--text-primary)", fontSize: "14px", display: "block" }}>Anti-Circumvention Warning: All Job Payments Must Remain On-Platform!</strong>
            <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
              Soliciting cash off-platform violates HandyHub Partner Terms. Violations result in instant account deactivation, escrow forfeiture, and ₦250,000 liquidated damages.
            </span>
          </div>
        </div>
        <Link href="/terms#off-platform-policy" style={{ fontSize: "12px", color: "#EF4444", fontWeight: 700, textDecoration: "none", background: "#0F172A", padding: "6px 12px", borderRadius: "8px", border: "1px solid #EF4444", whiteSpace: "nowrap" }}>
          View Legal Terms ➔
        </Link>
      </div>

      {/* Dynamic Verification Alert Banner */}
      <div style={{
        background: isVerified
          ? "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(14,165,233,0.1) 100%)"
          : isPendingReview
          ? "linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(99,102,241,0.1) 100%)"
          : isRejected
          ? "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(245,158,11,0.1) 100%)"
          : "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(14,165,233,0.1) 100%)",
        border: `1.5px solid ${isVerified ? "rgba(16,185,129,0.4)" : isPendingReview ? "rgba(14,165,233,0.4)" : isRejected ? "rgba(239,68,68,0.4)" : "rgba(245,158,11,0.4)"}`,
        padding: "var(--space-5)",
        borderRadius: "var(--radius-xl)",
        marginBottom: "var(--space-6)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "var(--space-4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: isVerified ? "#10B981" : isPendingReview ? "#0EA5E9" : isRejected ? "#EF4444" : "#F59E0B",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {isVerified ? <CheckCircle2 size={24} /> : isPendingReview ? <Clock size={24} /> : isRejected ? <XCircle size={24} /> : <ShieldCheck size={24} />}
          </div>
          <div>
            <strong style={{ fontSize: "var(--fs-base)", color: "var(--text-primary)", display: "block" }}>
              {isVerified
                ? "Multi-Stage Verification Audit Complete ✅"
                : isPendingReview
                ? "📋 Verification Audit Pending Admin Approval"
                : isRejected
                ? "Verification Document Audit Flagged"
                : "Complete Your 4-Step Professional Verification"}
            </strong>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>
              {isVerified
                ? "Government NIN Verified • Trade Cert Audited • 2 Guarantors Approved • Trade Quiz Passed"
                : isPendingReview
                ? "Your NIN ID, selfie, trade certificate & guarantors have been submitted. Admin Compliance Officers are auditing your submission."
                : isRejected
                ? proData.verificationNotes || "Admin Notes: Documents were flagged during audit. Please update your government ID or trade certificate."
                : "Submit your Govt NIN ID, facial selfie, trade certificate, 2 guarantors & trade quiz for Admin review."}
            </span>
          </div>
        </div>

        <Link
          href="/pro/verification"
          className="btn btn-primary btn-sm"
          style={{
            background: isVerified ? "#10B981" : isPendingReview ? "#0EA5E9" : isRejected ? "#EF4444" : "#0EA5E9",
            fontWeight: "bold",
          }}
        >
          {isVerified
            ? "View Verification Dossier"
            : isPendingReview
            ? "View Submitted Dossier ➔"
            : isRejected
            ? "Re-submit Verification Credentials ➔"
            : "Start Verification Audit ➔"}
        </Link>
      </div>

      {/* High-Confidence Platform Stats Banner */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={18} color="#10B981" />
          <span style={{ fontSize: "13px", color: "#F8FAFC", fontWeight: 700 }}>327 Verified Professionals</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={18} color="#0EA5E9" />
          <span style={{ fontSize: "13px", color: "#F8FAFC", fontWeight: 700 }}>1,828 Completed Dispatches</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#F59E0B", fontWeight: 700, fontSize: "13px" }}>4.9★ Average Rating</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={18} color="#8B5CF6" />
          <span style={{ fontSize: "13px", color: "#F8FAFC", fontWeight: 700 }}>15-Min Rapid Dispatch SLA</span>
        </div>
      </div>

      {/* Real Database Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #0EA5E9" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>Wallet Balance</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#0EA5E9" }}>₦{(proData.walletBalance || 0).toLocaleString()}</h3>
        </div>
        <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #F59E0B" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#F59E0B" }}>Pending Escrow Hold</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#F59E0B" }}>₦{(proData.pendingEscrow || 0).toLocaleString()}</h3>
        </div>
        <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #10B981" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#10B981" }}>Completed Jobs</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#10B981" }}>{proData.completedJobs || 0}</h3>
        </div>
        <div className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid #8B5CF6" }}>
          <span style={{ fontSize: "var(--fs-xs)", color: "#8B5CF6" }}>Customer Rating</span>
          <h3 className="h3" style={{ margin: "4px 0 0", color: "#8B5CF6" }}>{proData.rating || 5.0}★</h3>
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
        ) : !proData.activeJobs || proData.activeJobs.length === 0 ? (
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
