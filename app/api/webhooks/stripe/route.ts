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

// ✅ --- NUEVA FUNCIÓN GET PARA LA PRUEBA --- ✅
// Esta función es solo para depuración.
export async function GET(req: Request) {
  // Este log TIENE que aparecer si la función se ejecuta.
  console.log("🟢 PRUEBA GET: ¡El endpoint ha sido llamado manualmente desde el navegador!");
  
  return NextResponse.json({ 
    status: "success",
    message: "Prueba de GET exitosa. Revisa los logs de la función en Vercel. Deberías ver un mensaje que empieza con '🟢 PRUEBA GET'." 
  });
}


// --- TU CÓDIGO ANTERIOR PARA EL WEBHOOK (POST) SE MANTIENE ---

// Función auxiliar para actualizar el perfil del usuario
async function updateUserSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0].price.id;
  const customerId = subscription.customer as string;

  console.log(`🟡 DEBUG: Webhook POST recibido para actualizar suscripción.`);
  console.log(`🟡 DEBUG: Price ID recibido de Stripe: ${priceId}`);

  const planKey = Object.entries(PLAN_DETAILS).find(([key, plan]) => {
    const envVarName = `STRIPE_${plan.id.toUpperCase()}_PRICE_ID`;
    const envVarValue = process.env[envVarName];
    console.log(`🟡 DEBUG: Comparando con la variable "${envVarName}". Valor en Vercel: "${envVarValue}"`);
    return envVarValue === priceId;
  })?.[0] as keyof typeof PLAN_DETAILS;

  if (!planKey) {
    console.error(`🔴 ERROR: No se encontró un plan que coincida con el Price ID "${priceId}". La actualización del perfil se ha detenido.`);
    return;
  }

  console.log(`🟢 ÉXITO: Plan encontrado: "${planKey}". Procediendo a actualizar la base de datos.`);
  const planLimits = PLAN_DETAILS[planKey].limits;

  await supabaseAdmin
    .from('profiles')
    .update({
      plan_activo: planKey,
      is_subscribed: true,
      subscripcion_activa_hasta: new Date((subscription as any).current_period_end * 1000).toISOString(),
      polygon_tokens_allowed: planLimits['0x89'],
      bnb_tokens_allowed: planLimits['0x38'],
      ethereum_tokens_allowed: planLimits['0x1'],
      polygon_tokens_used: 0,
      bnb_tokens_used: 0,
      ethereum_tokens_used: 0,
    })
    .eq('stripe_customer_id', customerId);
}


export async function POST(req: Request) {
  console.log("🟢 WEBHOOK INVOCADO POR POST (Stripe): ¡La función ha comenzado a ejecutarse!");
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`🔴 ERROR de firma de webhook: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  try {
    switch (event.type) {
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
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateUserSubscription(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === 'subscription_cycle') {
          const subscriptionData = invoice.lines.data[0]?.subscription;
          if (!subscriptionData) {
            break;
          }
          let subscription: Stripe.Subscription;
          if (typeof subscriptionData === 'string') {
            subscription = await stripe.subscriptions.retrieve(subscriptionData);
          } else {
            subscription = subscriptionData;
          }
          if (!subscription) {
            break;
          }
          await updateUserSubscription(subscription);
        }
        break;
      }
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