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
        { error: 'El ID de la tutoría es requerido.' },
        { status: 400 }
      );
    }

    const idTutoria = parseInt(id, 10);
    if (isNaN(idTutoria)) {
      return NextResponse.json(
        { error: 'El ID de la tutoría debe ser un número válido.' },
        { status: 400 }
      );
    }

    // Consultar la tutoría específica haciendo JOIN con profiles
    const { data, error } = await supabase
      .from('tutoria')
      .select(`
        *,
        perfil:profiles(nombres, apellidos, programa_academico, telefono, rol)
      `)
      .eq('id_tutoria', idTutoria)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 significa que no se encontró ninguna fila con ese ID
        return NextResponse.json(
          { error: 'Tutoría no encontrada.' },
          { status: 404 }
        );
      }
      console.error('Error obteniendo el detalle de la tutoría:', error);
      return NextResponse.json(
        { error: 'Error al obtener el detalle de la tutoría.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (error: any) {
    console.error('Excepción obteniendo detalle de tutoría:', error);
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
        { error: 'No autorizado. Debes iniciar sesión para editar una tutoría.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'El ID de la tutoría es requerido.' },
        { status: 400 }
      );
    }

    const idTutoria = parseInt(id, 10);
    if (isNaN(idTutoria)) {
      return NextResponse.json(
        { error: 'El ID de la tutoría debe ser un número válido.' },
        { status: 400 }
      );
    }

    // 2. Verificar que la tutoría existe y pertenece al usuario actual
    const { data: existingTutoria, error: fetchError } = await supabase
      .from('tutoria')
      .select('id_usuario')
      .eq('id_tutoria', idTutoria)
      .single();

    if (fetchError || !existingTutoria) {
      return NextResponse.json(
        { error: 'Tutoría no encontrada.' },
        { status: 404 }
      );
    }

    // Obtener rol del usuario para permitir que admins modifiquen
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.rol === 'admin' || profile?.rol === 'superadmin';

    if (existingTutoria.id_usuario !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta tutoría.' },
        { status: 403 }
      );
    }

    // 3. Extraer datos a actualizar
    const body = await request.json();
    const { titulo, descripcion, asignatura, nivel, precio, id_horario } = body;

    // Validación básica: Si envían título o asignatura, no pueden estar vacíos
    if (titulo !== undefined && (typeof titulo !== 'string' || titulo.trim() === '')) {
      return NextResponse.json(
        { error: 'El título no puede estar vacío.' },
        { status: 400 }
      );
    }

    if (asignatura !== undefined && (typeof asignatura !== 'string' || asignatura.trim() === '')) {
      return NextResponse.json(
        { error: 'La asignatura no puede estar vacía.' },
        { status: 400 }
      );
    }

    if (titulo && titulo.length > 150) {
      return NextResponse.json(
        { error: 'El título no puede superar los 150 caracteres.' },
        { status: 400 }
      );
    }

    if (asignatura && asignatura.length > 100) {
      return NextResponse.json(
        { error: 'La asignatura no puede superar los 100 caracteres.' },
        { status: 400 }
      );
    }

    if (nivel && nivel.length > 50) {
      return NextResponse.json(
        { error: 'El nivel no puede superar los 50 caracteres.' },
        { status: 400 }
      );
    }

    // Preparar objeto de actualización
    const updateData: any = {};
    if (titulo !== undefined) updateData.titulo = titulo.trim();
    if (descripcion !== undefined) updateData.descripcion = descripcion?.trim() || null;
    if (asignatura !== undefined) updateData.asignatura = asignatura.trim();
    if (nivel !== undefined) updateData.nivel = nivel?.trim() || null;
    if (precio !== undefined) updateData.precio = precio ? parseFloat(precio) : null;
    if (id_horario !== undefined) updateData.id_horario = id_horario || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron datos para actualizar.' },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    // 4. Actualizar en la base de datos
    const { data, error } = await supabase
      .from('tutoria')
      .update(updateData)
      .eq('id_tutoria', idTutoria)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando tutoría:', error);
      return NextResponse.json(
        { error: 'Error al actualizar la tutoría.', details: error.message },
        { status: 500 }
      );
    }

    // 5. Retornar éxito
    return NextResponse.json(
      { message: 'Tutoría actualizada exitosamente', data },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Excepción actualizando tutoría:', error);
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
        { error: 'No autorizado. Debes iniciar sesión para eliminar una tutoría.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'El ID de la tutoría es requerido.' },
        { status: 400 }
      );
    }

    const idTutoria = parseInt(id, 10);
    if (isNaN(idTutoria)) {
      return NextResponse.json(
        { error: 'El ID de la tutoría debe ser un número válido.' },
        { status: 400 }
      );
    }

    // 2. Verificar que la tutoría existe
    const { data: existingTutoria, error: fetchError } = await supabase
      .from('tutoria')
      .select('id_usuario')
      .eq('id_tutoria', idTutoria)
      .single();

    if (fetchError || !existingTutoria) {
      return NextResponse.json(
        { error: 'Tutoría no encontrada.' },
        { status: 404 }
      );
    }

    // Obtener rol del usuario para permitir que admins eliminen
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.rol === 'admin' || profile?.rol === 'superadmin';

    if (existingTutoria.id_usuario !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta tutoría.' },
        { status: 403 }
      );
    }

    // 3. Eliminar en la base de datos
    const { error } = await supabase
      .from('tutoria')
      .delete()
      .eq('id_tutoria', idTutoria);

    if (error) {
      console.error('Error eliminando tutoría:', error);
      return NextResponse.json(
        { error: 'Error al eliminar la tutoría.', details: error.message },
        { status: 500 }
      );
    }

    // 4. Retornar éxito
    return NextResponse.json(
      { message: 'Tutoría eliminada exitosamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Excepción eliminando tutoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}
