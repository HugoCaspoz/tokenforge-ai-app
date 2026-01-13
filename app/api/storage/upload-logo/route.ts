// En: frontend/app/api/storage/upload-logo/route.ts

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { imageUrl, projectId } = await request.json();

  if (!imageUrl) {
    return NextResponse.json({ error: 'Falta la URL de la imagen' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    // 1. Descargar la imagen de la URL temporal de DALL-E
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('No se pudo descargar la imagen desde la URL proporcionada.');
    }
    const imageBlob = await response.blob();

    // 2. Subir la imagen a Supabase Storage
    // Si no hay projectId, usamos 'temp' como prefijo
    const filenameId = projectId || 'temp';
    const filePath = `public/${filenameId}-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, imageBlob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 3. Obtener la URL pública y permanente de la imagen subida
    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl(uploadData.path);

    const permanentUrl = publicUrlData.publicUrl;

    // 4. Actualizar la tabla 'projects' con la nueva URL permanente (SOLO SI HAY PROJECT ID)
    if (projectId) {
      const { error: dbError } = await supabase
        .from('projects')
        .update({ logo_url: permanentUrl })
        .eq('id', projectId);

      if (dbError) {
        throw dbError;
      }
    }

    // 5. Devolver la URL permanente al cliente
    return NextResponse.json({ permanentUrl });

  } catch (err) {
    console.error('Error en el proceso de subida del logo:', err);
    // Supabase errors are often objects with a message property but not instances of Error
    const errorMessage = (err as any)?.message || (err instanceof Error ? err.message : 'Error desconocido');
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
