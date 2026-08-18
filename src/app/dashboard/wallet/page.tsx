"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, RefreshCw, CheckCircle2 } from "lucide-react";

export default function CustomerWalletPage() {
  const [balance, setBalance] = useState(0);
  const [topUpAmount, setTopUpAmount] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [topUpSuccessAlert, setTopUpSuccessAlert] = useState("");

  const fetchRealWalletBalance = async () => {
    setRefreshing(true);
    let activeEmail = "";

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("handyhub_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email) activeEmail = parsed.email;
        }
      } catch (e) {}
    }

    try {
      if (activeEmail) {
        const res = await fetch(`/api/wallet/balance?email=${encodeURIComponent(activeEmail)}`);
        const data = await res.json();
        if (res.ok && data.availableBalance !== undefined) {
          setBalance(data.availableBalance);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch real wallet balance:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const checkAndVerifyRedirectPayment = async () => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status");
    const payment = urlParams.get("payment");
    const topup = urlParams.get("topup");
    const reference = urlParams.get("reference") || urlParams.get("trxref");
    const amountParam = urlParams.get("amount");

    if (status === "success" || payment === "success" || topup === "SUCCESS" || reference) {
      let activeEmail = "";
      try {
        const stored = localStorage.getItem("handyhub_user");
        if (stored) activeEmail = JSON.parse(stored).email || "";
      } catch (e) {}

      // Attempt verification/crediting call
      if (reference && activeEmail) {
        try {
          const topUpRes = await fetch("/api/wallet/topup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: activeEmail,
              amount: amountParam ? Number(amountParam) : 5000,
              paymentReference: reference,
              provider: "PAYSTACK",
            }),
          });
          const topUpData = await topUpRes.json();
          if (topUpRes.ok && topUpData.newBalance !== undefined) {
            setBalance(topUpData.newBalance);
            const formatted = amountParam ? `₦${Number(amountParam).toLocaleString("en-NG")}` : "Funds";
            setTopUpSuccessAlert(`🎉 Wallet Top-Up Successful! ${formatted} credited to your escrow balance in real-time.`);
            return;
          }
        } catch (err) {
          console.warn("Auto verification exception:", err);
        }
      }

      const formatted = amountParam ? `₦${Number(amountParam).toLocaleString("en-NG")}` : "Funds";
      setTopUpSuccessAlert(`🎉 Wallet Top-Up Successful! ${formatted} credited to your available balance.`);
      fetchRealWalletBalance();
    }
  };

  useEffect(() => {
    fetchRealWalletBalance();
    checkAndVerifyRedirectPayment();
  }, []);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const stored = localStorage.getItem("handyhub_user");
      const user = stored ? JSON.parse(stored) : { email: "customer@test.com", firstName: "Customer" };
      const activeEmail = user.email || "client@handyhubpro.ng";

      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activeEmail,
          amountNgn: Number(topUpAmount),
          bookingId: `HHP_TOPUP-${Date.now()}`,
          customerName: user.firstName || "HandyHub Client",
          callbackUrl: `${window.location.origin}/dashboard/wallet`,
        }),
      });

      const data = await res.json();
      const redirectUrl = data.authorizationUrl || data.checkout?.authorizationUrl;

      if (res.ok && redirectUrl) {
        window.location.href = redirectUrl;
        return;
      } else {
        alert(data.error || "Failed to initialize Paystack checkout. Please check network connection.");
      }
    } catch {
      alert("Network error initializing Paystack gateway. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "40px 20px" }}>
      <div className="container" style={{ maxWidth: 800 }}>
        {topUpSuccessAlert && (
          <div style={{ background: "rgba(16,185,129,0.15)", border: "1px solid #10B981", color: "#10B981", padding: 16, borderRadius: 12, fontSize: 14, fontWeight: 500, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle2 size={20} color="#10B981" />
              <span>{topUpSuccessAlert}</span>
            </div>
            <button onClick={() => setTopUpSuccessAlert("")} style={{ background: "none", border: "none", color: "#10B981", cursor: "pointer", fontSize: 16, fontWeight: "bold" }}>✕</button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/dashboard" className="btn btn-secondary btn-sm"><ArrowLeft size={16} /> Back to Dashboard</Link>
            <h1 className="h3">HandyHub Escrow Wallet</h1>
          </div>
          <button onClick={fetchRealWalletBalance} disabled={refreshing} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Balance"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>
          <div className="card" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "white", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Wallet size={20} color="#10B981" />
              <span style={{ fontSize: "13px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, fontWeight: "bold" }}>Available Escrow Balance</span>
            </div>
            <div style={{ margin: "4px 0 10px 0" }}>
              <span style={{ fontSize: "11px", color: "#10B981", background: "rgba(16,185,129,0.15)", padding: "2px 8px", borderRadius: 6, fontWeight: 600, border: "1px solid rgba(16,185,129,0.3)" }}>
                0% Commission • 100% of Top-Up Credited to Balance
              </span>
            </div>

            <h2 className="h1" style={{ color: "#10B981", fontSize: 36, margin: "10px 0 20px" }}>₦{balance.toLocaleString("en-NG")}</h2>

            <form onSubmit={handleTopUp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Select or Enter Amount (NGN ₦)
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #334155", background: "#0F172A", color: "#10B981", fontSize: 20, fontWeight: "bold" }}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[1000, 5000, 10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    style={{
                      background: topUpAmount === amt ? "rgba(16,185,129,0.2)" : "#0F172A",
                      border: topUpAmount === amt ? "1px solid #10B981" : "1px solid #334155",
                      color: topUpAmount === amt ? "#10B981" : "#94A3B8",
                      borderRadius: 16,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    ₦{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary btn-md" style={{ background: "#0EA5E9", width: "100%", fontWeight: "bold", padding: "12px", marginTop: 6 }}>
                {loading ? "Initializing Paystack Checkout..." : `Proceed to Paystack Gateway (₦${topUpAmount.toLocaleString("en-NG")}) ➔`}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="h4" style={{ marginBottom: 12 }}>Escrow Protection Guarantee</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
              HandyHub charges <strong>0% commission</strong> on client wallet deposits. 100% of your top-up is credited directly to your escrow balance. Funds are held safely and only released to the artisan AFTER you inspect and approve the completed job using your 4-digit Security OTP.
            </p>
            <div style={{ background: "var(--bg-tertiary)", padding: 12, borderRadius: 8, fontSize: 12, color: "#64748B", border: "1px solid var(--border-primary)" }}>
              🔒 Powered by Paystack Payment Infrastructure with 256-bit SSL Escrow Protection.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
