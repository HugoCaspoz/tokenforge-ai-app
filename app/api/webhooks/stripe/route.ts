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

// ✅ --- FUNCIÓN CORREGIDA --- ✅
async function updateUserSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['plan.product'], // Esto asegura que la información completa esté disponible
    }) as Stripe.Subscription;

    // ✅ CORRECCIÓN: Usamos un tipo de aserción para asegurar que la propiedad existe
    const currentPeriodEnd = (subscription as any).current_period_end;

    if (currentPeriodEnd === undefined) {
      console.error('🔴 ERROR: current_period_end no se encuentra en el objeto de suscripción.');
      return false;
    }

    const priceId = subscription.items.data[0].price.id;
    const customerId = subscription.customer as string;

    console.log(`🟡 DEBUG: Webhook POST recibido para actualizar suscripción.`);
    console.log(`🟡 DEBUG: Price ID recibido de Stripe: ${priceId}`);

    const plan = Object.values(PLAN_DETAILS).find(p => 'priceId' in p && p.priceId === priceId);

    if (!plan) {
      console.error('🔴 ERROR: No se encontró un plan que coincida con el Price ID', priceId);
      return false;
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        plan_activo: plan.name,
        subscripcion_activa_hasta: new Date(currentPeriodEnd * 1000).toISOString(),
      })
      .eq('stripe_customer_id', customerId);

    if (error) {
      console.error('🔴 ERROR al actualizar la suscripción en Supabase:', error);
      return false;
    }
    console.log(`🟢 ÉXITO: Usuario con Stripe ID ${customerId} actualizado a plan ${plan.name}`);
    return true;
  } catch (error) {
    console.error('🔴 ERROR en updateUserSubscription:', error);
    return false;
  }
}

// ✅ --- NUEVA FUNCIÓN GET PARA LA PRUEBA --- ✅
export async function GET(req: Request) {
  console.log("🟢 PRUEBA GET: ¡El endpoint ha sido llamado manualmente desde el navegador!");
  return NextResponse.json({ 
    status: "success",
    message: "Prueba de GET exitosa. Revisa los logs de la función en Vercel. Deberías ver un mensaje que empieza con '🟢 PRUEBA GET'." 
  });
}

// ✅ --- LÓGICA DE POST CORREGIDA PARA USAR LA NUEVA FUNCIÓN --- ✅
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
          
          const subscriptionId = session.subscription as string;
          if (subscriptionId) {
            await updateUserSubscription(subscriptionId);
          }
        }
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await updateUserSubscription(subscription.id);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from('profiles')
          .update({
            plan_activo: 'free',
            subscripcion_activa_hasta: null,
          })
          .eq('stripe_customer_id', deletedSubscription.customer as string);
        break;
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === 'subscription_cycle') {
          const subscriptionData = invoice.lines.data[0]?.subscription;
          if (typeof subscriptionData === 'string' && subscriptionData) {
            await updateUserSubscription(subscriptionData);
          }
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