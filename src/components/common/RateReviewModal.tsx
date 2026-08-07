"use client";

import { useState } from "react";
import { Star, X, CheckCircle2, Loader2, Award } from "lucide-react";

interface RateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceName?: string;
  artisanName?: string;
  onReviewSubmitted?: () => void;
}

export function RateReviewModal({
  isOpen,
  onClose,
  bookingId,
  serviceName = "Service",
  artisanName = "Artisan",
  onReviewSubmitted,
}: RateReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        if (onReviewSubmitted) onReviewSubmitted();
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        setError(data.error || "Failed to submit review");
      }
    } catch (err: any) {
      setError("Network error submitting review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 500,
          width: "100%",
          background: "#1E293B",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 20,
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
          padding: 28,
          position: "relative",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            background: "none",
            border: "none",
            color: "#94A3B8",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <X size={20} />
        </button>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle2 size={54} color="#10B981" style={{ margin: "0 auto 12px" }} />
            <h3 className="h4" style={{ color: "#10B981", margin: "0 0 6px 0" }}>
              Review & Rating Submitted!
            </h3>
            <p style={{ color: "#CBD5E1", fontSize: "14px", margin: 0 }}>
              Thank you! Your feedback helps maintain high artisan quality standards on HandyHub Pro.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#F59E0B",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Award size={26} />
              </div>
              <h3 className="h4" style={{ color: "#F8FAFC", margin: "0 0 4px 0" }}>
                Rate & Review Professional
              </h3>
              <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
                {serviceName} • {artisanName}
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid #EF4444",
                  borderRadius: 8,
                  color: "#EF4444",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            {/* Interactive Star Rating Picker */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <span style={{ fontSize: "12px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
                Select Star Rating
              </span>
              <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeStar = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        transition: "transform 0.15s ease",
                        transform: activeStar ? "scale(1.15)" : "scale(1)",
                      }}
                    >
                      <Star
                        size={32}
                        fill={activeStar ? "#F59E0B" : "transparent"}
                        color={activeStar ? "#F59E0B" : "#64748B"}
                      />
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#F59E0B", display: "block", marginTop: 6 }}>
                {rating === 5 && "⭐⭐⭐⭐⭐ Excellent (5/5)"}
                {rating === 4 && "⭐⭐⭐⭐ Very Good (4/5)"}
                {rating === 3 && "⭐⭐⭐ Satisfactory (3/5)"}
                {rating === 2 && "⭐⭐ Needs Improvement (2/5)"}
                {rating === 1 && "⭐ Poor Experience (1/5)"}
              </span>
            </div>

            {/* Review Comment Textarea */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                Your Experience Feedback (Optional)
              </label>
              <textarea
                rows={4}
                placeholder="Share details of your experience (e.g. punctuality, skill, cleanliness, customer service)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  background: "#0F172A",
                  border: "1px solid #334155",
                  borderRadius: 10,
                  color: "#F8FAFC",
                  fontSize: 14,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-md w-full"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #00A8B5 0%, #0284C7 100%)",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <Star size={16} fill="#FFFFFF" />}
              {loading ? "Submitting Review..." : "Submit Official Review ⭐"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
