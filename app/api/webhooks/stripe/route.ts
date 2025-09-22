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

  console.log(`🟡 DEBUG: Webhook POST recibido para actualizar suscripción.`);
  console.log(`🟡 DEBUG: Price ID recibido de Stripe: ${priceId}`);

  // Buscar el plan por su Price ID
  const plan = Object.values(PLAN_DETAILS).find(p => p.priceId === priceId);

  if (!plan) {
    console.error('🔴 ERROR: No se encontró un plan que coincida con el Price ID', priceId);
    return false;
  }

  // Ahora usa el nombre del plan para actualizar la columna `plan_activo`
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      plan_activo: plan.name,
      // ✅ La columna correcta para la fecha de expiración
      subscripcion_activa_hasta: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('🔴 ERROR al actualizar la suscripción en Supabase:', error);
    return false;
  }
  console.log(`🟢 ÉXITO: Usuario con Stripe ID ${customerId} actualizado a plan ${plan.name}`);
  return true;
}

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

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature!, webhookSecret);
    } catch (err) {
      console.error(`🔴 ERROR de firma de webhook: ${err.message}`);
      return NextResponse.json({ error: 'Firma de webhook inválida' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId as string;
        const stripeCustomerId = session.customer as string;

        if (userId && stripeCustomerId) {
          console.log(`🟡 DEBUG: Intentando vincular ${stripeCustomerId} al usuario ${userId}`);
          const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', userId);

          if (error) {
            console.error('🔴 ERROR al vincular el Stripe Customer ID:', error);
          } else {
            console.log('🟢 ÉXITO al vincular el Stripe Customer ID.', data);
          }
          
          // Ahora, si la sesión tiene una suscripción, la actualizamos
          const subscriptionId = session.subscription as string;
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await updateUserSubscription(subscription);
          }
        }
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await updateUserSubscription(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const freePlanLimits = PLAN_DETAILS.free.limits;
        await supabaseAdmin
          .from('profiles')
          .update({
            plan_activo: 'free',
            // ✅ La columna is_subscribed ha sido eliminada, ya que no existe
            subscripcion_activa_hasta: null,
            polygon_tokens_allowed: freePlanLimits['0x89'],
            bnb_tokens_allowed: freePlanLimits['0x38'],
            ethereum_tokens_allowed: freePlanLimits['0x1'],
          })
          .eq('stripe_customer_id', deletedSubscription.customer as string);
        break;
      
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
    }
  } catch (dbError) {
    const errorMessage = dbError instanceof Error ? dbError.message : 'Error procesando el webhook.';
    console.error(errorMessage, dbError);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}