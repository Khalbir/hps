/**
 * Security, Anti-Bypass Contact Masking, Fraud Prevention, and RBAC Engine
 * For HandyHub Pro Solutions
 */

// Regex Patterns for Nigerian Phone Numbers & Communications
const NIGERIAN_PHONE_REGEX =
  /(?:(?:\+?234\s*(?:\(0\))?|0)?\s*[789][01]\d(?:\s*\d){7})|(?:\b0[789][01]\d{8}\b)/g;

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const OFF_PLATFORM_KEYWORDS_REGEX =
  /\b(?:whatsapp|telegram|call me on|pay cash|pay direct|send money to|account number|gtb|access bank|zenith|kuda|opay|palmpay)\b/gi;

export interface SanitizationResult {
  originalText: string;
  sanitizedText: string;
  hasBypassAttempt: boolean;
  detectedPhoneNumbers: string[];
  detectedEmails: string[];
  detectedKeywords: string[];
}

/**
 * Anti-Bypass Sanitizer: Masks phone numbers, emails, and off-platform keywords
 * until booking payment is confirmed.
 */
export function sanitizeContentForBypass(
  text: string,
  isPaymentConfirmed: boolean = false
): SanitizationResult {
  if (!text) {
    return {
      originalText: "",
      sanitizedText: "",
      hasBypassAttempt: false,
      detectedPhoneNumbers: [],
      detectedEmails: [],
      detectedKeywords: [],
    };
  }

  // If payment is fully confirmed, return unmasked content
  if (isPaymentConfirmed) {
    return {
      originalText: text,
      sanitizedText: text,
      hasBypassAttempt: false,
      detectedPhoneNumbers: [],
      detectedEmails: [],
      detectedKeywords: [],
    };
  }

  const detectedPhones: string[] = [];
  const detectedEmails: string[] = [];
  const detectedKeywords: string[] = [];

  // Match Phones
  const phoneMatches = text.match(NIGERIAN_PHONE_REGEX);
  if (phoneMatches) {
    detectedPhones.push(...phoneMatches);
  }

  // Match Emails
  const emailMatches = text.match(EMAIL_REGEX);
  if (emailMatches) {
    detectedEmails.push(...emailMatches);
  }

  // Match Off-Platform Bypass Keywords
  const keywordMatches = text.match(OFF_PLATFORM_KEYWORDS_REGEX);
  if (keywordMatches) {
    detectedKeywords.push(...keywordMatches);
  }

  let sanitized = text;

  // Mask Phone Numbers
  sanitized = sanitized.replace(
    NIGERIAN_PHONE_REGEX,
    "[PHONE NUMBER MASKED — PAY ON HANDYHUB TO UNLOCK CONTACT]"
  );

  // Mask Emails
  sanitized = sanitized.replace(
    EMAIL_REGEX,
    "[EMAIL MASKED — PAY ON HANDYHUB TO UNLOCK CONTACT]"
  );

  // Mask Off-Platform Payment Keywords
  sanitized = sanitized.replace(
    OFF_PLATFORM_KEYWORDS_REGEX,
    "[OFF-PLATFORM BYPASS WORD BLOCKED]"
  );

  const hasBypass =
    detectedPhones.length > 0 || detectedEmails.length > 0 || detectedKeywords.length > 0;

  return {
    originalText: text,
    sanitizedText: sanitized,
    hasBypassAttempt: hasBypass,
    detectedPhoneNumbers: detectedPhones,
    detectedEmails: detectedEmails,
    detectedKeywords: detectedKeywords,
  };
}

/**
 * Data Sanitizer for Booking API Payloads
 * Automatically masks customer and artisan phone numbers/addresses
 * unless paymentStatus === 'PAID'.
 */
export function sanitizeBookingContacts<T extends Record<string, any>>(
  booking: T
): T {
  const isPaid = booking.paymentStatus === "PAID" || booking.status === "COMPLETED";

  const sanitized: Record<string, any> = { ...booking };

  if (!isPaid) {
    if (sanitized.phone) {
      sanitized.phone = "[LOCKED UNTIL PAYMENT]";
    }
    if (sanitized.customerPhone) {
      sanitized.customerPhone = "[LOCKED UNTIL PAYMENT]";
    }
    if (sanitized.proPhone) {
      sanitized.proPhone = "[LOCKED UNTIL PAYMENT]";
    }
    if (sanitized.exactStreetAddress) {
      sanitized.exactStreetAddress = "[STREET ADDRESS MASKED UNTIL PAYMENT CONFIRMED]";
    }
  }

  return sanitized as T;
}

export interface FraudEvaluation {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number; // 0 - 100
  reasons: string[];
  blockAction: boolean;
}

/**
 * Fraud Detection & Circumvention Risk Evaluator
 */
export function evaluateFraudRiskScore(activity: {
  bypassCount?: number;
  failedPaymentRetries?: number;
  rapidWithdrawalAttempts?: number;
  isAccountVerified?: boolean;
}): FraudEvaluation {
  let score = 0;
  const reasons: string[] = [];

  // Circumvention bypass attempts
  if (activity.bypassCount && activity.bypassCount > 0) {
    const pts = Math.min(60, activity.bypassCount * 30);
    score += pts;
    reasons.push(`Detected ${activity.bypassCount} off-platform phone number leak attempts.`);
  }

  // Failed payment retries
  if (activity.failedPaymentRetries && activity.failedPaymentRetries >= 3) {
    score += 25;
    reasons.push(`Suspicious payment pattern: ${activity.failedPaymentRetries} failed cards.`);
  }

  // Rapid withdrawal spam
  if (activity.rapidWithdrawalAttempts && activity.rapidWithdrawalAttempts >= 3) {
    score += 35;
    reasons.push("Rapid withdrawal spam detected within short timeframe.");
  }

  // Unverified account penalty
  if (activity.isAccountVerified === false) {
    score += 15;
    reasons.push("Account unverified.");
  }

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (score >= 75) riskLevel = "CRITICAL";
  else if (score >= 50) riskLevel = "HIGH";
  else if (score >= 25) riskLevel = "MEDIUM";

  return {
    riskLevel,
    riskScore: Math.min(100, score),
    reasons,
    blockAction: score >= 75,
  };
}

/**
 * JWT Role-Based Access Control Guard
 */
export function checkRolePermission(userRole: string, allowedRoles: string[]): boolean {
  if (!userRole) return false;
  if (allowedRoles.includes("ALL")) return true;
  return allowedRoles.includes(userRole.toUpperCase());
}
