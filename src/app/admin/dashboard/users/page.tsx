"use client";

import { useState } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { Users, Search, UserCheck, Shield, Mail, Phone, Lock, CheckCircle2, XCircle } from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const usersList = [
    { id: "usr_101", name: "Khalid Kabir", email: "khalid.kabir@handyhubpro.ng", phone: "+234 801 111 0000", role: "ADMIN", status: "ACTIVE", joined: "Jan 2026" },
    { id: "usr_102", name: "Amina Ibrahim", email: "amina.ibrahim@gmail.com", phone: "+234 802 111 4455", role: "CUSTOMER", status: "ACTIVE", joined: "Feb 2026" },
    { id: "usr_103", name: "Blessing O.", email: "blessing.o@handyhubpro.ng", phone: "+234 801 000 1122", role: "PROFESSIONAL", status: "VERIFIED", joined: "Mar 2026" },
    { id: "usr_104", name: "Chidi Okonkwo", email: "chidi.o@yahoo.com", phone: "+234 803 222 5566", role: "CUSTOMER", status: "ACTIVE", joined: "Apr 2026" },
    { id: "usr_105", name: "Emeka Uzor", email: "emeka.uzor@gmail.com", phone: "+234 803 111 2233", role: "PROFESSIONAL", status: "PENDING", joined: "Today" },
  ];

  const filtered = usersList.filter((u) => {
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    return matchesRole && matchesSearch;
  });

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">User Management</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Manage platform accounts across Customers, Verified Professionals, and Admins.
          </p>
        </div>
      </header>

      <div className={styles.adminContent}>
        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {["ALL", "CUSTOMER", "PROFESSIONAL", "ADMIN"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`btn ${roleFilter === r ? "btn-primary" : "btn-secondary"} btn-xs`}
              >
                {r}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", background: "var(--bg-tertiary)", padding: "0 var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-primary)" }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", padding: "var(--space-2) 0", fontSize: "var(--fs-sm)" }}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-sm)" }}>
            <thead>
              <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "var(--space-4)" }}>User Name</th>
                <th style={{ padding: "var(--space-4)" }}>Email & Phone</th>
                <th style={{ padding: "var(--space-4)" }}>Role</th>
                <th style={{ padding: "var(--space-4)" }}>Status</th>
                <th style={{ padding: "var(--space-4)" }}>Joined</th>
                <th style={{ padding: "var(--space-4)" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <td style={{ padding: "var(--space-4)", fontWeight: "bold" }}>{u.name}</td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <span style={{ display: "block" }}>{u.email}</span>
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{u.phone}</span>
                  </td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <span className="badge" style={{ background: u.role === "ADMIN" ? "rgba(239,68,68,0.15)" : u.role === "PROFESSIONAL" ? "rgba(14,165,233,0.15)" : "rgba(16,185,129,0.15)", color: u.role === "ADMIN" ? "#EF4444" : u.role === "PROFESSIONAL" ? "#0EA5E9" : "#10B981" }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-4)" }}>{u.status}</td>
                  <td style={{ padding: "var(--space-4)" }}>{u.joined}</td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <button className="btn btn-secondary btn-xs">Edit Account</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
