"use client";

import Link from "next/link";
import { RefreshCw, ShieldCheck, Clock, AlertCircle, DollarSign, CheckCircle2, FileText, ArrowRight } from "lucide-react";

export default function RefundPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "var(--space-12) 0" }}>
      <div className="container" style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.12)", color: "#F59E0B", padding: "6px 16px", borderRadius: 99, fontSize: "13px", fontWeight: 700, marginBottom: "var(--space-3)" }}>
            <ShieldCheck size={16} /> Escrow Protection Protocol
          </div>
          <h1 className="h1" style={{ marginBottom: "var(--space-3)", color: "#F8FAFC" }}>
            Cancellation, Escrow & Refund Policy
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "16px", maxWidth: "650px", margin: "0 auto" }}>
            Fair cancellation rules, escrow disbursement protocols, and money-back protections for Clients and Service Professionals under Nigerian Law.
          </p>
          <span style={{ fontSize: "12px", color: "#64748B", marginTop: "8px", display: "block" }}>
            Effective Date: August 9, 2026 | CBN Consumer Protection & Payment Guidelines Compliant
          </span>
        </div>

        {/* Overview Box */}
        <div style={{ background: "#1E293B", border: "1px solid #F59E0B", borderRadius: "16px", padding: "24px", marginBottom: "var(--space-8)" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#F8FAFC", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <DollarSign size={20} color="#F59E0B" /> Escrow Custody Protection Guarantee
          </h3>
          <p style={{ margin: 0, color: "#CBD5E1", fontSize: "14px", lineHeight: 1.6 }}>
            Every job booked on HandyHub Pro is protected by our regulated Escrow Settlement system. When a Client books a service, funds are securely held in escrow until the job is completed to specification. Funds are disbursed to the Professional only after Client approval or expiry of the 48-hour inspection window.
          </p>
        </div>

        {/* Content Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Client Cancellation Schedule */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ margin: "0 0 14px 0", color: "#38BDF8", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={18} color="#0EA5E9" /> 1. Client Cancellation Rules & Schedule
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ color: "#10B981", fontSize: "14px", display: "block", marginBottom: 4 }}>
                  🟢 Cancellation &gt; 2 Hours Before Scheduled Window
                </strong>
                <span style={{ color: "#CBD5E1", fontSize: "13px" }}>
                  <strong>100% Full Refund</strong> credited immediately to your HandyHub Wallet or original payment card. No cancellation fee charged.
                </span>
              </div>

              <div style={{ background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ color: "#F59E0B", fontSize: "14px", display: "block", marginBottom: 4 }}>
                  🟡 Cancellation &lt; 2 Hours Before Scheduled Window (or En-Route)
                </strong>
                <span style={{ color: "#CBD5E1", fontSize: "13px" }}>
                  A nominal <strong>₦2,500 Late Cancellation Fee</strong> is deducted to compensate the dispatched Service Professional for transport and opportunity loss. Remaining balance refunded.
                </span>
              </div>

              <div style={{ background: "#0F172A", padding: "14px", borderRadius: "10px", border: "1px solid #334155" }}>
                <strong style={{ color: "#EF4444", fontSize: "14px", display: "block", marginBottom: 4 }}>
                  🔴 Client No-Show / Denied Entry Upon Arrival
                </strong>
                <span style={{ color: "#CBD5E1", fontSize: "13px" }}>
                  A <strong>₦3,500 Mobilization & Site Visit Fee</strong> is deducted to compensate the Professional. Remaining balance refunded.
                </span>
              </div>
            </div>
          </div>

          {/* Artisan Default Policy */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#10B981", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={18} color="#10B981" /> 2. Service Professional Default & Non-Arrival
            </h3>
            <p style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              If a Service Professional cancels a confirmed job or fails to arrive within 30 minutes of the scheduled window, the Client receives an <strong>instant 100% full refund</strong> plus priority auto-reassignment with a 10% discount voucher funded from defaulting artisan penalty pools.
            </p>
          </div>

          {/* Refund Processing Timeline */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#C084FC", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <RefreshCw size={18} color="#C084FC" /> 3. Refund Disbursement Timelines
            </h3>
            <ul style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: 1.7, paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              <li><strong>HandyHub In-App Wallet:</strong> Instant credit (0 seconds). Can be used immediately for future service bookings.</li>
              <li><strong>Debit Card / Bank Account Refund:</strong> Processed within <strong>24 to 48 banking hours</strong> via Paystack gateway depending on your Nigerian card issuing bank.</li>
            </ul>
          </div>

          {/* Support Link */}
          <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#F8FAFC", fontSize: "16px", fontWeight: 700 }}>
              Need Help with a Refund or Dispute?
            </h4>
            <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "16px" }}>
              Our 24/7 Escrow & Billing Resolution Desk is ready to assist you.
            </p>
            <Link href="/contact" className="btn btn-primary btn-md" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
              Contact Billing Support <ArrowRight size={16} />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
