"use client";

import {
  Sparkles, Droplets, Zap, Paintbrush, Wind, Camera, Sun,
  Hammer, Home, TreePine, Shirt, Truck, Settings, Search,
  Building2, CheckCircle2, ShieldCheck, HelpCircle, Layers, Sliders
} from "lucide-react";
import { useState, useEffect } from "react";
import type { BookingData } from "@/app/book/page";
import { SERVICE_CATEGORIES, ServiceCategory, ServiceItem } from "@/lib/services";
import { calculateJobPrice, DEFAULT_PRICING_RULES, PricingModel, getEffectiveServiceItem } from "@/lib/pricingEngine";
import styles from "./Steps.module.css";

interface StepProps {
  booking: BookingData;
  updateBooking: (u: Partial<BookingData>) => void;
  onNext: () => void;
}

export function StepService({ booking, updateBooking, onNext }: StepProps) {
  const [selectedCategory, setSelectedCategory] = useState(booking.serviceCategory || "");
  const [searchQuery, setSearchQuery] = useState(booking.initialQuery || "");
  const [pricingRules, setPricingRules] = useState(DEFAULT_PRICING_RULES);

  useEffect(() => {
    async function loadPricingRules() {
      try {
        const res = await fetch("/api/admin/pricing-rules", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });
        const data = await res.json();
        if (res.ok && data.rules) {
          setPricingRules(data.rules);
        }
      } catch (err) {}
    }
    loadPricingRules();
  }, []);

  useEffect(() => {
    if (booking.serviceCategory) {
      setSelectedCategory(booking.serviceCategory);
    }
  }, [booking.serviceCategory]);

  const activeCategory = SERVICE_CATEGORIES.find((c) => c.id === selectedCategory);

  const filteredCategories = searchQuery
    ? SERVICE_CATEGORIES.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.services.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : SERVICE_CATEGORIES;

  const handleBedroomsChange = (n: number) => {
    updateBooking({ bedrooms: n });
  };

  const handleBathroomsChange = (n: number) => {
    updateBooking({ bathrooms: n });
  };

  const handleFurnishedToggle = (isFurnished: boolean) => {
    updateBooking({ isFurnished });
  };

  const handleDirtLevelChange = (dirtLevel: "LIGHT" | "MODERATE" | "HEAVY") => {
    updateBooking({ dirtLevel });
  };

  const handleQuantityChange = (quantity: number) => {
    updateBooking({ quantity: Math.max(1, quantity) });
  };

  const selectService = (catId: string, rawSvc: any) => {
    const svc = getEffectiveServiceItem(rawSvc, pricingRules);
    const pModel = (svc.pricingModel as PricingModel) || "FIXED";
    const calc = calculateJobPrice(
      {
        serviceId: svc.id,
        pricingModel: pModel,
        basePrice: svc.price,
        bedrooms: booking.bedrooms || 2,
        bathrooms: booking.bathrooms || 1,
        isFurnished: booking.isFurnished || false,
        dirtLevel: booking.dirtLevel || "MODERATE",
        quantity: booking.quantity || 1,
        regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
        isExpressSchedule: booking.isEmergency || false,
      },
      pricingRules
    );

    updateBooking({
      serviceCategory: catId,
      serviceId: svc.id,
      serviceName: svc.name,
      servicePrice: svc.price,
      pricingModel: pModel,
      totalPrice: calc.totalPriceNgn,
    });
    onNext();
  };

  return (
    <div className={styles.stepContainer}>
      {/* Search */}
      <div className={styles.searchBar}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search services... e.g. 'AC not cooling' or 'Deep cleaning'"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {!selectedCategory ? (
        <>
          <h2 className={styles.stepTitle}>Select Your Service Category</h2>
          <div className={styles.categoryGrid}>
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                className={styles.categoryCard}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <div className={styles.categoryIcon} style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                  <Layers size={24} />
                </div>
                <span className={styles.categoryName}>{cat.name}</span>
                <span className={styles.categoryCount}>{cat.services.length} service{cat.services.length > 1 ? "s" : ""}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className={styles.backToCategories} onClick={() => setSelectedCategory("")}>
            ← All Service Categories
          </button>
          <h2 className={styles.stepTitle}>{activeCategory?.name} Options</h2>

          {/* Property-Based Controls for Cleaning & Painting */}
          {(selectedCategory === "cleaning" || selectedCategory === "painting") && (
            <div className={styles.configCard} style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px", borderRadius: "16px", marginBottom: "24px" }}>
              <div className={styles.configHeader} style={{ marginBottom: "16px" }}>
                <h4 className={styles.configTitle} style={{ margin: 0, color: "#F8FAFC", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Building2 size={18} color="#0EA5E9" /> Property Size & Condition Configuration
                </h4>
                <p className={styles.configSubtitle} style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "13px" }}>
                  Customize rooms, furnished fitting, and grime level for instant upfront pricing.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                {/* Bedrooms Counter */}
                <div style={{ background: "#0F172A", padding: "12px 14px", borderRadius: "12px", border: "1px solid #334155" }}>
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>Bedrooms</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleBedroomsChange(Math.max(1, (booking.bedrooms || 2) - 1))}
                      style={{ background: "#1E293B", border: "1px solid #334155", color: "#F8FAFC", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                      disabled={(booking.bedrooms || 2) <= 1}
                    >
                      -
                    </button>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "#F8FAFC" }}>{booking.bedrooms || 2}</span>
                    <button
                      type="button"
                      onClick={() => handleBedroomsChange((booking.bedrooms || 2) + 1)}
                      style={{ background: "#1E293B", border: "1px solid #334155", color: "#F8FAFC", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Bathrooms Counter */}
                <div style={{ background: "#0F172A", padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155" }}>
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>Bathrooms</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleBathroomsChange(Math.max(1, (booking.bathrooms || 1) - 1))}
                      style={{ background: "#1E293B", border: "1px solid #334155", color: "#F8FAFC", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                      disabled={(booking.bathrooms || 1) <= 1}
                    >
                      -
                    </button>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "#F8FAFC" }}>{booking.bathrooms || 1}</span>
                    <button
                      type="button"
                      onClick={() => handleBathroomsChange((booking.bathrooms || 1) + 1)}
                      style={{ background: "#1E293B", border: "1px solid #334155", color: "#F8FAFC", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Furnished Toggle */}
                <div style={{ background: "#0F172A", padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155" }}>
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>Furnished Status</span>
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleFurnishedToggle(false)}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        border: !booking.isFurnished ? "1px solid #0EA5E9" : "1px solid #334155",
                        background: !booking.isFurnished ? "rgba(14,165,233,0.15)" : "#1E293B",
                        color: !booking.isFurnished ? "#38BDF8" : "#94A3B8",
                        cursor: "pointer",
                      }}
                    >
                      Unfurnished
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFurnishedToggle(true)}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        border: booking.isFurnished ? "1px solid #0EA5E9" : "1px solid #334155",
                        background: booking.isFurnished ? "rgba(14,165,233,0.15)" : "#1E293B",
                        color: booking.isFurnished ? "#38BDF8" : "#94A3B8",
                        cursor: "pointer",
                      }}
                    >
                      Furnished (+₦5k)
                    </button>
                  </div>
                </div>

                {/* Dirt Level Selector */}
                <div style={{ background: "#0F172A", padding: "12px 16px", borderRadius: "12px", border: "1px solid #334155" }}>
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>Condition / Dirt Level</span>
                  <select
                    value={booking.dirtLevel || "MODERATE"}
                    onChange={(e: any) => handleDirtLevelChange(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      background: "#1E293B",
                      border: "1px solid #334155",
                      color: "#F8FAFC",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <option value="LIGHT">Light Maintenance (1.0x)</option>
                    <option value="MODERATE">Moderate Grime (1.15x)</option>
                    <option value="HEAVY">Heavy / Post-Construction (1.35x)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className={styles.serviceList}>
            {activeCategory?.services.map((rawSvc: any) => {
              const svc = getEffectiveServiceItem(rawSvc, pricingRules);
              const pModel = (svc.pricingModel as PricingModel) || "FIXED";
              const calc = calculateJobPrice(
                {
                  serviceId: svc.id,
                  pricingModel: pModel,
                  basePrice: svc.price,
                  bedrooms: booking.bedrooms || 2,
                  bathrooms: booking.bathrooms || 1,
                  isFurnished: booking.isFurnished || false,
                  dirtLevel: booking.dirtLevel || "MODERATE",
                  quantity: booking.quantity || 1,
                  regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
                  isExpressSchedule: booking.isEmergency || false,
                },
                pricingRules
              );

              const isSelected = booking.serviceId === svc.id;

              return (
                <div
                  key={svc.id}
                  className="card card-hover"
                  style={{
                    background: isSelected ? "linear-gradient(135deg, rgba(14,165,233,0.08) 0%, #1E293B 100%)" : "#1E293B",
                    border: isSelected ? "1.5px solid #0EA5E9" : "1px solid #334155",
                    borderRadius: "16px",
                    padding: "16px 18px",
                    marginBottom: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    width: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    boxShadow: isSelected ? "0 0 20px rgba(14,165,233,0.2)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", width: "100%" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, color: "#F8FAFC", fontSize: "16px", fontWeight: 700 }}>{svc.name}</h3>
                        {isSelected && (
                          <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "10px", background: "rgba(14,165,233,0.2)", color: "#38BDF8", border: "1px solid rgba(14,165,233,0.4)" }}>
                            ACTIVE CHOICE
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background:
                              svc.pricingModel === "PROPERTY_BASED"
                                ? "rgba(14,165,233,0.15)"
                                : svc.pricingModel === "QUANTITY_BASED"
                                ? "rgba(245,158,11,0.15)"
                                : svc.pricingModel === "CUSTOM_QUOTE"
                                ? "rgba(139,92,246,0.15)"
                                : "rgba(16,185,129,0.15)",
                            color:
                              svc.pricingModel === "PROPERTY_BASED"
                                ? "#38BDF8"
                                : svc.pricingModel === "QUANTITY_BASED"
                                ? "#F59E0B"
                                : svc.pricingModel === "CUSTOM_QUOTE"
                                ? "#C084FC"
                                : "#10B981",
                          }}
                        >
                          {svc.pricingModel === "PROPERTY_BASED"
                            ? "PROPERTY SIZED"
                            : svc.pricingModel === "QUANTITY_BASED"
                            ? `UNIT (${svc.unitLabel || "per item"})`
                            : svc.pricingModel === "CUSTOM_QUOTE"
                            ? "FREE INSPECTION & QUOTE"
                            : "FIXED RATE"}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#94A3B8", lineHeight: 1.4 }}>{svc.desc}</p>
                    </div>

                    {/* Quantity Counter for Quantity-Based Model */}
                    {svc.pricingModel === "QUANTITY_BASED" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0F172A", padding: "4px 10px", borderRadius: "8px", border: "1px solid #334155" }}>
                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>Qty:</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange((booking.quantity || 1) - 1)}
                          style={{ background: "#1E293B", border: "none", color: "#F8FAFC", width: 24, height: 24, borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: "13px", fontWeight: "bold", color: "#F8FAFC", minWidth: 18, textAlign: "center" }}>
                          {booking.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange((booking.quantity || 1) + 1)}
                          style={{ background: "#1E293B", border: "none", color: "#F8FAFC", width: 24, height: 24, borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Clean Bottom Action Row: Calculated Amount + Fully Contained Button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(51,65,85,0.6)",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "2px" }}>
                        {svc.pricingModel === "CUSTOM_QUOTE" ? "Assessment Deposit" : "Calculated Amount"}
                      </span>
                      <strong style={{ fontSize: "1.15rem", color: svc.pricingModel === "CUSTOM_QUOTE" ? "#C084FC" : "#10B981", fontWeight: 800 }}>
                        {svc.pricingModel === "CUSTOM_QUOTE" ? "FREE Quote" : `₦${calc.totalPriceNgn.toLocaleString()}`}
                      </strong>
                    </div>

                    <button
                      onClick={() => selectService(selectedCategory, svc)}
                      className="btn btn-primary btn-sm"
                      style={{
                        background: svc.pricingModel === "CUSTOM_QUOTE" ? "#8B5CF6" : "#0EA5E9",
                        fontWeight: 700,
                        fontSize: "12px",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "none",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                        boxSizing: "border-box",
                      }}
                    >
                      {svc.pricingModel === "CUSTOM_QUOTE" ? "Request Free Inspection ➔" : "Select & Continue ➔"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
