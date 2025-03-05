
// Twitter OAuth 2.0 Authorization Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const CALLBACK_URL = Deno.env.get("TWITTER_CALLBACK_URL") || "";

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

// Generate PKCE code challenge from verifier
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
    console.log("Headers:", JSON.stringify([...req.headers.entries()]));
    
    if (!TWITTER_CLIENT_ID) {
      console.error("Missing Twitter Client ID");
      throw new Error("Twitter Client ID is not configured");
    }

    if (!CALLBACK_URL) {
      console.error("Missing callback URL");
      throw new Error("Twitter callback URL is not configured");
    }
    
    // Extract request body
    const requestData = await req.json().catch(() => ({}));
    
    // Get the origin of the request
    let origin = requestData.origin || "";
    if (!origin) {
      origin = req.headers.get("origin") || "";
      console.log("Using origin from headers:", origin);
    } else {
      console.log("Using origin from request body:", origin);
    }
    
    // If origin is still empty, use a fallback (can happen with direct API calls)
    if (!origin) {
      const referer = req.headers.get("referer");
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          origin = `${refererUrl.protocol}//${refererUrl.host}`;
          console.log("Using origin from referer:", origin);
        } catch (e) {
          console.log("Failed to parse referer URL:", e);
        }
      }
    }

    // If we still don't have an origin, use the callback URL's origin as a fallback
    if (!origin) {
      try {
        const callbackUrl = new URL(CALLBACK_URL);
        origin = `${callbackUrl.protocol}//${callbackUrl.host}`;
        console.log("Using callback URL origin as fallback:", origin);
      } catch (e) {
        console.log("Failed to parse callback URL:", e);
      }
    }
    
    console.log("Final request origin:", origin);
    
    // Generate state parameter to prevent CSRF attacks - includes timestamp and origin info
    const timestamp = Date.now().toString();
    const randomPart = generateRandomString(24);
    const state = `${randomPart}_${timestamp}`;
    
    // Generate PKCE code verifier
    const codeVerifier = generateRandomString(128);
    // Generate code challenge using S256 method (more secure than plain)
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    console.log("OAuth parameters generated:");
    console.log(`- State: ${state}`);
    console.log(`- Origin: ${origin}`);
    console.log(`- Timestamp: ${timestamp}`);
    console.log(`- Code Verifier: ${codeVerifier.substring(0, 10)}...`);
    console.log(`- Code Challenge: ${codeChallenge.substring(0, 10)}...`);
    console.log(`- Using callback URL: ${CALLBACK_URL}`);
    
    // Build the authorization URL for Twitter OAuth 2.0
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
        state: state,
        codeVerifier: codeVerifier,
        timestamp: timestamp,
        origin: origin
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
