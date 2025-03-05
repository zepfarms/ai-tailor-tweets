
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
    
    // Check if request is JSON
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Invalid content type:", contentType);
      throw new Error("Request must be JSON");
    }
    
    // Extract request parameters
    const { code, codeVerifier, userId } = await req.json();
    
    if (!code) {
      throw new Error("Missing required authorization code parameter");
    }
    
    if (!codeVerifier) {
      throw new Error("Missing required code verifier parameter");
    }
    
    // Log all environment variables we need
    console.log("Environment variables check:");
    console.log("- TWITTER_CLIENT_ID exists:", !!TWITTER_CLIENT_ID);
    console.log("- TWITTER_CLIENT_SECRET exists:", !!TWITTER_CLIENT_SECRET);
    console.log("- CALLBACK_URL exists:", !!CALLBACK_URL);
    console.log("- CALLBACK_URL value:", CALLBACK_URL);
    
    if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET || !CALLBACK_URL) {
      throw new Error("Missing required environment variables");
    }

    // Exchange the authorization code for an access token
    console.log("Exchanging authorization code for access token");
    
    const tokenParams = new URLSearchParams({
      code: code,
      grant_type: "authorization_code",
      client_id: TWITTER_CLIENT_ID,
      redirect_uri: CALLBACK_URL,
      code_verifier: codeVerifier
    });
    
    console.log("Token request parameters:", {
      code_length: code.length,
      redirect_uri: CALLBACK_URL,
      code_verifier_length: codeVerifier.length
    });

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
    console.log("Twitter token response received");
    
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
    if (userId) {
      // Initialize Supabase client
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("Storing X account data for user:", userId);

      try {
        // Create x_accounts table if it doesn't exist
        // Note: This approach is not ideal for production, but helps during development
        try {
          const { error: tableError } = await supabase.rpc('create_x_accounts_if_not_exists');
          if (tableError) {
            console.log("Error creating table or table already exists:", tableError);
          }
        } catch (tableCreateError) {
          console.error("Error with table operation:", tableCreateError);
          // Continue anyway, as table might already exist
        }

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
        } else {
          console.log("Successfully saved X account data");
        }
      } catch (dbError) {
        console.error("Database operation error:", dbError);
        // Still return success for the authorization part
      }
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
        status: 200
      }
    );
  } catch (error) {
    console.error("Error in twitter-access-token function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred",
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
