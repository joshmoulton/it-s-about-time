
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    // CSP Violation Reporting
    if (url.pathname === '/csp-report' && req.method === 'POST') {
      const report = await req.json()
      
      console.log('🚨 CSP Violation Report:', {
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent'),
        report
      })
      
      // Log to your monitoring system here
      // Could store in Supabase table for analysis
      
      return new Response('OK', { 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      })
    }
    
    // Security headers middleware
    if (url.pathname === '/security-check') {
      const securityHeaders = {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
'Permissions-Policy': [
          'camera=()',
          'microphone=()', 
          'geolocation=()',
          'fullscreen=(self)',
          'picture-in-picture=(self)'
        ].join(', '),
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      }
      
      return new Response(JSON.stringify({
        status: 'Security headers active',
        headers: securityHeaders,
        timestamp: new Date().toISOString()
      }), {
        headers: { 
          ...corsHeaders, 
          ...securityHeaders,
          'Content-Type': 'application/json'
        }
      })
    }
    
    return new Response('Not Found', { status: 404, headers: corsHeaders })
    
  } catch (error) {
    console.error('❌ Security middleware error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
