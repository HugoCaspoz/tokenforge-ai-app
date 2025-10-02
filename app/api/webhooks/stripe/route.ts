import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PLAN_DETAILS } from "@/lib/plans"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function updateUserSubscription(subscriptionId: string) {
  try {
    console.log(`[v0] 🔍 Recuperando suscripción: ${subscriptionId}`)

    const subscription = (await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["plan.product"],
    })) as Stripe.Subscription

    const currentPeriodEnd = subscription.current_period_end
    if (!currentPeriodEnd) {
      console.error("[v0] 🔴 ERROR: current_period_end no encontrado")
      return false
    }

    const priceId = subscription.items.data[0].price.id
    const customerId = subscription.customer as string

    console.log(`[v0] 🔍 Price ID de Stripe: ${priceId}`)
    console.log(`[v0] 🔍 Customer ID: ${customerId}`)

    const plan = Object.values(PLAN_DETAILS).find((p) => "priceId" in p && p.priceId === priceId)

    if (!plan) {
      console.error(`[v0] 🔴 ERROR: No se encontró plan para priceId: ${priceId}`)
      console.log(
        "[v0] 📋 Planes disponibles:",
        Object.values(PLAN_DETAILS).map((p) => ({
          id: p.id,
          priceId: "priceId" in p ? p.priceId : null,
        })),
      )
      return false
    }

    console.log(`[v0] ✅ Plan encontrado: ${plan.id} (${plan.name})`)

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        plan_activo: plan.id, // Guardamos 'basic', 'pro', etc.
        subscripcion_activa_hasta: new Date(currentPeriodEnd * 1000).toISOString(),
      })
      .eq("stripe_customer_id", customerId)
      .select()

    if (error) {
      console.error("[v0] 🔴 ERROR al actualizar Supabase:", error)
      return false
    }

    console.log(`[v0] 🟢 ÉXITO: Usuario actualizado a plan "${plan.id}"`, data)
    return true
  } catch (error) {
    console.error("[v0] 🔴 ERROR en updateUserSubscription:", error)
    return false
  }
}

// Endpoint de prueba
export async function GET(req: Request) {
  console.log("[v0] 🟢 PRUEBA GET: Endpoint llamado")
  return NextResponse.json({
    status: "success",
    message: "Webhook endpoint funcionando correctamente",
    plans: Object.values(PLAN_DETAILS).map((p) => ({
      id: p.id,
      name: p.name,
      priceId: "priceId" in p ? p.priceId : null,
    })),
  })
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      console.error("[v0] 🔴 ERROR: No se encontró firma de Stripe")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
      console.log(`[v0] 📨 Evento recibido: ${event.type}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      console.error(`[v0] 🔴 ERROR de firma: ${errorMessage}`)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const stripeCustomerId = session.customer as string

        console.log(`[v0] 🛒 Checkout completado - User: ${userId}, Customer: ${stripeCustomerId}`)

        if (userId && stripeCustomerId) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({ stripe_customer_id: stripeCustomerId })
            .eq("id", userId)

          if (error) {
            console.error("[v0] 🔴 ERROR al vincular Customer ID:", error)
          } else {
            console.log("[v0] ✅ Customer ID vinculado correctamente")
          }

          const subscriptionId = session.subscription as string
          if (subscriptionId) {
            console.log(`[v0] 🔄 Actualizando suscripción: ${subscriptionId}`)
            await updateUserSubscription(subscriptionId)
          }
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`[v0] 🔄 Suscripción ${event.type}: ${subscription.id}`)
        await updateUserSubscription(subscription.id)
        break
      }

      case "customer.subscription.deleted": {
        const deletedSubscription = event.data.object as Stripe.Subscription
        console.log(`[v0] ❌ Suscripción cancelada: ${deletedSubscription.id}`)

        await supabaseAdmin
          .from("profiles")
          .update({
            plan_activo: "free",
            subscripcion_activa_hasta: null,
          })
          .eq("stripe_customer_id", deletedSubscription.customer as string)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.billing_reason === "subscription_cycle") {
          const subscriptionId = invoice.subscription as string
          if (subscriptionId) {
            console.log(`[v0] 💰 Pago exitoso - Renovando suscripción: ${subscriptionId}`)
            await updateUserSubscription(subscriptionId)
          }
        }
        break
      }

      default:
        console.log(`[v0] ℹ️ Evento no manejado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    console.error("[v0] 🔴 ERROR procesando webhook:", errorMessage, error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
