import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single();
    const isAdmin = profile?.rol === 'admin' || profile?.rol === 'superadmin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 403 });
    }

    const json = await request.json();
    const { estado } = json; // 'aceptada' o 'rechazada'

    if (!['aceptada', 'rechazada'].includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    // Actualizar el estado de la solicitud
    const { data, error } = await supabase
      .from('solicitudes_tutor')
      .update({ estado })
      .eq('id_solicitud', id)
      .select()
      .single();

    if (error) throw error;

    // Si fue aceptada, actualizar el rol del usuario a 'tutor'
    if (estado === 'aceptada' && data?.id_usuario) {
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ rol: 'tutor' })
        .eq('id', data.id_usuario);

      if (roleError) throw roleError;
    }

    return NextResponse.json({ data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
