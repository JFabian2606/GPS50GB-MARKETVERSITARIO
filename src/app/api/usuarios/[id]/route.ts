import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const idToUpdate = (await params).id;

    // 1. Verificar sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.rol !== 'admin' && profile.rol !== 'superadmin')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // 3. Procesar payload
    const body = await request.json();
    
    // Si es admin, no puede modificar superadmins
    if (profile.rol === 'admin') {
      const { data: targetProfile } = await supabase.from('profiles').select('rol').eq('id', idToUpdate).single();
      if (targetProfile && (targetProfile.rol === 'superadmin' || targetProfile.rol === 'admin')) {
        return NextResponse.json({ error: 'No tienes permisos para modificar a este usuario' }, { status: 403 });
      }
      // y tampoco puede promover a admin o superadmin
      if (body.rol && body.rol !== 'estudiante' && body.rol !== 'tutor') {
        return NextResponse.json({ error: 'No puedes asignar este rol' }, { status: 403 });
      }
    }

    // Preparar update de forma segura
    const updateData: any = {};
    const allowedFields = ['nombres', 'apellidos', 'documento_identidad', 'tipo_documento', 'genero', 'telefono', 'programa_academico', 'rol', 'estado'];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', idToUpdate)
      .select()
      .single();

    if (updateError) {
      console.error('Error update user:', updateError);
      return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (error: any) {
    console.error('Error interno:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
