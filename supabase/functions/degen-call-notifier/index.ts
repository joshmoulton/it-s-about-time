import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚨 Degen call notifier triggered')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { analyst_signal_id, trigger_type = 'manual' } = await req.json()

    if (!analyst_signal_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing analyst_signal_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📊 Processing degen call for signal:', analyst_signal_id)

    // Get the analyst signal
    const { data: signal, error: signalError } = await supabase
      .from('analyst_signals')
      .select('*')
      .eq('id', analyst_signal_id)
      .single()

    if (signalError || !signal) {
      console.error('❌ Failed to fetch analyst signal:', signalError)
      return new Response(
        JSON.stringify({ success: false, error: 'Signal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format the degen call message
    const { data: formattedMessage, error: formatError } = await supabase
      .rpc('format_degen_call_message', { signal_row: signal })

    if (formatError || !formattedMessage) {
      console.error('❌ Failed to format message:', formatError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to format message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📝 Formatted degen call message:', formattedMessage.substring(0, 100) + '...')

    // Get active degen call subscribers with degen alerts enabled
    const { data: subscribers, error: subsError } = await supabase
      .from('degen_call_subscriptions')
      .select('*')
      .eq('is_active', true)
      .eq('degen_alerts_enabled', true)

    if (subsError) {
      console.error('❌ Failed to fetch subscribers:', subsError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch subscribers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📱 Found ${subscribers?.length || 0} degen call subscribers`)

    let successCount = 0
    let failureCount = 0
    const errors: string[] = []

    // Send to each subscriber
    if (subscribers && subscribers.length > 0) {
      for (const subscriber of subscribers) {
        try {
          // Only send to subscribers who have Telegram info
          if (!subscriber.telegram_user_id && !subscriber.telegram_username) {
            console.log(`⚠️ Skipping subscriber ${subscriber.user_email} - no Telegram info`)
            continue
          }

          console.log(`📤 Sending degen call to user: ${subscriber.telegram_username || subscriber.telegram_user_id}`)
          
          // For now, we can only send to users with telegram_user_id
          // Users with only username would need to be resolved to user_id first
          if (!subscriber.telegram_user_id) {
            console.log(`⚠️ Skipping ${subscriber.telegram_username} - no user ID (username only)`)
            continue
          }
          
          const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: subscriber.telegram_user_id,
              text: formattedMessage,
              parse_mode: 'HTML',
              disable_web_page_preview: true
            })
          })

          if (telegramResponse.ok) {
            successCount++
            console.log(`✅ Sent degen call to ${subscriber.telegram_username || subscriber.telegram_user_id}`)
          } else {
            const errorData = await telegramResponse.text()
            failureCount++
            errors.push(`Failed to send to ${subscriber.telegram_user_id}: ${errorData}`)
            console.error(`❌ Failed to send to ${subscriber.telegram_user_id}:`, errorData)
          }
        } catch (error) {
          failureCount++
          errors.push(`Error sending to ${subscriber.telegram_user_id}: ${error.message}`)
          console.error(`❌ Error sending to ${subscriber.telegram_user_id}:`, error)
        }
      }
    }

    // Log the notification
    const { error: logError } = await supabase
      .from('degen_call_notifications')
      .insert({
        analyst_signal_id,
        message_content: formattedMessage,
        recipient_count: successCount,
        status: failureCount > 0 ? 'partial_failure' : 'sent',
        error_message: errors.length > 0 ? errors.join('; ') : null
      })

    if (logError) {
      console.error('❌ Failed to log notification:', logError)
    }

    // Mark signal as posted to telegram if successful
    if (successCount > 0) {
      await supabase
        .from('analyst_signals')
        .update({ 
          posted_to_telegram: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', analyst_signal_id)
    }

    console.log(`🎯 Degen call notification complete: ${successCount} sent, ${failureCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Degen call sent successfully',
        stats: {
          sent: successCount,
          failed: failureCount,
          total_subscribers: subscribers?.length || 0
        },
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Degen call notifier error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})