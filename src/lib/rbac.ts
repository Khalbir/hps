/**
 * Role-Based Access Control (RBAC) Module for HandyHub Pro Solutions
 * Defines 5 admin permission levels + Customer/Professional end-user roles.
 */

export type UserRole =
  | "SUPER_ADMIN"
  | "OPERATIONS_MANAGER"
  | "VERIFICATION_OFFICER"
  | "CUSTOMER_SUPPORT"
  | "FINANCE"
  | "ADMIN" // Legacy fallback mapped to SUPER_ADMIN
  | "PROFESSIONAL"
  | "CUSTOMER";

export interface RolePermissions {
  dashboard: boolean;
  map: boolean;
  bookings: boolean;
  users: boolean;
  professionals: boolean;
  verification: boolean;
  payments: boolean;
  disputes: boolean;
  reviews: boolean;
  promoCodes: boolean;
  analytics: boolean;
  notifications: boolean;
  settings: boolean;
  backup: boolean;
  manageRoles: boolean;
}

export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  SUPER_ADMIN: {
    dashboard: true,
    map: true,
    bookings: true,
    users: true,
    professionals: true,
    verification: true,
    payments: true,
    disputes: true,
    reviews: true,
    promoCodes: true,
    analytics: true,
    notifications: true,
    settings: true,
    backup: true,
    manageRoles: true,
  },
  ADMIN: { // Legacy admin map
    dashboard: true,
    map: true,
    bookings: true,
    users: true,
    professionals: true,
    verification: true,
    payments: true,
    disputes: true,
    reviews: true,
    promoCodes: true,
    analytics: true,
    notifications: true,
    settings: true,
    backup: true,
    manageRoles: true,
  },
  OPERATIONS_MANAGER: {
    dashboard: true,
    map: true,
    bookings: true,
    users: true,
    professionals: true,
    verification: false,
    payments: false,
    disputes: true,
    reviews: true,
    promoCodes: false,
    analytics: true,
    notifications: true,
    settings: false,
    backup: false,
    manageRoles: false,
  },
  VERIFICATION_OFFICER: {
    dashboard: true,
    map: false,
    bookings: false,
    users: false,
    professionals: true,
    verification: true,
    payments: false,
    disputes: false,
    reviews: false,
    promoCodes: false,
    analytics: false,
    notifications: true,
    settings: false,
    backup: false,
    manageRoles: false,
  },
  CUSTOMER_SUPPORT: {
    dashboard: true,
    map: false,
    bookings: true,
    users: true,
    professionals: true,
    verification: false,
    payments: false,
    disputes: true,
    reviews: true,
    promoCodes: false,
    analytics: false,
    notifications: true,
    settings: false,
    backup: false,
    manageRoles: false,
  },
  FINANCE: {
    dashboard: true,
    map: false,
    bookings: true,
    users: false,
    professionals: false,
    verification: false,
    payments: true,
    disputes: true,
    reviews: false,
    promoCodes: true,
    analytics: true,
    notifications: true,
    settings: false,
    backup: false,
    manageRoles: false,
  },
};

export const ROLE_LABELS: Record<string, { label: string; description: string; badgeColor: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    description: "Full unchecked administrative control across system config, staff roles, and backups.",
    badgeColor: "#EF4444",
  },
  ADMIN: {
    label: "Super Admin",
    description: "Full unchecked administrative control.",
    badgeColor: "#EF4444",
  },
  OPERATIONS_MANAGER: {
    label: "Operations Manager",
    description: "Manages live bookings, dispatch, artisan assignments, and regional coverage.",
    badgeColor: "#3B82F6",
  },
  VERIFICATION_OFFICER: {
    label: "Verification Officer",
    description: "Reviews govt IDs, proof of address, NIN/BVN checks, and artisan onboarding compliance.",
    badgeColor: "#F59E0B",
  },
  CUSTOMER_SUPPORT: {
    label: "Customer Support",
    description: "Handles complaint disputes, customer inquiries, and booking tracking.",
    badgeColor: "#10B981",
  },
  FINANCE: {
    label: "Finance Admin",
    description: "Oversees Paystack/Monnify transactions, escrow releases, wallet refunds, and revenue reporting.",
    badgeColor: "#8B5CF6",
  },
};

export function hasPermission(role: string | undefined | null, permission: keyof RolePermissions): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role.toUpperCase()];
  if (!perms) return false;
  return !!perms[permission];
}

export function getRoleBadgeInfo(role: string | undefined | null) {
  const normalized = (role || "CUSTOMER").toUpperCase();
  return ROLE_LABELS[normalized] || {
    label: normalized,
    description: "End User Role",
    badgeColor: "#64748B",
  };
}
