"use client";

import { Hero } from "@/components/marketing/Hero";
import { ServiceGrid } from "@/components/marketing/ServiceGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { TrustBuilders } from "@/components/marketing/TrustBuilders";
import { Testimonials } from "@/components/marketing/Testimonials";
import { BeforeAfter } from "@/components/marketing/BeforeAfter";
import { CTASection } from "@/components/marketing/CTASection";
import { Stats } from "@/components/marketing/Stats";

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <ServiceGrid />
      <HowItWorks />
      <TrustBuilders />
      <Testimonials />
      <BeforeAfter />
      <CTASection />
    </>
  );
}
