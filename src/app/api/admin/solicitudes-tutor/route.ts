import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (profile?.rol !== 'admin' && profile?.rol !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || 'todos';

    // Consulta principal con join a profiles
    let query = supabase
      .from('solicitudes_tutor')
      .select(`
        id_solicitud,
        id_usuario,
        mensaje,
        area_interes,
        url_notas,
        estado,
        fecha,
        profiles!id_usuario (
          nombres,
          apellidos,
          programa_academico,
          avatar_url,
          telefono
        )
      `)
      .order('fecha', { ascending: false });

    if (estado !== 'todos') {
      query = query.eq('estado', estado);
    }

    const { data: solicitudes, error } = await query;
    if (error) throw error;

    // Enriquecer con emails desde auth.users (solo superadmin)
    let emailMap: Record<string, string> = {};
    if (profile?.rol === 'superadmin') {
      const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: { users } } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
      users?.forEach(u => { emailMap[u.id] = u.email ?? ''; });
    }

    // Estadísticas rápidas
    const stats = {
      total: solicitudes?.length ?? 0,
      pendientes: solicitudes?.filter(s => s.estado === 'pendiente').length ?? 0,
      aceptadas: solicitudes?.filter(s => s.estado === 'aceptada').length ?? 0,
      rechazadas: solicitudes?.filter(s => s.estado === 'rechazada').length ?? 0,
    };

    const enriched = (solicitudes ?? []).map(s => ({
      ...s,
      email: emailMap[s.id_usuario] ?? null,
    }));

    return NextResponse.json({ data: enriched, stats });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
