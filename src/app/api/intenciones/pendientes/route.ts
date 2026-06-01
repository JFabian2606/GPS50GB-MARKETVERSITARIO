import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado.' },
        { status: 401 }
      );
    }

    // Obtener intenciones pendientes de confirmación para el usuario actual
    const { data, error } = await supabase
      .from('intenciones_compra')
      .select(`
        *,
        publicacion(id_publicacion, titulo, imagen, precio, id_usuario)
      `)
      .eq('id_comprador', user.id)
      .eq('estado', 'marcado_vendedor')
      .order('fecha_marcado_vendedor', { ascending: false });

    // Obtener perfiles de vendedores por separado
    if (data && data.length > 0) {
      const vendedorIds = [...new Set(data.map((i: any) => i.publicacion?.id_usuario).filter(Boolean))];
      const { data: vendedores } = await supabase
        .from('profiles')
        .select('id, nombres, apellidos')
        .in('id', vendedorIds);
      
      const vendedorMap = new Map(vendedores?.map((v: any) => [v.id, v]) || []);
      data.forEach((intencion: any) => {
        if (intencion.publicacion?.id_usuario) {
          intencion.vendedor = vendedorMap.get(intencion.publicacion.id_usuario);
        }
      });
    }

    if (error) {
      console.error('Error obteniendo intenciones pendientes:', error);
      return NextResponse.json(
        { error: 'Error al obtener las intenciones pendientes.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (error: any) {
    console.error('Excepción obteniendo intenciones pendientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}
