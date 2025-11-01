import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const cfg = useRuntimeConfig()
  const supabase = createClient(cfg.public.supabaseUrl!, cfg.public.supabaseAnonKey!, {
    auth: { persistSession: true, autoRefreshToken: true }
  })
  return { provide: { supabase } }
})
