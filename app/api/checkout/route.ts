// En: frontend/app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server'; // Importamos el cliente de servidor de Supabase

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { projectId, priceId } = await request.json();

    if (!projectId || !priceId) {
      return NextResponse.json({ error: 'Falta el ID del proyecto o el ID del precio' }, { status: 400 });
    }

    // --- ✅ MEJORA 1: Obtenemos el usuario autenticado desde Supabase ---
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para suscribirte.' }, { status: 401 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription', // <-- ¡Esto está correcto!
      
      // --- ✅ MEJORA 2: Asociamos el pago con el email del usuario ---
      // Stripe buscará un cliente con este email o creará uno nuevo.
      // Es fundamental para gestionar las suscripciones.
      customer_email: user.email,

      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,

      // --- ✅ MEJORA 3: Añadimos el userId a los metadatos ---
      // Ahora nuestro webhook sabrá qué usuario y qué proyecto actualizar.
      metadata: {
        projectId: projectId,
        userId: user.id,
      },
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}