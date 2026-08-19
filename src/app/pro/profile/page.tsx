"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { User, ShieldCheck, Award, Star, MapPin, Camera, FileText, RefreshCw, AlertCircle } from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProProfilePage() {
  const [profile, setProfile] = useState<any>({
    fullName: "Artisan Partner",
    initials: "AP",
    specialty: "Service Specialist",
    location: "Abuja, Nigeria",
    verificationStatus: "PENDING",
    ninStatus: "Not Verified",
    tradeQuizStatus: "Pending Audit",
    guarantorStatus: "Pending Audit",
  });
  const [loading, setLoading] = useState(true);

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

        setProfile({
          fullName,
          initials,
          specialty: data.specialty || data.serviceCategory || (data.skills && data.skills.length > 0 ? data.skills.join(", ") : "General Skilled Services"),
          location: data.operatingState || data.location || data.city || "Abuja (FCT), Nigeria",
          verificationStatus: data.verificationStatus,
          ninStatus: isVerified ? "Government NIN Identity Verified ✅" : "NIN Document Pending Audit",
          tradeQuizStatus: isVerified ? "Trade Test Passed (100%) ✅" : "Trade Audit Pending Review",
          guarantorStatus: isVerified ? "2 Guarantors Approved ✅" : "Guarantors Pending Verification",
        });
      }
    } catch (err) {
      console.warn("Failed to fetch real pro profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealProfile();
  }, []);

  const isVerified = profile.verificationStatus === "VERIFIED";

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="h2">Public Profile & Verification Badge</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
            Preview how your professional profile appears to customers during service booking.
          </p>
        </div>
        <button onClick={fetchRealProfile} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refresh Profile
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--space-6)" }}>
        {/* Profile Card */}
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg, #0EA5E9, #8B5CF6)", color: "white", fontSize: "32px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
            {profile.initials}
          </div>
          <h2 className="h3" style={{ margin: "0 0 4px" }}>{profile.fullName}</h2>
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
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", margin: "0 0 8px 0" }}>
            Specialty: <strong style={{ color: "var(--color-primary, #0284C7)", fontWeight: 700 }}>{profile.specialty}</strong>
          </p>
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <MapPin size={16} color="#0284C7" />
            <span>Location: <strong style={{ color: "var(--text-primary, #0F172A)", fontWeight: 700 }}>{profile.location}</strong></span>
          </p>
        </div>

        {/* Credentials Breakdown */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: "var(--space-4)" }}>Verified Qualifications</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
              <ShieldCheck size={20} color={isVerified ? "#10B981" : "#F59E0B"} />
              <div>
                <strong style={{ display: "block", fontSize: "var(--fs-sm)" }}>Government Identity & NIN Audit</strong>
                <span style={{ fontSize: "var(--fs-xs)", color: isVerified ? "#10B981" : "#F59E0B" }}>{profile.ninStatus}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
              <Award size={20} color={isVerified ? "#8B5CF6" : "#F59E0B"} />
              <div>
                <strong style={{ display: "block", fontSize: "var(--fs-sm)" }}>Trade Certificate & Skill Quiz</strong>
                <span style={{ fontSize: "var(--fs-xs)", color: isVerified ? "#8B5CF6" : "#F59E0B" }}>{profile.tradeQuizStatus}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
              <FileText size={20} color={isVerified ? "#10B981" : "#F59E0B"} />
              <div>
                <strong style={{ display: "block", fontSize: "var(--fs-sm)" }}>Guarantor References</strong>
                <span style={{ fontSize: "var(--fs-xs)", color: isVerified ? "#10B981" : "#F59E0B" }}>{profile.guarantorStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProLayoutShell>
  );
}
