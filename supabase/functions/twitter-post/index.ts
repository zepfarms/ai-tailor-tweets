
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
    
    // First try to get token from user_tokens (preferred)
    console.log("Attempting to fetch token from user_tokens table");
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'twitter')
      .single();
    
    let userData;
    
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
      userData = accountData;
    } else {
      console.log("Found X token in user_tokens table");
      userData = tokenData;
    }
    
    if (!userData.access_token) {
      console.error("Invalid token data found:", userData);
      throw new Error("Invalid X token. Please reconnect your X account.");
    }
    
    // Test token validity before trying to post
    try {
      console.log("Testing token validity with users/me endpoint");
      const testResponse = await fetch("https://api.twitter.com/2/users/me", {
        headers: {
          "Authorization": `Bearer ${userData.access_token}`
        }
      });
      
      if (!testResponse.ok) {
        const testError = await testResponse.text();
        console.error("Token validation failed:", testError);
        throw new Error("Your X account authorization has expired. Please reconnect your account.");
      }
      
      console.log("Token validation successful");
    } catch (testError) {
      console.error("Error validating token:", testError);
      throw new Error("Failed to validate your X account. Please reconnect your account.");
    }
    
    // Build the post payload
    const postPayload = {
      text: content || ""
    };
    
    // If we have media, we need to handle it separately (not implemented in this fix)
    if (media && media.length > 0) {
      console.log("Media posting is not supported in this version");
    }
    
    console.log("Sending post request to X API");
    console.log("Payload:", JSON.stringify(postPayload));
    
    // Post to X
    const postResponse = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userData.access_token}`,
      },
      body: JSON.stringify(postPayload),
    });
    
    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      console.error("Post response error:", errorText);
      
      // Check specific error types
      if (postResponse.status === 401) {
        throw new Error("Your X authorization has expired. Please reconnect your account.");
      } else if (postResponse.status === 403) {
        throw new Error("You don't have permission to post. Make sure your X app has write access.");
      } else {
        throw new Error(`Failed to publish post: ${errorText}`);
      }
    }
    
    const postData = await postResponse.json();
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
        has_media: false
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
