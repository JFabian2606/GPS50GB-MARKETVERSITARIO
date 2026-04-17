import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RegisterPayload } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterPayload = await request.json()

    // ── 1. Validación básica de campos obligatorios ──────────────────
    const requiredFields: (keyof RegisterPayload)[] = [
      'email',
      'password',
      'nombres',
      'apellidos',
      'tipo_documento',
      'documento_identidad',
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo '${field}' es obligatorio.` },
          { status: 400 }
        )
      }
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      )
    }

    // ── 2. Crear usuario en auth.users (Supabase Auth) ───────────────
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          nombres: body.nombres,
          apellidos: body.apellidos,
        },
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: authError.status ?? 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    // ── 3. Insertar perfil en nuestra tabla profiles ─────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        tipo_documento: body.tipo_documento,
        documento_identidad: body.documento_identidad,
        nombres: body.nombres,
        apellidos: body.apellidos,
        genero: body.genero ?? null,
        telefono: body.telefono ?? null,
        programa_academico: body.programa_academico ?? null,
        rol: body.rol ?? 'estudiante',
      })
      .select()
      .single()

    if (profileError) {
      // Nota: El rollback del usuario en auth.users requiere service_role key.
      // Por ahora retornamos el error. En producción usar una Edge Function para esto.
      return NextResponse.json(
        { error: 'Error al guardar el perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    // ── 4. Respuesta exitosa ─────────────────────────────────────────
    return NextResponse.json(
      {
        message: 'Usuario registrado exitosamente. Revisa tu correo para confirmar tu cuenta.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          profile,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[POST /api/auth/register]', error)
    return NextResponse.json(
      { error: 'Error interno: ' + message },
      { status: 500 }
    )
  }
}
