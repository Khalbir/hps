"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, Wrench, CheckCircle2, ShoppingBag, ArrowLeft,
  Truck, Star, RefreshCw, AlertCircle, Check, MapPin, Phone
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reserving, setReserving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/marketplace/products/${slug}`);
        const data = await res.json();
        if (res.ok && data.product) {
          setProduct(data.product);
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    setReserving(true);

    try {
      let cartSessionId = localStorage.getItem("handyhub_cart_session");
      if (!cartSessionId) {
        cartSessionId = `SESS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem("handyhub_cart_session", cartSessionId);
      }

      const res = await fetch("/api/marketplace/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          cartSessionId,
          quantity: 1,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Save to cart
        let cart = [];
        try {
          const saved = localStorage.getItem("handyhub_marketplace_cart");
          if (saved) cart = JSON.parse(saved);
        } catch {}

        const idx = cart.findIndex((i: any) => i.product.id === product.id);
        if (idx > -1) {
          cart[idx].quantity += 1;
        } else {
          cart.push({ product, quantity: 1 });
        }
        localStorage.setItem("handyhub_marketplace_cart", JSON.stringify(cart));

        setToast("Item added to cart & reserved for 15 minutes! 🛒");
        setTimeout(() => router.push("/marketplace/checkout"), 1000);
      } else {
        setToast(`Error: ${data.error || "Failed to reserve item stock"}`);
      }
    } catch {
      setToast("Failed to connect to marketplace server.");
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#0B1120", minHeight: "100vh", color: "#F8FAFC" }}>
        <Header />
        <div style={{ textAlign: "center", padding: "120px 20px" }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <p>Loading part specifications & merchant verification...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ background: "#0B1120", minHeight: "100vh", color: "#F8FAFC" }}>
        <Header />
        <div style={{ textAlign: "center", padding: "120px 20px" }}>
          <AlertCircle size={40} color="#EF4444" style={{ margin: "0 auto 12px" }} />
          <h2>Replacement Part Not Found</h2>
          <p style={{ color: "#94A3B8" }}>The requested component may have been de-listed or out of stock.</p>
          <Link href="/marketplace" className="btn btn-primary" style={{ marginTop: 20 }}>
            Back to Marketplace Catalog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

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
        <Link
          href="/marketplace"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#94A3B8",
            textDecoration: "none",
            fontSize: "14px",
            marginBottom: "24px",
          }}
        >
          <ArrowLeft size={16} /> Back to Replacement Parts Catalog
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
          {/* Gallery Column */}
          <div>
            <div
              style={{
                height: "380px",
                background: "#1E293B",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid #334155",
                marginBottom: "14px",
              }}
            >
              <img
                src={product.images[selectedImage] || product.images[0]}
                alt={product.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {product.images.length > 1 && (
              <div style={{ display: "flex", gap: 10 }}>
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: selectedImage === idx ? "2px solid #0EA5E9" : "1px solid #334155",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <img src={img} alt="thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "8px" }}>
              <span className="badge" style={{ background: "rgba(14,165,233,0.15)", color: "#38BDF8", fontSize: "12px" }}>
                {product.category?.name || "Replacement Part"}
              </span>
              {product.brand && (
                <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", fontSize: "12px" }}>
                  Brand: {product.brand}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 10px 0", color: "#F8FAFC", lineHeight: 1.3 }}>
              {product.title}
            </h1>

            <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "16px" }}>
              SKU: <strong style={{ color: "#CBD5E1" }}>{product.sku}</strong>
              {product.partNumber && (
                <span style={{ marginLeft: 12 }}>
                  OEM Part #: <strong style={{ color: "#CBD5E1" }}>{product.partNumber}</strong>
                </span>
              )}
            </div>

            {/* Price Box */}
            <div
              style={{
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: "8px" }}>
                <span style={{ fontSize: "32px", fontWeight: 800, color: "#38BDF8" }}>
                  ₦{product.price.toLocaleString()}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span style={{ fontSize: "16px", color: "#64748B", textDecoration: "line-through" }}>
                    ₦{product.compareAtPrice.toLocaleString()}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "13px", color: "#10B981", fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>
                  {product.stockQuantity > 0 ? `In Stock (${product.stockQuantity} units available for instant dispatch)` : "Out of Stock"}
                </span>
              </div>

              <div style={{ marginTop: "16px", display: "flex", gap: 12 }}>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity === 0 || reserving}
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1, background: "#0EA5E9", fontWeight: 800, display: "inline-flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                >
                  <ShoppingBag size={18} />
                  {reserving ? "Reserving 15-min Lock..." : "Procure Part Now (15-Min Lock)"}
                </button>
              </div>
            </div>

            {/* Verified Merchant Profile */}
            <div
              style={{
                background: "#0F172A",
                border: "1px solid #334155",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                Verified Fulfillment Supplier
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <strong style={{ fontSize: "15px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 6 }}>
                    <ShieldCheck size={16} color="#10B981" /> {product.merchant?.businessName}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#94A3B8", display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                    <MapPin size={12} /> {product.merchant?.businessAddress || product.merchant?.city}
                  </span>
                </div>
                <div style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", padding: "4px 10px", borderRadius: 8, fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <Star size={12} fill="#10B981" /> {product.merchant?.rating || 5.0} Rating
                </div>
              </div>
            </div>

            {/* Compatibility */}
            {product.compatibility && product.compatibility.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <strong style={{ fontSize: "13px", color: "#F8FAFC", display: "block", marginBottom: "8px" }}>
                  Verified Compatible Models / Brands:
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {product.compatibility.map((c: string, i: number) => (
                    <span key={i} style={{ background: "#1E293B", border: "1px solid #334155", color: "#38BDF8", padding: "4px 10px", borderRadius: "6px", fontSize: "12px" }}>
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <strong style={{ fontSize: "13px", color: "#F8FAFC", display: "block", marginBottom: "8px" }}>
                Component Details & Description:
              </strong>
              <p style={{ fontSize: "14px", color: "#94A3B8", lineHeight: 1.6 }}>{product.description}</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
