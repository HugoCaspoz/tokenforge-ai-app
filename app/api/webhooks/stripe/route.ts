// En: app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PLAN_DETAILS } from '@/lib/plans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Función auxiliar para actualizar el perfil del usuario
async function updateUserSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0].price.id;
  const customerId = subscription.customer as string;

  const planKey = Object.entries(PLAN_DETAILS).find(
    ([_, plan]) => process.env[`STRIPE_${plan.id.toUpperCase()}_PRICE_ID`] === priceId
  )?.[0] as keyof typeof PLAN_DETAILS;

  if (!planKey) {
    console.error(`Price ID ${priceId} no se encontró en las variables de entorno.`);
    return;
  }
  
  const planLimits = PLAN_DETAILS[planKey].limits;

  await supabaseAdmin
    .from('profiles')
    .update({
      plan_activo: planKey,
      is_subscribed: true,
      subscripcion_activa_hasta: new Date(subscription.current_period_end * 1000).toISOString(),
      polygon_tokens_allowed: planLimits['0x89'],
      bnb_tokens_allowed: planLimits['0x38'],
      ethereum_tokens_allowed: planLimits['0x1'],
      // Al crear o renovar, reseteamos el uso
      polygon_tokens_used: 0,
      bnb_tokens_used: 0,
      ethereum_tokens_used: 0,
    })
    .eq('stripe_customer_id', customerId);
}


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
      // ✅ Se usa solo para asegurar que el customer ID está en la base de datos
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const stripeCustomerId = session.customer as string;
        
        if (userId && stripeCustomerId) {
          await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', userId);
        }
        break;
      }

      // ✅ Evento principal para la creación inicial y upgrades/downgrades
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateUserSubscription(subscription);
        break;
      }
      
      // ✅ Evento para renovaciones (también resetea los contadores)
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.billing_reason === 'subscription_cycle') {
          // La información de la suscripción (a veces es un string, a veces un objeto)
          const subscriptionData = invoice.lines.data[0]?.subscription;

          if (!subscriptionData) {
            console.error('No se encontró información de la suscripción en la factura.');
            break;
          }

          let subscription: Stripe.Subscription;

          // ✅ FIX: Comprobamos si ya tenemos el objeto completo o solo el ID (string)
          if (typeof subscriptionData === 'string') {
            // Si es un string (ID), lo recuperamos con la API
            subscription = await stripe.subscriptions.retrieve(subscriptionData);
          } else {
            // Si ya es un objeto, lo usamos directamente
            subscription = subscriptionData;
          }

          // Si por alguna razón no tenemos la suscripción, salimos.
          if (!subscription) {
            console.error('No se pudo obtener el objeto de la suscripción.');
            break;
          }
          
          // Llamamos a la función auxiliar para actualizar la base de datos
          await updateUserSubscription(subscription);
        }
        break;
      }

      // ✅ Evento para cuando la suscripción se cancela definitivamente
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const freePlanLimits = PLAN_DETAILS.free.limits;
        await supabaseAdmin
          .from('profiles')
          .update({
            plan_activo: 'free',
            is_subscribed: false,
            subscripcion_activa_hasta: null,
            polygon_tokens_allowed: freePlanLimits['0x89'],
            bnb_tokens_allowed: freePlanLimits['0x38'],
            ethereum_tokens_allowed: freePlanLimits['0x1'],
          })
          .eq('stripe_customer_id', subscription.customer as string);
        break;
      }
    }
  } catch (dbError) {
    const errorMessage = dbError instanceof Error ? dbError.message : 'Error procesando el webhook.';
    console.error(errorMessage, dbError);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}