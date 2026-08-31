// Supabase Edge Function: delete-expired-files
// Deletes files that were downloaded more than 3 hours ago

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

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
    // Verify cron job secret
    const cronSecret = req.headers.get('x-cron-secret')
    if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find orders where downloaded_at is older than 3 hours
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

    const { data: expiredOrders, error: queryError } = await supabase
      .from('orders')
      .select('id, order_ref, files')
      .lt('downloaded_at', threeHoursAgo)
      .not('downloaded_at', 'is', null)

    if (queryError) {
      console.error('Error querying expired orders:', queryError)
      return new Response(
        JSON.stringify({ error: 'Failed to query expired orders' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired files to delete', deletedCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let deletedCount = 0
    const errors: string[] = []

    // Delete files from storage and update order records
    for (const order of expiredOrders) {
      const files = order.files as any[]

      for (const file of files) {
        try {
          const { error: deleteError } = await supabase
            .storage
            .from('print-jobs')
            .remove([file.path])

          if (deleteError) {
            errors.push(`Failed to delete ${file.name} for order ${order.order_ref}: ${deleteError.message}`)
          } else {
            deletedCount++
          }
        } catch (err) {
          errors.push(`Error deleting ${file.name} for order ${order.order_ref}: ${err.message}`)
        }
      }

      // Clear file paths from order record
      await supabase
        .from('orders')
        .update({ files: [] })
        .eq('id', order.id)
    }

    return new Response(
      JSON.stringify({
        message: 'Expired files cleanup completed',
        deletedCount,
        ordersProcessed: expiredOrders.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Cleanup function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
