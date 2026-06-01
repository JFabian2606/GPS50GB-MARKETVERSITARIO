import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { expandQuery } from '@/lib/search-expander';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para crear una tutoría.' },
        { status: 401 }
      );
    }

    // 2. Verificar rol del usuario (estudiantes, tutores, admins y superadmins)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Error al verificar el perfil del usuario.' },
        { status: 500 }
      );
    }

    if (
      profile.rol !== 'estudiante' &&
      profile.rol !== 'tutor' &&
      profile.rol !== 'admin' &&
      profile.rol !== 'superadmin'
    ) {
      return NextResponse.json(
        { error: 'No autorizado. Debes ser estudiante, tutor o administrador para publicar tutorías.' },
        { status: 403 }
      );
    }

    // 3. Extraer datos del cuerpo de la petición
    const body = await request.json();
    const { titulo, descripcion, asignatura, nivel, precio, id_horario } = body;

    // 4. Validación básica
    if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
      return NextResponse.json(
        { error: 'El título es obligatorio.' },
        { status: 400 }
      );
    }

    if (!asignatura || typeof asignatura !== 'string' || asignatura.trim() === '') {
      return NextResponse.json(
        { error: 'La asignatura es obligatoria.' },
        { status: 400 }
      );
    }

    if (titulo.length > 150) {
      return NextResponse.json(
        { error: 'El título no puede superar los 150 caracteres.' },
        { status: 400 }
      );
    }

    if (asignatura.length > 100) {
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

    // 5. Insertar en la base de datos
    const { data, error } = await supabase
      .from('tutoria')
      .insert([
        {
          titulo: titulo.trim(),
          descripcion: descripcion?.trim() || null,
          asignatura: asignatura.trim(),
          nivel: nivel?.trim() || null,
          precio: precio ? parseFloat(precio) : null,
          id_usuario: user.id,
          id_horario: id_horario || null
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error insertando tutoría:', error);
      return NextResponse.json(
        { error: 'Error al crear la tutoría en la base de datos.', details: error.message },
        { status: 500 }
      );
    }

    // Si el usuario es un estudiante, lo actualizamos a rol 'tutor' automáticamente
    if (profile.rol === 'estudiante') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ rol: 'tutor' })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error al actualizar rol de estudiante a tutor:', updateError);
      }
    }

    // 6. Retornar éxito
    return NextResponse.json(
      { message: 'Tutoría creada exitosamente', data },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Excepción creando tutoría:', error);
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
    
    // Filtros opcionales
    const limit       = parseInt(searchParams.get('limit') || '50');
    const q           = searchParams.get('q')?.trim() || '';           // búsqueda de texto en título o descripción
    const asignatura  = searchParams.get('asignatura')?.trim() || '';
    const nivel       = searchParams.get('nivel')?.trim() || '';
    const tutorId     = searchParams.get('id_usuario')?.trim() || '';

    // Consultar la tabla tutoria haciendo JOIN con profiles
    let query = supabase
      .from('tutoria')
      .select(`
        *,
        perfil:profiles(nombres, apellidos, programa_academico, telefono, rol)
      `)
      .order('destacada', { ascending: false })
      .order('destacada_hasta', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    // Búsqueda de texto (expandida semánticamente)
    if (q) {
      const terms = await expandQuery(q);
      if (terms.length > 0) {
        const orClauses = terms.map(term => 
          `titulo.ilike.%${term}%,descripcion.ilike.%${term}%,asignatura.ilike.%${term}%`
        ).join(',');
        query = query.or(orClauses);
      }
    }

    // Filtro por asignatura
    if (asignatura) {
      query = query.ilike('asignatura', `%${asignatura}%`);
    }

    // Filtro por nivel
    if (nivel) {
      query = query.eq('nivel', nivel);
    }

    // Filtro por tutor específico
    if (tutorId) {
      query = query.eq('id_usuario', tutorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listando tutorías:', error);
      return NextResponse.json(
        { error: 'Error al obtener las tutorías.', details: error.message },
        { status: 500 }
      );
    }

    // Procesar destacados activos y corregir expirados
    const now = new Date();
    const processedData = (data || []).map(item => {
      const isExpired = item.destacada && item.destacada_hasta && new Date(item.destacada_hasta) < now;
      if (isExpired) {
        return { ...item, destacada: false, destacada_hasta: null };
      }
      return item;
    });

    // Reordenar para asegurar que los destacados activos estén de primero
    processedData.sort((a, b) => {
      const aFeat = a.destacada ? 1 : 0;
      const bFeat = b.destacada ? 1 : 0;
      if (aFeat !== bFeat) return bFeat - aFeat;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ data: processedData }, { status: 200 });

  } catch (error: any) {
    console.error('Excepción listando tutorías:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}
