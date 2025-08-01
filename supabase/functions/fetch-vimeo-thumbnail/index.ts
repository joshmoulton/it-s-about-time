import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { vimeoUrl } = await req.json();
    
    if (!vimeoUrl) {
      return new Response(
        JSON.stringify({ error: 'vimeoUrl is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetching thumbnail for:', vimeoUrl);

    // Extract video ID from various Vimeo URL formats
    const extractVimeoId = (url: string) => {
      const patterns = [
        /vimeo\.com\/(?:.*\/)?([0-9]+)/,  // Standard format
        /player\.vimeo\.com\/video\/([0-9]+)/,  // Player format
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const videoId = extractVimeoId(vimeoUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Invalid Vimeo URL format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Try multiple approaches to get thumbnail
    let thumbnailUrl = null;

    // Method 1: Try oEmbed API with basic video URL
    try {
      const basicUrl = `https://vimeo.com/${videoId}`;
      const oembedResponse = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(basicUrl)}`);
      
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json();
        if (oembedData.thumbnail_url) {
          thumbnailUrl = oembedData.thumbnail_url;
          console.log('Got thumbnail from oEmbed:', thumbnailUrl);
        }
      }
    } catch (error) {
      console.warn('oEmbed failed:', error);
    }

    // Method 2: Try Vimeo API v4 (requires API access but we can try public endpoint)
    if (!thumbnailUrl) {
      try {
        const apiResponse = await fetch(`https://api.vimeo.com/videos/${videoId}`, {
          headers: {
            'Authorization': 'bearer ' + (Deno.env.get('VIMEO_ACCESS_TOKEN') || ''),
            'Content-Type': 'application/json'
          }
        });
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (apiData.pictures && apiData.pictures.sizes && apiData.pictures.sizes.length > 0) {
            // Get the largest available thumbnail
            const largest = apiData.pictures.sizes[apiData.pictures.sizes.length - 1];
            thumbnailUrl = largest.link;
            console.log('Got thumbnail from API:', thumbnailUrl);
          }
        }
      } catch (error) {
        console.warn('Vimeo API failed:', error);
      }
    }

    // Method 3: Generate standard Vimeo thumbnail URL pattern
    if (!thumbnailUrl) {
      // Vimeo uses predictable thumbnail URLs
      thumbnailUrl = `https://i.vimeocdn.com/video/${videoId}_640x360.jpg`;
      console.log('Using standard thumbnail pattern:', thumbnailUrl);
    }

    // Verify the thumbnail URL works
    try {
      const thumbnailResponse = await fetch(thumbnailUrl, { method: 'HEAD' });
      if (!thumbnailResponse.ok) {
        // Try alternative size
        thumbnailUrl = `https://i.vimeocdn.com/video/${videoId}_295x166.jpg`;
        
        const altResponse = await fetch(thumbnailUrl, { method: 'HEAD' });
        if (!altResponse.ok) {
          // Final fallback
          thumbnailUrl = `https://i.vimeocdn.com/video/${videoId}.jpg`;
        }
      }
    } catch (error) {
      console.warn('Thumbnail verification failed:', error);
    }

    return new Response(
      JSON.stringify({ 
        thumbnailUrl,
        videoId,
        originalUrl: vimeoUrl
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching Vimeo thumbnail:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})