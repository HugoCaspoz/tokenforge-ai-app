// En: frontend/app/api/generate/logo/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();

    if (!name || !description) {
      return NextResponse.json({ error: 'El nombre y la descripción son requeridos' }, { status: 400 });
    }

    const prompt = `Un logo para una criptomoneda llamada "${name}". El logo debe ser minimalista, moderno, y memorable. Estilo vector, limpio, sobre un fondo blanco. Debe representar la idea de: "${description}"`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    // --- BLOQUE CORREGIDO ---
    // Usamos "optional chaining" (?.) para acceder de forma segura a las propiedades.
    // Esto previene el error si 'data' o el primer elemento no existen.
    const logoUrl = response.data?.[0]?.url;

    // Añadimos una comprobación robusta. Si logoUrl es nulo, undefined o una cadena vacía, lanzamos un error.
    if (!logoUrl) {
        console.error("Respuesta inválida de la API de DALL-E:", response); // Log para nuestra depuración
        throw new Error("La IA no pudo generar una URL válida para el logo.");
    }

    return NextResponse.json({ logoUrl });
    // --- FIN DEL BLOQUE CORREGIDO ---

  } catch (error) {
    console.error("Error en la generación de logo:", error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Error al generar el logo con DALL·E' }, { status: 500 });
  }
}