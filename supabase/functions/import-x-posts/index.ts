
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const TWITTER_BEARER_TOKEN = Deno.env.get("TWITTER_BEARER_TOKEN") || "";
const TWITTER_API_KEY = Deno.env.get("TWITTER_CONSUMER_KEY") || "";
const TWITTER_API_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET") || "";

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
    console.log("Import X posts function called");
    
    const { userId } = await req.json();
    
    if (!userId) {
      const errorMsg = "User ID is required";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log("Processing import request for user ID:", userId);
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Looking up X account for user:", userId);
    
    // Get the user's X account info with user ID
    let xUserId = null;
    let xUsername = null;
    let accessToken = null;
    
    // First try to get X user info from x_accounts
    const { data: xAccount, error: xAccountError } = await supabase
      .from('x_accounts')
      .select('x_username, x_user_id, access_token')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (xAccountError) {
      console.error("Error retrieving X account:", xAccountError);
    }
    
    if (xAccount) {
      console.log("Found X account in x_accounts table:", xAccount.x_username);
      xUserId = xAccount.x_user_id;
      xUsername = xAccount.x_username;
      accessToken = xAccount.access_token;
    }
    
    // If not found in x_accounts, try user_tokens
    if (!accessToken) {
      console.log("Checking user_tokens table for access tokens");
      const { data: tokensData, error: tokensError } = await supabase
        .from('user_tokens')
        .select('access_token, user_id, provider')
        .eq('user_id', userId)
        .eq('provider', 'twitter')
        .maybeSingle();
      
      if (tokensError) {
        console.error("Error retrieving tokens:", tokensError);
      }
      
      if (tokensData) {
        console.log("Found tokens in user_tokens table");
        accessToken = tokensData.access_token;
      }
    }
    
    // If we still don't have an X user ID, try to get it from the API
    if (!xUserId && accessToken) {
      console.log("No X user ID found in database, fetching from X API");
      try {
        // Create Authorization header based on token format
        let authHeader;
        if (accessToken.startsWith("Bearer ")) {
          authHeader = accessToken; // Token already has Bearer prefix
        } else {
          authHeader = `Bearer ${accessToken}`;
        }

        console.log("Fetching user info with authorization header:", authHeader.substring(0, 15) + "...");
        
        const userResponse = await fetch(
          "https://api.twitter.com/2/users/me",
          {
            headers: {
              "Authorization": authHeader
            }
          }
        );
        
        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error("X API user lookup error:", errorText);
          console.error("Status code:", userResponse.status);
          throw new Error(`Failed to fetch X user info: ${userResponse.status} - ${errorText}`);
        }
        
        const userData = await userResponse.json();
        console.log("X API user response:", JSON.stringify(userData));
        
        if (userData.data && userData.data.id) {
          xUserId = userData.data.id;
          console.log("Got X user ID from API:", xUserId);
          
          // Also get the username if available
          if (userData.data.username) {
            xUsername = userData.data.username;
            console.log("Got X username from API:", xUsername);
          }
          
          // Save this info back to the database for future use
          if (xUserId && userId) {
            const { error: updateError } = await supabase
              .from('x_accounts')
              .upsert({
                user_id: userId,
                x_user_id: xUserId,
                x_username: xUsername,
                access_token: accessToken
              });
            
            if (updateError) {
              console.error("Error saving X account info:", updateError);
            } else {
              console.log("Updated X account info in database");
            }
          }
        } else {
          console.error("Invalid response from X API:", userData);
        }
      } catch (userIdError) {
        console.error("Error getting X user ID:", userIdError);
      }
    }
    
    // If we still don't have an X user ID, we can't proceed
    if (!xUserId) {
      throw new Error("Could not determine X user ID. Please reconnect your X account.");
    }
    
    // Now that we have the X user ID, fetch the tweets
    console.log("Fetching tweets for X user ID:", xUserId);
    
    // Try accessing with OAuth 2.0 user token first, fallback to app-only bearer token
    let tokenToUse = accessToken;
    let isAppOnlyToken = false;
    
    // If no user access token, fall back to app-only bearer token
    if (!tokenToUse && TWITTER_BEARER_TOKEN) {
      tokenToUse = TWITTER_BEARER_TOKEN;
      isAppOnlyToken = true;
      console.log("Using app-only bearer token");
    }
    
    if (!tokenToUse) {
      throw new Error("No valid token found to access X API.");
    }
    
    // Ensure token has proper format for Authorization header
    let authHeader;
    if (tokenToUse.startsWith("Bearer ")) {
      authHeader = tokenToUse;
    } else {
      authHeader = `Bearer ${tokenToUse}`;
    }
    
    console.log("Using authorization header:", authHeader.substring(0, 15) + "...");
    
    // Set up pagination for fetching multiple pages of tweets
    const baseUrl = `https://api.twitter.com/2/users/${xUserId}/tweets`;
    const params = new URLSearchParams({
      "max_results": "100", 
      "tweet.fields": "public_metrics,created_at",
      "expansions": "attachments.media_keys",
      "media.fields": "type,url"
    });
    
    let allTweets = [];
    let nextToken = null;
    let paginationCount = 0;
    const MAX_PAGES = 5; // Limit to 5 pages (500 tweets) to avoid rate limits
    
    do {
      if (nextToken) {
        params.set("pagination_token", nextToken);
      }
      
      const fullUrl = `${baseUrl}?${params.toString()}`;
      console.log("Fetching URL:", fullUrl);
      
      const tweetsResponse = await fetch(
        fullUrl,
        {
          headers: {
            "Authorization": authHeader
          }
        }
      );
      
      console.log("X API response status:", tweetsResponse.status);
      
      if (!tweetsResponse.ok) {
        const errorText = await tweetsResponse.text();
        console.error("X API error:", errorText);
        throw new Error(`Failed to fetch tweets: ${tweetsResponse.status} - ${errorText}`);
      }
      
      const tweetsData = await tweetsResponse.json();
      
      if (!tweetsData.data || tweetsData.data.length === 0) {
        console.log("No tweets found in the response");
        break;
      }
      
      console.log(`Fetched ${tweetsData.data.length} tweets in page ${paginationCount + 1}`);
      allTweets = [...allTweets, ...tweetsData.data];
      
      // Check for next_token in the response metadata
      nextToken = tweetsData.meta?.next_token;
      console.log("Next token:", nextToken || "None");
      
      paginationCount++;
    } while (nextToken && paginationCount < MAX_PAGES);
    
    console.log(`Total tweets fetched across ${paginationCount} pages: ${allTweets.length}`);
    
    if (allTweets.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No tweets found", count: 0 }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Process and store tweets
    let insertedCount = 0;
    let errorCount = 0;
    const processedTweets = [];
    
    for (const tweet of allTweets) {
      try {
        const metrics = tweet.public_metrics || {};
        const likes = metrics.like_count || 0;
        const retweets = metrics.retweet_count || 0;
        const replies = metrics.reply_count || 0;
        const impressions = metrics.impression_count || 0;
        
        // Check if tweet has media
        const hasMedia = !!tweet.attachments?.media_keys?.length;
        
        // Get media URLs if available
        let mediaUrls = [];
        
        processedTweets.push({
          id: tweet.id, 
          user_id: userId,
          x_user_id: xUserId,
          content: tweet.text,
          likes_count: likes,
          retweets_count: retweets,
          replies_count: replies,
          impressions_count: impressions,
          engagement_rate: impressions > 0 ? ((likes + retweets + replies) / impressions) : 0,
          has_media: hasMedia,
          media_urls: mediaUrls,
          created_at: tweet.created_at,
          imported_at: new Date().toISOString()
        });
      } catch (processError) {
        console.error("Error processing tweet:", processError);
        errorCount++;
      }
    }
    
    console.log(`Processed ${processedTweets.length} tweets, now storing in database`);
    
    // Insert tweets in batches to avoid payload size limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < processedTweets.length; i += BATCH_SIZE) {
      const batch = processedTweets.slice(i, i + BATCH_SIZE);
      
      try {
        const { data, error } = await supabase
          .from('x_posts')
          .upsert(
            batch,
            { onConflict: 'id' }
          );
        
        if (error) {
          console.error("Error inserting tweet batch:", error);
          errorCount += batch.length;
        } else {
          console.log(`Successfully inserted batch of ${batch.length} tweets`);
          insertedCount += batch.length;
        }
      } catch (batchError) {
        console.error("Error processing batch:", batchError);
        errorCount += batch.length;
      }
    }
    
    console.log(`Import complete: ${insertedCount} inserted, ${errorCount} errors`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${insertedCount} tweets`,
        total: allTweets.length,
        inserted: insertedCount,
        errors: errorCount
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
    
  } catch (error) {
    console.error("Error importing X posts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
