
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// This function will return appropriate information for web intents

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
    console.log("Social post function called");
    
    // Check the request type - post or profile linking
    const requestBody = await req.json();
    const { action } = requestBody;
    
    // Handle different action types
    if (action === "link_profile") {
      return await handleProfileLinking(requestBody);
    } else {
      // Default is posting content
      return await handlePosting(requestBody);
    }
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

// Handle posting content to social media
async function handlePosting(data) {
  const { content, mediaUrls, platforms } = data;
  
  if (!content && (!mediaUrls || mediaUrls.length === 0)) {
    throw new Error("Post content or media is required");
  }
  
  console.log("Content:", content);
  console.log("Media URLs:", mediaUrls);
  console.log("Platforms:", platforms);
  
  // For web intent only approach
  const twitterWebIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
  
  // If there are media URLs, we need to note that images will need to be manually uploaded
  const hasMedia = mediaUrls && mediaUrls.length > 0;

  return new Response(
    JSON.stringify({
      success: true,
      webIntent: twitterWebIntent,
      hasMedia: hasMedia,
      message: "Use web intent for posting. Note that you'll need to manually attach images in the Twitter window."
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

// Handle profile linking - kept simple for now
async function handleProfileLinking(data) {
  const { profileType } = data;
  
  if (!profileType) {
    throw new Error("Profile type is required");
  }
  
  console.log("Profile linking requested for:", profileType);
  
  // Just provide the web intent URL for now
  return new Response(
    JSON.stringify({
      success: true,
      message: "For X/Twitter posting, we use the web intent approach which doesn't require account linking.",
      webIntent: "https://twitter.com/intent/tweet"
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}
