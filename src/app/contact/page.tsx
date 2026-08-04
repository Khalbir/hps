"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, MessageSquare, Mail, MapPin, Clock, Send, CheckCircle2, ShieldCheck } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ padding: "var(--space-12) 0", background: "var(--bg-primary)" }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
          <span className="badge" style={{ background: "rgba(14,165,233,0.15)", color: "#0EA5E9", marginBottom: "var(--space-3)" }}>
            24/7 Customer Support & Assistance
          </span>
          <h1 className="h1" style={{ marginBottom: "var(--space-3)" }}>Contact HandyHub Pro Solutions</h1>
          <p style={{ fontSize: "var(--fs-lg)", color: "var(--text-secondary)", maxWidth: 650, margin: "0 auto" }}>
            Have questions about booking a service, artisan verification, or corporate property management? Reach out to our dedicated support team.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-6)", marginBottom: "var(--space-12)" }}>
          {/* WhatsApp Direct */}
          <div className="card" style={{ textAlign: "center", padding: "var(--space-6)", borderTop: "4px solid #25D366" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(37,211,102,0.15)", color: "#25D366", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--space-4)" }}>
              <MessageSquare size={28} />
            </div>
            <h3 className="h4" style={{ marginBottom: "var(--space-2)" }}>WhatsApp Chat</h3>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              Instant response from our live customer care agents.
            </p>
            <a
              href="https://wa.me/2348122222936?text=Hello%20HandyHub%20Support"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-md w-full"
              style={{ background: "#25D366", borderColor: "#25D366", color: "white" }}
            >
              Chat on WhatsApp (+234 812 222 2936)
            </a>
          </div>

          {/* Direct Phone Support */}
          <div className="card" style={{ textAlign: "center", padding: "var(--space-6)", borderTop: "4px solid #0EA5E9" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(14,165,233,0.15)", color: "#0EA5E9", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--space-4)" }}>
              <Phone size={28} />
            </div>
            <h3 className="h4" style={{ marginBottom: "var(--space-2)" }}>Phone Support</h3>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              Call us directly for emergency bookings or inquiries.
            </p>
            <a href="tel:+2348122222936" className="btn btn-primary btn-md w-full">
              Call +234 812 222 2936
            </a>
          </div>

          {/* Email Support */}
          <div className="card" style={{ textAlign: "center", padding: "var(--space-6)", borderTop: "4px solid #F59E0B" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(245,158,11,0.15)", color: "#F59E0B", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--space-4)" }}>
              <Mail size={28} />
            </div>
            <h3 className="h4" style={{ marginBottom: "var(--space-2)" }}>Email Inquiries</h3>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              Send formal requests, partnership proposals, or billing queries.
            </p>
            <a href="mailto:info@handyhubpro.ng" className="btn btn-secondary btn-md w-full">
              info@handyhubpro.ng
            </a>
          </div>
        </div>

        {/* Form & Operating Hours */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-8)" }}>
          {/* Contact Form */}
          <div className="card">
            <h3 className="h4" style={{ marginBottom: "var(--space-4)" }}>Send Us a Message</h3>

            {submitted ? (
              <div style={{ textAlign: "center", padding: "var(--space-8) 0" }}>
                <CheckCircle2 size={48} color="#10B981" style={{ margin: "0 auto var(--space-3)" }} />
                <h3 className="h4" style={{ color: "#10B981" }}>Message Delivered!</h3>
                <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginTop: 8 }}>
                  Thank you for contacting HandyHub Pro Solutions. A support officer will reach out to you within 30 minutes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                  <div>
                    <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amina Ibrahim"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+234 812 222 2936"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe how we can help you..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ width: "100%", padding: "12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontFamily: "inherit" }}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-md w-full">
                  <Send size={16} /> Send Message
                </button>
              </form>
            )}
          </div>

          {/* Operating Hours & HQ */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <h3 className="h4">Headquarters & Hours</h3>

            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <MapPin size={20} color="#0EA5E9" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ display: "block", fontSize: "var(--fs-sm)" }}>Abuja Office</strong>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>
                  Maitama & Wuse 2 Business Hub, Federal Capital Territory, Nigeria
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <Clock size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ display: "block", fontSize: "var(--fs-sm)" }}>Support Availability</strong>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>
                  Mon - Sat: 7:00 AM - 8:00 PM<br />
                  Sunday: 9:00 AM - 6:00 PM<br />
                  Emergency Bookings: 24/7
                </span>
              </div>
            </div>

            <div style={{ padding: "var(--space-3)", background: "rgba(16,185,129,0.1)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(16,185,129,0.25)", marginTop: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10B981", fontSize: "var(--fs-xs)", fontWeight: "bold" }}>
                <ShieldCheck size={16} /> Verified Resolution Guarantee
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "4px 0 0" }}>
                All customer inquiries are backed by our 24-hour response SLA.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
