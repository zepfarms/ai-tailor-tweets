
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
    
    if (!content && (!media || media.length === 0)) {
      throw new Error("Post content or media is required");
    }
    
    console.log("User ID:", userId);
    console.log("Content:", content);
    if (media) {
      console.log("Media included:", media.length, "items");
    }
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get the user's X account token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'twitter')
      .single();
    
    if (tokenError || !tokenData) {
      console.error("Error retrieving X token:", tokenError);
      
      // Fallback to x_accounts table
      const { data: accountData, error: accountError } = await supabase
        .from('x_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (accountError || !accountData) {
        console.error("Error retrieving X account:", accountError);
        throw new Error("X account not found. Please link your account first.");
      }
      
      console.log("Found X account in legacy table:", accountData.x_username);
      tokenData = accountData;
    } else {
      console.log("Found X token in user_tokens table");
    }
    
    // Build the post payload
    const postPayload: any = {
      text: content || ""
    };
    
    // If we have media, we need to upload it first
    if (media && media.length > 0) {
      console.log("Processing media for upload");
      const mediaIds = await Promise.all(media.map(async (item: any) => {
        try {
          return await uploadMediaToTwitter(item, tokenData.access_token);
        } catch (error) {
          console.error("Error uploading media item:", error);
          throw error;
        }
      }));
      
      console.log("Successfully uploaded media, IDs:", mediaIds);
      if (mediaIds.length > 0) {
        postPayload.media = { media_ids: mediaIds };
      }
    }
    
    // Post to X
    console.log("Sending post with payload:", JSON.stringify(postPayload));
    const postResponse = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenData.access_token}`,
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
        has_media: media && media.length > 0
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

// Function to upload media to Twitter and get media ID
async function uploadMediaToTwitter(mediaItem: any, accessToken: string): Promise<string> {
  console.log("Starting media upload process for item type:", mediaItem.type);
  
  // Step 1: Extract base64 data
  const base64Data = mediaItem.data.split(',')[1];
  const binaryData = atob(base64Data);
  
  // Convert to Uint8Array
  const uint8Array = new Uint8Array(binaryData.length);
  for (let i = 0; i < binaryData.length; i++) {
    uint8Array[i] = binaryData.charCodeAt(i);
  }
  
  // Step 2: INIT - Initialize the media upload
  console.log("Sending INIT request");
  const initResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Bearer ${accessToken}`
    },
    body: new URLSearchParams({
      command: "INIT",
      total_bytes: uint8Array.length.toString(),
      media_type: mediaItem.type
    })
  });
  
  if (!initResponse.ok) {
    const errorData = await initResponse.json();
    console.error("Media INIT error:", errorData);
    throw new Error("Failed to initialize media upload");
  }
  
  const initData = await initResponse.json();
  const mediaId = initData.media_id_string;
  console.log("Media initialized, ID:", mediaId);
  
  // Step 3: APPEND - Upload the media in chunks
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  let segmentIndex = 0;
  
  for (let byteStart = 0; byteStart < uint8Array.length; byteStart += chunkSize) {
    const chunk = uint8Array.slice(byteStart, Math.min(byteStart + chunkSize, uint8Array.length));
    
    // Create binary form data
    const formData = new FormData();
    formData.append('command', 'APPEND');
    formData.append('media_id', mediaId);
    formData.append('segment_index', segmentIndex.toString());
    formData.append('media', new Blob([chunk], { type: mediaItem.type }));
    
    console.log(`Uploading segment ${segmentIndex}, size: ${chunk.length} bytes`);
    const appendResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      },
      body: formData
    });
    
    if (!appendResponse.ok) {
      const errorText = await appendResponse.text();
      console.error(`Media APPEND error for segment ${segmentIndex}:`, errorText);
      throw new Error(`Failed to upload media chunk ${segmentIndex}`);
    }
    
    console.log(`Segment ${segmentIndex} uploaded successfully`);
    segmentIndex++;
  }
  
  // Step 4: FINALIZE - Finalize the media upload
  console.log("Sending FINALIZE request");
  const finalizeResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Bearer ${accessToken}`
    },
    body: new URLSearchParams({
      command: "FINALIZE",
      media_id: mediaId
    })
  });
  
  if (!finalizeResponse.ok) {
    const errorData = await finalizeResponse.json();
    console.error("Media FINALIZE error:", errorData);
    throw new Error("Failed to finalize media upload");
  }
  
  const finalizeData = await finalizeResponse.json();
  console.log("Media finalized successfully:", finalizeData);
  
  // If the media is processing asynchronously (like videos), wait for it to complete
  if (finalizeData.processing_info) {
    await waitForMediaProcessing(mediaId, accessToken, finalizeData.processing_info);
  }
  
  return mediaId;
}

// Helper function to wait for media processing to complete
async function waitForMediaProcessing(mediaId: string, accessToken: string, processingInfo: any) {
  if (!processingInfo) return;
  
  if (processingInfo.state === 'succeeded') {
    console.log("Media processing complete");
    return;
  }
  
  if (processingInfo.state === 'failed') {
    console.error("Media processing failed:", processingInfo.error);
    throw new Error(`Media processing failed: ${processingInfo.error.message}`);
  }
  
  // Wait for the recommended time
  const checkAfterSecs = processingInfo.check_after_secs || 1;
  console.log(`Media still processing, checking again in ${checkAfterSecs} seconds`);
  await new Promise(resolve => setTimeout(resolve, checkAfterSecs * 1000));
  
  // Check status
  const statusResponse = await fetch(`https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  
  if (!statusResponse.ok) {
    throw new Error("Failed to get media status");
  }
  
  const statusData = await statusResponse.json();
  console.log("Media status update:", statusData.processing_info);
  
  // Recursive call to continue checking
  if (statusData.processing_info) {
    await waitForMediaProcessing(mediaId, accessToken, statusData.processing_info);
  }
}
