
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    // Gather debug information about X connection
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        twitter_client_id_exists: !!Deno.env.get("TWITTER_CLIENT_ID"),
        twitter_client_secret_exists: !!Deno.env.get("TWITTER_CLIENT_SECRET"),
        twitter_callback_url: Deno.env.get("TWITTER_CALLBACK_URL"),
        twitter_bearer_token_exists: !!Deno.env.get("TWITTER_BEARER_TOKEN"),
        available_env_vars: Object.keys(Deno.env.toObject())
      }
    };

    // Attempt to validate Twitter API keys
    try {
      const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${btoa(`${Deno.env.get("TWITTER_CLIENT_ID")}:${Deno.env.get("TWITTER_CLIENT_SECRET")}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
        }),
      });
      
      debugInfo.tokenEndpointTest = {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        headers: Object.fromEntries(tokenResponse.headers.entries()),
        isClientCredentialsValid: tokenResponse.status === 200 || tokenResponse.status === 403, // 403 means credentials are valid but don't have client_credentials grant
      };
      
      if (tokenResponse.status === 200) {
        // We were able to get a token! This is unusual for most X API apps, but good if it works
        const tokenData = await tokenResponse.json();
        debugInfo.tokenEndpointTest.gotToken = true;
        debugInfo.tokenEndpointTest.tokenType = tokenData.token_type;
      } else {
        const errorText = await tokenResponse.text();
        debugInfo.tokenEndpointTest.errorText = errorText;
      }
    } catch (error) {
      debugInfo.tokenEndpointTest = {
        error: error.message,
        stack: error.stack
      };
    }
    
    // Return the debug information
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
    console.error("Error in debug function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
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
