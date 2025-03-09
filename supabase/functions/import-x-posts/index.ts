
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    
    // Get the user's X account tokens
    const { data: tokensData, error: tokensError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', userId)
      .eq('provider', 'twitter')
      .maybeSingle();
    
    if (tokensError) {
      console.error("Error retrieving tokens:", tokensError);
      throw new Error(`Failed to retrieve user tokens: ${tokensError.message}`);
    }
    
    // Fallback to x_accounts if not found in user_tokens
    let accessToken = tokensData?.access_token;
    if (!accessToken) {
      console.log("No tokens found in user_tokens, checking x_accounts");
      const { data: xAccount, error: xAccountError } = await supabase
        .from('x_accounts')
        .select('x_username, x_user_id, access_token')
        .eq('user_id', userId)
        .maybeSingle();
    
      if (xAccountError) {
        console.error("Error retrieving X account:", xAccountError);
        throw new Error(`Failed to retrieve X account: ${xAccountError.message}`);
      }
      
      if (!xAccount) {
        throw new Error("X account not found. Please connect your X account first.");
      }
      
      accessToken = xAccount.access_token;
      console.log("Found access token in x_accounts table");
    } else {
      console.log("Found access token in user_tokens table");
    }
    
    if (!accessToken && !TWITTER_BEARER_TOKEN) {
      throw new Error("No valid token found to access X API.");
    }
    
    // Get the X user ID
    let xUserId;
    
    try {
      // First try to get X user ID from x_accounts
      const { data: xAccount } = await supabase
        .from('x_accounts')
        .select('x_user_id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (xAccount?.x_user_id) {
        xUserId = xAccount.x_user_id;
        console.log("Found X user ID in x_accounts:", xUserId);
      } else {
        // If not found, try to get it from the X API
        console.log("X user ID not found in database, fetching from X API");
        const userResponse = await fetch(
          "https://api.twitter.com/2/users/me",
          {
            headers: {
              "Authorization": `Bearer ${accessToken || TWITTER_BEARER_TOKEN}`
            }
          }
        );
        
        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error("X API user lookup error:", errorText);
          throw new Error(`Failed to fetch X user info: ${userResponse.status} - ${errorText}`);
        }
        
        const userData = await userResponse.json();
        xUserId = userData.data.id;
        console.log("Got X user ID from API:", xUserId);
      }
    } catch (userIdError) {
      console.error("Error getting X user ID:", userIdError);
      throw new Error(`Unable to determine X user ID: ${userIdError.message}`);
    }
    
    if (!xUserId) {
      throw new Error("Could not determine X user ID");
    }
    
    // Try both access token (OAuth 2.0) and bearer token (app-only)
    const authToken = accessToken || TWITTER_BEARER_TOKEN;
    
    // Fetch user's tweets with detailed logging
    console.log("Fetching tweets for user ID:", xUserId);
    console.log("Using token type:", accessToken ? "User access token" : "App bearer token");
    
    const tweetsUrl = `https://api.twitter.com/2/users/${xUserId}/tweets?max_results=100&tweet.fields=public_metrics,created_at&expansions=attachments.media_keys&media.fields=type,url`;
    console.log("Fetch URL:", tweetsUrl);
    
    // Log authorization header (with redaction)
    console.log("Auth header:", `Bearer ${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 5)}`);
    
    const tweetsResponse = await fetch(
      tweetsUrl,
      {
        headers: {
          "Authorization": `Bearer ${authToken}`
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
    console.log(`Fetched ${tweetsData.data?.length || 0} tweets`);
    
    if (!tweetsData.data || tweetsData.data.length === 0) {
      console.log("No tweets found in the response");
      return new Response(
        JSON.stringify({ success: true, message: "No tweets found", count: 0 }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Process and store tweets
    const processedTweets = tweetsData.data.map(tweet => {
      const metrics = tweet.public_metrics || {};
      const likes = metrics.like_count || 0;
      const retweets = metrics.retweet_count || 0;
      const replies = metrics.reply_count || 0;
      const impressions = metrics.impression_count || 0;
      
      // Check if tweet has media
      const hasMedia = !!tweet.attachments?.media_keys?.length;
      
      // Get media URLs if available
      let mediaUrls = [];
      if (hasMedia && tweetsData.includes?.media) {
        mediaUrls = tweet.attachments.media_keys
          .map(key => {
            const media = tweetsData.includes.media.find(m => m.media_key === key);
            return media?.url || null;
          })
          .filter(url => url !== null);
      }
      
      return {
        id: tweet.id, // Store as string, we'll convert to bigint later
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
        created_at: tweet.created_at
      };
    });
    
    console.log(`Processed ${processedTweets.length} tweets, now storing in database`);
    
    // Insert tweets into the database with upsert to avoid duplicates
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const tweet of processedTweets) {
      try {
        // Convert tweet.id to BigInt by removing all non-numeric characters and parsing
        const numericId = tweet.id.replace(/\D/g, '');
        const bigIntId = BigInt(numericId);
        
        console.log(`Inserting tweet ID: ${tweet.id} as BigInt: ${bigIntId}`);
        
        const { error } = await supabase
          .from('x_posts')
          .upsert({
            id: bigIntId,  // Store as bigint
            user_id: tweet.user_id,
            x_user_id: tweet.x_user_id,
            content: tweet.content,
            likes_count: tweet.likes_count,
            retweets_count: tweet.retweets_count,
            replies_count: tweet.replies_count,
            impressions_count: tweet.impressions_count,
            engagement_rate: tweet.engagement_rate,
            has_media: tweet.has_media,
            media_urls: tweet.media_urls,
            created_at: tweet.created_at,
            imported_at: new Date().toISOString()
          });
        
        if (error) {
          console.error("Error inserting tweet:", error);
          errorCount++;
        } else {
          insertedCount++;
        }
      } catch (insertError) {
        console.error("Error processing tweet:", insertError);
        errorCount++;
      }
    }
    
    console.log(`Import complete: ${insertedCount} inserted, ${errorCount} errors`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${insertedCount} tweets`,
        total: processedTweets.length,
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
