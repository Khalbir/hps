"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppConciergeWidget } from "@/components/ui/WhatsAppConciergeWidget";

// Routes that should NOT show the main header/footer
const noHeaderFooterRoutes = ["/auth", "/book", "/dashboard", "/admin", "/pro"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = noHeaderFooterRoutes.some((route) => pathname.startsWith(route));

  if (hideShell) {
    return (
      <>
        {children}
        <WhatsAppConciergeWidget />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppConciergeWidget />
    </>
  );
}
