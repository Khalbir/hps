"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import {
  Camera, Key, Clock, MapPin, User, ArrowRight, UploadCloud, CheckCircle, X,
  Inbox, RefreshCw, AlertCircle, Loader2, Image as ImageIcon, RotateCcw, Check, Sparkles, Eye,
  Wrench, Ticket, ShieldCheck, DollarSign, FileText, CheckCircle2
} from "lucide-react";
import styles from "../pro.module.css";

export interface ActiveJob {
  id: string;
  dbBookingId?: string;
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
  replacementParts?: any[];
}

export default function ProJobsPage() {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ActiveJob | null>(null);

  const [beforePhotoUrl, setBeforePhotoUrl] = useState<string | null>(null);
  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string | null>(null);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  const [inputOtp, setInputOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Replacement Parts Request State
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [targetJobForPart, setTargetJobForPart] = useState<ActiveJob | null>(null);
  const [partName, setPartName] = useState("");
  const [partCategory, setPartCategory] = useState("GENERAL");
  const [partReason, setPartReason] = useState("BURNT_OUT");
  const [partQuantity, setPartQuantity] = useState(1);
  const [partEstimatedCost, setPartEstimatedCost] = useState("");
  const [partEvidencePhoto, setPartEvidencePhoto] = useState<string | null>(null);
  const [partDescription, setPartDescription] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [submittingPart, setSubmittingPart] = useState(false);
  const [partError, setPartError] = useState("");
  const [partSuccess, setPartSuccess] = useState("");

  // Replacement Parts Install & Receipt State
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [selectedPartForInstall, setSelectedPartForInstall] = useState<any>(null);
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState<string | null>(null);
  const [installedPhotoUrl, setInstalledPhotoUrl] = useState<string | null>(null);
  const [installNotes, setInstallNotes] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadingInstalled, setUploadingInstalled] = useState(false);
  const [submittingInstall, setSubmittingInstall] = useState(false);
  const [installError, setInstallError] = useState("");
  const [installSuccess, setInstallSuccess] = useState("");

  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);
  const evidenceFileInputRef = useRef<HTMLInputElement>(null);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);
  const installedFileInputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch(`/api/pro/jobs?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}&_t=${Date.now()}`);
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

  const handleOpenJobModal = (job: ActiveJob) => {
    setSelectedJob(job);
    setOtpError("");
    setSuccessMessage("");
    setInputOtp("");
    setBeforePhotoUrl(job.beforePhoto || null);
    setAfterPhotoUrl(job.afterPhoto || null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 12MB)
    if (file.size > 12 * 1024 * 1024) {
      setOtpError("Image is too large. Please select a photo under 12MB.");
      return;
    }

    if (type === "before") {
      setUploadingBefore(true);
      setUploadProgress("Uploading before-job inspection photo...");
    } else {
      setUploadingAfter(true);
      setUploadProgress("Uploading completed job proof photo...");
    }
    setOtpError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "job-execution-proofs");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        if (type === "before") {
          setBeforePhotoUrl(data.url);
          setSuccessMessage("📸 Before-job photo successfully uploaded!");
        } else {
          setAfterPhotoUrl(data.url);
          setSuccessMessage("📸 After-job photo successfully uploaded!");
        }
        setTimeout(() => setSuccessMessage(""), 3500);
      } else {
        setOtpError(data.error || "Failed to upload photo. Please try again.");
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      setOtpError("Network error while uploading photo. Please check your connection.");
    } finally {
      if (type === "before") setUploadingBefore(false);
      else setUploadingAfter(false);
      setUploadProgress("");
      // Reset input value so same file can be re-selected if needed
      e.target.value = "";
    }
  };

  // Upload photo evidence of damaged part
  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEvidence(true);
    setPartError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "damaged-part-evidence");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setPartEvidencePhoto(data.url);
      } else {
        setPartError(data.error || "Failed to upload part photo.");
      }
    } catch {
      setPartError("Network error uploading photo.");
    } finally {
      setUploadingEvidence(false);
      e.target.value = "";
    }
  };

  // Submit Part Request to Backend
  const handleSubmitPartRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetJobForPart) return;
    if (!partName.trim()) {
      setPartError("Please specify the exact replacement part name.");
      return;
    }
    const cost = parseFloat(partEstimatedCost.replace(/[^0-9.]/g, ""));
    if (isNaN(cost) || cost <= 0) {
      setPartError("Please enter a valid estimated cost in Naira.");
      return;
    }

    setSubmittingPart(true);
    setPartError("");
    setPartSuccess("");

    try {
      const res = await fetch("/api/parts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: targetJobForPart.dbBookingId || targetJobForPart.id,
          partName,
          category: partCategory,
          reason: partReason,
          quantity: partQuantity,
          estimatedCost: cost,
          evidencePhotos: partEvidencePhoto ? [partEvidencePhoto] : [],
          description: partDescription,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPartSuccess("✅ Replacement part requested! Customer has been alerted on WhatsApp and in-app for authorization.");
        setTimeout(() => {
          setPartModalOpen(false);
          setPartSuccess("");
          setPartName("");
          setPartEstimatedCost("");
          setPartEvidencePhoto(null);
          setPartDescription("");
          fetchRealActiveJobs();
        }, 2000);
      } else {
        setPartError(data.error || "Failed to submit part request.");
      }
    } catch {
      setPartError("Network error submitting request.");
    } finally {
      setSubmittingPart(false);
    }
  };

  // Upload receipt & installed photo
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    setInstallError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "part-receipts");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setReceiptPhotoUrl(data.url);
      } else {
        setInstallError(data.error || "Failed to upload receipt.");
      }
    } catch {
      setInstallError("Network error uploading receipt.");
    } finally {
      setUploadingReceipt(false);
      e.target.value = "";
    }
  };

  const handleInstalledUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInstalled(true);
    setInstallError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "installed-parts");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setInstalledPhotoUrl(data.url);
      } else {
        setInstallError(data.error || "Failed to upload installed photo.");
      }
    } catch {
      setInstallError("Network error uploading installed photo.");
    } finally {
      setUploadingInstalled(false);
      e.target.value = "";
    }
  };

  const handleSubmitInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartForInstall) return;
    if (!installedPhotoUrl) {
      setInstallError("Please upload a photo of the newly installed part.");
      return;
    }

    setSubmittingInstall(true);
    setInstallError("");
    setInstallSuccess("");

    try {
      const res = await fetch("/api/parts/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: selectedPartForInstall.id,
          receiptPhotos: receiptPhotoUrl ? [receiptPhotoUrl] : [],
          installedPhotos: [installedPhotoUrl],
          notes: installNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInstallSuccess("✨ Part marked as installed & verified! Client notified.");
        setTimeout(() => {
          setInstallModalOpen(false);
          setInstallSuccess("");
          setReceiptPhotoUrl(null);
          setInstalledPhotoUrl(null);
          setInstallNotes("");
          fetchRealActiveJobs();
        }, 1800);
      } else {
        setInstallError(data.error || "Failed to record installation.");
      }
    } catch {
      setInstallError("Network error recording installation.");
    } finally {
      setSubmittingInstall(false);
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/pro/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACCEPT_JOB",
          bookingReference: jobId,
        }),
      });

      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: "ACCEPTED" } : j))
        );
        if (selectedJob) {
          setSelectedJob({ ...selectedJob, status: "ACCEPTED" });
        }
        setSuccessMessage("✅ Job accepted! Customer notified live on WhatsApp & Email.");
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        const errData = await res.json();
        setOtpError(errData.error || "Failed to accept job.");
      }
    } catch (err) {
      setOtpError("Network error accepting job.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnRoute = async (jobId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/pro/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EN_ROUTE",
          bookingReference: jobId,
        }),
      });

      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: "EN_ROUTE" } : j))
        );
        if (selectedJob) {
          setSelectedJob({ ...selectedJob, status: "EN_ROUTE" });
        }
        setSuccessMessage("🛵 Status updated to EN ROUTE! Customer tracking live GPS arrival.");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err) {
      setOtpError("Network error updating status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartJob = async (jobId: string) => {
    if (!beforePhotoUrl) {
      setOtpError("Please capture or upload the 'Before-Job Photo' before commencing work.");
      return;
    }
    setSubmitting(true);
    setOtpError("");
    try {
      const res = await fetch("/api/pro/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "START_JOB",
          bookingReference: jobId,
          beforePhotoUrl: beforePhotoUrl,
        }),
      });

      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: "IN_PROGRESS", beforePhoto: beforePhotoUrl } : j))
        );
        if (selectedJob) {
          setSelectedJob({ ...selectedJob, status: "IN_PROGRESS", beforePhoto: beforePhotoUrl });
        }
        setSuccessMessage("Job started successfully! Before-work inspection photo logged in escrow.");
        setTimeout(() => setSuccessMessage(""), 3500);
      } else {
        const errData = await res.json();
        setOtpError(errData.error || "Failed to start job.");
      }
    } catch (err) {
      setOtpError("Failed to update job status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteJobWithOtp = async (jobId: string) => {
    setOtpError("");
    if (!afterPhotoUrl) {
      setOtpError("Please upload or capture the 'After-Job Proof Photo' before completing.");
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
          afterPhotoUrl: afterPhotoUrl,
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
                  afterPhoto: afterPhotoUrl,
                }
              : j
          )
        );
        setSuccessMessage("Job verified with OTP! Escrow payout credited to your wallet.");
        setTimeout(() => {
          setSelectedJob(null);
          setSuccessMessage("");
          setInputOtp("");
          setBeforePhotoUrl(null);
          setAfterPhotoUrl(null);
          fetchRealActiveJobs();
        }, 2500);
      } else {
        setOtpError(data.error || "Failed to complete job. Please verify the customer OTP.");
      }
    } catch (err) {
      setOtpError("Network error completing job.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeStyle = (st: string) => {
    switch (st) {
      case "COMPLETED": return { bg: "rgba(16,185,129,0.15)", color: "#10B981" };
      case "IN_PROGRESS": case "WORK_IN_PROGRESS": return { bg: "rgba(139,92,246,0.15)", color: "#8B5CF6" };
      case "EN_ROUTE": return { bg: "rgba(14,165,233,0.15)", color: "#0EA5E9" };
      case "ACCEPTED": return { bg: "rgba(59,130,246,0.15)", color: "#3B82F6" };
      case "ASSIGNED": return { bg: "rgba(239,68,68,0.15)", color: "#EF4444" };
      default: return { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" };
    }
  };

  return (
    <ProLayoutShell>
      {/* Hidden File Inputs for High-Speed Camera & File Uploads */}
      <input
        ref={beforeFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => handleFileUpload(e, "before")}
      />
      <input
        ref={afterFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => handleFileUpload(e, "after")}
      />
      <input
        ref={evidenceFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleEvidenceUpload}
      />
      <input
        ref={receiptFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleReceiptUpload}
      />
      <input
        ref={installedFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleInstalledUpload}
      />

      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="h2">My Active Jobs & Execution Proof</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
            Accept job dispatches, upload live before/after work evidence, and verify completion OTP to unlock escrow payout.
          </p>
        </div>
        <button onClick={fetchRealActiveJobs} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refresh Jobs
        </button>
      </div>

      {successMessage && !selectedJob && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: "bold" }}>
          {successMessage}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>Loading assigned jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="card" style={{ padding: "50px", textAlign: "center", background: "var(--bg-tertiary)", borderRadius: "var(--radius-2xl)", border: "1px solid var(--border-primary)" }}>
          <Inbox size={48} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 16 }} />
          <h3 className="h3" style={{ margin: "0 0 8px 0", color: "var(--text-primary)" }}>No Active Job Dispatches Assigned</h3>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-secondary)", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
            When customers book your category services in your region, new dispatch requests will assign to you here for 1-click acceptance & execution proof.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {jobs.map((job) => {
            const badgeStyle = getStatusBadgeStyle(job.status);
            return (
              <div key={job.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                    <h3 className="h4" style={{ margin: 0 }}>{job.service}</h3>
                    <span className="badge" style={{ background: badgeStyle.bg, color: badgeStyle.color, fontSize: "11px", fontWeight: 700 }}>
                      {job.status === "ASSIGNED" ? "🚨 Awaiting Your Acceptance" : job.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--fs-xs)", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={14} /> Client: {job.customer} ({job.phone})</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={14} /> {job.address}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={14} /> {job.date} • {job.time}</span>
                  </div>

                  {/* Photo Proof Badges */}
                  {(job.beforePhoto || job.afterPhoto) && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {job.beforePhoto && (
                        <button
                          type="button"
                          onClick={() => setPreviewModalUrl(job.beforePhoto)}
                          style={{
                            fontSize: "11px",
                            color: "#38BDF8",
                            background: "rgba(14,165,233,0.12)",
                            border: "1px solid rgba(14,165,233,0.3)",
                            padding: "3px 8px",
                            borderRadius: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                          }}
                        >
                          <Camera size={12} color="#0EA5E9" /> View Before Photo
                        </button>
                      )}
                      {job.afterPhoto && (
                        <button
                          type="button"
                          onClick={() => setPreviewModalUrl(job.afterPhoto)}
                          style={{
                            fontSize: "11px",
                            color: "#10B981",
                            background: "rgba(16,185,129,0.12)",
                            border: "1px solid rgba(16,185,129,0.3)",
                            padding: "3px 8px",
                            borderRadius: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                          }}
                        >
                          <CheckCircle size={12} color="#10B981" /> View After Photo
                        </button>
                      )}
                    </div>
                  )}

                  {/* Active Replacement Parts for this Job */}
                  {job.replacementParts && job.replacementParts.length > 0 && (
                    <div style={{ marginTop: 12, background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ fontSize: "11px", color: "#C084FC", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                        <Wrench size={12} /> Replacement Components ({job.replacementParts.length})
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {job.replacementParts.map((p: any) => (
                          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", background: "rgba(255,255,255,0.03)", padding: "4px 8px", borderRadius: 6, flexWrap: "wrap", gap: 6 }}>
                            <span>
                              <strong>{p.partName}</strong> (₦{Number(p.approvedCost || p.estimatedCost).toLocaleString()})
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontSize: "10px",
                                fontWeight: 700,
                                background: p.status === "VOUCHER_ISSUED" ? "rgba(14,165,233,0.2)" : p.status === "INSTALLED_VERIFIED" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)",
                                color: p.status === "VOUCHER_ISSUED" ? "#38BDF8" : p.status === "INSTALLED_VERIFIED" ? "#10B981" : "#F59E0B"
                              }}>
                                {p.status === "VOUCHER_ISSUED" && `🎟️ Voucher: ${p.voucherCode}`}
                                {p.status === "REQUESTED" && "⏳ Pending Client"}
                                {p.status === "INSTALLED_VERIFIED" && "✅ Installed"}
                                {p.status === "FLAGGED_FRAUD" && "⚠️ Flagged"}
                              </span>
                              {(p.status === "VOUCHER_ISSUED" || p.status === "PURCHASED") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPartForInstall(p);
                                    setInstallModalOpen(true);
                                    setReceiptPhotoUrl(null);
                                    setInstalledPhotoUrl(null);
                                    setInstallError("");
                                    setInstallSuccess("");
                                  }}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: "2px 8px", fontSize: "10px", background: "#8B5CF6", borderColor: "#8B5CF6" }}
                                >
                                  Upload Receipt & Installed Proof
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: "var(--fs-lg)", color: "var(--color-primary-400)" }}>{job.price}</strong>

                  {/* Request Replacement Part Button */}
                  {(job.status === "IN_PROGRESS" || job.status === "ACCEPTED" || job.status === "EN_ROUTE") && (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetJobForPart(job);
                        setPartName("");
                        setPartEstimatedCost("");
                        setPartEvidencePhoto(null);
                        setPartDescription("");
                        setPartError("");
                        setPartSuccess("");
                        setPartModalOpen(true);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ color: "#A855F7", borderColor: "rgba(168,85,247,0.4)", display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <Wrench size={14} /> Request Part
                    </button>
                  )}

                  {job.status === "ASSIGNED" || job.status === "PENDING" ? (
                    <button
                      className="btn btn-primary btn-md"
                      style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", fontWeight: 800 }}
                      onClick={() => handleAcceptJob(job.id)}
                      disabled={submitting}
                    >
                      ✅ Accept Job Dispatch
                    </button>
                  ) : job.status === "ACCEPTED" ? (
                    <button
                      className="btn btn-primary btn-md"
                      style={{ background: "#0EA5E9", fontWeight: 700 }}
                      onClick={() => handleEnRoute(job.id)}
                      disabled={submitting}
                    >
                      🛵 Mark On The Way
                    </button>
                  ) : job.status === "EN_ROUTE" ? (
                    <button
                      className="btn btn-primary btn-md"
                      style={{ background: "#8B5CF6", fontWeight: 700 }}
                      onClick={() => handleOpenJobModal(job)}
                    >
                      🛠️ Start Job & Before Photo ➔
                    </button>
                  ) : job.status === "IN_PROGRESS" ? (
                    <button
                      className="btn btn-primary btn-md"
                      style={{ background: "#10B981", fontWeight: 700 }}
                      onClick={() => handleOpenJobModal(job)}
                    >
                      🌟 Verify Completion OTP ➔
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenJobModal(job)}
                      style={{ padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Eye size={14} /> View Evidence
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
            style={{ width: "100%", maxWidth: "540px", background: "#1E293B", border: "1px solid #334155", borderRadius: 20, padding: 24, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #334155", paddingBottom: 12 }}>
              <div>
                <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Job Execution & Escrow Release</h3>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>Ref: {selectedJob.id} • Client: {selectedJob.customer}</span>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 18 }}>✕</button>
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

            {/* Accept Job State in Modal */}
            {(selectedJob.status === "ASSIGNED" || selectedJob.status === "PENDING") && (
              <div>
                <strong style={{ fontSize: 14, color: "#F59E0B", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  Job Dispatch Awaiting Your Confirmation
                </strong>
                <p style={{ fontSize: 13, color: "#CBD5E1", marginBottom: 16 }}>
                  Clicking Accept confirms you will arrive at the designated date & address with tools ready.
                </p>
                <div className="modal-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJob(null)}>Close</button>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ background: "#10B981", fontWeight: 800 }}
                    onClick={() => handleAcceptJob(selectedJob.id)}
                    disabled={submitting}
                  >
                    {submitting ? "Accepting..." : "Accept Job Dispatch ✅"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Start Job & Upload Before Photo */}
            {(selectedJob.status === "ACCEPTED" || selectedJob.status === "EN_ROUTE") && (
              <div>
                <strong style={{ fontSize: 13, color: "#0EA5E9", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Step 1: Capture / Upload Before-Job Photo Evidence
                </strong>
                <p style={{ fontSize: 13, color: "#CBD5E1", marginBottom: 16 }}>
                  Take or upload a photo of the client site before commencing work to protect your rating and verify job start.
                </p>

                {beforePhotoUrl ? (
                  <div style={{
                    border: "2px solid #10B981",
                    background: "rgba(16,185,129,0.08)",
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 20,
                    textAlign: "center"
                  }}>
                    <div style={{ position: "relative", width: "100%", height: "200px", borderRadius: 10, overflow: "hidden", marginBottom: 12, border: "1px solid rgba(16,185,129,0.3)" }}>
                      <img
                        src={beforePhotoUrl}
                        alt="Before Job Photo Evidence"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "#10B981", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle size={16} /> Before Photo Attached & Stored
                      </span>
                      <button
                        type="button"
                        onClick={() => beforeFileInputRef.current?.click()}
                        className="btn btn-secondary btn-xs"
                        disabled={uploadingBefore}
                        style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <RotateCcw size={12} /> Retake / Change Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => beforeFileInputRef.current?.click()}
                    style={{
                      border: "2px dashed rgba(14, 165, 233, 0.5)",
                      background: "rgba(15, 23, 42, 0.8)",
                      padding: 28,
                      borderRadius: 14,
                      textAlign: "center",
                      cursor: "pointer",
                      marginBottom: 20,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {uploadingBefore ? (
                      <div>
                        <Loader2 size={36} color="#0EA5E9" className="animate-spin" style={{ marginBottom: 10, animation: "spin 1s linear infinite" }} />
                        <strong style={{ display: "block", color: "#0EA5E9", fontSize: 14 }}>
                          {uploadProgress || "Uploading before photo..."}
                        </strong>
                      </div>
                    ) : (
                      <div>
                        <Camera size={36} color="#0EA5E9" style={{ marginBottom: 10 }} />
                        <strong style={{ display: "block", color: "#F8FAFC", fontSize: 14, marginBottom: 4 }}>
                          📸 Tap to Capture or Select Before-Job Photo
                        </strong>
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>
                          Opens camera on mobile or file browser (JPG, PNG, WEBP)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="modal-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJob(null)}>Cancel</button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!beforePhotoUrl || uploadingBefore || submitting}
                    onClick={() => handleStartJob(selectedJob.id)}
                    style={{ background: "#0EA5E9", fontWeight: 700 }}
                  >
                    {submitting ? "Starting..." : "Start Job & Begin Work ➔"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Complete Job & Verify Customer OTP */}
            {(selectedJob.status === "IN_PROGRESS" || selectedJob.status === "COMPLETED") && (
              <div>
                <strong style={{ fontSize: 13, color: "#10B981", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Step 2: Upload After-Job Photo & Verify Customer Completion OTP
                </strong>
                <p style={{ fontSize: 13, color: "#CBD5E1", marginBottom: 14 }}>
                  Provide clear evidence of completed work to satisfy client verification and unlock immediate escrow payout.
                </p>

                {/* Display Before Photo for Reference if present */}
                {beforePhotoUrl && (
                  <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(15, 23, 42, 0.6)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>📷 Before-Job Photo:</span>
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(beforePhotoUrl)}
                      style={{ background: "none", border: "none", color: "#38BDF8", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                    >
                      View Before Photo
                    </button>
                  </div>
                )}

                {/* After Photo Upload Box */}
                {afterPhotoUrl ? (
                  <div style={{
                    border: "2px solid #10B981",
                    background: "rgba(16,185,129,0.08)",
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 16,
                    textAlign: "center"
                  }}>
                    <div style={{ position: "relative", width: "100%", height: "200px", borderRadius: 10, overflow: "hidden", marginBottom: 12, border: "1px solid rgba(16,185,129,0.3)" }}>
                      <img
                        src={afterPhotoUrl}
                        alt="After Job Proof"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "#10B981", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle size={16} /> After Photo Attached & Stored
                      </span>
                      {selectedJob.status !== "COMPLETED" && (
                        <button
                          type="button"
                          onClick={() => afterFileInputRef.current?.click()}
                          className="btn btn-secondary btn-xs"
                          disabled={uploadingAfter}
                          style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <RotateCcw size={12} /> Retake / Change Photo
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => afterFileInputRef.current?.click()}
                    style={{
                      border: "2px dashed rgba(16, 185, 129, 0.5)",
                      background: "rgba(15, 23, 42, 0.8)",
                      padding: 24,
                      borderRadius: 14,
                      textAlign: "center",
                      cursor: "pointer",
                      marginBottom: 16,
                    }}
                  >
                    {uploadingAfter ? (
                      <div>
                        <Loader2 size={32} color="#10B981" className="animate-spin" style={{ marginBottom: 8, animation: "spin 1s linear infinite" }} />
                        <strong style={{ display: "block", color: "#10B981", fontSize: 14 }}>
                          {uploadProgress || "Uploading after photo..."}
                        </strong>
                      </div>
                    ) : (
                      <div>
                        <Camera size={32} color="#10B981" style={{ marginBottom: 8 }} />
                        <strong style={{ display: "block", color: "#F8FAFC", fontSize: 14, marginBottom: 4 }}>
                          📸 Tap to Capture or Select After-Job Proof Photo
                        </strong>
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>
                          Clear picture showing completed installation or repair
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {selectedJob.status === "IN_PROGRESS" && (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        Enter 4-Digit Customer Completion OTP Code
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Enter 4-digit OTP"
                        value={inputOtp}
                        onChange={(e) => setInputOtp(e.target.value)}
                        style={{
                          width: "100%",
                          background: "#0F172A",
                          border: "1.5px solid #334155",
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 22,
                          fontWeight: "bold",
                          letterSpacing: 6,
                          textAlign: "center",
                          color: "#10B981",
                        }}
                      />
                      <span style={{ fontSize: 11, color: "#94A3B8", display: "block", marginTop: 6 }}>
                        Ask customer for the 4-digit code displayed on their HandyHub booking tracking screen.
                      </span>
                    </div>

                    <div className="modal-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJob(null)}>Cancel</button>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={submitting || !afterPhotoUrl || !inputOtp.trim() || uploadingAfter}
                        onClick={() => handleCompleteJobWithOtp(selectedJob.id)}
                        style={{ background: "#10B981", fontWeight: 800 }}
                      >
                        {submitting ? "Verifying..." : "Verify OTP & Release Escrow Payout ✅"}
                      </button>
                    </div>
                  </>
                )}

                {selectedJob.status === "COMPLETED" && (
                  <div style={{ textAlign: "center", marginTop: 16 }}>
                    <span className="badge" style={{ background: "rgba(16,185,129,0.2)", color: "#10B981", padding: "8px 16px", fontSize: 13, fontWeight: 700 }}>
                      ✓ Job Verified & Escrow Released
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Request Replacement Part */}
      {partModalOpen && targetJobForPart && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => !submittingPart && setPartModalOpen(false)}
        >
          <div
            style={{
              background: "#0F172A",
              borderRadius: 16,
              border: "1.5px solid #8B5CF6",
              padding: 24,
              maxWidth: 550,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              color: "#F8FAFC",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="h4" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#C084FC" }}>
                <Wrench size={22} color="#A855F7" /> Request Replacement Component
              </h3>
              <button
                onClick={() => setPartModalOpen(false)}
                disabled={submittingPart}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Zero Cash Safety Alert for Artisan */}
            <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <span style={{ fontSize: "12px", color: "#A7F3D0", lineHeight: 1.5 }}>
                ⚡ <strong>Direct Supplier Settlement (Zero-Cash):</strong> Do NOT collect cash from the customer. Once approved, payment is disbursed directly to our partner supplier from HandyHub's Dedicated Procurement Account, issuing you a <strong>single-use pickup voucher</strong> for instant collection.
              </span>
            </div>

            <form onSubmit={handleSubmitPartRequest}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                  Replacement Part Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1.5HP AC Compressor Capacitor, 32A Breaker, Gate Valve 3/4"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  required
                  style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F8FAFC", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={partCategory}
                    onChange={(e) => setPartCategory(e.target.value)}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F8FAFC", fontSize: "13px" }}
                  >
                    <option value="GENERAL">General Hardware</option>
                    <option value="HVAC">HVAC & AC Parts</option>
                    <option value="ELECTRICAL">Electrical & Power</option>
                    <option value="PLUMBING">Plumbing & Drainage</option>
                    <option value="CARPENTRY">Carpentry & Locks</option>
                    <option value="APPLIANCE">Appliance Components</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={partQuantity}
                    onChange={(e) => setPartQuantity(parseInt(e.target.value) || 1)}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F8FAFC", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Estimated Cost (₦) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 18,500"
                    value={partEstimatedCost}
                    onChange={(e) => setPartEstimatedCost(e.target.value)}
                    required
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#10B981", fontWeight: 700, fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Diagnosis Reason *
                  </label>
                  <select
                    value={partReason}
                    onChange={(e) => setPartReason(e.target.value)}
                    style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F8FAFC", fontSize: "13px" }}
                  >
                    <option value="BURNT_OUT">Burnt Out / Short-Circuited</option>
                    <option value="CORRODED_LEAKING">Corroded / Leaking</option>
                    <option value="MECHANICAL_WEAR">Mechanical Wear & Tear</option>
                    <option value="MISSING">Missing Component</option>
                    <option value="INCOMPATIBLE">Incompatible Specification</option>
                    <option value="UPGRADE_REQUIRED">Safety Upgrade Required</option>
                    <option value="OTHER">Other Technical Reason</option>
                  </select>
                </div>
              </div>

              {/* Photo Evidence Upload */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                  Photo of Damaged Component (Mandatory Evidence)
                </label>
                {partEvidencePhoto ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#1E293B", padding: 10, borderRadius: 8 }}>
                    <img src={partEvidencePhoto} alt="Damaged Part Preview" style={{ width: 60, height: 60, borderRadius: 6, objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "12px", color: "#10B981", display: "block", fontWeight: 600 }}>✓ Evidence Photo Uploaded</span>
                      <button
                        type="button"
                        onClick={() => evidenceFileInputRef.current?.click()}
                        style={{ background: "none", border: "none", color: "#38BDF8", fontSize: "11px", cursor: "pointer", padding: 0 }}
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => evidenceFileInputRef.current?.click()}
                    style={{
                      border: "2px dashed #475569",
                      padding: 16,
                      borderRadius: 8,
                      textAlign: "center",
                      cursor: "pointer",
                      background: "rgba(30, 41, 59, 0.5)",
                    }}
                  >
                    {uploadingEvidence ? (
                      <Loader2 size={24} color="#8B5CF6" className="animate-spin" style={{ margin: "0 auto 6px" }} />
                    ) : (
                      <Camera size={24} color="#8B5CF6" style={{ margin: "0 auto 6px" }} />
                    )}
                    <strong style={{ fontSize: "12px", color: "#F8FAFC", display: "block" }}>
                      {uploadingEvidence ? "Uploading photo..." : "📸 Tap to Snap or Select Photo of Damaged Part"}
                    </strong>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                  Additional Diagnosis Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide technical diagnosis for client explanation..."
                  value={partDescription}
                  onChange={(e) => setPartDescription(e.target.value)}
                  style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F8FAFC", fontSize: "12px" }}
                />
              </div>

              {partError && (
                <div style={{ background: "rgba(239,68,68,0.2)", color: "#EF4444", padding: 10, borderRadius: 8, fontSize: "12px", marginBottom: 14, border: "1px solid #EF4444" }}>
                  {partError}
                </div>
              )}
              {partSuccess && (
                <div style={{ background: "rgba(16,185,129,0.2)", color: "#10B981", padding: 10, borderRadius: 8, fontSize: "12px", marginBottom: 14, border: "1px solid #10B981" }}>
                  {partSuccess}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setPartModalOpen(false)} disabled={submittingPart} className="btn btn-secondary btn-md">
                  Cancel
                </button>
                <button type="submit" disabled={submittingPart || uploadingEvidence} className="btn btn-primary btn-md" style={{ background: "#8B5CF6", borderColor: "#8B5CF6" }}>
                  {submittingPart ? "Submitting & Alerting Client..." : "Submit Part Request ➔"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm Installation & Upload Receipt */}
      {installModalOpen && selectedPartForInstall && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => !submittingInstall && setInstallModalOpen(false)}
        >
          <div
            style={{
              background: "#0F172A",
              borderRadius: 16,
              border: "1.5px solid #10B981",
              padding: 24,
              maxWidth: 550,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              color: "#F8FAFC",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="h4" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#10B981" }}>
                <CheckCircle2 size={22} color="#10B981" /> Verify Part Installation
              </h3>
              <button
                onClick={() => setInstallModalOpen(false)}
                disabled={submittingInstall}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Voucher Card details */}
            <div style={{ background: "rgba(14,165,233,0.1)", border: "1px dashed #0EA5E9", borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <strong style={{ fontSize: "14px" }}>{selectedPartForInstall.partName}</strong>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#10B981" }}>
                  ₦{Number(selectedPartForInstall.approvedCost || selectedPartForInstall.estimatedCost).toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#38BDF8", fontFamily: "monospace", marginTop: 4 }}>
                Voucher Code: <strong>{selectedPartForInstall.voucherCode}</strong>
              </div>
              <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: 2 }}>
                Supplier: {selectedPartForInstall.supplier?.name || "Verified Partner Hub"} ({selectedPartForInstall.supplier?.address || "Abuja"})
              </div>
            </div>

            <form onSubmit={handleSubmitInstall}>
              {/* Photo 1: Merchant Receipt Photo */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                  1. Merchant Invoice / Receipt Photo (Duplicate Checked)
                </label>
                {receiptPhotoUrl ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#1E293B", padding: 10, borderRadius: 8 }}>
                    <img src={receiptPhotoUrl} alt="Receipt Preview" style={{ width: 60, height: 60, borderRadius: 6, objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "12px", color: "#10B981", display: "block", fontWeight: 600 }}>✓ Receipt Photo Attached</span>
                      <button
                        type="button"
                        onClick={() => receiptFileInputRef.current?.click()}
                        style={{ background: "none", border: "none", color: "#38BDF8", fontSize: "11px", cursor: "pointer", padding: 0 }}
                      >
                        Change Receipt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => receiptFileInputRef.current?.click()}
                    style={{
                      border: "2px dashed #475569",
                      padding: 14,
                      borderRadius: 8,
                      textAlign: "center",
                      cursor: "pointer",
                      background: "rgba(30, 41, 59, 0.5)",
                    }}
                  >
                    {uploadingReceipt ? (
                      <Loader2 size={22} color="#0EA5E9" className="animate-spin" style={{ margin: "0 auto 4px" }} />
                    ) : (
                      <Camera size={22} color="#0EA5E9" style={{ margin: "0 auto 4px" }} />
                    )}
                    <strong style={{ fontSize: "12px", color: "#F8FAFC", display: "block" }}>
                      {uploadingReceipt ? "Uploading receipt..." : "📸 Tap to Upload Merchant Receipt / Invoice"}
                    </strong>
                  </div>
                )}
              </div>

              {/* Photo 2: Newly Installed Part Photo */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                  2. Photo of Newly Installed Component *
                </label>
                {installedPhotoUrl ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#1E293B", padding: 10, borderRadius: 8 }}>
                    <img src={installedPhotoUrl} alt="Installed Part Preview" style={{ width: 60, height: 60, borderRadius: 6, objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "12px", color: "#10B981", display: "block", fontWeight: 600 }}>✓ Installed Photo Attached</span>
                      <button
                        type="button"
                        onClick={() => installedFileInputRef.current?.click()}
                        style={{ background: "none", border: "none", color: "#38BDF8", fontSize: "11px", cursor: "pointer", padding: 0 }}
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => installedFileInputRef.current?.click()}
                    style={{
                      border: "2px dashed #10B981",
                      padding: 14,
                      borderRadius: 8,
                      textAlign: "center",
                      cursor: "pointer",
                      background: "rgba(16, 185, 129, 0.08)",
                    }}
                  >
                    {uploadingInstalled ? (
                      <Loader2 size={22} color="#10B981" className="animate-spin" style={{ margin: "0 auto 4px" }} />
                    ) : (
                      <Camera size={22} color="#10B981" style={{ margin: "0 auto 4px" }} />
                    )}
                    <strong style={{ fontSize: "12px", color: "#F8FAFC", display: "block" }}>
                      {uploadingInstalled ? "Uploading photo..." : "📸 Tap to Capture Installed Part in Place"}
                    </strong>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 6 }}>
                  Installation Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Component fitted and tested with client..."
                  value={installNotes}
                  onChange={(e) => setInstallNotes(e.target.value)}
                  style={{ width: "100%", padding: 10, background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F8FAFC", fontSize: "12px" }}
                />
              </div>

              {installError && (
                <div style={{ background: "rgba(239,68,68,0.2)", color: "#EF4444", padding: 10, borderRadius: 8, fontSize: "12px", marginBottom: 14, border: "1px solid #EF4444" }}>
                  {installError}
                </div>
              )}
              {installSuccess && (
                <div style={{ background: "rgba(16,185,129,0.2)", color: "#10B981", padding: 10, borderRadius: 8, fontSize: "12px", marginBottom: 14, border: "1px solid #10B981" }}>
                  {installSuccess}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setInstallModalOpen(false)} disabled={submittingInstall} className="btn btn-secondary btn-md">
                  Cancel
                </button>
                <button type="submit" disabled={submittingInstall || !installedPhotoUrl} className="btn btn-primary btn-md" style={{ background: "#10B981", borderColor: "#10B981" }}>
                  {submittingInstall ? "Verifying & Saving..." : "Confirm Part Installed ✅"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {previewModalUrl && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setPreviewModalUrl(null)}
        >
          <div style={{ maxWidth: "800px", maxHeight: "85vh", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={previewModalUrl}
              alt="Execution Evidence Preview"
              style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: 12, border: "2px solid #334155" }}
            />
            <button
              onClick={() => setPreviewModalUrl(null)}
              style={{
                position: "absolute",
                top: -12,
                right: -12,
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </ProLayoutShell>
  );
}

