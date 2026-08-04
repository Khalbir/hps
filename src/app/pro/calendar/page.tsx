"use client";

import { useState } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Calendar, Clock, CheckCircle2, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import styles from "../dashboard/dashboard.module.css";

export default function ProCalendarPage() {
  const [workingDays, setWorkingDays] = useState([
    { day: "Monday", active: true, hours: "8:00 AM - 6:00 PM" },
    { day: "Tuesday", active: true, hours: "8:00 AM - 6:00 PM" },
    { day: "Wednesday", active: true, hours: "8:00 AM - 6:00 PM" },
    { day: "Thursday", active: true, hours: "8:00 AM - 6:00 PM" },
    { day: "Friday", active: true, hours: "8:00 AM - 6:00 PM" },
    { day: "Saturday", active: true, hours: "9:00 AM - 4:00 PM" },
    { day: "Sunday", active: false, hours: "Day Off" },
  ]);

  const toggleDay = (index: number) => {
    setWorkingDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, active: !d.active } : d))
    );
  };

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 className="h2">Availability & Schedule Calendar</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
          Set your weekly working hours and manage upcoming job appointments.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)" }}>
        {/* Weekly Schedule Card */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Clock size={20} color="var(--color-primary-500)" /> Weekly Working Availability
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {workingDays.map((w, idx) => (
              <div key={w.day} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-primary)" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "var(--fs-sm)" }}>{w.day}</strong>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{w.hours}</span>
                </div>
                <button
                  className={`btn ${w.active ? "btn-primary" : "btn-secondary"} btn-xs`}
                  onClick={() => toggleDay(idx)}
                >
                  {w.active ? "Available" : "Day Off"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Appointments Summary */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: "var(--space-4)" }}>Upcoming Bookings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ padding: "var(--space-3)", background: "rgba(14,165,233,0.1)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(14,165,233,0.25)" }}>
              <strong style={{ display: "block", fontSize: "var(--fs-sm)", color: "#0EA5E9" }}>Today, 2:00 PM</strong>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-primary)" }}>Deep Cleaning — Amina I.</span>
              <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "2px 0 0" }}>12 Aminu Kano, Maitama</p>
            </div>

            <div style={{ padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)" }}>
              <strong style={{ display: "block", fontSize: "var(--fs-sm)" }}>Tomorrow, 9:00 AM</strong>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-primary)" }}>Residential Cleaning — Chidi O.</span>
              <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "2px 0 0" }}>Plot 5, Wuse 2</p>
            </div>
          </div>
        </div>
      </div>
    </ProLayoutShell>
  );
}
