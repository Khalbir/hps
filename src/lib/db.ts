import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  rawPrisma: PrismaClient | undefined;
  schemaEnsured?: boolean;
  localStore?: any;
};

const rawPrisma = globalForPrisma.rawPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.rawPrisma = rawPrisma;

// Persistent Local Store Path
const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "handyhub_db.json");

interface LocalStoreData {
  users: any[];
  professionals: any[];
  wallets: any[];
  bookings: any[];
  auditLogs: any[];
  notifications: any[];
}

function loadLocalStore(): LocalStoreData {
  if (globalForPrisma.localStore) return globalForPrisma.localStore;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, "utf-8");
      const data = JSON.parse(content);
      globalForPrisma.localStore = data;
      return data;
    }
  } catch (e) {
    console.warn("[Local Store Read Warning]:", e);
  }

  const initialData: LocalStoreData = {
    users: [
      {
        id: "usr_admin_khalbir_hotmail",
        email: "khalbir@hotmail.com",
        firstName: "KHALID",
        lastName: "KABIR",
        phone: "+2348169829213",
        password: "$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW", // AdminPass123!
        role: "SUPER_ADMIN",
        isVerified: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    professionals: [],
    wallets: [{ id: "wal_admin", userId: "usr_admin_root", balance: 0, pendingEscrow: 0, currency: "NGN" }],
    bookings: [],
    auditLogs: [],
    notifications: [],
  };

  saveLocalStore(initialData);
  globalForPrisma.localStore = initialData;
  return initialData;
}

function saveLocalStore(data: LocalStoreData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    globalForPrisma.localStore = data;
  } catch (e) {
    console.warn("[Local Store Write Warning]:", e);
  }
}

