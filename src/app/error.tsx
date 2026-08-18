"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, PhoneCall, MessageSquare } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[HandyHub Global Exception Boundary]:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-8) var(--space-4)",
      background: "var(--bg-primary)",
    }}>
      <div
        className="card"
        style={{
          maxWidth: "580px",
          width: "100%",
          padding: "var(--space-8)",
          textAlign: "center",
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-2xl)",
        }}
      >
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.15)",
          color: "#EF4444",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--space-6)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        }}>
          <AlertTriangle size={32} />
        </div>

        <h1 className="h3" style={{ marginBottom: "var(--space-2)", color: "#F8FAFC" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "var(--fs-sm)", marginBottom: "var(--space-6)", lineHeight: 1.6 }}>
          We encountered an unexpected error while loading this page. Our technical team has been notified via system telemetry.
        </p>

        {error.message && (
          <div style={{
            background: "#0F172A",
            border: "1px solid #334155",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            marginBottom: "var(--space-6)",
            textAlign: "left",
            fontSize: "var(--fs-xs)",
            color: "#CBD5E1",
            fontFamily: "monospace",
            overflowX: "auto",
          }}>
            <strong>Diagnostic Info:</strong> {error.message}
          </div>
        )}

        <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center", flexWrap: "wrap", marginBottom: "var(--space-8)" }}>
          <button
            onClick={() => reset()}
            className="btn btn-primary btn-md"
            style={{ background: "#0EA5E9", borderColor: "#0EA5E9" }}
          >
            <RefreshCw size={16} style={{ marginRight: 6 }} /> Try Reloading Page
          </button>
          <Link href="/" className="btn btn-secondary btn-md">
            <Home size={16} style={{ marginRight: 6 }} /> Return to Home
          </Link>
        </div>

        <div style={{
          borderTop: "1px solid #334155",
          paddingTop: "var(--space-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          fontSize: "var(--fs-xs)",
          color: "#94A3B8",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <span>Need immediate assistance?</span>
          <a href="https://wa.me/2348122222936" target="_blank" rel="noopener noreferrer" style={{ color: "#25D366", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", fontWeight: "bold" }}>
            <MessageSquare size={14} /> WhatsApp Support
          </a>
          <a href="tel:+2348122222936" style={{ color: "#38BDF8", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", fontWeight: "bold" }}>
            <PhoneCall size={14} /> Call Dispatch
          </a>
        </div>
      </div>
    </div>
  );
}
