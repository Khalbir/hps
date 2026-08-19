"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store, ShieldCheck, CreditCard, Package, Truck, AlertTriangle,
  Plus, Edit, Trash2, CheckCircle2, Clock, DollarSign, ArrowUpRight,
  RefreshCw, X, ShieldAlert, BarChart3, MapPin
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MerchantDashboardPage() {
  const [activeTab, setActiveTab] = useState<"INVENTORY" | "ORDERS" | "SUBSCRIPTION">("INVENTORY");
  const [merchant, setMerchant] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Product Add/Edit Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    id: "",
    title: "",
    partNumber: "",
    brand: "",
    price: "",
    compareAtPrice: "",
    stockQuantity: "10",
    compatibility: "Daikin, Panasonic, LG",
    description: "",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const fetchMerchantData = async () => {
    setLoading(true);
    try {
      const merchantId = localStorage.getItem("handyhub_merchant_id");
      const email = localStorage.getItem("handyhub_merchant_email");

      const params = new URLSearchParams();
      if (merchantId) params.set("merchantId", merchantId);
      if (email) params.set("email", email);

      const res = await fetch(`/api/merchant/profile?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.merchant) {
        setMerchant(data.merchant);

        // Fetch products
        const prodRes = await fetch(`/api/merchant/products?merchantId=${data.merchant.id}`);
        const prodData = await prodRes.json();
        if (prodRes.ok) setProducts(prodData.products || []);

        // Fetch orders
        const ordRes = await fetch(`/api/merchant/orders?merchantId=${data.merchant.id}`);
        const ordData = await ordRes.json();
        if (ordRes.ok) setOrders(ordData.orderItems || []);
      }
    } catch (err) {
      console.error("Failed to load merchant data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
  }, []);

  const handleRenewSubscription = async () => {
    if (!merchant) return;
    setSubscribing(true);
    try {
      const res = await fetch("/api/merchant/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: merchant.id,
          email: merchant.email,
          action: "INITIALIZE",
        }),
      });
      const data = await res.json();
      if (res.ok && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setToast(`Subscription Error: ${data.error || "Failed to initialize subscription"}`);
      }
    } catch {
      setToast("Failed to initialize Paystack subscription.");
    } finally {
      setSubscribing(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;
    setSavingProduct(true);

    try {
      const isEdit = !!productForm.id;
      const url = isEdit ? `/api/merchant/products/${productForm.id}` : "/api/merchant/products";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        merchantId: merchant.id,
        title: productForm.title,
        partNumber: productForm.partNumber,
        brand: productForm.brand,
        price: parseFloat(productForm.price),
        compareAtPrice: productForm.compareAtPrice ? parseFloat(productForm.compareAtPrice) : null,
        stockQuantity: parseInt(productForm.stockQuantity, 10),
        compatibility: productForm.compatibility.split(",").map((s) => s.trim()),
        description: productForm.description,
        images: [productForm.imageUrl],
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setToast(isEdit ? "Product updated successfully!" : "Replacement part listed on Marketplace! 🚀");
        setShowProductModal(false);
        fetchMerchantData();
      } else {
        setToast(`Error: ${data.error || "Failed to save product"}`);
      }
    } catch {
      setToast("Failed to save product.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleMarkOrderPacked = async (orderId: string) => {
    try {
      const res = await fetch(`/api/merchant/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "READY_FOR_PICKUP",
          merchantId: merchant?.id,
          notes: "Part packed securely in store. Ready for HandyHub Priority courier pickup.",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast("Order marked Ready for Courier Pickup 📦");
        fetchMerchantData();
      } else {
        setToast(data.error || "Failed to update order status");
      }
    } catch {
      setToast("Failed to update status.");
    }
  };

  const isSubscriptionActive = merchant?.isSubscriptionActive;

  return (
    <div style={{ background: "#0B1120", minHeight: "100vh", color: "#F8FAFC" }}>
      <Header />

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

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "30px 20px 80px" }}>
        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
                {merchant?.businessName || "Merchant Command Center"}
              </h1>
              <span
                className="badge"
                style={{
                  background: merchant?.verificationStatus === "VERIFIED" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                  color: merchant?.verificationStatus === "VERIFIED" ? "#10B981" : "#F59E0B",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {merchant?.verificationStatus || "PENDING AUDIT"}
              </span>
              {merchant?.isGpsVerified && (
                <span
                  className="badge"
                  style={{
                    background: "rgba(14,165,233,0.15)",
                    color: "#38BDF8",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <MapPin size={12} /> GPS Verified Storefront
                </span>
              )}
            </div>
            <span style={{ fontSize: "13px", color: "#94A3B8" }}>
              {merchant?.businessAddress || "Abuja Central, FCT"} • Settlement: {merchant?.bankName || "GTBank"} ({merchant?.bankAccount || "0123984756"})
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                setProductForm({
                  id: "",
                  title: "",
                  partNumber: "",
                  brand: "",
                  price: "",
                  compareAtPrice: "",
                  stockQuantity: "10",
                  compatibility: "Daikin, Panasonic, LG",
                  description: "",
                  imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
                });
                setShowProductModal(true);
              }}
              disabled={!isSubscriptionActive}
              className="btn btn-primary btn-sm"
              style={{ background: "#0EA5E9", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={16} /> List Replacement Part
            </button>
          </div>
        </div>

        {/* Subscription Mandate Banner */}
        <div
          style={{
            background: isSubscriptionActive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${isSubscriptionActive ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.4)"}`,
            borderRadius: "14px",
            padding: "18px 24px",
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <CreditCard size={28} color={isSubscriptionActive ? "#10B981" : "#EF4444"} />
            <div>
              <strong style={{ fontSize: "15px", color: "#F8FAFC", display: "block" }}>
                Monthly Listing Subscription: {isSubscriptionActive ? "ACTIVE (₦15,000/mo)" : "SUBSCRIPTION EXPIRED / INACTIVE"}
              </strong>
              <span style={{ fontSize: "13px", color: "#94A3B8" }}>
                {isSubscriptionActive
                  ? `Valid until ${new Date(merchant.subscriptionExpiresAt).toLocaleDateString()}. Your parts are live on the Marketplace and auto-procurement engine.`
                  : "An active monthly subscription is required to publish inventory and receive customer purchase orders."}
              </span>
            </div>
          </div>

          <button
            onClick={handleRenewSubscription}
            disabled={subscribing}
            className="btn btn-primary btn-sm"
            style={{
              background: isSubscriptionActive ? "#10B981" : "#EF4444",
              fontWeight: 800,
              padding: "10px 18px",
            }}
          >
            {subscribing ? "Connecting Paystack..." : isSubscriptionActive ? "Renew / Extend 30 Days (₦15,000) 💳" : "Pay Monthly Subscription (₦15,000) 💳"}
          </button>
        </div>

        {/* KPI Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: "28px" }}>
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "12px", padding: "18px" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Listed Replacement Parts</span>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#38BDF8", marginTop: 4 }}>{products.length}</div>
          </div>
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "12px", padding: "18px" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Pending Orders to Pack</span>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#F59E0B", marginTop: 4 }}>
              {orders.filter((o) => o.orderStatus === "PENDING_PAYMENT" || o.orderStatus === "PROCESSING").length}
            </div>
          </div>
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "12px", padding: "18px" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Total Completed Sales</span>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#10B981", marginTop: 4 }}>
              {orders.filter((o) => o.orderStatus === "DELIVERED").length}
            </div>
          </div>
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "12px", padding: "18px" }}>
            <span style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Disbursed Payout Total</span>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#F8FAFC", marginTop: 4 }}>
              ₦{orders.reduce((s, o) => s + (o.merchantPayoutStatus === "DISBURSED" ? o.merchantPayoutAmount : 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 10, borderBottom: "1px solid #334155", paddingBottom: 12, marginBottom: 24 }}>
          {[
            { key: "INVENTORY", label: `Product Inventory (${products.length})`, icon: Package },
            { key: "ORDERS", label: `Fulfillment & Orders (${orders.length})`, icon: Truck },
            { key: "SUBSCRIPTION", label: "Subscription History & Invoices", icon: CreditCard },
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

        {/* Tab 1: Inventory Table */}
        {activeTab === "INVENTORY" && (
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: 0, overflow: "hidden" }}>
            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>
                <Package size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3>No Replacement Parts Listed Yet</h3>
                <p style={{ fontSize: "13px" }}>Click &quot;List Replacement Part&quot; above to publish your first verified component.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                    <th style={{ padding: "12px 16px" }}>Part Title & Brand</th>
                    <th style={{ padding: "12px 16px" }}>SKU / Part #</th>
                    <th style={{ padding: "12px 16px" }}>Price</th>
                    <th style={{ padding: "12px 16px" }}>Stock Qty</th>
                    <th style={{ padding: "12px 16px" }}>Compliance & Anomaly Status</th>
                    <th style={{ padding: "12px 16px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #334155" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <strong style={{ color: "#F8FAFC", display: "block" }}>{p.title}</strong>
                        <span style={{ fontSize: "12px", color: "#94A3B8" }}>Brand: {p.brand || "OEM Certified"}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#0EA5E9" }}>
                        {p.sku} {p.partNumber ? `(${p.partNumber})` : ""}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#38BDF8" }}>
                        ₦{p.price.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="badge" style={{ background: p.stockQuantity > 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: p.stockQuantity > 0 ? "#10B981" : "#EF4444" }}>
                          {p.stockQuantity} in stock
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {p.priceAnomalyFlag ? (
                          <span className="badge" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <AlertTriangle size={11} /> Flagged Price Anomaly
                          </span>
                        ) : (
                          <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                            ✓ Verified Active
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => {
                            setProductForm({
                              id: p.id,
                              title: p.title,
                              partNumber: p.partNumber || "",
                              brand: p.brand || "",
                              price: p.price.toString(),
                              compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toString() : "",
                              stockQuantity: p.stockQuantity.toString(),
                              compatibility: typeof p.compatibility === "string" ? p.compatibility : (p.compatibility || []).join(", "),
                              description: p.description || "",
                              imageUrl: p.images?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
                            });
                            setShowProductModal(true);
                          }}
                          className="btn btn-secondary btn-xs"
                          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <Edit size={12} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Orders Fulfillment */}
        {activeTab === "ORDERS" && (
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: 0, overflow: "hidden" }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>
                <Truck size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3>No Customer Orders Received Yet</h3>
                <p style={{ fontSize: "13px" }}>Incoming replacement part orders will appear here for packing and courier dispatch.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                    <th style={{ padding: "12px 16px" }}>Order #</th>
                    <th style={{ padding: "12px 16px" }}>Ordered Component</th>
                    <th style={{ padding: "12px 16px" }}>Customer & Destination</th>
                    <th style={{ padding: "12px 16px" }}>Payout Amount</th>
                    <th style={{ padding: "12px 16px" }}>Payout Status</th>
                    <th style={{ padding: "12px 16px" }}>Dispatch Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid #334155" }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#0EA5E9", fontWeight: 700 }}>
                        {o.orderNumber}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <strong style={{ color: "#F8FAFC", display: "block" }}>{o.productName}</strong>
                        <span style={{ fontSize: "12px", color: "#94A3B8" }}>Qty: {o.quantity} • SKU: {o.sku}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <strong style={{ color: "#F8FAFC", display: "block" }}>{o.customerName}</strong>
                        <span style={{ fontSize: "12px", color: "#94A3B8" }}>{o.deliveryAddress} ({o.deliveryCity})</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#38BDF8" }}>
                        ₦{o.merchantPayoutAmount.toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          className="badge"
                          style={{
                            background: o.merchantPayoutStatus === "DISBURSED" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                            color: o.merchantPayoutStatus === "DISBURSED" ? "#10B981" : "#F59E0B",
                          }}
                        >
                          {o.merchantPayoutStatus === "DISBURSED" ? "✓ DISBURSED TO BANK" : "🔒 ESCROW HOLD (OTP PENDING)"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {o.orderStatus === "PROCESSING" || o.orderStatus === "PENDING_PAYMENT" ? (
                          <button
                            onClick={() => handleMarkOrderPacked(o.orderId)}
                            className="btn btn-primary btn-xs"
                            style={{ background: "#0EA5E9" }}
                          >
                            Mark Packed 📦
                          </button>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#94A3B8" }}>{o.orderStatus}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Subscription History */}
        {activeTab === "SUBSCRIPTION" && (
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", color: "#F8FAFC" }}>
              Monthly Billing Plan & Invoices
            </h3>
            <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "15px", color: "#F8FAFC" }}>Standard Verified Supplier Subscription</strong>
                  <span style={{ fontSize: "12px", color: "#94A3B8", display: "block" }}>₦15,000 billed every 30 days via Paystack Automated Gateway</span>
                </div>
                <button
                  onClick={handleRenewSubscription}
                  disabled={subscribing}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#0EA5E9", fontWeight: 700 }}
                >
                  {subscribing ? "Connecting..." : "Renew 30 Days 💳"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Add/Edit Modal */}
      {showProductModal && (
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
          onClick={() => setShowProductModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "26px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
                <Package size={18} color="#0EA5E9" /> {productForm.id ? "Edit Replacement Part" : "List New Replacement Part"}
              </h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Part Title <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daikin 1.5HP AC Rotary Compressor R410A"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  required
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Daikin, Schneider, Havells"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Part / Model Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2YC23V110"
                    value={productForm.partNumber}
                    onChange={(e) => setProductForm({ ...productForm, partNumber: e.target.value })}
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Price (₦ NGN) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 85000"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Stock Quantity Available <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                    required
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Compatible Models & Brands (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daikin FT15, Panasonic Inverter, LG 1.5HP"
                  value={productForm.compatibility}
                  onChange={(e) => setProductForm({ ...productForm, compatibility: e.target.value })}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Component Description & Technical Specs
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide technical details, voltage, material specs..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#0EA5E9", fontWeight: 700 }}
                >
                  {savingProduct ? "Saving..." : "Save & Publish Part 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
