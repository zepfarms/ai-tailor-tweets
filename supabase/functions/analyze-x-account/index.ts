
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
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const { user_id } = requestData;
    
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
      .maybeSingle();
    
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
      .select('x_user_id, x_username')
      .eq('user_id', user_id)
      .maybeSingle();
    
    if (xAccountError) {
      console.error("Error retrieving X account:", xAccountError);
      throw new Error("Error retrieving X account details. Please try again.");
    }
    
    if (!xAccount) {
      console.error("No X account found for user:", user_id);
      throw new Error("X account not found for this user. Please reconnect your X account.");
    }
    
    const xUserId = xAccount.x_user_id;
    const xUsername = xAccount.x_username;
    console.log(`Processing analysis for X user: ${xUsername} (ID: ${xUserId})`);
    
    // Get the user's access token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', user_id)
      .eq('provider', 'twitter')
      .maybeSingle();
    
    if (tokenError) {
      console.error("Error retrieving tokens:", tokenError);
      throw new Error("Error retrieving account tokens. Please try again.");
    }
    
    if (!tokenData || !tokenData.access_token) {
      console.error("No valid token found for user:", user_id);
      throw new Error("No valid access token found. Please reconnect your X account.");
    }
    
    const accessToken = tokenData.access_token;
    console.log("Access token retrieved successfully");
    
    // Set up date range (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Format the date according to X API requirements: YYYY-MM-DDTHH:MM:SSZ (without milliseconds)
    const startTime = thirtyDaysAgo.toISOString().replace(/\.\d{3}Z$/, "Z");
    console.log("Using start_time:", startTime);
    
    // Fetch tweets from X API
    let allTweets: Tweet[] = [];
    let nextToken = null;
    const maxResults = 100; // Maximum allowed by X API
    let paginationCount = 0;
    const maxPagination = 5; // Limit to 5 pages (500 tweets max)
    
    try {
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
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'PostedPal/1.0'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`X API error (${response.status}):`, errorText);
          
          if (response.status === 401) {
            throw new Error("Authorization failed. Please reconnect your X account in the settings.");
          } else if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          } else {
            throw new Error(`Failed to fetch tweets: ${response.status} - ${errorText}`);
          }
        }
        
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Error parsing X API response:", jsonError);
          throw new Error("Invalid response from X API. Please try again later.");
        }
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          allTweets = [...allTweets, ...data.data];
          console.log(`Fetched ${data.data.length} tweets, total now: ${allTweets.length}`);
        } else {
          console.log("No tweets returned in this page or empty data object");
          console.log("Response data structure:", JSON.stringify(data));
        }
        
        nextToken = data.meta?.next_token;
        paginationCount++;
      } while (nextToken && paginationCount < maxPagination);
    } catch (fetchError) {
      console.error("Error fetching tweets:", fetchError);
      
      // If we have some tweets but hit an error during pagination, continue with analysis
      if (allTweets.length === 0) {
        throw fetchError; // Re-throw if we have no tweets to analyze
      }
      
      console.log("Continuing with partial tweet data for analysis");
    }
    
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
      const { error: insertError } = await supabase
        .from('x_analyses')
        .upsert(basicAnalysis);
      
      if (insertError) {
        console.error("Error saving basic analysis:", insertError);
        throw new Error(`Failed to save analysis: ${insertError.message}`);
      }
      
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
      if (!metrics) return;
      
      const engagement = (metrics.like_count || 0) + 
                        (metrics.retweet_count || 0) + 
                        (metrics.reply_count || 0) + 
                        (metrics.quote_count || 0);
      totalEngagement += engagement;
    });
    const averageEngagement = allTweets.length > 0 ? totalEngagement / allTweets.length : 0;
    
    // 2. Calculate posting frequency (tweets per day)
    const days = 30; // Assuming we're looking at 30 days
    const postingFrequency = allTweets.length / days;
    
    // 3. Find best-performing tweet
    let topTweet = allTweets[0] || { id: "", text: "", public_metrics: { like_count: 0, retweet_count: 0, reply_count: 0, quote_count: 0 } };
    let topEngagement = 0;
    
    allTweets.forEach(tweet => {
      const metrics = tweet.public_metrics;
      if (!metrics) return;
      
      const engagement = (metrics.like_count || 0) + (metrics.retweet_count || 0);
      if (engagement > topEngagement) {
        topEngagement = engagement;
        topTweet = tweet;
      }
    });
    
    // 4. Determine peak activity times
    const hourCounts: {[hour: string]: {count: number, engagement: number}} = {};
    
    allTweets.forEach(tweet => {
      try {
        if (!tweet.created_at) return;
        
        const date = new Date(tweet.created_at);
        const hour = date.getUTCHours();
        const hourKey = hour.toString();
        
        if (!hourCounts[hourKey]) {
          hourCounts[hourKey] = { count: 0, engagement: 0 };
        }
        
        hourCounts[hourKey].count += 1;
        const metrics = tweet.public_metrics;
        if (!metrics) return;
        
        hourCounts[hourKey].engagement += (metrics.like_count || 0) + 
                                         (metrics.retweet_count || 0) + 
                                         (metrics.reply_count || 0);
      } catch (dateError) {
        console.error("Error processing date:", tweet.created_at, dateError);
      }
    });
    
    // Find top 3 hours by engagement
    const sortedHours = Object.entries(hourCounts)
      .sort((a, b) => {
        const engagementA = a[1].count > 0 ? a[1].engagement / a[1].count : 0;
        const engagementB = b[1].count > 0 ? b[1].engagement / b[1].count : 0;
        return engagementB - engagementA;
      })
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
    const mediaPercentage = allTweets.length > 0 ? (tweetsWithMedia / allTweets.length) * 100 : 0;
    
    if (mediaPercentage < 30) {
      recommendations.push("Include images or videos more often. Tweets with media typically get higher engagement.");
    }
    
    // Engagement recommendation
    if (averageEngagement < 5) {
      recommendations.push("Try asking questions in your tweets to encourage replies and boost engagement.");
    }
    
    // Top tweet insight
    if (topTweet.id && topTweet.text) {
      recommendations.push(`Your top performing tweet received ${topEngagement} engagements. Try creating more content similar to: "${topTweet.text.substring(0, 50)}..."`);
    }
    
    // Stringify arrays safely
    let peakTimesJson = "[]";
    let recommendationsJson = "[]";
    
    try {
      peakTimesJson = JSON.stringify(sortedHours);
      recommendationsJson = JSON.stringify(recommendations);
    } catch (jsonError) {
      console.error("Error stringifying JSON data:", jsonError);
    }
    
    console.log("Peak times JSON:", peakTimesJson);
    console.log("Recommendations JSON:", recommendationsJson);
    
    // Create the analysis object
    const analysis: Analysis = {
      user_id,
      x_user_id: xUserId,
      last_analyzed: new Date().toISOString(),
      average_engagement: averageEngagement,
      posting_frequency: postingFrequency,
      top_tweet_id: topTweet.id || "",
      top_tweet_text: topTweet.text || "",
      peak_times: peakTimesJson,
      recommendations: recommendationsJson
    };
    
    console.log("Final analysis object being stored:", JSON.stringify(analysis));
    
    // Store the analysis in Supabase
    const { error: insertError } = await supabase
      .from('x_analyses')
      .upsert(analysis);
    
    if (insertError) {
      console.error("Error saving analysis:", insertError);
      throw new Error(`Failed to save analysis: ${insertError.message}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, data: analysis, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error analyzing X account:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
