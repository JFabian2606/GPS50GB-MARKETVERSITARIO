import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'El ID de la solicitud es requerido.' },
        { status: 400 }
      );
    }

    const idSolicitud = parseInt(id, 10);
    if (isNaN(idSolicitud)) {
      return NextResponse.json(
        { error: 'El ID de la solicitud debe ser un número válido.' },
        { status: 400 }
      );
    }

    // Consultar el detalle de la solicitud haciendo JOIN con profiles y tutoria
    const { data, error } = await supabase
      .from('solicitudes')
      .select(`
        *,
        perfil:profiles(nombres, apellidos, programa_academico, telefono, rol),
        tutoria:tutoria(
          *,
          tutor_perfil:profiles(nombres, apellidos, programa_academico, telefono)
        )
      `)
      .eq('id_solicitud', idSolicitud)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Solicitud no encontrada.' },
          { status: 404 }
        );
      }
      console.error('Error obteniendo el detalle de la solicitud:', error);
      return NextResponse.json(
        { error: 'Error al obtener el detalle de la solicitud.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (error: any) {
    console.error('Excepción obteniendo detalle de solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'El ID de la solicitud es requerido.' },
        { status: 400 }
      );
    }

    const idSolicitud = parseInt(id, 10);
    if (isNaN(idSolicitud)) {
      return NextResponse.json(
        { error: 'El ID de la solicitud debe ser un número válido.' },
        { status: 400 }
      );
    }

    // 2. Obtener la solicitud existente junto con el dueño de la tutoría
    const { data: existingSolicitud, error: fetchError } = await supabase
      .from('solicitudes')
      .select(`
        *,
        tutoria:tutoria(id_usuario)
      `)
      .eq('id_solicitud', idSolicitud)
      .single();

    if (fetchError || !existingSolicitud) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada.' },
        { status: 404 }
      );
    }

    // 3. Obtener rol del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.rol === 'admin' || profile?.rol === 'superadmin';
    const isTutorOfTutoria = existingSolicitud.tutoria?.id_usuario === user.id;

    // TH55: Solo el tutor que imparte la tutoría o un administrador autorizado
    // puede cambiar el estado de la solicitud (aceptada / rechazada)
    if (!isTutorOfTutoria && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para gestionar esta solicitud.' },
        { status: 403 }
      );
    }

    // 4. Extraer payload
    const body = await request.json();
    const { estado, mensaje } = body;

    // Validación del estado
    if (estado !== undefined && !['pendiente', 'aceptada', 'rechazada'].includes(estado)) {
      return NextResponse.json(
        { error: 'El estado provisto no es válido. Debe ser pendiente, aceptada o rechazada.' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (estado !== undefined) updateData.estado = estado;
    if (mensaje !== undefined) updateData.mensaje = mensaje.trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron datos para actualizar.' },
        { status: 400 }
      );
    }

    // 5. Actualizar en la base de datos
    const { data, error } = await supabase
      .from('solicitudes')
      .update(updateData)
      .eq('id_solicitud', idSolicitud)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando solicitud de tutoría:', error);
      return NextResponse.json(
        { error: 'Error al actualizar la solicitud.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Solicitud actualizada exitosamente', data },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Excepción actualizando solicitud de tutoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'El ID de la solicitud es requerido.' },
        { status: 400 }
      );
    }

    const idSolicitud = parseInt(id, 10);
    if (isNaN(idSolicitud)) {
      return NextResponse.json(
        { error: 'El ID de la solicitud debe ser un número válido.' },
        { status: 400 }
      );
    }

    // 2. Verificar que la solicitud existe
    const { data: existingSolicitud, error: fetchError } = await supabase
      .from('solicitudes')
      .select('id_usuario')
      .eq('id_solicitud', idSolicitud)
      .single();

    if (fetchError || !existingSolicitud) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada.' },
        { status: 404 }
      );
    }

    // Obtener rol del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.rol === 'admin' || profile?.rol === 'superadmin';
    const isSenderOfSolicitud = existingSolicitud.id_usuario === user.id;

    // Solo el remitente de la solicitud o un admin puede eliminar/cancelar la solicitud
    if (!isSenderOfSolicitud && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para cancelar o eliminar esta solicitud.' },
        { status: 403 }
      );
    }

    // 3. Eliminar de la base de datos
    const { error } = await supabase
      .from('solicitudes')
      .delete()
      .eq('id_solicitud', idSolicitud);

    if (error) {
      console.error('Error eliminando solicitud de tutoría:', error);
      return NextResponse.json(
        { error: 'Error al eliminar la solicitud.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Solicitud eliminada o cancelada exitosamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Excepción eliminando solicitud de tutoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}
