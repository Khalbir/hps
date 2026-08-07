/**
 * High-Resolution SVG Sample Document Data URIs for HandyHub Pro Verification Inspection.
 * Guarantees crisp, error-free document rendering for sample & default artisan dossiers.
 */

const encodeSvg = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export const SAMPLE_NIN_ID_CARD = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <rect width="800" height="500" rx="24" fill="#0F172A" stroke="#0EA5E9" stroke-width="4"/>
  <rect x="20" y="20" width="760" height="460" rx="16" fill="#1E293B" stroke="#334155" stroke-width="2"/>
  
  <!-- Header Banner -->
  <rect x="20" y="20" width="760" height="90" fill="#0284C7" rx="16"/>
  <rect x="20" y="90" width="760" height="20" fill="#0369A1"/>
  <text x="50" y="65" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#FFFFFF" letter-spacing="2">FEDERAL REPUBLIC OF NIGERIA</text>
  <text x="50" y="95" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#E0F2FE" letter-spacing="1">NATIONAL IDENTITY MANAGEMENT SYSTEM • DIGITAL NIN VERIFICATION DOSSIER</text>
  
  <!-- Hologram & Coat of Arms Emblem -->
  <circle cx="720" cy="65" r="30" fill="#F59E0B" opacity="0.8"/>
  <text x="702" y="73" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0F172A">NIN</text>

  <!-- Photo Box -->
  <rect x="50" y="140" width="200" height="240" rx="12" fill="#0F172A" stroke="#0EA5E9" stroke-width="3"/>
  <circle cx="150" cy="220" r="50" fill="#38BDF8" opacity="0.3"/>
  <circle cx="150" cy="200" r="35" fill="#38BDF8"/>
  <path d="M 80 340 Q 150 270 220 340 Z" fill="#38BDF8"/>

  <!-- Official Details -->
  <text x="280" y="170" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#94A3B8">NATIONAL IDENTITY NUMBER (NIN)</text>
  <text x="280" y="200" font-family="monospace" font-size="26" font-weight="bold" fill="#38BDF8" letter-spacing="3">8930 • 2194 • 812</text>
  
  <text x="280" y="245" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#64748B">FULL LEGAL NAME</text>
  <text x="280" y="270" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#F8FAFC">ABUBAKAR TANKO</text>
  
  <text x="280" y="310" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#64748B">GENDER / DOB</text>
  <text x="280" y="330" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#CBD5E1">MALE • 14 AUG 1991</text>
  
  <text x="540" y="310" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#64748B">STATE OF ORIGIN</text>
  <text x="540" y="330" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#CBD5E1">KANO / FCT ABUJA</text>

  <!-- Security Footer & Stamp -->
  <rect x="50" y="405" width="700" height="50" rx="8" fill="#0F172A" stroke="#334155"/>
  <text x="70" y="435" font-family="monospace" font-size="14" fill="#10B981">✓ AUDITED & VERIFIED BY NIMC NIMC DATABASE • HIGH CONFIDENCE SCORE 99.4%</text>
</svg>
`);

export const SAMPLE_SELFIE_IMAGE = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" rx="24" fill="#0F172A" stroke="#10B981" stroke-width="4"/>
  <rect x="20" y="20" width="560" height="560" rx="16" fill="#1E293B"/>

  <!-- Face Bounding Box & Liveness Mesh -->
  <rect x="150" y="100" width="300" height="360" rx="150" fill="none" stroke="#10B981" stroke-width="3" stroke-dasharray="8 4"/>
  
  <!-- Silhouette / Face Avatar -->
  <circle cx="300" cy="230" r="85" fill="#0EA5E9"/>
  <path d="M 160 480 Q 300 340 440 480 Z" fill="#0EA5E9"/>
  
  <!-- Live Camera Overlay Info -->
  <rect x="40" y="40" width="220" height="40" rx="20" fill="rgba(16,185,129,0.2)" stroke="#10B981"/>
  <text x="60" y="65" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#10B981">● LIVE FACIAL BIOMETRIC</text>

  <!-- Verification Result Badge -->
  <rect x="80" y="500" width="440" height="50" rx="10" fill="#0F172A" stroke="#10B981" stroke-width="2"/>
  <text x="130" y="532" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#10B981">✓ Liveness Passed (99.8% Match with Govt ID)</text>
</svg>
`);

export const SAMPLE_TRADE_CERTIFICATE = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" rx="20" fill="#0F172A" stroke="#8B5CF6" stroke-width="4"/>
  <rect x="24" y="24" width="752" height="552" rx="12" fill="#1E293B" stroke="#334155" stroke-width="2"/>
  
  <!-- Certificate Border Lines -->
  <rect x="40" y="40" width="720" height="520" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-dasharray="12 6"/>
  
  <!-- Certificate Header -->
  <text x="400" y="110" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#F8FAFC" text-anchor="middle">CERTIFICATE OF TRADE COMPETENCY</text>
  <text x="400" y="145" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#A78BFA" text-anchor="middle" letter-spacing="2">COUNCIL FOR REGISTERED ARTISANS OF NIGERIA</text>

  <!-- Decorative Crest -->
  <circle cx="400" cy="200" r="35" fill="#8B5CF6" opacity="0.3"/>
  <polygon points="400,175 410,195 430,195 415,208 420,230 400,215 380,230 385,208 370,195 390,195" fill="#F59E0B"/>

  <text x="400" y="270" font-family="Georgia, serif" font-size="16" fill="#CBD5E1" text-anchor="middle">This is to certify that</text>
  <text x="400" y="315" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#38BDF8" text-anchor="middle">ABUBAKAR TANKO</text>
  
  <text x="400" y="360" font-family="Georgia, serif" font-size="16" fill="#CBD5E1" text-anchor="middle">has successfully demonstrated advanced professional competency in</text>
  <text x="400" y="400" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#F8FAFC" text-anchor="middle">ELECTRICAL ENGINEERING & SOLAR POWER INSTALLATIONS</text>

  <!-- Signatures & Seal -->
  <line x1="120" y1="500" x2="300" y2="500" stroke="#64748B" stroke-width="2"/>
  <text x="210" y="525" font-family="Arial, sans-serif" font-size="12" fill="#94A3B8" text-anchor="middle">Registrar of Technical Trades</text>

  <line x1="500" y1="500" x2="680" y2="500" stroke="#64748B" stroke-width="2"/>
  <text x="590" y="525" font-family="Arial, sans-serif" font-size="12" fill="#94A3B8" text-anchor="middle">Chief Technical Auditor</text>
