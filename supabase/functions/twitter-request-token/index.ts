
// Twitter OAuth1.0a Request Token Edge Function
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.110.0/node/crypto.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.82.0/encoding/base64.ts";

const TWITTER_CONSUMER_KEY = Deno.env.get("TWITTER_CONSUMER_KEY") || "";
const TWITTER_CONSUMER_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET") || "";
const CALLBACK_URL = Deno.env.get("TWITTER_CALLBACK_URL") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

function createSignature(
  method: string,
  url: string,
  parameters: Record<string, string>,
  consumerSecret: string,
  tokenSecret = ""
): string {
  // Create the parameter string
  const parameterString = Object.keys(parameters)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(parameters[key])}`)
    .join("&");

  // Create the signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(parameterString)
  ].join("&");

  // Create the signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  // Create the signature using HMAC-SHA1
  const hmac = createHmac("sha1", signingKey);
  hmac.update(signatureBaseString);
  return encodeBase64(hmac.digest());
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("twitter-request-token function called");
    
    const method = "POST";
    const url = "https://api.twitter.com/oauth/request_token";
    const timestamp = generateTimestamp();
    const nonce = generateNonce();

    // Create the OAuth parameters
    const parameters: Record<string, string> = {
      oauth_consumer_key: TWITTER_CONSUMER_KEY,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_version: "1.0",
      oauth_callback: CALLBACK_URL,
    };

    console.log("OAuth parameters:", parameters);
    console.log("Using callback URL:", CALLBACK_URL);

    // Generate the signature
    const signature = createSignature(
      method,
      url,
      parameters,
      TWITTER_CONSUMER_SECRET
    );

    // Add the signature to the parameters
    parameters.oauth_signature = signature;

    // Create the Authorization header
    const authHeader = "OAuth " + Object.keys(parameters)
      .map(key => `${percentEncode(key)}="${percentEncode(parameters[key])}"`)
      .join(", ");

    console.log("Authorization header:", authHeader);

    // Send the request to Twitter
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Twitter API error (${response.status}):`, error);
      throw new Error(`Twitter API error: ${error}`);
    }

    const data = await response.text();
    console.log("Twitter response:", data);
    
    const parsedData: Record<string, string> = {};
    
    data.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      parsedData[key] = value;
    });

    // Return the request token and authorize URL
    return new Response(
      JSON.stringify({
        requestToken: parsedData.oauth_token,
        requestTokenSecret: parsedData.oauth_token_secret,
        authorizeUrl: `https://api.twitter.com/oauth/authorize?oauth_token=${parsedData.oauth_token}`,
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
