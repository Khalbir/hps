"use client";

import { useState } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { Users, Shield, Search, UserCheck, Key, Edit, CheckCircle2 } from "lucide-react";
import styles from "../../admin.module.css";
import { ROLE_LABELS } from "@/lib/rbac";

const mockUsersList = [
  { id: "u1", name: "System Super Admin", email: "admin@handyhubpro.com", phone: "08000000001", role: "SUPER_ADMIN", isVerified: true, createdAt: "2026-01-01" },
  { id: "u2", name: "Chisom Egwu", email: "chisom.ops@handyhubpro.com", phone: "08031122334", role: "OPERATIONS_MANAGER", isVerified: true, createdAt: "2026-02-15" },
  { id: "u3", name: "Kemi Adeleke", email: "kemi.verify@handyhubpro.com", phone: "08124455667", role: "VERIFICATION_OFFICER", isVerified: true, createdAt: "2026-03-01" },
  { id: "u4", name: "Babatunde Lawal", email: "baba.support@handyhubpro.com", phone: "07038899001", role: "CUSTOMER_SUPPORT", isVerified: true, createdAt: "2026-03-10" },
  { id: "u5", name: "Ngozi Okafor", email: "ngozi.fin@handyhubpro.com", phone: "08092233445", role: "FINANCE", isVerified: true, createdAt: "2026-04-05" },
  { id: "u6", name: "Amina Ibrahim", email: "amina.i@gmail.com", phone: "08031234567", role: "CUSTOMER", isVerified: true, createdAt: "2026-05-12" },
];

export default function UsersRoleManagementPage() {
  const [users, setUsers] = useState(mockUsersList);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("SUPER_ADMIN");
  const [toast, setToast] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = () => {
    if (!editingUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? { ...u, role: selectedRole } : u))
    );
    setToast(`Role for ${editingUser.name} updated to ${selectedRole}!`);
    setEditingUser(null);
    setTimeout(() => setToast(""), 4000);
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {Object.entries(ROLE_LABELS).map(([key, info]) => (
          <div key={key} style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "10px", padding: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: info.badgeColor, textTransform: "uppercase" }}>{info.label}</span>
            <p style={{ fontSize: "11px", color: "#94A3B8", margin: "6px 0 0 0", lineHeight: 1.4 }}>{info.description}</p>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: "20px" }}>
        <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
        <input
          type="text"
          placeholder="Search user name, email, or role..."
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

      {/* Users Table */}
      <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
              <th style={{ padding: "12px 16px" }}>User Name</th>
              <th style={{ padding: "12px 16px" }}>Email Address</th>
              <th style={{ padding: "12px 16px" }}>Phone</th>
              <th style={{ padding: "12px 16px" }}>Assigned Role</th>
              <th style={{ padding: "12px 16px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const info = ROLE_LABELS[u.role] || { label: u.role, badgeColor: "#64748B" };
              return (
                <tr key={u.id} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#F8FAFC" }}>{u.name}</td>
                  <td style={{ padding: "12px 16px", color: "#94A3B8" }}>{u.email}</td>
                  <td style={{ padding: "12px 16px", color: "#CBD5E1" }}>{u.phone}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="badge" style={{ background: info.badgeColor + "25", color: info.badgeColor, fontSize: "11px", fontWeight: 700 }}>
                      {info.label}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button className="btn btn-secondary btn-xs" onClick={() => { setEditingUser(u); setSelectedRole(u.role); }}>
                      <Edit size={14} /> Assign Role
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role Assignment Modal */}
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
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Assign Staff Role</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            <p style={{ fontSize: "14px", color: "#CBD5E1", marginBottom: "16px" }}>
              Assigning new system permissions to <strong>{editingUser.name}</strong> ({editingUser.email}).
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {["SUPER_ADMIN", "OPERATIONS_MANAGER", "VERIFICATION_OFFICER", "CUSTOMER_SUPPORT", "FINANCE", "CUSTOMER"].map((r) => {
                const info = ROLE_LABELS[r] || { label: r, description: "Customer / End User" };
                return (
                  <label
                    key={r}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      background: selectedRole === r ? "rgba(14,165,233,0.12)" : "#0F172A",
                      border: selectedRole === r ? "1px solid #0EA5E9" : "1px solid #334155",
                      padding: "12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={selectedRole === r}
                      onChange={() => setSelectedRole(r)}
                      style={{ marginTop: "3px" }}
                    />
                    <div>
                      <strong style={{ fontSize: "13px", color: "#F8FAFC", display: "block" }}>{info.label}</strong>
                      <span style={{ fontSize: "11px", color: "#94A3B8" }}>{info.description}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setEditingUser(null)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={handleRoleChange} className="btn btn-primary btn-sm">Save Role Changes</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
