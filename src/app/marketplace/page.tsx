"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag, Search, Filter, ShieldCheck, Wrench, CheckCircle2,
  Truck, ArrowRight, Zap, RefreshCw, AlertCircle, Plus, Minus, X, Star
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface Product {
  id: string;
  sku: string;
  title: string;
  slug: string;
  description: string;
  partNumber?: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  images: string[];
  compatibility: string[];
  category: { id: string; name: string; slug: string };
  merchant: {
    id: string;
    businessName: string;
    city: string;
    rating: number;
    totalOrders: number;
    logoUrl?: string;
  };
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function MarketplaceStorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  
  // Cart & Reservation State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [reserving, setReserving] = useState<string | null>(null);

  // Auto-Procurement "Smart Select" State
  const [showAutoProcureModal, setShowAutoProcureModal] = useState(false);
  const [autoQuery, setAutoQuery] = useState("");
  const [autoSearching, setAutoSearching] = useState(false);
  const [autoMatchResult, setAutoMatchResult] = useState<any>(null);

  // Cart Session ID for 15-Minute Reservation Locking
  const [cartSessionId, setCartSessionId] = useState("");

  useEffect(() => {
    let sess = localStorage.getItem("handyhub_cart_session");
    if (!sess) {
      sess = `SESS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("handyhub_cart_session", sess);
    }
    setCartSessionId(sess);

    // Load persisted cart
    try {
      const savedCart = localStorage.getItem("handyhub_marketplace_cart");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {}
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("handyhub_marketplace_cart", JSON.stringify(newCart));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
      if (sortBy) params.set("sort", sortBy);

      const res = await fetch(`/api/marketplace/products?${params.toString()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to fetch marketplace products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/marketplace/categories");
      const data = await res.json();
      if (res.ok && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, sortBy]);

  // Add to Cart with 15-Minute Reservation Lock
  const handleAddToCart = async (product: Product) => {
    setReserving(product.id);
    try {
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
        const existingIdx = cart.findIndex((i) => i.product.id === product.id);
        let updated: CartItem[];
        if (existingIdx > -1) {
          updated = [...cart];
          updated[existingIdx].quantity += 1;
        } else {
          updated = [...cart, { product, quantity: 1 }];
        }
        saveCart(updated);
        setToast(`1 unit of "${product.title}" reserved for 15 minutes! 🛒`);
        setCartOpen(true);
      } else {
        setToast(`Error: ${data.error || "Failed to reserve inventory"}`);
      }
    } catch {
      setToast("Failed to reserve item stock.");
    } finally {
      setReserving(null);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    saveCart(updated);
  };

  // Run Smart Select Auto-Procurement
  const handleAutoProcureSearch = async () => {
    if (!autoQuery.trim()) return;
    setAutoSearching(true);
    setAutoMatchResult(null);

    try {
      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procurementType: "AUTO_PROCUREMENT",
          autoProcureQuery: autoQuery,
          deliveryAddress: "Central Area, Abuja",
          customerEmail: "preview@handyhubpro.ng",
          paymentMethod: "WALLET",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAutoMatchResult(data);
      } else {
        setToast(data.error || "No verified merchant match found.");
      }
    } catch {
      setToast("Auto-procurement query failed.");
    } finally {
      setAutoSearching(false);
    }
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <div style={{ background: "#0B1120", minHeight: "100vh", color: "#F8FAFC" }}>
      <Header />

      {/* Toast Feedback */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 99999,
            background: "#0EA5E9",
            color: "#FFFFFF",
            padding: "14px 22px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      {/* Hero Banner */}
      <section
        style={{
          background: "linear-gradient(180deg, rgba(14, 165, 233, 0.12) 0%, rgba(11, 17, 32, 0) 100%)",
          padding: "60px 20px 40px",
          borderBottom: "1px solid #1E293B",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
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
              marginBottom: "16px",
            }}
          >
            <ShieldCheck size={16} /> Verified Merchants & 100% Genuine Certified Parts
          </div>

          <h1 style={{ fontSize: "38px", fontWeight: 800, margin: "0 0 14px 0", letterSpacing: "-0.5px" }}>
            HandyHub <span style={{ color: "#0EA5E9" }}>Marketplace</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#94A3B8", maxWidth: "680px", margin: "0 auto 30px", lineHeight: 1.6 }}>
            Browse certified replacement components from verified suppliers across Abuja or let HandyHub automatically procure the best matching part with zero direct cash to artisans.
          </p>

          {/* Smart Select Auto-Procurement Banner */}
          <div
            style={{
              background: "linear-gradient(90deg, #1E293B 0%, #0F172A 100%)",
              border: "1px solid rgba(14, 165, 233, 0.4)",
              borderRadius: "16px",
              padding: "20px 28px",
              maxWidth: "850px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ textAlign: "left", flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#38BDF8", fontWeight: 800, fontSize: "14px", textTransform: "uppercase" }}>
                <Zap size={16} /> HandyHub Smart Select (Auto-Procurement)
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94A3B8" }}>
                Don&apos;t know the exact merchant? Tell us what you need, and our engine automatically selects the nearest verified merchant with the best price.
              </p>
            </div>
            <button
              onClick={() => setShowAutoProcureModal(true)}
              className="btn btn-primary"
              style={{ background: "#0EA5E9", display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, padding: "10px 20px" }}
            >
              <Zap size={16} /> Auto-Procure Part Now <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Catalog View */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Search & Filter Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: "28px" }}>
          {/* Search Bar */}
          <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
            <Search size={18} style={{ position: "absolute", left: 14, top: 14, color: "#64748B" }} />
            <input
              type="text"
              placeholder="Search replacement parts, part numbers, brands (e.g., Daikin, Havells, Schneider)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "12px 16px 12px 42px",
                color: "#F8FAFC",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Sort Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: "13px", color: "#94A3B8" }}>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#F8FAFC",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock">In Stock First</option>
            </select>
          </div>
        </div>

        {/* Trade Category Filter Pills */}
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: "14px", marginBottom: "30px" }}>
          <button
            onClick={() => setSelectedCategory("all")}
            style={{
              padding: "8px 18px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid",
              background: selectedCategory === "all" ? "#0EA5E9" : "#1E293B",
              borderColor: selectedCategory === "all" ? "#0EA5E9" : "#334155",
              color: selectedCategory === "all" ? "#FFFFFF" : "#94A3B8",
              whiteSpace: "nowrap",
            }}
          >
            All Parts
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              style={{
                padding: "8px 18px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid",
                background: selectedCategory === cat.slug ? "#0EA5E9" : "#1E293B",
                borderColor: selectedCategory === cat.slug ? "#0EA5E9" : "#334155",
                color: selectedCategory === cat.slug ? "#FFFFFF" : "#94A3B8",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Wrench size={13} /> {cat.name} {cat.productCount ? `(${cat.productCount})` : ""}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#94A3B8" }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            <p>Loading genuine replacement parts registry...</p>
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "#1E293B",
              borderRadius: "16px",
              border: "1px solid #334155",
            }}
          >
            <Wrench size={40} style={{ opacity: 0.4, marginBottom: "12px" }} />
            <h3 style={{ fontSize: "18px", margin: "0 0 6px 0", color: "#F8FAFC" }}>No Replacement Parts Found</h3>
            <p style={{ fontSize: "14px", color: "#94A3B8", maxWidth: "450px", margin: "0 auto 20px" }}>
              We could not find parts matching &quot;{searchQuery}&quot;. Try adjusting your search query or use HandyHub Smart Select auto-procurement.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="btn btn-secondary btn-sm"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "22px" }}>
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "14px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
              >
                {/* Product Photo & Stock Badge */}
                <div style={{ position: "relative", height: "180px", background: "#0F172A", overflow: "hidden" }}>
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: product.stockQuantity > 0 ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)",
                      color: "#FFFFFF",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {product.stockQuantity > 0 ? `IN STOCK (${product.stockQuantity})` : "OUT OF STOCK"}
                  </div>

                  {product.brand && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "rgba(15,23,42,0.85)",
                        color: "#38BDF8",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        border: "1px solid rgba(56,189,248,0.3)",
                      }}
                    >
                      {product.brand}
                    </div>
                  )}
                </div>

                {/* Product Meta */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "4px" }}>
                    SKU: {product.sku} {product.partNumber ? `| Part #${product.partNumber}` : ""}
                  </div>

                  <Link href={`/marketplace/${product.slug}`} style={{ textDecoration: "none" }}>
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#F8FAFC",
                        margin: "0 0 8px 0",
                        lineHeight: 1.3,
                        minHeight: "38px",
                      }}
                    >
                      {product.title}
                    </h3>
                  </Link>

                  {/* Verified Merchant Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "12px",
                      color: "#94A3B8",
                      marginBottom: "12px",
                    }}
                  >
                    <ShieldCheck size={14} color="#10B981" />
                    <span style={{ color: "#CBD5E1", fontWeight: 600 }}>{product.merchant.businessName}</span>
                    <span>• {product.merchant.city}</span>
                  </div>

                  {/* Price & Add to Cart */}
                  <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #334155", paddingTop: "12px" }}>
                    <div>
                      <span style={{ fontSize: "18px", fontWeight: 800, color: "#38BDF8" }}>
                        ₦{product.price.toLocaleString()}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span style={{ fontSize: "12px", color: "#64748B", textDecoration: "line-through", marginLeft: 6 }}>
                          ₦{product.compareAtPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stockQuantity === 0 || reserving === product.id}
                      className="btn btn-primary btn-sm"
                      style={{
                        background: "#0EA5E9",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "6px 12px",
                      }}
                    >
                      <ShoppingBag size={14} />
                      {reserving === product.id ? "Reserving..." : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          style={{
            position: "fixed",
            bottom: 30,
            right: 30,
            zIndex: 9999,
            background: "#0EA5E9",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "30px",
            padding: "14px 24px",
            fontWeight: 800,
            fontSize: "15px",
            boxShadow: "0 12px 30px rgba(14, 165, 233, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ShoppingBag size={20} />
          <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          <span style={{ background: "rgba(0,0,0,0.2)", padding: "2px 8px", borderRadius: "12px" }}>
            ₦{cartTotal.toLocaleString()}
          </span>
        </button>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(11, 17, 32, 0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setCartOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#1E293B",
              height: "100%",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "16px", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingBag size={20} color="#0EA5E9" /> Procurement Cart
              </h3>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px", fontSize: "12px", color: "#38BDF8" }}>
              ⏱️ <strong>15-Minute Inventory Lock Active:</strong> Your selected replacement parts are locked from being purchased by others during checkout.
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
                  <ShoppingBag size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    style={{
                      background: "#0F172A",
                      border: "1px solid #334155",
                      borderRadius: "10px",
                      padding: "12px",
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: "13px", color: "#F8FAFC", display: "block", marginBottom: 2 }}>
                        {item.product.title}
                      </strong>
                      <span style={{ fontSize: "12px", color: "#38BDF8", fontWeight: 700 }}>
                        ₦{item.product.price.toLocaleString()}
                      </span>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>From: {item.product.merchant.businessName}</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        onClick={() => handleUpdateQty(item.product.id, -1)}
                        style={{ width: 26, height: 26, background: "#1E293B", border: "1px solid #334155", color: "#F8FAFC", borderRadius: 4, cursor: "pointer" }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: "13px", fontWeight: 700 }}>{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.product.id, 1)}
                        style={{ width: 26, height: 26, background: "#1E293B", border: "1px solid #334155", color: "#F8FAFC", borderRadius: 4, cursor: "pointer" }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div style={{ borderTop: "1px solid #334155", paddingTop: "16px", marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ color: "#94A3B8", fontSize: "14px" }}>Parts Subtotal:</span>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "#38BDF8" }}>
                    ₦{cartTotal.toLocaleString()}
                  </span>
                </div>

                <Link
                  href="/marketplace/checkout"
                  className="btn btn-primary btn-lg"
                  style={{
                    width: "100%",
                    textAlign: "center",
                    background: "#0EA5E9",
                    fontWeight: 800,
                    padding: "14px",
                    borderRadius: "10px",
                    display: "block",
                    textDecoration: "none",
                  }}
                >
                  Proceed to Secure Checkout 🔒
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto-Procure Smart Select Modal */}
      {showAutoProcureModal && (
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
          onClick={() => setShowAutoProcureModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "540px",
              background: "#1E293B",
              border: "1px solid rgba(14,165,233,0.4)",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={20} color="#0EA5E9" /> HandyHub Smart Select Auto-Procurement
              </h3>
              <button onClick={() => setShowAutoProcureModal(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "20px", lineHeight: 1.5 }}>
              Enter the replacement component or part number you need. Our algorithm will match the nearest verified merchant in Abuja with guaranteed OEM stock and lowest verified price.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Required Replacement Part or Equipment Model
              </label>
              <input
                type="text"
                placeholder="e.g., Daikin 1.5HP AC Compressor, Havells 32A MCB Breaker..."
                value={autoQuery}
                onChange={(e) => setAutoQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "#0F172A",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#F8FAFC",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowAutoProcureModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={handleAutoProcureSearch}
                disabled={autoSearching || !autoQuery.trim()}
                className="btn btn-primary btn-sm"
                style={{ background: "#0EA5E9", fontWeight: 700 }}
              >
                {autoSearching ? "Matching Verified Suppliers..." : "Match Best Verified Merchant ⚡"}
              </button>
            </div>

            {autoMatchResult && (
              <div style={{ marginTop: "20px", background: "#0F172A", border: "1px solid #10B981", borderRadius: "10px", padding: "16px" }}>
                <div style={{ color: "#10B981", fontWeight: 700, fontSize: "14px", marginBottom: "6px", display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={16} /> Best Verified Merchant Matched!
                </div>
                <div style={{ fontSize: "13px", color: "#CBD5E1", marginBottom: "12px" }}>
                  Order Reference: <strong style={{ color: "#38BDF8" }}>{autoMatchResult.orderNumber}</strong> | Logistics: ₦{autoMatchResult.logisticsFee?.toLocaleString()}
                </div>
                <Link
                  href={`/marketplace/track/${autoMatchResult.orderNumber}`}
                  className="btn btn-primary btn-sm"
                  style={{ width: "100%", textAlign: "center", background: "#10B981", textDecoration: "none" }}
                >
                  View Procurement Order & Real-Time Tracking 📦
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
