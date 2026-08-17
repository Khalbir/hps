"use client";

import React, { useState } from "react";
import { Lock, ShieldAlert, Upload, CheckCircle2, ArrowRight, X, AlertTriangle, FileText, Clock } from "lucide-react";
import { TrustBadge } from "@/components/common/TrustBadge";

interface BookingRiskGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  categorySlug: string;
  userEmail?: string;
  currentStatus?: string;
  onVerificationSubmitted?: () => void;
}

export function BookingRiskGateModal({
  isOpen,
  onClose,
  serviceName,
  categorySlug,
  userEmail,
  currentStatus = "NOT_SUBMITTED",
  onVerificationSubmitted,
}: BookingRiskGateModalProps) {
  const [streetAddress, setStreetAddress] = useState("");
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const isPending = currentStatus === "PENDING" || submittedSuccess;

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setProofUrl(data.url);
      } else {
        alert(data.error || "Failed to upload document.");
      }
    } catch (err) {
      alert("Failed to upload proof document.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetAddress.trim()) return alert("Please enter your permanent address.");
    if (!proofUrl) return alert("Please upload your address proof document.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          permanentAddress: streetAddress.trim(),
          permanentAddressProof: proofUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmittedSuccess(true);
        if (onVerificationSubmitted) onVerificationSubmitted();
      } else {
        alert(data.error || "Failed to submit verification.");
      }
    } catch (err) {
      alert("Submission error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "28px",
          position: "relative",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            color: "#94A3B8",
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ padding: "10px", background: "rgba(239,68,68,0.15)", borderRadius: "12px", color: "#EF4444" }}>
            <Lock size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#F8FAFC" }}>
              High-Risk Technical Service Gating
            </h3>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Service: <strong>{serviceName}</strong></span>
          </div>
        </div>

        {isPending ? (
          <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid #F59E0B", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
            <Clock size={36} color="#F59E0B" style={{ marginBottom: "12px" }} />
            <h4 style={{ margin: "0 0 8px 0", color: "#F8FAFC", fontSize: "16px" }}>
              Verification Pending Admin Audit ⏳
            </h4>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#CBD5E1", lineHeight: 1.5 }}>
              Your address document has been uploaded and submitted to HandyHub Compliance. Because <strong>{serviceName}</strong> involves high-voltage / high-risk work, confirmation will complete automatically as soon as compliance approves your document (&lt; 24 hrs).
            </p>
            <button className="btn btn-primary btn-sm" onClick={onClose} style={{ background: "#F59E0B", border: "none" }}>
              Got It • Continue Browsing
            </button>
          </div>
        ) : (
          <>
            <div style={{ background: "#0F172A", borderLeft: "4px solid #EF4444", padding: "14px", borderRadius: "8px", marginBottom: "20px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#CBD5E1", lineHeight: 1.5 }}>
                <strong>Why is verification required?</strong> <em>{serviceName}</em> is classified as a <strong>High-Risk Service</strong>. For client safety, artisan liability, and insurance compliance, permanent home address verification is mandatory before high-risk technical dispatch.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Permanent Residence Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12 Aminu Kano Crescent, Maitama, Abuja"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", padding: "10px", borderRadius: "8px", color: "#F8FAFC", fontSize: "13px", outline: "none" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Upload Address Proof (Utility Bill / Tenancy / Deed)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  style={{ color: "#94A3B8", fontSize: "13px" }}
                />
                {uploading && <span style={{ fontSize: "12px", color: "#0EA5E9", marginLeft: "8px" }}>Uploading document... ⏳</span>}
                {proofUrl && <div style={{ marginTop: "4px", color: "#10B981", fontSize: "12px" }}>✓ Proof document attached</div>}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !streetAddress || !proofUrl}>
                  {submitting ? "Submitting..." : "Submit Proof & Verify"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
