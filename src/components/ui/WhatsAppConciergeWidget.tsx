"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, ShieldCheck, Clock } from "lucide-react";

// Routes where live support concierge is necessary & helpful
const allowedConciergeRoutes = [
  "/book",
  "/track",
  "/receipt",
  "/contact",
  "/dashboard/wallet",
  "/dashboard/bookings",
];

export function WhatsAppConciergeWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState("");

  // Only display concierge widget on necessary booking flow, tracking, receipt, and payment routes
  const isAllowedRoute = allowedConciergeRoutes.some((route) => pathname?.startsWith(route));

  if (!isAllowedRoute) {
    return null;
  }

  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "2348122222936";
  const cleanPhone = supportPhone.replace(/[^0-9]/g, "");

  const handleLaunchWhatsApp = (presetMsg?: string) => {
    const textToSend = presetMsg || customQuery.trim() || "Hello HandyHub Support, I need assistance with my service booking.";
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const isBookingFlow = pathname?.startsWith("/book");
  const bottomOffset = isBookingFlow ? "calc(76px + env(safe-area-inset-bottom, 0px))" : "calc(20px + env(safe-area-inset-bottom, 0px))";

  return (
    <div style={{ position: "fixed", bottom: bottomOffset, right: "16px", zIndex: 99999, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Floating Concierge Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "52px",
            right: "0",
            width: "calc(100vw - 32px)",
            maxWidth: "320px",
            background: "#1E293B",
            borderRadius: "16px",
            border: "1px solid #334155",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              padding: "16px",
              color: "#FFFFFF",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: "bold", fontSize: "14px" }}>
                <span>HandyHub Support Concierge</span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFFFFF", display: "inline-block" }}></span>
              </div>
              <div style={{ fontSize: "11px", opacity: 0.9, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} /> Typically replies instantly on WhatsApp
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "transparent", border: "none", color: "#FFFFFF", cursor: "pointer", padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "16px", background: "#0F172A" }}>
            <div
              style={{
                background: "#1E293B",
                borderRadius: "10px",
                padding: "12px",
                borderLeft: "3px solid #10B981",
                fontSize: "13px",
                color: "#E2E8F0",
                lineHeight: 1.5,
                marginBottom: "14px",
              }}
            >
              👋 Hello! How can our customer support team help you with your booking today?
            </div>

            {/* Quick Action Chips */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
              <button
                onClick={() => handleLaunchWhatsApp("Hello Support, I want to track the live status of my artisan booking.")}
                style={{
                  background: "#1E293B",
                  border: "1px solid #334155",
                  color: "#38BDF8",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                📍 Track My Live Booking & Artisan
              </button>
              <button
                onClick={() => handleLaunchWhatsApp("Hello Support, I need help booking a verified service.")}
                style={{
                  background: "#1E293B",
                  border: "1px solid #334155",
                  color: "#38BDF8",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                🛠️ Book a New Home Service
              </button>
              <button
                onClick={() => handleLaunchWhatsApp("Hello Support, I have a question regarding payments and escrow safety.")}
                style={{
                  background: "#1E293B",
                  border: "1px solid #334155",
                  color: "#38BDF8",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                🛡️ Payment & Escrow Inquiries
              </button>
            </div>

            {/* Direct Message Input */}
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Type your message..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLaunchWhatsApp();
                }}
                style={{
                  flex: 1,
                  background: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#F8FAFC",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
              <button
                onClick={() => handleLaunchWhatsApp()}
                style={{
                  background: "#25D366",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  padding: "0 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: "#0F172A", padding: "8px 16px", borderTop: "1px solid #334155", textAlign: "center", fontSize: "11px", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <ShieldCheck size={12} color="#10B981" /> 100% Escrow Protected by HandyHub Pro
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button - Translucent & Compact */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "rgba(18, 140, 126, 0.76)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          color: "#FFFFFF",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          borderRadius: "30px",
          padding: "7px 12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "12px",
          transition: "all 0.2s ease",
          opacity: 0.9,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.background = "rgba(18, 140, 126, 0.95)";
          e.currentTarget.style.transform = "scale(1.03)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.9";
          e.currentTarget.style.background = "rgba(18, 140, 126, 0.76)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <MessageSquare size={15} fill="#FFFFFF" />
        <span style={{ letterSpacing: "-0.01em" }}>Live Support Concierge</span>
      </button>
    </div>
  );
}
