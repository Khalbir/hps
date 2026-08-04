"use client";

import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import { BarChart3, TrendingUp, Users, DollarSign, Award } from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminAnalyticsPage() {
  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Analytics & Financial Insights</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Platform revenue growth, top service categories, and customer acquisition metrics.
          </p>
        </div>
      </header>

      <div className={styles.adminContent}>
        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>Monthly Active Users (MAU)</span>
            <h2 className="h2" style={{ margin: "4px 0 0", color: "#0EA5E9" }}>1,480</h2>
          </div>
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>Top Performing Category</span>
            <h2 className="h2" style={{ margin: "4px 0 0", color: "#8B5CF6" }}>Cleaning (42%)</h2>
          </div>
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>Customer Repeat Rate</span>
            <h2 className="h2" style={{ margin: "4px 0 0", color: "#10B981" }}>68.4%</h2>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: "var(--space-4)" }}>Category Demand Distribution</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)", marginBottom: "4px" }}>
                <span>Cleaning & Sanitization</span>
                <strong>42% (64 Bookings)</strong>
              </div>
              <div style={{ height: 8, background: "var(--bg-tertiary)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: "42%", height: "100%", background: "#0EA5E9" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)", marginBottom: "4px" }}>
                <span>Electrical Repairs & Wiring</span>
                <strong>28% (42 Bookings)</strong>
              </div>
              <div style={{ height: 8, background: "var(--bg-tertiary)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: "28%", height: "100%", background: "#8B5CF6" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)", marginBottom: "4px" }}>
                <span>Plumbing & Leak Repairs</span>
                <strong>18% (27 Bookings)</strong>
              </div>
              <div style={{ height: 8, background: "var(--bg-tertiary)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: "18%", height: "100%", background: "#F59E0B" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutShell>
  );
}
