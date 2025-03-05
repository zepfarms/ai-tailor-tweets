
// Twitter OAuth 2.0 Access Token Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET") || "";
const CALLBACK_URL = Deno.env.get("TWITTER_CALLBACK_URL") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

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
    console.log("twitter-access-token function called (OAuth 2.0)");
    
    const { code, state, codeVerifier, expectedState, userId } = await req.json();
    console.log("Received parameters:", { code, state, userId });
    console.log("CodeVerifier length:", codeVerifier?.length);

    if (!code || !state || !codeVerifier || !expectedState) {
      throw new Error("Missing required parameters");
    }
    
    // Verify state parameter to prevent CSRF attacks
    if (state !== expectedState) {
      throw new Error("Invalid state parameter");
    }

    // Log all environment variables we need
    console.log("Environment variables check:");
    console.log("- TWITTER_CLIENT_ID exists:", !!TWITTER_CLIENT_ID);
    console.log("- TWITTER_CLIENT_SECRET exists:", !!TWITTER_CLIENT_SECRET);
    console.log("- CALLBACK_URL exists:", !!CALLBACK_URL);
    console.log("- CALLBACK_URL value:", CALLBACK_URL);
    
    if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
      throw new Error("Missing required Twitter API credentials");
    }

    if (!CALLBACK_URL) {
      throw new Error("Missing callback URL");
    }
    
    // Ensure callback URL is properly formatted
    let callbackUrl = CALLBACK_URL;
    if (!callbackUrl.startsWith("http")) {
      console.log("Callback URL doesn't start with http, assuming it's a relative path");
      // If it's a relative path, we'll need to convert it to an absolute URL
      callbackUrl = `https://lovable.dev/projects/5ab8ef67-83db-439a-adb0-0c1e95912c8f/x-callback`;
      console.log(`Converted callback URL to: ${callbackUrl}`);
    }

    // Exchange the authorization code for an access token
    console.log("Exchanging authorization code for access token");
    
    const tokenParams = new URLSearchParams({
      code: code,
      grant_type: "authorization_code",
      client_id: TWITTER_CLIENT_ID,
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier
    });
    
    console.log("Token request parameters:", tokenParams.toString());
    const authString = btoa(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`);
    
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${authString}`
      },
      body: tokenParams.toString()
    });

    console.log("Token response status:", tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`Twitter token API error (${tokenResponse.status}):`, errorText);
      throw new Error(`Twitter API error: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log("Twitter token response received successfully");
    
    // Get user data from Twitter
    console.log("Fetching user data from Twitter");
    const userResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error(`Twitter user data error (${userResponse.status}):`, errorText);
      throw new Error(`Twitter user data error: ${userResponse.status} - ${errorText}`);
    }

    const userData = await userResponse.json();
    console.log("Twitter user data received:", JSON.stringify(userData));
    
    if (!userData.data || !userData.data.id || !userData.data.username) {
      throw new Error("Invalid user data received from Twitter");
    }

    // If we have a userId, store the X account data
    let xAccountData = null;
    if (userId && SUPABASE_URL && SUPABASE_ANON_KEY) {
      // Initialize Supabase client
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("Storing X account data for user:", userId);

      try {
        // Save the X account data to Supabase
        const { data, error } = await supabase
          .from("x_accounts")
          .upsert({
            user_id: userId,
            x_user_id: userData.data.id,
            x_username: userData.data.username,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            profile_image_url: userData.data.profile_image_url || null,
          })
          .select()
          .single();

        if (error) {
          console.error("Error saving X account:", error);
          // Don't throw here - we still want to return the successful authentication
          console.log("Continuing despite database error");
        } else {
          xAccountData = data;
          console.log("Successfully saved X account data");
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Continue without throwing
      }
    } else {
      console.log("No userId or Supabase credentials provided, skipping database storage");
    }

    return new Response(
      JSON.stringify({
        success: true,
        username: userData.data.username,
        userId: userData.data.id,
        profileImageUrl: userData.data.profile_image_url || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in twitter-access-token function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
