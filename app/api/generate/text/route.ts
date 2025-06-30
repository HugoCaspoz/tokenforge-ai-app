// En: frontend/app/api/generate/text/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { purpose } = await request.json();

    if (!purpose) {
      return NextResponse.json({ error: 'El propósito es requerido' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // O el modelo que prefieras
      messages: [
        {
          role: "system",
          content: "Eres un experto en branding y blockchain. Genera un nombre de token creativo, un ticker de 3 a 5 letras, y una descripción de 140 caracteres para un proyecto con el siguiente propósito. Responde en formato JSON con las claves: 'name', 'ticker', 'description'."
        },
        {
          role: "user",
          content: purpose,
        }
      ],
      response_format: { type: "json_object" },
    });

    const generatedText = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(generatedText);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al generar el texto' }, { status: 500 });
  }
}