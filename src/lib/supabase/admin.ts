import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase con privilegios de Service Role.
 * Bypassa RLS — úsalo SOLO en rutas de servidor donde ya hayas
 * validado la identidad del usuario con auth.getUser().
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