</svg>
`);

export const SAMPLE_PORTFOLIO_IMAGE = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
  <rect width="600" height="450" rx="16" fill="#0F172A" stroke="#0EA5E9" stroke-width="3"/>
  <rect x="16" y="16" width="568" height="418" rx="10" fill="#1E293B"/>

  <!-- Project Blueprint Graphic -->
  <rect x="40" y="40" width="520" height="310" rx="8" fill="#0284C7" opacity="0.9"/>
  <line x1="40" y1="120" x2="560" y2="120" stroke="#E0F2FE" stroke-width="2" stroke-dasharray="6 6"/>
  <line x1="40" y1="200" x2="560" y2="200" stroke="#E0F2FE" stroke-width="2" stroke-dasharray="6 6"/>
  <line x1="200" y1="40" x2="200" y2="350" stroke="#E0F2FE" stroke-width="2" stroke-dasharray="6 6"/>
  <line x1="380" y1="40" x2="380" y2="350" stroke="#E0F2FE" stroke-width="2" stroke-dasharray="6 6"/>
  
  <text x="300" y="180" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF" text-anchor="middle">ARTISAN WORK PORTFOLIO INSPECTION</text>
  <text x="300" y="215" font-family="Arial, sans-serif" font-size="15" fill="#E0F2FE" text-anchor="middle">Verified Completed Job Proof • Industrial Installation</text>

  <!-- Project Tag -->
  <rect x="40" y="370" width="520" height="45" rx="8" fill="#0F172A" stroke="#334155"/>
  <text x="60" y="398" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#10B981">✓ Proof of Work Verified • Maitama Solar & Electrical Commissioning</text>
</svg>
`);

export const SAMPLE_ADDRESS_PROOF = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" rx="20" fill="#0F172A" stroke="#F59E0B" stroke-width="4"/>
  <rect x="24" y="24" width="752" height="552" rx="12" fill="#1E293B" stroke="#334155" stroke-width="2"/>

  <!-- Document Header -->
  <rect x="40" y="40" width="720" height="80" fill="#D97706" rx="8"/>
  <text x="60" y="80" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">PROOF OF RESIDENCE & OPERATIONAL ADDRESS</text>
  <text x="60" y="105" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#FEF3C7">UTILITY BILL / TENANCY AGREEMENT / RESIDENCE CERTIFICATE AUDIT</text>

  <!-- Address Inspection Box -->
  <rect x="40" y="140" width="720" height="280" rx="10" fill="#0F172A" stroke="#334155"/>
  <text x="70" y="180" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#94A3B8">OPERATING STATE IN NIGERIA</text>
  <text x="70" y="210" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#F59E0B">FCT ABUJA (FEDERAL CAPITAL TERRITORY)</text>

  <text x="70" y="255" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#94A3B8">RESIDENTIAL & WORKSHOP STREET ADDRESS</text>
  <text x="70" y="285" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#F8FAFC">Plot 104, Aminu Kano Crescent, Wuse 2, Abuja</text>
  <text x="70" y="310" font-family="Arial, sans-serif" font-size="15" fill="#CBD5E1">Abuja Municipal Area Council (AMAC), FCT Abuja</text>

  <text x="70" y="355" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#94A3B8">DOCUMENT TYPE</text>
  <text x="70" y="380" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#38BDF8">AEDC Electricity Utility Bill & Certified Tenancy Receipt</text>

  <!-- Stamp & Verification Seal -->
  <rect x="40" y="440" width="720" height="100" rx="10" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
  <circle cx="680" cy="490" r="30" fill="#F59E0B" opacity="0.3"/>
  <text x="60" y="480" font-family="monospace" font-size="14" fill="#10B981">✓ ADDRESS VERIFICATION AUDIT PASSED</text>
  <text x="60" y="505" font-family="Arial, sans-serif" font-size="13" fill="#CBD5E1">Verified by Field Auditor & GPS Radius Dispatch Engine</text>
</svg>
`);

export function getValidMediaUrl(url: string | null | undefined, fallbackType: "id" | "selfie" | "cert" | "portfolio" | "address"): string {
  if (!url || url === "#" || url.trim() === "" || url.includes("handyhubpro.ng/docs") || url.includes("handyhub.ng/docs")) {
    if (fallbackType === "id") return SAMPLE_NIN_ID_CARD;
    if (fallbackType === "selfie") return SAMPLE_SELFIE_IMAGE;
    if (fallbackType === "cert") return SAMPLE_TRADE_CERTIFICATE;
    if (fallbackType === "address") return SAMPLE_ADDRESS_PROOF;
    return SAMPLE_PORTFOLIO_IMAGE;
  }
  return url;
}
