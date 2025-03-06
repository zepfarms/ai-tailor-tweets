
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { OAuth } from "https://deno.land/x/oauth2_client@v1.0.0/mod.ts";
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
    console.log("Twitter access token function called");
    
    const { code, codeVerifier, state, userId } = await req.json();
    
    console.log("Code provided:", !!code);
    console.log("Code verifier length:", codeVerifier?.length);
    console.log("State:", state);
    console.log("User ID:", userId);
    
    // Extract userId from state if it's in the format "uuid_userId"
    let extractedUserId = userId;
    if (state && state.includes("_")) {
      extractedUserId = state.split("_")[1];
      console.log("Extracted user ID from state:", extractedUserId);
    }
    
    if (!extractedUserId) {
      throw new Error("User ID is required");
    }

    const oauth = new OAuth({
      clientId: TWITTER_CLIENT_ID,
      clientSecret: TWITTER_CLIENT_SECRET,
      authorizationEndpointUri: "https://twitter.com/i/oauth2/authorize",
      tokenUri: "https://api.twitter.com/2/oauth2/token",
      redirectUri: TWITTER_CALLBACK_URL,
      scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      state,
      codeChallengeMethod: "S256",
    });

    const tokens = await oauth.code.getToken(code, codeVerifier);
    console.log("Token response:", !!tokens);
    console.log("Access token length:", tokens.accessToken?.length);
    console.log("Refresh token:", !!tokens.refreshToken);

    // Get Twitter user info
    const userResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    const userData = await userResponse.json();
    console.log("User data:", userData);

    if (userData.data) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Store the Twitter account information in the database
      const { error } = await supabase.from("x_accounts").upsert({
        user_id: extractedUserId,
        x_user_id: userData.data.id,
        x_username: userData.data.username,
        profile_image_url: userData.data.profile_image_url,
        access_token: tokens.accessToken,
        access_token_secret: tokens.refreshToken || "",
      });

      if (error) {
        console.error("Error storing Twitter account:", error);
        return new Response(
          JSON.stringify({ error: "Failed to store Twitter account" }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

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
      return new Response(
        JSON.stringify({ error: "Failed to fetch Twitter user data" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
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
