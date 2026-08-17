"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2, Printer, ArrowRight, ShieldCheck, MapPin,
  Calendar, Clock, CreditCard, Download, AlertCircle, RefreshCw, Lock
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

export default function DigitalReceiptPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawReference = (params?.reference as string) || searchParams.get("reference") || searchParams.get("ref") || "";

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReceipt = async () => {
    if (!rawReference) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/payments/receipt?reference=${encodeURIComponent(rawReference)}`);
      const data = await res.json();

      if (res.ok && data.receipt) {
        setReceipt(data.receipt);
      } else {
        setError(data.error || "Unable to find digital payment receipt.");
      }
    } catch {
      setError("Network error fetching receipt. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [rawReference]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ background: "var(--bg-primary, #090D16)", minHeight: "100vh", padding: "40px 16px 80px" }}>
      <div className="container" style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Top Actions Bar (Hidden on print) */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <BrandLogo size="md" />
          </Link>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#1E293B",
                color: "#F8FAFC",
                border: "1px solid #334155",
                borderRadius: 8,
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <Printer size={16} /> Print / Save PDF
            </button>
            <Link
              href={receipt?.service?.bookingRef || rawReference ? `/track?ref=${encodeURIComponent(receipt?.service?.bookingRef || rawReference)}` : "/track"}
              className="btn btn-primary btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#0EA5E9",
                color: "#FFFFFF",
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Track Booking 📍
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card" style={{ padding: 40, textAlign: "center", background: "#1E293B", borderRadius: 16, border: "1px solid #334155" }}>
            <RefreshCw size={32} className="spin" color="#0EA5E9" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ color: "#F8FAFC", margin: 0 }}>Generating Official Payment Receipt...</h3>
            <p style={{ color: "#94A3B8", fontSize: 14 }}>Querying real-time Paystack transaction confirmation...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card" style={{ padding: 32, textAlign: "center", background: "#1E293B", borderRadius: 16, border: "1px solid #EF4444" }}>
            <AlertCircle size={36} color="#EF4444" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ color: "#F8FAFC", margin: "0 0 8px" }}>Receipt Generation Notice</h3>
            <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 20 }}>{error}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={fetchReceipt} className="btn btn-secondary btn-sm">Try Again</button>
              {rawReference && (
                <Link href={`/track?ref=${encodeURIComponent(rawReference)}`} className="btn btn-primary btn-sm" style={{ background: "#0EA5E9" }}>
                  Track Booking 📍
                </Link>
              )}
              <Link href="/dashboard" className="btn btn-secondary btn-sm">Go to Dashboard</Link>
            </div>
          </div>
        )}

        {/* Digital Receipt Card */}
        {receipt && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            id="printable-receipt"
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: 20,
              padding: "40px 36px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              color: "#F8FAFC",
            }}
          >
            {/* Header / Brand */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #334155", paddingBottom: 24, marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
              <div>
                <BrandLogo size="md" />
                <p style={{ color: "#94A3B8", fontSize: 12, margin: "6px 0 0" }}>
                  Official Electronic Payment Receipt & Escrow Certificate
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    background: receipt.isPaid ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: receipt.isPaid ? "#10B981" : "#F59E0B",
                    border: `1px solid ${receipt.isPaid ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                    padding: "4px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <CheckCircle2 size={14} />
                  {receipt.isPaid ? "PAID — ESCROW PROTECTED" : "PAYMENT PENDING"}
                </span>
                <div style={{ color: "#94A3B8", fontSize: 12 }}>Receipt No: <strong style={{ color: "#F8FAFC" }}>{receipt.receiptNumber}</strong></div>
                <div style={{ color: "#64748B", fontSize: 11 }}>Date: {new Date(receipt.paymentDate).toLocaleString()}</div>
              </div>
            </div>

            {/* Total Paid Hero Box */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)",
                border: "1px solid rgba(14, 165, 233, 0.3)",
                borderRadius: 16,
                padding: "24px",
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              <span style={{ color: "#94A3B8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                Amount Paid in Full
              </span>
              <h1 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#10B981", margin: "6px 0 10px" }}>
                {receipt.formattedTotalPaid}
              </h1>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, fontSize: 12, color: "#94A3B8", flexWrap: "wrap" }}>
                <span>Gateway: <strong style={{ color: "#F8FAFC" }}>{receipt.gateway}</strong></span>
                <span>•</span>
                <span>Channel: <strong style={{ color: "#F8FAFC" }}>{receipt.channel?.toUpperCase()}</strong></span>
                <span>•</span>
                <span>Ref: <strong style={{ color: "#38BDF8" }}>{receipt.transactionReference}</strong></span>
              </div>
            </div>

            {/* 2-Column Meta Details */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 28 }}>
              {/* Customer Column */}
              <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12, padding: 18 }}>
                <h4 style={{ fontSize: 12, color: "#64748B", textTransform: "uppercase", fontWeight: 700, margin: "0 0 12px" }}>
                  Billed To
                </h4>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#F8FAFC", marginBottom: 4 }}>
                  {receipt.customer.name}
                </div>
                <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 2 }}>{receipt.customer.email}</div>
                <div style={{ fontSize: 13, color: "#94A3B8" }}>{receipt.customer.phone}</div>
              </div>

              {/* Service Details Column */}
              <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12, padding: 18 }}>
                <h4 style={{ fontSize: 12, color: "#64748B", textTransform: "uppercase", fontWeight: 700, margin: "0 0 12px" }}>
                  Service Summary
                </h4>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#F8FAFC", marginBottom: 4 }}>
                  {receipt.service.name}
                </div>
                <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 2 }}>
                  Booking Ref: <strong style={{ color: "#38BDF8" }}>{receipt.service.bookingRef}</strong>
                </div>
                <div style={{ fontSize: 13, color: "#94A3B8" }}>
                  Scheduled: {receipt.service.scheduledDate} ({receipt.service.scheduledTime})
                </div>
              </div>
            </div>

            {/* Line Items Breakdown Table */}
            <div style={{ marginBottom: 28 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155", color: "#94A3B8", fontSize: 12, textAlign: "left" }}>
                    <th style={{ paddingBottom: 10, fontWeight: 700 }}>Description</th>
                    <th style={{ paddingBottom: 10, textAlign: "right", fontWeight: 700 }}>Amount</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: 14 }}>
                  <tr style={{ borderBottom: "1px solid rgba(51, 65, 85, 0.5)" }}>
                    <td style={{ padding: "14px 0" }}>
                      <div style={{ fontWeight: 600 }}>{receipt.service.name}</div>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>Service Address: {receipt.service.serviceAddress}</div>
                    </td>
                    <td style={{ padding: "14px 0", textAlign: "right", fontWeight: 600 }}>
                      {receipt.formattedAmount}
                    </td>
                  </tr>

                  {receipt.discountNgn > 0 && (
                    <tr style={{ borderBottom: "1px solid rgba(51, 65, 85, 0.5)", color: "#10B981" }}>
                      <td style={{ padding: "10px 0" }}>Promo Discount Applied</td>
                      <td style={{ padding: "10px 0", textAlign: "right" }}>-₦{receipt.discountNgn.toLocaleString()}</td>
                    </tr>
                  )}

                  <tr>
                    <td style={{ padding: "14px 0 0", fontSize: 16, fontWeight: 700 }}>Total Paid via Paystack</td>
                    <td style={{ padding: "14px 0 0", textAlign: "right", fontSize: 18, fontWeight: 800, color: "#10B981" }}>
                      {receipt.formattedTotalPaid}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Escrow Guarantee & Verification Seal */}
            <div
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 28,
              }}
            >
              <ShieldCheck size={28} color="#10B981" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: "block", fontSize: 13, color: "#10B981" }}>
                  14-Day Escrow Warranty & Safety Seal Active
                </strong>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>
                  {receipt.escrowGuarantee.policy}
                </span>
              </div>
            </div>

            {/* Footer Notes */}
            <div style={{ borderTop: "1px solid #334155", paddingTop: 20, textAlign: "center", fontSize: 11, color: "#64748B" }}>
              <p style={{ margin: "0 0 4px" }}>{receipt.merchant.name} • {receipt.merchant.registrationNumber} • {receipt.merchant.address}</p>
              <p style={{ margin: 0 }}>Support: {receipt.merchant.email} | WhatsApp: {receipt.merchant.phone}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: #FFFFFF !important;
            color: #000000 !important;
          }
          .no-print, header, footer, nav {
            display: none !important;
          }
          #printable-receipt {
            background: #FFFFFF !important;
            color: #000000 !important;
            border: 1px solid #E2E8F0 !important;
            box-shadow: none !important;
            padding: 20px !important;
          }
          #printable-receipt * {
            color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
}
