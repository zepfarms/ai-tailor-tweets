
// Twitter OAuth 2.0 Authorization Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const CALLBACK_URL = Deno.env.get("TWITTER_CALLBACK_URL") || "https://www.postedpal.com/x-callback";

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

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("twitter-request-token function called (OAuth 2.0)");
    
    // Check environment variables
    if (!TWITTER_CLIENT_ID) {
      console.error("Missing Twitter Client ID");
      throw new Error("Twitter Client ID is not configured");
    }

    if (!CALLBACK_URL) {
      console.error("Missing callback URL");
      throw new Error("Twitter callback URL is not configured");
    }
    
    // Generate state and PKCE code verifier
    const state = generateRandomString(32);
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    console.log("OAuth parameters generated:");
    console.log(`- State: ${state}`);
    console.log(`- Code Verifier length: ${codeVerifier.length}`);
    console.log(`- Code Challenge: ${codeChallenge.substring(0, 10)}...`);
    console.log(`- Using callback URL: ${CALLBACK_URL}`);
    
    // Build Twitter OAuth URL
    const scope = "tweet.read tweet.write users.read offline.access";
    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", TWITTER_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", CALLBACK_URL);
    authUrl.searchParams.append("scope", scope);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "S256");
    
    console.log("Generated authorization URL:", authUrl.toString());
    
    // Return the auth URL and parameters needed for the callback
    return new Response(
      JSON.stringify({
        authorizeUrl: authUrl.toString(),
        state,
        codeVerifier
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error in twitter-request-token function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
