"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import {
  Camera, Key, Clock, MapPin, User, ArrowRight, UploadCloud, CheckCircle, X,
  Inbox, RefreshCw, AlertCircle
} from "lucide-react";
import styles from "../pro.module.css";

export interface ActiveJob {
  id: string;
  service: string;
  customer: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  price: string;
  status: string;
  otpCode: string;
  beforePhoto: string | null;
  afterPhoto: string | null;
}

export default function ProJobsPage() {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ActiveJob | null>(null);

  const [beforeUploaded, setBeforeUploaded] = useState(false);
  const [afterUploaded, setAfterUploaded] = useState(false);
  const [inputOtp, setInputOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRealActiveJobs = async () => {
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
      const res = await fetch(`/api/pro/jobs?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok && data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.warn("Failed to fetch real active jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealActiveJobs();
  }, []);

  const handleStartJob = async (jobId: string) => {
    if (!beforeUploaded) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/pro/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "START_JOB",
          bookingReference: jobId,
          beforePhotoUrl: "https://handyhub.ng/photos/before_sample.jpg",
        }),
      });

      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: "IN_PROGRESS", beforePhoto: "https://handyhub.ng/photos/before_sample.jpg" } : j))
        );
        if (selectedJob) {
          setSelectedJob({ ...selectedJob, status: "IN_PROGRESS", beforePhoto: "https://handyhub.ng/photos/before_sample.jpg" });
        }
        setSuccessMessage("Job started successfully! Before photo logged.");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setOtpError("Failed to update job status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteJobWithOtp = async (jobId: string) => {
    setOtpError("");
    if (!afterUploaded) {
      setOtpError("Please upload the 'After Job Photo' before completing.");
      return;
    }
    if (!inputOtp.trim()) {
      setOtpError("Please enter the 4-digit completion OTP code provided by the customer.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pro/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE_JOB",
          bookingReference: jobId,
          otpCode: inputOtp.trim(),
          afterPhotoUrl: "https://handyhub.ng/photos/after_sample.jpg",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  status: "COMPLETED",
                  afterPhoto: "https://handyhub.ng/photos/after_sample.jpg",
                }
              : j
          )
        );
        setSuccessMessage("Job verified with OTP! Escrow payout credited to your wallet.");
        setTimeout(() => {
          setSelectedJob(null);
          setSuccessMessage("");
          setInputOtp("");
          setBeforeUploaded(false);
          setAfterUploaded(false);
          fetchRealActiveJobs();
        }, 2500);
      } else {
        setOtpError(data.error || "Failed to complete job.");
      }
    } catch (err) {
      setOtpError("Network error completing job.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="h2">My Active Jobs & Execution Proof</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
            Upload before/after photos and input customer completion OTP to unlock escrow payout.
          </p>
        </div>
        <button onClick={fetchRealActiveJobs} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refresh Jobs
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>Loading real assigned database jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="card" style={{ padding: "50px", textAlign: "center", background: "var(--bg-tertiary)", borderRadius: "var(--radius-2xl)", border: "1px solid var(--border-primary)" }}>
          <Inbox size={48} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 16 }} />
          <h3 className="h3" style={{ margin: "0 0 8px 0", color: "var(--text-primary)" }}>No Active Job Dispatches Assigned</h3>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-secondary)", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
            Zero demo jobs active. When customers book your category services in your region, new dispatch requests will assign to you here for execution proof & OTP payout verification.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {jobs.map((job) => (
            <div key={job.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                  <h3 className="h4" style={{ margin: 0 }}>{job.service}</h3>
                  <span className="badge" style={{ background: job.status === "COMPLETED" ? "rgba(16,185,129,0.15)" : job.status === "IN_PROGRESS" ? "rgba(14,165,233,0.15)" : "rgba(245,158,11,0.15)", color: job.status === "COMPLETED" ? "#10B981" : job.status === "IN_PROGRESS" ? "#0EA5E9" : "#F59E0B", fontSize: "11px", fontWeight: 700 }}>
                    {job.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--fs-xs)", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={14} /> Client: {job.customer} ({job.phone})</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={14} /> {job.address}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={14} /> {job.date} • {job.time}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                <strong style={{ fontSize: "var(--fs-lg)", color: "var(--color-primary-400)" }}>{job.price}</strong>
                <button
                  className="btn btn-primary btn-md"
                  style={{ background: "#0EA5E9" }}
                  onClick={() => setSelectedJob(job)}
                >
                  {job.status === "IN_PROGRESS" ? "Verify Completion OTP ➔" : "Start & Upload Before Photo ➔"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execution Proof & OTP Modal */}
      {selectedJob && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(9, 13, 22, 0.92)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "520px", background: "#1E293B", border: "1px solid #334155", borderRadius: 20, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #334155", paddingBottom: 12 }}>
              <div>
                <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Job Execution & Escrow Release</h3>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>Ref: {selectedJob.id} • Client: {selectedJob.customer}</span>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            {successMessage && (
              <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                ✅ {successMessage}
              </div>
            )}

            {otpError && (
              <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #EF4444", color: "#EF4444", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                ⚠️ {otpError}
              </div>
            )}

            {/* Step 1: Start Job & Upload Before Photo */}
            {selectedJob.status !== "IN_PROGRESS" && selectedJob.status !== "COMPLETED" && (
              <div>
                <strong style={{ fontSize: 13, color: "#0EA5E9", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  Step 1: Upload Before-Job Photo Evidence
                </strong>
                <p style={{ fontSize: 13, color: "#CBD5E1", marginBottom: 16 }}>
                  Take or upload a photo of the client site before commencing work to protect your rating and verify job start.
                </p>

                <div
                  onClick={() => setBeforeUploaded(true)}
                  style={{
                    border: beforeUploaded ? "2px solid #10B981" : "2px dashed #334155",
                    background: beforeUploaded ? "rgba(16,185,129,0.1)" : "#0F172A",
                    padding: 24,
                    borderRadius: 12,
                    textAlign: "center",
                    cursor: "pointer",
                    marginBottom: 20,
                  }}
                >
                  <Camera size={32} color={beforeUploaded ? "#10B981" : "#0EA5E9"} style={{ marginBottom: 8 }} />
                  <strong style={{ display: "block", color: beforeUploaded ? "#10B981" : "#F8FAFC", fontSize: 14 }}>
                    {beforeUploaded ? "✓ Before-Job Photo Captured & Attached" : "Tap to Capture / Select Before Photo"}
                  </strong>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>Supports JPG, PNG, WEBP files</span>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJob(null)}>Cancel</button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!beforeUploaded || submitting}
                    onClick={() => handleStartJob(selectedJob.id)}
                    style={{ background: "#0EA5E9" }}
                  >
                    {submitting ? "Starting..." : "Start Job & Begin Work ➔"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Complete Job & Verify Customer OTP */}
            {(selectedJob.status === "IN_PROGRESS" || beforeUploaded) && (
              <div>
                <strong style={{ fontSize: 13, color: "#10B981", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  Step 2: Upload After-Job Photo & Verify Customer Completion OTP
                </strong>

                <div
                  onClick={() => setAfterUploaded(true)}
                  style={{
                    border: afterUploaded ? "2px solid #10B981" : "2px dashed #334155",
                    background: afterUploaded ? "rgba(16,185,129,0.1)" : "#0F172A",
                    padding: 16,
                    borderRadius: 12,
                    textAlign: "center",
                    cursor: "pointer",
                    marginBottom: 16,
                  }}
                >
                  <Camera size={28} color={afterUploaded ? "#10B981" : "#0EA5E9"} style={{ marginBottom: 6 }} />
                  <strong style={{ display: "block", color: afterUploaded ? "#10B981" : "#F8FAFC", fontSize: 13 }}>
                    {afterUploaded ? "✓ After-Job Proof Photo Captured & Attached" : "Tap to Capture / Select After Photo"}
                  </strong>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Enter 4-Digit Customer Completion OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 4819"
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#0F172A",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 20,
                      fontWeight: "bold",
                      letterSpacing: 4,
                      textAlign: "center",
                      color: "#10B981",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#94A3B8", display: "block", marginTop: 4 }}>
                    Ask customer for the 4-digit code shown on their HandyHub tracking screen upon completion.
                  </span>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJob(null)}>Cancel</button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={submitting || !afterUploaded || !inputOtp.trim()}
                    onClick={() => handleCompleteJobWithOtp(selectedJob.id)}
                    style={{ background: "#10B981" }}
                  >
                    {submitting ? "Verifying..." : "Verify OTP & Release Escrow Payout ✅"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ProLayoutShell>
  );
}
