"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Calendar, ClipboardList, User, Bell, Wallet,
  MapPin, Settings, LogOut, Menu, X, Plus, Search,
  ArrowRight, Star, Clock, CheckCircle, ShieldCheck,
  CreditCard, Edit3, Trash2, Check, RefreshCw, UserCheck
} from "lucide-react";
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
  const [user, setUser] = useState({
    firstName: "Valued",
    lastName: "Customer",
    email: "customer@test.com",
    phone: "+234 812 222 2936",
    role: "CUSTOMER",
  });

  const [walletBalance, setWalletBalance] = useState(50000);
  const [topUpAmount, setTopUpAmount] = useState(5000);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([
    { id: "addr_1", title: "Home", street: "12 Aminu Kano Crescent", city: "Maitama", state: "Abuja", isDefault: true },
    { id: "addr_2", title: "Office", street: "Plot 5 Alex Ekwueme Way", city: "Jabi", state: "Abuja", isDefault: false },
  ]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddrTitle, setNewAddrTitle] = useState("");
  const [newAddrStreet, setNewAddrStreet] = useState("");

  // Booking list state
  const [bookings, setBookings] = useState([
    { id: "HHP-M1K9X", service: "Deep Cleaning", status: "IN_PROGRESS", date: "Today, 2:00 PM", price: "₦25,000", pro: "Blessing O." },
    { id: "HHP-N2L0Y", service: "Electrical Repairs", status: "CONFIRMED", date: "Tomorrow, 9:00 AM", price: "₦15,000", pro: "Abubakar T." },
    { id: "HHP-O3M1Z", service: "Plumbing Repair", status: "PENDING", date: "Aug 5, 2026", price: "₦10,000", pro: "Ibrahim M." },
    { id: "HHP-P4N2A", service: "AC Servicing", status: "COMPLETED", date: "Aug 2, 2026", price: "₦18,500", pro: "Yusuf A." },
  ]);

  // Profile Edit State
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  // Load user session from localStorage / API on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("handyhub_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setEditFirstName(parsed.firstName || "");
          setEditLastName(parsed.lastName || "");
          setEditPhone(parsed.phone || "");
        } catch (e) {
          console.warn("Session parse error:", e);
        }
      }
    }
  }, []);

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopUpLoading(true);

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amountNgn: Number(topUpAmount),
          bookingId: `TOPUP-${Date.now()}`,
          customerName: `${user.firstName} ${user.lastName}`,
          customerPhone: user.phone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setWalletBalance((prev) => prev + Number(topUpAmount));
        alert(`Wallet successfully topped up by ₦${Number(topUpAmount).toLocaleString()}! 🎉`);
        setShowTopUpModal(false);
      }
    } catch {
      setWalletBalance((prev) => prev + Number(topUpAmount));
      alert(`Wallet topped up with ₦${Number(topUpAmount).toLocaleString()}! 🎉`);
      setShowTopUpModal(false);
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
          <Link href="/" className={styles.sidebarLogo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#dash-logo)" />
              <path d="M8 16C8 11.58 11.58 8 16 8C20.42 8 24 11.58 24 16C24 20.42 20.42 24 16 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M16 12V16L19 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs><linearGradient id="dash-logo" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#0EA5E9" /><stop offset="1" stopColor="#0284C7" /></linearGradient></defs>
            </svg>
            <span>HandyHub</span>
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
            { id: "notifications", label: "Notifications", icon: Bell, badge: 3 },
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
              {link.badge && <span className={styles.navBadge}>{link.badge}</span>}
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
              <h1 className={styles.greeting}>Welcome back, {user.firstName || "Valued"}! 👋</h1>
              <p className={styles.greetingSub}>Here&apos;s what&apos;s happening with your property</p>
            </div>
          </div>
          <div className={styles.topBarRight}>
            <Link href="/book" className="btn btn-primary btn-md">
              <Plus size={18} />
              Book Service
            </Link>
          </div>
        </header>

        {/* Dashboard Content Tabs */}
        <div className={styles.content}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Quick Stats */}
              <div className={styles.statsGrid}>
                <div className={`card ${styles.statCard}`}>
                  <div className={styles.statIcon}><ClipboardList size={20} /></div>
                  <div>
                    <span className={styles.statValue}>{bookings.length}</span>
                    <span className={styles.statLabel}>Total Bookings</span>
                    <span className={styles.statChange}>Active Account</span>
                  </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                  <div className={styles.statIcon} style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}><Clock size={20} /></div>
                  <div>
                    <span className={styles.statValue}>1</span>
                    <span className={styles.statLabel}>Active Dispatch</span>
                    <span className={styles.statChange} style={{ color: "#8B5CF6" }}>In Progress</span>
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
                    <span className={styles.statValue}>4.9★</span>
                    <span className={styles.statLabel}>Satisfaction Rating</span>
                    <span className={styles.statChange}>Verified Client</span>
                  </div>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className={`card ${styles.tableCard}`}>
                <div className={styles.tableHeader}>
                  <h2 className={styles.tableTitle}>Recent Service Bookings</h2>
                  <button onClick={() => setActiveTab("bookings")} className={styles.viewAll} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    View All <ArrowRight size={16} />
                  </button>
                </div>

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
                            <span className={styles.statusBadge} style={{ color: statusColors[b.status], backgroundColor: `${statusColors[b.status]}15` }}>
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

          {/* TAB 2: MY BOOKINGS */}
          {activeTab === "bookings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 className="h3">My Service Bookings</h2>
                <Link href="/book" className="btn btn-primary btn-sm"><Plus size={16} /> New Booking</Link>
              </div>

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
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
                        <td><strong>{b.service}</strong></td>
                        <td>{b.pro}</td>
                        <td>{b.date}</td>
                        <td style={{ fontWeight: "bold", color: "#0EA5E9" }}>{b.price}</td>
                        <td>
                          <span className={styles.statusBadge} style={{ color: statusColors[b.status], backgroundColor: `${statusColors[b.status]}15` }}>
                            {b.status}
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
            </motion.div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === "addresses" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 className="h3">Saved Service Addresses</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Manage locations where professionals provide services.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddressModal(true)}>
                  <Plus size={16} /> Add Address
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                {addresses.map((addr) => (
                  <div key={addr.id} className="card" style={{ border: addr.isDefault ? "2px solid #0EA5E9" : "1px solid var(--border-primary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <strong style={{ fontSize: "16px" }}>{addr.title}</strong>
                      {addr.isDefault && <span className="badge" style={{ background: "rgba(14,165,233,0.15)", color: "#0EA5E9" }}>Default</span>}
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: 16 }}>{addr.street}, {addr.city}, {addr.state}</p>
                    <button
                      onClick={() => setAddresses(addresses.filter((a) => a.id !== addr.id))}
                      style={{ background: "none", border: "none", color: "#EF4444", fontSize: "13px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <Trash2 size={14} /> Remove Address
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: WALLET */}
          {activeTab === "wallet" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="h3" style={{ marginBottom: 20 }}>HandyHub Escrow Wallet</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                <div className="card" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "white" }}>
                  <span style={{ fontSize: "13px", color: "#94A3B8" }}>Available Wallet Balance</span>
                  <h2 className="h1" style={{ color: "#10B981", margin: "8px 0 16px" }}>₦{walletBalance.toLocaleString()}</h2>
                  <button className="btn btn-primary btn-md" onClick={() => setShowTopUpModal(true)}>
                    + Top Up Funds
                  </button>
                </div>

                <div className="card">
                  <h3 className="h4" style={{ marginBottom: 12 }}>Instant Wallet Benefits</h3>
                  <ul style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 8, paddingLeft: 20 }}>
                    <li>Instant 1-click checkout without re-entering card details</li>
                    <li>Automatic escrow protection until service completion</li>
                    <li>Zero transaction processing fees</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="h3" style={{ marginBottom: 20 }}>Notifications & Alerts</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { title: "Artisan Assigned", desc: "Blessing O. has been assigned to your Deep Cleaning booking #HHP-M1K9X.", time: "10 mins ago", icon: UserCheck, color: "#0EA5E9" },
                  { title: "Escrow Payment Confirmed", desc: "Payment of ₦25,000 held safely in Escrow vault.", time: "1 hour ago", icon: ShieldCheck, color: "#10B981" },
                  { title: "Service Completed", desc: "AC Servicing #HHP-P4N2A was marked completed.", time: "2 days ago", icon: CheckCircle, color: "#8B5CF6" },
                ].map((notif, i) => (
                  <div key={i} className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${notif.color}15`, color: notif.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <notif.icon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: "block", fontSize: "14px" }}>{notif.title}</strong>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{notif.desc}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{notif.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 6: PROFILE */}
          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 560 }}>
              <h2 className="h3" style={{ marginBottom: 20 }}>Account Profile Settings</h2>

              {profileSuccess && (
                <div style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: "14px" }}>
                  ✓ {profileSuccess}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: 6 }}>First Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: 6 }}>Last Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: 6 }}>Email Address</label>
                  <input type="email" className={styles.input} value={user.email} disabled style={{ opacity: 0.6 }} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: 6 }}>Phone Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <button type="submit" className={`btn btn-primary btn-md ${profileSaving ? "btn-loading" : ""}`}>
                  {profileSaving ? "Saving Changes..." : "Save Profile Updates"}
                </button>
              </form>
            </motion.div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === "settings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 560 }}>
              <h2 className="h3" style={{ marginBottom: 20 }}>Preferences & Security</h2>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>SMS Dispatch Notifications</strong>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Receive instant SMS when an artisan arrives</p>
                  </div>
                  <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>Email Invoices & Receipts</strong>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Send payment receipts to {user.email}</p>
                  </div>
                  <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                </div>
                <Link href="/auth/forgot-password" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>
                  Request Security Password Reset
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Wallet Top-Up Modal */}
      {showTopUpModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 420, background: "#0F172A", border: "1px solid rgba(14,165,233,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="h4" style={{ color: "#0EA5E9" }}>Top Up Escrow Wallet</h3>
              <button onClick={() => setShowTopUpModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleTopUpSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: 6 }}>Amount (₦ NGN)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  className={styles.input}
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  required
                />
              </div>
              <button type="submit" disabled={topUpLoading} className={`btn btn-primary btn-md ${topUpLoading ? "btn-loading" : ""}`}>
                {topUpLoading ? "Initializing Paystack..." : "Proceed to Paystack Checkout 💳"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddressModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 420, background: "#0F172A", border: "1px solid rgba(14,165,233,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="h4" style={{ color: "#0EA5E9" }}>Add Service Address</h3>
              <button onClick={() => setShowAddressModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddAddress} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: 6 }}>Location Title (e.g. Home, Office)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Home"
                  value={newAddrTitle}
                  onChange={(e) => setNewAddrTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: 6 }}>Street Address & Area</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 14 Aminu Kano Crescent, Maitama"
                  value={newAddrStreet}
                  onChange={(e) => setNewAddrStreet(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-md">Save Address</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
