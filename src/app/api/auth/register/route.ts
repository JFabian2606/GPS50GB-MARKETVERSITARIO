import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RegisterPayload } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterPayload = await request.json()

    // ── 1. Limpieza y formato inicial ────────────────────────────────
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const nombres = body.nombres?.trim()
    const apellidos = body.apellidos?.trim()
    const tipo_documento = body.tipo_documento?.trim().toUpperCase()
    const documento_identidad = body.documento_identidad?.trim()
    const genero = body.genero?.trim()
    const telefono = body.telefono?.trim()
    const programa_academico = body.programa_academico?.trim()
    const rol = body.rol

    // ── 2. Validación de campos obligatorios ─────────────────────────
    if (!email || !password || !nombres || !apellidos || !tipo_documento || !documento_identidad) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios. Revisa el formulario.' },
        { status: 400 }
      )
    }

    // ── 3. Validaciones específicas (Reglas de negocio) ──────────────

    // Email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de correo electrónico inválido.' },
        { status: 400 }
      )
    }

    // Contraseña fuerte (Mín 8 chars, 1 mayúscula, 1 número)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número.' },
        { status: 400 }
      )
    }

    // Tipo de documento permitido
    const tiposPermitidos = ['CC', 'TI', 'CE', 'PASAPORTE', 'NIT']
    if (!tiposPermitidos.includes(tipo_documento)) {
      return NextResponse.json(
        { error: `Tipo de documento inválido. Permitidos: ${tiposPermitidos.join(', ')}` },
        { status: 400 }
      )
    }

    // Documento identidad (Solo números y de 5 a 15 de longitud)
    const docRegex = /^\d{5,15}$/
    if (!docRegex.test(documento_identidad)) {
      return NextResponse.json(
        { error: 'El documento de identidad debe contener solo entre 5 y 15 números.' },
        { status: 400 }
      )
    }

    // ── 4. Crear usuario en auth.users (Supabase Auth) ───────────────
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nombres: nombres,
          apellidos: apellidos,
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

    // ── 5. Insertar perfil en nuestra tabla profiles ─────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        tipo_documento: tipo_documento,
        documento_identidad: documento_identidad,
        nombres: nombres,
        apellidos: apellidos,
        genero: genero ?? null,
        telefono: telefono ?? null,
        programa_academico: programa_academico ?? null,
        rol: rol ?? 'estudiante',
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
