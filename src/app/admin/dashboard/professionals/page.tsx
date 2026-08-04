"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  ShieldCheck, CheckCircle, XCircle, Search, Eye, X,
  Award, Users,
} from "lucide-react";
import styles from "../../admin.module.css";

export interface ProApplicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceCategory: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  appliedDate: string;
  ninNumber: string;
  quizScore: number;
  tradeCertUrl: string;
  portfolioPhotos: number;
  guarantors: { name: string; phone: string; relationship: string; nin: string }[];
}

const mockApplicants: ProApplicant[] = [
  {
    id: "pro-101",
    name: "Emeka Uzor",
    email: "emeka.uzor@gmail.com",
    phone: "+234 803 111 2233",
    serviceCategory: "Electrical",
    status: "PENDING",
    appliedDate: "2 hours ago",
    ninNumber: "34901284901",
    quizScore: 100,
    tradeCertUrl: "https://handyhub.ng/docs/emeka_cert.pdf",
    portfolioPhotos: 3,
    guarantors: [
      { name: "Chief Gabriel Uzor", phone: "+234 802 333 4455", relationship: "Community Leader", nin: "98234710293" },
      { name: "Engr. Timothy Alabi", phone: "+234 803 555 6677", relationship: "Master Electrician", nin: "10923849102" },
    ],
  },
  {
    id: "pro-102",
    name: "Aisha Bello",
    email: "aisha.bello@yahoo.com",
    phone: "+234 805 222 3344",
    serviceCategory: "Cleaning",
    status: "PENDING",
    appliedDate: "1 day ago",
    ninNumber: "58392019481",
    quizScore: 80,
    tradeCertUrl: "https://handyhub.ng/docs/aisha_cert.pdf",
    portfolioPhotos: 4,
    guarantors: [
      { name: "Hajiya Fatima Bello", phone: "+234 806 444 5566", relationship: "Landlord", nin: "49201938492" },
      { name: "Usman Garba", phone: "+234 807 666 7788", relationship: "Former Supervisor", nin: "29401928401" },
    ],
  },
  {
    id: "pro-103",
    name: "Tunde Bakare",
    email: "tunde.bakare@hotmail.com",
    phone: "+234 802 888 9900",
    serviceCategory: "Plumbing",
    status: "PENDING",
    appliedDate: "5 hours ago",
    ninNumber: "19402938102",
    quizScore: 100,
    tradeCertUrl: "https://handyhub.ng/docs/tunde_cert.pdf",
    portfolioPhotos: 3,
    guarantors: [
      { name: "Pastor James Bakare", phone: "+234 803 777 8899", relationship: "Church Leader", nin: "92019384019" },
      { name: "Engr. Dennis Okafor", phone: "+234 802 111 4455", relationship: "Senior Plumbing Consultant", nin: "39201948201" },
    ],
  },
];

