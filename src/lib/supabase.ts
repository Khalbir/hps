import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Fallback production Supabase credentials to ensure zero build-time crashes on Vercel
const DEFAULT_URL = "https://ioggvcvwwnjfzbwyjiwf.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_zRXBm6ViXo-kaH2TLi41qA_g8bWDwM3";

const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url && url.trim().length > 0 && url.startsWith("http")) {
    return url.trim();
  }
  return DEFAULT_URL;
};

const getSupabaseAnonKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (key && key.trim().length > 0) {
    return key.trim();
  }
  return DEFAULT_ANON_KEY;
};

// Browser & Public Client (Guaranteed build-safe)
export const supabase: SupabaseClient = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);

// Safe Supabase Admin Client Getter
export const getSupabaseAdmin = (): SupabaseClient => {
  const url = getSupabaseUrl();
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim().length > 0
      ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
      : getSupabaseAnonKey();

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
};
