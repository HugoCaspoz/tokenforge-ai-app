import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscamos el perfil del usuario para obtener su ID de cliente de Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.stripe_customer_id) {
      return NextResponse.json({ error: 'No se encontró un cliente de Stripe para este usuario.' }, { status: 404 });
    }

    // Creamos una sesión en el Portal del Cliente
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.error("Error al crear la sesión del portal:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
