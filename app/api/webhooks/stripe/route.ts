import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

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

        // Get customer email and subscription
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!subscriptionId) {
          console.error("[v0] No subscription ID in checkout session")
          break
        }

        // Retrieve full subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id

        // Map price ID to plan name
        const planMap: Record<string, string> = {
          [process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC!]: "basic",
          [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!]: "pro",
          [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!]: "enterprise",
        }

        const planName = planMap[priceId] || "free"

        console.log("[v0] Updating user plan to:", planName)

        // Update user profile in Supabase
        const { data: profile, error: findError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (findError || !profile) {
          console.error("[v0] User not found for customer:", customerId)
          break
        }

        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            plan_activo: planName,
            subscription_id: subscriptionId,
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("id", profile.id)

        if (updateError) {
          console.error("[v0] Error updating profile:", updateError)
        } else {
          console.log("[v0] Successfully updated user plan")
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

        const planName = planMap[priceId] || "free"

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            plan_activo: planName,
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("subscription_id", subscription.id)

        if (error) {
          console.error("[v0] Error updating subscription:", error)
        } else {
          console.log("[v0] Successfully updated subscription")
        }

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        console.log("[v0] Subscription cancelled:", subscription.id)

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            plan_activo: "free",
            subscription_status: "canceled",
            subscription_id: null,
            current_period_end: null,
          })
          .eq("subscription_id", subscription.id)

        if (error) {
          console.error("[v0] Error cancelling subscription:", error)
        } else {
          console.log("[v0] Successfully cancelled subscription")
        }

        break
      }

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Stripe webhook error:", error)
    // Still return 200 to prevent Stripe from retrying
    return NextResponse.json({ error: "Webhook error" }, { status: 200 })
  }
}
