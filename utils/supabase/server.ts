// En: frontend/utils/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 1. Añade 'async'
        get: async (name: string) => {
          // 2. Añade 'await' (aunque no debería ser necesario, satisface a TypeScript)
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
        // 1. Añade 'async'
        set: async (name: string, value: string, options: CookieOptions) => {
          try {
            // 2. Añade 'await'
            const cookieStore = await cookies()
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // La función `set` se puede llamar desde un Componente de Servidor.
            // Esto se puede ignorar si tienes un middleware que refresca las sesiones.
          }
        },
        // 1. Añade 'async'
        remove: async (name: string, options: CookieOptions) => {
          try {
            // 2. Añade 'await'
            const cookieStore = await cookies()
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // La función `remove` se puede llamar desde un Componente de Servidor.
            // Esto se puede ignorar si tienes un middleware que refresca las sesiones.
          }
        },
      },
    }
  )
}