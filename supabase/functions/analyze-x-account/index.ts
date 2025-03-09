
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count?: number;
  };
  attachments?: {
    media_keys?: string[];
  };
}

interface Analysis {
  user_id: string;
  x_user_id: string;
  last_analyzed: string;
  average_engagement: number;
  posting_frequency: number;
  top_tweet_id: string;
  top_tweet_text: string;
  peak_times: string; // JSON string of top hours
  recommendations: string; // JSON string of recommendation strings
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    console.log("X account analysis function called for user:", user_id);
    
    if (!user_id) {
      throw new Error("User ID is required");
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if we have a recent analysis (last 24 hours)
    const { data: recentAnalysis, error: analysisError } = await supabase
      .from('x_analyses')
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    if (recentAnalysis) {
      const lastAnalyzed = new Date(recentAnalysis.last_analyzed);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      if (lastAnalyzed > twentyFourHoursAgo) {
        console.log("Returning recent analysis from cache");
        return new Response(
          JSON.stringify({ success: true, data: recentAnalysis, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Get the user's X account details
    const { data: xAccount, error: xAccountError } = await supabase
      .from('x_accounts')
      .select('x_user_id')
      .eq('user_id', user_id)
      .single();
    
    if (xAccountError || !xAccount) {
      console.error("Error retrieving X account:", xAccountError);
      throw new Error("X account not found for this user");
    }
    
    const xUserId = xAccount.x_user_id;
    
    // Get the user's access token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', user_id)
      .eq('provider', 'twitter')
      .single();
    
    if (tokenError || !tokenData) {
      console.error("Error retrieving tokens:", tokenError);
      throw new Error("No valid access token found. Please reconnect your X account.");
    }
    
    const accessToken = tokenData.access_token;
    
    // Set up date range (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startTime = thirtyDaysAgo.toISOString();
    
    // Fetch tweets from X API
    let allTweets: Tweet[] = [];
    let nextToken = null;
    const maxResults = 100; // Maximum allowed by X API
    let paginationCount = 0;
    const maxPagination = 5; // Limit to 5 pages (500 tweets max)
    
    do {
      const baseUrl = `https://api.twitter.com/2/users/${xUserId}/tweets`;
      const params = new URLSearchParams({
        'max_results': maxResults.toString(),
        'start_time': startTime,
        'tweet.fields': 'public_metrics,created_at',
        'expansions': 'attachments.media_keys',
        'media.fields': 'type,url'
      });
      
      if (nextToken) {
        params.append('pagination_token', nextToken);
      }
      
      const url = `${baseUrl}?${params.toString()}`;
      console.log(`Fetching tweets: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`X API error (${response.status}):`, errorText);
        throw new Error(`Failed to fetch tweets: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        allTweets = [...allTweets, ...data.data];
        console.log(`Fetched ${data.data.length} tweets, total now: ${allTweets.length}`);
      } else {
        console.log("No tweets returned in this page");
      }
      
      nextToken = data.meta?.next_token;
      paginationCount++;
      
    } while (nextToken && paginationCount < maxPagination);
    
    console.log(`Analysis will be based on ${allTweets.length} tweets`);
    
    // If no tweets found, return basic response
    if (allTweets.length === 0) {
      const basicAnalysis: Analysis = {
        user_id,
        x_user_id: xUserId,
        last_analyzed: new Date().toISOString(),
        average_engagement: 0,
        posting_frequency: 0,
        top_tweet_id: "",
        top_tweet_text: "",
        peak_times: JSON.stringify([]),
        recommendations: JSON.stringify([
          "Start posting regularly to build your presence on X.",
          "Use hashtags related to your niche to increase discoverability.",
          "Engage with other users by replying to their tweets and joining conversations."
        ])
      };
      
      // Store the analysis
      await supabase.from('x_analyses').upsert(basicAnalysis);
      
      return new Response(
        JSON.stringify({ success: true, data: basicAnalysis, cached: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Analyze the data
    // 1. Calculate average engagement
    let totalEngagement = 0;
    allTweets.forEach(tweet => {
      const metrics = tweet.public_metrics;
      const engagement = metrics.like_count + metrics.retweet_count + metrics.reply_count + (metrics.quote_count || 0);
      totalEngagement += engagement;
    });
    const averageEngagement = totalEngagement / allTweets.length;
    
    // 2. Calculate posting frequency (tweets per day)
    const days = 30; // Assuming we're looking at 30 days
    const postingFrequency = allTweets.length / days;
    
    // 3. Find best-performing tweet
    let topTweet = allTweets[0];
    let topEngagement = 0;
    
    allTweets.forEach(tweet => {
      const metrics = tweet.public_metrics;
      const engagement = metrics.like_count + metrics.retweet_count;
      if (engagement > topEngagement) {
        topEngagement = engagement;
        topTweet = tweet;
      }
    });
    
    // 4. Determine peak activity times
    const hourCounts: {[hour: string]: {count: number, engagement: number}} = {};
    
    allTweets.forEach(tweet => {
      const date = new Date(tweet.created_at);
      const hour = date.getUTCHours();
      const hourKey = hour.toString();
      
      if (!hourCounts[hourKey]) {
        hourCounts[hourKey] = { count: 0, engagement: 0 };
      }
      
      hourCounts[hourKey].count += 1;
      const metrics = tweet.public_metrics;
      hourCounts[hourKey].engagement += metrics.like_count + metrics.retweet_count + metrics.reply_count;
    });
    
    // Find top 3 hours by engagement
    const sortedHours = Object.entries(hourCounts)
      .sort((a, b) => (b[1].engagement / b[1].count) - (a[1].engagement / a[1].count))
      .slice(0, 3)
      .map(entry => entry[0]);
    
    // 5. Generate recommendations
    const recommendations: string[] = [];
    
    // Posting frequency recommendation
    if (postingFrequency < 1) {
      recommendations.push(`Increase your posting frequency. Currently posting ${postingFrequency.toFixed(1)} tweets/day, aim for at least 1-2 daily.`);
    } else if (postingFrequency < 3) {
      recommendations.push(`Good posting frequency at ${postingFrequency.toFixed(1)} tweets/day. For even better results, try increasing to 3-5 daily.`);
    }
    
    // Peak time recommendation
    if (sortedHours.length > 0) {
      const formattedHours = sortedHours.map(h => {
        const hour = parseInt(h);
        return `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? 'AM' : 'PM'}`;
      }).join(", ");
      recommendations.push(`Post during your peak engagement hours: ${formattedHours} UTC for maximum reach.`);
    }
    
    // Media recommendation
    const tweetsWithMedia = allTweets.filter(t => t.attachments?.media_keys?.length > 0).length;
    const mediaPercentage = (tweetsWithMedia / allTweets.length) * 100;
    
    if (mediaPercentage < 30) {
      recommendations.push("Include images or videos more often. Tweets with media typically get higher engagement.");
    }
    
    // Engagement recommendation
    if (averageEngagement < 5) {
      recommendations.push("Try asking questions in your tweets to encourage replies and boost engagement.");
    }
    
    // Top tweet insight
    if (topTweet.id) {
      recommendations.push(`Your top performing tweet received ${topEngagement} engagements. Try creating more content similar to: "${topTweet.text.substring(0, 50)}..."`);
    }
    
    // Create the analysis object
    const analysis: Analysis = {
      user_id,
      x_user_id: xUserId,
      last_analyzed: new Date().toISOString(),
      average_engagement: averageEngagement,
      posting_frequency: postingFrequency,
      top_tweet_id: topTweet.id,
      top_tweet_text: topTweet.text,
      peak_times: JSON.stringify(sortedHours),
      recommendations: JSON.stringify(recommendations)
    };
    
    // Store the analysis in Supabase
    const { error: insertError } = await supabase
      .from('x_analyses')
      .upsert(analysis);
    
    if (insertError) {
      console.error("Error saving analysis:", insertError);
    }
    
    return new Response(
      JSON.stringify({ success: true, data: analysis, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error analyzing X account:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
