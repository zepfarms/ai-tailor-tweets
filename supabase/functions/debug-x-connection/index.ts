
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
    // Get request details
    const url = new URL(req.url);
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    
    // Gather debug information about X connection
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        twitter_client_id_exists: !!Deno.env.get("TWITTER_CLIENT_ID"),
        twitter_client_secret_exists: !!Deno.env.get("TWITTER_CLIENT_SECRET"),
        twitter_callback_url: Deno.env.get("TWITTER_CALLBACK_URL"),
        twitter_bearer_token_exists: !!Deno.env.get("TWITTER_BEARER_TOKEN"),
        available_env_vars: Object.keys(Deno.env.toObject()).filter(key => 
          !key.includes("SECRET") && !key.includes("PASSWORD") && !key.includes("KEY")
        ),
        request_host: host,
        request_origin: origin,
        request_url: url.toString()
      },
      callback_information: {
        default_callback: Deno.env.get("TWITTER_CALLBACK_URL"),
        current_origin: origin,
        origin_callback: origin ? `${origin}/x-callback` : null,
        current_location: globalThis.location ? globalThis.location.href : "Not available in Deno context"
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
    
    // Test creating a code_verifier and code_challenge
    try {
      const codeVerifier = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)
      ).join('');

      debugInfo.pkceTest = {
        codeVerifierLength: codeVerifier.length,
        codeVerifierFirstChars: codeVerifier.substring(0, 6) + '...',
        usesPkce: true,
        pkceMethod: 'plain'
      };
    } catch (error) {
      debugInfo.pkceTest = {
        error: error.message,
        stack: error.stack
      };
    }

    // Add database schema information
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") || '',
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ''
      );
      
      // Check if oauth_states has callback_url
      const { data: tableInfo, error: tableError } = await supabase.rpc(
        'pg_get_columns_info',
        { table_name: 'oauth_states' }
      );
      
      if (!tableError && tableInfo) {
        debugInfo.database = {
          oauth_states_columns: tableInfo.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES'
          })),
          has_callback_url: tableInfo.some(col => col.column_name === 'callback_url')
        };
      } else {
        debugInfo.database = {
          error: tableError ? tableError.message : 'No table info returned',
          oauth_states_exists: true // We're assuming it exists but couldn't get column info
        };
      }
    } catch (error) {
      debugInfo.database = {
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

// Helper to create a Supabase client
function createClient(supabaseUrl, supabaseKey) {
  const { createClient } = require("https://esm.sh/@supabase/supabase-js@2.7.1");
  return createClient(supabaseUrl, supabaseKey);
}
