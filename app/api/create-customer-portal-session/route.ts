import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    // 1. Buscamos el stripe_customer_id del usuario en nuestro perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.stripe_customer_id) {
      // ✅ Esta es la condición que genera el segundo error que ves
      throw new Error('No se encontró un cliente de Stripe para este usuario.');
    }

    const { stripe_customer_id } = profile;
    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/profile`;

    // 2. Creamos la sesión del portal de cliente en Stripe
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: returnUrl,
    });

    // 3. Devolvemos la URL para redirigir al usuario
    return NextResponse.json({ url: portalSession.url });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error creating customer portal session:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}