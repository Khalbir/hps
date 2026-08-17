import { compareSync, hashSync } from "bcryptjs";

export interface StoredCredential {
  email: string;
  passwordHash: string;
  plainPassword?: string;
  updatedAt: number;
  userPayload?: any;
}

// Global in-memory credential storage across Next.js API requests
const globalCredentialStore = new Map<string, StoredCredential>();

export function storeCredential(email: string, plainPassword: string, userPayload?: any) {
  const cleanEmail = email.toLowerCase().trim();
  const cleanPassword = plainPassword.trim();
  const passwordHash = hashSync(cleanPassword, 10);

  const cred: StoredCredential = {
    email: cleanEmail,
    passwordHash,
    plainPassword: cleanPassword,
    updatedAt: Date.now(),
    userPayload,
  };

  globalCredentialStore.set(cleanEmail, cred);
  return cred;
}

export function getStoredCredential(email: string): StoredCredential | undefined {
  return globalCredentialStore.get(email.toLowerCase().trim());
}

export function verifyStoredCredential(email: string, passwordAttempt: string): StoredCredential | null {
  const cred = getStoredCredential(email);
  if (!cred) return null;

  const cleanAttempt = passwordAttempt.trim();

  if (cred.plainPassword && (cleanAttempt === cred.plainPassword || passwordAttempt === cred.plainPassword)) {
    return cred;
  }

  if (compareSync(cleanAttempt, cred.passwordHash) || compareSync(passwordAttempt, cred.passwordHash)) {
    return cred;
  }

  return null;
}
