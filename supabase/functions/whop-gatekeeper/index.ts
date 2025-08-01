
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const whopApiKey = Deno.env.get('WHOP_API_KEY')

    if (!telegramBotToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured')
    }

    if (!whopApiKey) {
      throw new Error('WHOP_API_KEY not configured')
    }

    const requestBody = await req.json().catch(() => ({}))
    const { action, ...params } = requestBody

    console.log(`🔐 Whop gatekeeper request - Action: ${action}`)

    switch (action) {
      case 'grant_access':
        return await grantTelegramAccess(supabase, telegramBotToken, params.email, params.telegram_user_id, params.whop_purchase_id)
      case 'revoke_access':
        return await revokeTelegramAccess(supabase, telegramBotToken, params.email, params.telegram_user_id, params.whop_purchase_id)
      case 'check_access':
        return await checkUserAccess(supabase, params.email)
      case 'sync_access':
        return await syncAllAccess(supabase, telegramBotToken, whopApiKey)
      case 'webhook':
        return await handleWhopWebhook(supabase, telegramBotToken, params)
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('💥 Gatekeeper error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function grantTelegramAccess(supabase: any, botToken: string, email: string, telegramUserId: number, whopPurchaseId?: string) {
  try {
    console.log(`🟢 Granting access to ${email} (Telegram ID: ${telegramUserId})`)

    // Update or insert access record
    const { error: upsertError } = await supabase
      .from('telegram_community_access')
      .upsert({
        user_email: email,
        telegram_user_id: telegramUserId,
        whop_purchase_id: whopPurchaseId,
        access_status: 'granted',
        access_granted_at: new Date().toISOString()
      }, { onConflict: 'user_email' })

    if (upsertError) {
      throw new Error(`Database error: ${upsertError.message}`)
    }

    // Send welcome message via Telegram
    const welcomeMessage = `🎉 Welcome to the Weekly Wizdom community! Your access has been granted.`
    await sendTelegramMessage(botToken, telegramUserId, welcomeMessage)

    // Log the action
    await logGatekeeperAction(supabase, email, 'grant_access', whopPurchaseId, telegramUserId, true)

    console.log(`✅ Access granted successfully for ${email}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Access granted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`❌ Failed to grant access for ${email}:`, error)
    
    // Log the failed action
    await logGatekeeperAction(supabase, email, 'grant_access', whopPurchaseId, telegramUserId, false, error.message)

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to grant access' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function revokeTelegramAccess(supabase: any, botToken: string, email: string, telegramUserId?: number, whopPurchaseId?: string) {
  try {
    console.log(`🔴 Revoking access for ${email}`)

    // Get current access record to find Telegram user ID if not provided
    if (!telegramUserId) {
      const { data: accessRecord } = await supabase
        .from('telegram_community_access')
        .select('telegram_user_id')
        .eq('user_email', email)
        .single()

      if (accessRecord?.telegram_user_id) {
        telegramUserId = accessRecord.telegram_user_id
      }
    }

    // Update access record
    const { error: updateError } = await supabase
      .from('telegram_community_access')
      .update({
        access_status: 'revoked',
        access_revoked_at: new Date().toISOString()
      })
      .eq('user_email', email)

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    // Send notification via Telegram if we have the user ID
    if (telegramUserId) {
      const revokeMessage = `⚠️ Your access to the Weekly Wizdom community has been revoked due to subscription changes. Please contact support if you believe this is an error.`
      await sendTelegramMessage(botToken, telegramUserId, revokeMessage)
    }

    // Log the action
    await logGatekeeperAction(supabase, email, 'revoke_access', whopPurchaseId, telegramUserId, true)

    console.log(`✅ Access revoked successfully for ${email}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Access revoked successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`❌ Failed to revoke access for ${email}:`, error)
    
    // Log the failed action
    await logGatekeeperAction(supabase, email, 'revoke_access', whopPurchaseId, telegramUserId, false, error.message)

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to revoke access' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function checkUserAccess(supabase: any, email: string) {
  try {
    const { data: accessRecord, error } = await supabase
      .from('telegram_community_access')
      .select('*')
      .eq('user_email', email)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Database error: ${error.message}`)
    }

    const hasAccess = accessRecord?.access_status === 'granted'

    return new Response(
      JSON.stringify({ 
        success: true, 
        hasAccess,
        accessRecord: accessRecord || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`❌ Failed to check access for ${email}:`, error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to check access' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function syncAllAccess(supabase: any, botToken: string, whopApiKey: string) {
  try {
    console.log('🔄 Starting access sync...')

    // Get all active Whop purchases using V5
    const response = await fetch('https://api.whop.com/v5/apps/memberships', {
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Whop API error: ${response.status}`)
    }

    const data = await response.json()
    const memberships = data.data || []

    let grantedCount = 0
    let revokedCount = 0

    // Process active memberships
    for (const membership of memberships) {
      const email = membership.user?.email || membership.email
      const status = membership.status

      if (!email) continue

      if (status === 'active') {
        // Check if user already has access
        const { data: existing } = await supabase
          .from('telegram_community_access')
          .select('access_status')
          .eq('user_email', email)
          .single()

        if (!existing || existing.access_status !== 'granted') {
          await supabase
            .from('telegram_community_access')
            .upsert({
              user_email: email,
              whop_purchase_id: membership.id,
              access_status: 'granted',
              access_granted_at: new Date().toISOString()
            }, { onConflict: 'user_email' })

          grantedCount++
        }
      } else {
        // Revoke access for inactive memberships
        const { error } = await supabase
          .from('telegram_community_access')
          .update({
            access_status: 'revoked',
            access_revoked_at: new Date().toISOString()
          })
          .eq('user_email', email)
          .eq('access_status', 'granted')

        if (!error) {
          revokedCount++
        }
      }
    }

    console.log(`✅ Sync completed: ${grantedCount} granted, ${revokedCount} revoked`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        granted: grantedCount,
        revoked: revokedCount,
        total: memberships.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('💥 Sync access error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to sync access' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleWhopWebhook(supabase: any, botToken: string, params: any) {
  try {
    console.log('🪝 Handling Whop webhook for gatekeeper:', JSON.stringify(params, null, 2))
    
    const { event, data } = params
    
    if (!event || !data) {
      throw new Error('Invalid webhook payload: missing event or data')
    }

    const email = data.user?.email || data.email || data.customer?.email
    
    if (!email) {
      console.warn('⚠️ No email found in webhook data, skipping gatekeeper action')
      return new Response(
        JSON.stringify({ success: true, message: 'No email found, skipping' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log webhook received
    await logGatekeeperAction(supabase, email, 'webhook_received', data.id, null, true, null, { event, data })

    switch (event) {
      case 'membership.created':
      case 'membership.updated':
        if (data.status === 'active') {
          // Grant access
          await supabase
            .from('telegram_community_access')
            .upsert({
              user_email: email,
              whop_purchase_id: data.id,
              access_status: 'granted',
              access_granted_at: new Date().toISOString()
            }, { onConflict: 'user_email' })

          console.log(`✅ Access granted via webhook for ${email}`)
        } else {
          // Revoke access for non-active status
          await supabase
            .from('telegram_community_access')
            .update({
              access_status: 'revoked',
              access_revoked_at: new Date().toISOString()
            })
            .eq('user_email', email)

          console.log(`🔴 Access revoked via webhook for ${email}`)
        }
        break
        
      case 'membership.deleted':
      case 'membership.cancelled':
        // Revoke access
        await supabase
          .from('telegram_community_access')
          .update({
            access_status: 'revoked',
            access_revoked_at: new Date().toISOString()
          })
          .eq('user_email', email)

        console.log(`🔴 Access revoked via webhook for ${email} (${event})`)
        break
        
      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`)
    }

    return new Response(
      JSON.stringify({ success: true, event, processed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('💥 Webhook handling error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to handle webhook' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function sendTelegramMessage(botToken: string, chatId: number, message: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Telegram API error: ${response.status} - ${errorData.description || 'Unknown error'}`)
    }

    console.log(`📱 Telegram message sent to ${chatId}`)
    return await response.json()
  } catch (error) {
    console.error(`❌ Failed to send Telegram message to ${chatId}:`, error)
    throw error
  }
}

async function logGatekeeperAction(
  supabase: any, 
  email: string, 
  actionType: string, 
  whopPurchaseId?: string, 
  telegramUserId?: number, 
  success: boolean = false,
  errorMessage?: string,
  metadata?: any
) {
  try {
    await supabase
      .from('gatekeeper_logs')
      .insert({
        user_email: email,
        action_type: actionType,
        whop_purchase_id: whopPurchaseId,
        telegram_user_id: telegramUserId,
        success,
        error_message: errorMessage,
        metadata: metadata || {}
      })
  } catch (error) {
    console.error('❌ Failed to log gatekeeper action:', error)
    // Don't throw here to avoid cascading failures
  }
}