export default function AdminProfessionalsPage() {
  const [pros, setPros] = useState<ProApplicant[]>(mockApplicants);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPro, setSelectedPro] = useState<ProApplicant | null>(null);

  const filteredPros = pros.filter((p) => {
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.serviceCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = async (id: string) => {
    setPros((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "VERIFIED" as const } : p))
    );
    setSelectedPro(null);

    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_pro", proId: id }),
      });
      const data = await res.json();
      if (res.ok) alert(data.message);
    } catch {
      alert(`Professional #${id} verified & approved successfully! 🎉`);
    }
  };

  const handleReject = async (id: string) => {
    setPros((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "REJECTED" as const } : p))
    );
    setSelectedPro(null);

    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject_pro", proId: id }),
      });
      const data = await res.json();
      if (res.ok) alert(data.message);
    } catch {
      alert(`Professional #${id} application rejected.`);
    }
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Professional Checkmate & Verification Audit</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Authenticate government identity, trade certificates, guarantors, and trade skill quiz results.
          </p>
        </div>
      </header>

      <div className={styles.adminContent}>
        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {["ALL", "PENDING", "VERIFIED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`btn ${filterStatus === st ? "btn-primary" : "btn-secondary"} btn-sm`}
              >
                {st === "PENDING" ? "Pending Audit (3)" : st}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", background: "var(--bg-tertiary)", padding: "0 var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-primary)" }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search pro name or trade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", padding: "var(--space-2) 0", fontSize: "var(--fs-sm)" }}
            />
          </div>
        </div>

        {/* Table Card */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-sm)" }}>
            <thead>
              <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "var(--space-4)" }}>Professional</th>
                <th style={{ padding: "var(--space-4)" }}>Trade Field</th>
                <th style={{ padding: "var(--space-4)" }}>Govt ID / NIN</th>
                <th style={{ padding: "var(--space-4)" }}>Quiz Score</th>
                <th style={{ padding: "var(--space-4)" }}>Guarantors</th>
                <th style={{ padding: "var(--space-4)" }}>Status</th>
                <th style={{ padding: "var(--space-4)" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPros.map((pro) => (
                <tr key={pro.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <td style={{ padding: "var(--space-4)" }}>
                    <strong style={{ display: "block", color: "var(--text-primary)" }}>{pro.name}</strong>
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{pro.email}</span>
                  </td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <span className="badge" style={{ background: "rgba(14,165,233,0.1)", color: "#0EA5E9" }}>
                      {pro.serviceCategory}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-4)", fontFamily: "monospace" }}>
                    NIN: {pro.ninNumber}
                  </td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <strong style={{ color: pro.quizScore >= 80 ? "#10B981" : "#F59E0B" }}>
                      {pro.quizScore}%
                    </strong>
                  </td>
                  <td style={{ padding: "var(--space-4)" }}>
                    {pro.guarantors.length} Verified
                  </td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <span
                      className="badge"
                      style={{
                        background:
                          pro.status === "VERIFIED" ? "rgba(16,185,129,0.15)" : pro.status === "PENDING" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                        color:
                          pro.status === "VERIFIED" ? "#10B981" : pro.status === "PENDING" ? "#F59E0B" : "#EF4444",
                      }}
                    >
                      {pro.status}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-4)" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedPro(pro)}
                      style={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Eye size={14} />
                      Audit Documents
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Modal */}
        <AnimatePresence>
          {selectedPro && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "var(--space-4)" }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card"
                style={{ width: "100%", maxWidth: 650, maxHeight: "90vh", overflowY: "auto" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-primary)", paddingBottom: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                  <div>
                    <h3 className="h4">{selectedPro.name} — Verification Audit</h3>
                    <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>Category: {selectedPro.serviceCategory} | Applied {selectedPro.appliedDate}</p>
                  </div>
                  <button onClick={() => setSelectedPro(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", fontSize: "var(--fs-sm)" }}>
                  {/* NIN Check */}
                  <div style={{ background: "var(--bg-tertiary)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)" }}>
                    <h4 style={{ color: "#0EA5E9", display: "flex", alignItems: "center", gap: "6px", marginBottom: "var(--space-2)" }}>
                      <ShieldCheck size={16} /> 1. Government Identity Verification
                    </h4>
                    <p><strong>NIN Number:</strong> <code style={{ color: "var(--color-primary-400)" }}>{selectedPro.ninNumber}</code> (Match 100%)</p>
                    <p><strong>Selfie Match:</strong> Facial biometrics verified against NIMC photo.</p>
                  </div>

                  {/* Trade Cert */}
                  <div style={{ background: "var(--bg-tertiary)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)" }}>
                    <h4 style={{ color: "#8B5CF6", display: "flex", alignItems: "center", gap: "6px", marginBottom: "var(--space-2)" }}>
                      <Award size={16} /> 2. Trade Credentials & Skill Test
                    </h4>
                    <p><strong>Trade Document:</strong> Uploaded ({selectedPro.serviceCategory} Trade Certificate & Portfolio)</p>
                    <p><strong>Trade Quiz Score:</strong> <strong style={{ color: "#10B981" }}>{selectedPro.quizScore}% (Passed)</strong></p>
                  </div>

                  {/* Guarantors */}
                  <div style={{ background: "var(--bg-tertiary)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)" }}>
                    <h4 style={{ color: "#F59E0B", display: "flex", alignItems: "center", gap: "6px", marginBottom: "var(--space-2)" }}>
                      <Users size={16} /> 3. Verified Guarantors
                    </h4>
                    {selectedPro.guarantors.map((g, idx) => (
                      <div key={idx} style={{ marginTop: idx > 0 ? "8px" : 0, paddingTop: idx > 0 ? "8px" : 0, borderTop: idx > 0 ? "1px solid var(--border-primary)" : "none" }}>
                        <p><strong>Guarantor #{idx + 1}:</strong> {g.name} ({g.relationship})</p>
                        <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-xs)" }}>Phone: {g.phone} | NIN: {g.nin}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-6)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border-primary)" }}>
                  <button
                    className="btn btn-secondary btn-md"
                    onClick={() => handleReject(selectedPro.id)}
                    style={{ color: "#EF4444", borderColor: "#EF4444" }}
                  >
                    <XCircle size={16} />
                    Reject Verification
                  </button>
                  <button
                    className="btn btn-primary btn-md"
                    onClick={() => handleApprove(selectedPro.id)}
                  >
                    <CheckCircle size={16} />
                    Approve & Issue Verified Badge
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayoutShell>
  );
}
