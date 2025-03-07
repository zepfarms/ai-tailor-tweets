
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const AYRSHARE_API_KEY = Deno.env.get("AYRSHARE_API_KEY") || "";

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
    console.log("Ayrshare post function called");
    
    const { content, mediaUrls, platforms } = await req.json();
    
    if (!content && (!mediaUrls || mediaUrls.length === 0)) {
      throw new Error("Post content or media is required");
    }
    
    console.log("Content:", content);
    console.log("Media URLs:", mediaUrls);
    console.log("Platforms:", platforms);
    
    if (!AYRSHARE_API_KEY) {
      throw new Error("Ayrshare API key not configured");
    }
    
    // Call Ayrshare API to publish the post
    const response = await fetch("https://app.ayrshare.com/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AYRSHARE_API_KEY}`,
      },
      body: JSON.stringify({
        post: content,
        platforms: platforms || ["twitter"],
        media: mediaUrls || [],
      }),
    });
    
    const result = await response.json();
    console.log("Ayrshare API response:", result);
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to publish post via Ayrshare");
    }

    return new Response(
      JSON.stringify({
        success: true,
        result
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
