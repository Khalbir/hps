"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, FileText, Scale, UserCheck, Lock, AlertTriangle,
  RefreshCw, CheckCircle2, Download, ExternalLink, ChevronRight, BookOpen
} from "lucide-react";

const LEGAL_SECTIONS = [
  { id: "tos", title: "Master Terms of Service", icon: FileText, color: "#0EA5E9" },
  { id: "client", title: "Client Service Agreement", icon: UserCheck, color: "#10B981" },
  { id: "artisan", title: "Artisan Service Agreement", icon: ShieldCheck, color: "#F59E0B" },
  { id: "ndpa", title: "Privacy Policy (NDPA 2023)", icon: Lock, color: "#8B5CF6" },
  { id: "refund", title: "Cancellation & Refund Policy", icon: RefreshCw, color: "#06B6D4" },
  { id: "dispute", title: "Dispute Resolution (AMA 2023)", icon: Scale, color: "#C084FC" },
  { id: "contractor", title: "Independent Contractor Policy", icon: AlertTriangle, color: "#EC4899" },
];

export default function LegalHubPage() {
  const [activeTab, setActiveTab] = useState("tos");

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "var(--space-12) 0" }}>
      <div className="container" style={{ maxWidth: "1050px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(14,165,233,0.12)", color: "#0EA5E9", padding: "6px 16px", borderRadius: 99, fontSize: "13px", fontWeight: 700, marginBottom: "var(--space-3)" }}>
            <Scale size={16} /> Regulatory & Compliance Center
          </div>
          <h1 className="h1" style={{ marginBottom: "var(--space-3)", color: "#F8FAFC" }}>
            HandyHub Pro Legal Framework & Governance
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "16px", maxWidth: "750px", margin: "0 auto" }}>
            Comprehensive production-ready legal agreements, NDPA data protection policies, escrow regulations, and contractor classification frameworks under Nigerian Law.
          </p>
          <span style={{ fontSize: "12px", color: "#64748B", marginTop: "8px", display: "block" }}>
            Federal Republic of Nigeria | Jurisdiction: Federal High Court & FCT High Court Abuja
          </span>
        </div>

        {/* Legal Tabs Header */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "var(--space-8)", background: "#1E293B", padding: "10px", borderRadius: "16px", border: "1px solid #334155" }}>
          {LEGAL_SECTIONS.map((sec) => {
            const IconComp = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor: isActive ? sec.color : "#334155",
                  background: isActive ? `${sec.color}20` : "#0F172A",
                  color: isActive ? sec.color : "#94A3B8",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <IconComp size={16} /> {sec.title}
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "36px", borderRadius: "20px", marginBottom: "var(--space-8)" }}>
          
          {/* TAB 1: MASTER TOS */}
          {activeTab === "tos" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <FileText size={26} color="#0EA5E9" />
                <div>
                  <h2 className="h3" style={{ margin: 0, color: "#F8FAFC" }}>Master Terms of Service (ToS)</h2>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>Section 84 Evidence Act 2011 Compliant Electronic Contract</span>
                </div>
              </div>

              <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "16px" }}>
                <p>
                  <strong>1. Technology Platform Provider:</strong> HandyHub Pro Solutions Limited (&quot;HandyHub&quot;) is a digital software platform providing online marketplace and escrow technology. HandyHub does not provide direct handyman services, facility maintenance labor, or employ artisans.
                </p>
                <p>
                  <strong>2. Electronic Agreement:</strong> By using HandyHub Pro, creating an account, or requesting a booking, you electronically sign and accept these Master Terms under Section 84 of the Evidence Act 2011.
                </p>
                <p>
                  <strong>3. Account Registration & Vetting:</strong> Users must be at least 18 years old. Service Professionals must complete mandatory NIN verification, BVN validation, trade background checks, and residential auditing.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CLIENT SERVICE AGREEMENT */}
          {activeTab === "client" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <UserCheck size={26} color="#10B981" />
                <div>
                  <h2 className="h3" style={{ margin: 0, color: "#F8FAFC" }}>Client Service Agreement</h2>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>Direct Contractual Relationship & Escrow Protection</span>
                </div>
              </div>

              <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "16px" }}>
                <p>
                  <strong>1. Direct Service Contract:</strong> Acceptance of a booking creates a direct contract for physical service between the Client and the assigned Independent Professional.
                </p>
                <p>
                  <strong>2. Escrow Management:</strong> Client deposits booking amounts into HandyHub&apos;s regulated escrow account via CBN-licensed payment channels. Escrow funds are released to the Professional after Client job approval or 48 hours post-completion.
                </p>
                <p>
                  <strong>3. Premises Access & Safety:</strong> Client must ensure timely site access, basic utilities (water, electricity), and disclose pre-existing premises hazards.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ARTISAN AGREEMENT */}
          {activeTab === "artisan" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <ShieldCheck size={26} color="#F59E0B" />
                <div>
                  <h2 className="h3" style={{ margin: 0, color: "#F8FAFC" }}>Professional & Artisan Service Agreement</h2>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>20% Platform Commission & 14-Day Workmanship Warranty</span>
                </div>
              </div>

              <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "16px" }}>
                <p>
                  <strong>1. Trade Standards:</strong> Professional warrants technical competence, valid trade tools, and compliance with Nigerian electrical/building codes (NEMSA, COREN).
                </p>
                <p>
                  <strong>2. Commission Structure:</strong> HandyHub retains a 20% platform commission from gross booking fees. Net payout (80%) is remitted directly to the Professional&apos;s registered bank account.
                </p>
                <p>
                  <strong>3. 14-Day Re-Work Warranty:</strong> Professional guarantees workmanship for 14 days post-completion and agrees to fix verified defects at zero extra labor cost.
                </p>
                <p>
                  <strong>4. Anti-Circumvention Penalty:</strong> Off-platform cash arrangements result in permanent deactivation and liquidated damages of ₦250,000.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: NDPA 2023 PRIVACY POLICY */}
          {activeTab === "ndpa" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Lock size={26} color="#8B5CF6" />
                <div>
                  <h2 className="h3" style={{ margin: 0, color: "#F8FAFC" }}>Nigeria Data Protection Policy (NDPA 2023)</h2>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>Statutory Compliance with NDPC Guidelines</span>
                </div>
              </div>

              <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "16px" }}>
                <p>
                  <strong>1. Data Protection Compliance:</strong> HandyHub complies strictly with the Nigeria Data Protection Act 2023 (NDPA). Personal data (Name, Email, Phone, NIN, BVN, GPS Location) is collected for contractual fulfillment, KYC compliance, and safety.
                </p>
                <p>
                  <strong>2. Data Subject Rights:</strong> Users have the right to access, correct, port, or request erasure of personal data under NDPA Section 34.
                </p>
                <p>
                  <strong>3. Data Protection Officer:</strong> Inquiries may be addressed to <code style={{ background: "#0F172A", padding: "2px 6px", borderRadius: 4, color: "#38BDF8" }}>dpo@handyhubpro.ng</code>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: REFUIND & CANCELLATION */}
          {activeTab === "refund" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <RefreshCw size={26} color="#06B6D4" />
                <div>
                  <h2 className="h3" style={{ margin: 0, color: "#F8FAFC" }}>Cancellation, Escrow & Refund Policy</h2>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>CBN Consumer Protection & Payment Guidelines</span>
                </div>
              </div>

              <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "16px" }}>
                <p>
                  <strong>1. Cancellation &gt; 2 Hours:</strong> 100% full refund to wallet or debit card.
                </p>
                <p>
                  <strong>2. Cancellation &lt; 2 Hours / En Route:</strong> ₦2,500 Late Cancellation Fee deducted to compensate artisan transport; remainder refunded.
                </p>
                <p>
                  <strong>3. Professional Default:</strong> If artisan fails to arrive, Client receives 100% full refund plus priority auto-reassignment with a 10% voucher.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: DISPUTE RESOLUTION (AMA 2023) */}
          {activeTab === "dispute" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Scale size={26} color="#C084FC" />
                <div>
                  <h2 className="h3" style={{ margin: 0, color: "#F8FAFC" }}>Dispute Resolution & Escrow Policy (AMA 2023)</h2>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>Arbitration and Mediation Act 2023 Enforceable Protocol</span>
                </div>
              </div>

              <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "16px" }}>
                <p>
                  Disputes are resolved under a 3-tier structure governed by the AMA 2023:
                </p>
                <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><strong>Tier 1:</strong> In-App Escrow Mediation (0–48 hours).</li>
                  <li><strong>Tier 2:</strong> Technical Inspection Audit by Senior QA Officer (48–96 hours).</li>
                  <li><strong>Tier 3:</strong> Binding Arbitration in Abuja FCT under CiArb UK (Nigeria Branch) rules.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 7: INDEPENDENT CONTRACTOR POLICY */}
          {activeTab === "contractor" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <AlertTriangle size={26} color="#EC4899" />
                <div>
                  <h2 className="h3" style={{ margin: 0, color: "#F8FAFC" }}>Independent Contractor Policy (Labour Act LFN 2004)</h2>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>Statutory Classification & Tax Autonomy</span>
                </div>
              </div>

              <div style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "16px" }}>
                <p>
                  Pursuant to the Labour Act Cap L1 LFN 2004, Service Professionals are self-employed independent contractors. No employer-employee relationship exists. Professionals are not entitled to statutory pension (PRA 2014), NHIA insurance, or severance pay. Professionals retain schedule autonomy and remain responsible for personal income tax compliance (FIRS/SIRS).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Hub Actions */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/terms" className="btn btn-secondary btn-md" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} /> View Master Terms Page
          </Link>
          <Link href="/privacy" className="btn btn-secondary btn-md" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Lock size={16} /> View NDPA Privacy Policy
          </Link>
          <Link href="/refund" className="btn btn-secondary btn-md" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={16} /> View Refund Policy
          </Link>
        </div>

      </div>
    </div>
  );
}
