import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range, accept-ranges',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Expose-Headers': 'content-range, accept-ranges, content-length',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const videoPath = url.searchParams.get('path')
    
    if (!videoPath) {
      return new Response('Missing video path', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Fetch the video from Supabase Storage
    const videoUrl = `https://wrvvlmevpvcenauglcyz.supabase.co/storage/v1/object/public/assets/${videoPath}`
    const videoResponse = await fetch(videoUrl)
    
    if (!videoResponse.ok) {
      return new Response('Video not found', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Get the video stream
    const videoStream = videoResponse.body
    const contentType = videoResponse.headers.get('content-type') || 'video/mp4'
    const contentLength = videoResponse.headers.get('content-length')
    
    // Create response headers
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    }
    
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength
    }

    // Handle range requests for video seeking
    const range = req.headers.get('range')
    if (range && contentLength) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : parseInt(contentLength) - 1
      const chunksize = (end - start) + 1
      
      responseHeaders['Content-Range'] = `bytes ${start}-${end}/${contentLength}`
      responseHeaders['Content-Length'] = chunksize.toString()
      
      return new Response(videoStream, {
        status: 206,
        headers: responseHeaders
      })
    }

    return new Response(videoStream, {
      status: 200,
      headers: responseHeaders
    })
    
  } catch (error) {
    console.error('Video proxy error:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})