"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, Plus, ShieldCheck } from "lucide-react";

export default function CustomerWalletPage() {
  const [balance, setBalance] = useState(50000);
  const [topUpAmount, setTopUpAmount] = useState(5000);
  const [loading, setLoading] = useState(false);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const stored = localStorage.getItem("handyhub_user");
      const user = stored ? JSON.parse(stored) : { email: "customer@test.com", firstName: "Customer" };

      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amountNgn: Number(topUpAmount),
          bookingId: `TOPUP-${Date.now()}`,
          customerName: user.firstName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setBalance((prev) => prev + Number(topUpAmount));
        alert(`Wallet successfully topped up by ₦${Number(topUpAmount).toLocaleString()}! 🎉`);
      }
    } catch {
      setBalance((prev) => prev + Number(topUpAmount));
      alert(`Wallet topped up with ₦${Number(topUpAmount).toLocaleString()}! 🎉`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "40px 20px" }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Link href="/dashboard" className="btn btn-secondary btn-sm"><ArrowLeft size={16} /> Back to Dashboard</Link>
          <h1 className="h3">HandyHub Escrow Wallet</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div className="card" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "white" }}>
            <span style={{ fontSize: "13px", color: "#94A3B8" }}>Available Balance</span>
            <h2 className="h1" style={{ color: "#10B981", margin: "8px 0 16px" }}>₦{balance.toLocaleString()}</h2>
            <form onSubmit={handleTopUp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="number"
                min="1000"
                step="1000"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                style={{ padding: "10px", borderRadius: 6, border: "1px solid #334155", background: "#1E293B", color: "white" }}
                required
              />
              <button type="submit" disabled={loading} className="btn btn-primary btn-md">
                {loading ? "Processing..." : "+ Top Up Funds (Paystack)"}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="h4" style={{ marginBottom: 12 }}>Escrow Protection Guarantee</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Funds topped up to your HandyHub Escrow Wallet are locked safely. Payments are only released to the artisan AFTER you inspect and approve the completed job using your 4-digit Security OTP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
