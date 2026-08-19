"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  ShoppingBag, Store, ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  CreditCard, Package, Truck, Search, Filter, Eye, DollarSign, BarChart3,
  RefreshCw, Award, Clock, ArrowUpRight, Zap
} from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminMarketplacePage() {
  const [activeTab, setActiveTab] = useState<"MERCHANTS" | "SUBSCRIPTIONS" | "CATALOG" | "ANALYTICS">("MERCHANTS");
  const [merchants, setMerchants] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Inspect Merchant Modal
  const [inspectMerchant, setInspectMerchant] = useState<any | null>(null);
  const [auditNotes, setAuditNotes] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [merchRes, subRes, catRes, anaRes] = await Promise.all([
        fetch("/api/admin/marketplace/merchants"),
        fetch("/api/admin/marketplace/subscriptions"),
        fetch("/api/admin/marketplace/catalog"),
        fetch("/api/admin/marketplace/analytics"),
      ]);

      const [merchData, subData, catData, anaData] = await Promise.all([
        merchRes.json(),
        subRes.json(),
        catRes.json(),
        anaRes.json(),
      ]);

      if (merchData.merchants) setMerchants(merchData.merchants);
      if (subData.subscriptions) setSubscriptions(subData.subscriptions);
      if (catData.products) setCatalog(catData.products);
      if (anaData.analytics) {
        setAnalytics(anaData.analytics);
        setRecentOrders(anaData.recentOrders || []);
      }
    } catch (err) {
      console.error("Failed to load admin marketplace data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyMerchant = async (merchantId: string, status: "VERIFIED" | "REJECTED" | "SUSPENDED") => {
    try {
      const res = await fetch(`/api/admin/marketplace/merchants/${merchantId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: auditNotes }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(`Merchant status updated to ${status}! 🎉`);
        setInspectMerchant(null);
        fetchData();
      } else {
        setToast(`Error: ${data.error || "Failed to update merchant"}`);
      }
    } catch {
      setToast("Failed to verify merchant.");
    }
  };

  const handleGrantSubscription = async (merchantId: string) => {
    try {
      const res = await fetch("/api/admin/marketplace/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          grantDays: 30,
          reason: "Administrative Grant / Promotional Extension",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(data.message || "Granted 30 subscription days!");
        fetchData();
      } else {
        setToast(data.error || "Failed to grant subscription");
      }
    } catch {
      setToast("Failed to grant subscription.");
    }
  };

  const handleCatalogAction = async (productId: string, action: "RESOLVE_ANOMALY" | "SUSPEND" | "ACTIVATE") => {
    try {
      const res = await fetch("/api/admin/marketplace/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(data.message || "Product updated successfully!");
        fetchData();
      } else {
        setToast(data.error || "Failed to update product");
      }
    } catch {
      setToast("Failed to update product.");
    }
  };

  return (
    <AdminLayoutShell>
      <div className={styles.adminContainer}>
        {/* Toast Alert */}
        {toast && (
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 99999,
              background: "#0EA5E9",
              color: "#FFFFFF",
              padding: "14px 22px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={18} /> {toast}
          </div>
        )}

        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 className="h2" style={{ margin: "0 0 4px 0", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 10 }}>
              <ShoppingBag size={26} color="#0EA5E9" /> HandyHub Marketplace Command Center
            </h1>
            <p style={{ margin: 0, color: "#94A3B8", fontSize: "14px" }}>
              Oversee verified merchants, monthly subscription compliance, inventory anomaly fraud checks, and logistics delivery performance.
            </p>
          </div>
          <button onClick={fetchData} className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh Live Data
          </button>
        </div>

        {/* Quick KPI Cards */}
        {analytics && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: "28px" }}>
            <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "18px", borderRadius: "12px" }}>
              <span style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Total Marketplace GMV</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#38BDF8", marginTop: 4 }}>
                ₦{analytics.totalGMV?.toLocaleString()}
              </div>
            </div>
            <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "18px", borderRadius: "12px" }}>
              <span style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Active Subscriptions</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#10B981", marginTop: 4 }}>
                {analytics.activeSubscriptions} / {analytics.totalMerchants} Merchants
              </div>
            </div>
            <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "18px", borderRadius: "12px" }}>
              <span style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Price Anomaly Flags</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: analytics.anomaliesCount > 0 ? "#F59E0B" : "#10B981", marginTop: 4 }}>
                {analytics.anomaliesCount} Flagged
              </div>
            </div>
            <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "18px", borderRadius: "12px" }}>
              <span style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Delivery Rate (OTP Confirmed)</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#F8FAFC", marginTop: 4 }}>
                {analytics.deliveryRate}% ({analytics.completedOrders} Orders)
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 10, borderBottom: "1px solid #334155", paddingBottom: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { key: "MERCHANTS", label: `Merchant Approvals (${merchants.length})`, icon: Store },
            { key: "SUBSCRIPTIONS", label: `Subscription Ledger (${subscriptions.length})`, icon: CreditCard },
            { key: "CATALOG", label: `Catalog & Price Anomalies (${catalog.length})`, icon: Package },
            { key: "ANALYTICS", label: "Logistics & Delivery Analytics", icon: BarChart3 },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              style={{
                background: activeTab === t.key ? "#0EA5E9" : "#1E293B",
                color: activeTab === t.key ? "#FFFFFF" : "#94A3B8",
                border: "1px solid",
                borderColor: activeTab === t.key ? "#0EA5E9" : "#334155",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Merchant Verification Table */}
        {activeTab === "MERCHANTS" && (
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                  <th style={{ padding: "12px 16px" }}>Merchant / Business Name</th>
                  <th style={{ padding: "12px 16px" }}>CAC Number</th>
                  <th style={{ padding: "12px 16px" }}>Physical Store Address</th>
                  <th style={{ padding: "12px 16px" }}>Subscription</th>
                  <th style={{ padding: "12px 16px" }}>KYC Status</th>
                  <th style={{ padding: "12px 16px" }}>Audit Actions</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <strong style={{ color: "#F8FAFC", display: "block" }}>{m.businessName}</strong>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>{m.email || m.user?.email} • {m.phone}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#0EA5E9" }}>
                      {m.cacNumber || "NOT_SUBMITTED"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>
                      {m.businessAddress}, {m.city}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="badge" style={{ background: m.subscriptionStatus === "ACTIVE" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: m.subscriptionStatus === "ACTIVE" ? "#10B981" : "#EF4444" }}>
                        {m.subscriptionStatus}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="badge" style={{ background: m.verificationStatus === "VERIFIED" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: m.verificationStatus === "VERIFIED" ? "#10B981" : "#F59E0B" }}>
                        {m.verificationStatus}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => {
                          setInspectMerchant(m);
                          setAuditNotes(m.verificationNotes || "");
                        }}
                        className="btn btn-primary btn-xs"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Eye size={12} /> Audit KYC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Subscription Ledger Table */}
        {activeTab === "SUBSCRIPTIONS" && (
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                  <th style={{ padding: "12px 16px" }}>Merchant Enterprise</th>
                  <th style={{ padding: "12px 16px" }}>Subscription Plan</th>
                  <th style={{ padding: "12px 16px" }}>Monthly Rate</th>
                  <th style={{ padding: "12px 16px" }}>Expiry / Renewal Date</th>
                  <th style={{ padding: "12px 16px" }}>Status & Days Left</th>
                  <th style={{ padding: "12px 16px" }}>Admin Override</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.merchantId} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <strong style={{ color: "#F8FAFC", display: "block" }}>{s.businessName}</strong>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>{s.email}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>{s.subscriptionPlan}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#38BDF8" }}>
                      ₦{s.subscriptionAmount?.toLocaleString()}/mo
                    </td>
                    <td style={{ padding: "12px 16px", color: "#F8FAFC" }}>
                      {s.subscriptionExpiresAt ? new Date(s.subscriptionExpiresAt).toLocaleDateString() : "Never Subscribed"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="badge" style={{ background: !s.isExpired ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: !s.isExpired ? "#10B981" : "#EF4444" }}>
                        {!s.isExpired ? `ACTIVE (${s.daysLeft} days left)` : "EXPIRED"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => handleGrantSubscription(s.merchantId)}
                        className="btn btn-secondary btn-xs"
                        style={{ color: "#10B981", borderColor: "rgba(16,185,129,0.4)", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Award size={12} /> Grant 30 Days 🎁
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Catalog & Price Anomalies */}
        {activeTab === "CATALOG" && (
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                  <th style={{ padding: "12px 16px" }}>Component Title</th>
                  <th style={{ padding: "12px 16px" }}>Supplier</th>
                  <th style={{ padding: "12px 16px" }}>Price</th>
                  <th style={{ padding: "12px 16px" }}>Stock</th>
                  <th style={{ padding: "12px 16px" }}>Anomaly & Status</th>
                  <th style={{ padding: "12px 16px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <strong style={{ color: "#F8FAFC", display: "block" }}>{p.title}</strong>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>SKU: {p.sku}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>{p.merchant?.businessName}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#38BDF8" }}>
                      ₦{p.price.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{p.stockQuantity}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {p.priceAnomalyFlag ? (
                        <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <AlertTriangle size={11} /> Price Anomaly Flagged
                        </span>
                      ) : (
                        <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                          ✓ Clean Benchmark
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {p.priceAnomalyFlag && (
                          <button
                            onClick={() => handleCatalogAction(p.id, "RESOLVE_ANOMALY")}
                            className="btn btn-primary btn-xs"
                            style={{ background: "#10B981" }}
                          >
                            Resolve Flag ✓
                          </button>
                        )}
                        {p.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleCatalogAction(p.id, "SUSPEND")}
                            className="btn btn-secondary btn-xs"
                            style={{ color: "#EF4444" }}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCatalogAction(p.id, "ACTIVATE")}
                            className="btn btn-secondary btn-xs"
                            style={{ color: "#10B981" }}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Logistics & Delivery Analytics */}
        {activeTab === "ANALYTICS" && (
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", color: "#F8FAFC" }}>
              Live Marketplace Procurement Orders & Tracking
            </h3>

            {recentOrders.length === 0 ? (
              <p style={{ color: "#94A3B8", fontSize: "13px" }}>No marketplace orders logged yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                    <th style={{ padding: "10px 14px" }}>Order #</th>
                    <th style={{ padding: "10px 14px" }}>Customer</th>
                    <th style={{ padding: "10px 14px" }}>Amount</th>
                    <th style={{ padding: "10px 14px" }}>Logistics Fee</th>
                    <th style={{ padding: "10px 14px" }}>Status</th>
                    <th style={{ padding: "10px 14px" }}>Live Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid #334155" }}>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#0EA5E9", fontWeight: 700 }}>
                        {o.orderNumber}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {o.customer?.firstName} {o.customer?.lastName}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#38BDF8" }}>
                        ₦{o.totalAmount?.toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 14px" }}>₦{o.logisticsFee?.toLocaleString()}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span className="badge" style={{ background: o.status === "DELIVERED" ? "rgba(16,185,129,0.15)" : "rgba(14,165,233,0.15)", color: o.status === "DELIVERED" ? "#10B981" : "#38BDF8" }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <Link href={`/marketplace/track/${o.orderNumber}`} target="_blank" className="btn btn-secondary btn-xs" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Truck size={12} /> Track 📦
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Inspect Merchant KYC Modal */}
        {inspectMerchant && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(11, 17, 32, 0.85)",
              backdropFilter: "blur(8px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
            }}
            onClick={() => setInspectMerchant(null)}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "540px",
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "16px",
                padding: "26px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "12px", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
                  <Store size={18} color="#0EA5E9" /> Audit Merchant KYC & Business Registration
                </h3>
                <button onClick={() => setInspectMerchant(null)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ marginBottom: "16px", background: "#0F172A", padding: 14, borderRadius: 10, fontSize: "13px" }}>
                <strong style={{ fontSize: "15px", color: "#F8FAFC", display: "block" }}>{inspectMerchant.businessName}</strong>
                <span style={{ color: "#94A3B8", display: "block", marginTop: 4 }}>
                  CAC: <strong style={{ color: "#0EA5E9" }}>{inspectMerchant.cacNumber || "NOT PROVIDED"}</strong>
                </span>
                <span style={{ color: "#94A3B8", display: "block", marginTop: 4 }}>
                  Address: <strong style={{ color: "#CBD5E1" }}>{inspectMerchant.businessAddress}, {inspectMerchant.city}</strong>
                </span>
                <span style={{ color: "#94A3B8", display: "block", marginTop: 4 }}>
                  Settlement Account: <strong style={{ color: "#CBD5E1" }}>{inspectMerchant.bankName} - {inspectMerchant.bankAccount} ({inspectMerchant.accountName})</strong>
                </span>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Compliance Officer Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter audit remarks for verified approval or denial..."
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <button
                  onClick={() => handleVerifyMerchant(inspectMerchant.id, "REJECTED")}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "#EF4444", borderColor: "#EF4444" }}
                >
                  <XCircle size={14} /> Reject Application
                </button>
                <button
                  onClick={() => handleVerifyMerchant(inspectMerchant.id, "VERIFIED")}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#10B981" }}
                >
                  <CheckCircle2 size={14} /> Approve Verified Merchant Badge
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutShell>
  );
}
