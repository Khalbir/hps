"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, Wrench, Sparkles, HeartHandshake,
  FileText, MapPin, Home, Check
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import styles from "../auth.module.css";

const PRO_SERVICE_OPTIONS = [
  { value: "cleaning", label: "Cleaning (Residential, Commercial, Deep Clean, Post-Construction)" },
  { value: "fumigation", label: "Fumigation & Pest Control (Eco-Safe Residential & Commercial Eradication)" },
  { value: "upholstery", label: "Upholstery & Carpet Cleaning (Sofa, Mattress, Rug Extraction & Detailing)" },
  { value: "plumbing", label: "Plumbing (Pipe Repairs, Drainage & Sewage, Water Heaters)" },
  { value: "electrical", label: "Electrical (Wiring & Rewiring, Sockets, Lighting Installation)" },
  { value: "hvac", label: "AC & HVAC (Split Unit Installation, Servicing, Gas Refill, Repairs)" },
  { value: "painting", label: "Painting (Interior, Exterior, Screeding & POP Surface Finish)" },
  { value: "carpentry", label: "Carpentry (Custom Furniture, Assembly, Cabinets & Woodwork)" },
  { value: "security", label: "Security & CCTV (CCTV Camera Installation & Surveillance)" },
  { value: "solar", label: "Solar, Inverter & Generator (Panels, Inverters, Generator Repairs)" },
  { value: "home-improvement", label: "Home Improvement (Interior Decoration & Home Renovation)" },
  { value: "outdoor", label: "Gardening (Lawn Care, Landscaping & Plant Maintenance)" },
  { value: "laundry", label: "Laundry & Garment Care (Washing, Ironing & Dry Cleaning)" },
  { value: "moving", label: "Moving (Home & Office Relocation Services)" },
  { value: "general", label: "General Handyman (Odd Jobs, Fittings & Minor Repairs)" },
  { value: "others", label: "Others (Custom Skillset Request)" },
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
    idType: "NIN",
    idNumber: "",
    operatingState: "FCT Abuja",
    homeAddress: "",
  });

  // Auto-detect ?role=PROFESSIONAL or ?role=artisan or ?role=pro from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const requestedRole = (params.get("role") || "").toUpperCase();
      if (requestedRole === "PROFESSIONAL" || requestedRole === "PRO" || requestedRole === "ARTISAN") {
        setForm((prev) => ({ ...prev, role: "PROFESSIONAL" }));
      }
    }
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [offPlatformAgreed, setOffPlatformAgreed] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
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
      if (!form.idType) {
        setError("Government ID type is mandatory before signing up.");
        return;
      }
      if (form.idType === "NIN" && form.idNumber.length !== 11) {
        setError("National Identification Number (NIN) must be exactly 11 digits.");
        return;
      }
      if (!form.idNumber.trim()) {
        setError(`Please enter your ${form.idType === "NIN" ? "11-digit NIN" : "Government ID"} number.`);
        return;
      }
      if (!form.operatingState.trim()) {
        setError("Operating state in Nigeria is mandatory.");
        return;
      }
      if (!form.homeAddress.trim()) {
        setError("Home & workshop residential address is mandatory.");
        return;
      }
    }

    if (form.phone && form.phone.length !== 11) {
      setError("Phone number must be exactly 11 digits (e.g. 08012345678).");
      return;
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
          idType: form.role === "PROFESSIONAL" ? form.idType : undefined,
          idNumber: form.role === "PROFESSIONAL" ? form.idNumber.trim() : undefined,
          operatingState: form.role === "PROFESSIONAL" ? form.operatingState : undefined,
          homeAddress: form.role === "PROFESSIONAL" ? form.homeAddress.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please check your inputs.");
        setLoading(false);
        return;
      }

      // Navigate directly to verify-email page to enter 6-digit confirmation code
      const targetRedirect = data.redirect || `/auth/verify-email?email=${encodeURIComponent(form.email)}&role=${encodeURIComponent(form.role)}`;
      router.push(targetRedirect);
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

          {/* Role Toggle - Explicitly Client/Customer vs Artisan/Professional */}
          <div className={styles.roleSelectorContainer}>
            <label className={styles.roleSelectorLabel}>
              Select Account Type <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div className={styles.roleGrid}>
              {/* Option 1: Client / Customer */}
              <button
                type="button"
                className={`${styles.roleCard} ${form.role === "CUSTOMER" ? styles.roleCardClientActive : ""}`}
                onClick={() => update("role", "CUSTOMER")}
              >
                <div className={styles.roleCardHeader}>
                  <div className={styles.roleCardTitleWrap}>
                    <User size={18} className={form.role === "CUSTOMER" ? styles.roleCardIconClient : styles.roleCardIconInactive} />
                    <span className={styles.roleCardTitle}>
                      Client / Customer
                    </span>
                  </div>
                  {form.role === "CUSTOMER" && (
                    <div className={styles.roleCardBadgeActive}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className={styles.roleCardSubtitle}>
                  Book verified artisans for your home or business with escrow protection.
                </p>
              </button>

              {/* Option 2: Artisan / Professional */}
              <button
                type="button"
                className={`${styles.roleCard} ${form.role === "PROFESSIONAL" ? styles.roleCardProActive : ""}`}
                onClick={() => update("role", "PROFESSIONAL")}
              >
                <div className={styles.roleCardHeader}>
                  <div className={styles.roleCardTitleWrap}>
                    <Wrench size={18} className={form.role === "PROFESSIONAL" ? styles.roleCardIconPro : styles.roleCardIconInactive} />
                    <span className={styles.roleCardTitle}>
                      Artisan / Professional
                    </span>
                  </div>
                  {form.role === "PROFESSIONAL" && (
                    <div className={styles.roleCardBadgeProActive}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className={styles.roleCardSubtitle}>
                  Get matched jobs, earn guaranteed payouts & switch to client mode anytime.
                </p>
              </button>
            </div>

            {/* Explanatory Policy Callout */}
            <div className={styles.rolePolicyNotice}>
              <span style={{ fontSize: "14px" }}>💡</span>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Account Privilege Policy:</strong> Verified Artisans can switch to Client mode to book services. Client accounts cannot switch to an Artisan account without formal verification.
              </div>
            </div>
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

            {/* Mandatory Government ID & Residential Address for Professionals */}
            {form.role === "PROFESSIONAL" && (
              <>
                <div className={styles.nameRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Government ID Type <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <div className={styles.inputWrap}>
                      <FileText size={18} className={styles.inputIcon} />
                      <select
                        className={styles.input}
                        value={form.idType}
                        onChange={(e) => update("idType", e.target.value)}
                        required
                        style={{ cursor: "pointer" }}
                      >
                        <option value="NIN">National Identification Number (NIN)</option>
                        <option value="PASSPORT">International Passport</option>
                        <option value="VOTERS_CARD">Voter&apos;s Card</option>
                        <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      {form.idType === "NIN" ? "11-Digit NIN Number" : `${form.idType} Number`} <span style={{ color: "#EF4444" }}>*</span>
                      {form.idType === "NIN" && (
                        <span style={{ fontSize: "11px", color: form.idNumber.length === 11 ? "#10B981" : "var(--text-tertiary)", marginLeft: 6 }}>
                          ({form.idNumber.length}/11 digits)
                        </span>
                      )}
                    </label>
                    <div className={styles.inputWrap}>
                      <FileText size={18} className={styles.inputIcon} />
                      <input
                        type="text"
                        className={styles.input}
                        placeholder={form.idType === "NIN" ? "Enter 11-digit NIN" : `Enter ${form.idType} number`}
                        value={form.idNumber}
                        maxLength={form.idType === "NIN" ? 11 : 30}
                        inputMode={form.idType === "NIN" ? "numeric" : "text"}
                        pattern={form.idType === "NIN" ? "[0-9]{11}" : undefined}
                        onChange={(e) => {
                          const sanitized = form.idType === "NIN" ? e.target.value.replace(/\D/g, "").slice(0, 11) : e.target.value;
                          update("idNumber", sanitized);
                        }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.nameRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Operating State in Nigeria <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <div className={styles.inputWrap}>
                      <MapPin size={18} className={styles.inputIcon} />
                      <select
                        className={styles.input}
                        value={form.operatingState}
                        onChange={(e) => update("operatingState", e.target.value)}
                        required
                        style={{ cursor: "pointer" }}
                      >
                        {[
                          "FCT Abuja", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
                          "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
                          "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
                          "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
                        ].map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Home / Workshop Address <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <div className={styles.inputWrap}>
                      <Home size={18} className={styles.inputIcon} />
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g. Plot 104, Wuse 2, Abuja"
                        value={form.homeAddress}
                        onChange={(e) => update("homeAddress", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
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
              <label htmlFor="phone" className={styles.label}>
                Phone Number
                {form.phone && (
                  <span style={{ fontSize: "11px", color: form.phone.length === 11 ? "#10B981" : "var(--text-tertiary)", marginLeft: 6 }}>
                    ({form.phone.length}/11 digits)
                  </span>
                )}
              </label>
              <div className={styles.inputWrap}>
                <Phone size={18} className={styles.inputIcon} />
                <input
                  id="phone"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  className={styles.input}
                  placeholder="11-digit Phone (e.g. 08012345678)"
                  value={form.phone}
                  maxLength={11}
                  inputMode="numeric"
                  pattern="[0-9]{11}"
                  onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
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

          <p className={styles.testCreds} style={{ textAlign: "center", marginTop: "var(--space-6)" }}>
            By creating an account, you agree to our{" "}
            <Link href="/terms" style={{ color: "#00A8B5" }}>Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" style={{ color: "#00A8B5" }}>Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
