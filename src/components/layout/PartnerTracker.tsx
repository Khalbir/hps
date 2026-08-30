"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function TrackerContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const partnerCode =
      searchParams.get("partner") ||
      searchParams.get("partnerCode") ||
      searchParams.get("ref") ||
      searchParams.get("referral");

    if (partnerCode && partnerCode.trim()) {
      const cleanCode = partnerCode.trim();
      try {
        localStorage.setItem("handyhub_partner_ref", cleanCode);
        sessionStorage.setItem("handyhub_partner_ref", cleanCode);
        document.cookie = `handyhub_partner_ref=${encodeURIComponent(cleanCode)}; path=/; max-age=2592000; SameSite=Lax`;
      } catch (err) {
        console.warn("[Partner Tracking Storage Warning]:", err);
      }
    }
  }, [searchParams]);

  return null;
}

export function PartnerTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerContent />
    </Suspense>
  );
}
