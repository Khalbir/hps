"use client";

import { useState, useEffect } from "react";
import { ProLayoutShell } from "@/components/layout/ProLayoutShell";
import { Calendar, Clock, CheckCircle2, Plus, ArrowLeft, ArrowRight, Inbox, RefreshCw } from "lucide-react";
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

  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRealCalendarBookings = async () => {
    setLoading(true);
    let activeUserId = "";
    let activeEmail = "";

    if (typeof window !== "undefined") {
      try {
        const storedPro = localStorage.getItem("handyhub_pro_session");
        const storedUser = localStorage.getItem("handyhub_user");
        const parsed = storedPro ? JSON.parse(storedPro) : storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.user?.id || parsed?.id) activeUserId = parsed.user?.id || parsed.id;
        if (parsed?.user?.email || parsed?.email) activeEmail = parsed.user?.email || parsed.email;
      } catch (err) {}
    }

    try {
      const res = await fetch(`/api/pro/jobs?userId=${activeUserId}&email=${encodeURIComponent(activeEmail)}`);
      const data = await res.json();
      if (res.ok && data.jobs) {
        setUpcomingBookings(data.jobs);
      }
    } catch (err) {
      console.warn("Failed to fetch calendar bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealCalendarBookings();
  }, []);

  const toggleDay = (index: number) => {
    setWorkingDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, active: !d.active } : d))
    );
  };

  return (
    <ProLayoutShell>
      <div style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="h2">Availability & Schedule Calendar</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-md)" }}>
            Set your weekly working hours and manage upcoming job appointments.
          </p>
        </div>
        <button onClick={fetchRealCalendarBookings} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refresh Schedule
        </button>
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

          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--fs-xs)" }}>Loading real bookings...</div>
          ) : upcomingBookings.length === 0 ? (
            <div style={{ padding: "30px 16px", textAlign: "center", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-primary)" }}>
              <Inbox size={32} color="#0EA5E9" style={{ opacity: 0.6, marginBottom: 8 }} />
              <strong style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--text-primary)" }}>No Scheduled Bookings</strong>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", margin: "4px 0 0" }}>When clients book your services, appointment dates will display here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {upcomingBookings.map((b) => (
                <div key={b.id} style={{ padding: "var(--space-3)", background: "rgba(14,165,233,0.1)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(14,165,233,0.25)" }}>
                  <strong style={{ display: "block", fontSize: "var(--fs-sm)", color: "#0EA5E9" }}>{b.date} • {b.time}</strong>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-primary)", fontWeight: "bold" }}>{b.service} — {b.customer}</span>
                  <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "2px 0 0" }}>{b.address}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProLayoutShell>
  );
}
