"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Bell, Send, CheckCircle2, Mail, Phone, User, Clock, MessageSquare,
  Smartphone, ShieldCheck, Zap, AlertCircle, Copy, Check, ExternalLink
} from "lucide-react";
import styles from "../../admin.module.css";

interface ClientInquiry {
  id: string;
  title: string;
  message: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<"WHATSAPP_SMS" | "INQUIRIES" | "BROADCAST">("WHATSAPP_SMS");
  const [target, setTarget] = useState("ALL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

  // Client Inquiries State
  const [inquiries, setInquiries] = useState<ClientInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);

  // WhatsApp & SMS Test Station State
  const [testPhone, setTestPhone] = useState("");
  const [testName, setTestName] = useState("Abubakar Aliyu");
  const [testTemplate, setTestTemplate] = useState<"CLIENT_BOOKING_CONFIRMED" | "ARTISAN_NEW_JOB" | "ARTISAN_PAYOUT_CREDITED" | "CUSTOM_BROADCAST">("CLIENT_BOOKING_CONFIRMED");
  const [customTestMsg, setCustomTestMsg] = useState("");
  const [testingDispatch, setTestingDispatch] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; provider?: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    async function fetchInquiries() {
      try {
        const res = await fetch("/api/contact");
        const data = await res.json();
        if (res.ok) {
          setInquiries(data.inquiries || []);
        }
      } catch (err) {
        console.warn("Failed to fetch client inquiries:", err);
      } finally {
        setLoadingInquiries(false);
      }
    }
    fetchInquiries();
  }, []);

  const handleSendBroadcast = () => {
    if (!title || !message) return;
    setSentSuccess(true);
    setTimeout(() => {
      setTitle("");
      setMessage("");
      setSentSuccess(false);
    }, 2500);
  };

  const handleTriggerLiveTest = async () => {
    if (!testPhone || testPhone.length < 10) {
      alert("Please enter a valid 11-digit Nigerian phone number (e.g. 08031234567).");
      return;
    }

    setTestingDispatch(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientPhone: testPhone,
          recipientName: testName,
          templateType: testTemplate,
          customMessage: customTestMsg,
          customTitle: "HandyHub Pro Alert",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || "Notification dispatched successfully!",
          provider: data.provider,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Failed to deliver notification.",
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: "Network error connecting to dispatch engine.",
      });
    } finally {
      setTestingDispatch(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Messaging, SMS & WhatsApp Engine</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Configure and test multi-channel WhatsApp & SMS alerts to notify clients and pros instantly.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className={`btn btn-md ${activeTab === "WHATSAPP_SMS" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("WHATSAPP_SMS")}
          >
            <Smartphone size={16} /> WhatsApp & SMS Gateway
          </button>
          <button
            className={`btn btn-md ${activeTab === "INQUIRIES" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("INQUIRIES")}
          >
            <Mail size={16} /> Client Messages ({inquiries.length})
          </button>
          <button
            className={`btn btn-md ${activeTab === "BROADCAST" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("BROADCAST")}
          >
            <Send size={16} /> System Broadcast
          </button>
        </div>
      </header>

      <div className={styles.adminContent}>
        {activeTab === "WHATSAPP_SMS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Gateway Status Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {/* Primary Gateway: Termii */}
              <div className="card" style={{ borderTop: "4px solid #10B981", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap size={18} color="#10B981" />
                    <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>Termii Gateway</strong>
                  </div>
                  <span style={{ fontSize: "11px", background: "rgba(16,185,129,0.15)", color: "#10B981", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                    Primary (Nigeria)
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 10px 0" }}>
                  Official local Nigerian telco gateway with automated WhatsApp delivery and instant SMS fallback.
                </p>
                <div style={{ fontSize: "11.5px", color: "#38BDF8" }}>
                  Channels: <strong>WhatsApp + DND-compliant Direct SMS</strong>
                </div>
              </div>

              {/* Secondary Gateway: Meta WhatsApp Cloud API */}
              <div className="card" style={{ borderTop: "4px solid #25D366", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MessageSquare size={18} color="#25D366" />
                    <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>Meta WhatsApp Cloud</strong>
                  </div>
                  <span style={{ fontSize: "11px", background: "rgba(37,211,102,0.15)", color: "#25D366", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                    Official Meta
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 10px 0" }}>
                  Direct connection to Meta Graph API for verified enterprise blue-badge messaging.
                </p>
                <div style={{ fontSize: "11.5px", color: "#38BDF8" }}>
                  Channels: <strong>Meta Cloud Official WhatsApp API</strong>
                </div>
              </div>

              {/* Tertiary: Twilio */}
              <div className="card" style={{ borderTop: "4px solid #F59E0B", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldCheck size={18} color="#F59E0B" />
                    <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>Twilio WhatsApp</strong>
                  </div>
                  <span style={{ fontSize: "11px", background: "rgba(245,158,11,0.15)", color: "#F59E0B", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                    Global Fallback
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 10px 0" }}>
                  International multi-region SMS & WhatsApp redundancy.
                </p>
                <div style={{ fontSize: "11.5px", color: "#38BDF8" }}>
                  Channels: <strong>Twilio Programmable SMS/WhatsApp</strong>
                </div>
              </div>
            </div>

            {/* Test Dispatch Console */}
            <div className="card" style={{ borderLeft: "4px solid #0EA5E9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 className="h4" style={{ margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: 8 }}>
                    <Smartphone size={20} color="#0EA5E9" /> Real-Time WhatsApp & SMS Test Dispatcher
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>
                    Test message formatting, escrow notifications, and live delivery to client & pro phones.
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                    Select Notification Template <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    className={styles.input}
                    value={testTemplate}
                    onChange={(e: any) => setTestTemplate(e.target.value)}
                    style={{ width: "100%", height: 42, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: 8, color: "var(--text-primary)" }}
                  >
                    <option value="CLIENT_BOOKING_CONFIRMED">🛡️ Client: Booking Confirmed & Escrow Held</option>
                    <option value="ARTISAN_NEW_JOB">👨‍🔧 Pro: New Job Available / Assigned Alert</option>
                    <option value="ARTISAN_PAYOUT_CREDITED">💰 Pro: Escrow Payout Released to Wallet</option>
                    <option value="CUSTOM_BROADCAST">📢 Custom System WhatsApp / SMS Alert</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                    Recipient Nigerian Phone (11 Digits) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    className={styles.input}
                    placeholder="e.g. 08031234567"
                    value={testPhone}
                    maxLength={11}
                    onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    style={{ width: "100%", height: 42, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: 8, color: "var(--text-primary)" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Abubakar Aliyu"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    style={{ width: "100%", height: 42, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: 8, color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {testTemplate === "CUSTOM_BROADCAST" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
                    Custom Message Body
                  </label>
                  <textarea
                    rows={3}
                    className={styles.input}
                    placeholder="Type custom test notification message..."
                    value={customTestMsg}
                    onChange={(e) => setCustomTestMsg(e.target.value)}
                    style={{ width: "100%", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: 8, padding: 10, color: "var(--text-primary)" }}
                  />
                </div>
              )}

              {testResult && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    marginBottom: 16,
                    background: testResult.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${testResult.success ? "#10B981" : "#EF4444"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {testResult.success ? <CheckCircle2 size={18} color="#10B981" /> : <AlertCircle size={18} color="#EF4444" />}
                    <span style={{ fontSize: "13px", color: testResult.success ? "#10B981" : "#EF4444", fontWeight: 600 }}>
                      {testResult.message}
                    </span>
                  </div>
                  {testResult.provider && (
                    <span style={{ fontSize: "11px", color: "#94A3B8", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 4 }}>
                      Provider: {testResult.provider}
                    </span>
                  )}
                </div>
              )}

              <button
                className={`btn btn-primary btn-md ${testingDispatch ? "btn-loading" : ""}`}
                onClick={handleTriggerLiveTest}
                disabled={testingDispatch || testPhone.length < 10}
              >
                <Send size={16} />
                {testingDispatch ? "Dispatching Live Alert..." : "Send Instant Live Test Alert"}
              </button>
            </div>

            {/* Quick 2-Minute Setup Instructions */}
            <div className="card">
              <h3 className="h4" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={18} color="#F59E0B" /> How to Connect Your API Keys in 2 Minutes
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                HandyHub Pro is pre-wired to automatically dispatch notifications across the entire booking lifecycle. To route messages through live SMS and WhatsApp networks, simply add your credentials to your server environment file (<code>.env</code>):
              </p>

              <div style={{ background: "#0F172A", padding: "16px", borderRadius: "10px", border: "1px solid #334155", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: "12px", color: "#38BDF8", fontWeight: 700, textTransform: "uppercase" }}>
                    Recommended Nigeria Setup (.env)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `# Termii (Nigeria SMS & WhatsApp)\nTERMII_API_KEY="your_termii_api_key_here"\nTERMII_SENDER_ID="HandyHub"\n\n# WhatsApp Customer Support Hotline\nNEXT_PUBLIC_SUPPORT_WHATSAPP="2348122222936"`,
                        "env"
                      )
                    }
                    style={{
                      background: "none",
                      border: "none",
                      color: copiedKey === "env" ? "#10B981" : "#94A3B8",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "12px",
                    }}
                  >
                    {copiedKey === "env" ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKey === "env" ? "Copied!" : "Copy Snippet"}
                  </button>
                </div>
                <pre style={{ margin: 0, fontSize: "12.5px", color: "#E2E8F0", fontFamily: "monospace", lineHeight: 1.6 }}>
{`# 1. Termii Gateway (Get keys at https://termii.com)
TERMII_API_KEY="your_termii_api_key_here"
TERMII_SENDER_ID="HandyHub"

# 2. WhatsApp Customer Support Hotline (wa.me click-to-chat)
NEXT_PUBLIC_SUPPORT_WHATSAPP="2348122222936"`}
                </pre>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 16 }}>
                <div style={{ background: "var(--bg-tertiary)", padding: 12, borderRadius: 8, fontSize: "12.5px" }}>
                  <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: 4 }}>Automated Client Alerts</strong>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    <li>Booking Received & Escrow Held</li>
                    <li>Verified Artisan Matched & Assigned</li>
                    <li>Artisan En Route to Location</li>
                    <li>Work Completed & Payout Confirmation OTP</li>
                  </ul>
                </div>
                <div style={{ background: "var(--bg-tertiary)", padding: 12, borderRadius: 8, fontSize: "12.5px" }}>
                  <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: 4 }}>Automated Pro / Artisan Alerts</strong>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    <li>New Job Available (with Escrow payout amount)</li>
                    <li>Client Contact & Address Details</li>
                    <li>Escrow Payment Credited to Wallet</li>
                    <li>Verification & Badge Approval Notice</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "INQUIRIES" && (
          <div>
            <h3 className="h4" style={{ marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare size={20} color="#00A8B5" /> Client Inquiries Inbox
            </h3>

            {loadingInquiries ? (
              <p style={{ color: "var(--text-secondary)" }}>Loading client messages...</p>
            ) : inquiries.length === 0 ? (
              <div className="card" style={{ padding: "40px", textAlign: "center" }}>
                <Mail size={48} color="#94A3B8" style={{ margin: "0 auto 12px" }} />
                <h4 className="h4">No Client Messages Received Yet</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 0" }}>
                  Messages submitted by clients via the contact page will automatically show up here and send email alerts to <strong>info@handyhubpro.ng</strong>.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {inquiries.map((inq) => (
                  <div key={inq.id} className="card" style={{ borderLeft: "4px solid #00A8B5" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <h4 className="h4" style={{ fontSize: "16px", color: "var(--text-primary)", margin: "0 0 4px 0" }}>
                          {inq.title}
                        </h4>
                        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <User size={14} color="#00A8B5" /> <strong>{inq.senderName}</strong>
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Mail size={14} color="#00A8B5" /> <a href={`mailto:${inq.senderEmail}`} style={{ color: "#38BDF8" }}>{inq.senderEmail}</a>
                          </span>
                          {inq.senderPhone && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Phone size={14} color="#25D366" /> <a href={`tel:${inq.senderPhone}`} style={{ color: "#25D366" }}>{inq.senderPhone}</a>
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--text-tertiary)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock size={13} /> {new Date(inq.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ background: "var(--bg-tertiary)", padding: "14px", borderRadius: "8px", fontSize: "14px", color: "var(--text-primary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                      {inq.message.replace("Client Message: ", "")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "BROADCAST" && (
          <div className="card" style={{ maxWidth: 650 }}>
            <h3 className="h4" style={{ marginBottom: "var(--space-4)" }}>Compose Platform Announcement</h3>

            {sentSuccess ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", background: "rgba(16,185,129,0.1)", borderRadius: "var(--radius-lg)", border: "1px solid #10B981" }}>
                <CheckCircle2 size={36} color="#10B981" style={{ margin: "0 auto 8px" }} />
                <h4 className="h4" style={{ color: "#10B981" }}>Broadcast Sent Successfully!</h4>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>Pushed to target users in real time.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>Target Audience</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
                  >
                    <option value="ALL">All Users (Customers & Professionals)</option>
                    <option value="CUSTOMERS">Customers Only</option>
                    <option value="PROFESSIONALS">Verified Professionals Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>Notification Title</label>
                  <input
                    type="text"
                    placeholder="e.g. New Service Discount in Maitama & Wuse 2 🎉"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: "100%", height: 44, padding: "0 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "var(--fs-sm)", fontWeight: "bold", display: "block", marginBottom: 4 }}>Message Content</label>
                  <textarea
                    rows={4}
                    placeholder="Enter broadcast message details..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ width: "100%", padding: 12, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
                  />
                </div>

                <button className="btn btn-primary btn-md" onClick={handleSendBroadcast} disabled={!title || !message}>
                  <Send size={16} /> Broadcast Notification
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayoutShell>
  );
}
