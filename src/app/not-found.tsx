import Link from "next/link";
import { Search, Home, Calendar, Wrench, PhoneCall, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: "85vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-12) var(--space-4)",
      background: "var(--bg-primary)",
    }}>
      <div
        className="card"
        style={{
          maxWidth: "640px",
          width: "100%",
          padding: "var(--space-10) var(--space-8)",
          textAlign: "center",
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          border: "1px solid #334155",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-2xl)",
        }}
      >
        <div style={{ marginBottom: "var(--space-6)" }}>
          <BrandLogo size="lg" lightText={true} />
        </div>

        <span style={{
          fontSize: "64px",
          fontWeight: 900,
          background: "linear-gradient(135deg, #38BDF8, #818CF8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          display: "block",
          lineHeight: 1,
          marginBottom: "var(--space-2)",
          letterSpacing: "-2px",
        }}>
          404
        </span>

        <h1 className="h3" style={{ marginBottom: "var(--space-2)", color: "#F8FAFC" }}>
          Page Not Found
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "var(--fs-base)", marginBottom: "var(--space-8)", lineHeight: 1.6 }}>
          The page or service route you are looking for does not exist, has been relocated, or is temporarily offline.
        </p>

        {/* Quick Navigation Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
          <Link
            href="/"
            style={{
              background: "#0F172A",
              border: "1px solid #334155",
              padding: "16px 12px",
              borderRadius: "var(--radius-lg)",
              color: "#F8FAFC",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
            }}
          >
            <Home size={22} color="#0EA5E9" /> Home Page
          </Link>

          <Link
            href="/book"
            style={{
              background: "#0F172A",
              border: "1px solid #334155",
              padding: "16px 12px",
              borderRadius: "var(--radius-lg)",
              color: "#F8FAFC",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
            }}
          >
            <Calendar size={22} color="#10B981" /> Instant Booking
          </Link>

          <Link
            href="/services"
            style={{
              background: "#0F172A",
              border: "1px solid #334155",
              padding: "16px 12px",
              borderRadius: "var(--radius-lg)",
              color: "#F8FAFC",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
            }}
          >
            <Wrench size={22} color="#F59E0B" /> Services Catalog
          </Link>

          <Link
            href="/contact"
            style={{
              background: "#0F172A",
              border: "1px solid #334155",
              padding: "16px 12px",
              borderRadius: "var(--radius-lg)",
              color: "#F8FAFC",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
            }}
          >
            <PhoneCall size={22} color="#EC4899" /> 24/7 Support
          </Link>
        </div>

        <Link
          href="/"
          className="btn btn-primary btn-lg"
          style={{ background: "#0EA5E9", borderColor: "#0EA5E9", display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          Return to HandyHub Homepage <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
