// Supabase Edge Function: creates a Stripe TEST MODE Checkout Session.
// Deploy with `supabase functions deploy create-checkout --no-verify-jwt`.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') || 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed.' }), { status: 405, headers: corsHeaders })

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) throw new Error('Sign in before starting checkout.')
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Your session has expired. Please sign in again.')

    const { plan } = await request.json()
    const priceId = plan === 'yearly' ? Deno.env.get('STRIPE_YEARLY_PRICE_ID') : plan === 'monthly' ? Deno.env.get('STRIPE_MONTHLY_PRICE_ID') : null
    if (!priceId) throw new Error('Choose a valid subscription plan.')

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
    const origin = Deno.env.get('APP_ORIGIN') || 'http://localhost:5173'
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
      metadata: { user_id: user.id, plan },
    })
    return new Response(JSON.stringify({ checkoutUrl: session.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to start checkout.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
