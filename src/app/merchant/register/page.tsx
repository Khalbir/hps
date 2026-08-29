"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store, ShieldCheck, CreditCard, ArrowRight, CheckCircle2,
  AlertCircle, Building2, MapPin, Phone, Mail, Lock
} from "lucide-react";
import { useActiveStates } from "@/hooks/useActiveStates";

export default function MerchantRegisterPage() {
  const router = useRouter();
  const { activeStates } = useActiveStates();
  const [form, setForm] = useState({
    businessName: "",
    contactFirstName: "",
    contactLastName: "",
    email: "",
    phone: "",
    password: "",
    cacNumber: "",
    businessAddress: "",
    city: "Abuja",
    state: "FCT",
    bankName: "Guaranty Trust Bank",
    bankAccount: "",
    accountName: "",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/merchant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.merchant) {
        localStorage.setItem("handyhub_merchant_id", data.merchant.id);
        localStorage.setItem("handyhub_merchant_email", form.email);
        setToast("Merchant profile registered! Redirecting to subscription setup...");
        setTimeout(() => router.push("/merchant/dashboard"), 1200);
      } else {
        setToast(`Error: ${data.error || "Failed to register merchant"}`);
      }
    } catch {
      setToast("Failed to connect to merchant registration server.");
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

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "50px 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(14, 165, 233, 0.15)",
              border: "1px solid rgba(14, 165, 233, 0.3)",
              padding: "6px 16px",
              borderRadius: "30px",
              color: "#38BDF8",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            <Store size={16} /> Verified Supplier Network Onboarding
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px 0" }}>
            Become a HandyHub Verified Merchant
          </h1>
          <p style={{ fontSize: "14px", color: "#94A3B8" }}>
            Sell authentic replacement parts directly to thousands of homeowners, commercial clients, and artisans across Abuja.
          </p>
        </div>

        {/* Subscription Mandate Notice */}
        <div
          style={{
            background: "#1E293B",
            border: "1px solid rgba(14,165,233,0.3)",
            borderRadius: "14px",
            padding: "18px 22px",
            marginBottom: "24px",
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          <CreditCard size={28} color="#38BDF8" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: "14px", color: "#F8FAFC", display: "block" }}>
              Monthly Verified Merchant Subscription: ₦15,000 / Month
            </strong>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>
              Merchants must pass CAC/store audit and maintain an active monthly subscription before product listings are published or matched for HandyHub Smart Select auto-procurement.
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="card" style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "28px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={18} color="#0EA5E9" /> Business & Physical Store Details
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Business / Enterprise Name <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Abuja Central Electro & AC Hub"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                required
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                CAC Registration Number (Optional)
              </label>
              <input
                type="text"
                placeholder="RC-1928472 or BN-829103"
                value={form.cacNumber}
                onChange={(e) => setForm({ ...form, cacNumber: e.target.value })}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Operating State <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px", cursor: "pointer" }}
              >
                {activeStates.map((st) => (
                  <option key={st.code} value={st.name}>{st.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                City / Commercial District <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Wuse 2, Ikeja, Bodija"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
              Physical Store / Warehouse Street Address <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Shop / Plot Number, Street Name, Commercial Plaza"
              value={form.businessAddress}
              onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
              required
              style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Official Email Address <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="email"
                placeholder="contact@supplies.ng"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Phone Number (WhatsApp Dispatch) <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="tel"
                placeholder="+234 803 000 0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
              Merchant Portal Password <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="password"
              placeholder="Create secure password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13.5px" }}
            />
          </div>

          {/* Settlement Bank Details */}
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "24px 0 14px 0", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid #334155", paddingTop: "18px" }}>
            <CreditCard size={18} color="#10B981" /> Bank Settlement Account (For Direct Order Payouts)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
            <div>
              <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Bank Name
              </label>
              <input
                type="text"
                placeholder="e.g. Zenith Bank"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Account Number
              </label>
              <input
                type="text"
                placeholder="10-digit NUBAN"
                value={form.bankAccount}
                onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Account Name
              </label>
              <input
                type="text"
                placeholder="Registered Account Name"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "8px 10px", color: "#F8FAFC", fontSize: "13px" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: "100%", background: "#0EA5E9", fontWeight: 800, padding: "14px", borderRadius: "10px" }}
          >
            {loading ? "Registering Merchant Profile..." : "Create Verified Merchant Account & Subscribe 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}
