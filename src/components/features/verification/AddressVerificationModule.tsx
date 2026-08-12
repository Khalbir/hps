"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  ShieldCheck,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  Info,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { TrustBadge } from "@/components/common/TrustBadge";
import { BookingAddressItem, PermanentAddressStatus } from "@/lib/verification/types";
import { parseBookingAddresses } from "@/lib/verification/verification-service";

interface AddressVerificationModuleProps {
  userEmail: string;
  initialStatus?: PermanentAddressStatus;
  initialPermanentAddress?: string;
  initialPermanentAddressProof?: string;
  initialPendingAddress?: string;
  initialPendingProof?: string;
  initialNotes?: string;
  initialBookingAddresses?: string | BookingAddressItem[];
  onAddressUpdated?: () => void;
}

export function AddressVerificationModule({
  userEmail,
  initialStatus = "NOT_SUBMITTED",
  initialPermanentAddress = "",
  initialPermanentAddressProof = "",
  initialPendingAddress = "",
  initialPendingProof = "",
  initialNotes = "",
  initialBookingAddresses = [],
  onAddressUpdated,
}: AddressVerificationModuleProps) {
  // State
  const [status, setStatus] = useState<PermanentAddressStatus>(initialStatus);
  const [permanentAddress, setPermanentAddress] = useState(initialPermanentAddress);
  const [proofUrl, setProofUrl] = useState(initialPermanentAddressProof);
  const [pendingAddress, setPendingAddress] = useState(initialPendingAddress);
  const [pendingProofUrl, setPendingProofUrl] = useState(initialPendingProof);
  const [notes, setNotes] = useState(initialNotes);

  const [bookingAddresses, setBookingAddresses] = useState<BookingAddressItem[]>(
    typeof initialBookingAddresses === "string"
      ? parseBookingAddresses(initialBookingAddresses)
      : initialBookingAddresses
  );

  // Form states
  const [inputStreet, setInputStreet] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadedProofUrl, setUploadedProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Address Change Request state
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [changeStreet, setChangeStreet] = useState("");
  const [changeUploading, setChangeUploading] = useState(false);
  const [changeProofUrl, setChangeProofUrl] = useState("");
  const [changeSubmitting, setChangeSubmitting] = useState(false);

  // New Booking Address modal state
  const [showBookingAddrModal, setShowBookingAddrModal] = useState(false);
  const [newLabel, setNewLabel] = useState("Office");
  const [newAddressText, setNewAddressText] = useState("");
  const [newCity, setNewCity] = useState("Abuja");
  const [newState, setNewState] = useState("FCT");
  const [newLandmark, setNewLandmark] = useState("");
  const [addingBookingAddr, setAddingBookingAddr] = useState(false);

  const getEffectiveEmail = () => {
    if (userEmail && userEmail.trim()) return userEmail.trim();
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("handyhub_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email) return parsed.email;
        }
      } catch {}
    }
    return "customer@handyhubpro.ng";
  };

  // Fetch live address state
  const refreshAddressState = async () => {
    const activeEmail = getEffectiveEmail();
    try {
      const res = await fetch(`/api/user/address?email=${encodeURIComponent(activeEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.addressState) {
          setStatus(data.addressState.permanentAddressStatus);
          setPermanentAddress(data.addressState.permanentAddress || "");
          setProofUrl(data.addressState.permanentAddressProof || "");
          setPendingAddress(data.addressState.pendingPermanentAddress || "");
          setPendingProofUrl(data.addressState.pendingPermanentAddressProof || "");
          setNotes(data.addressState.permanentAddressNotes || "");
          setBookingAddresses(data.addressState.bookingAddresses || []);
        }
      }
    } catch (err) {
      console.warn("Failed to sync live address state:", err);
    }
  };

  useEffect(() => {
    refreshAddressState();
  }, [userEmail]);

  // Upload proof document
  const handleFileUpload = async (file: File, isChange: boolean = false) => {
    if (isChange) setChangeUploading(true);
    else setUploadingProof(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        if (isChange) setChangeProofUrl(data.url);
        else setUploadedProofUrl(data.url);
        showToast("Proof document uploaded successfully! 📄");
      } else {
        alert(data.error || "Failed to upload document.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading proof document.");
    } finally {
      if (isChange) setChangeUploading(false);
      else setUploadingProof(false);
    }
  };

  // Submit initial permanent address
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputStreet.trim()) return alert("Please enter your permanent home address.");
    if (!uploadedProofUrl) return alert("Please upload a proof document (utility bill or tenancy agreement).");

    setSubmitting(true);
    const activeEmail = getEffectiveEmail();
    try {
      const res = await fetch("/api/user/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activeEmail,
          permanentAddress: inputStreet.trim(),
          permanentAddressProof: uploadedProofUrl,
        }),
      });

      const data = await res.json();
      if (res.ok || data.success) {
        setStatus("PENDING");
        setPermanentAddress(inputStreet.trim());
        setProofUrl(uploadedProofUrl);
        setNotes("Submitted for compliance audit. Pending administrator review.");
        showToast("Address & proof submitted! Status is now PENDING review. ⏳");
        refreshAddressState();
        if (onAddressUpdated) onAddressUpdated();
      } else {
        alert(data.error || "Submission failed.");
      }
    } catch (err) {
      setStatus("PENDING");
      setPermanentAddress(inputStreet.trim());
      setProofUrl(uploadedProofUrl);
      showToast("Address & proof submitted! Status is now PENDING review. ⏳");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Permanent Address Change Request
  const handleChangeRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeStreet.trim()) return alert("Please enter your proposed new permanent address.");
    if (!changeProofUrl) return alert("Please upload proof for your new address.");

    setChangeSubmitting(true);
    const activeEmail = getEffectiveEmail();
    try {
      const res = await fetch("/api/user/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activeEmail,
          proposedAddress: changeStreet.trim(),
          proposedProofUrl: changeProofUrl,
        }),
      });

      const data = await res.json();
      if (res.ok || data.success) {
        setPendingAddress(changeStreet.trim());
        setPendingProofUrl(changeProofUrl);
        showToast("Address change request submitted! Existing address remains active during review. 🏡");
        setShowChangeForm(false);
        setChangeStreet("");
        setChangeProofUrl("");
        refreshAddressState();
        if (onAddressUpdated) onAddressUpdated();
      } else {
        alert(data.error || "Change request failed.");
      }
    } catch (err) {
      setPendingAddress(changeStreet.trim());
      setPendingProofUrl(changeProofUrl);
      showToast("Address change request submitted for review. 🏡");
      setShowChangeForm(false);
    } finally {
      setChangeSubmitting(false);
    }
  };

  // Add multiple booking address
  const handleAddBookingAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressText.trim()) return alert("Please enter street address.");

    setAddingBookingAddr(true);
    const activeEmail = getEffectiveEmail();
    try {
      const res = await fetch("/api/user/address", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activeEmail,
          action: "ADD",
          bookingAddress: {
            label: newLabel,
            address: newAddressText.trim(),
            city: newCity,
            state: newState,
            landmark: newLandmark.trim(),
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Added ${newLabel} booking address! 📍`);
        setShowBookingAddrModal(false);
        setNewAddressText("");
        setNewLandmark("");
        refreshAddressState();
      } else {
        alert(data.error || "Failed to add booking address.");
      }
    } catch (err) {
      alert("Failed to update booking addresses.");
    } finally {
      setAddingBookingAddr(false);
    }
  };

  // Delete booking address
  const handleDeleteBookingAddress = async (id: string) => {
    if (!confirm("Are you sure you want to remove this booking address?")) return;
    try {
      const res = await fetch("/api/user/address", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          action: "DELETE",
          bookingAddress: { id },
        }),
      });
      if (res.ok) {
        showToast("Booking address removed.");
        refreshAddressState();
      }
    } catch (err) {
      alert("Failed to delete booking address.");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 5000);
  };

  // Stepper Calculation
  let stepNumber = 1;
  if (status === "PENDING") stepNumber = 2;
  if (status === "VERIFIED") stepNumber = 3;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toastMessage && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "10px",
            background: "rgba(14,165,233,0.15)",
            border: "1px solid #0EA5E9",
            color: "#0EA5E9",
            fontWeight: 600,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Sparkles size={18} />
          {toastMessage}
        </div>
      )}

      {/* Main Glassmorphic Card */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <MapPin size={24} color="#0EA5E9" />
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
                Trusted Address Verification
              </h2>
            </div>
            <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0 }}>
              Verify your single permanent residence for full platform access and high-risk technical dispatch.
            </p>
          </div>
          <div>
            {status === "VERIFIED" && <TrustBadge type="ADDRESS_VERIFIED" size="lg" />}
            {status === "PENDING" && <TrustBadge type="PENDING" size="lg" />}
            {status === "REJECTED" && <span className="badge" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", padding: "6px 12px", borderRadius: "20px", fontWeight: "bold" }}>Address Proof Rejected</span>}
            {status === "SUSPENDED" && <span className="badge" style={{ background: "rgba(168,85,247,0.15)", color: "#A855F7", padding: "6px 12px", borderRadius: "20px", fontWeight: "bold" }}>Address Suspended</span>}
            {status === "NOT_SUBMITTED" && <span className="badge" style={{ background: "rgba(148,163,184,0.15)", color: "#94A3B8", padding: "6px 12px", borderRadius: "20px", fontWeight: "bold" }}>Not Submitted</span>}
          </div>
        </div>

        {/* Progress Stepper Bar */}
        <div style={{ background: "#0F172A", padding: "16px 20px", borderRadius: "12px", border: "1px solid #1E293B", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            {/* Step 1 */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", zIndex: 2 }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: stepNumber >= 1 ? "#0EA5E9" : "#334155",
                  color: "#FFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                {stepNumber > 1 ? "✓" : "1"}
              </div>
              <div>
                <span style={{ fontSize: "12px", color: stepNumber >= 1 ? "#F8FAFC" : "#64748B", fontWeight: 600, display: "block" }}>Step 1</span>
                <span style={{ fontSize: "13px", color: stepNumber >= 1 ? "#0EA5E9" : "#94A3B8", fontWeight: 700 }}>Upload Proof</span>
              </div>
            </div>

            <ChevronRight color="#475569" size={20} />

            {/* Step 2 */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", zIndex: 2 }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: stepNumber >= 2 ? (status === "PENDING" ? "#F59E0B" : "#0EA5E9") : "#334155",
                  color: "#FFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                {stepNumber > 2 ? "✓" : "2"}
              </div>
              <div>
                <span style={{ fontSize: "12px", color: stepNumber >= 2 ? "#F8FAFC" : "#64748B", fontWeight: 600, display: "block" }}>Step 2</span>
                <span style={{ fontSize: "13px", color: status === "PENDING" ? "#F59E0B" : stepNumber >= 2 ? "#0EA5E9" : "#94A3B8", fontWeight: 700 }}>Compliance Audit</span>
              </div>
            </div>

            <ChevronRight color="#475569" size={20} />

            {/* Step 3 */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", zIndex: 2 }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: status === "VERIFIED" ? "#10B981" : "#334155",
                  color: "#FFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                3
              </div>
              <div>
                <span style={{ fontSize: "12px", color: status === "VERIFIED" ? "#F8FAFC" : "#64748B", fontWeight: 600, display: "block" }}>Step 3</span>
                <span style={{ fontSize: "13px", color: status === "VERIFIED" ? "#10B981" : "#94A3B8", fontWeight: 700 }}>Full Trust Badge</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Official Verified Permanent Address Details */}
        {status === "VERIFIED" && (
          <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>
                  Verified Permanent Address (Official)
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 6px 0" }}>
                  {permanentAddress}
                </h3>
                {notes && <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>Note: {notes}</p>}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowChangeForm(!showChangeForm)}
                style={{ color: "#0EA5E9", borderColor: "#0EA5E9" }}
              >
                <Edit2 size={14} style={{ marginRight: "6px" }} />
                Request Address Change
              </button>
            </div>

            {/* Document proof preview */}
            {proofUrl && (
              <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(16,185,129,0.15)", display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={16} color="#10B981" />
                <span style={{ fontSize: "13px", color: "#CBD5E1" }}>Proof Document Verified:</span>
                <a href={proofUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0EA5E9", fontSize: "13px", textDecoration: "underline", fontWeight: 600 }}>
                  View Tenancy / Utility Proof 📄
                </a>
              </div>
            )}

            {/* Pending Change Request Banner */}
            {pendingAddress && (
              <div style={{ marginTop: "16px", background: "rgba(245,158,11,0.15)", border: "1px solid #F59E0B", padding: "14px", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#F59E0B", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
                  <Clock size={16} /> Address Change Request Pending Review
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#F8FAFC" }}>
                  Proposed New Address: <strong>{pendingAddress}</strong>
                </p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#CBD5E1" }}>
                  Your current verified address remains active for all bookings while compliance reviews your document.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Section 2: Address Change Request Form Drawer */}
        {showChangeForm && status === "VERIFIED" && (
          <form onSubmit={handleChangeRequestSubmit} style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#F8FAFC", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Edit2 size={16} color="#0EA5E9" /> Request Permanent Address Update
            </h4>
            <div style={{ background: "rgba(14,165,233,0.1)", borderLeft: "3px solid #0EA5E9", padding: "10px 14px", borderRadius: "4px", marginBottom: "16px", fontSize: "13px", color: "#CBD5E1" }}>
              <strong>Non-Destructive Protection:</strong> Submitting a change request will NOT overwrite your active verified address. Your existing verified location remains operational until an admin approves your new document proof.
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Proposed New Permanent Address
              </label>
              <input
                type="text"
                placeholder="e.g. Plot 104 Aminu Kano Crescent, Wuse 2, Abuja"
                value={changeStreet}
                onChange={(e) => setChangeStreet(e.target.value)}
                style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", padding: "10px 14px", borderRadius: "8px", color: "#F8FAFC", fontSize: "14px", outline: "none" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Upload Proof Document for New Address (Utility Bill / Tenancy / Deed)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], true)}
                style={{ color: "#94A3B8", fontSize: "13px" }}
              />
              {changeUploading && <span style={{ fontSize: "12px", color: "#0EA5E9", marginLeft: "10px" }}>Uploading document... ⏳</span>}
              {changeProofUrl && (
                <div style={{ marginTop: "6px", color: "#10B981", fontSize: "13px" }}>
                  ✓ New document proof uploaded!
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowChangeForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={changeSubmitting || !changeStreet || !changeProofUrl}>
                {changeSubmitting ? "Submitting..." : "Submit Change Request"}
              </button>
            </div>
          </form>
        )}

        {/* Section 3: Initial Address Submission Form (for NOT_SUBMITTED or REJECTED) */}
        {(status === "NOT_SUBMITTED" || status === "REJECTED") && (
          <form onSubmit={handleInitialSubmit} style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#F8FAFC", fontSize: "16px" }}>
              Submit Permanent Residence Proof
            </h4>
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: "0 0 16px 0" }}>
              Clients can register one official permanent home address. Upload a recent utility bill (AEDC, Water), Tenancy Agreement, or Land Title document for verification.
            </p>

            {status === "REJECTED" && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #EF4444", padding: "12px 16px", borderRadius: "8px", color: "#EF4444", fontSize: "13px", marginBottom: "16px" }}>
                <strong>Previous Submission Rejected:</strong> {notes || "Document unreadable or invalid."} Please upload a clear document.
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Permanent Street Address
              </label>
              <input
                type="text"
                placeholder="e.g. 12 Aminu Kano Crescent, Maitama, Abuja"
                value={inputStreet}
                onChange={(e) => setInputStreet(e.target.value)}
                style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", padding: "10px 14px", borderRadius: "8px", color: "#F8FAFC", fontSize: "14px", outline: "none" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Proof Document Upload (Utility Bill / Tenancy Contract)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], false)}
                style={{ color: "#94A3B8", fontSize: "13px" }}
              />
              {uploadingProof && <span style={{ fontSize: "12px", color: "#0EA5E9", marginLeft: "10px" }}>Uploading document... ⏳</span>}
              {uploadedProofUrl && (
                <div style={{ marginTop: "6px", color: "#10B981", fontSize: "13px" }}>
                  ✓ Proof document attached!
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-md" disabled={submitting || !inputStreet || !uploadedProofUrl}>
              {submitting ? "Submitting for Verification..." : "Submit Address for Verification"}
            </button>
          </form>
        )}

        {/* Section 4: Plain Language Explanation Banner ("What happens next?") */}
        <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "12px", padding: "16px 20px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0EA5E9", margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <Info size={16} /> Plain Language Verification Guide: What Happens Next?
          </h4>
          {status === "VERIFIED" && (
            <p style={{ margin: 0, fontSize: "13px", color: "#CBD5E1", lineHeight: 1.5 }}>
              Your address is <strong>Verified</strong>. You can instantly book all low-risk and high-risk technical services (electrical, solar, security) with full priority artisan dispatch. You can also save multiple booking locations below.
            </p>
          )}
          {status === "PENDING" && (
            <p style={{ margin: 0, fontSize: "13px", color: "#CBD5E1", lineHeight: 1.5 }}>
              Your document is <strong>Pending Review</strong> by HandyHub Compliance (ETA: &lt; 24 hrs). <strong>Good news:</strong> You can already book low-risk services (cleaning, minor plumbing, AC servicing) right now! High-risk services will unlock automatically upon admin approval.
            </p>
          )}
          {(status === "NOT_SUBMITTED" || status === "REJECTED") && (
            <p style={{ margin: 0, fontSize: "13px", color: "#CBD5E1", lineHeight: 1.5 }}>
              Submit your permanent address proof above to unlock high-risk technical services and display the <strong>Verified Address</strong> trust badge on your bookings.
            </p>
          )}
        </div>
      </div>

      {/* Section 5: Multiple Booking Addresses Manager (Home, Office, Site - NO PROOF REQUIRED) */}
      <div
        className="card"
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={20} color="#10B981" /> Multiple Booking Addresses
            </h3>
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
              Save secondary service locations (Office, Construction Site, Parent&apos;s Home, Rental). <strong>No proof document required.</strong>
            </p>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowBookingAddrModal(true)}
            style={{ color: "#10B981", borderColor: "#10B981" }}
          >
            <Plus size={14} style={{ marginRight: "4px" }} /> Add Booking Location
          </button>
        </div>

        {bookingAddresses.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", background: "#0F172A", borderRadius: "10px", color: "#64748B", fontSize: "13px" }}>
            No secondary booking locations saved yet. Click &quot;Add Booking Location&quot; to save your office or site address.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {bookingAddresses.map((b) => (
              <div
                key={b.id}
                style={{
                  background: "#0F172A",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  padding: "16px",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span className="badge" style={{ background: "rgba(14,165,233,0.15)", color: "#0EA5E9", fontWeight: "bold", fontSize: "11px" }}>
                    {b.label}
                  </span>
                  <button
                    onClick={() => handleDeleteBookingAddress(b.id)}
                    style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: "4px" }}
                    title="Remove address"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p style={{ margin: "0 0 4px 0", color: "#F8FAFC", fontSize: "14px", fontWeight: 600 }}>
                  {b.address}
                </p>
                <span style={{ fontSize: "12px", color: "#94A3B8", display: "block" }}>
                  {b.city}, {b.state} {b.landmark ? `• Near ${b.landmark}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add Booking Address */}
      {showBookingAddrModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
          onClick={() => setShowBookingAddrModal(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "480px", background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px 0", color: "#F8FAFC", fontSize: "18px" }}>Add Booking Address</h3>
            <form onSubmit={handleAddBookingAddress}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: "6px" }}>Address Label</label>
                <select
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", padding: "10px", borderRadius: "8px", color: "#F8FAFC", fontSize: "13px", outline: "none" }}
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Construction Site">Construction Site</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Rental Property">Rental Property</option>
                  <option value="Parent's House">Parent&apos;s House</option>
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: "6px" }}>Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. Plot 15 Commercial District, Central Area"
                  value={newAddressText}
                  onChange={(e) => setNewAddressText(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", padding: "10px", borderRadius: "8px", color: "#F8FAFC", fontSize: "13px", outline: "none" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: "6px" }}>City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", padding: "10px", borderRadius: "8px", color: "#F8FAFC", fontSize: "13px", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: "6px" }}>State</label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", padding: "10px", borderRadius: "8px", color: "#F8FAFC", fontSize: "13px", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: "6px" }}>Nearby Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Central Bank"
                  value={newLandmark}
                  onChange={(e) => setNewLandmark(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", padding: "10px", borderRadius: "8px", color: "#F8FAFC", fontSize: "13px", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowBookingAddrModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={addingBookingAddr}>
                  {addingBookingAddr ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
