
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID") || "";
const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET") || "";
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
    console.log("Twitter analytics function called");
    
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    console.log("User ID:", userId);
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get the user's Twitter credentials from the database
    const { data: xAccount, error: xAccountError } = await supabase
      .from('x_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (xAccountError || !xAccount) {
      console.error("Error retrieving X account:", xAccountError);
      throw new Error("X account not found");
    }
    
    console.log("X account found for user:", xAccount.x_username);
    
    // For demo purposes, we'll return mock data
    // In a real implementation, you would use the Twitter API to fetch real metrics
    const mockAnalytics = {
      followerCount: Math.floor(Math.random() * 2000) + 500,
      followingCount: Math.floor(Math.random() * 500) + 100,
      tweetsCount: Math.floor(Math.random() * 300) + 50,
      impressions: Math.floor(Math.random() * 50000) + 10000,
      profileVisits: Math.floor(Math.random() * 1000) + 200,
      mentionsCount: Math.floor(Math.random() * 100) + 10,
      tweetEngagementRate: (Math.random() * 5 + 1).toFixed(2) + "%",
      topTweet: {
        text: "Just shared my thoughts on the latest tech developments! #tech #innovation",
        likes: Math.floor(Math.random() * 500) + 50,
        retweets: Math.floor(Math.random() * 100) + 10,
        replies: Math.floor(Math.random() * 50) + 5,
        impressions: Math.floor(Math.random() * 10000) + 1000
      },
      engagementTrend: [
        { date: "Jan", value: Math.floor(Math.random() * 100) },
        { date: "Feb", value: Math.floor(Math.random() * 100) },
        { date: "Mar", value: Math.floor(Math.random() * 100) },
        { date: "Apr", value: Math.floor(Math.random() * 100) },
        { date: "May", value: Math.floor(Math.random() * 100) },
        { date: "Jun", value: Math.floor(Math.random() * 100) },
      ],
      followersTrend: [
        { date: "Jan", value: Math.floor(Math.random() * 100) + 400 },
        { date: "Feb", value: Math.floor(Math.random() * 100) + 450 },
        { date: "Mar", value: Math.floor(Math.random() * 100) + 500 },
        { date: "Apr", value: Math.floor(Math.random() * 100) + 550 },
        { date: "May", value: Math.floor(Math.random() * 100) + 600 },
        { date: "Jun", value: Math.floor(Math.random() * 100) + 650 },
      ]
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: mockAnalytics,
        username: xAccount.x_username
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
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
