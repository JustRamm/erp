import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project") &&
    !supabaseAnonKey.includes("your-anon")
  );
};

// Use valid placeholder URL if not configured to prevent startup crashes
const safeUrl = isSupabaseConfigured() ? supabaseUrl : "https://placeholder-ims.supabase.co";
const safeKey = isSupabaseConfigured() ? supabaseAnonKey : "placeholder-key";

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
