
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
      throw new Error("User ID is required");
    }
    
    if (!TWITTER_BEARER_TOKEN) {
      throw new Error("Twitter Bearer Token is not configured");
    }
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get the user's X account
    const { data: xAccount, error: xAccountError } = await supabase
      .from('x_accounts')
      .select('x_username, x_user_id, access_token')
      .eq('user_id', userId)
      .single();
    
    if (xAccountError || !xAccount) {
      console.error("Error retrieving X account:", xAccountError);
      throw new Error("X account not found. Please connect your X account first.");
    }
    
    console.log("Found X account:", xAccount.x_username);
    
    // Use the user's access token or the bearer token
    const authToken = xAccount.access_token || TWITTER_BEARER_TOKEN;
    
    // Fetch user's tweets
    console.log("Fetching tweets for user ID:", xAccount.x_user_id);
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${xAccount.x_user_id}/tweets?max_results=100&tweet.fields=public_metrics,created_at&expansions=attachments.media_keys&media.fields=type,url`,
      {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      }
    );
    
    if (!tweetsResponse.ok) {
      const errorText = await tweetsResponse.text();
      console.error("Twitter API error:", errorText);
      throw new Error(`Failed to fetch tweets: ${tweetsResponse.status} - ${errorText}`);
    }
    
    const tweetsData = await tweetsResponse.json();
    console.log(`Fetched ${tweetsData.data?.length || 0} tweets`);
    
    if (!tweetsData.data || tweetsData.data.length === 0) {
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
    
    // Insert tweets into the database with upsert to avoid duplicates
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const tweet of processedTweets) {
      try {
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
