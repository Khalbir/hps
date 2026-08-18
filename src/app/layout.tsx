import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutShell } from "@/components/layout/LayoutShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0EA5E9" },
    { media: "(prefers-color-scheme: dark)", color: "#090D16" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://handyhubpro.ng"),
  title: "HandyHub Pro Solutions — Your Property, Our Priority",
  description:
    "Book verified cleaners, plumbers, electricians & more in Abuja, Nigeria. Transparent pricing, insured professionals, and 100% satisfaction guaranteed. The #1 home services platform.",
  keywords: [
    "home services",
    "cleaning services Abuja",
    "plumber Abuja",
    "electrician Abuja",
    "handyman Nigeria",
    "property maintenance",
    "professional cleaning",
    "home repair",
    "facility management",
  ],
  openGraph: {
    title: "HandyHub Pro Solutions — Your Property, Our Priority",
    description:
      "Book verified home service professionals in Abuja. Transparent pricing, insured pros, guaranteed satisfaction.",
    url: "https://handyhubpro.ng",
    siteName: "HandyHub Pro Solutions",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HandyHub Pro Solutions",
    description:
      "Book verified home service professionals in Abuja. Transparent pricing, insured pros, guaranteed satisfaction.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LayoutShell>{children}</LayoutShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