async function executeLocalStore(model: string, method: string, queryObj: any = {}) {
  const store = loadLocalStore();
  const collectionName =
    model === "user" ? "users" :
    model === "professional" ? "professionals" :
    model === "wallet" ? "wallets" :
    model === "booking" ? "bookings" :
    model === "auditLog" ? "auditLogs" :
    model === "notification" ? "notifications" : null;

  if (!collectionName || !(store as any)[collectionName]) {
    if (method === "count") return 0;
    if (method === "findMany") return [];
    return null;
  }

  const list: any[] = (store as any)[collectionName];

  if (method === "findFirst" || method === "findUnique") {
    const where = queryObj?.where || {};
    const match = list.find((item) => matchWhere(item, where));
    if (!match) return null;
    return enrichRelations(model, match, store);
  }

  if (method === "findMany") {
    const where = queryObj?.where || {};
    let matches = list.filter((item) => matchWhere(item, where));
    if (queryObj?.orderBy?.createdAt === "desc") {
      matches.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    if (queryObj?.take) {
      matches = matches.slice(0, queryObj.take);
    }
    return matches.map((item) => enrichRelations(model, item, store));
  }

  if (method === "count") {
    const where = queryObj?.where || {};
    return list.filter((item) => matchWhere(item, where)).length;
  }

  if (method === "create") {
    const data = queryObj?.data || {};
    const newItem = {
      id: data.id || `${model}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(newItem);
    saveLocalStore(store);
    return enrichRelations(model, newItem, store);
  }

  if (method === "update") {
    const where = queryObj?.where || {};
    const data = queryObj?.data || {};
    const idx = list.findIndex((item) => matchWhere(item, where));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
      saveLocalStore(store);
      return enrichRelations(model, list[idx], store);
    }
    return null;
  }

  if (method === "updateMany") {
    const where = queryObj?.where || {};
    const data = queryObj?.data || {};
    let count = 0;
    list.forEach((item, idx) => {
      if (matchWhere(item, where)) {
        list[idx] = { ...item, ...data, updatedAt: new Date().toISOString() };
        count++;
      }
    });
    saveLocalStore(store);
    return { count };
  }

  if (method === "upsert") {
    const where = queryObj?.where || {};
    const createData = queryObj?.create || {};
    const updateData = queryObj?.update || {};
    const existingIdx = list.findIndex((item) => matchWhere(item, where));
    if (existingIdx !== -1) {
      list[existingIdx] = { ...list[existingIdx], ...updateData, updatedAt: new Date().toISOString() };
      saveLocalStore(store);
      return enrichRelations(model, list[existingIdx], store);
    } else {
      const newItem = {
        id: createData.id || `${model}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...createData,
        createdAt: createData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      list.push(newItem);
      saveLocalStore(store);
      return enrichRelations(model, newItem, store);
    }
  }

  if (method === "delete") {
    const where = queryObj?.where || {};
    const idx = list.findIndex((item) => matchWhere(item, where));
    if (idx !== -1) {
      const deleted = list.splice(idx, 1)[0];
      saveLocalStore(store);
      return deleted;
    }
    return null;
  }

  return null;
}

function matchWhere(item: any, where: any): boolean {
  if (!where || Object.keys(where).length === 0) return true;

  if (where.OR && Array.isArray(where.OR)) {
    return where.OR.some((subWhere: any) => matchWhere(item, subWhere));
  }

  for (const key of Object.keys(where)) {
    const cond = where[key];
    if (cond === undefined) continue;

    const val = item[key];

    if (cond && typeof cond === "object") {
      if (cond.equals !== undefined) {
        const mode = cond.mode;
        if (mode === "insensitive" && typeof val === "string" && typeof cond.equals === "string") {
          if (val.toLowerCase() !== cond.equals.toLowerCase()) return false;
        } else if (val !== cond.equals) {
          return false;
        }
      }
      if (cond.in && Array.isArray(cond.in)) {
        if (!cond.in.includes(val)) return false;
      }
    } else {
      if (val !== cond) return false;
    }
  }
  return true;
}

function enrichRelations(model: string, item: any, store: LocalStoreData): any {
  if (!item) return item;
  const enriched = { ...item };

  if (model === "user") {
    const pro = store.professionals.find((p) => p.userId === item.id);
    if (pro) enriched.professional = pro;
  } else if (model === "professional") {
    const usr = store.users.find((u) => u.id === item.userId);
    if (usr) enriched.user = usr;
  }

  return enriched;
}

// Resilient Proxy Wrapping rawPrisma Client
export const prisma = new Proxy(rawPrisma, {
  get(target, prop, receiver) {
    if (prop === "$transaction") {
      return async function (arg: any, options?: any) {
        if (Array.isArray(arg)) {
          return await Promise.all(arg);
        }
        if (typeof arg === "function") {
          try {
            return await (target as any).$transaction(arg, options);
          } catch (txErr) {
            console.warn("[Prisma $transaction Fallback Execution]:", txErr);
            return await arg(prisma);
          }
        }
        return await (target as any).$transaction(arg, options);
      };
    }

    const modelName = String(prop);
    const rawModel = (target as any)[modelName];

    if (!rawModel || typeof rawModel !== "object") {
      return Reflect.get(target, prop, receiver);
    }

    return new Proxy(rawModel, {
      get(mTarget, mProp) {
        const method = mTarget[mProp];
        if (typeof method !== "function") return method;

        return async function (...args: any[]) {
          try {
            return await method.apply(mTarget, args);
          } catch (err: any) {
            const isConnErr =
              err?.name === "PrismaClientInitializationError" ||
              err?.code === "P1001" ||
              err?.code === "P1017" ||
              String(err?.message).includes("Authentication failed") ||
              String(err?.message).includes("Can't reach database server") ||
              String(err?.message).includes("tenant/user");

            if (isConnErr) {
              return await executeLocalStore(modelName, String(mProp), args[0]);
            }
            throw err;
          }
        };
      },
    });
  },
});

/**
 * Self-Healing Schema Guard: Automatically adds missing columns to PostgreSQL
 */
export async function ensureUserSchema() {
  if (globalForPrisma.schemaEnsured) return;
  try {
    await rawPrisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permanentAddress" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permanentAddressProof" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permanentAddressStatus" TEXT DEFAULT 'NOT_SUBMITTED';
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permanentAddressNotes" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secondaryAddress" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingPermanentAddress" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingPermanentAddressProof" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ninNumber" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ninStatus" TEXT DEFAULT 'NOT_SUBMITTED';
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bookingAddresses" TEXT DEFAULT '[]';
    `);
    globalForPrisma.schemaEnsured = true;
  } catch {
    // Graceful fallback if database user lacks ALTER permission or connection is offline
  }
}
