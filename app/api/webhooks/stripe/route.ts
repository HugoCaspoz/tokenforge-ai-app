// En: app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PLAN_DETAILS } from '@/lib/plans'; // ✅ IMPORTANTE: Traemos la configuración de los planes

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ✅ Usa el rol de servicio para tener permisos de escritura en el backend
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
      // ✅ Evento principal: cuando el usuario completa el pago por primera vez
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planKey = session.metadata?.planId as keyof typeof PLAN_DETAILS; // 'basic', 'pro', etc.

        if (!userId || !planKey || !PLAN_DETAILS[planKey]) {
          throw new Error('Faltan metadatos esenciales (userId, planId) o el plan no es válido.');
        }

        // Recuperamos la suscripción completa para obtener la fecha de fin de periodo
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const planLimits = PLAN_DETAILS[planKey].limits;

        // Actualizamos el perfil del usuario con TODA la información necesaria
        await supabaseAdmin
          .from('profiles')
          .update({
            plan_activo: planKey,
            is_subscribed: true,
            subscripcion_activa_hasta: new Date(subscription.current_period_end * 1000).toISOString(),
            // Reseteamos los límites según el nuevo plan
            polygon_tokens_allowed: planLimits['0x89'],
            bnb_tokens_allowed: planLimits['0x38'],
            ethereum_tokens_allowed: planLimits['0x1'],
            // Reseteamos el uso actual
            polygon_tokens_used: 0,
            bnb_tokens_used: 0,
            ethereum_tokens_used: 0,
          })
          .eq('id', userId);
        break;
      }
      
      // ✅ Evento para renovaciones mensuales
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

        // Actualizamos la fecha de renovación y reseteamos los contadores de uso del mes
        await supabaseAdmin
          .from('profiles')
          .update({
            subscripcion_activa_hasta: new Date(subscription.current_period_end * 1000).toISOString(),
            polygon_tokens_used: 0,
            bnb_tokens_used: 0,
            ethereum_tokens_used: 0,
          })
          .eq('stripe_customer_id', subscription.customer as string);
        break;
      }

      // ✅ Evento para cuando la suscripción se cancela definitivamente
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const freePlanLimits = PLAN_DETAILS.free.limits;

        // Devolvemos al usuario al plan gratuito
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
    const errorMessage = dbError instanceof Error ? dbError.message : 'Error desconocido de base de datos.';
    console.error('Error procesando el webhook:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}