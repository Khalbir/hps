"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { User, ShieldCheck, Award, Star, MapPin, Camera, FileText, RefreshCw, AlertCircle, Copy, Check, Fingerprint, BadgeCheck } from "lucide-react";
import { optimizeDocumentFile } from "@/lib/image-compression";
import styles from "../dashboard/dashboard.module.css";

export default function ProProfilePage() {
  const [profile, setProfile] = useState<any>({
    fullName: "Artisan Partner",
    initials: "AP",
    digitalId: "HHP-PRO-84920",
    specialty: "Service Specialist",
    location: "Abuja, Nigeria",
    verificationStatus: "PENDING",
    ninStatus: "Not Verified",
    tradeQuizStatus: "Pending Audit",
    guarantorStatus: "Pending Audit",
  });
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");

  const fetchRealProfile = async () => {
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
      } catch (err) {}
    }

    try {
      const res = await fetch(`/api/pro/dashboard?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok) {
        const fullName = data.proName || "Artisan Partner";
        const parts = fullName.split(" ");
        const initials = parts.length >= 2 ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase() : fullName.substring(0, 2).toUpperCase();

        const isVerified = data.verificationStatus === "VERIFIED";
        const isCustomer = data.role === "CUSTOMER" || data.isProfessional === false;

        setProfile({
          fullName,
          initials,
          avatar: data.avatar || null,
          isCustomer,
          digitalId: data.digitalId || "HHP-PRO-84920",
          rating: data.rating || 5.0,
          totalReviews: data.totalReviews || 0,
          totalJobs: data.completedJobs || 0,
          reviews: data.reviews || [],
          specialty: isCustomer ? "HandyHub Customer Account" : (data.specialty || data.serviceCategory || (data.skills && data.skills.length > 0 ? data.skills.join(", ") : "General Skilled Services")),
          location: data.operatingState || data.location || data.city || "Abuja (FCT), Nigeria",
          verificationStatus: isCustomer ? "CUSTOMER" : data.verificationStatus,
          ninStatus: isVerified ? "Government NIN Identity Verified ✅" : "NIN Document Pending Audit",
          tradeQuizStatus: isVerified ? "Trade Test Passed (100%) ✅" : "Trade Audit Pending Review",
          guarantorStatus: isVerified ? "2 Guarantors Approved ✅" : "Guarantors Pending Verification",
          tradeVerifications: data.tradeVerifications || [],
        });
      }
    } catch (err) {
      console.warn("Failed to fetch real pro profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setAvatarMsg("");

    try {
      // Auto-compress and optimize image before upload
      const { file: optimizedFile } = await optimizeDocumentFile(file);

      const formData = new FormData();
      formData.append("file", optimizedFile);
      formData.append("folder", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.url) {
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: data.url }),
        });

        setProfile((prev: any) => ({ ...prev, avatar: data.url }));
        setAvatarMsg("Profile picture updated & optimized! ✅");
      } else {
        setAvatarMsg(data.error || "Upload failed. Please try a smaller image.");
      }
    } catch (err: any) {
      setAvatarMsg(err.message || "Upload error. Please check your connection.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    fetchRealProfile();
  }, []);

  const isVerified = profile.verificationStatus === "VERIFIED";
  const isCustomer = profile.isCustomer;

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.85rem)", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
            Public Profile & Verification Badge
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 0" }}>
            Preview how your professional profile appears to customers during service booking.
          </p>
        </div>
        <button onClick={fetchRealProfile} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refresh Profile
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        {/* Profile Card */}
        <div className="card" style={{ textAlign: "center" }}>
          {/* Avatar Container with Upload overlay */}
          <div style={{ position: "relative", width: 104, height: 104, margin: "0 auto var(--space-4)" }}>
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.fullName}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "3px solid #0EA5E9" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: isCustomer ? "linear-gradient(135deg, #0284C7, #2563EB)" : "linear-gradient(135deg, #0EA5E9, #8B5CF6)", color: "white", fontSize: "32px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #0EA5E9" }}>
                {profile.initials}
              </div>
            )}

            {!isCustomer && (
              <label
                htmlFor="pro-avatar-input"
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  background: "#0EA5E9",
                  color: "white",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
                title="Upload Profile Picture"
              >
                <Camera size={16} />
              </label>
            )}
            <input
              id="pro-avatar-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
          </div>

          {uploadingAvatar && (
            <span style={{ fontSize: "11px", color: "#0EA5E9", display: "block", marginBottom: 8 }}>
              Uploading avatar...
            </span>
          )}
          {avatarMsg && (
            <span style={{ fontSize: "11px", color: "#10B981", display: "block", marginBottom: 8, fontWeight: "bold" }}>
              {avatarMsg}
            </span>
          )}

          <h2 className="h3" style={{ margin: "0 0 4px" }}>{profile.fullName}</h2>
          
          {isCustomer ? (
            <span
              className="badge"
              style={{
                background: "rgba(2,132,199,0.15)",
                color: "#0284C7",
                marginBottom: "var(--space-4)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 700,
              }}
            >
              <User size={14} /> Registered Customer Account
            </span>
          ) : (
            <span
              className="badge"
              style={{
                background: isVerified ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                color: isVerified ? "#10B981" : "#F59E0B",
                marginBottom: "var(--space-4)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={14} /> {isVerified ? "HandyHub Verified Pro" : "Verification Audit Pending"}
            </span>
          )}

          {!isCustomer && (
            <>
              {/* Official Digital ID Badge */}
              <div style={{
                margin: "12px 0 16px",
                padding: "12px 14px",
                background: "linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)",
                border: "1.5px solid rgba(14, 165, 233, 0.4)",
                borderRadius: "14px",
                textAlign: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                  <Fingerprint size={16} color="#0EA5E9" />
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0EA5E9" }}>
                    Verified Digital ID
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontFamily: "monospace",
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#F8FAFC",
                    background: "#0F172A",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(14, 165, 233, 0.3)",
                    letterSpacing: "0.06em",
                  }}>
                    {profile.digitalId}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(profile.digitalId);
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 2000);
                      }
                    }}
                    className="btn btn-secondary btn-xs"
                    style={{ padding: "4px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: 4 }}
                    title="Copy Official Digital ID"
                  >
                    {copiedId ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                    {copiedId ? "Copied!" : "Copy"}
                  </button>
                </div>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                  🛡️ Official Security Token • Client Verification Protected
                </span>
              </div>

              {/* Star Rating Widget */}
              <div style={{ margin: "0 0 16px", padding: "12px", background: "var(--bg-tertiary)", borderRadius: "12px", border: "1px solid var(--border-primary)" }}>
                <div style={{ display: "inline-flex", gap: 3, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      fill={s <= Math.round(Number(profile.rating) || 5) ? "#F59E0B" : "transparent"}
                      color={s <= Math.round(Number(profile.rating) || 5) ? "#F59E0B" : "rgba(245,158,11,0.3)"}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#F59E0B", display: "block" }}>
                  {Number(profile.rating || 5.0).toFixed(1)}★ Overall Star Rating
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {profile.totalReviews > 0 ? `${profile.totalReviews} verified client reviews • ${profile.totalJobs} completed jobs` : "5.0 initial verified rating"}
                </span>
              </div>
            </>
          )}

          <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", margin: "0 0 8px 0" }}>
            Account Type: <strong style={{ color: "var(--color-primary, #0284C7)", fontWeight: 700 }}>{profile.specialty}</strong>
          </p>
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <MapPin size={16} color="#0284C7" />
            <span>Location: <strong style={{ color: "var(--text-primary, #0F172A)", fontWeight: 700 }}>{profile.location}</strong></span>
          </p>
        </div>

        {/* Credentials Breakdown / Customer Notice */}
        {isCustomer ? (
          <div className="card" style={{ padding: "28px" }}>
            <h3 className="h4" style={{ marginBottom: "12px", color: "var(--text-primary)" }}>Customer Account Information</h3>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
              <strong>{profile.fullName}</strong> is registered as a valued <strong>Customer</strong> on HandyHub. To book artisans, track active service orders, or fund your customer wallet, visit your Customer Dashboard.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn btn-primary btn-sm" style={{ background: "#0284C7", fontWeight: 700, textDecoration: "none" }}>
                ➔ Open Customer Dashboard & Bookings
              </Link>
              <Link href="/pro/verification" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                🛠️ Apply for HandyHub Pro Verification
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            {/* Official Digital Identity Card */}
            <div className="card" style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)",
              border: "1.5px solid rgba(14, 165, 233, 0.4)",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <BadgeCheck size={20} color="#0EA5E9" />
                    <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Official Professional Digital ID</h3>
                  </div>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                    HandyHub National Artisan & Contractor Verification Registry
                  </span>
                </div>
                <span className="badge" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10B981", fontWeight: 700, border: "1px solid rgba(16, 185, 129, 0.4)" }}>
                  ● Active & Validated
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 16 }}>
                <div style={{ padding: "12px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Digital ID</span>
                  <strong style={{ fontSize: "15px", fontFamily: "monospace", color: "#38BDF8" }}>{profile.digitalId}</strong>
                </div>
                <div style={{ padding: "12px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Accredited Skill</span>
                  <strong style={{ fontSize: "13px", color: "#F8FAFC" }}>{profile.specialty}</strong>
                </div>
                <div style={{ padding: "12px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Identity Status</span>
                  <strong style={{ fontSize: "13px", color: isVerified ? "#10B981" : "#F59E0B" }}>
                    {isVerified ? "Govt NIN Verified" : "Audit In Progress"}
                  </strong>
                </div>
                <div style={{ padding: "12px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Operating State</span>
                  <strong style={{ fontSize: "13px", color: "#F8FAFC" }}>{profile.location}</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, flexWrap: "wrap", gap: 10 }}>
                <span style={{ fontSize: "11px", color: "#64748B" }}>
                  🔒 Authenticated by HandyHub Pro Trust & Safety Engine
                </span>
                <Link
                  href="/pro/verification"
                  className="btn btn-secondary btn-xs"
                  style={{ fontSize: "11px", textDecoration: "none" }}
                >
                  View Verification Dossier ➔
                </Link>
              </div>
            </div>

            {/* Multi-Skilled Trade Verifications Card */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                <div>
                  <h3 className="h4" style={{ margin: 0 }}>Registered Trade Skills & Credentials</h3>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Each trade is independently audited and verified for client job matching.
                  </span>
                </div>
                <Link
                  href="/pro/verification"
                  className="btn btn-secondary btn-xs"
                  style={{ fontSize: "11.5px", fontWeight: 700, textDecoration: "none" }}
                >
                  + Add / Verify Profession
                </Link>
              </div>

              {(!profile.tradeVerifications || profile.tradeVerifications.length === 0) ? (
                <div style={{ padding: "14px", background: "var(--bg-tertiary)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <strong style={{ fontSize: "13.5px", color: "var(--text-primary)", display: "block" }}>
                      {profile.specialty} (Primary Profession)
                    </strong>
                    <span style={{ fontSize: "12px", color: isVerified ? "#10B981" : "#F59E0B" }}>
                      {isVerified ? "✓ Verified & Dispatched" : "⏳ Verification In Progress"}
                    </span>
                  </div>
                  <span className="badge" style={{ background: isVerified ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: isVerified ? "#10B981" : "#F59E0B" }}>
                    {isVerified ? "VERIFIED" : "PENDING"}
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {profile.tradeVerifications.map((tv: any) => {
                    const isTvVerified = tv.status === "VERIFIED";
                    const isTvPending = tv.status === "PENDING";
                    const isTvRejected = tv.status === "REJECTED";
                    const badgeColor = isTvVerified ? "#10B981" : isTvPending ? "#F59E0B" : isTvRejected ? "#EF4444" : "#94A3B8";
                    const badgeBg = isTvVerified ? "rgba(16,185,129,0.12)" : isTvPending ? "rgba(245,158,11,0.12)" : isTvRejected ? "rgba(239,68,68,0.12)" : "rgba(148,163,184,0.12)";

                    return (
                      <div
                        key={tv.id || tv.tradeCategory}
                        style={{
                          padding: "14px 16px",
                          background: "var(--bg-tertiary)",
                          border: `1px solid ${isTvVerified ? "rgba(16,185,129,0.3)" : "var(--border-primary)"}`,
                          borderRadius: "10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: "8px",
                            background: badgeBg,
                            color: badgeColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "14px",
                          }}>
                            {isTvVerified ? "✓" : "⚙️"}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <strong style={{ fontSize: "13.5px", color: "var(--text-primary)" }}>
                                {tv.tradeName || tv.tradeCategory}
                              </strong>
                              {tv.isPrimary && (
                                <span style={{ fontSize: "10px", background: "rgba(14,165,233,0.15)", color: "#0EA5E9", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                                  PRIMARY
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                              {isTvVerified ? "Accredited for live dispatches" : isTvPending ? "Credentials submitted & under compliance audit" : "Dossier required for job eligibility"}
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}40`,
                            padding: "4px 10px",
                            borderRadius: "99px",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {tv.status || "PENDING"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="h4" style={{ marginBottom: "var(--space-4)" }}>Verified Qualifications</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
                  <ShieldCheck size={20} color={isVerified ? "#10B981" : "#F59E0B"} />
                  <div>
                    <strong style={{ fontSize: "var(--fs-sm)", display: "block" }}>Government Identity & NIN Audit</strong>
                    <span style={{ fontSize: "var(--fs-xs)", color: isVerified ? "#10B981" : "#F59E0B" }}>{profile.ninStatus}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
                  <Award size={20} color={isVerified ? "#10B981" : "#F59E0B"} />
                  <div>
                    <strong style={{ fontSize: "var(--fs-sm)", display: "block" }}>Trade Certificate & Skill Quiz</strong>
                    <span style={{ fontSize: "var(--fs-xs)", color: isVerified ? "#10B981" : "#F59E0B" }}>{profile.tradeQuizStatus}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
                  <FileText size={20} color={isVerified ? "#10B981" : "#F59E0B"} />
                  <div>
                    <strong style={{ fontSize: "var(--fs-sm)", display: "block" }}>Guarantor References</strong>
                    <span style={{ fontSize: "var(--fs-xs)", color: isVerified ? "#10B981" : "#F59E0B" }}>{profile.guarantorStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Reviews Feed on Profile */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                <h3 className="h4" style={{ margin: 0 }}>Client Feedback & Reviews</h3>
                <span style={{ fontSize: "12px", color: "#F59E0B", fontWeight: 700 }}>
                  {profile.reviews?.length || 0} Reviews
                </span>
              </div>

              {!profile.reviews || profile.reviews.length === 0 ? (
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", textAlign: "center", padding: "16px" }}>
                  No customer reviews received yet. Clean and punctual job execution will earn you top 5-star ratings!
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {profile.reviews.map((r: any) => (
                    <div key={r.id} style={{ padding: "12px", background: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <strong style={{ fontSize: "13px" }}>{r.clientName}</strong>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Star size={12} fill="#F59E0B" color="#F59E0B" />
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#F59E0B" }}>{r.rating}.0★</span>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                        "{r.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProLayoutShell>
  );
}
