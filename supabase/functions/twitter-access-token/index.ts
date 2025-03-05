
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

    if (!code || !state || !codeVerifier || !expectedState || !userId) {
      throw new Error("Missing required parameters");
    }
    
    // Verify state parameter to prevent CSRF attacks
    if (state !== expectedState) {
      throw new Error("Invalid state parameter");
    }

    // Exchange the authorization code for an access token
    console.log("Exchanging authorization code for access token");
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        code: code,
        grant_type: "authorization_code",
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: CALLBACK_URL,
        code_verifier: codeVerifier
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`Twitter API error (${tokenResponse.status}):`, errorText);
      throw new Error(`Twitter API error: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log("Twitter token response:", JSON.stringify(tokenData));
    
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
      throw new Error(`Twitter user data error: ${errorText}`);
    }

    const userData = await userResponse.json();
    console.log("Twitter user data:", JSON.stringify(userData));
    
    if (!userData.data || !userData.data.id || !userData.data.username) {
      throw new Error("Invalid user data received from Twitter");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Storing X account data for user:", userId);

    // Save the X account data to Supabase
    const { data: xAccountData, error: xAccountError } = await supabase
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

    if (xAccountError) {
      console.error("Error saving X account:", xAccountError);
      throw new Error(`Error saving X account: ${xAccountError.message}`);
    }

    console.log("Successfully saved X account data:", xAccountData);

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
