import { compareSync, hashSync } from "bcryptjs";

export interface StaffAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  passwordHash: string;
  plainPassword?: string;
}

// Built-in seed high-availability staff accounts
const INITIAL_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: "usr_admin_khalbir_hotmail",
    email: "khalbir@hotmail.com",
    firstName: "KHALID",
    lastName: "KABIR",
    role: "SUPER_ADMIN",
    phone: "+2348169829213",
    passwordHash: hashSync("AdminPass123!", 10),
    plainPassword: "AdminPass123!",
  },
];

// Global in-memory registry map
const staffRegistry = new Map<string, StaffAccount>();

// Initialize registry
INITIAL_STAFF_ACCOUNTS.forEach((account) => {
  staffRegistry.set(account.email.toLowerCase().trim(), account);
});

export function registerStaffAccount(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  phone?: string;
  password?: string;
}) {
  const cleanEmail = data.email.toLowerCase().trim();
  const existing = staffRegistry.get(cleanEmail);

  const rawPassword = data.password && data.password.trim() ? data.password.trim() : (existing?.plainPassword || "Staff123!");
  const passwordHash = hashSync(rawPassword, 10);

  const account: StaffAccount = {
    id: existing?.id || `usr_staff_${Date.now()}`,
    email: cleanEmail,
    firstName: data.firstName || existing?.firstName || "Staff",
    lastName: data.lastName || existing?.lastName || "Member",
    role: data.role,
    phone: data.phone || existing?.phone || "Not Provided",
    passwordHash,
    plainPassword: rawPassword,
  };

  staffRegistry.set(cleanEmail, account);
  return account;
}

export function updateStaffPassword(email: string, newPlainPassword: string) {
  const cleanEmail = email.toLowerCase().trim();
  const existing = staffRegistry.get(cleanEmail);
  const passwordHash = hashSync(newPlainPassword.trim(), 10);

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.plainPassword = newPlainPassword.trim();
    staffRegistry.set(cleanEmail, existing);
    return existing;
  } else {
    const newAccount: StaffAccount = {
      id: `usr_staff_${Date.now()}`,
      email: cleanEmail,
      firstName: "Staff",
      lastName: "Member",
      role: "ADMIN",
      passwordHash,
      plainPassword: newPlainPassword.trim(),
    };
    staffRegistry.set(cleanEmail, newAccount);
    return newAccount;
  }
}

export function findStaffAccount(email: string): StaffAccount | undefined {
  return staffRegistry.get(email.toLowerCase().trim());
}

export function authenticateStaffAccount(email: string, passwordAttempt: string): StaffAccount | null {
  const account = findStaffAccount(email);
  if (!account) return null;

  const cleanAttempt = passwordAttempt.trim();

  // Direct match or bcrypt compare
  if (cleanAttempt === account.plainPassword || passwordAttempt === account.plainPassword) return account;
  if (compareSync(cleanAttempt, account.passwordHash) || compareSync(passwordAttempt, account.passwordHash)) return account;

  return null;
}
