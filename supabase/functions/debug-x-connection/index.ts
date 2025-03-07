
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET") || "";
const TWITTER_CALLBACK_URL = Deno.env.get("TWITTER_CALLBACK_URL") || "";
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
    console.log("Debugging X connection configuration");
    
    // Check what environment variables are set
    const environmentInfo = {
      twitterClientIdSet: !!TWITTER_CLIENT_ID,
      twitterClientIdLength: TWITTER_CLIENT_ID ? TWITTER_CLIENT_ID.length : 0,
      twitterClientSecretSet: !!TWITTER_CLIENT_SECRET,
      twitterClientSecretLength: TWITTER_CLIENT_SECRET ? TWITTER_CLIENT_SECRET.length : 0,
      twitterCallbackUrlSet: !!TWITTER_CALLBACK_URL,
      twitterCallbackUrl: TWITTER_CALLBACK_URL,
      supabaseUrlSet: !!SUPABASE_URL,
      supabaseUrl: SUPABASE_URL,
      supabaseServiceRoleKeySet: !!SUPABASE_SERVICE_ROLE_KEY,
      supabaseServiceRoleKeyLength: SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.length : 0,
    };
    
    // Test if we can reach the Twitter APIs
    let twitterApiStatus = "unknown";
    try {
      const response = await fetch("https://api.twitter.com/2/openapi.json");
      twitterApiStatus = response.ok ? "reachable" : `unreachable: ${response.status}`;
    } catch (error) {
      twitterApiStatus = `error: ${error.message}`;
    }

    return new Response(
      JSON.stringify({
        environmentInfo,
        twitterApiStatus,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Debug error:", error);
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
