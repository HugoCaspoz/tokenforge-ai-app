// En: frontend/utils/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// La función ahora acepta el cookieStore como argumento
export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // La función `set` se puede llamar desde un Componente de Servidor.
            // Esto se puede ignorar si tienes un middleware que refresca las sesiones.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // La función `delete` se puede llamar desde un Componente de Servidor.
            // Esto se puede ignorar si tienes un middleware que refresca las sesiones.
          }
        },
      },
    }
  )
}
