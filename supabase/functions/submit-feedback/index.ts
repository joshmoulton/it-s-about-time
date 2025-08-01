import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  console.log('🚀 Feedback submission edge function called')

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    const { user_email, title, description, category, browser_info, page_url } = requestBody
    
    console.log('📝 Received feedback data:', {
      user_email,
      category,
      title_length: title?.length || 0,
      description_length: description?.length || 0,
      has_browser_info: !!browser_info,
      page_url
    })

    // Enhanced validation
    if (!title?.trim()) {
      console.warn('❌ Validation failed: Missing title')
      return new Response(
        JSON.stringify({ 
          error: 'Title is required',
          field: 'title'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!description?.trim()) {
      console.warn('❌ Validation failed: Missing description')
      return new Response(
        JSON.stringify({ 
          error: 'Description is required',
          field: 'description'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate title and description length
    if (title.trim().length > 200) {
      console.warn('❌ Validation failed: Title too long')
      return new Response(
        JSON.stringify({ 
          error: 'Title must be 200 characters or less',
          field: 'title'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (description.trim().length > 2000) {
      console.warn('❌ Validation failed: Description too long')
      return new Response(
        JSON.stringify({ 
          error: 'Description must be 2000 characters or less',
          field: 'description'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format if provided and not anonymous
    const emailToUse = user_email || 'anonymous@feedback.com'
    if (emailToUse !== 'anonymous@feedback.com') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(emailToUse)) {
        console.warn('❌ Validation failed: Invalid email format')
        return new Response(
          JSON.stringify({ 
            error: 'Invalid email format',
            field: 'user_email'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const feedbackRecord = {
      user_email: emailToUse,
      title: title.trim(),
      description: description.trim(),
      category: category || 'feedback',
      browser_info: browser_info || {},
      page_url: page_url || 'unknown'
    }

    console.log('💾 Attempting to insert feedback record')

    // Insert feedback using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('feedback')
      .insert(feedbackRecord)
      .select()

    const executionTime = Date.now() - startTime

    if (error) {
      console.error('❌ Database insertion error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        executionTime
      })
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to submit feedback',
          details: error.message,
          code: error.code
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Feedback inserted successfully:', {
      id: data?.[0]?.id,
      user_email: emailToUse,
      category,
      executionTime
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data?.[0],
        executionTime
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('🚨 Unexpected error in feedback submission:', {
      error: error.message,
      stack: error.stack,
      executionTime
    })
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})