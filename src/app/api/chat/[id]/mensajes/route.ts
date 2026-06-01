import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const id_chat = parseInt(id);

    // Obtener los mensajes del chat ordenados por fecha ascendente
    const { data: mensajes, error } = await supabase
      .from('mensajes')
      .select('*')
      .eq('id_chat', id_chat)
      .order('fecha', { ascending: true });

    if (error) throw error;

    // Marcar como leídos los mensajes que no sean del remitente actual
    await supabase
      .from('mensajes')
      .update({ leido: true })
      .eq('id_chat', id_chat)
      .neq('id_remitente', user.id);

    return NextResponse.json({ data: mensajes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const id_chat = parseInt(id);
    const { mensaje } = await request.json();

    if (!mensaje || !mensaje.trim()) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
    }

    // Insertar el nuevo mensaje
    const { data: nuevoMensaje, error } = await supabase
      .from('mensajes')
      .insert({
        id_chat,
        id_remitente: user.id,
        mensaje: mensaje.trim()
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ data: nuevoMensaje }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

