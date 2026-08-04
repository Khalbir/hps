"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  MapPin, Sliders, Database, Navigation,
} from "lucide-react";
import styles from "../../admin.module.css";

export default function AdminLiveMapPage() {
  const [radiusKm, setRadiusKm] = useState(25);
  const [filterMode, setFilterMode] = useState<"ALL" | "JOBS" | "ARTISANS">("ALL");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const bookings = [
    { id: "HHP-M1K9X", title: "Deep Cleaning", client: "Amina I.", address: "Maitama, Abuja", lat: 9.0882, lng: 7.4984, type: "JOB", status: "IN_PROGRESS", pro: "Blessing O." },
    { id: "HHP-N2L0Y", title: "Electrical Repair", client: "Chidi O.", address: "Wuse 2, Abuja", lat: 9.0765, lng: 7.4723, type: "JOB", status: "CONFIRMED", pro: "Abubakar T." },
    { id: "HHP-O3M1Z", title: "Plumbing Pipe Fix", client: "Grace N.", address: "Jabi, Abuja", lat: 9.0701, lng: 7.4258, type: "JOB", status: "DISPATCHED", pro: "Ibrahim M." },
  ];

  const artisans = [
    { id: "art_1", name: "Blessing O.", trade: "Cleaning Lead", rating: 4.8, locationName: "Wuse 2 GPS", lat: 9.0765, lng: 7.4723, type: "ARTISAN", status: "ONLINE", battery: "88%" },
    { id: "art_2", name: "Grace E.", trade: "Deep Cleaning Pro", rating: 4.9, locationName: "Maitama GPS", lat: 9.0882, lng: 7.4984, type: "ARTISAN", status: "ON_JOB", battery: "94%" },
    { id: "art_3", name: "Ibrahim M.", trade: "Master Plumber", rating: 4.9, locationName: "Jabi GPS", lat: 9.0701, lng: 7.4258, type: "ARTISAN", status: "ONLINE", battery: "76%" },
    { id: "art_4", name: "Abubakar T.", trade: "Senior Electrician", rating: 4.9, locationName: "Garki GPS", lat: 9.0345, lng: 7.4891, type: "ARTISAN", status: "ONLINE", battery: "91%" },
  ];

  return (
    <AdminLayoutShell>
      <header className={styles.adminTopBar}>
        <div>
          <h1 className="h3">Location Intelligence & Live Dispatch Map</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>
            Real-time artisan GPS telemetry, active job pins, service radii controls, and API caching efficiency.
          </p>
        </div>
      </header>

        <div className={styles.adminContent}>
          {/* Controls Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
            {/* Radius Slider Card */}
            <div className="card" style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
              <Sliders size={28} color="var(--color-primary-500)" />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                  <label style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-bold)" }}>
                    Default Artisan Service Dispatch Radius
                  </label>
                  <strong style={{ color: "var(--color-primary-500)" }}>{radiusKm} KM</strong>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--color-primary-500)", cursor: "pointer" }}
                />
              </div>
            </div>

            {/* Cache Hit Efficiency Card */}
            <div className="card" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
              <Database size={32} color="#10B981" />
              <div>
                <span style={{ fontSize: "var(--fs-xs)", color: "#10B981", fontWeight: "var(--fw-bold)", textTransform: "uppercase" }}>
                  API Caching Efficiency
                </span>
                <h3 className="h4" style={{ color: "#10B981", margin: 0 }}>88.0% Cache Hit Rate</h3>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", margin: 0 }}>Saved $71.00 in Google Maps API calls</p>
              </div>
            </div>
          </div>

          {/* Interactive Map Visual */}
          <div className="card" style={{ padding: 0, position: "relative", overflow: "hidden", minHeight: 480, background: "#0F172A", border: "1.5px solid var(--border-primary)", borderRadius: "var(--radius-2xl)" }}>
            {/* Map Grid Background Visual Simulation */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "radial-gradient(rgba(14,165,233,0.15) 1.5px, transparent 1.5px), radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: "40px 40px, 20px 20px",
                opacity: 0.8,
              }}
            />

            {/* Map Header Overlay */}
            <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10, display: "flex", gap: "8px", background: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)", padding: "8px 12px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-primary)" }}>
              <button
                className={`btn ${filterMode === "ALL" ? "btn-primary" : "btn-secondary"} btn-xs`}
                onClick={() => setFilterMode("ALL")}
              >
                All Telemetry ({bookings.length + artisans.length})
              </button>
              <button
                className={`btn ${filterMode === "JOBS" ? "btn-primary" : "btn-secondary"} btn-xs`}
                onClick={() => setFilterMode("JOBS")}
              >
                Active Bookings ({bookings.length})
              </button>
              <button
                className={`btn ${filterMode === "ARTISANS" ? "btn-primary" : "btn-secondary"} btn-xs`}
                onClick={() => setFilterMode("ARTISANS")}
              >
                Online Artisans ({artisans.length})
              </button>
            </div>

            {/* Service Radius Indicator Overlay Circle */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: `${radiusKm * 14}px`,
                height: `${radiusKm * 14}px`,
                borderRadius: "50%",
                border: "2px dashed rgba(14,165,233,0.4)",
                background: "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)",
                pointerEvents: "none",
                transition: "all 0.4s ease",
              }}
            />

            {/* Job Markers */}
            {(filterMode === "ALL" || filterMode === "JOBS") &&
              bookings.map((j, idx) => (
                <motion.div
                  key={j.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: "absolute",
                    top: `${30 + idx * 22}%`,
                    left: `${25 + idx * 25}%`,
                    cursor: "pointer",
                    zIndex: 20,
                  }}
                  onClick={() => setSelectedItem(j)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0EA5E9", color: "white", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", boxShadow: "0 4px 15px rgba(14,165,233,0.5)" }}>
                    <MapPin size={14} />
                    <span>{j.title} ({j.client})</span>
                  </div>
                </motion.div>
              ))}

            {/* Artisan GPS Markers */}
            {(filterMode === "ALL" || filterMode === "ARTISANS") &&
              artisans.map((a, idx) => (
                <motion.div
                  key={a.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: "absolute",
                    top: `${45 + (idx % 2 === 0 ? 15 : -20)}%`,
                    left: `${35 + idx * 18}%`,
                    cursor: "pointer",
                    zIndex: 20,
                  }}
                  onClick={() => setSelectedItem(a)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", background: a.status === "ON_JOB" ? "#8B5CF6" : "#10B981", color: "white", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", boxShadow: "0 4px 15px rgba(16,185,129,0.5)" }}>
                    <Navigation size={14} />
                    <span>{a.name} ({a.trade})</span>
                  </div>
                </motion.div>
              ))}

            {/* Inspector Details Overlay */}
            {selectedItem && (
              <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 30, background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)", padding: "16px", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-primary)", width: 300, color: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#0EA5E9" }}>
                    {selectedItem.type === "JOB" ? selectedItem.title : selectedItem.name}
                  </h4>
                  <button onClick={() => setSelectedItem(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>✕</button>
                </div>
                {selectedItem.type === "JOB" ? (
                  <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px", color: "rgba(255,255,255,0.8)" }}>
                    <p>Client: {selectedItem.client}</p>
                    <p>Address: {selectedItem.address}</p>
                    <p>Assigned Pro: {selectedItem.pro}</p>
                    <p>Status: <span style={{ color: "#10B981", fontWeight: "bold" }}>{selectedItem.status}</span></p>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px", color: "rgba(255,255,255,0.8)" }}>
                    <p>Trade: {selectedItem.trade}</p>
                    <p>Rating: {selectedItem.rating}★</p>
                    <p>GPS Telemetry: {selectedItem.locationName}</p>
                    <p>Phone Battery: {selectedItem.battery}</p>
                    <p>Status: <span style={{ color: "#10B981", fontWeight: "bold" }}>{selectedItem.status}</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </AdminLayoutShell>
  );
}
