import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single();
    const isAdmin = profile?.rol === 'admin' || profile?.rol === 'superadmin';
    const isTutor = profile?.rol === 'tutor';

    const notificaciones: any[] = [];

    // Si es administrador, buscar solicitudes para ser tutor
    if (isAdmin) {
      const { data: solicitudesRol, error: err1 } = await supabase
        .from('solicitudes_tutor')
        .select('id_solicitud, fecha, mensaje, profiles!id_usuario(nombres, apellidos)')
        .eq('estado', 'pendiente');

      if (err1) {
        console.error("Error in GET /api/notificaciones [solicitudes_tutor]:", err1);
      }

      if (!err1 && solicitudesRol) {
        solicitudesRol.forEach((s: any) => {
          notificaciones.push({
            id: `rol-${s.id_solicitud}`,
            tipo: 'solicitud_rol',
            titulo: 'Solicitud para ser Tutor',
            mensaje: `${s.profiles?.nombres} ${s.profiles?.apellidos} quiere ser tutor.`,
            fecha: s.fecha,
            link: '/usuarios' // O una página para gestionar esto
          });
        });
      }
    }

    // Si es tutor o admin, buscar solicitudes de sus tutorías o todas si es admin
    if (isTutor || isAdmin) {
      let query = supabase
        .from('solicitudes')
        .select('id_solicitud, fecha, mensaje, perfiles:profiles!id_usuario(nombres, apellidos), tutoria!inner(id_usuario, titulo)')
        .eq('estado', 'pendiente');

      if (!isAdmin) {
        query = query.eq('tutoria.id_usuario', user.id);
      }

      const { data: solicitudesTutoria, error: err2 } = await query;

      if (err2) {
        console.error("Error in GET /api/notificaciones [solicitudes]:", err2);
      }

      if (!err2 && solicitudesTutoria) {
        solicitudesTutoria.forEach((s: any) => {
          notificaciones.push({
            id: `tutoria-${s.id_solicitud}`,
            tipo: 'solicitud_tutoria',
            titulo: 'Solicitud de Tutoría',
            mensaje: `${s.perfiles?.nombres} solicitó: ${s.tutoria?.titulo}`,
            fecha: s.fecha,
            link: `/usuarios/${user.id}` // Donde pueda ver sus solicitudes recibidas
          });
        });
      }
    }

    // Buscar intenciones pendientes de confirmación (comprador)
    const { data: intencionesPendientes, error: err3 } = await supabase
      .from('intenciones_compra')
      .select(`
        *,
        publicacion(id_publicacion, titulo, imagen, precio, id_usuario)
      `)
      .eq('id_comprador', user.id)
      .eq('estado', 'marcado_vendedor')
      .order('fecha_marcado_vendedor', { ascending: false });

    if (err3) {
      console.error("Error in GET /api/notificaciones [intenciones]:", err3);
    }

    if (!err3 && intencionesPendientes && intencionesPendientes.length > 0) {
      const vendedorIds = [...new Set(intencionesPendientes.map((i: any) => i.publicacion?.id_usuario).filter(Boolean))];
      const { data: vendedores } = await supabase
        .from('profiles')
        .select('id, nombres, apellidos')
        .in('id', vendedorIds);

      const vendedorMap = new Map(vendedores?.map((v: any) => [v.id, v]) || []);

      intencionesPendientes.forEach((intencion: any) => {
        const vendedor = vendedorMap.get(intencion.publicacion?.id_usuario);
        notificaciones.push({
          id: `intencion-${intencion.id}`,
          tipo: 'intencion_pendiente',
          titulo: '¡Confirmación de Compra!',
          mensaje: `${vendedor?.nombres} ${vendedor?.apellidos} indica que te vendió: "${intencion.publicacion?.titulo}"`,
          fecha: intencion.fecha_marcado_vendedor,
          link: `/publicaciones/${intencion.publicacion?.id_publicacion}`,
          payload: {
            id: intencion.id,
            vendedor: vendedor,
            publicacion: intencion.publicacion
          }
        });
      });
    }

    // Ordenar por fecha descendente
    notificaciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return NextResponse.json({ data: notificaciones });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
