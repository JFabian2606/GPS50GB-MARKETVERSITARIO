import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

    // 2. Actualizar el rol del usuario a 'tutor' en profiles
    const { data, error } = await supabase
      .from('profiles')
      .update({ rol: 'tutor' })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error al registrar tutor:', error);
      return NextResponse.json(
        { error: 'Error al registrarse como tutor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (error: any) {
    console.error('Error interno en registrar-tutor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
