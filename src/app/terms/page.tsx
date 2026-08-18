"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, FileText, CheckCircle2, AlertTriangle, Scale, Lock, Download, ChevronRight, UserCheck } from "lucide-react";

export default function TermsPage() {
  const [accepted, setAccepted] = useState(false);

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "var(--space-12) 0" }}>
      <div className="container" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(14,165,233,0.12)", color: "#0EA5E9", padding: "6px 16px", borderRadius: 99, fontSize: "13px", fontWeight: 700, marginBottom: "var(--space-3)" }}>
            <Scale size={16} /> Federal Republic of Nigeria Legal Framework
          </div>
          <h1 className="h1" style={{ marginBottom: "var(--space-3)", color: "#F8FAFC" }}>
            Terms of Service & Operational Agreements
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "16px", maxWidth: "700px", margin: "0 auto" }}>
            Legally binding agreements governing Platform usage, Client-Professional contracts, escrow management, data protection, and dispute resolution pursuant to Nigerian laws.
          </p>
          <span style={{ fontSize: "12px", color: "#64748B", marginTop: "8px", display: "block" }}>
            Effective Date: August 9, 2026 | Document Version: 2.0 (NDPA 2023 & FCCPA 2018 Compliant)
          </span>
        </div>

        {/* Quick Nav Bar */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: "var(--space-8)", background: "#1E293B", padding: "12px", borderRadius: "14px", border: "1px solid #334155" }}>
          {[
            { label: "Master Terms", href: "#master-tos" },
            { label: "Client Agreement", href: "#client-agreement" },
            { label: "Artisan Agreement", href: "#artisan-agreement" },
            { label: "Dispute Resolution", href: "#dispute-resolution" },
            { label: "Independent Contractor Policy", href: "#contractor-policy" },
            { label: "Liability & Indemnity", href: "#liability-indemnity" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                fontSize: "13px",
                color: "#F8FAFC",
                background: "#0F172A",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #334155",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {item.label} <ChevronRight size={14} color="#0EA5E9" />
            </a>
          ))}
        </div>

        {/* Important Notice Callout */}
        <div style={{ background: "rgba(14,165,233,0.08)", border: "1px solid #0EA5E9", borderRadius: "16px", padding: "20px", marginBottom: "var(--space-8)" }}>
          <h3 style={{ margin: "0 0 8px 0", color: "#38BDF8", fontSize: "16px", display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <ShieldCheck size={20} color="#0EA5E9" /> Technology Marketplace Designation
          </h3>
          <p style={{ margin: 0, color: "#CBD5E1", fontSize: "14px", lineHeight: 1.6 }}>
            HandyHub Pro Solutions Limited is a software technology platform connecting clients with independent service professionals. Service Professionals are independent contractors, not employees or agents of HandyHub. The contract for physical work performance is formed directly between the Client and the Professional. HandyHub provides escrow protection, identity verification, and dispute resolution.
          </p>
        </div>

        {/* SECTION 1: MASTER TERMS OF SERVICE */}
        <section id="master-tos" className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "32px", borderRadius: "20px", marginBottom: "var(--space-8)" }}>
          <h2 className="h3" style={{ color: "#F8FAFC", marginBottom: "16px", display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={24} color="#0EA5E9" /> 1. Master Terms of Service (ToS)
          </h2>
          
          <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "14px" }}>
            <h4 style={{ color: "#F8FAFC", margin: "10px 0 0 0", fontSize: "15px" }}>1.1 Acceptance & Electronic Signature (Evidence Act 2011)</h4>
            <p>
              By accessing the HandyHub Pro application, registering an account, or requesting services, you agree to these Master Terms. Pursuant to <strong>Section 84 of the Evidence Act 2011</strong>, electronic acceptance (including clicking &quot;I Agree&quot;, checking an agreement box, or submitting an electronic booking) shall constitute a valid, enforceable signature under Nigerian Law.
            </p>

            <h4 style={{ color: "#F8FAFC", margin: "10px 0 0 0", fontSize: "15px" }}>1.2 Account Eligibility & Verification</h4>
            <p>
              Users must be at least 18 years of age. All Service Professionals undergo mandatory identity verification (NIN validation, BVN verification, and trade background checks) prior to platform activation.
            </p>

            <h4 style={{ color: "#F8FAFC", margin: "10px 0 0 0", fontSize: "15px" }}>1.3 Account Security</h4>
            <p>
              You are responsible for maintaining the confidentiality of your credentials. Any activity originating from your registered account is deemed authorized by you.
            </p>
          </div>
        </section>

        {/* SECTION 2: CLIENT SERVICE AGREEMENT */}
        <section id="client-agreement" className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "32px", borderRadius: "20px", marginBottom: "var(--space-8)" }}>
          <h2 className="h3" style={{ color: "#F8FAFC", marginBottom: "16px", display: "flex", alignItems: "center", gap: 10 }}>
            <UserCheck size={24} color="#10B981" /> 2. Client Service Agreement
          </h2>
          
          <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "14px" }}>
            <h4 style={{ color: "#F8FAFC", margin: "10px 0 0 0", fontSize: "15px" }}>2.1 Direct Client-Professional Contract</h4>
            <p>
              When a Client confirms a booking, a direct contract for services is formed between the Client and the assigned Professional. HandyHub administers escrow payments, holds funds securely during job execution, and facilitates dispute resolution.
            </p>

            <h4 style={{ color: "#F8FAFC", margin: "10px 0 0 0", fontSize: "15px" }}>2.2 Escrow & Payment Terms</h4>
            <p>
              Clients pay booking amounts into HandyHub&apos;s regulated escrow account via CBN-licensed payment gateways (Paystack / Flutterwave). HandyHub charges <strong>0% commission on Client wallet top-ups</strong> (100% of the deposited amount is credited directly to the client&apos;s available escrow wallet with zero fee deductions). Escrow funds are disbursed to the Professional upon Client job completion approval or expiry of the 48-hour inspection window.
            </p>

            <h4 style={{ color: "#F8FAFC", margin: "10px 0 0 0", fontSize: "15px" }}>2.3 Premises Safety & Utilities</h4>
            <p>
              Clients must provide safe site access, necessary utilities (water, electricity), and disclose pre-existing premises hazards prior to work commencement.
            </p>
          </div>
        </section>

        {/* SECTION 3: ARTISAN SERVICE AGREEMENT */}
        <section id="artisan-agreement" className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "32px", borderRadius: "20px", marginBottom: "var(--space-8)" }}>
          <h2 className="h3" style={{ color: "#F8FAFC", marginBottom: "16px", display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldCheck size={24} color="#F59E0B" /> 3. Professional & Artisan Service Agreement
          </h2>
          
          <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "14px" }}>
            <h4 style={{ color: "#F8FAFC", margin: "10px 0 0 0", fontSize: "15px" }}>3.1 Technical Competence & Standards</h4>
            <p>
              Service Professionals warrant possession of valid technical skills, trade tools, and compliance with Nigerian building and electrical standards (NEMSA, COREN).
            </p>

            <h4 style={{ color: "#F8FAFC", margin: "10px 0 0 0", fontSize: "15px" }}>3.2 Platform Commission & Payouts</h4>
            <p>
              HandyHub retains a 20% platform service commission for marketplace lead generation, insurance pool administration, and escrow security. Net payouts (80%) are remitted automatically to the Professional&apos;s registered bank account upon job clearance.
            </p>

            <h4 style={{ color: "#F8FAFC", margin: "10px 0 0 0", fontSize: "15px" }}>3.3 14-Day Re-Work Warranty</h4>
            <p>
              Professionals guarantee workmanship for 14 calendar days post-completion. If defective workmanship is verified within this window, the Professional agrees to perform corrective work at zero additional labor cost.
            </p>

            <h4 style={{ color: "#F8FAFC", margin: "10px 0 0 0", fontSize: "15px" }}>3.4 Anti-Circumvention Rule</h4>
            <p>
              Direct off-platform cash transactions with Clients introduced through HandyHub are strictly prohibited. Off-platform solicitation results in permanent deactivation and liquidated damages of ₦250,000.
            </p>
          </div>
        </section>

        {/* SECTION 4: DISPUTE RESOLUTION (AMA 2023) */}
        <section id="dispute-resolution" className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "32px", borderRadius: "20px", marginBottom: "var(--space-8)" }}>
          <h2 className="h3" style={{ color: "#F8FAFC", marginBottom: "16px", display: "flex", alignItems: "center", gap: 10 }}>
            <Scale size={24} color="#C084FC" /> 4. Dispute Resolution & Escrow Policy (AMA 2023)
          </h2>
          
          <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "14px" }}>
            <p>
              Disputes are governed by the <strong>Arbitration and Mediation Act 2023 (AMA 2023)</strong> under a 3-tier escalation protocol:
            </p>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong>Tier 1 (Platform Conciliation):</strong> 48-hour escrow freeze; In-App Resolution Desk mediates settlement.</li>
              <li><strong>Tier 2 (Neutral Quality Inspection):</strong> Physical audit conducted by a Senior QA Inspector whose report informs final escrow release.</li>
              <li><strong>Tier 3 (Binding Arbitration):</strong> Final escalation referred to a sole arbitrator appointed under CiArb Nigeria rules in Abuja FCT.</li>
            </ul>
          </div>
        </section>

        {/* SECTION 5: INDEPENDENT CONTRACTOR POLICY */}
        <section id="contractor-policy" className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "32px", borderRadius: "20px", marginBottom: "var(--space-8)" }}>
          <h2 className="h3" style={{ color: "#F8FAFC", marginBottom: "16px", display: "flex", alignItems: "center", gap: 10 }}>
            <Lock size={24} color="#EC4899" /> 5. Independent Contractor Policy (Labour Act LFN 2004)
          </h2>
          
          <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "14px" }}>
            <p>
              Pursuant to the <strong>Labour Act Cap L1 LFN 2004</strong>, Service Professionals are self-employed independent contractors. No employment, partnership, or agency relationship is created. Professionals are not eligible for employee pension (PRA 2014), NHIA health insurance, or severance pay. Professionals retain complete schedule autonomy and are responsible for personal tax filings (FIRS/SIRS).
            </p>
          </div>
        </section>

        {/* SECTION 6: LIMITATION OF LIABILITY & INDEMNITY */}
        <section id="liability-indemnity" className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "32px", borderRadius: "20px", marginBottom: "var(--space-8)" }}>
          <h2 className="h3" style={{ color: "#F8FAFC", marginBottom: "16px", display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={24} color="#EF4444" /> 6. Balanced Limitation of Liability & Indemnity (FCCPA 2018)
          </h2>
          
          <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "14px" }}>
            <p>
              In compliance with the <strong>Federal Competition and Consumer Protection Act 2018 (FCCPA 2018)</strong>, HandyHub does not disclaim zero liability. Responsibility is allocated fairly:
            </p>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong>HandyHub Commitments:</strong> HandyHub assumes direct responsibility for identity verification diligence, escrow fund security, and platform software uptime.</li>
              <li><strong>Financial Cap:</strong> HandyHub&apos;s aggregate liability is strictly capped at the platform commission earned from the transaction or <strong>₦100,000</strong> (whichever is lower).</li>
              <li><strong>Professional Responsibility:</strong> The Professional assumes direct liability for physical property damage, personal injury, or gross negligence on site.</li>
            </ul>
          </div>
        </section>

        {/* SECTION 7: PROMINENT OFF-PLATFORM TRANSACTIONS & USER RESPONSIBILITY POLICY */}
        <section id="off-platform-policy" className="card" style={{ background: "#1E293B", border: "2px solid #F59E0B", padding: "32px", borderRadius: "20px", marginBottom: "var(--space-8)" }}>
          <h2 className="h3" style={{ color: "#F59E0B", marginBottom: "16px", display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={24} color="#F59E0B" /> 7. Prominent Off-Platform Transactions & User Responsibility Policy
          </h2>
          
          <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid #F59E0B", padding: "16px", borderRadius: "12px", color: "#F8FAFC", fontWeight: 700 }}>
              ⚠️ MANDATORY PROTECTION BOUNDARY: HandyHub protections, escrow security, 14-day workmanship warranties, dispute conciliation under AMA 2023, and customer support apply ONLY AND EXCLUSIVELY to bookings and payments conducted entirely ON-PLATFORM.
            </div>

            <p>
              If a Client or Service Professional engages in, solicits, or accepts any off-platform cash payment, private negotiation, or direct transaction outside the HandyHub software:
            </p>
            
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong>Total Assumption of Risk:</strong> Users assume ALL physical, financial, personal safety, legal, and operational risks associated with off-platform transactions.</li>
              <li><strong>Complete Exclusion of Support:</strong> HandyHub provides <strong>ZERO dispute resolution, ZERO mediation, ZERO refunds, ZERO warranty enforcement, and ZERO customer support</strong> for off-platform transactions.</li>
              <li><strong>Anti-Circumvention Penalties:</strong> Professionals soliciting off-platform cash payments face immediate permanent account termination, forfeiture of pending escrow payouts, and liquidated damages of <strong>₦250,000</strong> under Nigerian Law. Clients soliciting off-platform arrangements face immediate account termination and permanent blacklisting.</li>
            </ul>
          </div>
        </section>

        {/* Electronic Acceptance Confirmation Widget */}
        <div style={{ background: "#0F172A", border: "1px solid #10B981", padding: "24px", borderRadius: "16px", textAlign: "center" }}>
          <h3 style={{ margin: "0 0 8px 0", color: "#F8FAFC", fontSize: "16px", fontWeight: 700 }}>
            Electronic Acceptance Acknowledgment
          </h3>
          <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "16px" }}>
            By checking the box below and continuing to use HandyHub Pro, you acknowledge having read, understood, and agreed to all legal framework documents and the mandatory Off-Platform Transaction Policy above.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <input
              type="checkbox"
              id="legalAcceptance"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#10B981" }}
            />
            <label htmlFor="legalAcceptance" style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
              I agree to the Terms of Service, NDPA Privacy Policy, Escrow Rules & Off-Platform Responsibility Policy.
            </label>
          </div>

          {accepted && (
            <div style={{ marginTop: "12px", color: "#10B981", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <CheckCircle2 size={16} /> Electronic Consent Logged (Sec 84 Evidence Act 2011)
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
