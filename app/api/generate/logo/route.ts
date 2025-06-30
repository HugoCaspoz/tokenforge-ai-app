// En: frontend/app/api/generate/logo/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Recibimos el nombre y la descripción del token desde el frontend
    const { name, description } = await request.json();

    if (!name || !description) {
      return NextResponse.json({ error: 'El nombre y la descripción son requeridos' }, { status: 400 });
    }

    // Creamos un "prompt" detallado para que DALL-E entienda que queremos un logo
    const prompt = `Un logo para una criptomoneda llamada "${name}". El logo debe ser minimalista, moderno, y memorable. Estilo vector, limpio, sobre un fondo blanco. Debe representar la idea de: "${description}"`;

    const response = await openai.images.generate({
      model: "dall-e-3", // Usamos el modelo DALL-E 3
      prompt: prompt,
      n: 1, // Queremos generar solo una imagen
      size: "1024x1024", // Tamaño estándar de alta calidad
      quality: "standard", // 'standard' es más rápido y barato que 'hd'
    });

    const logoUrl = response.data[0]?.url;

    if (!logoUrl) {
        throw new Error("La IA no pudo generar una URL para el logo.");
    }

    return NextResponse.json({ logoUrl });

  } catch (error) {
    console.error("Error en la generación de logo:", error);
    return NextResponse.json({ error: 'Error al generar el logo con DALL·E' }, { status: 500 });
  }
}