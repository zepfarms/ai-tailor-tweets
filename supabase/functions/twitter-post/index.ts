
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("X post function called");
    
    const { userId, content, media } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    if (!content && !media) {
      throw new Error("Post content or media is required");
    }
    
    console.log("User ID:", userId);
    console.log("Content:", content);
    if (media) {
      console.log("Media included:", media.length, "items");
    }
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get the user's X account
    const { data: accountData, error: accountError } = await supabase
      .from('x_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (accountError || !accountData) {
      console.error("Error retrieving X account:", accountError);
      throw new Error("X account not found. Please link your account first.");
    }
    
    console.log("X account found:", accountData.x_username);
    
    // Upload media first if provided
    let mediaIds = [];
    if (media && media.length > 0) {
      for (const mediaItem of media) {
        console.log("Uploading media to X");
        
        // First, we need to initialize the media upload
        const initResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json?command=INIT", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${accountData.access_token}`,
          },
          body: new URLSearchParams({
            total_bytes: mediaItem.size.toString(),
            media_type: mediaItem.type,
            media_category: mediaItem.type.startsWith('video') ? 'tweet_video' : 'tweet_image'
          }),
        });
        
        if (!initResponse.ok) {
          const initError = await initResponse.json();
          console.error("Media init error:", initError);
          throw new Error("Failed to initialize media upload");
        }
        
        const initData = await initResponse.json();
        const mediaId = initData.media_id_string;
        console.log("Media ID:", mediaId);
        
        // Now append the media data
        const appendResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json?command=APPEND", {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${accountData.access_token}`,
          },
          body: new FormData()
            .append("media_id", mediaId)
            .append("segment_index", "0")
            .append("media", mediaItem.data)
        });
        
        if (!appendResponse.ok) {
          const appendError = await appendResponse.text();
          console.error("Media append error:", appendError);
          throw new Error("Failed to upload media");
        }
        
        // Finalize the media upload
        const finalizeResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json?command=FINALIZE", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${accountData.access_token}`,
          },
          body: new URLSearchParams({
            media_id: mediaId
          }),
        });
        
        if (!finalizeResponse.ok) {
          const finalizeError = await finalizeResponse.json();
          console.error("Media finalize error:", finalizeError);
          throw new Error("Failed to finalize media upload");
        }
        
        mediaIds.push(mediaId);
      }
    }
    
    // Build the post payload
    const postPayload = {
      text: content || ""
    };
    
    // Add media if we have IDs
    if (mediaIds.length > 0) {
      postPayload.media = { media_ids: mediaIds };
    }
    
    // Post to X
    const postResponse = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accountData.access_token}`,
      },
      body: JSON.stringify(postPayload),
    });
    
    const postData = await postResponse.json();
    
    if (!postResponse.ok) {
      console.error("Post response error:", postData);
      throw new Error(postData.detail || "Failed to publish post");
    }
    
    console.log("Post published successfully:", postData);
    
    // Store the post in our database
    const { error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: content,
        published: true,
        created_at: new Date().toISOString(),
        tweet_id: postData.data?.id,
        has_media: mediaIds.length > 0
      });
    
    if (postError) {
      console.error("Error storing post:", postError);
      // Don't fail the request if storing the post fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        post: postData.data
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
