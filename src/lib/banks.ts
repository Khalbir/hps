/**
 * Nigerian Banks Catalog & Smart Name Matching Engine
 * Used for NUBAN Account Verification, Artisan Payouts, and Anti-Fraud Protection.
 */

export interface NigerianBank {
  name: string;
  code: string;
  slug: string;
}

export const NIGERIAN_BANKS: NigerianBank[] = [
  { name: "Access Bank", code: "044", slug: "access-bank" },
  { name: "Access Bank (Diamond)", code: "063", slug: "access-bank-diamond" },
  { name: "Carbon", code: "565", slug: "carbon" },
  { name: "Citibank Nigeria", code: "023", slug: "citibank-nigeria" },
  { name: "Ecobank Nigeria", code: "050", slug: "ecobank-nigeria" },
  { name: "Fairmoney Microfinance Bank", code: "51318", slug: "fairmoney-mfb" },
  { name: "Fidelity Bank", code: "070", slug: "fidelity-bank" },
  { name: "First Bank of Nigeria", code: "011", slug: "first-bank-of-nigeria" },
  { name: "First City Monument Bank (FCMB)", code: "214", slug: "first-city-monument-bank" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058", slug: "guaranty-trust-bank" },
  { name: "Heritage Bank", code: "030", slug: "heritage-bank" },
  { name: "Jaiz Bank", code: "301", slug: "jaiz-bank" },
  { name: "Keystone Bank", code: "082", slug: "keystone-bank" },
  { name: "Kuda Microfinance Bank", code: "50211", slug: "kuda-bank" },
  { name: "Moniepoint Microfinance Bank", code: "50515", slug: "moniepoint-mfb" },
  { name: "OPay Digital Services (Paycom)", code: "999992", slug: "opay" },
  { name: "PalmPay", code: "999991", slug: "palmpay" },
  { name: "Polaris Bank", code: "076", slug: "polaris-bank" },
  { name: "Providus Bank", code: "101", slug: "providus-bank" },
  { name: "Raven Bank", code: "51329", slug: "raven-bank" },
  { name: "Rubies MFB", code: "125", slug: "rubies-mfb" },
  { name: "Stanbic IBTC Bank", code: "221", slug: "stanbic-ibtc-bank" },
  { name: "Standard Chartered Bank", code: "068", slug: "standard-chartered-bank" },
  { name: "Sterling Bank", code: "232", slug: "sterling-bank" },
  { name: "Suntrust Bank", code: "100", slug: "suntrust-bank" },
  { name: "TAJ Bank", code: "302", slug: "taj-bank" },
  { name: "Titan Trust Bank", code: "102", slug: "titan-trust-bank" },
  { name: "Union Bank of Nigeria", code: "032", slug: "union-bank-of-nigeria" },
  { name: "United Bank for Africa (UBA)", code: "033", slug: "united-bank-for-africa" },
  { name: "Unity Bank", code: "215", slug: "unity-bank" },
  { name: "VFD Microfinance Bank", code: "566", slug: "vfd-mfb" },
  { name: "Wema Bank", code: "035", slug: "wema-bank" },
  { name: "Zenith Bank", code: "057", slug: "zenith-bank" },
];

/**
 * Remove honorific titles and corporate noise from name strings
 */
const TITLES_AND_NOISE = new Set([
  "MR",
  "MRS",
  "MS",
  "MISS",
  "DR",
  "DOCTOR",
  "ENGR",
  "ENGINEER",
  "CHIEF",
  "ALHAJI",
  "ALHAJA",
  "PASTOR",
  "REVEREND",
  "REV",
  "BARR",
  "BARRISTER",
  "PROF",
  "PROFESSOR",
  "OTUNBA",
  "HIGH",
  "SERVICES",
  "LIMITED",
  "LTD",
  "ENTERPRISE",
  "VENTURES",
  "GLOBAL",
  "NIG",
  "NIGERIA",
]);

/**
 * Normalize and tokenize a full name string into distinct lowercase alphabetic words
 */
export function tokenizeName(nameStr: string): string[] {
  if (!nameStr) return [];
  return nameStr
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !TITLES_AND_NOISE.has(w));
}

/**
 * Calculate Jaro-Winkler or token overlap similarity between two name tokens
 */
function tokenSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.includes(b) || b.includes(a)) {
    return Math.min(a.length, b.length) / Math.max(a.length, b.length);
  }
  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, 1 - distance / maxLen);
}

export interface NameMatchResult {
  isValid: boolean;
  matchScore: number; // 0 to 100
  reason: string;
  registeredNameTokens: string[];
  bankNameTokens: string[];
}

/**
 * Smart Name Matcher for Artisan Bank Details Verification.
 * Validates that the name returned by Paystack / Nigerian Bank matches the artisan's registered profile name.
 * Handles token reordering (e.g. "KHALID IBRAHIM" vs "IBRAHIM KHALID"), middle names, initials, and slight spelling variations.
 */
export function validateArtisanNameMatch(
  registeredName: string,
  bankAccountName: string
): NameMatchResult {
  const regTokens = tokenizeName(registeredName);
  const bankTokens = tokenizeName(bankAccountName);

  if (regTokens.length === 0 || bankTokens.length === 0) {
    return {
      isValid: false,
      matchScore: 0,
      reason: "Could not extract valid names for comparison.",
      registeredNameTokens: regTokens,
      bankNameTokens: bankTokens,
    };
  }

  let matchedTokensCount = 0;
  let totalScore = 0;

  for (const rToken of regTokens) {
    let bestTokenMatch = 0;
    for (const bToken of bankTokens) {
      const sim = tokenSimilarity(rToken, bToken);
      if (sim > bestTokenMatch) {
        bestTokenMatch = sim;
      }
    }

    if (bestTokenMatch >= 0.75) {
      matchedTokensCount++;
    }
    totalScore += bestTokenMatch;
  }

  const averageTokenScore = (totalScore / regTokens.length) * 100;
  const matchScore = Math.round(averageTokenScore);

  // Criteria:
  // 1. If registered name has >= 2 tokens, at least 2 tokens must match (or matchScore >= 70%)
  // 2. If registered name has 1 token, at least 1 token must match with >= 80% score
  const isMatch =
    (regTokens.length >= 2 && (matchedTokensCount >= 2 || matchScore >= 70)) ||
    (regTokens.length === 1 && (matchedTokensCount >= 1 && matchScore >= 75)) ||
    (bankTokens.length >= 2 && matchedTokensCount >= 2);

  let reason = isMatch
    ? `Bank account name verified (${matchScore}% match with registered profile).`
    : `Name mismatch: The bank account name "${bankAccountName}" does not match your registered profile name "${registeredName}".`;

  return {
    isValid: isMatch,
    matchScore,
    reason,
    registeredNameTokens: regTokens,
    bankNameTokens: bankTokens,
  };
}
