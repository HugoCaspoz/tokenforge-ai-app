// En: app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { projectId, priceId, planId } = await request.json();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // ✅ Lógica para encontrar o crear un cliente de Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabaseUserId: user.id },
      });
      customerId = customer.id;
      // Guardamos el nuevo ID en el perfil del usuario para futuras compras
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer: customerId, // ✅ Usamos el ID de cliente en lugar del email
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      metadata: {
        projectId: projectId, // Puedes mantener esto si lo necesitas
        userId: user.id,      // El userId sigue siendo crucial
        planId: planId,
      },
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}