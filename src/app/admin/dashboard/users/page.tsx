"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Users, Shield, Search, UserCheck, Key, Edit, CheckCircle2,
  RefreshCw, Plus, UserPlus, Lock, Check, X, AlertTriangle, Filter
} from "lucide-react";
import styles from "../../admin.module.css";
import { ROLE_LABELS } from "@/lib/rbac";

export default function UsersRoleManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [toast, setToast] = useState("");

  // Add / Assign New Staff Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "OPERATIONS_MANAGER",
  });
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Edit Existing User Role Modal State
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("ADMIN");

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
        setToast(`Staff member ${staffForm.email} assigned role: ${staffForm.role}! 🎉`);
        setShowAddStaffModal(false);
        setStaffForm({ email: "", firstName: "", lastName: "", phone: "", role: "OPERATIONS_MANAGER" });
        fetchUsers();
      } else {
        setToast(`Error: ${data.error || "Failed to assign staff member"}`);
      }
    } catch (err) {
      setToast("Failed to connect to server.");
    } finally {
      setSubmittingStaff(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const handleRoleChange = async () => {
    if (!editingUser) return;
    try {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUser.id, role: selectedRole }),
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, role: selectedRole } : u))
      );
      setToast(`Role for ${editingUser.name} updated to ${selectedRole}!`);
    } catch {
      setToast("Failed to update role on server.");
    } finally {
      setEditingUser(null);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === "EXECUTIVE") return u.role === "SUPER_ADMIN" || u.role === "ADMIN";
    if (activeTab === "OPERATIONS") return u.role === "OPERATIONS_MANAGER";
    if (activeTab === "VERIFICATION") return u.role === "VERIFICATION_OFFICER";
    if (activeTab === "SUPPORT_FINANCE") return u.role === "CUSTOMER_SUPPORT" || u.role === "FINANCE";
    if (activeTab === "CUSTOMERS_PROS") return u.role === "CUSTOMER" || u.role === "PROFESSIONAL";

    return true;
  });

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", width: "100%" }}>
          <div>
            <h1 className="h3">Staff Role Assignment & Access Control (RBAC)</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
              Chief Commander Control Panel: Assign designated administrative roles to staff members and restrict each account to its allowed operations.
            </p>
          </div>

          <button
            onClick={() => setShowAddStaffModal(true)}
            className="btn btn-primary btn-md"
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0EA5E9", fontWeight: "bold" }}
          >
            <UserPlus size={18} /> Assign / Promote New Staff Member
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
            { id: "ALL", label: "All Users & Staff" },
            { id: "EXECUTIVE", label: "Executive Admins" },
            { id: "OPERATIONS", label: "Operations" },
            { id: "VERIFICATION", label: "Verifiers" },
            { id: "SUPPORT_FINANCE", label: "Support & Finance" },
            { id: "CUSTOMERS_PROS", label: "Clients & Pros" },
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
      <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading live staff & user directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#94A3B8" }}>
            <Users size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
            <h4 className="h4" style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>No Staff or User Accounts Found</h4>
            <p style={{ margin: 0, fontSize: "13px" }}>Click &quot;Assign / Promote New Staff Member&quot; to grant staff privileges.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                <th style={{ padding: "12px 16px" }}>Staff / User Name</th>
                <th style={{ padding: "12px 16px" }}>Email Address</th>
                <th style={{ padding: "12px 16px" }}>Phone Number</th>
                <th style={{ padding: "12px 16px" }}>Designated Role & Access Level</th>
                <th style={{ padding: "12px 16px" }}>Date Joined</th>
                <th style={{ padding: "12px 16px" }}>Chief Commander Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const labelInfo = ROLE_LABELS[u.role] || { label: u.role, badgeColor: "#0EA5E9" };
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <strong style={{ color: "#F8FAFC", display: "block" }}>{u.name}</strong>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>{u.email}</td>
                    <td style={{ padding: "12px 16px", color: "#94A3B8" }}>{u.phone}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="badge" style={{ background: `${labelInfo.badgeColor}20`, color: labelInfo.badgeColor, fontSize: "11px", fontWeight: "bold", border: `1px solid ${labelInfo.badgeColor}40` }}>
                        {labelInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: "13px" }}>{u.createdAt}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        className="btn btn-secondary btn-xs"
                        style={{ color: "#0EA5E9", borderColor: "#0EA5E9" }}
                        onClick={() => {
                          setEditingUser(u);
                          setSelectedRole(u.role);
                        }}
                      >
                        <Edit size={12} /> Change Staff Role
                      </button>
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
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Assign New Staff Member Role</h3>
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

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddStaffModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submittingStaff} style={{ background: "#0EA5E9" }}>
                  {submittingStaff ? "Assigning..." : "Assign Staff Role Credentials ✅"}
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
            <h3 className="h4" style={{ margin: "0 0 4px 0", color: "#F8FAFC" }}>Update Staff Administrative Role</h3>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "16px" }}>Reassigning permissions for <strong>{editingUser.name} ({editingUser.email})</strong></p>

            <div style={{ marginBottom: "20px" }}>
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

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleRoleChange} style={{ background: "#0EA5E9" }}>Save Role Update</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
