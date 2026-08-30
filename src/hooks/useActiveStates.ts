"use client";

import { useState, useEffect } from "react";
import { NigerianState } from "@/lib/states/types";

// Default fallback active states if network is offline or before API loads
const FALLBACK_ACTIVE_STATES: NigerianState[] = [
  {
    code: "FCT",
    name: "FCT Abuja",
    capital: "Abuja",
    zone: "NORTH_CENTRAL",
    zoneLabel: "North Central",
    isActive: true,
    status: "ACTIVE",
    coverageSummary: "Central AMAC, Bwari, Gwagwalada, Kuje",
    lgas: ["Abuja Municipal (AMAC)", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Abaji"],
    coordinates: { lat: 9.0765, lng: 7.4723 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    code: "LAGOS",
    name: "Lagos State",
    capital: "Ikeja",
    zone: "SOUTH_WEST",
    zoneLabel: "South West",
    isActive: true,
    status: "ACTIVE",
    coverageSummary: "Lekki, VI, Ikoyi, Ikeja, Magodo, Surulere",
    lgas: ["Ikeja", "Eti-Osa", "Lagos Island", "Lagos Mainland", "Surulere", "Alimosho", "Ikorodu"],
    coordinates: { lat: 6.5244, lng: 3.3792 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    code: "RIVERS",
    name: "Rivers State",
    capital: "Port Harcourt",
    zone: "SOUTH_SOUTH",
    zoneLabel: "South South",
    isActive: true,
    status: "ACTIVE",
    coverageSummary: "Port Harcourt City, Obio-Akpor",
    lgas: ["Port Harcourt", "Obio/Akpor", "Eleme", "Ikwerre"],
    coordinates: { lat: 4.8156, lng: 7.0498 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    code: "OYO",
    name: "Oyo State",
    capital: "Ibadan",
    zone: "SOUTH_WEST",
    zoneLabel: "South West",
    isActive: true,
    status: "ACTIVE",
    coverageSummary: "Ibadan North, Bodija, Dugbe",
    lgas: ["Ibadan North", "Ibadan North-West", "Ibadan South-West", "Oluyole"],
    coordinates: { lat: 7.3775, lng: 3.9470 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    code: "KANO",
    name: "Kano State",
    capital: "Kano",
    zone: "NORTH_WEST",
    zoneLabel: "North West",
    isActive: true,
    status: "ACTIVE",
    coverageSummary: "Kano Municipal, Nassarawa, Fagge",
    lgas: ["Kano Municipal", "Fagge", "Dala", "Gwale", "Tarauni", "Nasarawa"],
    coordinates: { lat: 12.0022, lng: 8.5920 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 0,
    updatedAt: new Date().toISOString(),
  },
];

export function useActiveStates() {
  const [states, setStates] = useState<NigerianState[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("handyhub_active_states");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return FALLBACK_ACTIVE_STATES;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadActiveStates() {
      try {
        setLoading(true);
        const res = await fetch("/api/states", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.states) && data.states.length > 0) {
          setStates(data.states);
          localStorage.setItem("handyhub_active_states", JSON.stringify(data.states));
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load states");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadActiveStates();
    return () => {
      isMounted = false;
    };
  }, []);

  const isStateActive = (stateNameOrCode: string) => {
    if (!stateNameOrCode) return false;
    const clean = stateNameOrCode.trim().toLowerCase();
    return states.some(
      (s) =>
        s.code.toLowerCase() === clean ||
        s.name.toLowerCase() === clean ||
        s.name.toLowerCase().includes(clean) ||
        clean.includes(s.name.toLowerCase())
    );
  };

  return {
    activeStates: states,
    activeStateNames: states.map((s) => s.name),
    loading,
    error,
    isStateActive,
  };
}
