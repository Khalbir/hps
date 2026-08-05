"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, X, User, ShieldCheck, ClipboardList, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import styles from "@/app/admin/admin.module.css";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users: any[];
    professionals: any[];
    bookings: any[];
    payments: any[];
  }>({ users: [], professionals: [], bookings: [], payments: [] });

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ users: [], professionals: [], bookings: [], payments: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (res.ok) {
          setResults({
            users: data.users || [],
            professionals: data.professionals || [],
            bookings: data.bookings || [],
            payments: data.payments || [],
          });
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.users.length + results.professionals.length + results.bookings.length + results.payments.length;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "80px",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "90%",
          maxWidth: "750px",
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          color: "#F8FAFC",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #334155", paddingBottom: "16px", marginBottom: "20px" }}>
          <Search size={22} color="#0EA5E9" />
          <input
            type="text"
            autoFocus
            placeholder="Search customers, professionals, bookings, or transactions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#F8FAFC",
              fontSize: "16px",
              fontWeight: 500,
            }}
          />
          {loading && <Loader2 size={18} className="spinner" color="#0EA5E9" />}
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Results Display */}
        <div style={{ maxHeight: "420px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {query.trim().length < 2 && (
            <p style={{ textAlign: "center", color: "#64748B", fontSize: "14px", padding: "20px 0" }}>
              Type at least 2 characters to search across customers, professionals, bookings & payments.
            </p>
          )}

          {query.trim().length >= 2 && !loading && totalResults === 0 && (
            <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "14px", padding: "20px 0" }}>
              No records found matching &ldquo;<strong style={{ color: "#0EA5E9" }}>{query}</strong>&rdquo;.
            </p>
          )}

          {/* Bookings Group */}
          {results.bookings.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0EA5E9", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px" }}>
                <ClipboardList size={16} /> Bookings ({results.bookings.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.bookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/dashboard/bookings?ref=${b.reference}`}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#0F172A",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px", color: "#F8FAFC" }}>#{b.reference} — {b.service?.name}</strong>
                      <div style={{ fontSize: "12px", color: "#94A3B8" }}>Customer: {b.customer?.firstName} {b.customer?.lastName} ({b.customer?.email})</div>
                    </div>
                    <span className="badge" style={{ background: "rgba(14,165,233,0.15)", color: "#0EA5E9", fontSize: "11px" }}>{b.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Professionals Group */}
          {results.professionals.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#F59E0B", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px" }}>
                <ShieldCheck size={16} /> Professionals & Artisans ({results.professionals.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.professionals.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/dashboard/professionals?id=${p.id}`}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#0F172A",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px", color: "#F8FAFC" }}>{p.user?.firstName} {p.user?.lastName}</strong>
                      <div style={{ fontSize: "12px", color: "#94A3B8" }}>{p.user?.email} • ID: {p.idNumber || "Not set"}</div>
                    </div>
                    <span className="badge" style={{ background: p.verificationStatus === "VERIFIED" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: p.verificationStatus === "VERIFIED" ? "#10B981" : "#F59E0B", fontSize: "11px" }}>
                      {p.verificationStatus}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Customers / Users Group */}
          {results.users.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8B5CF6", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px" }}>
                <User size={16} /> Customers & Staff ({results.users.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/admin/dashboard/users?email=${u.email}`}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#0F172A",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px", color: "#F8FAFC" }}>{u.firstName} {u.lastName}</strong>
                      <div style={{ fontSize: "12px", color: "#94A3B8" }}>{u.email} • {u.phone || "No phone"}</div>
                    </div>
                    <span className="badge" style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6", fontSize: "11px" }}>{u.role}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Payments Group */}
          {results.payments.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10B981", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px" }}>
                <CreditCard size={16} /> Payments & Transactions ({results.payments.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.payments.map((pm) => (
                  <Link
                    key={pm.id}
                    href={`/admin/dashboard/payments?ref=${pm.reference}`}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#0F172A",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px", color: "#F8FAFC" }}>Ref: {pm.reference}</strong>
                      <div style={{ fontSize: "12px", color: "#94A3B8" }}>Payer: {pm.user?.email} • Gateway: {pm.provider}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "13px", color: "#10B981" }}>₦{pm.amount.toLocaleString()}</strong>
                      <div style={{ fontSize: "10px", color: pm.status === "SUCCESS" ? "#10B981" : "#F59E0B" }}>{pm.status}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B" }}>
          <span>Press ESC or click background to exit</span>
          <span>Showing top instant results</span>
        </div>
      </div>
    </div>
  );
}
