"use client";

import { useState, useEffect } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  BarChart3, Download, FileSpreadsheet, FileText, TrendingUp,
  DollarSign, ClipboardList, ShieldCheck, Award, Calendar, Printer, Inbox
} from "lucide-react";
import styles from "../../admin.module.css";

export default function AnalyticsReportsPage() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [exportNotice, setExportNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      const res = await fetch("/api/admin/telemetry");
      const data = await res.json();
      if (res.ok && data.success) {
        setTelemetry(data);
      }
    } catch (err) {
      console.warn("Failed to fetch analytics telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const stats = telemetry?.stats || {
    totalRevenueNgn: 0,
    activeBookingsCount: 0,
    verifiedArtisansCount: 0,
    completedJobsCount: 0,
    totalBookingsAll: 0,
  };

  const totalGrossNgn = stats.totalRevenueNgn || 0;
  const totalNetCommissionNgn = Math.round(totalGrossNgn * 0.20);
  const totalBookingsCount = stats.totalBookingsAll || 0;

  const revenueMonthly = telemetry?.revenueMonthly || [];
  const recentBookings = telemetry?.recentBookings || [];

  // Client-side Excel (CSV) Download Handler
  const handleExportCSV = () => {
    const headers = ["Month,Gross Escrow (NGN),Net Commission 20% (NGN)\n"];
    const rows = revenueMonthly.map(
      (r: any) => `"${r.month}",${r.amount},${Math.round(r.amount * 0.20)}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `handyhub_analytics_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice("Excel (CSV) Report downloaded successfully!");
    setTimeout(() => setExportNotice(""), 4000);
  };

  const handleExportPDF = () => {
    window.print();
    setExportNotice("PDF Export print dialog initialized.");
    setTimeout(() => setExportNotice(""), 4000);
  };

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar} style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="h3">Marketplace Analytics & Financial Reports</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Real production revenue metrics, 20% escrow commission totals, and Excel/PDF export. Zero generated figures.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FileSpreadsheet size={16} color="#10B981" /> Export to Excel (.csv)
          </button>

          <button onClick={handleExportPDF} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Printer size={16} /> Export / Print PDF Report
          </button>
        </div>
      </header>

      {exportNotice && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#10B981", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          ✅ {exportNotice}
        </div>
      )}

      <div className={styles.adminContent}>
        {/* KPI Summary Tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "24px" }}>
          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Gross Production Escrow</div>
            <h2 className="h2" style={{ color: "#10B981", margin: "8px 0" }}>₦{totalGrossNgn.toLocaleString()}</h2>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Calculated from database payments</span>
          </div>

          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Platform Net Commission (20%)</div>
            <h2 className="h2" style={{ color: "#0EA5E9", margin: "8px 0" }}>₦{totalNetCommissionNgn.toLocaleString()}</h2>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Net HandyHub platform share</span>
          </div>

          <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Total Production Bookings</div>
            <h2 className="h2" style={{ color: "#8B5CF6", margin: "8px 0" }}>{totalBookingsCount}</h2>
            <span style={{ fontSize: "12px", color: "#10B981" }}>{stats.completedJobsCount} Completed</span>
          </div>
        </div>

        {/* Monthly Revenue Breakdown Table */}
        <div className="card" style={{ background: "#1E293B", border: "1px solid #334155", padding: 0, overflow: "hidden", marginBottom: "24px" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="h4" style={{ margin: 0, color: "#F8FAFC" }}>Monthly Revenue Report (Real Database Sums)</h3>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Year 2026 Telemetry</span>
          </div>
          {revenueMonthly.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
              <Inbox size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: "14px" }}>No revenue records in database yet.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#0F172A", borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                  <th style={{ padding: "12px 16px" }}>Month</th>
                  <th style={{ padding: "12px 16px" }}>Gross Revenue (NGN)</th>
                  <th style={{ padding: "12px 16px" }}>Net Commission (20%)</th>
                </tr>
              </thead>
              <tbody>
                {revenueMonthly.map((r: any) => (
                  <tr key={r.month} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#F8FAFC" }}>{r.month}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#10B981" }}>₦{r.amount.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0EA5E9" }}>₦{Math.round(r.amount * 0.20).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayoutShell>
  );
}
