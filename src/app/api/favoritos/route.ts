import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener favoritos enriquecidos con datos de publicaciones y tutorías
    const { data: favoritos, error } = await supabase
      .from('favoritos')
      .select(`
        id_favorito,
        id_publicacion,
        id_tutoria,
        created_at,
        publicacion:publicacion(
          id_publicacion,
          titulo,
          descripcion,
          precio,
          estado,
          imagen,
          ubicacion,
          created_at,
          destacada,
          destacada_hasta,
          categorias:id_categoria(id_categoria, nombre)
        ),
        tutoria:tutoria(
          id_tutoria,
          titulo,
          descripcion,
          asignatura,
          nivel,
          precio,
          created_at,
          destacada,
          destacada_hasta
        )
      `)
      .eq('id_usuario', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener favoritos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: favoritos || [] });
  } catch (err: any) {
    console.error('Error en GET /api/favoritos:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id_publicacion, id_tutoria } = body;

    if (!id_publicacion && !id_tutoria) {
      return NextResponse.json({ error: 'Debes proporcionar id_publicacion o id_tutoria' }, { status: 400 });
    }

    // Insertar favorito
    const { data, error } = await supabase
      .from('favoritos')
      .insert({
        id_usuario: user.id,
        id_publicacion: id_publicacion || null,
        id_tutoria: id_tutoria || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al agregar favorito:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, mensaje: 'Favorito agregado con éxito' }, { status: 201 });
  } catch (err: any) {
    console.error('Error en POST /api/favoritos:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id_publicacion = searchParams.get('id_publicacion');
    const id_tutoria = searchParams.get('id_tutoria');

    if (!id_publicacion && !id_tutoria) {
      return NextResponse.json({ error: 'Debes proporcionar id_publicacion o id_tutoria' }, { status: 400 });
    }

    let deleteQuery = supabase
      .from('favoritos')
      .delete()
      .eq('id_usuario', user.id);

    if (id_publicacion) {
      deleteQuery = deleteQuery.eq('id_publicacion', parseInt(id_publicacion));
    } else if (id_tutoria) {
      deleteQuery = deleteQuery.eq('id_tutoria', parseInt(id_tutoria));
    }

    const { error } = await deleteQuery;

    if (error) {
      console.error('Error al eliminar favorito:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mensaje: 'Favorito eliminado con éxito' });
  } catch (err: any) {
    console.error('Error en DELETE /api/favoritos:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
