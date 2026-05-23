import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para solicitar una tutoría.' },
        { status: 401 }
      );
    }

    // 2. Extraer datos del cuerpo
    const body = await request.json();
    const { id_tutoria, mensaje } = body;

    // 3. Validar campos
    if (!id_tutoria) {
      return NextResponse.json(
        { error: 'El ID de la tutoría es obligatorio.' },
        { status: 400 }
      );
    }

    const idTutoriaNum = parseInt(id_tutoria, 10);
    if (isNaN(idTutoriaNum)) {
      return NextResponse.json(
        { error: 'El ID de la tutoría debe ser un número válido.' },
        { status: 400 }
      );
    }

    // 4. Verificar que la tutoría existe
    const { data: tutoria, error: tutoriaError } = await supabase
      .from('tutoria')
      .select('id_usuario, titulo')
      .eq('id_tutoria', idTutoriaNum)
      .single();

    if (tutoriaError || !tutoria) {
      return NextResponse.json(
        { error: 'La tutoría especificada no existe.' },
        { status: 404 }
      );
    }

    // 5. Evitar que un tutor solicite su propia tutoría
    if (tutoria.id_usuario === user.id) {
      return NextResponse.json(
        { error: 'No puedes solicitar tu propia tutoría.' },
        { status: 400 }
      );
    }

    // 6. Evitar solicitudes duplicadas pendientes
    const { data: existingSolicitud } = await supabase
      .from('solicitudes')
      .select('id_solicitud')
      .eq('id_usuario', user.id)
      .eq('id_tutoria', idTutoriaNum)
      .eq('estado', 'pendiente')
      .maybeSingle();

    if (existingSolicitud) {
      return NextResponse.json(
        { error: 'Ya tienes una solicitud pendiente para esta tutoría.' },
        { status: 400 }
      );
    }

    // 7. Insertar solicitud
    const { data, error } = await supabase
      .from('solicitudes')
      .insert([
        {
          id_usuario: user.id,
          id_tutoria: idTutoriaNum,
          mensaje: mensaje?.trim() || null,
          estado: 'pendiente',
          fecha: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error insertando solicitud de tutoría:', error);
      return NextResponse.json(
        { error: 'Error al crear la solicitud en la base de datos.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Solicitud de tutoría enviada exitosamente', data },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Excepción creando solicitud de tutoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // 1. Verificar sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    // Filtros opcionales
    const tipo = searchParams.get('tipo') || 'todas'; // 'enviadas' | 'recibidas' | 'todas'
    const estado = searchParams.get('estado') || ''; // 'pendiente' | 'aceptada' | 'rechazada'
    const limit = parseInt(searchParams.get('limit') || '50');

    // Consultamos el perfil para saber qué rol tiene
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const isTutorOrAdmin = profile?.rol === 'tutor' || profile?.rol === 'admin' || profile?.rol === 'superadmin';

    let data: any[] = [];
    let fetchError: any = null;

    if (tipo === 'enviadas' || (!isTutorOrAdmin && tipo === 'todas')) {
      // Estudiante o filtro "enviadas": solicitudes hechas por el usuario actual
      let query = supabase
        .from('solicitudes')
        .select(`
          *,
          tutoria:tutoria(
            *,
            perfil:profiles(nombres, apellidos, programa_academico, telefono)
          )
        `)
        .eq('id_usuario', user.id)
        .order('fecha', { ascending: false })
        .limit(limit);

      if (estado) {
        query = query.eq('estado', estado);
      }

      const res = await query;
      data = res.data || [];
      fetchError = res.error;
    } else if (tipo === 'recibidas') {
      // Tutor/Admin o filtro "recibidas": solicitudes para tutorías del usuario actual
      let query = supabase
        .from('solicitudes')
        .select(`
          *,
          perfil:profiles(nombres, apellidos, programa_academico, telefono, rol),
          tutoria!inner(*)
        `)
        .eq('tutoria.id_usuario', user.id)
        .order('fecha', { ascending: false })
        .limit(limit);

      if (estado) {
        query = query.eq('estado', estado);
      }

      const res = await query;
      data = res.data || [];
      fetchError = res.error;
    } else {
      // 'todas' para un tutor/admin: combinamos ambas
      // 1. Enviadas por mí
      let queryEnviadas = supabase
        .from('solicitudes')
        .select(`
          *,
          tutoria:tutoria(
            *,
            perfil:profiles(nombres, apellidos, programa_academico, telefono)
          )
        `)
        .eq('id_usuario', user.id);

      if (estado) {
        queryEnviadas = queryEnviadas.eq('estado', estado);
      }

      const resEnviadas = await queryEnviadas;

      // 2. Recibidas por mí (para mis tutorías)
      let queryRecibidas = supabase
        .from('solicitudes')
        .select(`
          *,
          perfil:profiles(nombres, apellidos, programa_academico, telefono, rol),
          tutoria!inner(*)
        `)
        .eq('tutoria.id_usuario', user.id);

      if (estado) {
        queryRecibidas = queryRecibidas.eq('estado', estado);
      }

      const resRecibidas = await queryRecibidas;

      if (resEnviadas.error) fetchError = resEnviadas.error;
      else if (resRecibidas.error) fetchError = resRecibidas.error;

      // Unir y ordenar por fecha descendente
      const enviadasConTipo = (resEnviadas.data || []).map(item => ({ ...item, tipo_relacion: 'enviada' }));
      const recibidasConTipo = (resRecibidas.data || []).map(item => ({ ...item, tipo_relacion: 'recibida' }));
      
      data = [...enviadasConTipo, ...recibidasConTipo].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ).slice(0, limit);
    }

    if (fetchError) {
      console.error('Error listando solicitudes de tutoría:', fetchError);
      return NextResponse.json(
        { error: 'Error al obtener las solicitudes.', details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (error: any) {
    console.error('Excepción listando solicitudes de tutoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}
