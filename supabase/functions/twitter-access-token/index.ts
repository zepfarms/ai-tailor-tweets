
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET") || "";
const TWITTER_CALLBACK_URL = Deno.env.get("TWITTER_CALLBACK_URL") || "https://www.postedpal.com/x-callback";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const TWITTER_BEARER_TOKEN = Deno.env.get("TWITTER_BEARER_TOKEN") || "";

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
    console.log("Twitter/X access token function called");
    
    // Check if environment variables are set
    if (!TWITTER_CLIENT_ID) {
      throw new Error("TWITTER_CLIENT_ID environment variable is not set");
    }
    
    if (!TWITTER_CLIENT_SECRET) {
      throw new Error("TWITTER_CLIENT_SECRET environment variable is not set");
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not properly configured");
    }
    
    // Log available tokens and credentials (safely)
    console.log("Bearer Token available:", !!TWITTER_BEARER_TOKEN);
    console.log("Client ID available:", !!TWITTER_CLIENT_ID);
    console.log("Client Secret available:", !!TWITTER_CLIENT_SECRET);
    console.log("Using callback URL:", TWITTER_CALLBACK_URL);
    
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request:", parseError);
      throw new Error("Invalid request format - could not parse JSON");
    }
    
    const { code, state } = requestData;
    
    console.log("Request data:", { codeProvided: !!code, state });
    
    if (!code) {
      throw new Error("Authorization code is required");
    }
    
    if (!state) {
      throw new Error("State parameter is required");
    }
    
    // Create Supabase client
    let supabase;
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      console.log("Supabase client created");
    } catch (supabaseError) {
      console.error("Error creating Supabase client:", supabaseError);
      throw new Error("Failed to connect to Supabase");
    }
    
    // Retrieve the stored OAuth state
    const { data: oauthData, error: oauthError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'twitter')
      .single();
    
    if (oauthError || !oauthData) {
      console.error("Error retrieving OAuth state:", oauthError);
      throw new Error("Invalid state parameter");
    }
    
    const userId = oauthData.user_id;
    const codeVerifier = oauthData.code_verifier;
    const isLogin = oauthData.is_login === true;
    
    console.log("Retrieved user ID:", userId || "Not provided (login flow)");
    console.log("Code verifier found:", !!codeVerifier);
    console.log("Is login flow:", isLogin);
    
    // Exchange the authorization code for an access token
    console.log("Attempting to exchange code for token");
    
    // Build the form data for the token request
    const tokenRequestBody = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: TWITTER_CALLBACK_URL,
      code_verifier: codeVerifier,
    });

    console.log("Token request parameters:", tokenRequestBody.toString());
    
    // Create the authorization string using btoa instead of Buffer
    const credentials = `${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`;
    const encodedCredentials = btoa(credentials);
    
    console.log("Authorization credentials prepared");
    console.log("Encoded credentials length:", encodedCredentials.length);
    
    let tokenResponse;
    let tokenData;
    try {
      console.log("Sending token request to https://api.twitter.com/2/oauth2/token");
      
      tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${encodedCredentials}`,
        },
        body: tokenRequestBody,
      });
      
      console.log("Token response status:", tokenResponse.status);
      
      const responseText = await tokenResponse.text();
      console.log("Token response body:", responseText);
      
      if (!tokenResponse.ok) {
        console.error("Token response error text:", responseText);
        
        // Try alternative method with client_id and client_secret in body
        console.log("Trying alternative method with credentials in body");
        
        const alternativeRequestBody = new URLSearchParams({
          code,
          grant_type: "authorization_code",
          redirect_uri: TWITTER_CALLBACK_URL,
          code_verifier: codeVerifier,
          client_id: TWITTER_CLIENT_ID,
          client_secret: TWITTER_CLIENT_SECRET,
        });
        
        tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: alternativeRequestBody,
        });
        
        console.log("Alternative token response status:", tokenResponse.status);
        
        const altResponseText = await tokenResponse.text();
        console.log("Alternative token response body:", altResponseText);
        
        if (!tokenResponse.ok) {
          throw new Error(`Failed to exchange code for token: HTTP ${tokenResponse.status} - ${altResponseText}`);
        }
        
        try {
          tokenData = JSON.parse(altResponseText);
        } catch (parseError) {
          console.error("Error parsing alternative token response:", parseError);
          throw new Error("Invalid response from Twitter token endpoint (alternative method)");
        }
      } else {
        try {
          tokenData = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Error parsing token response:", parseError);
          throw new Error("Invalid response from Twitter token endpoint");
        }
      }
      
      console.log("Token response received:", !!tokenData);
      console.log("Access token obtained:", !!tokenData.access_token);
      console.log("Refresh token:", !!tokenData.refresh_token);
    } catch (fetchError) {
      console.error("Fetch error when exchanging token:", fetchError);
      throw new Error(`Network error when exchanging token: ${fetchError.message}`);
    }
    
    // Get Twitter user info
    console.log("Fetching user info");
    let userResponse;
    try {
      // First try with the obtained access token
      userResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`
        }
      });
      
      console.log("User info response status with access token:", userResponse.status);
      
      // If that fails and we have a bearer token, try with the bearer token
      if (!userResponse.ok && TWITTER_BEARER_TOKEN) {
        console.log("Retrying with Bearer token");
        userResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
          headers: {
            "Authorization": `Bearer ${TWITTER_BEARER_TOKEN}`
          }
        });
        console.log("User info response status with bearer token:", userResponse.status);
      }
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("User info response error:", errorText);
        throw new Error(`Failed to fetch user info: HTTP ${userResponse.status} - ${errorText}`);
      }
    } catch (fetchError) {
      console.error("Fetch error when getting user info:", fetchError);
      throw new Error(`Network error when fetching user info: ${fetchError.message}`);
    }

    let userData;
    try {
      userData = await userResponse.json();
      console.log("User data received:", !!userData);
      if (userData.data) {
        console.log("User data username:", userData.data.username);
      }
    } catch (parseError) {
      console.error("Error parsing user response:", parseError);
      throw new Error("Invalid response from Twitter user endpoint");
    }

    // Clean up the OAuth state
    console.log("Cleaning up OAuth state");
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state);

    // Process the user data based on whether this is a login or account linking
    if (userData.data) {
      if (isLogin) {
        // This is a login request, check if we have an account with this X user ID
        console.log("Handling X login flow for user:", userData.data.username);
        
        const { data: existingAccount, error: lookupError } = await supabase
          .from("x_accounts")
          .select("user_id, x_username")
          .eq("x_user_id", userData.data.id)
          .single();
          
        if (lookupError && lookupError.code !== "PGRST116") { // PGRST116 is "no rows returned" error
          console.error("Error looking up X account:", lookupError);
          throw new Error("Failed to check for existing X account");
        }
        
        if (existingAccount) {
          // User already has an account, log them in
          console.log("Existing account found for X user:", existingAccount.x_username);
          console.log("Associated user ID:", existingAccount.user_id);
          
          // Update the token for the existing account
          const { error: updateError } = await supabase.from("x_accounts").update({
            access_token: tokenData.access_token,
            access_token_secret: tokenData.refresh_token || "",
            profile_image_url: userData.data.profile_image_url,
            bearer_token: TWITTER_BEARER_TOKEN || null,
          }).eq("x_user_id", userData.data.id);
          
          if (updateError) {
            console.error("Error updating X account tokens:", updateError);
            // Continue anyway as this isn't critical for login
          }
          
          // Create a custom auth token for this user
          const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: `x_${userData.data.id}@placeholder.com`,
            options: {
              // Create or update user data
              data: {
                x_user_id: userData.data.id,
                x_username: userData.data.username,
                name: userData.data.username
              }
            }
          });
          
          if (authError) {
            console.error("Error generating auth token:", authError);
            throw new Error("Failed to authenticate with X account");
          }
            
          return new Response(
            JSON.stringify({
              success: true,
              action: "login",
              username: userData.data.username,
              user_id: existingAccount.user_id,
              token: authData.properties.action_link
            }),
            {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        } else {
          // No existing account, create a new user
          console.log("No existing account found, creating new user for:", userData.data.username);
          
          // Create a new auth user
          const { data: newUserData, error: userCreateError } = await supabase.auth.admin.createUser({
            email: `x_${userData.data.id}@placeholder.com`,
            email_confirm: true,
            user_metadata: {
              x_user_id: userData.data.id,
              x_username: userData.data.username,
              name: userData.data.username
            }
          });
          
          if (userCreateError) {
            console.error("Error creating new user:", userCreateError);
            throw new Error("Failed to create new user account");
          }
          
          const newUserId = newUserData.user.id;
          
          // Store the Twitter account information
          console.log("Storing X account information for new user:", newUserId);
          const { error: upsertError } = await supabase.from("x_accounts").upsert({
            user_id: newUserId,
            x_user_id: userData.data.id,
            x_username: userData.data.username,
            profile_image_url: userData.data.profile_image_url,
            access_token: tokenData.access_token,
            access_token_secret: tokenData.refresh_token || "",
            bearer_token: TWITTER_BEARER_TOKEN || null,
          });

          if (upsertError) {
            console.error("Error storing Twitter account:", upsertError);
            // Not critical for continuing, but should be logged
          }
          
          // Generate login token for the new user
          const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: `x_${userData.data.id}@placeholder.com`,
            options: {
              // Create or update user data
              data: {
                x_user_id: userData.data.id,
                x_username: userData.data.username,
                name: userData.data.username
              }
            }
          });
          
          if (authError) {
            console.error("Error generating auth token:", authError);
            throw new Error("Failed to authenticate with X account");
          }

          return new Response(
            JSON.stringify({
              success: true,
              action: "signup",
              username: userData.data.username,
              user_id: newUserId,
              token: authData.properties.action_link
            }),
            {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }
      } else {
        // This is just an account linking request
        console.log("Linking X account for existing user:", userId);
        
        // Store the Twitter account information in the database
        console.log("Storing X account information");
        const { error: upsertError } = await supabase.from("x_accounts").upsert({
          user_id: userId,
          x_user_id: userData.data.id,
          x_username: userData.data.username,
          profile_image_url: userData.data.profile_image_url,
          access_token: tokenData.access_token,
          access_token_secret: tokenData.refresh_token || "",
          bearer_token: TWITTER_BEARER_TOKEN || null,
        });

        if (upsertError) {
          console.error("Error storing Twitter account:", upsertError);
          throw new Error("Failed to store Twitter account");
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: "link",
            username: userData.data.username,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    } else {
      throw new Error("Failed to fetch Twitter user data");
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "There was an error processing the X authentication callback. Please try again or contact support."
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
