
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    console.log("Twitter post function called");
    
    const { userId, content } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    if (!content) {
      throw new Error("Post content is required");
    }
    
    console.log("User ID:", userId);
    console.log("Content:", content);
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get the user's Twitter account
    const { data: accountData, error: accountError } = await supabase
      .from('x_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (accountError || !accountData) {
      console.error("Error retrieving X account:", accountError);
      throw new Error("X account not found. Please link your account first.");
    }
    
    console.log("X account found:", accountData.x_username);
    
    // Post to Twitter
    const tweetResponse = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accountData.access_token}`,
      },
      body: JSON.stringify({
        text: content
      }),
    });
    
    const tweetData = await tweetResponse.json();
    
    if (!tweetResponse.ok) {
      console.error("Tweet response error:", tweetData);
      throw new Error(tweetData.detail || "Failed to post tweet");
    }
    
    console.log("Tweet posted successfully:", tweetData);
    
    // Store the tweet in our database
    const { error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: content,
        published: true,
        created_at: new Date().toISOString(),
        tweet_id: tweetData.data?.id
      });
    
    if (postError) {
      console.error("Error storing post:", postError);
      // Don't fail the request if storing the post fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        tweet: tweetData.data
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
