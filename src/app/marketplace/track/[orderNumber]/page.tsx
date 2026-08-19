"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Truck, ShieldCheck, CheckCircle2, Clock, MapPin, Phone,
  Package, AlertCircle, RefreshCw, KeyRound, ArrowLeft, AlertTriangle, X, ShieldAlert
} from "lucide-react";

export default function OrderTrackingPage() {
  const params = useParams();
  const orderNumber = params?.orderNumber as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState("");
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [toast, setToast] = useState("");

  // Dispute Filing State
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("DAMAGED_IN_TRANSIT");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputePhotoUrl, setDisputePhotoUrl] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

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

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeDescription.trim()) {
      setToast("Please describe the issue with your replacement part.");
      return;
    }

    setSubmittingDispute(true);
    try {
      const res = await fetch("/api/marketplace/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          customerId: order.customerId,
          reason: disputeReason,
          description: disputeDescription.trim(),
          evidencePhotos: disputePhotoUrl ? [disputePhotoUrl] : [],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast("Dispute opened. Merchant payout has been held in escrow ⚠️");
        setShowDisputeModal(false);
        fetchOrder();
      } else {
        setToast(data.error || "Failed to submit dispute");
      }
    } catch {
      setToast("Failed to submit dispute claim.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#0B1120", minHeight: "100vh", color: "#F8FAFC" }}>
        <div style={{ textAlign: "center", padding: "120px 20px" }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <p>Loading real-time dispatch tracking...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ background: "#0B1120", minHeight: "100vh", color: "#F8FAFC" }}>
        <div style={{ textAlign: "center", padding: "120px 20px" }}>
          <AlertCircle size={40} color="#EF4444" style={{ margin: "0 auto 12px" }} />
          <h2>Order Not Found</h2>
          <p style={{ color: "#94A3B8" }}>We could not find an active procurement order with ID {orderNumber}.</p>
          <Link href="/marketplace" className="btn btn-primary" style={{ marginTop: 20 }}>
            Back to Marketplace
          </Link>
        </div>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "#F8FAFC" }}>
                Procured Replacement Parts ({order.items.length})
              </h3>
              {order.status !== "DISPUTED" && order.status !== "REFUNDED" && (
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="btn btn-secondary btn-xs"
                  style={{ color: "#F59E0B", borderColor: "rgba(245,158,11,0.4)", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <AlertTriangle size={12} /> Report Issue / Dispute
                </button>
              )}
            </div>

            {order.status === "DISPUTED" && (
              <div
                style={{
                  background: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.4)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "14px",
                  fontSize: "12.5px",
                  color: "#FCD34D",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>
                  <strong>Dispute Under Review:</strong> Merchant payout has been held in HandyHub Procurement Escrow while our compliance team investigates.
                </span>
              </div>
            )}

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

      {/* Customer Dispute Filing Modal */}
      {showDisputeModal && (
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
          onClick={() => setShowDisputeModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "26px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={18} color="#F59E0B" /> Report an Issue / Open Dispute
              </h3>
              <button onClick={() => setShowDisputeModal(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Dispute Reason <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
                >
                  <option value="DAMAGED_IN_TRANSIT">Part Damaged During Delivery Transit</option>
                  <option value="ITEM_NOT_AS_DESCRIBED">Part Does Not Match Ordered Specifications</option>
                  <option value="WRONG_PART_DELIVERED">Wrong Brand / Model Received</option>
                  <option value="MISSING_COMPONENTS">Missing Components / Accessories</option>
                  <option value="MERCHANT_UNRESPONSIVE">Merchant Unresponsive / Defective Part</option>
                  <option value="OTHER">Other Compliance Issue</option>
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Describe the Issue in Detail <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain what is wrong with the replacement component..."
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  required
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13px" }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Photo Evidence URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={disputePhotoUrl}
                  onChange={(e) => setDisputePhotoUrl(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={() => setShowDisputeModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#EF4444", fontWeight: 700 }}
                >
                  {submittingDispute ? "Submitting Claim..." : "Submit Dispute & Freeze Payout 🔒"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
