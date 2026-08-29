/**
 * Media Validator & Document Sanitizer for HandyHub Pro Verification Inspection.
 * Ensures compliance officers audit authentic uploaded user documents only.
 * Strictly avoids auto-generating mock certificates or fake documents.
 */

export const encodeSvg = (svg: string): string => {
  const clean = svg.trim();
  if (typeof Buffer !== "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(clean).toString("base64")}`;
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(clean)}`;
};

export interface DocumentMeta {
  name?: string;
  nin?: string;
  state?: string;
  address?: string;
  field?: string;
}

export function getValidMediaUrl(
  url: string | null | undefined,
  _fallbackType?: "id" | "selfie" | "cert" | "portfolio" | "address",
  _meta?: DocumentMeta
): string {
  if (
    !url ||
    url === "#" ||
    url.trim() === "" ||
    url.includes("handyhubpro.ng/docs") ||
    url.includes("handyhub.ng/docs") ||
    url.startsWith("/uploads/placeholder")
  ) {
    // Strictly do not auto-generate mock certificates or fake documents.
    // Return empty string so compliance officer audits real uploaded files only.
    return "";
  }
  // Strip any legacy fake SVG biometric or auto-generated certificate strings
  if (
    url.includes("●%20LIVE%20BIOMETRIC") ||
    url.includes("LIVE BIOMETRIC") ||
    url.includes("CERTIFICATE OF TRADE COMPETENCY") ||
    url.includes("CERTIFICATE%20OF%20TRADE%20COMPETENCY") ||
    url.includes("COUNCIL FOR REGISTERED ARTISANS") ||
    url.includes("COUNCIL%20FOR%20REGISTERED%20ARTISANS")
  ) {
    return "";
  }
  return url;
}

