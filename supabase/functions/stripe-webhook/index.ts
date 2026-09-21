// Stripe webhook receiver. Set STRIPE_WEBHOOK_SIGNING_SECRET and deploy without
// JWT verification. Stripe, not the browser, remains the subscription authority.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno'

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  try {
    const signature = request.headers.get('stripe-signature')
    if (!signature) throw new Error('Missing Stripe signature.')
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
    const body = await request.text()
    const event = await stripe.webhooks.constructEventAsync(body, signature, Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id || session.metadata?.user_id
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
      if (!userId || !subscriptionId) throw new Error('Subscription is missing user reference.')
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: String(subscription.customer),
        plan: session.metadata?.plan === 'yearly' ? 'yearly' : 'monthly',
        status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'past_due',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      }, { onConflict: 'stripe_subscription_id' })
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      await supabase.from('subscriptions').update({
        status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : subscription.status === 'past_due' ? 'past_due' : 'cancelled',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      }).eq('stripe_subscription_id', subscription.id)
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Webhook failed.' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
})
