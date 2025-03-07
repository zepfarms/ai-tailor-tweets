
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET") || "";
const TWITTER_CALLBACK_URL = Deno.env.get("TWITTER_CALLBACK_URL") || "https://postedpal.com/x-callback";
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
    console.log("Twitter/X request token function called");
    
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
    
    // Get the userId from the request body
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    console.log("User ID:", userId);
    
    // Generate the Twitter OAuth URL
    const state = crypto.randomUUID();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store the code verifier in Supabase for later use
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: storeError } = await supabase
      .from('oauth_states')
      .upsert({
        user_id: userId,
        state: state,
        code_verifier: codeVerifier,
        provider: 'twitter',
        created_at: new Date().toISOString()
      });
    
    if (storeError) {
      console.error("Error storing OAuth state:", storeError);
      throw new Error("Failed to store OAuth state");
    }
    
    // Build the authorization URL - still using twitter.com as this is still the correct domain for OAuth
    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", TWITTER_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", TWITTER_CALLBACK_URL);
    authUrl.searchParams.append("scope", "tweet.read tweet.write users.read offline.access");
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "S256");
    
    console.log("Authorization URL:", authUrl.toString());

    // Return the authorization URL to the client
    return new Response(
      JSON.stringify({
        authUrl: authUrl.toString(),
        state,
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
        details: "There was an error initiating X authentication. Please check that all required environment variables are properly configured."
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

// Helper function to generate a code verifier
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// Helper function to generate a code challenge
async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

// Base64Url encode function
function base64UrlEncode(buffer: Uint8Array) {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
