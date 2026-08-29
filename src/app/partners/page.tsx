"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Home,
  Sparkles,
  Users,
  Briefcase,
  Video,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  QrCode,
  Download,
  Copy,
  ChevronRight,
  HelpCircle,
  Clock,
  Banknote,
  Award,
} from "lucide-react";
import styles from "./partners.module.css";
import { PARTNER_CATEGORIES_METADATA, PARTNER_TIERS } from "@/lib/partners/config";
import { PartnerCategory } from "@/lib/partners/types";
import { useActiveStates } from "@/hooks/useActiveStates";
import { downloadBrandedQrBadge } from "@/lib/qr-code";

export default function PartnersLandingPage() {
  const router = useRouter();
  const { activeStates } = useActiveStates();
  const [selectedCategory, setSelectedCategory] = useState<PartnerCategory>("ESTATE_MANAGER");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculator State
  const [calcCategory, setCalcCategory] = useState<PartnerCategory>("ESTATE_MANAGER");
  const [calcVolume, setCalcVolume] = useState<number>(120); // jobs or units
  const [calcAvgTicket, setCalcAvgTicket] = useState<number>(35000); // ₦35,000 avg job

  // Registration Form State
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    category: "ESTATE_MANAGER" as PartnerCategory,
    operatingState: "FCT",
    city: "Abuja",
    address: "",
    estateName: "",
    totalUnits: 150,
    bankName: "Guaranty Trust Bank",
    bankAccount: "",
    accountName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [registeredPartner, setRegisteredPartner] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Calculate projected earnings
  const ratePercent =
    calcCategory === "ESTATE_MANAGER" ? 5.0 : calcCategory === "REALTOR" ? 6.0 : calcCategory === "CORPORATE_PARTNER" ? 7.5 : 4.0;
  const projectedRevenue = calcVolume * calcAvgTicket;
  const rawCommission = projectedRevenue * (ratePercent / 100);
  const projectedMonthlyIncome = Math.round(rawCommission);

  const openRegisterModal = (cat?: PartnerCategory) => {
    if (cat) {
      setFormData((prev) => ({ ...prev, category: cat }));
    }
    setRegisteredPartner(null);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/partners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete partner registration");
      }

      setRegisteredPartner(data.partner);
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getCategoryIcon = (cat: PartnerCategory) => {
    switch (cat) {
      case "ESTATE_MANAGER":
        return <Building2 size={26} color="#00A8B5" />;
      case "REALTOR":
        return <Home size={26} color="#EA580C" />;
      case "INFLUENCER":
        return <Sparkles size={26} color="#8B5CF6" />;
      case "COMMUNITY_LEADER":
        return <Users size={26} color="#10B981" />;
      case "CORPORATE_PARTNER":
        return <Briefcase size={26} color="#0EA5E9" />;
      case "CONTENT_CREATOR":
        return <Video size={26} color="#EC4899" />;
    }
  };

  return (
    <div className={styles.page}>
      {/* 1. HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Award size={16} />
            <span>HandyHub Partner Network</span>
          </div>

          <h1 className={styles.title}>
            Monetize Your Properties & Audience with <br />
            <span className={styles.highlightTurquoise}>Verified Artisan</span>{" "}
            <span className={styles.highlightOrange}>Revenue Share</span>
          </h1>

          <p className={styles.subtitle}>
            Join Nigeria&apos;s leading enterprise partner ecosystem. Whether you manage residential estates, broker luxury homes, or command an active audience, earn 4% to 7.5% recurring commissions on every verified maintenance service.
          </p>

          <div className={styles.heroActions}>
            <button onClick={() => openRegisterModal()} className={styles.btnPrimary}>
              <span>Become a Partner Today</span>
              <ArrowRight size={18} />
            </button>
            <Link href="/partners/estate" className={styles.btnSecondary}>
              <Building2 size={18} color="#00A8B5" />
              <span>Explore Estate Portal</span>
            </Link>
          </div>

          {/* Key Stats Ribbon */}
          <div className={styles.statsRibbon}>
            <div className={styles.statItem}>
              <div className={styles.statNum} style={{ color: "#38BDF8" }}>₦250M+</div>
              <div className={styles.statLabel}>Partner Payouts Disbursed</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNum} style={{ color: "#F59E0B" }}>450+</div>
              <div className={styles.statLabel}>Active Gated Estates</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNum} style={{ color: "#10B981" }}>4.5 ★</div>
              <div className={styles.statLabel}>Verified Artisan Quality</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNum} style={{ color: "#A855F7" }}>1st of Month</div>
              <div className={styles.statLabel}>Automated Bank Settlements</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PARTNER CATEGORIES */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Customized Solutions</div>
          <h2 className={styles.sectionTitle}>Tailored Programs for Every Partner Category</h2>
          <p className={styles.sectionSubtitle}>
            Select your category to access dedicated tools, custom QR badges, automated gate security passes, and priority dispatch.
          </p>
        </div>

        <div className={styles.categoryGrid}>
          {(Object.keys(PARTNER_CATEGORIES_METADATA) as PartnerCategory[]).map((cat) => {
            const meta = PARTNER_CATEGORIES_METADATA[cat];
            return (
              <div key={cat} className={styles.categoryCard}>
                <div>
                  <div className={styles.cardHeader}>
                    <div
                      className={styles.cardIconBox}
                      style={{ background: `${meta.badgeColor}18`, border: `1px solid ${meta.badgeColor}40` }}
                    >
                      {getCategoryIcon(cat)}
                    </div>
                    <h3 className={styles.cardTitle}>{meta.label}</h3>
                    <p className={styles.cardDesc}>{meta.description}</p>
                    <div className={styles.cardRateBadge}>{meta.defaultRateDisplay}</div>
                  </div>

                  <ul className={styles.benefitList}>
                    {meta.keyBenefits.map((b, i) => (
                      <li key={i} className={styles.benefitItem}>
                        <CheckCircle2 size={16} color={meta.badgeColor} style={{ flexShrink: 0, marginTop: 3 }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => openRegisterModal(cat)}
                  className={styles.cardActionBtn}
                  style={{
                    background: cat === "ESTATE_MANAGER" ? "linear-gradient(135deg, #00A8B5 0%, #0284C7 100%)" : "rgba(255,255,255,0.08)",
                    color: "#FFFFFF",
                    border: cat === "ESTATE_MANAGER" ? "none" : "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <span>Register as {meta.label.split(" ")[0]}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. INTERACTIVE REVENUE CALCULATOR */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.calculatorCard}>
          <div className={styles.sectionHeader} style={{ marginBottom: 36 }}>
            <div className={styles.sectionTag}>Earning Potential</div>
            <h2 className={styles.sectionTitle}>Project Your Monthly Partner Commission</h2>
            <p className={styles.sectionSubtitle}>
              Slide your expected monthly maintenance jobs or resident units to simulate your recurring monthly revenue share.
            </p>
          </div>

          <div className={styles.calcGrid}>
            <div>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <span className={styles.sliderLabel}>Partner Category</span>
                  <span className={styles.sliderValue}>{PARTNER_CATEGORIES_METADATA[calcCategory].label}</span>
                </div>
                <select
                  value={calcCategory}
                  onChange={(e) => setCalcCategory(e.target.value as PartnerCategory)}
                  className={styles.formSelect}
                  style={{ width: "100%" }}
                >
                  <option value="ESTATE_MANAGER">Estate & Facility Manager (5.0%)</option>
                  <option value="REALTOR">Realtor & Property Broker (6.0%)</option>
                  <option value="INFLUENCER">Influencer & Creator (4.0%)</option>
                  <option value="COMMUNITY_LEADER">Community Leader & CDA (5.0%)</option>
                  <option value="CORPORATE_PARTNER">Corporate Fleet Partner (7.5%)</option>
                </select>
              </div>

              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <span className={styles.sliderLabel}>Monthly Service Bookings / Units</span>
                  <span className={styles.sliderValue}>{calcVolume} Bookings</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={calcVolume}
                  onChange={(e) => setCalcVolume(Number(e.target.value))}
                  className={styles.rangeInput}
                />
              </div>

              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <span className={styles.sliderLabel}>Average Job Ticket Size</span>
                  <span className={styles.sliderValue}>₦{calcAvgTicket.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="150000"
                  step="5000"
                  value={calcAvgTicket}
                  onChange={(e) => setCalcAvgTicket(Number(e.target.value))}
                  className={styles.rangeInput}
                />
              </div>
            </div>

            <div className={styles.resultBox}>
              <div className={styles.resultTitle}>Estimated Monthly Passive Earnings</div>
              <div className={styles.resultAmount}>₦{projectedMonthlyIncome.toLocaleString()}</div>
              <p className={styles.resultNote}>
                Based on {calcVolume} bookings at ₦{calcAvgTicket.toLocaleString()} average order value with {ratePercent}% revenue-share. Automatically settled to your Nigerian bank account.
              </p>
              <button
                onClick={() => openRegisterModal(calcCategory)}
                className={styles.btnPrimary}
                style={{ marginTop: 24, width: "100%", justifyContent: "center" }}
              >
                <span>Unlock This Revenue Stream</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BECOME A PARTNER MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
              ✕
            </button>

            {!registeredPartner ? (
              <>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div className={styles.badge}>
                    <Award size={14} />
                    <span>Instant Partner Registration</span>
                  </div>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>
                    Become a HandyHub Partner
                  </h2>
                  <p style={{ color: "#94A3B8", fontSize: "0.95rem" }}>
                    Get your official Partner ID, customizable referral code, and downloadable QR code in seconds.
                  </p>
                </div>

                {formError && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: 10,
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#FCA5A5",
                      fontSize: "0.9rem",
                      marginBottom: 20,
                    }}
                  >
                    {formError}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit}>
                  <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chief Babatunde Adeleke"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={styles.formInput}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Estate / Company / Brand Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sunnyvale Facilities Ltd"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className={styles.formInput}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="partner@yourdomain.ng"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={styles.formInput}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Phone Number (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="0803 123 4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={styles.formInput}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Partner Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as PartnerCategory })}
                        className={styles.formSelect}
                      >
                        <option value="ESTATE_MANAGER">Estate & Facility Manager</option>
                        <option value="REALTOR">Realtor & Property Broker</option>
                        <option value="INFLUENCER">Influencer & Creator</option>
                        <option value="COMMUNITY_LEADER">Community Leader & CDA</option>
                        <option value="CORPORATE_PARTNER">Corporate Fleet Partner</option>
                        <option value="CONTENT_CREATOR">Digital Content Affiliate</option>
                      </select>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Operating State *</label>
                      <select
                        value={formData.operatingState}
                        onChange={(e) => setFormData({ ...formData, operatingState: e.target.value })}
                        className={styles.formSelect}
                      >
                        {activeStates.map((st) => (
                          <option key={st.code} value={st.code}>{st.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.category === "ESTATE_MANAGER" && (
                    <div
                      style={{
                        padding: 16,
                        background: "rgba(0, 168, 181, 0.08)",
                        borderRadius: 12,
                        border: "1px solid rgba(0, 168, 181, 0.2)",
                        marginBottom: 20,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#38BDF8", fontSize: "0.9rem", marginBottom: 12 }}>
                        🏢 Initial Estate Setup
                      </div>
                      <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Primary Estate Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Sunnyvale Homes Estate"
                            value={formData.estateName}
                            onChange={(e) => setFormData({ ...formData, estateName: e.target.value })}
                            className={styles.formInput}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Total Units / Houses</label>
                          <input
                            type="number"
                            placeholder="e.g. 240"
                            value={formData.totalUnits}
                            onChange={(e) => setFormData({ ...formData, totalUnits: Number(e.target.value) })}
                            className={styles.formInput}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      padding: 16,
                      background: "rgba(245, 158, 11, 0.08)",
                      borderRadius: 12,
                      border: "1px solid rgba(245, 158, 11, 0.2)",
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#F59E0B", fontSize: "0.9rem", marginBottom: 12 }}>
                      🏦 Settlement Bank Details (For Commission Payouts)
                    </div>
                    <div className={styles.formGrid}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Bank Name</label>
                        <select
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          className={styles.formSelect}
                        >
                          <option value="Guaranty Trust Bank">Guaranty Trust Bank (GTB)</option>
                          <option value="Zenith Bank">Zenith Bank</option>
                          <option value="Access Bank">Access Bank</option>
                          <option value="United Bank for Africa">United Bank for Africa (UBA)</option>
                          <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                          <option value="Kuda Bank">Kuda Microfinance Bank</option>
                          <option value="Opay">OPay Digital Services</option>
                          <option value="Moniepoint">Moniepoint MFB</option>
                        </select>
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>10-Digit Account Number</label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="0123456789"
                          value={formData.bankAccount}
                          onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                          className={styles.formInput}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.btnPrimary}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {isSubmitting ? "Generating Partner Credentials..." : "Complete Registration & Get ID / QR Code"}
                    <ArrowRight size={18} />
                  </button>
                </form>
              </>
            ) : (
              /* Success / Credentials Screen */
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.2)",
                    border: "2px solid #10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <CheckCircle2 size={36} color="#10B981" />
                </div>

                <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#FFFFFF", marginBottom: 6 }}>
                  Welcome to HandyHub Partner Network!
                </h2>
                <p style={{ color: "#94A3B8", fontSize: "0.95rem", marginBottom: 24 }}>
                  Your official Partner ID, referral link, and high-resolution QR code are ready.
                </p>

                {/* QR Display Card */}
                <div
                  style={{
                    background: "#1E293B",
                    borderRadius: 16,
                    padding: 24,
                    border: "1px solid rgba(0, 168, 181, 0.4)",
                    marginBottom: 24,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={registeredPartner.qrCodeUrl}
                    alt="Partner QR Code"
                    style={{ width: 180, height: 210, borderRadius: 8, marginBottom: 16 }}
                  />

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                    <div style={{ background: "#0F172A", padding: "8px 16px", borderRadius: 8 }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>PARTNER ID</span>
                      <strong style={{ color: "#38BDF8", fontSize: "1.1rem" }}>{registeredPartner.partnerId}</strong>
                    </div>

                    <div style={{ background: "#0F172A", padding: "8px 16px", borderRadius: 8 }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>REFERRAL CODE</span>
                      <strong style={{ color: "#F59E0B", fontSize: "1.1rem" }}>{registeredPartner.referralCode}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <button
                    onClick={() => handleCopy(`https://handyhubpro.ng/book?partner=${registeredPartner.referralCode}`)}
                    className={styles.btnSecondary}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <Copy size={16} />
                    <span>{copiedLink ? "Link Copied!" : "Copy Booking Link"}</span>
                  </button>

                  <button
                    onClick={async () => {
                      const deepLink = `https://handyhubpro.ng/book?partner=${registeredPartner.referralCode}`;
                      await downloadBrandedQrBadge({
                        deepLink,
                        partnerId: registeredPartner.partnerId,
                        referralCode: registeredPartner.referralCode,
                        title: registeredPartner.companyName || registeredPartner.name || "HANDYHUB PARTNER",
                        subtitle: "SCAN TO BOOK VERIFIED ARTISANS",
                        filename: `HandyHub_Partner_QR_${registeredPartner.partnerId}.png`,
                      });
                    }}
                    className={styles.btnSecondary}
                    style={{ flex: 1, justifyContent: "center", cursor: "pointer" }}
                  >
                    <Download size={16} />
                    <span>Download QR Code</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    const target =
                      registeredPartner.category === "ESTATE_MANAGER"
                        ? `/partners/estate?partnerId=${registeredPartner.partnerId}&code=${registeredPartner.referralCode}`
                        : `/partners/dashboard?partnerId=${registeredPartner.partnerId}&code=${registeredPartner.referralCode}`;
                    router.push(target);
                  }}
                  className={styles.btnPrimary}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span>Launch Partner Management Portal</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
