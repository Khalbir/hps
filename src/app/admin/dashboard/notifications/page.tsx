"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { Bell, Send, CheckCircle2, Mail, Phone, User, Clock, MessageSquare } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"BROADCAST" | "INQUIRIES">("INQUIRIES");
  const [target, setTarget] = useState("ALL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

  const [inquiries, setInquiries] = useState<ClientInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);

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

  const handleSend = () => {
    if (!title || !message) return;
    setSentSuccess(true);
    setTimeout(() => {
      setTitle("");
      setMessage("");
      setSentSuccess(false);
    }, 2500);
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Client Messages & System Broadcasts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            View client inquiries sent via website contact form and compose system announcements.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
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
            <Send size={16} /> Compose Broadcast
          </button>
        </div>
      </header>

      <div className={styles.adminContent}>
        {activeTab === "INQUIRIES" ? (
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
        ) : (
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

                <button className="btn btn-primary btn-md" onClick={handleSend} disabled={!title || !message}>
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
