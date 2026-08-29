"use client";

import {
  Sparkles, Droplets, Zap, Paintbrush, Wind, Camera, Sun,
  Hammer, Home, TreePine, Shirt, Truck, Settings, Search,
  Building2, CheckCircle2, ShieldCheck, HelpCircle, Layers, Sliders
} from "lucide-react";
import { useState, useEffect } from "react";
import type { BookingData } from "@/app/book/page";
import { SERVICE_CATEGORIES, ServiceCategory, ServiceItem } from "@/lib/services";
import { calculateJobPrice, DEFAULT_PRICING_RULES, PricingModel, getEffectiveServiceItem, ServicePlanTier, SERVICE_PLANS } from "@/lib/pricingEngine";
import styles from "./Steps.module.css";

interface StepProps {
  booking: BookingData;
  updateBooking: (u: Partial<BookingData>) => void;
  onNext: () => void;
}

export function StepService({ booking, updateBooking, onNext }: StepProps) {
  const [selectedCategory, setSelectedCategory] = useState(booking.serviceCategory || "");
  const [searchQuery, setSearchQuery] = useState(booking.initialQuery || "");
  const [selectedPlanTier, setSelectedPlanTier] = useState<ServicePlanTier>((booking.planTier as ServicePlanTier) || "SILVER");
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

  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});

  const getServiceQuantity = (serviceId: string) => {
    if (serviceQuantities[serviceId] !== undefined) {
      return serviceQuantities[serviceId];
    }
    if (booking.serviceId === serviceId && booking.quantity) {
      return booking.quantity;
    }
    return 1;
  };

  const activateServiceCard = (rawSvc: any, customQty?: number, overridePlanTier?: ServicePlanTier) => {
    const svc = getEffectiveServiceItem(rawSvc, pricingRules);
    const pModel = (svc.pricingModel as PricingModel) || "FIXED";
    const svcQty = customQty !== undefined ? customQty : getServiceQuantity(svc.id);
    const planToUse = overridePlanTier || selectedPlanTier || (booking.planTier as ServicePlanTier) || "SILVER";
    const isProp = pModel === "PROPERTY_BASED";
    const calc = calculateJobPrice(
      {
        serviceId: svc.id,
        pricingModel: pModel,
        basePrice: svc.price,
        plan: planToUse,
        bedrooms: isProp ? (booking.bedrooms || 2) : 1,
        bathrooms: isProp ? (booking.bathrooms || 1) : 1,
        isFurnished: isProp ? Boolean(booking.isFurnished) : false,
        dirtLevel: isProp ? (booking.dirtLevel || "MODERATE") : "LIGHT",
        quantity: svcQty,
        regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
        isExpressSchedule: booking.isEmergency || false,
      },
      pricingRules
    );

    updateBooking({
      serviceCategory: selectedCategory,
      serviceId: svc.id,
      serviceName: svc.name,
      servicePrice: svc.price,
      pricingModel: pModel,
      planTier: planToUse,
      quantity: svcQty,
      totalPrice: calc.totalPriceNgn,
    });
  };

  const handlePlanTierChange = (tier: ServicePlanTier, rawSvc: any) => {
    setSelectedPlanTier(tier);
    activateServiceCard(rawSvc, undefined, tier);
  };

  const handleServiceQuantityChange = (serviceId: string, qty: number) => {
    const safeQty = Math.max(1, qty);
    setServiceQuantities((prev) => ({
      ...prev,
      [serviceId]: safeQty,
    }));
    const rawSvc = activeCategory?.services.find((s) => s.id === serviceId);
    if (rawSvc) {
      activateServiceCard(rawSvc, safeQty);
    }
  };

  // Auto-synchronize booking total price with effective card price on Step 1
  useEffect(() => {
    if (!selectedCategory || !activeCategory) return;
    const rawSvc = activeCategory.services.find((s) => s.id === booking.serviceId);
    if (rawSvc) {
      const svc = getEffectiveServiceItem(rawSvc, pricingRules);
      const pModel = (svc.pricingModel as PricingModel) || "FIXED";
      const svcQty = getServiceQuantity(svc.id);
      const isProp = pModel === "PROPERTY_BASED";
      const calc = calculateJobPrice(
        {
          serviceId: svc.id,
          pricingModel: pModel,
          basePrice: svc.price,
          plan: selectedPlanTier || (booking.planTier as ServicePlanTier) || "SILVER",
          bedrooms: isProp ? (booking.bedrooms || 2) : 1,
          bathrooms: isProp ? (booking.bathrooms || 1) : 1,
          isFurnished: isProp ? Boolean(booking.isFurnished) : false,
          dirtLevel: isProp ? (booking.dirtLevel || "MODERATE") : "LIGHT",
          quantity: svcQty,
          regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
          isExpressSchedule: booking.isEmergency || false,
        },
        pricingRules
      );
      if (booking.totalPrice !== calc.totalPriceNgn || booking.servicePrice !== svc.price || booking.quantity !== svcQty || booking.planTier !== selectedPlanTier) {
        updateBooking({
          servicePrice: svc.price,
          pricingModel: pModel,
          planTier: selectedPlanTier,
          quantity: svcQty,
          totalPrice: calc.totalPriceNgn,
        });
      }
    }
  }, [
    selectedCategory,
    activeCategory,
    booking.serviceId,
    pricingRules,
    booking.bedrooms,
    booking.bathrooms,
    booking.isFurnished,
    booking.dirtLevel,
    serviceQuantities,
    selectedPlanTier,
  ]);

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

  const selectService = (catId: string, rawSvc: any) => {
    const svc = getEffectiveServiceItem(rawSvc, pricingRules);
    const pModel = (svc.pricingModel as PricingModel) || "FIXED";
    const svcQty = getServiceQuantity(svc.id);
    const planToUse = pModel === "SUBSCRIPTION" ? selectedPlanTier : (booking.planTier as ServicePlanTier) || "SILVER";
    const isProp = pModel === "PROPERTY_BASED";
    const calc = calculateJobPrice(
      {
        serviceId: svc.id,
        pricingModel: pModel,
        basePrice: svc.price,
        plan: planToUse,
        bedrooms: isProp ? (booking.bedrooms || 2) : 1,
        bathrooms: isProp ? (booking.bathrooms || 1) : 1,
        isFurnished: isProp ? Boolean(booking.isFurnished) : false,
        dirtLevel: isProp ? (booking.dirtLevel || "MODERATE") : "LIGHT",
        quantity: svcQty,
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
      planTier: planToUse,
      quantity: svcQty,
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

          {/* Property-Based Controls for Cleaning, Painting & Fumigation */}
          {(selectedCategory === "cleaning" || selectedCategory === "painting" || selectedCategory === "fumigation") && (
            <div className={styles.configCard} style={{ background: "#1E293B", border: "1px solid #334155", padding: "20px", borderRadius: "16px", marginBottom: "24px" }}>
              <div className={styles.configHeader} style={{ marginBottom: "16px" }}>
                <h4 className={styles.configTitle} style={{ margin: 0, color: "#F8FAFC", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Building2 size={18} color="#0EA5E9" /> {selectedCategory === "fumigation" ? "Property Size & Infestation Level Configuration" : "Property Size & Condition Configuration"}
                </h4>
                <p className={styles.configSubtitle} style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "13px" }}>
                  {selectedCategory === "fumigation"
                    ? "Customize bedrooms, bathrooms, and pest infestation severity for instant upfront fumigation pricing."
                    : "Customize rooms, furnished fitting, and grime level for instant upfront pricing."}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
                {/* Bedrooms Counter */}
                <div style={{ background: "#0F172A", padding: "12px 14px", borderRadius: "12px", border: "1px solid #334155", minWidth: 0, boxSizing: "border-box" }}>
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block" }}>
                    {selectedCategory === "fumigation" ? "Bedrooms / Main Rooms" : "Bedrooms"}
                  </span>
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
                <div style={{ background: "#0F172A", padding: "12px 14px", borderRadius: "12px", border: "1px solid #334155", minWidth: 0, boxSizing: "border-box" }}>
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block" }}>
                    {selectedCategory === "fumigation" ? "Bathrooms / Wet Areas" : "Bathrooms"}
                  </span>
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
                <div style={{ background: "#0F172A", padding: "12px 14px", borderRadius: "12px", border: "1px solid #334155", minWidth: 0, boxSizing: "border-box" }}>
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block" }}>
                    {selectedCategory === "fumigation" ? "Premises Status" : "Furnished Status"}
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleFurnishedToggle(false)}
                      style={{
                        padding: "6px 4px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        border: !booking.isFurnished ? "1px solid #0EA5E9" : "1px solid #334155",
                        background: !booking.isFurnished ? "rgba(14,165,233,0.15)" : "#1E293B",
                        color: !booking.isFurnished ? "#38BDF8" : "#94A3B8",
                        cursor: "pointer",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        boxSizing: "border-box",
                      }}
                    >
                      {selectedCategory === "fumigation" ? "Vacant/Empty" : "Unfurnished"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFurnishedToggle(true)}
                      style={{
                        padding: "6px 4px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        border: booking.isFurnished ? "1px solid #0EA5E9" : "1px solid #334155",
                        background: booking.isFurnished ? "rgba(14,165,233,0.15)" : "#1E293B",
                        color: booking.isFurnished ? "#38BDF8" : "#94A3B8",
                        cursor: "pointer",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        boxSizing: "border-box",
                      }}
                    >
                      Furnished (+₦5k)
                    </button>
                  </div>
                </div>

                {/* Dirt / Infestation Level Selector */}
                <div style={{ background: "#0F172A", padding: "12px 14px", borderRadius: "12px", border: "1px solid #334155", minWidth: 0, boxSizing: "border-box" }}>
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600, display: "block" }}>
                    {selectedCategory === "fumigation" ? "Infestation Severity" : "Condition / Grime"}
                  </span>
                  <select
                    value={booking.dirtLevel || "MODERATE"}
                    onChange={(e: any) => handleDirtLevelChange(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      background: "#1E293B",
                      border: "1px solid #334155",
                      color: "#F8FAFC",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="LIGHT">{selectedCategory === "fumigation" ? "Light Infestation (1.0x)" : "Light (1.0x)"}</option>
                    <option value="MODERATE">{selectedCategory === "fumigation" ? "Moderate Infestation (1.15x)" : "Moderate (1.15x)"}</option>
                    <option value="HEAVY">{selectedCategory === "fumigation" ? "Severe / Heavy Infestation (1.35x)" : "Heavy / Post (1.35x)"}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className={styles.serviceList}>
            {activeCategory?.services.map((rawSvc: any) => {
              const svc = getEffectiveServiceItem(rawSvc, pricingRules);
              const pModel = (svc.pricingModel as PricingModel) || "FIXED";
              const svcQty = getServiceQuantity(svc.id);
              const planForCalc = pModel === "SUBSCRIPTION" ? selectedPlanTier : (booking.planTier as ServicePlanTier) || "SILVER";
              const isProp = pModel === "PROPERTY_BASED";
              const calc = calculateJobPrice(
                {
                  serviceId: svc.id,
                  pricingModel: pModel,
                  basePrice: svc.price,
                  plan: planForCalc,
                  bedrooms: isProp ? (booking.bedrooms || 2) : 1,
                  bathrooms: isProp ? (booking.bathrooms || 1) : 1,
                  isFurnished: isProp ? Boolean(booking.isFurnished) : false,
                  dirtLevel: isProp ? (booking.dirtLevel || "MODERATE") : "LIGHT",
                  quantity: svcQty,
                  regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
                  isExpressSchedule: booking.isEmergency || false,
                },
                pricingRules
              );

              const isSelected = booking.serviceId === svc.id;

              return (
                <div
                  key={svc.id}
                  onClick={() => {
                    if (!isSelected) {
                      activateServiceCard(rawSvc);
                    }
                  }}
                  style={{
                    background: "#1E293B",
                    border: isSelected ? "2px solid #0EA5E9" : "1px solid #334155",
                    borderRadius: "16px",
                    padding: "18px 20px",
                    marginBottom: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    width: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    boxShadow: isSelected ? "0 0 20px rgba(14,165,233,0.25)" : "none",
                    transition: "border 0.2s ease, box-shadow 0.2s ease",
                    cursor: isSelected ? "default" : "pointer",
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
                                : svc.pricingModel === "SUBSCRIPTION"
                                ? "#34D399"
                                : "#10B981",
                          }}
                        >
                          {svc.pricingModel === "PROPERTY_BASED"
                            ? "PROPERTY SIZED"
                            : svc.pricingModel === "QUANTITY_BASED"
                            ? `UNIT (${svc.unitLabel || "per item"})`
                            : svc.pricingModel === "CUSTOM_QUOTE"
                            ? "FREE INSPECTION & QUOTE"
                            : svc.pricingModel === "SUBSCRIPTION"
                            ? svc.unitLabel ? `MONTHLY PLAN (${svc.unitLabel.toUpperCase()})` : "MONTHLY SUBSCRIPTION PLAN"
                            : "FIXED RATE"}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#94A3B8", lineHeight: 1.4 }}>{svc.desc}</p>
                    </div>

                    {/* Quantity Counter for Quantity-Based Model */}
                    {svc.pricingModel === "QUANTITY_BASED" && (
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0F172A", padding: "4px 10px", borderRadius: "8px", border: "1px solid #334155" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>Qty:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleServiceQuantityChange(svc.id, svcQty - 1);
                          }}
                          style={{ background: "#1E293B", border: "none", color: "#F8FAFC", width: 24, height: 24, borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
                          disabled={svcQty <= 1}
                        >
                          -
                        </button>
                        <span style={{ fontSize: "13px", fontWeight: "bold", color: "#F8FAFC", minWidth: 18, textAlign: "center" }}>
                          {svcQty}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleServiceQuantityChange(svc.id, svcQty + 1);
                          }}
                          style={{ background: "#1E293B", border: "none", color: "#F8FAFC", width: 24, height: 24, borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Plan Tier Selector for Subscription Services */}
                  {pModel === "SUBSCRIPTION" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        paddingTop: "12px",
                        borderTop: "1px solid rgba(51,65,85,0.6)",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>Choose Your Plan</span>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
                        {(["SILVER", "GOLD", "PLATINUM"] as ServicePlanTier[]).map((tier) => {
                          const plan = SERVICE_PLANS[tier];
                          const tierCalc = calculateJobPrice(
                            {
                              serviceId: svc.id,
                              pricingModel: pModel,
                              basePrice: svc.price,
                              plan: tier,
                              bedrooms: booking.bedrooms || 2,
                              bathrooms: booking.bathrooms || 1,
                              isFurnished: booking.isFurnished || false,
                              dirtLevel: booking.dirtLevel || "MODERATE",
                              quantity: svcQty,
                              regionalZoneId: booking.regionalZoneId || "abuja-suburbs",
                              isExpressSchedule: booking.isEmergency || false,
                            },
                            pricingRules
                          );
                          const isActiveTier = (isSelected && selectedPlanTier === tier);
                          const tierColors: Record<ServicePlanTier, { border: string; bg: string; text: string; badge: string }> = {
                            SILVER: { border: "#94A3B8", bg: "rgba(148,163,184,0.1)", text: "#CBD5E1", badge: "🥈" },
                            GOLD: { border: "#F59E0B", bg: "rgba(245,158,11,0.1)", text: "#FCD34D", badge: "🥇" },
                            PLATINUM: { border: "#8B5CF6", bg: "rgba(139,92,246,0.1)", text: "#C4B5FD", badge: "💎" },
                          };
                          const tc = tierColors[tier];
                          return (
                            <button
                              key={tier}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlanTierChange(tier, rawSvc);
                              }}
                              style={{
                                background: isActiveTier ? tc.bg : "#0F172A",
                                border: isActiveTier ? `2px solid ${tc.border}` : "1px solid #334155",
                                borderRadius: "12px",
                                padding: "14px 12px",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                textAlign: "left",
                                transition: "all 0.2s ease",
                                boxShadow: isActiveTier ? `0 0 16px ${tc.border}33` : "none",
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              {isActiveTier && (
                                <div style={{
                                  position: "absolute",
                                  top: "6px",
                                  right: "6px",
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "50%",
                                  background: tc.border,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "10px",
                                  color: "#fff",
                                  fontWeight: 800,
                                }}>✓</div>
                              )}
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "16px" }}>{tc.badge}</span>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: isActiveTier ? tc.text : "#E2E8F0" }}>
                                  {tier === "SILVER" ? "Silver" : tier === "GOLD" ? "Gold" : "Platinum"}
                                </span>
                              </div>
                              <span style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.3 }}>
                                {plan.cleaningsPerWeek} days/wk · {plan.cleaningsPerMonth} visits/mo
                              </span>
                              <div style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.4, display: "flex", flexDirection: "column", gap: "2px" }}>
                                {plan.features.slice(0, 2).map((f, fi) => (
                                  <span key={fi} style={{ display: "flex", alignItems: "flex-start", gap: "4px" }}>
                                    <span style={{ color: tc.border, flexShrink: 0 }}>✦</span>
                                    <span style={{ fontSize: "10px" }}>{f}</span>
                                  </span>
                                ))}
                              </div>
                              <div style={{ marginTop: "4px", borderTop: "1px solid rgba(51,65,85,0.5)", paddingTop: "8px" }}>
                                <strong style={{ fontSize: "1rem", color: isActiveTier ? "#10B981" : "#94A3B8", fontWeight: 800 }}>
                                  ₦{tierCalc.totalPriceNgn.toLocaleString()}
                                </strong>
                                <span style={{ fontSize: "11px", color: "#64748B" }}>/mo</span>
                                {tier !== "SILVER" && (
                                  <span style={{ fontSize: "10px", color: tc.border, display: "block", marginTop: "2px", fontWeight: 600 }}>
                                    +{Math.round((plan.multiplier - 1) * 100)}% from base
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Clean Bottom Action Row: Calculated Amount + Fully Contained Button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                      paddingTop: "12px",
                      borderTop: pModel === "SUBSCRIPTION" ? "none" : "1px solid rgba(51,65,85,0.6)",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "2px" }}>
                        {svc.pricingModel === "CUSTOM_QUOTE"
                          ? "Assessment Deposit"
                          : svc.pricingModel === "SUBSCRIPTION"
                          ? `${SERVICE_PLANS[selectedPlanTier]?.name || "Monthly"} Plan`
                          : "Calculated Amount"}
                      </span>
                      <strong style={{ fontSize: "1.15rem", color: svc.pricingModel === "CUSTOM_QUOTE" ? "#C084FC" : "#10B981", fontWeight: 800 }}>
                        {svc.pricingModel === "CUSTOM_QUOTE"
                          ? "FREE Quote"
                          : svc.pricingModel === "SUBSCRIPTION"
                          ? `₦${calc.totalPriceNgn.toLocaleString()}/mo`
                          : `₦${calc.totalPriceNgn.toLocaleString()}`}
                      </strong>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectService(selectedCategory, svc);
                      }}
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
                      {svc.pricingModel === "CUSTOM_QUOTE" ? "Request for Inspection ➔" : "Select & Continue ➔"}
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
