import { createClient } from "@supabase/supabase-js";
import { useRuntimeConfig } from "#imports";

export const getAdminClient = () => {
  const cfg = useRuntimeConfig();
  return createClient(cfg.public.supabaseUrl!, cfg.supabaseServiceRole!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
