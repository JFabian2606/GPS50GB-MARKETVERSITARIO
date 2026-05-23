import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener rol del usuario actual
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    const { rol } = profile;

    // 3. Solo admin y superadmin pueden acceder
    if (rol !== 'admin' && rol !== 'superadmin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // 4. Construir la consulta según el rol
    let query = supabase.from('profiles').select('*');

    if (rol === 'admin') {
      // admin ve estudiantes y tutores
      query = query.in('rol', ['estudiante', 'tutor']);
    } else if (rol === 'superadmin') {
      // superadmin ve estudiantes, tutores y admins
      query = query.in('rol', ['estudiante', 'tutor', 'admin']);
    }

    const { data: usuarios, error: usersError } = await query.order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching usuarios:', usersError);
      return NextResponse.json(
        { error: 'Error al obtener usuarios' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: usuarios }, { status: 200 });

  } catch (error: any) {
    console.error('Error interno del servidor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Verificar que sea admin o superadmin
    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single();
    if (!profile || (profile.rol !== 'superadmin' && profile.rol !== 'admin')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    
    // Si es admin, forzar que el rol sea estudiante
    if (profile.rol === 'admin' && body.rol && body.rol !== 'estudiante') {
      return NextResponse.json({ error: 'Solo los superadmins pueden crear roles administrativos' }, { status: 403 });
    }

    // 3. Crear cliente admin (Service Role) para evitar inicio de sesión
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Crear usuario en auth
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        nombres: body.nombres,
        apellidos: body.apellidos,
      }
    });

    if (createError) {
      console.error('Error creando usuario en Auth:', createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // 5. Actualizar su perfil (el trigger de seed.sql creó el profile con id, nombres, apellidos de la metadata o vacíos)
    const { data: updatedProfile, error: profileErr } = await adminSupabase
      .from('profiles')
      .update({
        nombres: body.nombres,
        apellidos: body.apellidos,
        tipo_documento: body.tipo_documento,
        documento_identidad: body.documento_identidad,
        genero: body.genero,
        telefono: body.telefono,
        programa_academico: body.programa_academico,
        rol: body.rol || 'estudiante',
        estado: body.estado || 'activo',
      })
      .eq('id', newUser.user.id)
      .select()
      .single();

    if (profileErr) {
      console.error('Error actualizando perfil:', profileErr);
      return NextResponse.json({ error: 'Usuario creado pero falló la actualización del perfil.' }, { status: 400 });
    }

    return NextResponse.json({ data: { ...updatedProfile, email: body.email } }, { status: 201 });

  } catch (error: any) {
    console.error('Error interno del servidor:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
