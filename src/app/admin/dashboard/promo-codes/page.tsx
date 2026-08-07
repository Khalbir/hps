"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { Tag, Plus, Minus, CheckCircle2, RefreshCw, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import styles from "../../admin.module.css";

interface PromoCodeItem {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number;
  usedCount: number;
  maxDiscount?: number | null;
  expiresAt: string;
  isActive: boolean;
}

export default function AdminPromoCodesPage() {
  const [promos, setPromos] = useState<PromoCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("FIXED");
  const [newValue, setNewValue] = useState(2000);
  const [newMaxUses, setNewMaxUses] = useState(200);

  // Fetch Promo Codes from API
  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/promo-codes");
      const data = await res.json();
      if (res.ok) {
        setPromos(data.promos || []);
      }
    } catch (err) {
      console.warn("Failed to fetch promos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  // Create New Promo
  const handleCreate = async () => {
    if (!newCode) return;
    try {
      const res = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          discountType: newType,
          discountValue: Number(newValue),
          maxUses: Number(newMaxUses),
        }),
      });

      if (res.ok) {
        setNewCode("");
        fetchPromos();
      }
    } catch (err) {
      console.error("Create promo error:", err);
    }
  };

  // Increase or Decrease Promo Properties
  const handleUpdate = async (id: string, action: string, delta: number = 1) => {
    // Optimistic UI Update for instantaneous response
    setPromos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        let copy = { ...p };
        if (action === "INCREASE_MAX_USES") copy.maxUses += delta;
        if (action === "DECREASE_MAX_USES") copy.maxUses = Math.max(0, copy.maxUses - delta);
        if (action === "INCREASE_USED") copy.usedCount = Math.min(copy.maxUses, copy.usedCount + delta);
        if (action === "DECREASE_USED") copy.usedCount = Math.max(0, copy.usedCount - delta);
        if (action === "INCREASE_DISCOUNT") copy.discountValue += delta;
        if (action === "DECREASE_DISCOUNT") copy.discountValue = Math.max(1, copy.discountValue - delta);
        if (action === "TOGGLE_ACTIVE") copy.isActive = !copy.isActive;
        return copy;
      })
    );

    try {
      await fetch("/api/promo-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, delta }),
      });
    } catch (err) {
      console.error("Update promo error:", err);
      fetchPromos(); // Rollback on error
    }
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Promo Codes & Redemption Control</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Adjust redemption limits and discount values instantly with Increase (+) and Decrease (-) controls.
          </p>
        </div>
        <button className="btn btn-secondary btn-md" onClick={fetchPromos} title="Refresh Live Data">
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      <div className={styles.adminContent}>
        {/* Create Code Card */}
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h3 className="h4" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: 8 }}>
            <Tag size={20} color="#00A8B5" /> Create New Discount Promo Code
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Promo Code e.g. ABUJA50"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              style={{ padding: "10px 14px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontWeight: "bold" }}
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              style={{ padding: "10px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
            >
              <option value="FIXED">Flat ₦ Off</option>
              <option value="PERCENTAGE">% Percentage Off</option>
            </select>
            <input
              type="number"
              placeholder="Discount Value"
              value={newValue}
              onChange={(e) => setNewValue(Number(e.target.value))}
              style={{ padding: "10px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
            />
            <input
              type="number"
              placeholder="Max Uses"
              value={newMaxUses}
              onChange={(e) => setNewMaxUses(Number(e.target.value))}
              style={{ padding: "10px 12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
            />
            <button className="btn btn-primary btn-md" onClick={handleCreate} disabled={!newCode} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Plus size={16} /> Create Code
            </button>
          </div>
        </div>

        {/* Promo Codes Table */}
        <div className="card" style={{ padding: 0, overflowX: "auto", width: "100%" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
              Loading promo codes & redemptions...
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-sm)" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "16px" }}>Code</th>
                  <th style={{ padding: "16px" }}>Discount Value & Adjustment</th>
                  <th style={{ padding: "16px" }}>Redemptions & Max Limits (Decrease - / Increase +)</th>
                  <th style={{ padding: "16px" }}>Expires</th>
                  <th style={{ padding: "16px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => {
                  const percentUsed = Math.min(100, Math.round((p.usedCount / (p.maxUses || 1)) * 100));

                  return (
                    <tr key={p.id || p.code} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                      {/* Code */}
                      <td style={{ padding: "16px" }}>
                        <span style={{ fontWeight: 800, fontFamily: "monospace", color: "#38BDF8", fontSize: "15px", letterSpacing: "0.05em" }}>
                          {p.code}
                        </span>
                      </td>

                      {/* Discount Rate + Controls */}
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "var(--bg-tertiary)", padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-primary)" }}>
                          {/* Decrease Discount */}
                          <button
                            onClick={() => handleUpdate(p.id, "DECREASE_DISCOUNT", p.discountType === "PERCENTAGE" ? 5 : 500)}
                            title="Decrease Discount (-5% or -₦500)"
                            style={{
                              width: 26, height: 26, borderRadius: 5, background: "rgba(239, 68, 68, 0.15)",
                              border: "1px solid #EF4444", color: "#EF4444", display: "inline-flex",
                              alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 800
                            }}
                          >
                            <Minus size={14} />
                          </button>

                          <span style={{ fontWeight: 700, minWidth: 100, textAlign: "center", color: "#F8FAFC" }}>
                            {p.discountType === "PERCENTAGE"
                              ? `${p.discountValue}% OFF`
                              : `₦${p.discountValue.toLocaleString()} FLAT OFF`}
                          </span>

                          {/* Increase Discount */}
                          <button
                            onClick={() => handleUpdate(p.id, "INCREASE_DISCOUNT", p.discountType === "PERCENTAGE" ? 5 : 500)}
                            title="Increase Discount (+5% or +₦500)"
                            style={{
                              width: 26, height: 26, borderRadius: 5, background: "rgba(16, 185, 129, 0.15)",
                              border: "1px solid #10B981", color: "#10B981", display: "inline-flex",
                              alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 800
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>

                      {/* Redemptions + Controls */}
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 320 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {/* Decrease Max Uses */}
                            <button
                              onClick={() => handleUpdate(p.id, "DECREASE_MAX_USES", 10)}
                              title="Decrease Max Uses Limit by -10"
                              style={{
                                width: 28, height: 28, borderRadius: 6, background: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid #EF4444", color: "#EF4444", display: "inline-flex",
                                alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 800
                              }}
                            >
                              <Minus size={14} />
                            </button>

                            <div style={{ flex: 1, textAlign: "center" }}>
                              <span style={{ fontWeight: 800, color: "#F8FAFC", fontSize: "14px" }}>
                                {p.usedCount}
                              </span>
                              <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}> / </span>
                              <span style={{ fontWeight: 800, color: "#00A8B5", fontSize: "14px" }}>
                                {p.maxUses}
                              </span>
                              <span style={{ color: "var(--text-secondary)", fontSize: "12px", marginLeft: 4 }}>uses</span>
                            </div>

                            {/* Increase Max Uses */}
                            <button
                              onClick={() => handleUpdate(p.id, "INCREASE_MAX_USES", 10)}
                              title="Increase Max Uses Limit by +10"
                              style={{
                                width: 28, height: 28, borderRadius: 6, background: "rgba(16, 185, 129, 0.15)",
                                border: "1px solid #10B981", color: "#10B981", display: "inline-flex",
                                alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 800
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          {/* Visual Progress Bar */}
                          <div style={{ width: "100%", height: 6, background: "var(--bg-tertiary)", borderRadius: 3, overflow: "hidden", border: "1px solid var(--border-primary)" }}>
                            <div
                              style={{
                                width: `${percentUsed}%`,
                                height: "100%",
                                background: percentUsed >= 90 ? "#EF4444" : "linear-gradient(90deg, #00A8B5, #38BDF8)",
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Expires */}
                      <td style={{ padding: "16px", color: "var(--text-secondary)" }}>
                        {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No Expiry"}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px" }}>
                        <button
                          onClick={() => handleUpdate(p.id, "TOGGLE_ACTIVE")}
                          className="badge"
                          style={{
                            background: p.isActive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                            color: p.isActive ? "#10B981" : "#EF4444",
                            border: `1px solid ${p.isActive ? "#10B981" : "#EF4444"}`,
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          {p.isActive ? "ACTIVE" : "INACTIVE"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayoutShell>
  );
}
