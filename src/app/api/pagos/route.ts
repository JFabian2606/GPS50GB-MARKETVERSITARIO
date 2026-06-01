import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Genera una referencia de transacción única
function generarReferencia(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MKV-${timestamp}-${random}`;
}

// Simulación de procesamiento de pago
// En producción esto sería la llamada a Wompi / PayU / MercadoPago
function simularPago(metodoPago: string, datos: any): { aprobado: boolean; mensaje: string } {
  // Simular validaciones básicas de tarjeta
  if (metodoPago === 'tarjeta') {
    const numero = datos.numero?.replace(/\s/g, '') || '';
    if (numero.length < 16) return { aprobado: false, mensaje: 'Número de tarjeta inválido' };
    if (!datos.fecha || !datos.cvv) return { aprobado: false, mensaje: 'Datos de tarjeta incompletos' };
    // Tarjeta de prueba que siempre falla: 4000000000000002
    if (numero === '4000000000000002') return { aprobado: false, mensaje: 'Tarjeta declinada por el banco' };
  }
  if (metodoPago === 'nequi') {
    if (!datos.telefono || datos.telefono.length < 10) return { aprobado: false, mensaje: 'Número de celular inválido' };
  }
  // 95% de probabilidad de éxito en simulación
  const aprobado = Math.random() > 0.05;
  return {
    aprobado,
    mensaje: aprobado ? 'Pago aprobado' : 'Transacción rechazada por el procesador'
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo_item, id_item, metodo_pago, datos_pago } = body;

    // Validaciones
    if (!['publicacion', 'tutoria'].includes(tipo_item)) {
      return NextResponse.json({ error: 'Tipo de item inválido' }, { status: 400 });
    }
    if (!id_item || !metodo_pago) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Verificar que el item pertenece al usuario
    const tabla = tipo_item === 'publicacion' ? 'publicacion' : 'tutoria';
    const campoId = tipo_item === 'publicacion' ? 'id_publicacion' : 'id_tutoria';
    
    const { data: item, error: itemError } = await supabase
      .from(tabla)
      .select('id_usuario, destacada, destacada_hasta')
      .eq(campoId, id_item)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (item.id_usuario !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para destacar este item' }, { status: 403 });
    }

    // Verificar si ya está destacado y vigente
    if (item.destacada && item.destacada_hasta && new Date(item.destacada_hasta) > new Date()) {
      return NextResponse.json({
        error: 'Este item ya está destacado',
        destacada_hasta: item.destacada_hasta
      }, { status: 409 });
    }

    // Procesar pago (simulación)
    const resultado = simularPago(metodo_pago, datos_pago);
    const referencia = generarReferencia();
    const ultimos4 = metodo_pago === 'tarjeta'
      ? (datos_pago?.numero?.replace(/\s/g, '') || '').slice(-4)
      : null;

    // Registrar el pago siempre (exitoso o fallido)
    const { error: pagoError } = await supabase
      .from('pagos')
      .insert({
        id_usuario: user.id,
        tipo_item,
        id_item,
        monto: 10000,
        estado: resultado.aprobado ? 'completado' : 'fallido',
        referencia,
        metodo_pago,
        ultimos4
      });

    if (pagoError) {
      console.error('Error registrando pago:', pagoError);
    }

    if (!resultado.aprobado) {
      return NextResponse.json({
        success: false,
        referencia,
        message: resultado.mensaje
      }, { status: 402 });
    }

    // Si el pago fue exitoso, destacar el item por 7 días
    const destacada_hasta = new Date();
    destacada_hasta.setDate(destacada_hasta.getDate() + 7);

    const { error: updateError } = await supabase
      .from(tabla)
      .update({
        destacada: true,
        destacada_hasta: destacada_hasta.toISOString()
      })
      .eq(campoId, id_item);

    if (updateError) {
      console.error('Error actualizando destacado:', updateError);
      return NextResponse.json({ error: 'Pago procesado pero error al actualizar el item' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      referencia,
      message: 'Pago aprobado. Tu publicación está siendo destacada por 7 días.',
      destacada_hasta: destacada_hasta.toISOString()
    });

  } catch (err: any) {
    console.error('Error en pagos:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

    const isAdmin = profile?.rol === 'admin' || profile?.rol === 'superadmin';

    let query = supabase
      .from('pagos')
      .select('*, profiles(nombres, apellidos)')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('id_usuario', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
