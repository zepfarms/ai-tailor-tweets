
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET") || "";
const TWITTER_CALLBACK_URL = Deno.env.get("TWITTER_CALLBACK_URL") || "https://www.postedpal.com/x-callback";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const TWITTER_BEARER_TOKEN = Deno.env.get("TWITTER_BEARER_TOKEN") || "";

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
    
    // Log available tokens and credentials (safely)
    console.log("Bearer Token available:", !!TWITTER_BEARER_TOKEN);
    console.log("Client ID available:", !!TWITTER_CLIENT_ID);
    console.log("Client Secret available:", !!TWITTER_CLIENT_SECRET);
    console.log("Using callback URL:", TWITTER_CALLBACK_URL);
    
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request:", parseError);
      throw new Error("Invalid request format - could not parse JSON");
    }
    
    const { code, state } = requestData;
    
    console.log("Request data:", { codeProvided: !!code, state });
    console.log("Received state from callback:", state);
    
    if (!code) {
      throw new Error("Authorization code is required");
    }
    
    if (!state) {
      throw new Error("State parameter is required");
    }
    
    // Create Supabase client
    let supabase;
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      console.log("Supabase client created");
    } catch (supabaseError) {
      console.error("Error creating Supabase client:", supabaseError);
      throw new Error("Failed to connect to Supabase");
    }
    
    // First check if table exists and has records
    const { count, error: countError } = await supabase
      .from('oauth_states')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error checking oauth_states table:", countError);
    } else {
      console.log(`oauth_states table has ${count} total records`);
    }
    
    // Log the exact query we're about to run
    console.log("Executing query:", { 
      table: 'oauth_states', 
      filters: [
        { column: 'state', value: state },
        { column: 'provider', value: 'twitter' }
      ]
    });
    
    // Retrieve the stored OAuth state using maybeSingle instead of single to avoid errors
    const { data: oauthData, error: oauthError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'twitter')
      .maybeSingle();
    
    console.log("OAuth state query result:", { 
      dataFound: !!oauthData, 
      error: oauthError,
      data: oauthData ? {
        state: oauthData.state,
        provider: oauthData.provider,
        created_at: oauthData.created_at,
        code_verifier: oauthData.code_verifier ? "[REDACTED]" : null
      } : null
    });
    
    // Extra debugging: get the 10 most recent oauth states regardless of provider or state
    const { data: allRecentStates, error: recentStatesError } = await supabase
      .from('oauth_states')
      .select('state, provider, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    console.log("10 most recent states in database:", allRecentStates || "None or error");
    if (recentStatesError) console.error("Error fetching recent states:", recentStatesError);
    
    if (oauthError) {
      console.error("Error retrieving OAuth state:", oauthError);
      return new Response(
        JSON.stringify({ 
          error: "Database error when retrieving OAuth state",
          details: oauthError 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    if (!oauthData) {
      console.error("No matching OAuth state found for:", state);
      // Try to see if the state exists with a different provider
      const { data: stateWithAnyProvider, error: anyProviderError } = await supabase
        .from('oauth_states')
        .select('state, provider, created_at')
        .eq('state', state)
        .maybeSingle();
        
      console.log("State with any provider result:", { 
        found: !!stateWithAnyProvider, 
        error: anyProviderError,
        data: stateWithAnyProvider
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid or expired state parameter", 
          details: "The state parameter provided doesn't match any stored OAuth state",
          recentStates: allRecentStates ? allRecentStates.map(s => ({
            statePrefixStored: s.state.substring(0, 8),
            provider: s.provider,
            created: s.created_at
          })) : null,
          stateReceived: state.substring(0, 8) + "..." 
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    const userId = oauthData.user_id;
    const codeVerifier = oauthData.code_verifier;
    const isLogin = oauthData.is_login === true;
    
    console.log("Retrieved user ID:", userId || "Not provided (login flow)");
    console.log("Code verifier found:", !!codeVerifier);
    console.log("Is login flow:", isLogin);
    
    // Exchange the authorization code for an access token
    console.log("Attempting to exchange code for token");
    
    // Build the form data for the token request
    const tokenRequestBody = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: TWITTER_CALLBACK_URL,
      code_verifier: codeVerifier,
    });

    console.log("Token request parameters:", tokenRequestBody.toString());
    
    // Create base64 encoded credentials string
    const credentials = `${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`;
    const encodedCredentials = btoa(credentials);
    
    console.log("Authorization credentials prepared");
    console.log("Encoded credentials length:", encodedCredentials.length);
    
    let tokenResponse;
    let tokenData;
    try {
      console.log("Sending token request to https://api.twitter.com/2/oauth2/token");
      
      tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${encodedCredentials}`,
        },
        body: tokenRequestBody.toString(),
      });
      
      console.log("Token response status:", tokenResponse.status);
      
      const responseText = await tokenResponse.text();
      console.log("Token response body:", responseText);
      
      if (!tokenResponse.ok) {
        console.error("Token response error text:", responseText);
        return new Response(
          JSON.stringify({ 
            error: "Failed to exchange code for token", 
            details: responseText,
            status: tokenResponse.status
          }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      try {
        tokenData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing token response:", parseError);
        throw new Error("Invalid response from Twitter token endpoint");
      }
      
      console.log("Token response received:", !!tokenData);
      console.log("Access token obtained:", !!tokenData.access_token);
      console.log("Refresh token:", !!tokenData.refresh_token);
    } catch (fetchError) {
      console.error("Fetch error when exchanging token:", fetchError);
      throw new Error(`Network error when exchanging token: ${fetchError.message}`);
    }
    
    // Get Twitter user info
    console.log("Fetching user info");
    let userResponse;
    try {
      // First try with the obtained access token
      userResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`
        }
      });
      
      console.log("User info response status with access token:", userResponse.status);
      
      // If that fails and we have a bearer token, try with the bearer token
      if (!userResponse.ok && TWITTER_BEARER_TOKEN) {
        console.log("Retrying with Bearer token");
        userResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
          headers: {
            "Authorization": `Bearer ${TWITTER_BEARER_TOKEN}`
          }
        });
        console.log("User info response status with bearer token:", userResponse.status);
      }
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("User info response error:", errorText);
        throw new Error(`Failed to fetch user info: HTTP ${userResponse.status} - ${errorText}`);
      }
    } catch (fetchError) {
      console.error("Fetch error when getting user info:", fetchError);
      throw new Error(`Network error when fetching user info: ${fetchError.message}`);
    }

    let userData;
    try {
      userData = await userResponse.json();
      console.log("User data received:", !!userData);
      if (userData.data) {
        console.log("User data username:", userData.data.username);
      }
    } catch (parseError) {
      console.error("Error parsing user response:", parseError);
      throw new Error("Invalid response from Twitter user endpoint");
    }

    // Clean up the OAuth state
    console.log("Cleaning up OAuth state");
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state);

    // Return the user data and token information
    return new Response(
      JSON.stringify({
        success: true,
        username: userData.data?.username,
        userId: userData.data?.id,
        tokenInfo: {
          access_token_available: !!tokenData.access_token,
          token_type: tokenData.token_type,
          expires_in: tokenData.expires_in
        }
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
