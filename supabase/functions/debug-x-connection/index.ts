
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
      twitterClientIdFirstChars: TWITTER_CLIENT_ID ? TWITTER_CLIENT_ID.substring(0, 4) + "..." : "",
      twitterClientSecretSet: !!TWITTER_CLIENT_SECRET,
      twitterClientSecretLength: TWITTER_CLIENT_SECRET ? TWITTER_CLIENT_SECRET.length : 0,
      twitterClientSecretFirstChars: TWITTER_CLIENT_SECRET ? TWITTER_CLIENT_SECRET.substring(0, 4) + "..." : "",
      twitterCallbackUrlSet: !!TWITTER_CALLBACK_URL,
      twitterCallbackUrl: TWITTER_CALLBACK_URL,
      supabaseUrlSet: !!SUPABASE_URL,
      supabaseUrl: SUPABASE_URL,
      supabaseServiceRoleKeySet: !!SUPABASE_SERVICE_ROLE_KEY,
      supabaseServiceRoleKeyLength: SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.length : 0,
    };
    
    // Test Twitter API connectivity - try multiple endpoints
    let twitterApiStatus = { 
      openapi: "unknown",
      authEndpoint: "unknown",
      apiEndpoint: "unknown",
      oauthEndpoint: "unknown"
    };
    
    // Test OpenAPI endpoint
    try {
      const openApiResponse = await fetch("https://api.twitter.com/2/openapi.json");
      twitterApiStatus.openapi = openApiResponse.ok ? 
        `reachable: ${openApiResponse.status}` : 
        `unreachable: ${openApiResponse.status} - ${await openApiResponse.text().catch(() => "No response body")}`;
    } catch (error) {
      twitterApiStatus.openapi = `error: ${error.message}`;
    }
    
    // Test auth endpoint
    try {
      const authResponse = await fetch("https://twitter.com/i/oauth2/authorize", {
        method: "HEAD"
      });
      twitterApiStatus.authEndpoint = authResponse.ok ? 
        `reachable: ${authResponse.status}` : 
        `unreachable: ${authResponse.status} - ${await authResponse.text().catch(() => "No response body")}`;
    } catch (error) {
      twitterApiStatus.authEndpoint = `error: ${error.message}`;
    }
    
    // Test API endpoint
    try {
      const apiResponse = await fetch("https://api.twitter.com/2/tweets", {
        method: "HEAD"
      });
      twitterApiStatus.apiEndpoint = apiResponse.ok ? 
        `reachable: ${apiResponse.status}` : 
        `unreachable: ${apiResponse.status} - ${await apiResponse.text().catch(() => "No response body")}`;
    } catch (error) {
      twitterApiStatus.apiEndpoint = `error: ${error.message}`;
    }
    
    // Test OAuth endpoint
    try {
      const oauthResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "HEAD"
      });
      twitterApiStatus.oauthEndpoint = oauthResponse.ok ? 
        `reachable: ${oauthResponse.status}` : 
        `unreachable: ${oauthResponse.status} - ${await oauthResponse.text().catch(() => "No response body")}`;
    } catch (error) {
      twitterApiStatus.oauthEndpoint = `error: ${error.message}`;
    }

    // Try a test authorization URL generation
    let authUrlTest = { success: false, error: null, url: null };
    try {
      const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("client_id", TWITTER_CLIENT_ID);
      authUrl.searchParams.append("redirect_uri", TWITTER_CALLBACK_URL);
      authUrl.searchParams.append("scope", "tweet.read tweet.write users.read offline.access");
      authUrl.searchParams.append("state", "test-state");
      authUrl.searchParams.append("code_challenge", "test_challenge");
      authUrl.searchParams.append("code_challenge_method", "S256");
      
      authUrlTest = {
        success: true,
        error: null,
        url: authUrl.toString()
      };
    } catch (error) {
      authUrlTest = {
        success: false,
        error: error.message,
        url: null
      };
    }
    
    // Test DNS resolution for Twitter domains
    let dnsStatus = {
      twitter: "unknown",
      api: "unknown",
      upload: "unknown"
    };
    
    try {
      // Using a DNS over HTTPS service to check resolution
      const twitterDnsResponse = await fetch("https://dns.google/resolve?name=twitter.com");
      const twitterDnsData = await twitterDnsResponse.json();
      dnsStatus.twitter = twitterDnsData.Answer ? `resolves: ${JSON.stringify(twitterDnsData.Answer.map(a => a.data).slice(0, 2))}` : "does not resolve";
    } catch (error) {
      dnsStatus.twitter = `error: ${error.message}`;
    }
    
    try {
      const apiDnsResponse = await fetch("https://dns.google/resolve?name=api.twitter.com");
      const apiDnsData = await apiDnsResponse.json();
      dnsStatus.api = apiDnsData.Answer ? `resolves: ${JSON.stringify(apiDnsData.Answer.map(a => a.data).slice(0, 2))}` : "does not resolve";
    } catch (error) {
      dnsStatus.api = `error: ${error.message}`;
    }
    
    try {
      const uploadDnsResponse = await fetch("https://dns.google/resolve?name=upload.twitter.com");
      const uploadDnsData = await uploadDnsResponse.json();
      dnsStatus.upload = uploadDnsData.Answer ? `resolves: ${JSON.stringify(uploadDnsData.Answer.map(a => a.data).slice(0, 2))}` : "does not resolve";
    } catch (error) {
      dnsStatus.upload = `error: ${error.message}`;
    }

    return new Response(
      JSON.stringify({
        environmentInfo,
        twitterApiStatus,
        dnsStatus,
        authUrlTest,
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
