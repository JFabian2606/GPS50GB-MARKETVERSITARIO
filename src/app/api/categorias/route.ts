import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('categorias')
      .select('id_categoria, nombre, descripcion')
      .eq('activa', true)
      .order('nombre', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener categorías.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}
