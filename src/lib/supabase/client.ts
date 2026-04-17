import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: Number(process.env.NEXT_PUBLIC_SESSION_EXPIRATION_SECONDS) || 172800, // Defecto 2 días
      },
    }
  )
}
