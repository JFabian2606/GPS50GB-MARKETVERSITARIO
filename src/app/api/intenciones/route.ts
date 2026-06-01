import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Generar código de transacción único
function generarCodigoTransaccion(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = 'TRX';
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

export async function POST(request: Request) {
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

    // 2. Extraer datos del cuerpo de la petición
    const body = await request.json();
    const { id_publicacion } = body;

    // 3. Validación básica
    if (!id_publicacion) {
      return NextResponse.json(
        { error: 'El ID de la publicación es requerido.' },
        { status: 400 }
      );
    }

    // 4. Verificar que la publicación existe
    const { data: publicacion, error: pubError } = await supabase
      .from('publicacion')
      .select('id_publicacion, titulo, id_usuario')
      .eq('id_publicacion', id_publicacion)
      .single();

    if (pubError || !publicacion) {
      return NextResponse.json(
        { error: 'Publicación no encontrada.' },
        { status: 404 }
      );
    }

    // 5. Verificar que el usuario no sea el vendedor
    if (publicacion.id_usuario === user.id) {
      return NextResponse.json(
        { error: 'No puedes registrar intención en tu propia publicación.' },
        { status: 400 }
      );
    }

    // 6. Verificar si ya existe una intención de este usuario para esta publicación
    const { data: existingIntencion } = await supabase
      .from('intenciones_compra')
      .select('id, codigo_transaccion, estado')
      .eq('id_publicacion', id_publicacion)
      .eq('id_comprador', user.id)
      .single();

    if (existingIntencion) {
      // Si ya existe, retornar el código existente
      return NextResponse.json(
        { 
          message: 'Intención ya registrada', 
          codigo_transaccion: existingIntencion.codigo_transaccion,
          estado: existingIntencion.estado
        },
        { status: 200 }
      );
    }

    // 7. Generar código único y crear intención
    const codigo_transaccion = generarCodigoTransaccion();

    const { data, error } = await supabase
      .from('intenciones_compra')
      .insert([
        {
          id_publicacion,
          id_comprador: user.id,
          codigo_transaccion,
          estado: 'clickeado'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creando intención:', error);
      return NextResponse.json(
        { error: 'Error al registrar la intención.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Intención registrada exitosamente', data, codigo_transaccion },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Excepción creando intención:', error);
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
    
    const id_publicacion = searchParams.get('id_publicacion');
    
    if (!id_publicacion) {
      return NextResponse.json(
        { error: 'El ID de la publicación es requerido.' },
        { status: 400 }
      );
    }

    // Obtener intenciones para una publicación específica
    const { data, error } = await supabase
      .from('intenciones_compra')
      .select(`
        *,
        comprador:profiles!intenciones_compra_id_comprador_fkey(nombres, apellidos, telefono)
      `)
      .eq('id_publicacion', id_publicacion)
      .order('fecha_clic', { ascending: false });

    if (error) {
      console.error('Error obteniendo intenciones:', error);
      return NextResponse.json(
        { error: 'Error al obtener las intenciones.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (error: any) {
    console.error('Excepción obteniendo intenciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}
