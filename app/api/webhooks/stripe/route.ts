// En: app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PLAN_DETAILS } from '@/lib/plans';

const handleSubscriptionEvent = async (stripeCustomerId: string, priceId: string | null) => {
    // Busca el plan en tus variables de entorno por el Price ID
    const planKey = Object.keys(process.env).find(key => 
        (process.env[key] === priceId) && key.includes('_PRICE_ID')
    );
    const planName = planKey ? planKey.replace('_PRICE_ID', '').toLowerCase() : 'free';
    
    // Si se encuentra un plan, actualiza la base de datos
    if (planName !== 'free') {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
                plan_activo: planName,
                is_subscribed: true,
            })
            .eq('stripe_customer_id', stripeCustomerId); // <-- Usa el customer ID para encontrar al usuario
        
        if (error) {
            console.error('🔴 ERROR al actualizar la suscripción en Supabase:', error);
            return false;
        }
        console.log(`🟢 ÉXITO: Usuario con Stripe ID ${stripeCustomerId} actualizado a plan ${planName}`);
        return true;
    }
    return false;
};

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
    case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId as string;
        const stripeCustomerId = session.customer as string;

        if (userId && stripeCustomerId) {
            // Primero, asegúrate de que el stripe_customer_id se guarde en tu base de datos.
            await supabaseAdmin
                .from('profiles')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', userId);

            // Luego, si hay un precio, llama a la función de actualización
            const priceId = session.line_items?.data[0].price?.id as string;
            if (priceId) {
                await handleSubscriptionEvent(stripeCustomerId, priceId);
            }
        }
        break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionEvent(
            subscription.customer as string,
            subscription.items.data[0].price.id
        );
        break;

    case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await supabaseAdmin
            .from('profiles')
            .update({
                plan_activo: 'free',
                is_subscribed: false
            })
            .eq('stripe_customer_id', deletedSubscription.customer as string);
        break;

    default:
        console.log(`Evento no manejado: ${event.type}`);
}
  } catch (dbError) {
    const errorMessage = dbError instanceof Error ? dbError.message : 'Error procesando el webhook.';
    console.error(errorMessage, dbError);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}