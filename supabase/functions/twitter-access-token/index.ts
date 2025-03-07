
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET") || "";
const TWITTER_CALLBACK_URL = Deno.env.get("TWITTER_CALLBACK_URL") || "https://www.postedpal.com/x-callback";
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
    console.log("Twitter/X access token function called");
    
    // Check if environment variables are set
    if (!TWITTER_CLIENT_ID) {
      throw new Error("TWITTER_CLIENT_ID environment variable is not set");
    }
    
    if (!TWITTER_CLIENT_SECRET) {
      throw new Error("TWITTER_CLIENT_SECRET environment variable is not set");
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not properly configured");
    }
    
    const { code, state } = await req.json();
    
    if (!code) {
      throw new Error("Authorization code is required");
    }
    
    if (!state) {
      throw new Error("State parameter is required");
    }
    
    console.log("Code provided:", !!code);
    console.log("State:", state);
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Retrieve the stored OAuth state
    const { data: oauthData, error: oauthError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'twitter')
      .single();
    
    if (oauthError || !oauthData) {
      console.error("Error retrieving OAuth state:", oauthError);
      throw new Error("Invalid state parameter");
    }
    
    const userId = oauthData.user_id;
    const codeVerifier = oauthData.code_verifier;
    
    console.log("Retrieved user ID:", userId);
    console.log("Code verifier found:", !!codeVerifier);
    
    // Exchange the authorization code for an access token - still using api.twitter.com as this is still the correct domain
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: TWITTER_CALLBACK_URL,
        code_verifier: codeVerifier,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token response error:", errorData);
      throw new Error(`Failed to exchange code for token: ${errorData}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    console.log("Token response:", !!tokenData);
    console.log("Access token obtained:", !!tokenData.access_token);
    console.log("Refresh token:", !!tokenData.refresh_token);
    
    // Get Twitter user info
    const userResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error("User info response error:", errorData);
      throw new Error(`Failed to fetch user info: ${errorData}`);
    }

    const userData = await userResponse.json();
    console.log("User data:", userData);

    if (userData.data) {
      // Store the Twitter account information in the database
      const { error } = await supabase.from("x_accounts").upsert({
        user_id: userId,
        x_user_id: userData.data.id,
        x_username: userData.data.username,
        profile_image_url: userData.data.profile_image_url,
        access_token: tokenData.access_token,
        access_token_secret: tokenData.refresh_token || "",
      });

      if (error) {
        console.error("Error storing Twitter account:", error);
        throw new Error("Failed to store Twitter account");
      }
      
      // Clean up the OAuth state
      await supabase
        .from('oauth_states')
        .delete()
        .eq('state', state);

      return new Response(
        JSON.stringify({
          success: true,
          username: userData.data.username,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else {
      throw new Error("Failed to fetch Twitter user data");
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "There was an error processing the X authentication callback. Please try again or contact support."
      }),
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
