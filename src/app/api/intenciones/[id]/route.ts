import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { accion, calificacion, comentario } = body;

    // Verificar que la intención existe
    const { data: intencion, error: fetchError } = await supabase
      .from('intenciones_compra')
      .select('*, publicacion(id_publicacion, id_usuario, titulo)')
      .eq('id', id)
      .single();

    if (fetchError || !intencion) {
      return NextResponse.json(
        { error: 'Intención no encontrada.' },
        { status: 404 }
      );
    }

    // Acción: Vendedor marca como vendido
    if (accion === 'marcar_vendido') {
      // Verificar que el usuario es el vendedor
      if (intencion.publicacion.id_usuario !== user.id) {
        return NextResponse.json(
          { error: 'Solo el vendedor puede marcar como vendido.' },
          { status: 403 }
        );
      }

      // Actualizar intención
      const { data, error } = await supabase
        .from('intenciones_compra')
        .update({
          estado: 'marcado_vendedor',
          fecha_marcado_vendedor: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error marcando como vendido:', error);
        return NextResponse.json(
          { error: 'Error al marcar como vendido.', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: 'Marcado como vendido exitosamente', data },
        { status: 200 }
      );
    }

    // Acción: Comprador confirma
    if (accion === 'confirmar') {
      // Verificar que el usuario es el comprador
      if (intencion.id_comprador !== user.id) {
        return NextResponse.json(
          { error: 'Solo el comprador puede confirmar.' },
          { status: 403 }
        );
      }

      // Verificar que está en estado marcado_vendedor
      if (intencion.estado !== 'marcado_vendedor') {
        return NextResponse.json(
          { error: 'La intención no está lista para confirmar.' },
          { status: 400 }
        );
      }

      // Actualizar intención con confirmación
      const updateData: any = {
        estado: 'confirmado',
        fecha_confirmacion: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (calificacion) updateData.calificacion_vendedor = calificacion;
      if (comentario) updateData.comentario_vendedor = comentario;

      const { data, error } = await supabase
        .from('intenciones_compra')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error confirmando compra:', error);
        return NextResponse.json(
          { error: 'Error al confirmar la compra.', details: error.message },
          { status: 500 }
        );
      }

      // También actualizar la publicación como vendida
      const { error: updatePubError } = await supabase
        .from('publicacion')
        .update({
          estado: 'vendido',
          comprador_id: user.id,
          fecha_venta: new Date().toISOString(),
          marcado_por: 'comprador',
          updated_at: new Date().toISOString()
        })
        .eq('id_publicacion', intencion.id_publicacion);

      if (updatePubError) {
        console.error('Error actualizando publicación a vendido:', updatePubError);
        return NextResponse.json(
          { error: 'Error al actualizar el estado de la publicación.', details: updatePubError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: 'Compra confirmada exitosamente', data },
        { status: 200 }
      );
    }

    // Acción: Comprador rechaza
    if (accion === 'rechazar') {
      // Verificar que el usuario es el comprador
      if (intencion.id_comprador !== user.id) {
        return NextResponse.json(
          { error: 'Solo el comprador puede rechazar.' },
          { status: 403 }
        );
      }

      // Actualizar intención como rechazada
      const { data, error } = await supabase
        .from('intenciones_compra')
        .update({
          estado: 'rechazado',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error rechazando compra:', error);
        return NextResponse.json(
          { error: 'Error al rechazar la compra.', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: 'Compra rechazada', data },
        { status: 200 }
      );
    }

    // Acción: Vendedor califica al comprador
    if (accion === 'calificar_comprador') {
      // Verificar que el usuario es el vendedor
      if (intencion.publicacion.id_usuario !== user.id) {
        return NextResponse.json(
          { error: 'Solo el vendedor puede calificar al comprador.' },
          { status: 403 }
        );
      }

      // Verificar que está confirmado
      if (intencion.estado !== 'confirmado') {
        return NextResponse.json(
          { error: 'Solo se pueden calificar compras confirmadas.' },
          { status: 400 }
        );
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (calificacion) updateData.calificacion_comprador = calificacion;
      if (comentario) updateData.comentario_comprador = comentario;

      const { data, error } = await supabase
        .from('intenciones_compra')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error calificando comprador:', error);
        return NextResponse.json(
          { error: 'Error al calificar al comprador.', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: 'Calificación guardada', data },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Acción no reconocida.' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Excepción actualizando intención:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}
