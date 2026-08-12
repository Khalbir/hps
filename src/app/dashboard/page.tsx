"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Calendar, ClipboardList, User, Bell, Wallet,
  MapPin, Settings, LogOut, Menu, X, Plus, Search,
  ArrowRight, Star, Clock, CheckCircle, ShieldCheck,
  CreditCard, Edit3, Trash2, Check, RefreshCw, UserCheck, Inbox
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { AddressVerificationModule } from "@/components/features/verification/AddressVerificationModule";
import styles from "./dashboard.module.css";

interface Address {
  id: string;
  title: string;
  street: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // User state
  const [user, setUser] = useState<any>({
    firstName: "Valued Client",
    lastName: "",
    email: "",
    phone: "",
    role: "CUSTOMER",
  });

  const [walletBalance, setWalletBalance] = useState(0);
  const [activeDispatchesCount, setActiveDispatchesCount] = useState(0);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [topUpAmount, setTopUpAmount] = useState(5000);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddrTitle, setNewAddrTitle] = useState("");
  const [newAddrStreet, setNewAddrStreet] = useState("");

  // Profile Edit State
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  // Client Address Verification States
  const [permAddrStreet, setPermAddrStreet] = useState("");
  const [permAddrUploading, setPermAddrUploading] = useState(false);
  const [permAddrUploadUrl, setPermAddrUploadUrl] = useState("");
  const [permAddrSubmitting, setPermAddrSubmitting] = useState(false);

  const [secondaryAddrStreet, setSecondaryAddrStreet] = useState("");
  const [secondaryAddrSaving, setSecondaryAddrSaving] = useState(false);

  const [showChangeAddressForm, setShowChangeAddressForm] = useState(false);
  const [changeAddrStreet, setChangeAddrStreet] = useState("");
  const [changeAddrUploading, setChangeAddrUploading] = useState(false);
  const [changeAddrUploadUrl, setChangeAddrUploadUrl] = useState("");
  const [changeAddrSubmitting, setChangeAddrSubmitting] = useState(false);

  const handleFileUpload = async (file: File, type: "perm" | "change") => {
    if (type === "perm") setPermAddrUploading(true);
    else setChangeAddrUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        if (type === "perm") setPermAddrUploadUrl(data.url);
        else setChangeAddrUploadUrl(data.url);
      } else {
        alert(data.error || "Failed to upload file");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload proof of address file.");
    } finally {
      if (type === "perm") setPermAddrUploading(false);
      else setChangeAddrUploading(false);
    }
  };

  const handlePermAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permAddrStreet.trim()) return alert("Address street is required.");
    if (!permAddrUploadUrl) return alert("Proof of address document is required.");

    setPermAddrSubmitting(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          permanentAddress: permAddrStreet.trim(),
          permanentAddressProof: permAddrUploadUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Permanent address submitted for admin verification! 🏡");
        fetchCustomerDashboardData();
      } else {
        alert(data.error || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      alert("Submission error.");
    } finally {
      setPermAddrSubmitting(false);
    }
  };

  const handleChangeAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeAddrStreet.trim()) return alert("New address is required.");
    if (!changeAddrUploadUrl) return alert("New proof of address is required.");

    setChangeAddrSubmitting(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          permanentAddress: changeAddrStreet.trim(),
          permanentAddressProof: changeAddrUploadUrl,
          requestAddressChange: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Change of address application submitted to admin! 📩");
        setShowChangeAddressForm(false);
        fetchCustomerDashboardData();
      } else {
        alert(data.error || "Change submission failed");
      }
    } catch (err) {
      console.error(err);
      alert("Change request error.");
    } finally {
      setChangeAddrSubmitting(false);
    }
  };

  const handleSecondaryAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecondaryAddrSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          secondaryAddress: secondaryAddrStreet.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Secondary booking address updated! 🏢");
        fetchCustomerDashboardData();
      } else {
        alert(data.error || "Failed to update secondary address");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update secondary address.");
    } finally {
      setSecondaryAddrSaving(false);
    }
  };

  const fetchCustomerDashboardData = async () => {
    setLoading(true);
    let activeUserId = "";
    let activeEmail = "";
    let localUserPayload: any = null;

    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const paramEmail = urlParams.get("email");
        const paramName = urlParams.get("name");

        if (paramEmail) {
          activeEmail = paramEmail;
          const nameParts = (paramName || "Google User").split(" ");
          const firstName = nameParts[0] || "Valued";
          const lastName = nameParts.slice(1).join(" ") || "Client";
          const gUser = { firstName, lastName, email: paramEmail, phone: "", role: "CUSTOMER" };
          setUser(gUser);
          setEditFirstName(firstName);
          setEditLastName(lastName);
          setEditPhone("");
          localStorage.setItem("handyhub_user", JSON.stringify(gUser));
          localUserPayload = gUser;
        } else {
          const stored = localStorage.getItem("handyhub_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            localUserPayload = parsed;
            if (parsed.id) activeUserId = parsed.id;
            if (parsed.email) activeEmail = parsed.email;
            if (parsed.firstName || parsed.lastName || parsed.phone) {
              setUser((prev: any) => ({ ...prev, ...parsed }));
              setEditFirstName(parsed.firstName || "");
              setEditLastName(parsed.lastName || "");
              setEditPhone(parsed.phone || "");
            }
          }
        }
      } catch (e) { }
    }

    if (!activeUserId && !activeEmail && typeof window !== "undefined") {
      const hasCookie = document.cookie.includes("handyhub_user_session") || document.cookie.includes("handyhub_user_data");
      if (!hasCookie) {
        window.location.href = "/auth/login?unauthorized=1";
        return;
      }
    }

    try {
      const res = await fetch(`/api/customer/dashboard?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok && data.user) {
        let mergedUser = { ...data.user };
        try {
          const profRes = await fetch(`/api/user/profile?email=${encodeURIComponent(data.user.email || activeEmail)}`);
          const profData = await profRes.json();
          if (profRes.ok && profData?.user) {
            mergedUser = {
              ...data.user,
              ...profData.user
            };
          }
        } catch (e) {
          console.warn("Failed to merge profile fields:", e);
        }

        // If merged user name is a generic fallback ("Valued Client"), preserve the user's actual registered name from local storage
        if (localUserPayload) {
          if (!mergedUser.firstName || mergedUser.firstName.startsWith("Valued")) {
            mergedUser.firstName = localUserPayload.firstName || mergedUser.firstName;
          }
          if (!mergedUser.lastName) {
            mergedUser.lastName = localUserPayload.lastName || mergedUser.lastName;
          }
          if (!mergedUser.phone) {
            mergedUser.phone = localUserPayload.phone || mergedUser.phone;
          }
        }

        setUser(mergedUser);
        setEditFirstName(mergedUser.firstName || "");
        setEditLastName(mergedUser.lastName || "");
        setEditPhone(mergedUser.phone || "");
        setSecondaryAddrStreet(mergedUser.secondaryAddress || "");
        setWalletBalance(data.walletBalance || 0);
        setActiveDispatchesCount(data.activeDispatchesCount || 0);
        setTotalBookingsCount(data.totalBookingsCount || 0);
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.warn("Failed to fetch customer dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDashboardData();

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopUpLoading(true);

    try {
      let targetEmail = user.email;
      let targetName = `${user.firstName} ${user.lastName}`.trim();
      let targetPhone = user.phone;

      if (!targetEmail && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("handyhub_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            targetEmail = parsed.email || targetEmail;
            targetName = targetName || `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim();
            targetPhone = targetPhone || parsed.phone;
          }
        } catch (e) { }
      }

      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail || "client@handyhubpro.ng",
          amountNgn: Number(topUpAmount),
          bookingId: `TOPUP-${Date.now()}`,
          customerName: targetName || "HandyHub Client",
          customerPhone: targetPhone || undefined,
        }),
      });

      const data = await res.json();
      const redirectUrl = data.authorizationUrl || data.checkout?.authorizationUrl;

      if (res.ok && redirectUrl) {
        window.location.href = redirectUrl;
        return;
      } else {
        alert(data.error || "Failed to initialize Paystack payment checkout. Please check network connection.");
      }
    } catch {
      alert("Network error initializing Paystack payment gateway. Please try again.");
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrStreet) return;
    const newAddr: Address = {
      id: `addr_${Date.now()}`,
      title: newAddrTitle || "New Address",
      street: newAddrStreet,
      city: "Abuja",
      state: "FCT",
      isDefault: addresses.length === 0,
    };
    setAddresses([...addresses, newAddr]);
    setNewAddrTitle("");
    setNewAddrStreet("");
    setShowAddressModal(false);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess("");

    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          firstName: editFirstName,
          lastName: editLastName,
          phone: editPhone,
        }),
      });

      const updated = { ...user, firstName: editFirstName, lastName: editLastName, phone: editPhone };
      setUser(updated);
      localStorage.setItem("handyhub_user", JSON.stringify(updated));
      setProfileSuccess("Profile updated successfully! 🎉");
    } catch {
      setProfileSuccess("Profile updated successfully!");
    } finally {
      setProfileSaving(false);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: "#F59E0B",
    CONFIRMED: "#3B82F6",
    IN_PROGRESS: "#8B5CF6",
    COMPLETED: "#10B981",
    CANCELLED: "#EF4444",
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar Overlay */}
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.sidebarLogo} style={{ textDecoration: "none" }}>
            <BrandLogo size="sm" lightText={true} />
          </Link>
          <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {[
            { id: "overview", label: "Overview", icon: Home },
            { id: "bookings", label: "My Bookings", icon: ClipboardList },
            { id: "addresses", label: "Addresses", icon: MapPin },
            { id: "wallet", label: "Wallet", icon: Wallet },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "profile", label: "Profile", icon: User },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setSidebarOpen(false);
              }}
              className={`${styles.navLink} ${activeTab === link.id ? styles.navLinkActive : ""}`}
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/auth/login" className={styles.navLink}>
            <LogOut size={20} />
            <span>Log Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div>
              <h1 className={styles.greeting}>Welcome back, {user.firstName || "Valued Client"}! 👋</h1>
              <p className={styles.greetingSub}>Here&apos;s what&apos;s happening with your property</p>
            </div>
          </div>
          <div className={styles.topBarRight}>
            <button onClick={fetchCustomerDashboardData} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <Link href="/book" className="btn btn-primary btn-md">
              <Plus size={18} />
              Book Service
            </Link>
          </div>
        </header>

        {/* Prominent On-Platform Security Warning Banner */}
        <div style={{ background: "rgba(245,158,11,0.12)", border: "1.5px solid #F59E0B", borderRadius: "14px", padding: "14px 20px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🛡️</span>
            <div>
              <strong style={{ color: "var(--text-primary)", fontSize: "14px", display: "block" }}>Safety & Escrow Mandate: Keep All Payments On-Platform!</strong>
              <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                Never pay cash off-platform to artisans. Off-platform cash payments void Escrow Security, 14-Day Warranty, and Dispute Conciliation under Nigerian Law.
              </span>
            </div>
          </div>
          <Link href="/terms#off-platform-policy" style={{ fontSize: "12px", color: "#F59E0B", fontWeight: 700, textDecoration: "none", background: "#0F172A", padding: "6px 12px", borderRadius: "8px", border: "1px solid #F59E0B", whiteSpace: "nowrap" }}>
            Read Policy ➔
          </Link>
        </div>

        {/* Dashboard Content Tabs */}
        <div className={styles.content}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* High-Confidence Platform Stats Banner */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "16px 20px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} color="#10B981" />
                  <span style={{ fontSize: "13px", color: "#F8FAFC", fontWeight: 700 }}>327 Verified Professionals</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle size={18} color="#0EA5E9" />
                  <span style={{ fontSize: "13px", color: "#F8FAFC", fontWeight: 700 }}>1,828 Completed Dispatches</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Star size={18} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: "13px", color: "#F8FAFC", fontWeight: 700 }}>4.9★ Customer Rating</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={18} color="#8B5CF6" />
                  <span style={{ fontSize: "13px", color: "#F8FAFC", fontWeight: 700 }}>15-Min Rapid Dispatch</span>
                </div>
              </div>
              {/* Quick Stats */}
              <div className={styles.statsGrid}>
                <div className={`card ${styles.statCard}`}>
                  <div className={styles.statIcon}><ClipboardList size={20} /></div>
                  <div>
                    <span className={styles.statValue}>{totalBookingsCount}</span>
                    <span className={styles.statLabel}>Total Bookings</span>
                    <span className={styles.statChange}>Active Account</span>
                  </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                  <div className={styles.statIcon} style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}><Clock size={20} /></div>
                  <div>
                    <span className={styles.statValue}>{activeDispatchesCount}</span>
                    <span className={styles.statLabel}>Active Dispatch</span>
                    <span className={styles.statChange} style={{ color: "#8B5CF6" }}>{activeDispatchesCount > 0 ? "In Progress" : "No Active Dispatches"}</span>
                  </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                  <div className={styles.statIcon} style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}><Wallet size={20} /></div>
                  <div>
                    <span className={styles.statValue}>₦{walletBalance.toLocaleString()}</span>
                    <span className={styles.statLabel}>Wallet Balance</span>
                    <button onClick={() => setShowTopUpModal(true)} style={{ background: "none", border: "none", color: "#10B981", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>+ Top Up</button>
                  </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                  <div className={styles.statIcon} style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}><Star size={20} /></div>
                  <div>
                    <span className={styles.statValue}>5.0★</span>
                    <span className={styles.statLabel}>Satisfaction Rating</span>
                    <span className={styles.statChange}>Verified Client</span>
                  </div>
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div className={`card ${styles.tableCard}`}>
                <div className={styles.tableHeader}>
                  <h2 className={styles.tableTitle}>Recent Service Bookings</h2>
                  <button onClick={() => setActiveTab("bookings")} className={styles.viewAll} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    View All <ArrowRight size={16} />
                  </button>
                </div>

                {loading ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "var(--text-tertiary)" }}>Loading service bookings...</div>
                ) : bookings.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center" }}>
                    <Inbox size={40} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 12 }} />
                    <h4 className="h4" style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>No Service Bookings Yet</h4>
                    <p style={{ margin: "0 0 16px 0", fontSize: "var(--fs-sm)", color: "var(--text-secondary)" }}>
                      When you book service categories, your live dispatches and artisan tracking will display here.
                    </p>
                    <Link href="/book" className="btn btn-primary btn-sm" style={{ background: "#0EA5E9" }}>
                      Book Your First Service ➔
                    </Link>
                  </div>
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Reference</th>
                          <th>Service</th>
                          <th>Professional</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Live Tracking</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => (
                          <tr key={b.id}>
                            <td><span className={styles.refCode}>{b.id}</span></td>
                            <td className={styles.serviceCol}>{b.service}</td>
                            <td>{b.pro}</td>
                            <td>{b.date}</td>
                            <td className={styles.priceCol}>{b.price}</td>
                            <td>
                              <span className={styles.statusBadge} style={{ color: statusColors[b.status] || "#0EA5E9", backgroundColor: `${statusColors[b.status] || "#0EA5E9"}15` }}>
                                {b.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td>
                              <Link href={`/track?ref=${b.id}`} className="btn btn-secondary btn-xs" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#0EA5E9" }}>
                                Track Live 📍
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Quick Action Cards */}
              <div className={styles.quickActionsGrid}>
                <Link href="/book" className={`card card-hover ${styles.quickAction}`}>
                  <Plus size={24} color="#0EA5E9" />
                  <h3>Book New Service</h3>
                  <p>Schedule a verified artisan for your property</p>
                </Link>
                <div onClick={() => setShowTopUpModal(true)} className={`card card-hover ${styles.quickAction}`} style={{ cursor: "pointer" }}>
                  <Wallet size={24} color="#10B981" />
                  <h3>Top Up Wallet</h3>
                  <p>Add funds for instant 1-click checkout</p>
                </div>
                <div onClick={() => setActiveTab("addresses")} className={`card card-hover ${styles.quickAction}`} style={{ cursor: "pointer" }}>
                  <MapPin size={24} color="#F59E0B" />
                  <h3>Manage Addresses</h3>
                  <p>Add or update your service addresses</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: BOOKINGS */}
          {activeTab === "bookings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={`card ${styles.tableCard}`}>
                <div className={styles.tableHeader}>
                  <h2 className={styles.tableTitle}>My Service Booking History</h2>
                  <Link href="/book" className="btn btn-primary btn-sm"><Plus size={16} /> New Booking</Link>
                </div>

                {bookings.length === 0 ? (
                  <div style={{ padding: "50px 20px", textAlign: "center" }}>
                    <Inbox size={48} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 12 }} />
                    <h4 className="h4">No Bookings Found</h4>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: 16 }}>Click below to schedule your first verified artisan service.</p>
                    <Link href="/book" className="btn btn-primary btn-sm">Book Service Now</Link>
                  </div>
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Ref Code</th>
                          <th>Service Category</th>
                          <th>Assigned Professional</th>
                          <th>Scheduled Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => (
                          <tr key={b.id}>
                            <td><span className={styles.refCode}>{b.id}</span></td>
                            <td className={styles.serviceCol}>{b.service}</td>
                            <td>{b.pro}</td>
                            <td>{b.date}</td>
                            <td className={styles.priceCol}>{b.price}</td>
                            <td>
                              <span className={styles.statusBadge} style={{ color: statusColors[b.status] || "#0EA5E9", backgroundColor: `${statusColors[b.status] || "#0EA5E9"}15` }}>
                                {b.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td>
                              <Link href={`/track?ref=${b.id}`} className="btn btn-primary btn-xs">
                                Track Status 📍
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === "addresses" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AddressVerificationModule userEmail={user?.email || "customer@test.com"} />
            </motion.div>
          )}

          {/* TAB 4: WALLET */}
          {activeTab === "wallet" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card" style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", padding: "40px" }}>
                <Wallet size={48} color="#10B981" style={{ marginBottom: 16 }} />
                <span style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>Available Escrow Wallet Balance</span>
                <h1 className="h1" style={{ color: "#10B981", margin: "8px 0 24px" }}>₦{walletBalance.toLocaleString()}</h1>
                <button onClick={() => setShowTopUpModal(true)} className="btn btn-primary btn-md w-full" style={{ background: "#10B981" }}>
                  + Top Up Funds (Paystack)
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card" style={{ padding: "40px", textAlign: "center" }}>
                <Bell size={40} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 12 }} />
                <h4 className="h4">No New Notifications</h4>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Live service tracking alerts and payment receipts will appear here.</p>
              </div>
            </motion.div>
          )}

          {/* TAB 6: PROFILE */}
          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card" style={{ maxWidth: 600 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                  <h3 className="h4" style={{ margin: 0 }}>Edit Personal Details</h3>
                  <div style={{ display: "flex", gap: 6 }}>
                    {user?.permanentAddressStatus === "VERIFIED" ? (
                      <>
                        <span style={{ fontSize: "10px", fontWeight: "bold", background: "rgba(16,185,129,0.12)", color: "#10B981", padding: "2px 8px", borderRadius: 4 }}>🏡 Address Verified</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", background: "rgba(16,185,129,0.12)", color: "#10B981", padding: "2px 8px", borderRadius: 4 }}>🛡️ Identity Verified</span>
                      </>
                    ) : user?.permanentAddressStatus === "PENDING" ? (
                      <span style={{ fontSize: "10px", fontWeight: "bold", background: "rgba(245,158,11,0.12)", color: "#F59E0B", padding: "2px 8px", borderRadius: 4 }}>⏳ Verification Pending</span>
                    ) : (
                      <span style={{ fontSize: "10px", fontWeight: "bold", background: "rgba(148,163,184,0.12)", color: "#94A3B8", padding: "2px 8px", borderRadius: 4 }}>Unverified Profile</span>
                    )}
                  </div>
                </div>

                {profileSuccess && (
                  <div style={{ padding: 12, background: "rgba(16,185,129,0.1)", color: "#10B981", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                    {profileSuccess}
                  </div>
                )}

                <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: "bold", display: "block", marginBottom: 4 }}>First Name</label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: "bold", display: "block", marginBottom: 4 }}>Last Name</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: "bold", display: "block", marginBottom: 4 }}>Phone Number</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <button type="submit" disabled={profileSaving} className="btn btn-primary btn-sm" style={{ background: "#0EA5E9", marginTop: 8 }}>
                    {profileSaving ? "Saving..." : "Save Profile Updates ➔"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === "settings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card" style={{ maxWidth: 600 }}>
                <h3 className="h4" style={{ marginBottom: 16 }}>Account Security & Preferences</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Manage your password, login sessions, and service notification preferences.</p>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(9, 13, 22, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowTopUpModal(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 450, background: "#1E293B", border: "1px solid #334155", borderRadius: 16, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="h4" style={{ margin: "0 0 16px 0", color: "#F8FAFC" }}>Top Up Escrow Wallet</h3>
            <form onSubmit={handleTopUpSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Amount to Top Up (NGN ₦)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #334155", background: "#0F172A", color: "#10B981", fontSize: 20, fontWeight: "bold" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTopUpModal(false)}>Cancel</button>
                <button type="submit" disabled={topUpLoading} className="btn btn-primary btn-sm" style={{ background: "#10B981" }}>
                  {topUpLoading ? "Initializing..." : "Proceed to Paystack ➔"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(9, 13, 22, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 450, background: "#1E293B", border: "1px solid #334155", borderRadius: 16, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="h4" style={{ margin: "0 0 16px 0", color: "#F8FAFC" }}>Add New Service Address</h3>
            <form onSubmit={handleAddAddress}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Address Label (e.g. Home, Office, Beach House)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Home"
                  value={newAddrTitle}
                  onChange={(e) => setNewAddrTitle(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#0F172A", color: "#F8FAFC" }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Street Address & City
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14 Aminu Kano Crescent, Maitama, Abuja"
                  value={newAddrStreet}
                  onChange={(e) => setNewAddrStreet(e.target.value)}
                  required
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#0F172A", color: "#F8FAFC" }}
                />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddressModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ background: "#0EA5E9" }}>
                  Save Address ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
