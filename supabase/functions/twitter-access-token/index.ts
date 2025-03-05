
// Twitter OAuth1.0a Access Token Edge Function
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.110.0/node/crypto.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.82.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const TWITTER_CONSUMER_KEY = Deno.env.get("TWITTER_CONSUMER_KEY") || "";
const TWITTER_CONSUMER_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

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
    console.log("twitter-access-token function called");
    
    const { token, verifier, tokenSecret, userId } = await req.json();
    console.log("Received parameters:", { token, verifier, userId });

    if (!token || !verifier || !tokenSecret || !userId) {
      throw new Error("Missing required parameters");
    }

    const method = "POST";
    const url = "https://api.twitter.com/oauth/access_token";
    const timestamp = generateTimestamp();
    const nonce = generateNonce();

    // Create the OAuth parameters
    const parameters: Record<string, string> = {
      oauth_consumer_key: TWITTER_CONSUMER_KEY,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_token: token,
      oauth_verifier: verifier,
      oauth_version: "1.0",
    };

    // Generate the signature
    const signature = createSignature(
      method,
      url,
      parameters,
      TWITTER_CONSUMER_SECRET,
      tokenSecret
    );

    // Add the signature to the parameters
    parameters.oauth_signature = signature;

    // Create the Authorization header
    const authHeader = "OAuth " + Object.keys(parameters)
      .map(key => `${percentEncode(key)}="${percentEncode(parameters[key])}"`)
      .join(", ");

    console.log("Authorization header for access token:", authHeader);

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
    console.log("Twitter access token response:", data);
    
    const parsedData: Record<string, string> = {};
    
    data.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      parsedData[key] = value;
    });

    // Get user data from Twitter
    const userDataResponse = await fetchTwitterUserData(
      parsedData.oauth_token,
      parsedData.oauth_token_secret,
      parsedData.user_id
    );

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Storing X account data for user:", userId);

    // Save the X account data to Supabase
    const { data: xAccountData, error: xAccountError } = await supabase
      .from("x_accounts")
      .upsert({
        user_id: userId,
        x_user_id: parsedData.user_id,
        x_username: parsedData.screen_name,
        access_token: parsedData.oauth_token,
        access_token_secret: parsedData.oauth_token_secret,
        profile_image_url: userDataResponse.profile_image_url,
      })
      .select()
      .single();

    if (xAccountError) {
      console.error("Error saving X account:", xAccountError);
      throw new Error(`Error saving X account: ${xAccountError.message}`);
    }

    console.log("Successfully saved X account data:", xAccountData);

    return new Response(
      JSON.stringify({
        success: true,
        username: parsedData.screen_name,
        userId: parsedData.user_id,
        profileImageUrl: userDataResponse.profile_image_url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in twitter-access-token function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function fetchTwitterUserData(accessToken: string, accessTokenSecret: string, userId: string) {
  const method = "GET";
  const url = `https://api.twitter.com/1.1/users/show.json?user_id=${userId}`;
  const timestamp = generateTimestamp();
  const nonce = generateNonce();

  // Create the OAuth parameters
  const parameters: Record<string, string> = {
    oauth_consumer_key: TWITTER_CONSUMER_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
    user_id: userId,
  };

  // Generate the signature
  const signature = createSignature(
    method,
    url.split("?")[0],
    parameters,
    TWITTER_CONSUMER_SECRET,
    accessTokenSecret
  );

  // Add the signature to the parameters
  parameters.oauth_signature = signature;

  // Create the Authorization header
  const authHeader = "OAuth " + Object.keys(parameters)
    .filter(key => key.startsWith("oauth_") || key === "user_id")
    .map(key => `${percentEncode(key)}="${percentEncode(parameters[key])}"`)
    .join(", ");

  console.log("Authorization header for user data:", authHeader);

  // Send the request to Twitter
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Twitter API error for user data (${response.status}):`, error);
    throw new Error(`Twitter API error while fetching user data: ${error}`);
  }

  const userData = await response.json();
  console.log("Twitter user data:", userData);
  return userData;
}
