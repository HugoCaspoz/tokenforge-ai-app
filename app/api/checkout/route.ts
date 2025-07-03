// En: frontend/app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    // 1. Recibimos tanto el projectId como el priceId desde el frontend
    const { projectId, priceId } = await request.json();

    if (!projectId || !priceId) {
      return NextResponse.json({ error: 'Falta el ID del proyecto o el ID del precio' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      // 2. Usamos el priceId dinámico que nos llega en la petición
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      // ¡Asegúrate de que esta variable de entorno sea correcta en Vercel!
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      metadata: {
        projectId: projectId,
      },
    });

    // 3. Devolvemos el ID de la sesión. ¡Esto es correcto!
    return NextResponse.json({ sessionId: session.id });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}