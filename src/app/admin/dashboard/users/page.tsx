"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Users, Shield, Search, UserCheck, Key, Edit, CheckCircle2,
  RefreshCw, Plus, UserPlus, Lock, Check, X, AlertTriangle, Filter, MapPin
} from "lucide-react";
import styles from "../../admin.module.css";
import { ROLE_LABELS } from "@/lib/rbac";

export default function UsersRoleManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [toast, setToast] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("ADMIN");

  // Add / Assign New Staff Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "OPERATIONS_MANAGER",
    password: "",
  });
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Edit Existing User Role Modal State
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("ADMIN");
  const [editPassword, setEditPassword] = useState("");

  // Client Address Verification Audit Modal State
  const [auditingUserAddress, setAuditingUserAddress] = useState<any | null>(null);
  const [addressAuditNotes, setAddressAuditNotes] = useState("");
  const [manualAddressInput, setManualAddressInput] = useState("");
  const [auditSubmitting, setAuditSubmitting] = useState(false);

  const handleAddressAuditSubmit = async (decision: "APPROVE" | "REJECT") => {
    if (!auditingUserAddress) return;
    setAuditSubmitting(true);
    try {
      const payload: any = {
        userId: auditingUserAddress.id,
        decision,
        notes: addressAuditNotes,
      };
      if (manualAddressInput.trim()) {
        payload.permanentAddress = manualAddressInput.trim();
      }

      const res = await fetch("/api/admin/users/verify-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === auditingUserAddress.id
              ? {
                  ...u,
                  permanentAddress: manualAddressInput.trim() || u.permanentAddress,
                  permanentAddressStatus: decision === "APPROVE" ? "VERIFIED" : "REJECTED",
                  permanentAddressNotes: addressAuditNotes || (decision === "APPROVE" ? "Address verified successfully." : "Rejection notes not specified."),
                }
              : u
          )
        );
        setToast(`Client address successfully ${decision === "APPROVE" ? "verified" : "rejected"}!`);
      } else {
        setToast(`Error: ${data.error || "Failed to update address verification state"}`);
      }
    } catch {
      setToast("Failed to connect to verification server.");
    } finally {
      setAuditSubmitting(false);
      setAuditingUserAddress(null);
      setAddressAuditNotes("");
      setManualAddressInput("");
      setTimeout(() => setToast(""), 6000);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.warn("Failed to fetch real users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    if (typeof window !== "undefined") {
      const sessionStr = localStorage.getItem("handyhub_admin_session");
      if (sessionStr) {
        try {
          const sess = JSON.parse(sessionStr);
          if (sess.user && sess.user.role) {
            setCurrentUserRole(sess.user.role);
          }
        } catch {}
      }
    }
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.email || !staffForm.role) return;

    setSubmittingStaff(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.isRequest) {
          setToast(data.message);
        } else {
          const passNotice = data.initialPassword ? ` (Password: ${data.initialPassword})` : "";
          setToast(`Staff member ${staffForm.email} assigned role: ${staffForm.role}${passNotice}! 🎉`);
          fetchUsers();
        }
        setShowAddStaffModal(false);
        setStaffForm({ email: "", firstName: "", lastName: "", phone: "", role: "OPERATIONS_MANAGER", password: "" });
      } else {
        setToast(`Error: ${data.error || "Failed to assign staff member"}`);
      }
    } catch (err) {
      setToast("Failed to connect to server.");
    } finally {
      setSubmittingStaff(false);
      setTimeout(() => setToast(""), 6000);
    }
  };

  const handleRoleChange = async () => {
    if (!editingUser) return;
    try {
      const payload: any = { userId: editingUser.id, role: selectedRole };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.isRequest) {
          setToast(data.message);
        } else {
          setUsers((prev) =>
            prev.map((u) => (u.id === editingUser.id ? { ...u, role: selectedRole } : u))
          );
          const passText = editPassword.trim() ? " and password updated" : "";
          setToast(`Role for ${editingUser.name} updated to ${selectedRole}${passText}!`);
        }
      } else {
        setToast(`Error: ${data.error || "Failed to update role"}`);
      }
    } catch {
      setToast("Failed to update role on server.");
    } finally {
      setEditingUser(null);
      setEditPassword("");
      setTimeout(() => setToast(""), 6000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === "CLIENTS") return u.role === "CUSTOMER";
    if (activeTab === "ARTISANS") return u.role === "PROFESSIONAL";
    if (activeTab === "STAFF") return u.role !== "CUSTOMER" && u.role !== "PROFESSIONAL";

    return true;
  });

  const isChiefCommander = currentUserRole === "SUPER_ADMIN";

  const clientsCount = users.filter((u) => u.role === "CUSTOMER").length;
  const artisansCount = users.filter((u) => u.role === "PROFESSIONAL").length;
  const staffCount = users.filter((u) => u.role !== "CUSTOMER" && u.role !== "PROFESSIONAL").length;

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", width: "100%" }}>
          <div>
            <h1 className="h3">All Users & Staff Role Directory</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
              {isChiefCommander
                ? "Chief Commander Control Panel: Oversee all platform users (Clients, Artisans/Pros, and Administrative Staff) and manage role permissions."
                : "User & Staff Registry: View live directories of all Clients, Artisans, and Staff members."}
            </p>
          </div>

          <button
            onClick={() => setShowAddStaffModal(true)}
            className="btn btn-primary btn-md"
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0EA5E9", fontWeight: "bold" }}
          >
            <UserPlus size={18} /> {isChiefCommander ? "Assign / Promote New Staff Member" : "Request New Staff Appointment"}
          </button>
        </div>
      </header>

      {toast && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          ✅ {toast}
        </div>
      )}

      {/* Role Explanations Quick Reference Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {Object.entries(ROLE_LABELS).map(([key, item]) => (
          <div key={key} className="card" style={{ background: "#1E293B", border: `1px solid ${item.badgeColor}40`, padding: "14px" }}>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: item.badgeColor, textTransform: "uppercase", marginBottom: "4px" }}>
              {item.label}
            </div>
            <div style={{ fontSize: "12px", color: "#CBD5E1", lineHeight: 1.4 }}>{item.description}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter Tabs Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: `All Users (${users.length})` },
            { id: "CLIENTS", label: `Clients / Customers (${clientsCount})` },
            { id: "ARTISANS", label: `Artisans / Pros (${artisansCount})` },
            { id: "STAFF", label: `Administrative Staff (${staffCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? "#0EA5E9" : "#1E293B",
                color: activeTab === tab.id ? "#FFFFFF" : "#94A3B8",
                border: "1px solid #334155",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ position: "relative", width: "240px" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "8px 10px 8px 34px",
                color: "#F8FAFC",
                fontSize: "13px",
              }}
            />
          </div>
          <button onClick={fetchUsers} className="btn btn-secondary btn-xs" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <RefreshCw size={12} /> Sync
          </button>
        </div>
      </div>

      {/* Staff & Users Table */}
      <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden", overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading live staff & user directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#94A3B8" }}>
            <Users size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
            <h4 className="h4" style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>No Staff or User Accounts Found</h4>
            <p style={{ margin: 0, fontSize: "13px" }}>Click &quot;Assign / Promote New Staff Member&quot; to grant staff privileges.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>Staff / User Name</th>
                <th style={{ padding: "10px 12px", maxWidth: "200px" }}>Email Address</th>
                <th style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>Phone Number</th>
                <th style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>Designated Role</th>
                <th style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>Address Status</th>
                <th style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>Date Joined</th>
                <th style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const labelInfo = ROLE_LABELS[u.role] || { label: u.role, badgeColor: "#0EA5E9" };
                
                // Get Address verification badge style
                let addrBadge = { label: "Not Registered", color: "#94A3B8" };
                if (u.role === "CUSTOMER") {
                  const status = u.permanentAddressStatus || "NOT_SUBMITTED";
                  if (status === "VERIFIED") addrBadge = { label: "Verified 🏡", color: "#10B981" };
                  else if (status === "PENDING") addrBadge = { label: "Pending ⏳", color: "#F59E0B" };
                  else if (status === "REJECTED") addrBadge = { label: "Rejected ❌", color: "#EF4444" };
                }

                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <strong style={{ color: "#F8FAFC", display: "block", fontSize: "13px" }}>{u.name}</strong>
                    </td>
                    <td style={{ padding: "10px 12px", maxWidth: "210px", color: "#CBD5E1" }}>
                      <div
                        title={u.email}
                        style={{
                          maxWidth: "190px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: "12.5px",
                        }}
                      >
                        {u.email}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#94A3B8", whiteSpace: "nowrap", fontSize: "12.5px" }}>{u.phone}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span className="badge" style={{ background: `${labelInfo.badgeColor}20`, color: labelInfo.badgeColor, fontSize: "10.5px", fontWeight: "bold", border: `1px solid ${labelInfo.badgeColor}40`, padding: "2px 8px" }}>
                        {labelInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {u.role === "CUSTOMER" ? (
                        <span className="badge" style={{ background: `${addrBadge.color}20`, color: addrBadge.color, fontSize: "10.5px", fontWeight: "bold", border: `1px solid ${addrBadge.color}40`, padding: "2px 8px" }}>
                          {addrBadge.label}
                        </span>
                      ) : u.role === "PROFESSIONAL" ? (
                        <span className="badge" style={{ background: u.isVerified ? "#10B98120" : "#F59E0B20", color: u.isVerified ? "#10B981" : "#F59E0B", fontSize: "10.5px", fontWeight: "bold", border: `1px solid ${u.isVerified ? "#10B98140" : "#F59E0B40"}`, padding: "2px 8px" }}>
                          {u.isVerified ? "Verified Artisan 🛡️" : "Artisan Partner ⏳"}
                        </span>
                      ) : (
                        <span style={{ color: "#475569", fontSize: "11px" }}>— (Staff Account)</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#94A3B8", fontSize: "12px", whiteSpace: "nowrap" }}>{u.createdAt}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                      {u.role === "CUSTOMER" ? (
                        <button
                          className="btn btn-secondary btn-xs"
                          style={{
                            color: u.permanentAddressStatus === "VERIFIED" ? "#10B981" : u.permanentAddressStatus === "PENDING" ? "#F59E0B" : "#0EA5E9",
                            borderColor: u.permanentAddressStatus === "VERIFIED" ? "#10B981" : u.permanentAddressStatus === "PENDING" ? "#F59E0B" : "#0EA5E9",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            fontSize: "11px",
                          }}
                          onClick={() => {
                            setAuditingUserAddress(u);
                            setAddressAuditNotes(u.permanentAddressNotes || "");
                            setManualAddressInput(u.permanentAddress || "");
                          }}
                        >
                          <MapPin size={11} /> {u.permanentAddressStatus === "VERIFIED" ? "Manage Address" : u.permanentAddressStatus === "PENDING" ? "Audit Address ⏳" : "Set Address"}
                        </button>
                      ) : u.role === "PROFESSIONAL" ? (
                        <a
                          href="/admin/dashboard/professionals"
                          className="btn btn-secondary btn-xs"
                          style={{ color: "#F59E0B", borderColor: "#F59E0B", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none", padding: "3px 8px", fontSize: "11px" }}
                        >
                          <Shield size={11} /> Audit Dossier
                        </a>
                      ) : (
                        <button
                          className="btn btn-secondary btn-xs"
                          style={{ color: "#0EA5E9", borderColor: "#0EA5E9", padding: "3px 8px", fontSize: "11px" }}
                          onClick={() => {
                            setEditingUser(u);
                            setSelectedRole(u.role);
                          }}
                        >
                          <Edit size={11} /> {isChiefCommander ? "Change Role" : "Request Change"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Promote New Staff Modal */}
      {showAddStaffModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
          onClick={() => setShowAddStaffModal(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "520px", background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #334155", paddingBottom: "12px" }}>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>
                {isChiefCommander ? "Assign New Staff Member Role" : "Request New Staff Member Appointment"}
              </h3>
              <button onClick={() => setShowAddStaffModal(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Staff Email Address <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g., staff.member@handyhubpro.ng"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  required
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>First Name</label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={staffForm.firstName}
                    onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Last Name</label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={staffForm.lastName}
                    onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
                    style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Staff Login Password <span style={{ color: "#94A3B8", fontWeight: 400 }}>(Optional - Defaults to Staff123!)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Staff123! or custom password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Designated Staff Administrative Role <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px", cursor: "pointer" }}
                >
                  <option value="ADMIN">Admin General (High-level Operational Authority)</option>
                  <option value="OPERATIONS_MANAGER">Operations Manager (Bookings Workflow & Live Radar)</option>
                  <option value="VERIFICATION_OFFICER">Verification Officer (Artisan NIN & Verification Audits)</option>
                  <option value="CUSTOMER_SUPPORT">Customer Support (Disputes, Refunds & Support Tickets)</option>
                  <option value="FINANCE">Finance Admin (Paystack/Monnify Escrow & Revenue Reporting)</option>
                  <option value="SUPER_ADMIN">Chief Commander (Full Root Access)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddStaffModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submittingStaff} style={{ background: "#0EA5E9" }}>
                  {submittingStaff ? "Submitting..." : (isChiefCommander ? "Assign Staff Role Credentials ✅" : "Submit Appointment Request 📩")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Existing User Role Modal */}
      {editingUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
          onClick={() => setEditingUser(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "480px", background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="h4" style={{ margin: "0 0 4px 0", color: "#F8FAFC" }}>
              {isChiefCommander ? "Update Staff Administrative Role" : "Request Staff Administrative Role Update"}
            </h3>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "16px" }}>
              {isChiefCommander
                ? `Reassigning permissions for ${editingUser.name} (${editingUser.email})`
                : `Submitting a change of role request for ${editingUser.name} (${editingUser.email})`}
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                Select Designated Role Level
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
              >
                <option value="SUPER_ADMIN">Chief Commander (Full Unchecked Root Control)</option>
                <option value="ADMIN">Admin General (Operational Authority)</option>
                <option value="OPERATIONS_MANAGER">Operations Manager (Bookings & Live Dispatch)</option>
                <option value="VERIFICATION_OFFICER">Verification Officer (Artisan NIN & Verification Audits)</option>
                <option value="CUSTOMER_SUPPORT">Customer Support (Disputes & Customer Tickets)</option>
                <option value="FINANCE">Finance Admin (Paystack Escrow Payouts & Refunds)</option>
                <option value="PROFESSIONAL">Professional Partner</option>
                <option value="CUSTOMER">Client / Customer</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Reset / Update Login Password <span style={{ color: "#94A3B8", fontWeight: 400 }}>(Optional - leave blank to keep current)</span>
              </label>
              <input
                type="text"
                placeholder="Enter new password (e.g. AdminPass123!)"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleRoleChange} style={{ background: "#0EA5E9" }}>
                {isChiefCommander ? "Save Role Update" : "Submit Role Update Request"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Client Address Verification Audit Modal */}
      {auditingUserAddress && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setAuditingUserAddress(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "500px", background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="h4" style={{ margin: "0 0 8px 0", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={20} color="#0EA5E9" /> Client Permanent Address Verification
            </h3>
            
            <div style={{ marginBottom: "16px", background: "#0F172A", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
              <strong style={{ display: "block", color: "#F8FAFC", fontSize: "14px", marginBottom: "4px" }}>
                {auditingUserAddress.name}
              </strong>
              <span style={{ display: "block", color: "#94A3B8", fontSize: "12px", marginBottom: "8px" }}>
                {auditingUserAddress.email}
              </span>
              
              <div style={{ borderTop: "1px solid #334155", paddingTop: "8px" }}>
                <label style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                  Permanent Residential Address:
                </label>
                <input
                  type="text"
                  placeholder="Enter client's verified street address (e.g. 12 Aminu Kano, Wuse 2, Abuja)..."
                  value={manualAddressInput}
                  onChange={(e) => setManualAddressInput(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#1E293B",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    color: "#F8FAFC",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            {auditingUserAddress.pendingPermanentAddress && (
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid #F59E0B", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px" }}>
                <span style={{ fontSize: "11px", color: "#F59E0B", fontWeight: "bold", textTransform: "uppercase" }}>Proposed Address Change Request:</span>
                <p style={{ margin: "2px 0 0 0", color: "#F8FAFC", fontSize: "13px" }}>{auditingUserAddress.pendingPermanentAddress}</p>
              </div>
            )}

            {(auditingUserAddress.pendingPermanentAddressProof || auditingUserAddress.permanentAddressProof) && (
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Uploaded Proof Document (Utility Bill / Tenancy Contract)
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(auditingUserAddress.pendingPermanentAddressProof || auditingUserAddress.permanentAddressProof).match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i) ? (
                    <div style={{ background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                      <img
                        src={auditingUserAddress.pendingPermanentAddressProof || auditingUserAddress.permanentAddressProof}
                        alt="Submitted Address Proof"
                        style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "6px", objectFit: "contain" }}
                      />
                    </div>
                  ) : null}
                  <a
                    href={auditingUserAddress.pendingPermanentAddressProof || auditingUserAddress.permanentAddressProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-xs"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#0EA5E9", borderColor: "#0EA5E9" }}
                  >
                    Open Full Client Proof Document (Utility Bill / Tenancy Contract) 📄
                  </a>
                </div>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Audit Feedback & Notes (Shared with client)
              </label>
              <textarea
                rows={3}
                placeholder="Enter approval details or reason for rejection..."
                value={addressAuditNotes}
                onChange={(e) => setAddressAuditNotes(e.target.value)}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "13px", outline: "none", resize: "vertical" }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setAuditingUserAddress(null)}>Cancel</button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={auditSubmitting}
                style={{ color: "#EF4444", borderColor: "#EF4444" }}
                onClick={() => handleAddressAuditSubmit("REJECT")}
              >
                Reject Address ❌
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={auditSubmitting}
                style={{ background: "#10B981" }}
                onClick={() => handleAddressAuditSubmit("APPROVE")}
              >
                {auditSubmitting ? "Processing..." : "Verify Address ✅"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
