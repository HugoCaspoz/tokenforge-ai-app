import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  // Prevent server-side crash "indexedDB is not defined"
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: {
            // Completely mock storage to avoid indexedDB lookup
            getItem: (key: string) => null,
            setItem: (key: string, value: string) => { },
            removeItem: (key: string) => { },
          }
        }
      }
    )
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}