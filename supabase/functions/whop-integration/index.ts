import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const requestBody = await req.json().catch(() => ({}))
    const { action, ...params } = requestBody
    const whopApiKey = Deno.env.get('WHOP_API_KEY')

    console.log(`🔄 Whop integration request - Action: ${action}`)
    console.log(`📦 Request params:`, JSON.stringify(params, null, 2))

    if (!whopApiKey) {
      console.error('❌ WHOP_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'WHOP_API_KEY not configured' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!action) {
      console.error('❌ No action specified')
      return new Response(
        JSON.stringify({ success: false, error: 'No action specified' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    switch (action) {
      case 'sync_products':
        return await syncProducts(supabase, whopApiKey)
      case 'sync_purchases':
        return await syncPurchases(supabase, whopApiKey)
      case 'verify_purchase':
        return await verifyPurchase(supabase, whopApiKey, params.email, params.productId)
      case 'create_embedded_checkout':
        return await createEmbeddedCheckout(supabase, whopApiKey, params.productId)
      case 'webhook':
        return await handleWebhook(supabase, params)
      default:
        console.error(`❌ Unknown action: ${action}`)
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }
  } catch (error) {
    console.error('💥 Critical error in whop-integration function:', error)
    console.error('💥 Error message:', error.message)
    console.error('💥 Error stack:', error.stack)
    console.error('💥 Error type:', typeof error)
    console.error('💥 Error details:', JSON.stringify(error, null, 2))
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        errorType: error.constructor?.name || 'Unknown',
        stack: error.stack || 'No stack trace'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function createEmbeddedCheckout(supabase: any, apiKey: string, productId: string) {
  try {
    console.log(`🛒 Creating embedded checkout for product: ${productId}`)
    
    if (!productId) {
      console.error('❌ No product ID provided')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Product ID is required for checkout creation' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the product exists in our database and has valid pricing
    console.log(`🔍 Looking up product in database: ${productId}`)
    const { data: product, error: productError } = await supabase
      .from('whop_products')
      .select('*')
      .eq('whop_product_id', productId)
      .single()

    if (productError) {
      console.error('❌ Product lookup error:', productError)
      
      // If product not found in our DB, we can still create a checkout URL
      // This handles cases where products exist in Whop but not synced to our DB
      console.log('⚠️ Product not found in local DB, proceeding with Whop checkout anyway')
    }

    // For embedded checkout, we construct the URL with embed parameters
    // This follows Whop's embedded checkout URL structure
    const baseCheckoutUrl = `https://whop.com/checkout/${productId}`
    const embeddedCheckoutUrl = `${baseCheckoutUrl}?embed=true&utm_source=www.weeklywizdom.com&utm_medium=embedded_checkout`

    console.log(`✅ Generated embedded checkout URL: ${embeddedCheckoutUrl}`)

    const productTitle = product?.title || 'Premium Product'

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutUrl: embeddedCheckoutUrl,
        productId: productId,
        productTitle: productTitle
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('💥 Embedded checkout creation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create embedded checkout' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function syncProducts(supabase: any, apiKey: string) {
  try {
    console.log('🔄 Starting Whop products sync...')
    console.log('🔑 API Key present:', !!apiKey)
    console.log('🔑 API Key format:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
    
    // Fetch all pages of products
    let allProducts = []
    let currentPage = 1
    let hasMorePages = true
    
    while (hasMorePages) {
      const endpoint = `https://api.whop.com/api/v5/app/products?page=${currentPage}&per=10`
      console.log(`🌐 Calling endpoint (page ${currentPage}):`, endpoint)
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      console.log(`📡 Response status (page ${currentPage}):`, response.status)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`❌ Whop API error: ${response.status} - ${errorText}`)
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your WHOP_API_KEY.')
        } else if (response.status === 404) {
          throw new Error('API endpoint not found. Please verify your Whop API access.')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        } else {
          throw new Error(`Whop API error: ${response.status} - ${errorText}`)
        }
      }

      const data = await response.json()
      console.log(`📦 Found ${data.data?.length || 0} products on page ${currentPage}`)
      console.log(`📊 Full pagination response:`, JSON.stringify(data.pagination, null, 2))
      console.log(`📊 Has pagination object:`, !!data.pagination)
      console.log(`📊 Next page value:`, data.pagination?.next_page)
      console.log(`📊 Total pages:`, data.pagination?.total_pages)
      console.log(`📊 Current page check:`, data.pagination?.current_page)
      
      if (data.data && Array.isArray(data.data)) {
        allProducts = allProducts.concat(data.data)
        console.log(`📦 Running total products: ${allProducts.length}`)
      }
      
      // Check if there are more pages
      hasMorePages = data.pagination && data.pagination.next_page !== null
      console.log(`🔄 Has more pages:`, hasMorePages)
      console.log(`🔄 Next page to fetch:`, data.pagination?.next_page)
      
      if (hasMorePages) {
        currentPage = data.pagination.next_page
        console.log(`➡️ Moving to page ${currentPage}`)
      } else {
        console.log(`🏁 Pagination complete - no more pages`)
      }
    }
    
    console.log(`📦 Total products collected from all pages: ${allProducts.length}`)

    let syncedCount = 0
    for (const product of allProducts) {
      try {
        console.log(`🔍 Processing product ${product.id}:`, JSON.stringify(product, null, 2))
        
        // V5 API includes pricing directly in the product response
        console.log(`📋 Processing V5 product data:`, JSON.stringify(product, null, 2))
        
        // Extract pricing from V5 product structure
        let productPriceCents = 0
        let planDetails = []
        
        // V5 products include plan information directly
        if (product.plans && Array.isArray(product.plans)) {
          planDetails = product.plans.map(plan => ({
            id: plan.id,
            name: plan.name || plan.title,
            price_cents: plan.price_cents || 0,
            currency: plan.currency || 'USD',
            billing_period: plan.billing_period,
            metadata: plan
          }))
          
          // Use the lowest non-zero price as the product price
          const nonZeroPrices = product.plans
            .map(plan => plan.price_cents || 0)
            .filter(price => price > 0)
          
          if (nonZeroPrices.length > 0) {
            productPriceCents = Math.min(...nonZeroPrices)
            console.log(`💰 Using price ${productPriceCents} cents from V5 plans`)
          }
        }
        
        // If no plan pricing, check product-level pricing
        if (productPriceCents === 0 && product.price_cents) {
          productPriceCents = product.price_cents
          console.log(`💰 Using product-level price: ${productPriceCents} cents`)
        }
        
        // Allow $0 products (legitimate free products)
        console.log(`💰 Final product price: ${productPriceCents} cents (${productPriceCents === 0 ? 'FREE' : 'PAID'} product)`)
        
        // If still no pricing info found in any location, use 0 as default (free product)
        if (productPriceCents === 0 && !product.plans?.length && !product.price_cents) {
          console.log(`📝 No explicit pricing found for product ${product.id} - treating as free product (0 cents)`)
        }

        const { error } = await supabase
          .from('whop_products')
          .upsert({
            whop_product_id: product.id,
            title: product.title || product.name || 'Untitled Product',
            description: product.description || '',
            price_cents: productPriceCents,
            currency: product.currency || 'USD',
            is_active: product.is_active !== false && product.active !== false,
            metadata: {
              category: product.category,
              tags: product.tags,
              plans: planDetails,
              original_data: product
            }
          }, { onConflict: 'whop_product_id' })

        if (error) {
          console.error(`❌ Error upserting product ${product.id}:`, error)
        } else {
          syncedCount++
          console.log(`✅ Successfully synced product ${product.id} with price ${productPriceCents} cents`)
        }
      } catch (productError) {
        console.error(`❌ Error processing product ${product.id}:`, productError)
      }
    }

    console.log(`✅ Products sync completed: ${syncedCount}/${allProducts.length} synced`)

    return new Response(
      JSON.stringify({ success: true, synced: syncedCount, total: allProducts.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('💥 Products sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to sync products' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function syncPurchases(supabase: any, apiKey: string) {
  try {
    console.log('🔄 Starting Whop purchases sync...')
    
    const response = await fetch('https://api.whop.com/api/v5/app/memberships', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`❌ Whop API error: ${response.status} - ${errorText}`)
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your WHOP_API_KEY.')
      } else if (response.status === 404) {
        throw new Error('API endpoint not found. Please verify your Whop API access.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else {
        throw new Error(`Whop API error: ${response.status} - ${errorText}`)
      }
    }

    const data = await response.json()
    const memberships = data.data || data || []

    console.log(`💳 Found ${memberships.length} memberships from Whop`)

    let syncedCount = 0
    let skippedCount = 0
    
    for (const membership of memberships) {
      try {
        console.log(`🔍 Processing membership ${membership.id}:`, JSON.stringify(membership, null, 2))
        
        // Extract product ID with multiple fallback strategies
        let productId = null
        
        // Strategy 1: Direct product_id field
        if (membership.product_id) {
          productId = membership.product_id
        }
        // Strategy 2: Nested product object
        else if (membership.product?.id) {
          productId = membership.product.id
        }
        // Strategy 3: Plan or resource reference
        else if (membership.plan?.product_id) {
          productId = membership.plan.product_id
        }
        else if (membership.resource?.id) {
          productId = membership.resource.id
        }
        // Strategy 4: Check metadata or other nested fields
        else if (membership.metadata?.product_id) {
          productId = membership.metadata.product_id
        }

        if (!productId) {
          console.warn(`⚠️ No product ID found for membership ${membership.id}, skipping`)
          skippedCount++
          continue
        }

        // Extract customer information with fallbacks
        const customerEmail = membership.user?.email || 
                            membership.email || 
                            membership.customer?.email ||
                            'unknown@example.com'
        
        const customerName = membership.user?.name || 
                           membership.user?.username ||
                           membership.customer?.name ||
                           membership.username ||
                           ''

        // Extract pricing with fallbacks
        const amountCents = membership.price_cents || 
                          membership.price || 
                          membership.plan?.price_cents ||
                          membership.plan?.price ||
                          0

        const { error } = await supabase
          .from('whop_purchases')
          .upsert({
            whop_purchase_id: membership.id,
            whop_product_id: productId,
            customer_email: customerEmail,
            customer_name: customerName,
            amount_cents: amountCents,
            currency: membership.currency || membership.plan?.currency || 'USD',
            status: membership.status || 'active',
            purchase_date: new Date(membership.created_at || new Date()).toISOString(),
            metadata: {
              expires_at: membership.expires_at,
              plan_info: membership.plan,
              original_data: membership
            }
          }, { onConflict: 'whop_purchase_id' })

        if (error) {
          console.error(`❌ Error upserting purchase ${membership.id}:`, error)
        } else {
          syncedCount++
          console.log(`✅ Successfully synced membership ${membership.id} with product ${productId}`)
        }
      } catch (purchaseError) {
        console.error(`❌ Error processing purchase ${membership.id}:`, purchaseError)
      }
    }

    console.log(`✅ Purchases sync completed: ${syncedCount}/${memberships.length} synced, ${skippedCount} skipped`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount, 
        total: memberships.length,
        skipped: skippedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('💥 Purchases sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to sync purchases' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function verifyPurchase(supabase: any, apiKey: string, email: string, productId?: string) {
  try {
    console.log(`🔍 Verifying purchase for email: ${email}`)
    
    if (!email) {
      throw new Error('Email is required for purchase verification')
    }
    
    const { data: purchases, error } = await supabase
      .from('whop_purchases')
      .select('*')
      .eq('customer_email', email)
      .eq('status', 'active')

    if (error) {
      console.error('❌ Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    const validPurchases = purchases.filter(purchase => {
      if (productId && purchase.whop_product_id !== productId) {
        return false
      }
      // Check if purchase hasn't expired
      if (purchase.metadata?.expires_at) {
        return new Date(purchase.metadata.expires_at) > new Date()
      }
      return true
    })

    console.log(`✅ Purchase verification completed: ${validPurchases.length} valid purchases found`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        hasValidPurchase: validPurchases.length > 0,
        purchases: validPurchases
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('💥 Purchase verification error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to verify purchase' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleWebhook(supabase: any, params: any) {
  try {
    console.log('🪝 Handling Whop webhook:', JSON.stringify(params, null, 2))
    
    const { event, data } = params
    
    if (!event || !data) {
      throw new Error('Invalid webhook payload: missing event or data')
    }
    
    switch (event) {
      case 'membership.created':
      case 'membership.updated':
        // Extract product ID using the same strategy as syncPurchases
        let productId = data.product_id || 
                       data.product?.id || 
                       data.plan?.product_id ||
                       data.resource?.id ||
                       data.metadata?.product_id

        if (!productId) {
          console.warn(`⚠️ No product ID found in webhook data for membership ${data.id}`)
          // Don't fail the webhook, just log and continue
          productId = 'unknown'
        }

        const customerEmail = data.user?.email || 
                            data.email || 
                            data.customer?.email ||
                            'unknown@example.com'

        await supabase
          .from('whop_purchases')
          .upsert({
            whop_purchase_id: data.id,
            whop_product_id: productId,
            customer_email: customerEmail,
            customer_name: data.user?.name || data.user?.username || '',
            amount_cents: data.price_cents || data.price || data.plan?.price_cents || 0,
            currency: data.currency || data.plan?.currency || 'USD',
            status: data.status || 'active',
            purchase_date: new Date(data.created_at || new Date()).toISOString(),
            metadata: {
              expires_at: data.expires_at,
              plan_info: data.plan,
              webhook_event: event,
              original_data: data
            }
          }, { onConflict: 'whop_purchase_id' })
        break
        
      case 'membership.deleted':
      case 'membership.cancelled':
        await supabase
          .from('whop_purchases')
          .update({ status: 'cancelled' })
          .eq('whop_purchase_id', data.id)
        break
        
      default:
        console.warn(`⚠️ Unhandled webhook event: ${event}`)
    }

    console.log(`✅ Webhook processed successfully: ${event}`)

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
