import { createClient } from "@supabase/supabase-js";

// Supabase Auth is optional. Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY at
// build time to enable logins and per-tenant data. Without them, the app runs
// exactly as before: an open, simulated public demo.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const authEnabled = Boolean(url && key);
export const supabase = authEnabled ? createClient(url, key) : null;
