"use client";

import Link from "next/link";
import { Lock, ShieldCheck, FileCheck, Eye, Database, Server, UserCheck, Mail, ArrowRight } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "var(--space-12) 0" }}>
      <div className="container" style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.12)", color: "#10B981", padding: "6px 16px", borderRadius: 99, fontSize: "13px", fontWeight: 700, marginBottom: "var(--space-3)" }}>
            <ShieldCheck size={16} /> NDPA 2023 Compliant Policy
          </div>
          <h1 className="h1" style={{ marginBottom: "var(--space-3)", color: "#F8FAFC" }}>
            Nigeria Data Protection Policy
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "16px", maxWidth: "650px", margin: "0 auto" }}>
            How HandyHub Pro Solutions Limited collects, processes, protects, and respects your personal data under the Nigeria Data Protection Act 2023 (NDPA).
          </p>
          <span style={{ fontSize: "12px", color: "#64748B", marginTop: "8px", display: "block" }}>
            Last Updated: August 9, 2026 | Compliant with Nigeria Data Protection Commission (NDPC) Guidelines
          </span>
        </div>

        {/* Overview Box */}
        <div style={{ background: "#1E293B", border: "1px solid #10B981", borderRadius: "16px", padding: "24px", marginBottom: "var(--space-8)" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#F8FAFC", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={18} color="#10B981" /> Data Protection Declaration
          </h3>
          <p style={{ margin: 0, color: "#CBD5E1", fontSize: "14px", lineHeight: 1.6 }}>
            HandyHub Pro Solutions Limited (&quot;HandyHub&quot;, &quot;We&quot;, &quot;Us&quot;) is committed to maintaining the privacy, confidentiality, and security of all personal data provided by Clients, Service Professionals, and Platform Visitors. We strictly adhere to data protection principles set out under Section 24 of the Nigeria Data Protection Act 2023.
          </p>
        </div>

        {/* Content Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Section 1 */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#38BDF8", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Database size={18} color="#0EA5E9" /> 1. Personal Data We Collect
            </h3>
            <ul style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong>User Account Information:</strong> Full name, phone number, email address, physical booking address, landmark description.</li>
              <li><strong>Professional Identity Verification:</strong> National Identification Number (NIN), Bank Verification Number (BVN validation), government-issued ID documents, trade certifications, and passport photographs.</li>
              <li><strong>Financial & Payment Data:</strong> Bank account details for payouts, tokenized transaction references processed securely under PCI-DSS Level 1 compliance via Paystack / Flutterwave.</li>
              <li><strong>Geolocation & Technical Data:</strong> Precise GPS location coordinates (when active on duty or booking), IP address, device telemetry, browser type.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#F59E0B", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <FileCheck size={18} color="#F59E0B" /> 2. Lawful Bases for Data Processing
            </h3>
            <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "10px" }}>
              <p>Under Section 25 of the NDPA 2023, we process your personal data on the following grounds:</p>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li><strong>Contractual Necessity:</strong> To connect Clients with Professionals, facilitate escrow payments, and fulfill home service dispatches.</li>
                <li><strong>Legal Obligation:</strong> To comply with Central Bank of Nigeria (CBN) Anti-Money Laundering (AML) & Know-Your-Customer (KYC) regulations.</li>
                <li><strong>Legitimate Interest:</strong> To maintain platform security, prevent fraud, and conduct quality assurance audits.</li>
                <li><strong>Explicit Consent:</strong> For push notifications, marketing updates, and geolocation tracking.</li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#C084FC", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <UserCheck size={18} color="#C084FC" /> 3. Data Subject Rights (NDPA 2023)
            </h3>
            <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "10px" }}>
              <p>As a Data Subject under Nigerian law, you possess the right to:</p>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li><strong>Right of Access & Portability:</strong> Request a copy of your personal data stored on our platform.</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete account records.</li>
                <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your data (subject to statutory financial retention mandates).</li>
                <li><strong>Right to Object & Withdraw Consent:</strong> Opt out of non-essential data processing or marketing updates at any time.</li>
              </ul>
            </div>
          </div>

          {/* Section 4 */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#EC4899", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Server size={18} color="#EC4899" /> 4. Third-Party Data Processors & Security
            </h3>
            <p style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
              We do not sell, rent, or trade personal data to third parties. Data is shared strictly with trusted, audited processors necessary for platform functionality, including Paystack (Payment Gateway), Supabase (Encrypted Database Storage), and Twilio/SMS Gateways (OTP Verification). Data is encrypted in transit via TLS 1.3 and at rest via AES-256 encryption.
            </p>
          </div>

          {/* DPO Contact Box */}
          <div style={{ background: "#0F172A", border: "1px solid #0EA5E9", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#F8FAFC", fontSize: "16px", fontWeight: 700 }}>
              Data Protection Officer (DPO) Contact
            </h4>
            <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "16px" }}>
              For data access requests, privacy inquiries, or NDPC regulatory correspondence:
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1E293B", padding: "10px 20px", borderRadius: "10px", border: "1px solid #334155" }}>
              <Mail size={16} color="#0EA5E9" />
              <span style={{ color: "#F8FAFC", fontWeight: 700, fontSize: "14px" }}>dpo@handyhubpro.ng</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
