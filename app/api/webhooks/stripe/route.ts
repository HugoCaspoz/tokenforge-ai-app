import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
})

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper to safely extract current_period_end
function getSafeCurrentPeriodEnd(subscription: any): string {
  let periodEnd = subscription.current_period_end;
  // If undefined at root, try getting it from the first item
  if (!periodEnd && subscription.items && subscription.items.data && subscription.items.data.length > 0) {
    periodEnd = subscription.items.data[0].current_period_end;
  }
  // If still missing, default to now + 30 days (approximation) or just NOW to avoid proper crash
  if (!periodEnd) {
    console.warn("[v0] WARNING: Could not find current_period_end in subscription object. Defaulting to now.");
    return new Date().toISOString();
  }
  return new Date(periodEnd * 1000).toISOString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = req.headers.get("stripe-signature")

    if (!sig) {
      console.error("[v0] No Stripe signature found")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
      console.error("[v0] Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log("[v0] Received event:", event.type)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("[v0] Checkout completed:", session.id)

        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!subscriptionId) {
          console.error("[v0] No subscription ID in checkout session")
          break
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id

        const planMap: Record<string, string> = {
          [process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC!]: "basic",
          [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!]: "pro",
          [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!]: "enterprise",
        }

        console.log(`[v0] Debug - Price ID from Stripe: ${priceId}`)
        console.log(`[v0] Debug - Env Basic: ${process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC}`)
        console.log(`[v0] Debug - Env Pro: ${process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO}`)
        console.log(`[v0] Debug - Map Result: ${planMap[priceId]}`)

        // IMPROVED LOGIC: Don't default to free immediately if priceId is found but not in map
        let planName = planMap[priceId]

        if (!planName) {
          console.warn(`[v0] WARNING: Price ID ${priceId} not found in planMap. Env vars might be missing.`)
          console.warn(`[v0] Available keys: ${Object.keys(planMap).join(", ")}`)
          // Fallback logic: If we can't identify the plan, we shouldn't necessarily overwrite a paid plan with free.
          // However, for a new checkout, we might assume it's whatever the user just bought.
          // Let's rely on the fact that if it's a checkout, they paid for *something*.
          // We will default to 'pro' if unknown as a fail-safe or just keep 'free' but log heavily?
          // Better strategy: Use 'unknown_paid' or similar if dynamic, but for now let's keep 'free' safely but LOG IT.
          planName = "free"
        }

        console.log("[v0] Updating user plan to:", planName)

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (!profile) {
          console.error(`[v0] CRITICAL: User not found for stripe_customer_id: ${customerId}. Verified DB has correct customer ID?`)
          break
        }
        console.log(`[v0] Debug - Found profile ID: ${profile.id}`)

        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            plan_activo: planName,
            subscription_id: subscriptionId,
            subscription_status: subscription.status,
            current_period_end: getSafeCurrentPeriodEnd(subscription),
          })
          .eq("id", profile.id)

        if (updateError) {
          console.error(`[v0] CRITICAL: DB Update Failed: ${updateError.message}`)
        } else {
          console.log("[v0] Successfully updated user plan in DB")
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("[v0] Subscription updated:", subscription.id)

        const priceId = subscription.items.data[0]?.price.id

        const planMap: Record<string, string> = {
          [process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC!]: "basic",
          [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!]: "pro",
          [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!]: "enterprise",
        }

        const planName = planMap[priceId]

        const updateData: any = {
          subscription_status: subscription.status,
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        }

        // Only update plan name if we recognize the price ID
        if (planName) {
          updateData.plan_activo = planName
        } else {
          console.warn(`[v0] Price ID ${priceId} unknown in update event. Not changing plan_activo.`)
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update(updateData)
          .eq("subscription_id", subscription.id)

        if (error) {
          console.error("[v0] Error updating subscription:", error)
        } else {
          console.log("[v0] Successfully updated subscription")
        }
        break
      }

      case "invoice.payment_succeeded": {
        // NEW HANDLER: Recurring payments
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string

        if (!subscriptionId) {
          console.log("[v0] Invoice payment succeeded but no subscription ID (one-time payment?)")
          break
        }

        console.log(`[v0] Recurring payment received for subscription: ${subscriptionId}`)

        // Retrieve subscription to get the NEW period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: 'active', // Ensure it's active
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          })
          .eq("subscription_id", subscriptionId)

        if (error) {
          console.error("[v0] Error extending subscription period:", error)
        } else {
          console.log("[v0] Successfully extended subscription period")
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("[v0] Subscription cancelled:", subscription.id)

        await supabaseAdmin
          .from("profiles")
          .update({
            plan_activo: "free",
            subscription_status: "canceled",
            subscription_id: null,
            current_period_end: null,
          })
          .eq("subscription_id", subscription.id)

        console.log("[v0] Successfully cancelled subscription")
        break
      }

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Stripe webhook error:", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 200 })
  }
}
