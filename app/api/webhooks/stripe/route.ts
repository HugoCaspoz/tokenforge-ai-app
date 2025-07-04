// En: frontend/app/api/webhooks/stripe/route.ts

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
  
  // ✅ CORRECCIÓN: Obtenemos la firma directamente desde la petición 'req'.
  // Es más simple y evita el error de tipos con 'Promise'.
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    // Verificamos la firma (asegúrate de que el webhookSecret esté bien configurado en Vercel)
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log(`❌ Error de firma en webhook: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // El resto de tu lógica de 'switch' para manejar los eventos es correcta y no necesita cambios.
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const stripeCustomerId = session.customer as string;

        if (!userId || !stripeCustomerId) {
          throw new Error('Falta userId o stripeCustomerId en los metadatos de la sesión.');
        }

        await supabaseAdmin
          .from('profiles') // ⚠️ Revisa que tu tabla de usuarios/perfiles se llame así
          .update({
            stripe_customer_id: stripeCustomerId,
            plan_activo: 'pro', // O el plan que corresponda
          })
          .eq('id', userId);
        
        console.log(`Usuario ${userId} suscrito. Cliente Stripe ID: ${stripeCustomerId}`);
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
        
        console.log(`Suscripción renovada para el cliente: ${stripeCustomerId}`);
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
          
          console.log(`Suscripción cancelada para el cliente: ${stripeCustomerId}`);
        }
        break;
      }
      
      default:
        console.warn(`Evento no manejado de tipo: ${event.type}`);
    }
  } catch (dbError) {
    console.error('Error al procesar el evento del webhook:', dbError);
    return NextResponse.json({ error: 'Error de base de datos o de lógica interna' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}