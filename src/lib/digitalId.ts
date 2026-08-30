/**
 * Official HandyHub Pro Digital Identity System
 * Generates, assigns, and formats unique Digital IDs for verified artisans and service professionals.
 * Format: HHP-PRO-XXXXX (e.g., HHP-PRO-84920)
 */

export function generateDigitalIdFromSeed(seedId: string): string {
  if (!seedId) return `HHP-PRO-${Math.floor(10000 + Math.random() * 90000)}`;
  
  let hash = 0;
  for (let i = 0; i < seedId.length; i++) {
    hash = ((hash << 5) - hash) + seedId.charCodeAt(i);
    hash |= 0;
  }
  const num = Math.abs(hash) % 90000 + 10000;
  return `HHP-PRO-${num}`;
}

export function formatDigitalId(pro?: { id?: string; digitalId?: string | null } | null): string {
  if (!pro) return "HHP-PRO-UNASSIGNED";
  if (pro.digitalId && pro.digitalId.trim().length > 0) {
    return pro.digitalId.trim();
  }
  if (pro.id) {
    return generateDigitalIdFromSeed(pro.id);
  }
  return "HHP-PRO-UNASSIGNED";
}
