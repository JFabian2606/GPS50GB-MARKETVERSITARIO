import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: Number(process.env.NEXT_PUBLIC_SESSION_EXPIRATION_SECONDS) || 172800, // Defecto 2 días
              })
            )
          } catch {
            // El método set fue llamado desde un Server Component.
            // Puede ignorarse si hay middleware que refresque la sesión.
          }
        },
      },
    }
  )
}
