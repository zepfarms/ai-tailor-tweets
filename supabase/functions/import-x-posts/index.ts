
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
    
    if (!TWITTER_BEARER_TOKEN) {
      const errorMsg = "Twitter Bearer Token is not configured";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Looking up X account for user:", userId);
    
    // Get the user's X account
    const { data: xAccount, error: xAccountError } = await supabase
      .from('x_accounts')
      .select('x_username, x_user_id, access_token')
      .eq('user_id', userId)
      .single();
    
    if (xAccountError) {
      console.error("Error retrieving X account:", xAccountError);
      
      // Try the user_tokens table as a fallback
      console.log("Trying fallback to user_tokens table");
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'twitter')
        .single();
        
      if (tokenError || !tokenData) {
        console.error("Error retrieving from user_tokens:", tokenError);
        throw new Error("X account not found. Please connect your X account first.");
      }
      
      // We need to get the X user ID separately since it's not in the tokens table
      console.log("Got token from user_tokens, fetching user info from X API");
      try {
        const userResponse = await fetch(
          "https://api.twitter.com/2/users/me",
          {
            headers: {
              "Authorization": `Bearer ${tokenData.access_token}`
            }
          }
        );
        
        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error("X API user lookup error:", errorText);
          throw new Error(`Failed to fetch X user info: ${userResponse.status} - ${errorText}`);
        }
        
        const userData = await userResponse.json();
        console.log("Got X user data:", userData);
        
        // Use token data with the fetched X user ID
        xAccount = {
          x_username: userData.data.username,
          x_user_id: userData.data.id,
          access_token: tokenData.access_token
        };
      } catch (apiError) {
        console.error("Error fetching X user info:", apiError);
        throw new Error(`Unable to get X user info: ${apiError.message}`);
      }
    }
    
    if (!xAccount) {
      const errorMsg = "X account not found. Please connect your X account first.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log("Found X account:", xAccount.x_username);
    
    // Use the user's access token or the bearer token
    const authToken = xAccount.access_token || TWITTER_BEARER_TOKEN;
    
    // Fetch user's tweets
    console.log("Fetching tweets for user ID:", xAccount.x_user_id);
    const tweetsUrl = `https://api.twitter.com/2/users/${xAccount.x_user_id}/tweets?max_results=100&tweet.fields=public_metrics,created_at&expansions=attachments.media_keys&media.fields=type,url`;
    console.log("Fetch URL:", tweetsUrl);
    
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
      console.error("Twitter API error:", errorText);
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
        id: BigInt(tweet.id),
        user_id: userId,
        x_user_id: xAccount.x_user_id,
        content: tweet.text,
        likes_count: likes,
        retweets_count: retweets,
        replies_count: replies,
        impressions_count: impressions,
        engagement_rate: impressions > 0 ? ((likes + retweets + replies) / impressions) * 100 : 0,
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
        console.log(`Inserting tweet ID: ${tweet.id}`);
        
        const { error } = await supabase
          .from('x_posts')
          .upsert({
            id: tweet.id,  // Store as bigint - now the database expects this
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
