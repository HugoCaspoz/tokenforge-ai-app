// En: app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const stripeCustomerId = session.customer as string;
        const planId = session.metadata?.planId;

        if (!userId || !stripeCustomerId || !planId) {
          throw new Error('Faltan datos en los metadatos de la sesión.');
        }

        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_customer_id: stripeCustomerId,
            plan_activo: planId,
          })
          .eq('id', userId);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        const nuevaFechaCaducidad = new Date();
        nuevaFechaCaducidad.setMonth(nuevaFechaCaducidad.getMonth() + 1);

        await supabaseAdmin
          .from('profiles')
          .update({ subscripcion_activa_hasta: nuevaFechaCaducidad.toISOString() })
          .eq('stripe_customer_id', stripeCustomerId);
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.cancel_at_period_end || subscription.status === 'canceled') {
          const stripeCustomerId = subscription.customer as string;
          await supabaseAdmin
            .from('profiles')
            .update({ plan_activo: 'free' })
            .eq('stripe_customer_id', stripeCustomerId);
        }
        break;
      }
    }
  } catch (dbError) {
    return NextResponse.json({ error: 'Error de base de datos.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}