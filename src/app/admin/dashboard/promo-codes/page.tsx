"use client";

import { useState } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { Tag, Plus, CheckCircle2, Clock } from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminPromoCodesPage() {
  const [promos, setPromos] = useState([
    { code: "WELCOME50", discount: "50% OFF (Up to ₦5,000)", usageCount: 42, maxUses: 500, status: "ACTIVE", expires: "Dec 31, 2026" },
    { code: "HANDY2026", discount: "₦2,000 FLAT OFF", usageCount: 18, maxUses: 100, status: "ACTIVE", expires: "Sep 30, 2026" },
  ]);
  const [newCode, setNewCode] = useState("");

  const handleCreate = () => {
    if (!newCode) return;
    setPromos([
      ...promos,
      { code: newCode.toUpperCase(), discount: "₦1,500 FLAT OFF", usageCount: 0, maxUses: 200, status: "ACTIVE", expires: "Dec 31, 2026" },
    ]);
    setNewCode("");
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Promo Codes & Discounts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Create promotional codes, manage discount percentages, and track redemption metrics.
          </p>
        </div>
      </header>

      <div className={styles.adminContent}>
        {/* Create Code Card */}
        <div className="card" style={{ marginBottom: "var(--space-6)", display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
          <Tag size={24} color="var(--color-primary-500)" />
          <input
            type="text"
            placeholder="Enter Promo Code e.g. ABUJA50"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            style={{ flex: 1, padding: "var(--space-3)", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
          />
          <button className="btn btn-primary btn-md" onClick={handleCreate}>
            <Plus size={16} /> Create Promo Code
          </button>
        </div>

        {/* Promo Codes Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-sm)" }}>
            <thead>
              <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "var(--space-4)" }}>Code</th>
                <th style={{ padding: "var(--space-4)" }}>Discount Rate</th>
                <th style={{ padding: "var(--space-4)" }}>Redemptions</th>
                <th style={{ padding: "var(--space-4)" }}>Expires</th>
                <th style={{ padding: "var(--space-4)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.code} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <td style={{ padding: "var(--space-4)", fontWeight: "bold", fontFamily: "monospace", color: "var(--color-primary-400)" }}>{p.code}</td>
                  <td style={{ padding: "var(--space-4)" }}>{p.discount}</td>
                  <td style={{ padding: "var(--space-4)" }}>{p.usageCount} / {p.maxUses} uses</td>
                  <td style={{ padding: "var(--space-4)" }}>{p.expires}</td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
