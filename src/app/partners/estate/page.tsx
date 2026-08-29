"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Users,
  Wrench,
  ShieldCheck,
  Wallet,
  FileText,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  QrCode,
  Copy,
  Download,
  Search,
  Filter,
  DollarSign,
  Award,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Zap,
} from "lucide-react";
import styles from "./estate.module.css";
import { PartnerProfile, PartnerEstate, EstateResident, EstateServiceRequest, PartnerPayoutTransaction } from "@/lib/partners/types";
import { downloadBrandedQrBadge } from "@/lib/qr-code";

export default function EstatePortalPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#070E1A", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8", fontWeight: 700 }}>
          Loading Estate Management Portal...
        </div>
      }
    >
      <EstatePortalContent />
    </Suspense>
  );
}

function EstatePortalContent() {
  const searchParams = useSearchParams();
  const partnerParam = searchParams.get("partnerId") || searchParams.get("code") || "ptr_sunnyvale_facility";

  const [activeTab, setActiveTab] = useState<
    "estates" | "residents" | "requests" | "artisans" | "wallet" | "reports"
  >("estates");

  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [estates, setEstates] = useState<PartnerEstate[]>([]);
  const [residents, setResidents] = useState<EstateResident[]>([]);
  const [requests, setRequests] = useState<EstateServiceRequest[]>([]);
  const [payouts, setPayouts] = useState<PartnerPayoutTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddEstateOpen, setIsAddEstateOpen] = useState(false);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form states
  const [estateForm, setEstateForm] = useState({
    name: "",
    address: "",
    city: "Abuja",
    state: "FCT",
    totalUnits: 120,
    gateSecurityPhone: "",
    gatePassRequired: true,
  });

  const [residentForm, setResidentForm] = useState({
    estateId: "",
    residentName: "",
    unitNumber: "",
    phone: "",
    email: "",
  });

  const [withdrawAmount, setWithdrawAmount] = useState<number>(50000);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/partners/me?partnerId=${encodeURIComponent(partnerParam)}`);
      const data = await res.json();
      if (data.success && data.partner) {
        setPartner(data.partner);
        setEstates(data.estates || []);
        setResidents(data.residents || []);
        setRequests(data.requests || []);
        setPayouts(data.payouts || []);
        if (data.estates?.length > 0 && !residentForm.estateId) {
          setResidentForm((prev) => ({ ...prev, estateId: data.estates[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load estate portal data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [partnerParam]);

  const handleCreateEstate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    setActionError("");
    try {
      const res = await fetch("/api/partners/estates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...estateForm, partnerId: partner.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add estate");
      setActionSuccess("Estate added successfully!");
      setIsAddEstateOpen(false);
      fetchPortalData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleEnrollResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    setActionError("");
    try {
      const res = await fetch("/api/partners/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...residentForm, partnerId: partner.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enroll resident");
      setActionSuccess(data.message || "Resident enrolled successfully!");
      setIsAddResidentOpen(false);
      fetchPortalData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    setActionError("");
    try {
      const res = await fetch("/api/partners/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: partner.id,
          amount: withdrawAmount,
          bankName: partner.bankName,
          accountNumber: partner.bankAccount,
          accountName: partner.accountName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit withdrawal request");
      setActionSuccess(data.message || "Withdrawal request submitted!");
      setIsWithdrawOpen(false);
      fetchPortalData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleCopyBookingLink = () => {
    if (!partner) return;
    const url = `https://handyhubpro.ng/book?partner=${partner.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Preferred Artisans for Estate
  const preferredArtisans = [
    {
      name: "Musa Danladi",
      trade: "Master Plumber & Pipe Engineer",
      rating: 4.9,
      jobsCompleted: 142,
      phone: "08029988112",
      state: "FCT Abuja",
      securityBadge: "VERIFIED_GATE_PASS_APPROVED",
    },
    {
      name: "Ibrahim Yakubu",
      trade: "HVAC & AC Inverter Specialist",
      rating: 4.8,
      jobsCompleted: 98,
      phone: "08145566778",
      state: "FCT Abuja",
      securityBadge: "VERIFIED_GATE_PASS_APPROVED",
    },
    {
      name: "Biodun Olatunji",
      trade: "NAFDAC Certified Pest Control Tech",
      rating: 5.0,
      jobsCompleted: 215,
      phone: "08033221144",
      state: "FCT Abuja",
      securityBadge: "VERIFIED_GATE_PASS_APPROVED",
    },
    {
      name: "Blessing Amadi",
      trade: "Industrial & Steam Upholstery Lead",
      rating: 4.9,
      jobsCompleted: 178,
      phone: "08187766554",
      state: "FCT Abuja",
      securityBadge: "VERIFIED_GATE_PASS_APPROVED",
    },
    {
      name: "Sunday Ogbonna",
      trade: "Solar, Inverter & High Voltage Electrician",
      rating: 4.9,
      jobsCompleted: 160,
      phone: "08077665544",
      state: "FCT Abuja",
      securityBadge: "VERIFIED_GATE_PASS_APPROVED",
    },
  ];

  const totalUnitsAcrossEstates = estates.reduce((sum, e) => sum + (e.totalUnits || 0), 0);
  const totalOccupiedUnits = estates.reduce((sum, e) => sum + (e.occupiedUnits || 0), 0);

  return (
    <div className={styles.portal}>
      {/* 1. TOP NAV */}
      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          <div className={styles.brandGroup}>
            <Link href="/" style={{ textDecoration: "none", color: "#FFFFFF", fontWeight: 900, fontSize: "1.2rem" }}>
              <span style={{ color: "#00A8B5" }}>HandyHub</span> <span style={{ color: "#F59E0B" }}>Pro</span>
            </Link>
            <span className={styles.portalBadge}>Estate Manager Portal</span>
          </div>

          <div className={styles.partnerInfo}>
            <div
              className={styles.tierBadge}
              style={{
                background: partner?.tierLevel === "GOLD" ? "rgba(245, 158, 11, 0.15)" : "rgba(0, 168, 181, 0.15)",
                border: partner?.tierLevel === "GOLD" ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(0, 168, 181, 0.4)",
                color: partner?.tierLevel === "GOLD" ? "#F59E0B" : "#38BDF8",
              }}
            >
              <Award size={14} />
              <span>{partner?.tierLevel || "GOLD"} TIER PARTNER</span>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.92rem" }}>
                {partner?.companyName || partner?.name || "Sunnyvale Facility Services"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>ID: {partner?.partnerId || "HHP-PTR-88210"}</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. OVERVIEW BANNER */}
      <section className={styles.overviewBanner}>
        <div className={styles.bannerContainer}>
          <div>
            <h1 className={styles.bannerTitle}>
              {partner?.companyName || "Sunnyvale Facilities & Asset Management"}
            </h1>
            <p className={styles.bannerSubtitle}>
              Estate facility management hub &bull; 5.0% recurring revenue-share on all verified resident maintenance bookings.
            </p>
          </div>

          <div className={styles.quickActions}>
            <button onClick={handleCopyBookingLink} className={styles.btnTurquoise}>
              <Copy size={16} />
              <span>{copiedLink ? "Link Copied!" : "Copy Estate Booking Link"}</span>
            </button>

            <button onClick={() => setIsQrOpen(true)} className={styles.btnOrange}>
              <QrCode size={16} />
              <span>Estate Gate QR Pass</span>
            </button>
          </div>
        </div>
      </section>

      {/* Notification banner */}
      {actionSuccess && (
        <div
          style={{
            maxWidth: 1400,
            margin: "16px auto 0",
            padding: "12px 24px",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: 10,
            color: "#6EE7B7",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} style={{ background: "none", border: "none", color: "#6EE7B7", cursor: "pointer" }}>
            ✕
          </button>
        </div>
      )}

      {/* 3. METRIC KPI CARDS */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Available Wallet</span>
            <div className={styles.kpiIconBox} style={{ background: "rgba(0, 168, 181, 0.15)" }}>
              <Wallet size={18} color="#00A8B5" />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ color: "#38BDF8" }}>
            ₦{(partner?.walletBalance || 285400).toLocaleString()}
          </div>
          <div className={styles.kpiSubtext}>Ready for instant monthly payout</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Managed Estates</span>
            <div className={styles.kpiIconBox} style={{ background: "rgba(245, 158, 11, 0.15)" }}>
              <Building2 size={18} color="#F59E0B" />
            </div>
          </div>
          <div className={styles.kpiValue}>{estates.length} Estates</div>
          <div className={styles.kpiSubtext}>
            {totalOccupiedUnits} / {totalUnitsAcrossEstates} Units Occupied
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Enrolled Residents</span>
            <div className={styles.kpiIconBox} style={{ background: "rgba(16, 185, 129, 0.15)" }}>
              <Users size={18} color="#10B981" />
            </div>
          </div>
          <div className={styles.kpiValue}>{residents.length} Active</div>
          <div className={styles.kpiSubtext}>+₦1,000 bonus per verified unit</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Lifetime Earnings</span>
            <div className={styles.kpiIconBox} style={{ background: "rgba(168, 85, 247, 0.15)" }}>
              <TrendingUp size={18} color="#A855F7" />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ color: "#F59E0B" }}>
            ₦{(partner?.totalEarnings || 842000).toLocaleString()}
          </div>
          <div className={styles.kpiSubtext}>₦{(partner?.totalWithdrawn || 556600).toLocaleString()} Paid Out</div>
        </div>
      </div>

      {/* 4. TABS NAVIGATION */}
      <div className={styles.tabsBar}>
        <button
          onClick={() => setActiveTab("estates")}
          className={`${styles.tabBtn} ${activeTab === "estates" ? styles.activeTab : ""}`}
        >
          <Building2 size={16} />
          <span>My Estates ({estates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("residents")}
          className={`${styles.tabBtn} ${activeTab === "residents" ? styles.activeTab : ""}`}
        >
          <Users size={16} />
          <span>Residents Directory ({residents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`${styles.tabBtn} ${activeTab === "requests" ? styles.activeTab : ""}`}
        >
          <Wrench size={16} />
          <span>Service Requests &amp; Live Tracking ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("artisans")}
          className={`${styles.tabBtn} ${activeTab === "artisans" ? styles.activeTab : ""}`}
        >
          <ShieldCheck size={16} />
          <span>Preferred Artisan Roster ({preferredArtisans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("wallet")}
          className={`${styles.tabBtn} ${activeTab === "wallet" ? styles.activeTab : ""}`}
        >
          <Wallet size={16} />
          <span>Commission Wallet &amp; Payouts</span>
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`${styles.tabBtn} ${activeTab === "reports" ? styles.activeTab : ""}`}
        >
          <FileText size={16} />
          <span>Audit Reports &amp; Export</span>
        </button>
      </div>

      {/* 5. MAIN TAB CONTENT */}
      <main className={styles.contentArea}>
        {/* TAB 1: MY ESTATES */}
        {activeTab === "estates" && (
          <div className={styles.cardPanel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <Building2 size={22} color="#00A8B5" />
                <span>Managed Estate Portfolio</span>
              </div>
              <button onClick={() => setIsAddEstateOpen(true)} className={styles.btnTurquoise}>
                <Plus size={16} />
                <span>Register New Estate</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
              {estates.map((e) => (
                <div
                  key={e.id}
                  style={{
                    background: "rgba(15, 29, 51, 0.7)",
                    border: "1px solid rgba(0, 168, 181, 0.25)",
                    borderRadius: 16,
                    padding: 24,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>{e.name}</h3>
                      <div style={{ fontSize: "0.85rem", color: "#94A3B8", display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={14} color="#00A8B5" />
                        <span>{e.address}, {e.city}</span>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: e.gatePassRequired ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                        color: e.gatePassRequired ? "#34D399" : "#94A3B8",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                      }}
                    >
                      {e.gatePassRequired ? "GATE PASS ACTIVE" : "OPEN ACCESS"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "20px 0", background: "rgba(0,0,0,0.2)", padding: 14, borderRadius: 10 }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>TOTAL UNITS</span>
                      <strong style={{ color: "#E2E8F0", fontSize: "1.1rem" }}>{e.totalUnits} Units</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>OCCUPIED</span>
                      <strong style={{ color: "#38BDF8", fontSize: "1.1rem" }}>{e.occupiedUnits || e.totalUnits} Units</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "#94A3B8", marginBottom: 16 }}>
                    Gate Security: <strong style={{ color: "#E2E8F0" }}>{e.gateSecurityPhone || partner?.phone}</strong>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => {
                        setResidentForm((prev) => ({ ...prev, estateId: e.id }));
                        setIsAddResidentOpen(true);
                      }}
                      className={styles.btnTurquoise}
                      style={{ flex: 1, padding: "10px 14px", fontSize: "0.85rem", justifyContent: "center" }}
                    >
                      <Plus size={14} />
                      <span>Add Resident</span>
                    </button>

                    <button
                      onClick={handleCopyBookingLink}
                      className={styles.btnOrange}
                      style={{ padding: "10px 14px", fontSize: "0.85rem" }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: RESIDENTS DIRECTORY */}
        {activeTab === "residents" && (
          <div className={styles.cardPanel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTitle}>
                  <Users size={22} color="#00A8B5" />
                  <span>Enrolled Estate Residents</span>
                </div>
                <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginTop: 4 }}>
                  Every resident who registers under your estate earns you an instant ₦1,000 bonus plus 5% lifetime booking commission.
                </p>
              </div>
              <button onClick={() => setIsAddResidentOpen(true)} className={styles.btnOrange}>
                <Plus size={16} />
                <span>Onboard New Resident</span>
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.portalTable}>
                <thead>
                  <tr>
                    <th>Resident Name</th>
                    <th>Unit / House Address</th>
                    <th>Phone / WhatsApp</th>
                    <th>Total Bookings</th>
                    <th>Total Spend</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {residents.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#FFFFFF" }}>{r.residentName}</div>
                        <div style={{ fontSize: "0.78rem", color: "#64748B" }}>{r.email || "No email"}</div>
                      </td>
                      <td>{r.unitNumber}</td>
                      <td>{r.phone}</td>
                      <td>
                        <strong style={{ color: "#38BDF8" }}>{r.totalBookings} Jobs</strong>
                      </td>
                      <td>₦{r.totalSpendNgn.toLocaleString()}</td>
                      <td>
                        <span className={styles.statusBadge} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981" }}>
                          ● ACTIVE RESIDENT
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICE REQUESTS & LIVE TRACKING */}
        {activeTab === "requests" && (
          <div className={styles.cardPanel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <Wrench size={22} color="#00A8B5" />
                <span>Live Estate Maintenance Requests</span>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.portalTable}>
                <thead>
                  <tr>
                    <th>Unit &amp; Resident</th>
                    <th>Service Requested</th>
                    <th>Assigned Artisan</th>
                    <th>Status</th>
                    <th>Job Value</th>
                    <th>Your Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#FFFFFF" }}>{req.unitNumber}</div>
                        <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>{req.residentName}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#E2E8F0" }}>{req.serviceName}</div>
                        <span style={{ fontSize: "0.75rem", color: "#38BDF8", textTransform: "uppercase" }}>
                          {req.serviceCategory}
                        </span>
                      </td>
                      <td>
                        {req.assignedArtisan ? (
                          <div>
                            <div style={{ fontWeight: 700, color: "#F59E0B" }}>{req.assignedArtisan.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                              {req.assignedArtisan.trade} &bull; ★ {req.assignedArtisan.rating}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#64748B" }}>Dispatching...</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={styles.statusBadge}
                          style={{
                            background:
                              req.status === "COMPLETED"
                                ? "rgba(16, 185, 129, 0.15)"
                                : req.status === "IN_PROGRESS"
                                ? "rgba(56, 189, 248, 0.15)"
                                : "rgba(245, 158, 11, 0.15)",
                            color:
                              req.status === "COMPLETED"
                                ? "#10B981"
                                : req.status === "IN_PROGRESS"
                                ? "#38BDF8"
                                : "#F59E0B",
                          }}
                        >
                          ● {req.status}
                        </span>
                      </td>
                      <td>₦{req.amount.toLocaleString()}</td>
                      <td>
                        <strong style={{ color: "#10B981" }}>+₦{req.commissionEarned.toLocaleString()}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PREFERRED ARTISAN ROSTER */}
        {activeTab === "artisans" && (
          <div className={styles.cardPanel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTitle}>
                  <ShieldCheck size={22} color="#00A8B5" />
                  <span>Assigned Estate Artisan Roster</span>
                </div>
                <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginTop: 4 }}>
                  Pre-screened, background-checked HandyHub artisans cleared for permanent gate security pass into your estates.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {preferredArtisans.map((art, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(15, 29, 51, 0.7)",
                    border: "1px solid rgba(0, 168, 181, 0.2)",
                    borderRadius: 14,
                    padding: 20,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFFFFF", margin: "0 0 2px 0" }}>{art.name}</h4>
                      <span style={{ fontSize: "0.82rem", color: "#38BDF8", fontWeight: 600 }}>{art.trade}</span>
                    </div>
                    <span style={{ padding: "3px 8px", background: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", borderRadius: 6, fontSize: "0.78rem", fontWeight: 800 }}>
                      ★ {art.rating}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "#94A3B8", margin: "12px 0" }}>
                    Verified Jobs in FCT: <strong style={{ color: "#E2E8F0" }}>{art.jobsCompleted} Completed</strong>
                  </div>

                  <div
                    style={{
                      padding: "6px 10px",
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      color: "#34D399",
                      fontWeight: 700,
                      marginBottom: 14,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ShieldCheck size={13} />
                    <span>GATE SECURITY PASS CLEARED</span>
                  </div>

                  <a
                    href={`tel:${art.phone}`}
                    className={styles.btnTurquoise}
                    style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: "0.85rem", textDecoration: "none" }}
                  >
                    <Phone size={14} />
                    <span>Contact / Dispatch Artisan</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: COMMISSION WALLET & PAYOUTS */}
        {activeTab === "wallet" && (
          <div className={styles.cardPanel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTitle}>
                  <Wallet size={22} color="#00A8B5" />
                  <span>Commission Wallet &amp; Payout Ledger</span>
                </div>
                <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginTop: 4 }}>
                  Automatic monthly settlement to your Nigerian bank account or instant on-demand withdrawal.
                </p>
              </div>
              <button onClick={() => setIsWithdrawOpen(true)} className={styles.btnOrange}>
                <ArrowUpRight size={16} />
                <span>Request Commission Payout</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
              <div style={{ background: "rgba(0, 168, 181, 0.08)", border: "1px solid rgba(0, 168, 181, 0.25)", padding: 24, borderRadius: 14 }}>
                <span style={{ fontSize: "0.85rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>
                  Available for Withdrawal
                </span>
                <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#38BDF8", margin: "6px 0 10px 0" }}>
                  ₦{(partner?.walletBalance || 285400).toLocaleString()}
                </div>
                <span style={{ fontSize: "0.8rem", color: "#10B981" }}>Minimum payout threshold: ₦10,000</span>
              </div>

              <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", padding: 24, borderRadius: 14 }}>
                <span style={{ fontSize: "0.85rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>
                  Registered Settlement Bank
                </span>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#FFFFFF", margin: "6px 0 2px 0" }}>
                  {partner?.bankName || "Guaranty Trust Bank (GTB)"}
                </div>
                <div style={{ fontSize: "1rem", color: "#F59E0B", fontWeight: 700 }}>
                  {partner?.bankAccount || "0123984756"} &bull; {partner?.accountName || partner?.name}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 16 }}>Payout Transaction History</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.portalTable}>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Destination Account</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length > 0 ? (
                    payouts.map((p) => (
                      <tr key={p.id}>
                        <td><strong style={{ color: "#38BDF8" }}>{p.reference}</strong></td>
                        <td>{p.requestedAt?.split("T")[0]}</td>
                        <td>{p.bankName} ({p.accountNumber})</td>
                        <td><strong>₦{p.amount.toLocaleString()}</strong></td>
                        <td>
                          <span className={styles.statusBadge} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981" }}>
                            ● {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "#94A3B8", padding: 24 }}>
                        No withdrawals requested yet. Click &quot;Request Commission Payout&quot; to withdraw earnings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: REPORTS & AUDIT */}
        {activeTab === "reports" && (
          <div className={styles.cardPanel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTitle}>
                  <FileText size={22} color="#00A8B5" />
                  <span>Estate Maintenance Audit &amp; PDF Report</span>
                </div>
                <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginTop: 4 }}>
                  Comprehensive exportable summary for estate executive committees and facility audits.
                </p>
              </div>
              <button
                onClick={() => alert("Estate Audit Report generated! Download starting...")}
                className={styles.btnTurquoise}
              >
                <Download size={16} />
                <span>Export Audit CSV / PDF</span>
              </button>
            </div>

            <div style={{ background: "rgba(15, 29, 51, 0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
              <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#38BDF8", marginBottom: 16 }}>
                Monthly Maintenance Breakdown (August 2026)
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                <div style={{ background: "#0B1424", padding: 16, borderRadius: 10 }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748B" }}>TOTAL JOBS EXECUTED</span>
                  <strong style={{ display: "block", fontSize: "1.4rem", color: "#FFFFFF" }}>28 Jobs</strong>
                </div>
                <div style={{ background: "#0B1424", padding: 16, borderRadius: 10 }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748B" }}>TOTAL RESIDENT SPEND</span>
                  <strong style={{ display: "block", fontSize: "1.4rem", color: "#38BDF8" }}>₦945,000</strong>
                </div>
                <div style={{ background: "#0B1424", padding: 16, borderRadius: 10 }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748B" }}>ESTATE REV-SHARE (5%)</span>
                  <strong style={{ display: "block", fontSize: "1.4rem", color: "#10B981" }}>₦47,250</strong>
                </div>
                <div style={{ background: "#0B1424", padding: 16, borderRadius: 10 }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748B" }}>AVG ARTISAN RATING</span>
                  <strong style={{ display: "block", fontSize: "1.4rem", color: "#F59E0B" }}>4.92 ★</strong>
                </div>
              </div>

              <p style={{ fontSize: "0.85rem", color: "#94A3B8", margin: 0 }}>
                All services are backed by HandyHub Pro Solutions&apos; 14-day workmanship guarantee with escrow protection.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: ADD ESTATE */}
      {isAddEstateOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddEstateOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 6 }}>
              Register New Estate
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginBottom: 20 }}>
              Add another gated community or residential complex to your facility management portfolio.
            </p>

            <form onSubmit={handleCreateEstate}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                    Estate Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Carlton Gate Luxury Terraces"
                    value={estateForm.name}
                    onChange={(e) => setEstateForm({ ...estateForm, name: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "#0B1424", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                    Estate Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plot 402, Cadastral Zone B09, Kado"
                    value={estateForm.address}
                    onChange={(e) => setEstateForm({ ...estateForm, address: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "#0B1424", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                      Total Units
                    </label>
                    <input
                      type="number"
                      value={estateForm.totalUnits}
                      onChange={(e) => setEstateForm({ ...estateForm, totalUnits: Number(e.target.value) })}
                      style={{ width: "100%", padding: "10px 14px", background: "#0B1424", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                      Gate Security Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="0809 112 2334"
                      value={estateForm.gateSecurityPhone}
                      onChange={(e) => setEstateForm({ ...estateForm, gateSecurityPhone: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", background: "#0B1424", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setIsAddEstateOpen(false)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#CBD5E1", fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnTurquoise} style={{ flex: 1, justifyContent: "center" }}>
                  Save Estate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD RESIDENT */}
      {isAddResidentOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddResidentOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 6 }}>
              Onboard Estate Resident
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginBottom: 20 }}>
              Enroll a resident to trigger your ₦1,000 instant activation bonus and link them to your estate.
            </p>

            <form onSubmit={handleEnrollResident}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                    Select Estate *
                  </label>
                  <select
                    value={residentForm.estateId}
                    onChange={(e) => setResidentForm({ ...residentForm, estateId: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "#0B1424", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF" }}
                  >
                    {estates.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                    Resident Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Aliyu Mohammed"
                    value={residentForm.residentName}
                    onChange={(e) => setResidentForm({ ...residentForm, residentName: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "#0B1424", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                      Unit / Flat Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. House 24, Jasmine Close"
                      value={residentForm.unitNumber}
                      onChange={(e) => setResidentForm({ ...residentForm, unitNumber: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", background: "#0B1424", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0802 345 6789"
                      value={residentForm.phone}
                      onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", background: "#0B1424", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 4 }}>
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="resident@gmail.com"
                    value={residentForm.email}
                    onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "#0B1424", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#FFFFFF" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setIsAddResidentOpen(false)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#CBD5E1", fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnOrange} style={{ flex: 1, justifyContent: "center" }}>
                  Enroll Resident (+₦1,000)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: WITHDRAWAL */}
      {isWithdrawOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsWithdrawOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 6 }}>
              Request Commission Payout
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginBottom: 20 }}>
              Available balance: <strong style={{ color: "#38BDF8" }}>₦{(partner?.walletBalance || 285400).toLocaleString()}</strong>
            </p>

            <form onSubmit={handleWithdrawal}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                  Withdrawal Amount (₦)
                </label>
                <input
                  type="number"
                  min={10000}
                  max={partner?.walletBalance || 285400}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  style={{ width: "100%", padding: "12px 16px", background: "#0B1424", border: "1px solid rgba(0,168,181,0.4)", borderRadius: 10, color: "#FFFFFF", fontSize: "1.2rem", fontWeight: 800 }}
                />
              </div>

              <div style={{ background: "rgba(0,0,0,0.25)", padding: 16, borderRadius: 10, marginBottom: 24 }}>
                <div style={{ fontSize: "0.78rem", color: "#64748B" }}>DISBURSEMENT DESTINATION</div>
                <div style={{ fontWeight: 800, color: "#FFFFFF" }}>{partner?.bankName || "Guaranty Trust Bank"}</div>
                <div style={{ color: "#F59E0B", fontWeight: 700 }}>{partner?.bankAccount || "0123984756"} &bull; {partner?.accountName || partner?.name}</div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setIsWithdrawOpen(false)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#CBD5E1", fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnOrange} style={{ flex: 1, justifyContent: "center" }}>
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: QR CODE */}
      {isQrOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsQrOpen(false)}>
          <div className={styles.modalBox} style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 6 }}>
              Estate Gate QR Code Pass
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginBottom: 20 }}>
              Print and place at estate security gates or resident welcome boards.
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={partner?.qrCodeUrl}
              alt="Estate QR Code"
              style={{ width: 220, height: 260, borderRadius: 12, margin: "0 auto 20px" }}
            />

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={async () => {
                  if (!partner) return;
                  const deepLink = `https://handyhubpro.ng/book?partner=${partner.referralCode}`;
                  await downloadBrandedQrBadge({
                    deepLink,
                    partnerId: partner.partnerId,
                    referralCode: partner.referralCode,
                    title: partner.companyName || partner.name || "ESTATE MANAGEMENT PASS",
                    subtitle: "SCAN TO BOOK VERIFIED ARTISANS",
                    filename: `HandyHub_Estate_Pass_${partner.partnerId}.png`,
                  });
                }}
                className={styles.btnTurquoise}
                style={{ flex: 1, justifyContent: "center", cursor: "pointer", border: "none" }}
              >
                <Download size={16} />
                <span>Download Estate QR Pass</span>
              </button>
              <button onClick={() => setIsQrOpen(false)} style={{ padding: "12px 20px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, color: "#CBD5E1", fontWeight: 700, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
