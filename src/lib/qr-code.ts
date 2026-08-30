/**
 * HandyHub Pro Solutions — Enterprise QR Code Engine & Branded Flyer Generator
 * Generates ISO/IEC 18004 compliant scannable QR codes with crisp vector matrices
 * and high-resolution downloadable marketing badge assets for all mobile & desktop browsers.
 */

import QRCode from "qrcode";

export interface QrCodeOptions {
  label?: string;
  subLabel?: string;
  partnerId?: string;
  referralCode?: string;
  colorDark?: string;
  colorLight?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

/**
 * Synchronously generates a 100% compliant, fully scannable SVG Data URI
 * with embedded real QR bitmatrix modules and branded HandyHub header/footer.
 */
export function generateScannableQrSvg(
  deepLink: string,
  options: QrCodeOptions = {}
): string {
  const {
    label = "HANDYHUB PARTNER",
    subLabel = "SCAN TO VISIT HANDYHUB PRO",
    partnerId = "",
    referralCode = "",
    colorDark = "#0F172A",
    colorLight = "#FFFFFF",
    errorCorrectionLevel = "M",
  } = options;

  const targetLink = (deepLink || "https://handyhubpro.ng")
    .replace(/\/book\?partner=/g, "/?partner=")
    .replace(/\/book\?/g, "/?");

  // Generate ISO-compliant QR BitMatrix
  const qr = QRCode.create(targetLink, {
    errorCorrectionLevel,
  });

  const matrixSize = qr.modules.size;
  const margin = 4; // ISO quiet zone
  const totalCells = matrixSize + margin * 2;
  const cellSize = 6;
  const qrPixelWidth = totalCells * cellSize;

  // Canvas dimensions
  const cardWidth = 320;
  const cardPadding = 18;
  const qrOffsetTop = 20;
  const qrOffsetLeft = (cardWidth - qrPixelWidth) / 2;
  const footerHeight = 110;
  const cardHeight = qrOffsetTop + qrPixelWidth + footerHeight;

  // Build SVG path for real QR modules
  let pathD = "";
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      const isDark = qr.modules.get(r, c);
      if (isDark) {
        const x = qrOffsetLeft + (c + margin) * cellSize;
        const y = qrOffsetTop + (r + margin) * cellSize;
        pathD += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  const cleanLabel = (label || "HANDYHUB PARTNER").toUpperCase().slice(0, 30);
  const cleanSub = subLabel.toUpperCase();
  const cleanPartnerId = partnerId ? partnerId.toUpperCase() : "";
  const cleanRef = referralCode ? referralCode.toUpperCase() : "";

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cardWidth} ${cardHeight}" width="${cardWidth}" height="${cardHeight}">
  <defs>
    <linearGradient id="hhGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00A8B5"/>
      <stop offset="100%" stop-color="#0EA5E9"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Outer Card Background -->
  <rect width="${cardWidth}" height="${cardHeight}" rx="18" fill="#0F172A" stroke="#00A8B5" stroke-width="2"/>

  <!-- QR Quiet Zone Container (Pure White for 100% instant optical scan readability) -->
  <rect x="${qrOffsetLeft}" y="${qrOffsetTop}" width="${qrPixelWidth}" height="${qrPixelWidth}" rx="12" fill="${colorLight}" filter="url(#cardShadow)"/>

  <!-- Compliant QR Data Modules -->
  <path d="${pathD}" fill="${colorDark}"/>

  <!-- Center Logo Dot Indicator -->
  <rect x="${qrOffsetLeft + qrPixelWidth / 2 - 12}" y="${qrOffsetTop + qrPixelWidth / 2 - 12}" width="24" height="24" rx="6" fill="#0F172A" stroke="#00A8B5" stroke-width="2"/>
  <circle cx="${qrOffsetLeft + qrPixelWidth / 2}" cy="${qrOffsetTop + qrPixelWidth / 2}" r="5" fill="#FF7A1A"/>

  <!-- Bottom Details & Attribution Section -->
  <g transform="translate(0, ${qrOffsetTop + qrPixelWidth + 14})">
    <rect x="${cardPadding}" y="0" width="${cardWidth - cardPadding * 2}" height="84" rx="10" fill="#1E293B" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    
    <text x="${cardWidth / 2}" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#38BDF8" text-anchor="middle" letter-spacing="1">
      ${cleanSub}
    </text>

    <text x="${cardWidth / 2}" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#F59E0B" text-anchor="middle" letter-spacing="0.5">
      ${cleanLabel}
    </text>

    ${
      cleanRef || cleanPartnerId
        ? `<text x="${cardWidth / 2}" y="56" font-family="monospace, sans-serif" font-size="11" font-weight="700" fill="#E2E8F0" text-anchor="middle">
      ${cleanPartnerId ? `ID: ${cleanPartnerId}` : ""} ${cleanPartnerId && cleanRef ? "•" : ""} ${cleanRef ? `CODE: ${cleanRef}` : ""}
    </text>`
        : `<text x="${cardWidth / 2}" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">
      HANDYHUB PRO SOLUTIONS
    </text>`
    }

    <text x="${cardWidth / 2}" y="73" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="#64748B" text-anchor="middle">
      Verified Artisans • 24/7 Security Dispatch
    </text>
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

/**
 * Generates an ultra-crisp, base64 PNG data URL of the QR code using the qrcode library
 */
export async function generateScannableQrPng(
  deepLink: string,
  options: QRCode.QRCodeToDataURLOptions = {}
): Promise<string> {
  const targetLink = (deepLink || "https://handyhubpro.ng")
    .replace(/\/book\?partner=/g, "/?partner=")
    .replace(/\/book\?/g, "/?");

  return QRCode.toDataURL(targetLink, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 600,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
    ...options,
  });
}

/**
 * Universal Client-Side High-Res PNG Download Function.
 * Renders a crisp 1200x1500px marketing badge directly to an off-screen HTML5 canvas
 * and downloads it as a universal `.png` image that works flawlessly across all mobile & desktop OS.
 */
export async function downloadBrandedQrBadge(params: {
  deepLink: string;
  partnerId?: string;
  referralCode?: string;
  title?: string;
  subtitle?: string;
  filename?: string;
}): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const {
    deepLink,
    partnerId = "",
    referralCode = "",
    title = "HANDYHUB PARTNER",
    subtitle = "SCAN TO VISIT HANDYHUB PRO",
    filename,
  } = params;

