
// Twitter OAuth 2.0 Authorization Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const CALLBACK_URL = Deno.env.get("TWITTER_CALLBACK_URL") || "https://your-app-url.com/x-callback";
// OAuth 2.0 doesn't use the consumer secret for the authorization step

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("twitter-request-token function called (OAuth 2.0)");
    
    if (!TWITTER_CLIENT_ID) {
      console.error("Missing Twitter Client ID");
      throw new Error("Twitter Client ID is not configured");
    }

    if (!CALLBACK_URL) {
      console.error("Missing callback URL");
      throw new Error("Twitter callback URL is not configured");
    }
    
    // Generate state parameter to prevent CSRF attacks
    const state = generateRandomString(32);
    // Generate PKCE code verifier and code challenge
    const codeVerifier = generateRandomString(128);
    // In a real implementation, we'd need to hash this for the code challenge
    // For simplicity, we're using the same value
    const codeChallenge = codeVerifier;
    
    // Store these in a secure location for later validation
    // For now, we'll return them to be stored client-side
    
    // Build the authorization URL for Twitter OAuth 2.0
    const scope = "tweet.read tweet.write users.read offline.access";
    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", TWITTER_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", CALLBACK_URL);
    authUrl.searchParams.append("scope", scope);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "plain"); // Use S256 in production
    
    console.log("Generated authorization URL:", authUrl.toString());
    
    // Return the auth URL and parameters needed for the callback
    return new Response(
      JSON.stringify({
        authorizeUrl: authUrl.toString(),
        state: state,
        codeVerifier: codeVerifier
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in twitter-request-token function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
