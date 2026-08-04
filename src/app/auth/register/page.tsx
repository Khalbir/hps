"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, Wrench, Sparkles, HeartHandshake } from "lucide-react";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/auth/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <Link href="/" className={styles.logo}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#reg-logo)" />
              <path d="M8 16C8 11.58 11.58 8 16 8C20.42 8 24 11.58 24 16C24 20.42 20.42 24 16 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M16 12V16L19 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs><linearGradient id="reg-logo" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#0EA5E9" /><stop offset="1" stopColor="#0284C7" /></linearGradient></defs>
            </svg>
            <span>HandyHub <strong>PRO</strong></span>
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
                    className={styles.input}
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Last Name</label>
                <div className={styles.inputWrap}>
                  <User size={18} className={styles.inputIcon} />
                  <input
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
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputWrap}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  className={styles.input}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Phone Number</label>
              <div className={styles.inputWrap}>
                <Phone size={18} className={styles.inputIcon} />
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="+234 800 000 0000"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
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
              <label className={styles.label}>Confirm Password</label>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  required
                />
              </div>
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
