// En: frontend/app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { projectId } = await request.json(); // <-- Recibimos el projectId
    if (!projectId) {
      return NextResponse.json({ error: 'Falta el ID del proyecto' }, { status: 400 });
    }
    
    const PRICE_ID = 'price_1Rg0WSF59UuEseg4gE59BybL'; // ¡Usa tu ID real!

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/create`,
      // --- AÑADIMOS LOS METADATOS ---
      metadata: {
        projectId: projectId,
      },
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}