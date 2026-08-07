"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { Star, RefreshCw, Inbox, Trash2 } from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/admin/reviews?_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.warn("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleModerate = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete/moderate this review?")) return;

    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, action: "DELETE" }),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        setToast("Review deleted and moderated successfully from live reviews.");
        setTimeout(() => setToast(""), 4000);
      }
    } catch (err) {
      console.warn("Failed to moderate review:", err);
    }
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="h3">Reviews & Rating Controls</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Monitor customer feedback, ratings, and moderate professional service quality.
          </p>
        </div>
        <button onClick={fetchReviews} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      {toast && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          ✅ {toast}
        </div>
      )}

      <div className={styles.adminContent}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>Loading real database customer reviews...</div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", background: "#1E293B", borderRadius: "var(--radius-xl)", border: "1px solid #334155" }}>
            <Inbox size={40} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 12 }} />
            <h4 className="h4" style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>No Reviews Found</h4>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>
              No client reviews have been logged in the database yet.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {reviews.map((r) => (
              <div key={r.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#1E293B", border: "1px solid #334155" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                    <div style={{ display: "flex" }}>
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="#F59E0B" stroke="#F59E0B" />
                      ))}
                      {[...Array(5 - r.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="transparent" stroke="#94A3B8" />
                      ))}
                    </div>
                    <strong style={{ fontSize: "var(--fs-sm)", color: "#F8FAFC" }}>{r.service}</strong>
                  </div>
                  <p style={{ fontSize: "var(--fs-md)", fontStyle: "italic", margin: "var(--space-2) 0", color: "#CBD5E1" }}>&ldquo;{r.comment}&rdquo;</p>
                  <span style={{ fontSize: "var(--fs-xs)", color: "#94A3B8" }}>
                    By {r.customer} for Pro: <strong style={{ color: "#0EA5E9" }}>{r.pro}</strong> • {r.date}
                  </span>
                </div>
                <button onClick={() => handleModerate(r.id)} className="btn btn-secondary btn-xs" style={{ color: "#EF4444", borderColor: "#EF4444", display: "flex", alignItems: "center", gap: 4 }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayoutShell>
  );
}
