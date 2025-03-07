
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Instead of using an expensive API, we'll use free alternatives and web intents
// This function will return appropriate information for web intents or other free posting methods

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
  
  // Instead of using an API that costs $5000/month, we'll provide
  // data that can be used with web intents or other free methods
  const platformUrls = {
    twitter: {
      webIntent: `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`,
      hasMedia: mediaUrls && mediaUrls.length > 0
    },
    facebook: {
      webIntent: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(content)}`,
      hasMedia: mediaUrls && mediaUrls.length > 0
    },
    linkedin: {
      webIntent: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(content)}`,
      hasMedia: mediaUrls && mediaUrls.length > 0
    }
  };

  return new Response(
    JSON.stringify({
      success: true,
      webIntents: platformUrls,
      message: "Use web intents for free posting. Direct API posting requires paid services."
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

// Handle profile linking
async function handleProfileLinking(data) {
  const { profileType } = data;
  
  if (!profileType) {
    throw new Error("Profile type is required");
  }
  
  console.log("Profile linking requested for:", profileType);
  
  // For free alternatives, we'll direct users to the platforms' own OAuth flows
  // or web intents which don't require API keys
  const authInfo = {
    twitter: {
      message: "X/Twitter doesn't offer free API posting. Use web intents instead for free posting.",
      webIntent: true
    },
    facebook: {
      message: "Facebook requires a business account for API posting. Use web intents for free posting.",
      webIntent: true
    },
    linkedin: {
      message: "LinkedIn requires a business account for API posting. Use web intents for free posting.",
      webIntent: true
    }
  };

  return new Response(
    JSON.stringify({
      success: true,
      info: authInfo[profileType] || { message: "Platform not supported for direct posting. Use web intents." },
      suggestion: "For more advanced posting needs, consider affordable services like IFTTT ($5/month) or Zapier (free tier available)"
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}
