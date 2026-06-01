import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { expandQuery } from '@/lib/search-expander';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para crear una publicación.' },
        { status: 401 }
      );
    }

    // 2. Extraer datos del cuerpo de la petición
    const body = await request.json();
    const { titulo, descripcion, precio, imagen, ubicacion, id_categoria } = body;

    // 3. Validación básica
    if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
      return NextResponse.json(
        { error: 'El título es obligatorio.' },
        { status: 400 }
      );
    }

    // 4. Insertar en la base de datos usando cliente admin para bypasear RLS
    // (La autenticación ya fue validada arriba con auth.getUser())
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('publicacion')
      .insert([
        {
          titulo: titulo.trim(),
          descripcion: descripcion?.trim() || null,
          precio: precio ? parseFloat(precio) : null,
          imagen: imagen || null,
          ubicacion: ubicacion?.trim() || null,
          id_usuario: user.id,
          id_categoria: id_categoria || null,
          estado: 'activo'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error insertando publicación:', error);
      return NextResponse.json(
        { error: 'Error al crear la publicación en la base de datos.', details: error.message },
        { status: 500 }
      );
    }

    // 5. Retornar éxito
    return NextResponse.json(
      { message: 'Publicación creada exitosamente', data },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Excepción creando publicación:', error);
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
    const estado      = searchParams.get('estado') || 'activo';
    const limit       = parseInt(searchParams.get('limit') || '50');
    const q           = searchParams.get('q')?.trim() || '';           // búsqueda de texto
    const categoria   = searchParams.get('id_categoria') || '';        // filtro de categoría

    // Consultar la tabla publicacion haciendo JOIN con profiles y categorias
    let query = supabase
      .from('publicacion')
      .select(`
        *,
        perfil:profiles!publicacion_id_usuario_fkey(nombres, apellidos, programa_academico, telefono),
        categorias(nombre)
      `)
      .order('destacada', { ascending: false })
      .order('destacada_hasta', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filtro de estado
    if (estado !== 'todos') {
      query = query.eq('estado', estado);
    }

    // Búsqueda full-text: título o descripción contienen el texto (expandido semánticamente)
    if (q) {
      const terms = await expandQuery(q);
      if (terms.length > 0) {
        const orClauses = terms.map(term => 
          `titulo.ilike.%${term}%,descripcion.ilike.%${term}%,ubicacion.ilike.%${term}%`
        ).join(',');
        query = query.or(orClauses);
      }
    }

    // Filtro por categoría
    if (categoria) {
      query = query.eq('id_categoria', parseInt(categoria));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listando publicaciones:', error);
      return NextResponse.json(
        { error: 'Error al obtener las publicaciones.', details: error.message },
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
    console.error('Excepción listando publicaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}
