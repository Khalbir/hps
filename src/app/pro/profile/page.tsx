"use client";

import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { User, ShieldCheck, Award, Star, MapPin, Camera, FileText } from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProProfilePage() {
  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 className="h2">Public Profile & Verification Badge</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
          Preview how your professional profile appears to customers during service booking.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--space-6)" }}>
        {/* Profile Card */}
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg, #0EA5E9, #8B5CF6)", color: "white", fontSize: "32px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
            BO
          </div>
          <h2 className="h3" style={{ margin: "0 0 4px" }}>Blessing O.</h2>
          <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", marginBottom: "var(--space-4)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ShieldCheck size={14} /> HandyHub Verified Pro
          </span>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", margin: 0 }}>
            Specialty: <strong>Deep Cleaning & Sanitization</strong>
          </p>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", marginTop: 4 }}>
            Location: <strong>Wuse 2 & Maitama, Abuja</strong>
          </p>
        </div>

        {/* Credentials Breakdown */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: "var(--space-4)" }}>Verified Qualifications</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
              <ShieldCheck size={20} color="#10B981" />
              <div>
                <strong style={{ display: "block", fontSize: "var(--fs-sm)" }}>Government Identity & NIN Audit</strong>
                <span style={{ fontSize: "var(--fs-xs)", color: "#10B981" }}>Passed (NIN: 89201948201)</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
              <Award size={20} color="#8B5CF6" />
              <div>
                <strong style={{ display: "block", fontSize: "var(--fs-sm)" }}>Trade Certificate & Skill Quiz</strong>
                <span style={{ fontSize: "var(--fs-xs)", color: "#8B5CF6" }}>Score: 100% (Passed Technical Test)</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
              <FileText size={20} color="#F59E0B" />
              <div>
                <strong style={{ display: "block", fontSize: "var(--fs-sm)" }}>Guarantor References</strong>
                <span style={{ fontSize: "var(--fs-xs)", color: "#F59E0B" }}>2 Referees Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProLayoutShell>
  );
}
