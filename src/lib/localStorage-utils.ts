/**
 * Centralized localStorage Utility for HandyHub Pro Solutions
 * Type-safe helpers with SSR guards, error handling, and unified key constants.
 */

// ─── All localStorage Key Constants ─────────────────────────────────────────
export const STORAGE_KEYS = {
  // Auth & Session
  USER: "handyhub_user",
  USER_SESSION: "handyhub_user_session",
  PRO_SESSION: "handyhub_pro_session",
  ADMIN_SESSION: "handyhub_admin_session",
  STAY_SIGNED_IN: "handyhub_stay_signed_in",

  // Theme
  THEME: "handyhub-theme",

  // Booking Flow
  PENDING_BOOKING: "handyhub_pending_booking",
  BOOKING_STEP: "handyhub_booking_step",
  LAST_BOOKING_REF: "handyhub_last_booking_ref",

  // Dashboard Data Cache
  ADDRESSES: "handyhub_addresses",
  WALLET_BALANCE: "handyhub_wallet_balance",
  BOOKINGS_CACHE: "handyhub_bookings_cache",
  DASHBOARD_STATS: "handyhub_dashboard_stats",
  DASHBOARD_TAB: "handyhub_dashboard_tab",

  // User Preferences
  NOTIFICATION_PREFS: "handyhub_notification_prefs",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ─── Core Helpers ───────────────────────────────────────────────────────────

/**
 * Safely save JSON-serializable data to localStorage.
 * No-ops during SSR and silently handles quota/serialization errors.
 */
export function saveToStorage<T>(key: string, data: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[localStorage] Failed to save key "${key}":`, err);
    return false;
  }
}

/**
 * Safely load and parse JSON data from localStorage.
 * Returns the fallback value on SSR, missing key, or parse error.
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[localStorage] Failed to load key "${key}":`, err);
    return fallback;
  }
}

/**
 * Load a raw string value from localStorage (no JSON parsing).
 * Returns the fallback on SSR or missing key.
 */
export function loadRawFromStorage(key: string, fallback: string = ""): string {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Remove a single key from localStorage.
 */
export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Remove multiple keys from localStorage.
 */
export function removeMultipleFromStorage(keys: string[]): void {
  if (typeof window === "undefined") return;
  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
}

/**
 * Clear all HandyHub-specific cached data keys (preserves auth/session keys).
 * Use on logout to clean up user-specific cache while auth cleanup is handled separately.
 */
export function clearUserDataCache(): void {
  removeMultipleFromStorage([
    STORAGE_KEYS.ADDRESSES,
    STORAGE_KEYS.WALLET_BALANCE,
    STORAGE_KEYS.BOOKINGS_CACHE,
    STORAGE_KEYS.DASHBOARD_STATS,
    STORAGE_KEYS.DASHBOARD_TAB,
    STORAGE_KEYS.NOTIFICATION_PREFS,
    STORAGE_KEYS.PENDING_BOOKING,
    STORAGE_KEYS.BOOKING_STEP,
    STORAGE_KEYS.LAST_BOOKING_REF,
  ]);
}

/**
 * Clear ALL HandyHub keys (auth + data + session). Full logout cleanup.
 */
export function clearAllHandyHubStorage(): void {
  clearUserDataCache();
  removeMultipleFromStorage([
    STORAGE_KEYS.USER,
    STORAGE_KEYS.USER_SESSION,
    STORAGE_KEYS.PRO_SESSION,
    STORAGE_KEYS.ADMIN_SESSION,
    STORAGE_KEYS.STAY_SIGNED_IN,
  ]);
}

// ─── Notification Preferences ───────────────────────────────────────────────

export interface NotificationPreferences {
  emailNotifs: boolean;
  smsNotifs: boolean;
  securityAlerts: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  emailNotifs: true,
  smsNotifs: true,
  securityAlerts: true,
};

export function saveNotificationPrefs(prefs: NotificationPreferences): void {
  saveToStorage(STORAGE_KEYS.NOTIFICATION_PREFS, prefs);
}

export function loadNotificationPrefs(): NotificationPreferences {
  return loadFromStorage<NotificationPreferences>(
    STORAGE_KEYS.NOTIFICATION_PREFS,
    DEFAULT_NOTIFICATION_PREFS
  );
}

// ─── Dashboard Stats Cache ──────────────────────────────────────────────────

export interface DashboardStatsCache {
  activeDispatchesCount: number;
  totalBookingsCount: number;
  walletBalance: number;
  cachedAt: string;
}

export function saveDashboardStats(stats: Omit<DashboardStatsCache, "cachedAt">): void {
  saveToStorage(STORAGE_KEYS.DASHBOARD_STATS, {
    ...stats,
    cachedAt: new Date().toISOString(),
  });
}

export function loadDashboardStats(): DashboardStatsCache | null {
  return loadFromStorage<DashboardStatsCache | null>(STORAGE_KEYS.DASHBOARD_STATS, null);
}