  const targetLink = (deepLink || "https://handyhubpro.ng")
    .replace(/\/book\?partner=/g, "/?partner=")
    .replace(/\/book\?/g, "/?");

  const outFilename =
    filename ||
    `HandyHub_QR_${(partnerId || referralCode || "Code").replace(/[^a-zA-Z0-9_-]/g, "")}.png`;

  try {
    // 1. Generate high-res raw QR matrix data URL
    const rawQrDataUrl = await QRCode.toDataURL(targetLink, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 760,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });

    // 2. Load into HTML Image
    const qrImg = new Image();
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = (e) => reject(e);
      qrImg.src = rawQrDataUrl;
    });

    // 3. Create High-Resolution Offscreen Canvas (1000 x 1320 px)
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1320;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not initialize 2D context");

    // Draw Dark Gradient Backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 1000, 1320);
    bgGrad.addColorStop(0, "#0B132B");
    bgGrad.addColorStop(1, "#0F172A");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1000, 1320);

    // Outer Turquoise Accent Border
    ctx.strokeStyle = "#00A8B5";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(24, 24, 952, 1272, 36);
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = "#00A8B5";
    ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "2px";
    ctx.fillText("HANDYHUB PRO SOLUTIONS", 500, 80);

    ctx.fillStyle = "#38BDF8";
    ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(subtitle.toUpperCase(), 500, 130);

    // QR Code Container Box (White with Shadow)
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(120, 160, 760, 760, 28);
    ctx.fill();
    ctx.restore();

    // Draw QR Matrix
    ctx.drawImage(qrImg, 120, 160, 760, 760);

    // Center Logo Badge on QR Code
    ctx.save();
    ctx.fillStyle = "#0F172A";
    ctx.strokeStyle = "#00A8B5";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(435, 475, 130, 130, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#00A8B5";
    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("HHP", 500, 540);
    ctx.restore();

    // Bottom Info Card Container
    ctx.fillStyle = "#1E293B";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(120, 950, 760, 290, 24);
    ctx.fill();
    ctx.stroke();

    // Title / Partner Name
    ctx.fillStyle = "#F59E0B";
    ctx.font = "bold 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(title.toUpperCase().slice(0, 32), 500, 980);

    // Partner ID & Referral Code Badges
    if (partnerId || referralCode) {
      const badgeY = 1045;
      
      if (partnerId && referralCode) {
        // Partner ID Pill (Left)
        ctx.fillStyle = "#0F172A";
        ctx.beginPath();
        ctx.roundRect(150, badgeY, 330, 70, 14);
        ctx.fill();
        ctx.fillStyle = "#64748B";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("PARTNER ID", 315, badgeY + 14);
        ctx.fillStyle = "#38BDF8";
        ctx.font = "bold 24px monospace";
        ctx.fillText(partnerId, 315, badgeY + 40);

        // Referral Code Pill (Right)
        ctx.fillStyle = "#0F172A";
        ctx.beginPath();
        ctx.roundRect(520, badgeY, 330, 70, 14);
        ctx.fill();
        ctx.fillStyle = "#64748B";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("REFERRAL CODE", 685, badgeY + 14);
        ctx.fillStyle = "#10B981";
        ctx.font = "bold 24px monospace";
        ctx.fillText(referralCode, 685, badgeY + 40);
      } else {
        // Single Center Pill
        const codeText = partnerId || referralCode;
        ctx.fillStyle = "#0F172A";
        ctx.beginPath();
        ctx.roundRect(300, badgeY, 400, 70, 14);
        ctx.fill();
        ctx.fillStyle = "#64748B";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(partnerId ? "PARTNER ID" : "REFERRAL CODE", 500, badgeY + 14);
        ctx.fillStyle = "#38BDF8";
        ctx.font = "bold 26px monospace";
        ctx.fillText(codeText, 500, badgeY + 40);
      }
    }

    // Security & Booking Guarantee Footer
    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scan with device camera to book verified, insured artisans in Abuja & Lagos", 500, 1145);

    ctx.fillStyle = "#00A8B5";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("www.handyhubpro.ng • 24/7 Verified Dispatch Support", 500, 1185);

    // 4. Export Canvas to Blob & Trigger Universal Download
    canvas.toBlob((blob) => {
      if (!blob) {
        // Fallback: direct data URL download
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = outFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = outFilename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 5000);
    }, "image/png");
  } catch (err) {
    console.error("[QR Code Export Error]:", err);
    // Ultimate fallback: open deepLink directly or trigger simple download
    window.open(deepLink, "_blank");
  }
}
