import { createServerClient } from '@supabase/ssr'
import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie } from 'h3'

export const getServerSupabase = (event: H3Event) => {
  const {
    public: { supabaseUrl, supabaseAnonKey }
  } = useRuntimeConfig()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (key: string) => getCookie(event, key) ?? '',
      set: (key: string, value: string, options: any) =>
        setCookie(event, key, value, {
          ...options,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        }),
      remove: (key: string, options: any) => deleteCookie(event, key, options)
    }
  })
}
