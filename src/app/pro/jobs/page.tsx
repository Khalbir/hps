"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import {
  Camera, Key, Clock, MapPin, User, ArrowRight, UploadCloud, CheckCircle, X,
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
  status: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED_PENDING_RELEASE" | "PAID";
  otpCode: string;
  beforePhoto: string | null;
  afterPhoto: string | null;
}

const mockJobs: ActiveJob[] = [
  {
    id: "HHP-M1K9X",
    service: "Deep Cleaning",
    customer: "Amina I.",
    phone: "+234 802 111 4455",
    address: "12 Aminu Kano Crescent, Maitama, Abuja",
    date: "Today",
    time: "2:00 PM",
    price: "₦25,000",
    status: "CONFIRMED",
    otpCode: "4819",
    beforePhoto: null,
    afterPhoto: null,
  },
  {
    id: "HHP-N2L0Y",
    service: "Residential Cleaning",
    customer: "Chidi O.",
    phone: "+234 803 222 5566",
    address: "Plot 5, Wuse 2, Abuja",
    date: "Tomorrow",
    time: "9:00 AM",
    price: "₦15,000",
    status: "CONFIRMED",
    otpCode: "9204",
    beforePhoto: null,
    afterPhoto: null,
  },
];

export default function ProJobsPage() {
  const [jobs, setJobs] = useState<ActiveJob[]>(mockJobs);
  const [selectedJob, setSelectedJob] = useState<ActiveJob | null>(null);

  const [beforeUploaded, setBeforeUploaded] = useState(false);
  const [afterUploaded, setAfterUploaded] = useState(false);
  const [inputOtp, setInputOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleStartJob = (jobId: string) => {
    if (!beforeUploaded) return;
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: "IN_PROGRESS", beforePhoto: "https://handyhub.ng/photos/before_sample.jpg" } : j))
    );
    if (selectedJob) {
      setSelectedJob({ ...selectedJob, status: "IN_PROGRESS", beforePhoto: "https://handyhub.ng/photos/before_sample.jpg" });
    }
  };

  const handleCompleteJobWithOtp = (jobId: string) => {
    setOtpError("");
    if (!afterUploaded) {
      setOtpError("Please upload the 'After Job Photo' before completing.");
      return;
    }
    if (inputOtp.trim() !== selectedJob?.otpCode) {
      setOtpError("Invalid Completion OTP. Please ask customer for the correct 4-digit code shown on their app.");
      return;
    }

    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "COMPLETED_PENDING_RELEASE",
              afterPhoto: "https://handyhub.ng/photos/after_sample.jpg",
            }
          : j
      )
    );
    setSuccessMessage("Job verified with OTP! Payment entered 24-hour escrow holding window.");
    setTimeout(() => {
      setSelectedJob(null);
      setSuccessMessage("");
      setInputOtp("");
      setBeforeUploaded(false);
      setAfterUploaded(false);
    }, 2500);
  };

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 className="h2">My Active Jobs & Execution Proof</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
          Upload before/after photos and input customer completion OTP to unlock escrow payout.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {jobs.map((job) => (
          <div key={job.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                <h3 className="h4">{job.service}</h3>
                <span
                  className="badge"
                  style={{
                    background:
                      job.status === "COMPLETED_PENDING_RELEASE"
                        ? "rgba(16,185,129,0.15)"
                        : job.status === "IN_PROGRESS"
                        ? "rgba(139,92,246,0.15)"
                        : "rgba(59,130,246,0.15)",
                    color:
                      job.status === "COMPLETED_PENDING_RELEASE"
                        ? "#10B981"
                        : job.status === "IN_PROGRESS"
                        ? "#8B5CF6"
                        : "#3B82F6",
                  }}
                >
                  {job.status === "COMPLETED_PENDING_RELEASE" ? "Escrow Holding (24h)" : job.status}
                </span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <User size={14} /> Client: {job.customer} ({job.phone})
              </p>
              <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-xs)", marginTop: "var(--space-1)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <MapPin size={14} /> {job.address}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
              <span style={{ fontSize: "var(--fs-lg)", fontWeight: "var(--fw-bold)", color: "var(--color-primary-400)" }}>{job.price}</span>
              <button
                className="btn btn-primary btn-md"
                onClick={() => {
                  setSelectedJob(job);
                  setBeforeUploaded(!!job.beforePhoto);
                  setAfterUploaded(!!job.afterPhoto);
                }}
              >
                {job.status === "CONFIRMED" ? "Start & Upload Before Photo" : job.status === "IN_PROGRESS" ? "Complete & Input OTP" : "View Escrow Payout"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Workflow */}
      <AnimatePresence>
        {selectedJob && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "var(--space-4)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card"
              style={{ width: "100%", maxWidth: 600 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-primary)", paddingBottom: "var(--space-4)", marginBottom: "var(--space-6)" }}>
                <div>
                  <h3 className="h4">{selectedJob.service} — Job Execution Proof</h3>
                  <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>Booking Ref: {selectedJob.id}</p>
                </div>
                <button onClick={() => setSelectedJob(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                  <X size={20} />
                </button>
              </div>

              {successMessage ? (
                <div style={{ textAlign: "center", padding: "var(--space-8) 0" }}>
                  <CheckCircle size={48} color="#10B981" style={{ margin: "0 auto var(--space-4)" }} />
                  <h3 className="h4" style={{ color: "#10B981" }}>{successMessage}</h3>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
                  {/* Step A: Before Photo (If Confirmed) */}
                  {selectedJob.status === "CONFIRMED" && (
                    <div>
                      <h4 style={{ fontSize: "var(--fs-sm)", marginBottom: "var(--space-2)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Camera size={18} color="#0EA5E9" /> 1. Upload Before-Job Photo (Mandatory Checkpoint)
                      </h4>
                      <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
                        Photograph the area or broken item before touching anything to protect yourself against false damages.
                      </p>
                      <div
                        className={`${styles.uploadBox} ${beforeUploaded ? styles.uploadBoxDone : ""}`}
                        onClick={() => setBeforeUploaded(true)}
                      >
                        <UploadCloud size={28} />
                        <span>{beforeUploaded ? "✓ Before-Job Photo Uploaded" : "Tap to Upload / Capture Before-Job Photo"}</span>
                      </div>
                      <button
                        className="btn btn-primary btn-md w-full"
                        style={{ marginTop: "var(--space-6)" }}
                        disabled={!beforeUploaded}
                        onClick={() => handleStartJob(selectedJob.id)}
                      >
                        Clock-In & Start Work
                      </button>
                    </div>
                  )}

                  {/* Step B: After Photo & OTP (If In Progress) */}
                  {selectedJob.status === "IN_PROGRESS" && (
                    <div>
                      <h4 style={{ fontSize: "var(--fs-sm)", marginBottom: "var(--space-2)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Camera size={18} color="#8B5CF6" /> 1. Upload After-Job Photo (Completed Resolution)
                      </h4>
                      <div
                        className={`${styles.uploadBox} ${afterUploaded ? styles.uploadBoxDone : ""}`}
                        onClick={() => setAfterUploaded(true)}
                        style={{ marginBottom: "var(--space-6)" }}
                      >
                        <UploadCloud size={28} />
                        <span>{afterUploaded ? "✓ After-Job Photo Uploaded" : "Tap to Upload / Capture Finished Fix Photo"}</span>
                      </div>

                      <h4 style={{ fontSize: "var(--fs-sm)", marginBottom: "var(--space-2)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Key size={18} color="#F59E0B" /> 2. Enter Customer 4-Digit Completion OTP
                      </h4>
                      <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", marginBottom: "var(--space-3)" }}>
                        Ask the customer for their completion PIN code shown on their HandyHub app. (Demo OTP Code: <code>{selectedJob.otpCode}</code>)
                      </p>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Enter 4-digit OTP"
                        value={inputOtp}
                        onChange={(e) => setInputOtp(e.target.value)}
                        style={{ width: "100%", height: 50, textAlign: "center", fontSize: "var(--fs-xl)", letterSpacing: "0.5em", fontWeight: "bold", background: "var(--bg-tertiary)", border: "2px solid var(--border-primary)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)" }}
                      />

                      {otpError && <p style={{ color: "#EF4444", fontSize: "var(--fs-xs)", marginTop: "var(--space-2)" }}>{otpError}</p>}

                      <button
                        className="btn btn-primary btn-lg w-full"
                        style={{ marginTop: "var(--space-6)" }}
                        disabled={!afterUploaded || inputOtp.length < 4}
                        onClick={() => handleCompleteJobWithOtp(selectedJob.id)}
                      >
                        Verify OTP & Submit Job for Escrow Release
                      </button>
                    </div>
                  )}

                  {/* Step C: Escrow Pending */}
                  {selectedJob.status === "COMPLETED_PENDING_RELEASE" && (
                    <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
                      <Clock size={40} color="#10B981" style={{ margin: "0 auto var(--space-3)" }} />
                      <h4 className="h4">Payment Held in Escrow (24h Dispute Window)</h4>
                      <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", margin: "var(--space-2) 0 var(--space-4)" }}>
                        Job complete & OTP verified. Funds ({selectedJob.price}) will automatically disburse to your wallet balance after 24 hours.
                      </p>
                      <div className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                        Disbursement Countdown: 23h 48m remaining
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ProLayoutShell>
  );
}
