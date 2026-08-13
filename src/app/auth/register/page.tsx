"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, Wrench, Sparkles, HeartHandshake } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import styles from "../auth.module.css";

const PRO_SERVICE_OPTIONS = [
  { value: "cleaning", label: "Cleaning (Residential, Commercial, Deep Cleaning)" },
  { value: "plumbing", label: "Plumbing (Pipes, Drainage, Water Heaters)" },
  { value: "electrical", label: "Electrical (Wiring, Sockets, Lighting)" },
  { value: "hvac", label: "AC & HVAC (Installation, Servicing, Repairs)" },
  { value: "painting", label: "Painting (Interior & Exterior)" },
  { value: "carpentry", label: "Carpentry & Furniture Assembly" },
  { value: "security", label: "Security & CCTV Installation" },
  { value: "solar", label: "Solar & Power (Panels, Inverters, Generators)" },
  { value: "home-improvement", label: "Home Improvement & Renovation" },
  { value: "outdoor", label: "Gardening & Landscaping" },
  { value: "laundry", label: "Laundry & Garment Care" },
  { value: "moving", label: "Moving & Relocation Services" },
  { value: "general", label: "General Handyman" },
  { value: "others", label: "Others (Skillset Not Listed)" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER" as "CUSTOMER" | "PROFESSIONAL",
    serviceCategory: "",
    customSkill: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [offPlatformAgreed, setOffPlatformAgreed] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!offPlatformAgreed) {
      setError("You must acknowledge that all bookings and payments must remain on HandyHub Pro.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (form.role === "PROFESSIONAL") {
      if (!form.serviceCategory) {
        setError("Please select your primary service field / skillset.");
        return;
      }
      if (form.serviceCategory === "others" && !form.customSkill.trim()) {
        setError("Please specify your skillset.");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
          serviceCategory: form.role === "PROFESSIONAL" ? form.serviceCategory : undefined,
          customSkill: form.role === "PROFESSIONAL" && form.serviceCategory === "others" ? form.customSkill.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please check your inputs.");
        setLoading(false);
        return;
      }

      if (staySignedIn) {
        localStorage.setItem("handyhub_stay_signed_in", "true");
      } else {
        localStorage.removeItem("handyhub_stay_signed_in");
      }

      // If email verification is required, navigate to verify-email page
      if (data.redirect || data.requiresVerification || data.unverified) {
        router.push(data.redirect || `/auth/verify-email?email=${encodeURIComponent(form.email)}&role=${encodeURIComponent(form.role)}`);
        return;
      }

      const userPayload = data.user || { email: form.email, firstName: form.firstName, lastName: form.lastName, phone: form.phone, role: form.role };
      localStorage.setItem("handyhub_user", JSON.stringify(userPayload));

      const sessionPayload = { authenticated: true, user: userPayload, timestamp: Date.now() };
      sessionStorage.setItem("handyhub_active_session", JSON.stringify(sessionPayload));

      if (form.role === "PROFESSIONAL") {
        if (staySignedIn) {
          localStorage.setItem("handyhub_pro_session", JSON.stringify(sessionPayload));
          document.cookie = "handyhub_pro_session=authenticated; path=/; max-age=2592000; SameSite=Lax";
        } else {
          sessionStorage.setItem("handyhub_pro_session", JSON.stringify(sessionPayload));
          document.cookie = "handyhub_pro_session=authenticated; path=/; SameSite=Lax";
        }
        router.push("/pro");
      } else {
        if (staySignedIn) {
          localStorage.setItem("handyhub_user_session", JSON.stringify(sessionPayload));
          document.cookie = "handyhub_user_session=authenticated; path=/; max-age=2592000; SameSite=Lax";
        } else {
          sessionStorage.setItem("handyhub_user_session", JSON.stringify(sessionPayload));
          document.cookie = "handyhub_user_session=authenticated; path=/; SameSite=Lax";
        }
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <Link href="/" className={styles.logo} style={{ textDecoration: "none" }}>
            <BrandLogo size="md" lightText={true} />
          </Link>
          <h1 className={styles.leftTitle}>Join HandyHub</h1>
          <p className={styles.leftDesc}>
            {form.role === "PROFESSIONAL"
              ? "Join our network of verified professionals. Set your schedule, grow your business, and earn more."
              : "Book verified professionals for your home or business. Transparent pricing, guaranteed satisfaction."}
          </p>
          <div className={styles.leftStats}>
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>500+</span>
              <span className={styles.leftStatLabel}>Active Professionals</span>
            </div>
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>100%</span>
              <span className={styles.leftStatLabel}>Satisfaction Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <motion.div
          className={styles.formCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.formTitle}>Create your account</h2>
          <p className={styles.formSubtitle}>
            Already have an account?{" "}
            <Link href="/auth/login" className={styles.formLink}>Log in</Link>
          </p>

          {/* Role Toggle */}
          <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
            <button
              type="button"
              className={`btn ${form.role === "CUSTOMER" ? "btn-primary" : "btn-secondary"} btn-md`}
              style={{ flex: 1 }}
              onClick={() => update("role", "CUSTOMER")}
            >
              I need services
            </button>
            <button
              type="button"
              className={`btn ${form.role === "PROFESSIONAL" ? "btn-primary" : "btn-secondary"} btn-md`}
              style={{ flex: 1 }}
              onClick={() => update("role", "PROFESSIONAL")}
            >
              I&apos;m a professional
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.nameRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>First Name</label>
                <div className={styles.inputWrap}>
                  <User size={18} className={styles.inputIcon} />
                  <input
                    id="firstName"
                    name="given-name"
                    autoComplete="given-name"
                    className={styles.input}
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="lastName" className={styles.label}>Last Name</label>
                <div className={styles.inputWrap}>
                  <User size={18} className={styles.inputIcon} />
                  <input
                    id="lastName"
                    name="family-name"
                    autoComplete="family-name"
                    className={styles.input}
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Mandatory Service Field Selection for Professionals */}
            {form.role === "PROFESSIONAL" && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Primary Service / Skillset <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <Wrench size={18} className={styles.inputIcon} />
                  <select
                    className={styles.input}
                    value={form.serviceCategory}
                    onChange={(e) => update("serviceCategory", e.target.value)}
                    required
                    style={{ cursor: "pointer" }}
                  >
                    <option value="" disabled>
                      -- Select your service skillset --
                    </option>
                    {PRO_SERVICE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Custom Skill Input & Appreciation Banner if "Others" Selected */}
            {form.role === "PROFESSIONAL" && form.serviceCategory === "others" && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Specify Your Skillset <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <Sparkles size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g., Roofing, Locksmith, Pest Control..."
                    value={form.customSkill}
                    onChange={(e) => update("customSkill", e.target.value)}
                    required
                  />
                </div>

                <div className={styles.otherSkillBanner}>
                  <div className={styles.bannerHeader}>
                    <HeartHandshake size={20} className={styles.bannerIcon} />
                    <span>Skillset Taken Under Consideration</span>
                  </div>
                  <p className={styles.bannerText}>
                    Your skillset is not listed on our services for the moment, but we do appreciate your support and your skillset will be taken under consideration.
                  </p>
                </div>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <div className={styles.inputWrap}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username email"
                  className={styles.input}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="phone" className={styles.label}>Phone Number</label>
              <div className={styles.inputWrap}>
                <Phone size={18} className={styles.inputIcon} />
                <input
                  id="phone"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  className={styles.input}
                  placeholder="+234 800 000 0000"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={styles.input}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={styles.input}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Mandatory Off-Platform Policy Acknowledgment */}
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid #F59E0B", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.4 }}>
                <input
                  type="checkbox"
                  checked={offPlatformAgreed}
                  onChange={(e) => setOffPlatformAgreed(e.target.checked)}
                  style={{ marginTop: 2, accentColor: "#0EA5E9", width: 16, height: 16, cursor: "pointer" }}
                  required
                />
                <span>
                  <strong style={{ color: "#D97706" }}>Mandatory On-Platform Policy:</strong> I agree that all bookings, payments, and messages must stay on HandyHub Pro. Cash payments off-platform void Escrow Security, 14-Day Warranties, and Dispute Support.
                </span>
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-primary)", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={staySignedIn}
                  onChange={(e) => setStaySignedIn(e.target.checked)}
                  style={{ accentColor: "#0EA5E9", width: 16, height: 16, cursor: "pointer" }}
                />
                <span>Stay signed in on this device</span>
              </label>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg w-full ${loading ? "btn-loading" : ""}`}
              disabled={loading}
            >
              {loading ? <div className="spinner" /> : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className={styles.divider} style={{ margin: "var(--space-6) 0" }}>
            <span>or sign up with</span>
          </div>

          <div className={styles.socialBtns} style={{ marginBottom: "var(--space-6)" }}>
            <a
              href={`/api/auth/google?action=register&role=${form.role}`}
              className={`btn btn-secondary btn-lg ${styles.socialBtn}`}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", textDecoration: "none" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign up with Gmail Account
            </a>
          </div>

          <p className={styles.testCreds} style={{ textAlign: "center" }}>
            By creating an account, you agree to our{" "}
            <Link href="/terms" style={{ color: "var(--color-primary-500)" }}>Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" style={{ color: "var(--color-primary-500)" }}>Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
