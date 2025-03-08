
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    console.log("Twitter/X request token function called");
    
    // Log all available environment variables for debugging (excluding values)
    console.log("Available environment variables:", Object.keys(Deno.env.toObject()));
    
    // Check if environment variables are set
    if (!TWITTER_CLIENT_ID) {
      throw new Error("TWITTER_CLIENT_ID environment variable is not set");
    }
    
    if (!TWITTER_CLIENT_SECRET) {
      throw new Error("TWITTER_CLIENT_SECRET environment variable is not set");
    }
    
    console.log("All required environment variables are set");
    console.log("Client ID:", TWITTER_CLIENT_ID.substring(0, 4) + "..." + TWITTER_CLIENT_ID.substring(TWITTER_CLIENT_ID.length - 4));
    console.log("Client Secret length:", TWITTER_CLIENT_SECRET.length);
    console.log("Bearer Token available:", !!TWITTER_BEARER_TOKEN);
    
    // Get the userId from the request body and the origin URL for dynamic callback
    let userId = null;
    let isLogin = false;
    let callbackUrl = TWITTER_CALLBACK_URL;
    let origin = null;
    
    try {
      const requestBody = await req.json();
      userId = requestBody.userId;
      isLogin = requestBody.isLogin === true;
      origin = requestBody.origin || null;
      console.log("Request parameters:", { userId, isLogin, origin });
      
      // If origin is provided, use it to create a dynamic callback URL for sandbox environments
      if (origin && origin !== "https://www.postedpal.com") {
        callbackUrl = `${origin}/x-callback`;
        console.log("Using dynamic callback URL:", callbackUrl);
      } else {
        console.log("Using default callback URL:", callbackUrl);
      }
    } catch (error) {
      console.error("Error parsing request JSON:", error);
      throw new Error("Invalid request format. Please provide valid JSON with required fields.");
    }
    
    // For account linking, we need a user ID, but for login flow we don't
    if (!userId && !isLogin) {
      throw new Error("User ID is required for authorization");
    }
    
    // Generate the Twitter OAuth URL
    const state = crypto.randomUUID();
    console.log("⭐⭐⭐ Generated state:", state);
    
    // Use identical code_verifier and code_challenge as required by Twitter with plain method
    const codeVerifier = `verifier_${state}`;
    const codeChallenge = codeVerifier; // Must match exactly with plain method
    console.log("Generated code_verifier:", codeVerifier);
    console.log("Generated code_challenge:", codeChallenge);
    
    // Create Supabase client
    let supabase;
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      console.log("Supabase client created successfully");
    } catch (error) {
      console.error("Error creating Supabase client:", error);
      throw new Error("Failed to connect to Supabase. Check the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }
    
    try {
      console.log("Storing OAuth state with user_id:", userId || "Login flow (no user ID)");
      
      // Explicitly set all required fields including provider
      const stateRecord = {
        user_id: userId || '00000000-0000-0000-0000-000000000000',
        state: state,
        code_verifier: codeVerifier,
        provider: 'twitter', // Explicitly set provider
        created_at: new Date().toISOString(),
        is_login: isLogin,
        callback_url: callbackUrl // Store the callback URL with the state
      };
      
      console.log("Inserting state record:", {
        ...stateRecord,
        code_verifier: "[REDACTED]" // Don't log the actual verifier
      });
      
      const { error: storeError } = await supabase
        .from('oauth_states')
        .insert(stateRecord);
      
      if (storeError) {
        console.error("Error storing OAuth state:", storeError);
        throw new Error(`Failed to store OAuth state: ${storeError.message}`);
      }
      
      console.log("Successfully stored OAuth state in database");
      
      // Verify the state was stored by reading it back
      const { data: verifyState, error: verifyError } = await supabase
        .from('oauth_states')
        .select('*')
        .eq('state', state)
        .eq('provider', 'twitter')
        .single();
        
      if (verifyError || !verifyState) {
        console.error("Failed to verify state was stored:", verifyError);
        console.error("This might indicate a database issue!");
        throw new Error("Failed to verify state was stored properly");
      } else {
        console.log("✅ Successfully verified state in database:", verifyState.state);
        console.log("State record details:", {
          id: verifyState.id,
          state: verifyState.state,
          provider: verifyState.provider,
          created_at: verifyState.created_at,
          callback_url: verifyState.callback_url
        });
      }
    } catch (error) {
      console.error("Error upserting into oauth_states table:", error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
    
    // Create Twitter authorization URL using URL constructor for proper encoding
    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", TWITTER_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", callbackUrl);
    authUrl.searchParams.append("scope", "tweet.read tweet.write users.read offline.access");
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "plain"); // Keep it simple with plain method
    
    console.log("Authorization URL created:", authUrl.toString());
    
    return new Response(
      JSON.stringify({
        authUrl: authUrl.toString(),
        state
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
        details: "There was an error initiating X authentication. Please check that all required environment variables are properly configured and that network connectivity to Twitter services is available.",
        timestamp: new Date().toISOString()
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
