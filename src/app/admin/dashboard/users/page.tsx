"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { Users, Shield, Search, UserCheck, Key, Edit, CheckCircle2, RefreshCw, Inbox } from "lucide-react";
import styles from "../../admin.module.css";
import { ROLE_LABELS } from "@/lib/rbac";

export default function UsersRoleManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("ADMIN");
  const [toast, setToast] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
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

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="h3">Role-Based Access Control (RBAC) & User Directory</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Assign granular administrative levels: Chief Commander, Admin General, Operations Manager, Verification Officer, Customer Support, and Finance Admin.
          </p>
        </div>
      </header>

      {toast && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          ✅ {toast}
        </div>
      )}

      {/* Role Cards Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {Object.entries(ROLE_LABELS).map(([key, item]) => (
          <div key={key} className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: "bold", color: item.badgeColor, textTransform: "uppercase", marginBottom: "6px" }}>
              {item.label}
            </div>
            <div style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.4 }}>{item.description}</div>
          </div>
        ))}
      </div>

      {/* Search & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search real user name, email, or assigned role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "10px 12px 10px 38px",
              color: "#F8FAFC",
              fontSize: "14px",
            }}
          />
        </div>
        <button onClick={fetchUsers} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <RefreshCw size={14} /> Refresh Directory
        </button>
      </div>

      {/* Real Users Table */}
      <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading live database directory...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#94A3B8" }}>
            <Inbox size={36} style={{ marginBottom: "12px", opacity: 0.5 }} />
            <h4 className="h4" style={{ color: "#F8FAFC", margin: "0 0 6px 0" }}>No Users Found in Database</h4>
            <p style={{ margin: 0, fontSize: "13px" }}>Users registering on HandyHub Pro will display here automatically.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                <th style={{ padding: "12px 16px" }}>User Name</th>
                <th style={{ padding: "12px 16px" }}>Email Address</th>
                <th style={{ padding: "12px 16px" }}>Phone Number</th>
                <th style={{ padding: "12px 16px" }}>Assigned Role</th>
                <th style={{ padding: "12px 16px" }}>Joined Date</th>
                <th style={{ padding: "12px 16px" }}>RBAC Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const labelInfo = ROLE_LABELS[u.role] || { label: u.role, badgeColor: "#0EA5E9" };
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <strong style={{ color: "#F8FAFC", display: "block" }}>{u.name}</strong>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>{u.email}</td>
                    <td style={{ padding: "12px 16px", color: "#94A3B8" }}>{u.phone}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="badge" style={{ background: `${labelInfo.badgeColor}20`, color: labelInfo.badgeColor, fontSize: "11px", fontWeight: "bold" }}>
                        {labelInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: "13px" }}>{u.createdAt}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => {
                          setEditingUser(u);
                          setSelectedRole(u.role);
                        }}
                      >
                        <Edit size={14} /> Change Role
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Role Modal */}
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
            style={{ width: "100%", maxWidth: "450px", background: "#1E293B", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="h4" style={{ margin: "0 0 4px 0", color: "#F8FAFC" }}>Assign Staff Administrative Role</h3>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "16px" }}>Updating access level for <strong>{editingUser.name}</strong></p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                Select System Role Level
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#F8FAFC", fontSize: "14px" }}
              >
                <option value="SUPER_ADMIN">Chief Commander (Full Unchecked Root Control)</option>
                <option value="ADMIN">Admin General (Operational Authority)</option>
                <option value="OPERATIONS_MANAGER">Operations Manager (Bookings & Dispatch)</option>
                <option value="VERIFICATION_OFFICER">Verification Officer (NIN & Artisan Compliance)</option>
                <option value="CUSTOMER_SUPPORT">Customer Support (Disputes & Tickets)</option>
                <option value="FINANCE">Finance Admin (Paystack Escrow Payouts & Refunds)</option>
                <option value="PROFESSIONAL">Professional Partner</option>
                <option value="CUSTOMER">Client / Customer</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleRoleChange}>Update Role Level</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
