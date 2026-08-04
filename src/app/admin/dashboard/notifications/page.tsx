"use client";

import { useState } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { Bell, Send, CheckCircle2 } from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminNotificationsPage() {
  const [target, setTarget] = useState("ALL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

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
          <h1 className="h3">System Broadcasts & Notifications</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Send instant push & in-app broadcast notifications to Customers, Professionals, or All Users.
          </p>
        </div>
      </header>

      <div className={styles.adminContent}>
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
      </div>
    </AdminLayoutShell>
  );
}
