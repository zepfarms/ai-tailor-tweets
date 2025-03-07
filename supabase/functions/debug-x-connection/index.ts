
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        hasTwitterClientId: Boolean(TWITTER_CLIENT_ID),
        twitterClientIdLength: TWITTER_CLIENT_ID?.length || 0,
        twitterClientIdFirstFour: TWITTER_CLIENT_ID ? TWITTER_CLIENT_ID.substring(0, 4) + "..." : "not set",
        hasTwitterClientSecret: Boolean(TWITTER_CLIENT_SECRET),
        twitterClientSecretLength: TWITTER_CLIENT_SECRET?.length || 0,
        hasTwitterCallbackUrl: Boolean(TWITTER_CALLBACK_URL),
        twitterCallbackUrl: TWITTER_CALLBACK_URL || "not set",
        hasSupabaseUrl: Boolean(SUPABASE_URL),
        hasSupabaseServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
        runtime: Deno.version,
      },
      connectivity: {},
      clientCredentialsTest: {},
      dns: {}
    };

    // Test DNS resolution for Twitter domains
    try {
      debugInfo.dns = {
        xResolution: "DNS resolution test not supported in edge functions",
        twitterResolution: "DNS resolution test not supported in edge functions",
      };
    } catch (error) {
      debugInfo.dns = {
        error: error.message,
        stack: error.stack,
      };
    }

    // Test connectivity to Twitter
    try {
      const twitterResponse = await fetch("https://api.twitter.com/2/openapi.json", {
        method: "HEAD",
      });
      
      debugInfo.connectivity = {
        canReachTwitterApi: twitterResponse.ok,
        twitterApiStatus: twitterResponse.status,
        twitterApiStatusText: twitterResponse.statusText,
      };
    } catch (error) {
      debugInfo.connectivity = {
        canReachTwitterApi: false,
        error: error.message,
        stack: error.stack,
      };
    }

    // Test client credentials flow
    try {
      if (TWITTER_CLIENT_ID && TWITTER_CLIENT_SECRET) {
        const authString = btoa(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`);
        
        const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authString}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
          }),
        });
        
        const responseBody = await tokenResponse.text();
        
        debugInfo.clientCredentialsTest = {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          success: tokenResponse.ok,
          responseBody: responseBody.length > 1000 ? responseBody.substring(0, 1000) + "..." : responseBody,
        };
      } else {
        debugInfo.clientCredentialsTest = {
          skipped: true,
          reason: "Missing Twitter client credentials",
        };
      }
    } catch (error) {
      debugInfo.clientCredentialsTest = {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }

    return new Response(
      JSON.stringify(debugInfo, null, 2),
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
        stack: error.stack,
        note: "An error occurred while collecting debug information."
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
