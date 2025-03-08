
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// OAuth 2.0 credentials (newer API)
const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET") || "";
const TWITTER_CALLBACK_URL = Deno.env.get("TWITTER_CALLBACK_URL") || "";

// OAuth 1.0a credentials (older API)
const TWITTER_CONSUMER_KEY = Deno.env.get("TWITTER_CONSUMER_KEY") || "";
const TWITTER_CONSUMER_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET") || "";
const TWITTER_ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN") || "";
const TWITTER_ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET") || "";

// Supabase configuration
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
    // Print out all environment variables keys (not values) for debugging
    console.log("Available environment variables:", Object.keys(Deno.env.toObject()));
    
    console.log("OAuth 2.0 credentials check:");
    console.log("TWITTER_CLIENT_ID set:", Boolean(TWITTER_CLIENT_ID), TWITTER_CLIENT_ID ? TWITTER_CLIENT_ID.substring(0, 4) + "..." : "not set");
    console.log("TWITTER_CLIENT_SECRET set:", Boolean(TWITTER_CLIENT_SECRET), TWITTER_CLIENT_SECRET ? "length: " + TWITTER_CLIENT_SECRET.length : "not set");
    console.log("TWITTER_CALLBACK_URL set:", Boolean(TWITTER_CALLBACK_URL), TWITTER_CALLBACK_URL || "not set");
    
    console.log("OAuth 1.0a credentials check:");
    console.log("TWITTER_CONSUMER_KEY set:", Boolean(TWITTER_CONSUMER_KEY), TWITTER_CONSUMER_KEY ? TWITTER_CONSUMER_KEY.substring(0, 4) + "..." : "not set");
    console.log("TWITTER_CONSUMER_SECRET set:", Boolean(TWITTER_CONSUMER_SECRET), TWITTER_CONSUMER_SECRET ? "length: " + TWITTER_CONSUMER_SECRET.length : "not set");
    console.log("TWITTER_ACCESS_TOKEN set:", Boolean(TWITTER_ACCESS_TOKEN), TWITTER_ACCESS_TOKEN ? TWITTER_ACCESS_TOKEN.substring(0, 4) + "..." : "not set");
    console.log("TWITTER_ACCESS_TOKEN_SECRET set:", Boolean(TWITTER_ACCESS_TOKEN_SECRET), TWITTER_ACCESS_TOKEN_SECRET ? "length: " + TWITTER_ACCESS_TOKEN_SECRET.length : "not set");

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        // OAuth 2.0 credentials
        hasTwitterClientId: Boolean(TWITTER_CLIENT_ID),
        twitterClientIdLength: TWITTER_CLIENT_ID?.length || 0,
        twitterClientIdFirstFour: TWITTER_CLIENT_ID ? TWITTER_CLIENT_ID.substring(0, 4) + "..." : "not set",
        hasTwitterClientSecret: Boolean(TWITTER_CLIENT_SECRET),
        twitterClientSecretLength: TWITTER_CLIENT_SECRET?.length || 0,
        hasTwitterCallbackUrl: Boolean(TWITTER_CALLBACK_URL),
        twitterCallbackUrl: TWITTER_CALLBACK_URL || "not set",
        
        // OAuth 1.0a credentials
        hasTwitterConsumerKey: Boolean(TWITTER_CONSUMER_KEY),
        twitterConsumerKeyLength: TWITTER_CONSUMER_KEY?.length || 0,
        hasTwitterConsumerSecret: Boolean(TWITTER_CONSUMER_SECRET),
        twitterConsumerSecretLength: TWITTER_CONSUMER_SECRET?.length || 0,
        hasTwitterAccessToken: Boolean(TWITTER_ACCESS_TOKEN),
        twitterAccessTokenLength: TWITTER_ACCESS_TOKEN?.length || 0,
        hasTwitterAccessTokenSecret: Boolean(TWITTER_ACCESS_TOKEN_SECRET),
        twitterAccessTokenSecretLength: TWITTER_ACCESS_TOKEN_SECRET?.length || 0,
        
        // Supabase credentials
        hasSupabaseUrl: Boolean(SUPABASE_URL),
        hasSupabaseServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
        runtime: Deno.version,
      },
      connectivity: {},
      oauth2Test: {},
      oauth1Test: {},
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

    // Test connectivity to Twitter - Using GET method instead of HEAD
    try {
      const twitterResponse = await fetch("https://api.twitter.com/2/openapi.json", {
        method: "GET",
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

    // Test OAuth 2.0 client credentials flow
    try {
      if (TWITTER_CLIENT_ID && TWITTER_CLIENT_SECRET) {
        console.log("Testing OAuth 2.0 client credentials flow");
        
        // Method 1: Using Authorization header with Basic auth
        // Proper encoding of client_id:client_secret
        const authString = btoa(`${encodeURIComponent(TWITTER_CLIENT_ID)}:${encodeURIComponent(TWITTER_CLIENT_SECRET)}`);
        
        console.log("Method 1: Using Authorization header with Basic auth");
        console.log("Token endpoint URL: https://api.twitter.com/2/oauth2/token");
        console.log("Auth string length:", authString.length);
        
        const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authString}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
          }).toString(),
        });
        
        console.log("Token response status:", tokenResponse.status);
        console.log("Token response headers:", Object.fromEntries(tokenResponse.headers.entries()));
        
        const responseBody = await tokenResponse.text();
        let parsedResponse = null;
        
        try {
          if (responseBody && responseBody.trim()) {
            parsedResponse = JSON.parse(responseBody);
            console.log("Parsed response:", JSON.stringify(parsedResponse));
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
        }
        
        debugInfo.oauth2Test = {
          method: "Basic Authorization header",
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          success: tokenResponse.ok,
          responseBody: responseBody.length > 1000 ? responseBody.substring(0, 1000) + "..." : responseBody,
          parsedError: parsedResponse?.error || null,
          parsedErrorDescription: parsedResponse?.error_description || null,
        };
        
        // Method 2: Using client_id and client_secret as parameters
        if (!tokenResponse.ok) {
          console.log("Method 2: Using client_id and client_secret as parameters");
          
          const altTokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "client_credentials",
              client_id: TWITTER_CLIENT_ID,
              client_secret: TWITTER_CLIENT_SECRET
            }).toString(),
          });
          
          console.log("Alternative token response status:", altTokenResponse.status);
          console.log("Alternative token response headers:", Object.fromEntries(altTokenResponse.headers.entries()));
          
          const altResponseBody = await altTokenResponse.text();
          let altParsedResponse = null;
          
          try {
            if (altResponseBody && altResponseBody.trim()) {
              altParsedResponse = JSON.parse(altResponseBody);
              console.log("Alternative parsed response:", JSON.stringify(altParsedResponse));
            }
          } catch (parseError) {
            console.error("Error parsing alternate response:", parseError);
          }
          
          debugInfo.oauth2Test.alternateAttempt = {
            method: "Form parameters",
            status: altTokenResponse.status,
            statusText: altTokenResponse.statusText,
            success: altTokenResponse.ok,
            responseBody: altResponseBody.length > 1000 ? altResponseBody.substring(0, 1000) + "..." : altResponseBody,
            parsedError: altParsedResponse?.error || null,
            parsedErrorDescription: altParsedResponse?.error_description || null,
          };
        }
      } else {
        debugInfo.oauth2Test = {
          skipped: true,
          reason: "Missing Twitter OAuth 2.0 client credentials",
        };
      }
    } catch (error) {
      debugInfo.oauth2Test = {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
    
    // Test OAuth 1.0a credentials if available
    try {
      if (TWITTER_CONSUMER_KEY && TWITTER_CONSUMER_SECRET && 
          TWITTER_ACCESS_TOKEN && TWITTER_ACCESS_TOKEN_SECRET) {
        console.log("Testing OAuth 1.0a credentials");
        
        // This endpoint requires OAuth 1.0a
        const accountResponse = await fetch("https://api.twitter.com/1.1/account/verify_credentials.json", {
          method: "GET",
          headers: {
            // We're not implementing the full OAuth 1.0a flow here as it's complex
            // Just checking if the credentials are available
            "X-Test-Only": "Not performing actual OAuth 1.0a request",
          }
        });
        
        debugInfo.oauth1Test = {
          credentialsPresent: true,
          message: "OAuth 1.0a credentials are configured, but actual authentication test is not implemented in this diagnostic"
        };
      } else {
        debugInfo.oauth1Test = {
          credentialsPresent: false,
          reason: "Missing Twitter OAuth 1.0a credentials",
          missingCredentials: {
            consumerKey: !TWITTER_CONSUMER_KEY,
            consumerSecret: !TWITTER_CONSUMER_SECRET,
            accessToken: !TWITTER_ACCESS_TOKEN,
            accessTokenSecret: !TWITTER_ACCESS_TOKEN_SECRET
          }
        };
      }
    } catch (error) {
      debugInfo.oauth1Test = {
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
