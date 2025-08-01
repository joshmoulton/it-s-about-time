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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting bulk thumbnail update...');

    // Get all videos without thumbnails that have Vimeo URLs
    const { data: videos, error: fetchError } = await supabaseClient
      .from('video_tutorials')
      .select('id, title, video_url, thumbnail_url')
      .or('thumbnail_url.is.null,thumbnail_url.eq.')
      .ilike('video_url', '%vimeo.com%');

    if (fetchError) {
      throw new Error(`Failed to fetch videos: ${fetchError.message}`);
    }

    if (!videos || videos.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No videos found needing thumbnail updates',
          updated: 0 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${videos.length} videos needing thumbnail updates`);

    const extractVimeoId = (url: string) => {
      const patterns = [
        /vimeo\.com\/(?:.*\/)?([0-9]+)/,
        /player\.vimeo\.com\/video\/([0-9]+)/,
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const getThumbnailUrl = async (vimeoUrl: string) => {
      const videoId = extractVimeoId(vimeoUrl);
      if (!videoId) return null;

      // Try multiple methods to get thumbnail
      let thumbnailUrl = null;

      // Method 1: Try oEmbed API
      try {
        const basicUrl = `https://vimeo.com/${videoId}`;
        const oembedResponse = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(basicUrl)}`);
        
        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          if (oembedData.thumbnail_url) {
            thumbnailUrl = oembedData.thumbnail_url;
            console.log(`Got thumbnail from oEmbed for ${videoId}:`, thumbnailUrl);
          }
        }
      } catch (error) {
        console.warn(`oEmbed failed for ${videoId}:`, error);
      }

      // Method 2: Use standard Vimeo thumbnail pattern
      if (!thumbnailUrl) {
        thumbnailUrl = `https://i.vimeocdn.com/video/${videoId}_640x360.jpg`;
        
        // Verify it exists
        try {
          const response = await fetch(thumbnailUrl, { method: 'HEAD' });
          if (!response.ok) {
            // Try alternative size
            thumbnailUrl = `https://i.vimeocdn.com/video/${videoId}_295x166.jpg`;
            const altResponse = await fetch(thumbnailUrl, { method: 'HEAD' });
            if (!altResponse.ok) {
              thumbnailUrl = `https://i.vimeocdn.com/video/${videoId}.jpg`;
            }
          }
          console.log(`Using standard thumbnail pattern for ${videoId}:`, thumbnailUrl);
        } catch (error) {
          console.warn(`Thumbnail verification failed for ${videoId}:`, error);
        }
      }

      return thumbnailUrl;
    };

    const updates = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each video
    for (const video of videos) {
      try {
        console.log(`Processing video: ${video.title} (ID: ${video.id})`);
        
        const thumbnailUrl = await getThumbnailUrl(video.video_url);
        
        if (thumbnailUrl) {
          const { error: updateError } = await supabaseClient
            .from('video_tutorials')
            .update({ thumbnail_url: thumbnailUrl })
            .eq('id', video.id);

          if (updateError) {
            console.error(`Failed to update video ${video.id}:`, updateError);
            errorCount++;
          } else {
            console.log(`Successfully updated thumbnail for: ${video.title}`);
            successCount++;
            updates.push({
              id: video.id,
              title: video.title,
              thumbnail_url: thumbnailUrl
            });
          }
        } else {
          console.log(`Could not generate thumbnail for: ${video.title}`);
          errorCount++;
        }

        // Add a small delay to avoid overwhelming external services
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
        errorCount++;
      }
    }

    const result = {
      message: `Bulk thumbnail update completed`,
      total_videos: videos.length,
      successful_updates: successCount,
      errors: errorCount,
      updates: updates
    };

    console.log('Bulk update completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Bulk update error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})