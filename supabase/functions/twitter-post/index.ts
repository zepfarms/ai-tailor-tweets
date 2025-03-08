
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { createHmac, randomBytes } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Twitter API credentials
const TWITTER_API_KEY = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
const TWITTER_API_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();

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
    
    // Validate access token
    if (!tokenData.access_token) {
      throw new Error("Invalid X token. Please reconnect your account.");
    }
    
    // Build the post payload
    const postPayload: any = {
      text: content || ""
    };
    
    // If we have media, we need to upload it first
    if (media && media.length > 0) {
      console.log("Processing media for upload to Twitter");
      try {
        const mediaIds = await Promise.all(media.map(async (item: any) => {
          if (!item.data) {
            throw new Error("Media data is missing");
          }
          return await uploadMediaToTwitterV2(item, tokenData.access_token);
        }));
        
        console.log("Successfully uploaded media, IDs:", mediaIds);
        if (mediaIds.length > 0) {
          postPayload.media = { media_ids: mediaIds };
        }
      } catch (error) {
        console.error("Error uploading media:", error);
        throw new Error(`Failed to upload media: ${error.message}`);
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

// Function to generate OAuth signature for Twitter API V1.1
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret || '')}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");
  
  return signature;
}

// Function to generate OAuth header for Twitter API V1.1
function generateOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string> = {},
  accessToken: string,
  accessTokenSecret: string
): string {
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET) {
    throw new Error("Twitter API credentials are missing");
  }
  
  const oauthParams = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
    ...params
  };
  
  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    TWITTER_API_SECRET,
    accessTokenSecret
  );
  
  const oauthHeader = 
    'OAuth ' +
    `oauth_consumer_key="${encodeURIComponent(oauthParams.oauth_consumer_key)}", ` +
    `oauth_nonce="${encodeURIComponent(oauthParams.oauth_nonce)}", ` +
    `oauth_signature="${encodeURIComponent(signature)}", ` +
    `oauth_signature_method="HMAC-SHA1", ` +
    `oauth_timestamp="${oauthParams.oauth_timestamp}", ` +
    `oauth_token="${encodeURIComponent(oauthParams.oauth_token)}", ` +
    `oauth_version="1.0"`;
  
  return oauthHeader;
}

// Simplified function to upload media to Twitter using v2 API with v1.1 media upload
async function uploadMediaToTwitterV2(mediaItem: any, accessToken: string): Promise<string> {
  try {
    console.log("Starting media upload process for item type:", mediaItem.type);
    
    // Step 1: Extract base64 data
    const base64Data = mediaItem.data.split(',')[1];
    const binaryData = atob(base64Data);
    
    // Convert to Uint8Array
    const uint8Array = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i);
    }
    
    // Step 2: Use Twitter's v1.1 media/upload endpoint with Bearer token
    const mediaUploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
    const form = new FormData();
    const blob = new Blob([uint8Array], { type: mediaItem.type });
    
    form.append('media', blob);
    
    console.log("Uploading media with size:", uint8Array.length, "bytes");
    
    const uploadResponse = await fetch(mediaUploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      },
      body: form
    });
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error("Media upload error:", errorData);
      throw new Error(`Failed to upload media: ${errorData}`);
    }
    
    const mediaData = await uploadResponse.json();
    console.log("Media upload successful, media_id:", mediaData.media_id_string);
    
    return mediaData.media_id_string;
  } catch (error) {
    console.error("Error in uploadMediaToTwitterV2:", error);
    throw error;
  }
}
