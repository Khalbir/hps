"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag, ShieldCheck, Truck, ArrowLeft, Clock,
  CreditCard, CheckCircle2, AlertCircle, MapPin, Zap
} from "lucide-react";

export default function MarketplaceCheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // Reservation Countdown Timer (15 Minutes)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60);

  // Delivery Form
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("Abuja");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PAYSTACK");

  // Calculated Logistics Fee & Dynamic Service Zones
  const [serviceZones, setServiceZones] = useState<any[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [logisticsFee, setLogisticsFee] = useState(1500);
  const [selectedZone, setSelectedZone] = useState("Maitama / Wuse 2 / Central");

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("handyhub_marketplace_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
      }
    } catch {}

    // Load active regions & service zones from DB
    const fetchZones = async () => {
      try {
        const res = await fetch("/api/marketplace/regions");
        const data = await res.json();
        if (res.ok && data.activeRegions?.[0]?.serviceZones) {
          const zones = data.activeRegions[0].serviceZones;
          setServiceZones(zones);
          if (zones.length > 0) {
            setSelectedZoneId(zones[0].id);
            setSelectedZone(zones[0].name);
            setLogisticsFee(zones[0].baseLogisticsFee || 1500);
          }
        }
      } catch (err) {
        console.error("Failed to load active service zones:", err);
      }
    };
    fetchZones();

    // Load active session user if present
    try {
      const userStr = localStorage.getItem("handyhub_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        setCustomerName(`${u.firstName || ""} ${u.lastName || ""}`.trim());
        setCustomerEmail(u.email || "");
        setCustomerPhone(u.phone || "");
        if (u.permanentAddress) setDeliveryAddress(u.permanentAddress);
      }
    } catch {}

    // 15-Minute Countdown Timer
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleZoneSelect = (zone: any) => {
    setSelectedZoneId(zone.id);
    setSelectedZone(zone.name);
    setLogisticsFee(zone.baseLogisticsFee || 1500);
    if (!deliveryAddress) {
      setDeliveryAddress(`${zone.name}, Abuja, FCT`);
    }
  };

  const partsSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const orderTotal = partsSubtotal + logisticsFee;

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryAddress || !customerEmail) {
      setToast("Please fill in your delivery address and contact email.");
      return;
    }

    setLoading(true);
    try {
      const cartSessionId = localStorage.getItem("handyhub_cart_session") || "default_session";
      const payload = {
        cartSessionId,
        procurementType: "DIRECT_PURCHASE",
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        deliveryAddress,
        deliveryCity: "Abuja",
        deliveryState: "FCT",
        serviceZoneId: selectedZoneId,
        customerName,
        customerEmail,
        customerPhone,
        customerNotes,
        paymentMethod,
      };

      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        // Clear cart
        localStorage.removeItem("handyhub_marketplace_cart");
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          router.push(`/marketplace/track/${data.orderNumber}`);
        }
      } else {
        setToast(`Checkout Error: ${data.error || "Failed to process order"}`);
      }
    } catch {
      setToast("Failed to connect to checkout payment gateway.");
    } finally {
      setLoading(false);
    }
  };

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
            background: "#EF4444",
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
          <AlertCircle size={18} /> {toast}
        </div>
      )}

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "30px 20px 80px" }}>
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
          <ArrowLeft size={16} /> Continue Shopping in Catalog
        </Link>

        {/* 15-Minute Reservation Lock Banner */}
        <div
          style={{
            background: timeLeftSeconds > 0 ? "rgba(14,165,233,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${timeLeftSeconds > 0 ? "rgba(14,165,233,0.4)" : "#EF4444"}`,
            borderRadius: "12px",
            padding: "14px 20px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={20} color={timeLeftSeconds > 0 ? "#38BDF8" : "#EF4444"} />
            <div>
              <strong style={{ fontSize: "14px", color: "#F8FAFC" }}>
                {timeLeftSeconds > 0 ? "Inventory Reserved for Checkout" : "Reservation Lock Expired"}
              </strong>
              <span style={{ fontSize: "12px", color: "#94A3B8", display: "block" }}>
                {timeLeftSeconds > 0
                  ? "Parts are locked from other buyers. Complete payment to secure procurement."
                  : "Please refresh your cart to re-reserve available items."}
              </span>
            </div>
          </div>

          <div
            style={{
              background: "#0F172A",
              border: "1px solid #334155",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "18px",
              fontWeight: 800,
              fontFamily: "monospace",
              color: timeLeftSeconds > 60 ? "#38BDF8" : "#EF4444",
            }}
          >
            {formattedTime}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "30px", alignItems: "start" }}>
          {/* Checkout Form */}
          <form onSubmit={handleCheckoutSubmit}>
            <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px 0", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
                <Truck size={18} color="#0EA5E9" /> Delivery Details & Logistics Calculation
              </h2>

              {/* Quick Zone Selector */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: "6px", fontWeight: 700 }}>
                  Select Delivery Zone (Abuja FCT Service Network)
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(serviceZones.length > 0
                    ? serviceZones
                    : [
                        { id: "z1", name: "Maitama / Wuse 2 / Central", baseLogisticsFee: 1500 },
                        { id: "z2", name: "Garki / Asokoro / Guzape", baseLogisticsFee: 1500 },
                        { id: "z3", name: "Jabi / Utako / Jahi", baseLogisticsFee: 1500 },
                        { id: "z4", name: "Gwarinpa / Life Camp", baseLogisticsFee: 2000 },
                        { id: "z5", name: "Apo / Durumi / Lokogoma", baseLogisticsFee: 2000 },
                        { id: "z6", name: "Kubwa / Dutse / Bwari", baseLogisticsFee: 2500 },
                        { id: "z7", name: "Lugbe / Airport Road", baseLogisticsFee: 2500 },
                      ]
                  ).map((z: any) => (
                    <button
                      type="button"
                      key={z.id || z.name}
                      onClick={() => handleZoneSelect(z)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "1px solid",
                        background: selectedZoneId === z.id || selectedZone === z.name ? "#0EA5E9" : "#0F172A",
                        borderColor: selectedZoneId === z.id || selectedZone === z.name ? "#0EA5E9" : "#334155",
                        color: selectedZoneId === z.id || selectedZone === z.name ? "#FFFFFF" : "#94A3B8",
                      }}
                    >
                      {z.name} (₦{(z.baseLogisticsFee || 1500).toLocaleString()})
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Street Address */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Delivery Street Address <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="House number, street, landmark, Abuja"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Full Name <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Recipient name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Phone Number <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Email Address (for Delivery OTP & Receipt) <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Special Delivery Instructions / Landmark Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Opposite the central mosque, call when at the gate"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13px" }}
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 14px 0", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
                <CreditCard size={18} color="#0EA5E9" /> HandyHub Procurement Payment
              </h2>

              <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "16px" }}>
                🔒 <strong>Zero Direct Cash to Merchants/Artisans:</strong> Payment is collected in HandyHub Pro Solutions&apos; Dedicated Procurement Account and disbursed to the merchant only after your 6-digit OTP delivery confirmation.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div
                  onClick={() => setPaymentMethod("PAYSTACK")}
                  style={{
                    background: paymentMethod === "PAYSTACK" ? "rgba(14,165,233,0.15)" : "#0F172A",
                    border: `1px solid ${paymentMethod === "PAYSTACK" ? "#0EA5E9" : "#334155"}`,
                    borderRadius: "10px",
                    padding: "14px",
                    cursor: "pointer",
                  }}
                >
                  <strong style={{ fontSize: "14px", color: "#F8FAFC", display: "block" }}>Paystack Gateway</strong>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>Cards, Bank Transfer, USSD</span>
                </div>

                <div
                  onClick={() => setPaymentMethod("WALLET")}
                  style={{
                    background: paymentMethod === "WALLET" ? "rgba(14,165,233,0.15)" : "#0F172A",
                    border: `1px solid ${paymentMethod === "WALLET" ? "#0EA5E9" : "#334155"}`,
                    borderRadius: "10px",
                    padding: "14px",
                    cursor: "pointer",
                  }}
                >
                  <strong style={{ fontSize: "14px", color: "#F8FAFC", display: "block" }}>HandyHub Wallet</strong>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>Instant Debit from Escrow Wallet</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="btn btn-primary btn-lg"
                style={{
                  width: "100%",
                  marginTop: "20px",
                  background: "#0EA5E9",
                  fontWeight: 800,
                  padding: "14px",
                  borderRadius: "10px",
                }}
              >
                {loading ? "Initializing Procurement..." : `Pay ₦${orderTotal.toLocaleString()} & Confirm Order 🔒`}
              </button>
            </div>
          </form>

          {/* Order Summary Column */}
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "14px", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", color: "#F8FAFC" }}>
              Procurement Summary ({cart.length} items)
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {cart.map((item) => (
                <div key={item.product.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "12.5px", color: "#F8FAFC", display: "block" }}>
                      {item.product.title}
                    </strong>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Qty: {item.quantity}</span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#38BDF8" }}>
                    ₦{(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #334155", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#94A3B8" }}>
                <span>Parts Subtotal:</span>
                <span style={{ color: "#F8FAFC", fontWeight: 600 }}>₦{partsSubtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#94A3B8" }}>
                <span>Logistics Delivery Fee ({selectedZone}):</span>
                <span style={{ color: "#F8FAFC", fontWeight: 600 }}>₦{logisticsFee.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800, color: "#38BDF8", borderTop: "1px solid #334155", paddingTop: "10px" }}>
                <span>Total Amount:</span>
                <span>₦{orderTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
