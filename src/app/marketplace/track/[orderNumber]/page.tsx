"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Truck, ShieldCheck, CheckCircle2, Clock, MapPin, Phone,
  Package, AlertCircle, RefreshCw, KeyRound, ArrowLeft
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderNumber = params?.orderNumber as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState("");
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [toast, setToast] = useState("");

  const fetchOrder = async () => {
    if (!orderNumber) return;
    try {
      const res = await fetch(`/api/marketplace/orders/${orderNumber}?_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      }
    } catch (err) {
      console.error("Failed to fetch order tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000); // Polling every 15s for live dispatch updates
    return () => clearInterval(interval);
  }, [orderNumber]);

  const handleConfirmDelivery = async () => {
    if (!otpInput || otpInput.trim().length !== 6) {
      setToast("Please enter the complete 6-digit delivery PIN.");
      return;
    }

    setSubmittingOtp(true);
    try {
      const res = await fetch(`/api/marketplace/orders/${order.id}/confirm-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpInput.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast("Delivery confirmed & merchant payout disbursed! 🎉");
        fetchOrder();
      } else {
        setToast(`Error: ${data.error || "Failed to verify PIN"}`);
      }
    } catch {
      setToast("Failed to verify delivery PIN.");
    } finally {
      setSubmittingOtp(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#0B1120", minHeight: "100vh", color: "#F8FAFC" }}>
        <Header />
        <div style={{ textAlign: "center", padding: "120px 20px" }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <p>Loading real-time dispatch tracking...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ background: "#0B1120", minHeight: "100vh", color: "#F8FAFC" }}>
        <Header />
        <div style={{ textAlign: "center", padding: "120px 20px" }}>
          <AlertCircle size={40} color="#EF4444" style={{ margin: "0 auto 12px" }} />
          <h2>Order Not Found</h2>
          <p style={{ color: "#94A3B8" }}>We could not find an active procurement order with ID {orderNumber}.</p>
          <Link href="/marketplace" className="btn btn-primary" style={{ marginTop: 20 }}>
            Back to Marketplace
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const milestones = [
    { key: "PENDING_PAYMENT", label: "Order Placed", desc: "Awaiting payment settlement" },
    { key: "PROCESSING", label: "Merchant Packing", desc: "Supplier verifying & packing OEM part" },
    { key: "READY_FOR_PICKUP", label: "Dispatch Allocated", desc: "HandyHub courier en-route to store" },
    { key: "IN_TRANSIT", label: "Out for Delivery", desc: "Courier transporting to your address" },
    { key: "DELIVERED", label: "Delivery Confirmed", desc: "Authenticated via 6-digit OTP PIN" },
  ];

  const getStatusIndex = (st: string) => {
    switch (st) {
      case "PENDING_PAYMENT": return 0;
      case "PROCESSING":
      case "PAID": return 1;
      case "READY_FOR_PICKUP": return 2;
      case "IN_TRANSIT": return 3;
      case "DELIVERED": return 4;
      default: return 1;
    }
  };

  const currentIdx = getStatusIndex(order.status);

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

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "30px 20px 80px" }}>
        <Link
          href="/marketplace"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#94A3B8",
            textDecoration: "none",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>

        {/* Order Header Card */}
        <div
          className="card"
          style={{
            background: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "#F8FAFC" }}>
                Order #{order.orderNumber}
              </h1>
              <span
                className="badge"
                style={{
                  background: order.status === "DELIVERED" ? "rgba(16,185,129,0.15)" : "rgba(14,165,233,0.15)",
                  color: order.status === "DELIVERED" ? "#10B981" : "#38BDF8",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {order.status}
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "#94A3B8" }}>
              Tracking ID: <strong style={{ color: "#38BDF8", fontFamily: "monospace" }}>{order.trackingNumber}</strong> • Placed {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Delivery OTP Security PIN Box */}
          <div
            style={{
              background: "#0F172A",
              border: "1px solid rgba(14,165,233,0.3)",
              borderRadius: "12px",
              padding: "12px 18px",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
              <KeyRound size={12} color="#0EA5E9" /> Customer Delivery OTP
            </div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#38BDF8", fontFamily: "monospace", letterSpacing: "2px" }}>
              {order.deliveryOtp || "384920"}
            </div>
            <span style={{ fontSize: "10.5px", color: "#64748B" }}>Share with rider upon receiving part</span>
          </div>
        </div>

        {/* Visual Logistics Pipeline */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "28px", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 24px 0", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
            <Truck size={18} color="#0EA5E9" /> Live Dispatch & Delivery Status
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, position: "relative" }}>
            {milestones.map((m, idx) => {
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div
                  key={m.key}
                  style={{
                    background: isCurrent ? "rgba(14,165,233,0.15)" : isPast ? "#0F172A" : "rgba(15,23,42,0.5)",
                    border: `1px solid ${isCurrent ? "#0EA5E9" : isPast ? "#10B981" : "#334155"}`,
                    borderRadius: "10px",
                    padding: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    {isPast ? (
                      <CheckCircle2 size={16} color="#10B981" />
                    ) : isCurrent ? (
                      <Clock size={16} color="#0EA5E9" className="animate-pulse" />
                    ) : (
                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #64748B" }} />
                    )}
                    <strong style={{ fontSize: "12px", color: isCurrent ? "#38BDF8" : isPast ? "#10B981" : "#94A3B8" }}>
                      {m.label}
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#64748B" }}>{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive OTP Delivery Confirmation Box */}
        {order.status !== "DELIVERED" && (
          <div
            className="card"
            style={{
              background: "linear-gradient(90deg, #1E293B 0%, #0F172A 100%)",
              border: "1px solid rgba(16,185,129,0.4)",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0", color: "#10B981", display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={18} /> Confirm Replacement Part Delivery
            </h3>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "16px" }}>
              Once you inspect and receive the replacement part from the dispatch rider, enter the 6-digit confirmation PIN below to complete the procurement and authorize supplier disbursement.
            </p>

            <div style={{ display: "flex", gap: 12, maxWidth: "420px" }}>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-Digit PIN (e.g. 384920)"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                style={{
                  flex: 1,
                  background: "#0F172A",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  color: "#F8FAFC",
                  fontSize: "16px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                }}
              />
              <button
                onClick={handleConfirmDelivery}
                disabled={submittingOtp || otpInput.trim().length !== 6}
                className="btn btn-primary"
                style={{ background: "#10B981", fontWeight: 800, whiteSpace: "nowrap" }}
              >
                {submittingOtp ? "Verifying..." : "Confirm Delivery & Release Payout ✓"}
              </button>
            </div>
          </div>
        )}

        {/* Order Items & Destination Account Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
          {/* Items Card */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 14px 0", color: "#F8FAFC" }}>
              Procured Replacement Parts ({order.items.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {order.items.map((item: any) => (
                <div key={item.id} style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "13px", color: "#F8FAFC", display: "block" }}>{item.product.title}</strong>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Supplier: {item.merchant.businessName} • Qty: {item.quantity}</span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#38BDF8" }}>
                    ₦{item.totalPrice.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #334155", paddingTop: 12, marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#94A3B8" }}>Logistics Fee:</span>
              <span style={{ color: "#F8FAFC", fontWeight: 600 }}>₦{order.logisticsFee.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 800, color: "#38BDF8", marginTop: 6 }}>
              <span>Total Paid:</span>
              <span>₦{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Delivery & Security Info Card */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 14px 0", color: "#F8FAFC" }}>
              Delivery Destination & Compliance
            </h3>

            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                Delivery Address
              </span>
              <p style={{ fontSize: "13px", color: "#CBD5E1", margin: "2px 0 0 0" }}>{order.deliveryAddress}</p>
            </div>

            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                Dedicated Procurement Account
              </span>
              <p style={{ fontSize: "12px", color: "#10B981", margin: "2px 0 0 0", fontWeight: 600 }}>
                ✓ {order.destinationAccount} (Decoupled from Service Escrow)
              </p>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                Dispatch Courier
              </span>
              <p style={{ fontSize: "13px", color: "#CBD5E1", margin: "2px 0 0 0" }}>
                {order.deliveryPartner || "HandyHub Priority Dispatch"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
