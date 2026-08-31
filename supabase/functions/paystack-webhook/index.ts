// Supabase Edge Function: paystack-webhook
// Handles Paystack charge.success events and updates order status

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const event = payload.event
    const data = payload.data

    // Verify Paystack signature
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!
    const signature = req.headers.get('x-paystack-signature')

    if (signature) {
      const hmac = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(paystackSecretKey),
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      )

      const expectedSignature = await crypto.subtle.sign(
        'HMAC',
        hmac,
        new TextEncoder().encode(JSON.stringify(payload))
      )

      const signatureArray = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      if (signature !== signatureArray) {
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Process charge.success event
    if (event === 'charge.success') {
      const orderRef = data.reference
      const metadata = data.metadata

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'processing',
        })
        .eq('order_ref', orderRef)

      if (updateError) {
        console.error('Error updating order:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update order status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Order ${orderRef} payment confirmed and status updated`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
