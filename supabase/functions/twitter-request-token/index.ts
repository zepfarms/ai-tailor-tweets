
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
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
    console.log("Twitter/X request token function called");

    if (!TWITTER_CLIENT_ID) {
      throw new Error("TWITTER_CLIENT_ID environment variable is not set");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not properly configured");
    }

    // Parse request data
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request:", parseError);
      throw new Error("Invalid request format - could not parse JSON");
    }

    const userId = requestData.userId;
    const isLogin = requestData.isLogin === true;
    const origin = requestData.origin || "";

    // Determine the callback URL based on the origin or use the default
    let callbackUrl;
    if (origin) {
      // Parse the origin to ensure it's valid
      try {
        const originUrl = new URL(origin);
        callbackUrl = `${origin}/x-callback`;
        console.log("Using origin-based callback URL:", callbackUrl);
      } catch (urlError) {
        console.warn("Invalid origin provided:", origin);
        callbackUrl = TWITTER_CALLBACK_URL;
      }
    } else {
      callbackUrl = TWITTER_CALLBACK_URL;
    }

    console.log("User ID:", userId || "Not provided (login flow)");
    console.log("Is login flow:", isLogin);
    console.log("Using callback URL:", callbackUrl);

    // Generate state and verifier for PKCE
    const state = crypto.randomUUID();
    const codeVerifier = generateRandomString(64);
    const codeChallenge = codeVerifier; // Twitter accepts the plain method

    console.log("Generated state:", state);
    console.log("Generated code_verifier length:", codeVerifier.length);
    console.log("Using code_challenge_method: plain");

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Store the OAuth state in the database
    const stateRecord = {
      user_id: userId,
      state,
      code_verifier: codeVerifier,
      provider: "twitter",
      created_at: new Date().toISOString(),
      is_login: isLogin,
      callback_url: callbackUrl
    };

    console.log("Inserting state record:", {
      ...stateRecord,
      code_verifier: "[REDACTED]"
    });

    const { error: insertError } = await supabase
      .from("oauth_states")
      .insert(stateRecord);

    if (insertError) {
      console.error("Error storing OAuth state:", insertError);
      throw new Error(`Failed to store OAuth state: ${insertError.message}`);
    }

    console.log("Successfully stored OAuth state");

    // Build the authorization URL
    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", TWITTER_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", callbackUrl);
    authUrl.searchParams.append("scope", "tweet.read tweet.write users.read offline.access");
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "plain");

    console.log("Generated authorization URL (redacted):", 
      authUrl.toString().replace(TWITTER_CLIENT_ID, "[REDACTED_CLIENT_ID]"));

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
        details: "Failed to initialize X authentication"
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

// Function to generate a random string for code_verifier
function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => 
    ('0' + (byte & 0xFF).toString(16)).slice(-2)
  ).join('');
}
