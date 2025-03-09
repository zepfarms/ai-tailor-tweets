
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { TwitterApi } from "https://esm.sh/twitter-api-v2@1.15.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET") || "";

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
    
    const requestData = await req.json();
    const { userId, content, media } = requestData;
    
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
    
    // First try to get token from user_tokens (preferred)
    console.log("Attempting to fetch token from user_tokens table");
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'twitter')
      .single();
    
    let accessToken, refreshToken;
    
    if (tokenError || !tokenData || !tokenData.access_token) {
      console.error("Error retrieving X token from user_tokens:", tokenError);
      
      // Fallback to x_accounts table for backward compatibility
      console.log("Falling back to x_accounts table");
      const { data: accountData, error: accountError } = await supabase
        .from('x_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (accountError || !accountData || !accountData.access_token) {
        console.error("Error retrieving X account:", accountError);
        throw new Error("X account not found or invalid. Please link your account first.");
      }
      
      console.log("Found X account in legacy table:", accountData.x_username);
      accessToken = accountData.access_token;
      refreshToken = null; // Legacy table doesn't have refresh tokens
    } else {
      console.log("Found X token in user_tokens table");
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token || null;
    }
    
    if (!accessToken) {
      console.error("Invalid token data found");
      throw new Error("Invalid X token. Please reconnect your X account.");
    }

    // Create a new TwitterApi instance with the user's access token
    console.log("Creating TwitterApi client with access token");
    const twitterClient = new TwitterApi(accessToken);
    
    // Get the readonly client for testing token validity
    const readOnlyClient = twitterClient.readOnly;
    
    try {
      // Test if the token is valid by making a simple API call
      console.log("Testing token validity with users/me endpoint");
      await readOnlyClient.v2.me();
      console.log("Token validation successful");
    } catch (tokenError) {
      console.error("Error validating token:", tokenError);
      
      // If we have a refresh token, try to refresh the access token
      if (refreshToken && TWITTER_CLIENT_ID && TWITTER_CLIENT_SECRET) {
        try {
          console.log("Attempting to refresh token");
          
          const refreshClient = new TwitterApi({
            clientId: TWITTER_CLIENT_ID,
            clientSecret: TWITTER_CLIENT_SECRET,
          });
          
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
            await refreshClient.refreshOAuth2Token(refreshToken);
          
          console.log("Token refreshed successfully");
          
          // Update the token in the database
          await supabase.from('user_tokens').upsert({
            user_id: userId,
            provider: 'twitter',
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            updated_at: new Date().toISOString()
          });
          
          // Update our local variable
          accessToken = newAccessToken;
          
          // Create a new client with the refreshed token
          twitterClient.setAccessToken(newAccessToken);
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
          throw new Error("Your X account authorization has expired and couldn't be refreshed. Please reconnect your account.");
        }
      } else {
        throw new Error("Your X account authorization has expired. Please reconnect your account.");
      }
    }
    
    // Get the tweet client for posting
    const v2Client = twitterClient.v2;
    
    console.log("Sending post request to X API");
    console.log("Content:", content);
    
    let postData;
    
    // Handle media uploads if present
    if (media && media.length > 0) {
      try {
        console.log("Processing media for upload");
        
        // Get the media client
        const mediaClient = twitterClient.v1.uploadMedia;
        
        // Array to store media IDs
        const mediaIds = [];
        
        // Process each media item
        for (const mediaItem of media) {
          console.log("Processing media item:", mediaItem.type);
          
          // Convert base64 data to Buffer
          const base64Data = mediaItem.data.split(',')[1]; // Remove the data URL prefix
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          // Upload the media based on type
          let mediaId;
          if (mediaItem.type.startsWith('image/')) {
            console.log("Uploading image");
            mediaId = await mediaClient(binaryData, { mimeType: mediaItem.type });
          } else if (mediaItem.type.startsWith('video/')) {
            console.log("Uploading video");
            // Use chunked upload for videos
            mediaId = await mediaClient(binaryData, { 
              mimeType: mediaItem.type,
              type: 'video'
            });
          } else {
            console.log("Unsupported media type:", mediaItem.type);
            continue;
          }
          
          console.log("Media uploaded with ID:", mediaId);
          mediaIds.push(mediaId);
        }
        
        if (mediaIds.length > 0) {
          console.log("Posting with media IDs:", mediaIds);
          // Post the tweet with media
          postData = await v2Client.tweet(content, { media: { media_ids: mediaIds } });
        } else {
          console.log("No valid media uploaded, posting text only");
          postData = await v2Client.tweet(content);
        }
      } catch (mediaError) {
        console.error("Error uploading media:", mediaError);
        // Fallback to posting without media
        console.log("Falling back to posting without media");
        postData = await v2Client.tweet(content);
      }
    } else {
      // Post text-only tweet
      postData = await v2Client.tweet(content);
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
