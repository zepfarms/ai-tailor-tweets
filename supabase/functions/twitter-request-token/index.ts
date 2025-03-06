
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { OAuth } from "https://deno.land/x/oauth2_client@v1.0.0/mod.ts";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET") || "";
const TWITTER_CALLBACK_URL = "https://www.postedpal.com/x-callback";

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
    const oauth = new OAuth({
      clientId: TWITTER_CLIENT_ID,
      clientSecret: TWITTER_CLIENT_SECRET,
      authorizationEndpointUri: "https://twitter.com/i/oauth2/authorize",
      tokenUri: "https://api.twitter.com/2/oauth2/token",
      redirectUri: TWITTER_CALLBACK_URL,
      scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      state: crypto.randomUUID(),
      codeChallengeMethod: "S256",
    });

    const { uri, codeVerifier, state } = await oauth.code.getAuthorizationUri();

    // Store the state and codeVerifier somewhere (cookies, session, etc.)
    const response = new Response(
      JSON.stringify({
        authUrl: uri.toString(),
        codeVerifier,
        state,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

    return response;
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
