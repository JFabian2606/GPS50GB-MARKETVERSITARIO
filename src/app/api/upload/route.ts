import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    // 2. Leer el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo.' },
        { status: 400 }
      );
    }

    // 3. Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se aceptan JPEG, PNG, WebP y GIF.' },
        { status: 400 }
      );
    }

    // 4. Validar tamaño (máx 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB.' },
        { status: 400 }
      );
    }

    // 5. Generar nombre único: userId/timestamp-filename
    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    // 6. Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('publicaciones-imagenes')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error subiendo imagen:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir la imagen.', details: uploadError.message },
        { status: 500 }
      );
    }

    // 7. Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('publicaciones-imagenes')
      .getPublicUrl(fileName);

    return NextResponse.json(
      { 
        message: 'Imagen subida exitosamente.',
        url: publicUrlData.publicUrl,
        path: fileName
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error en upload:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.', details: error.message },
      { status: 500 }
    );
  }
}
