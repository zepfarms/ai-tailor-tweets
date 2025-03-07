
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
    
    // Check the request type - post or profile linking
    const requestBody = await req.json();
    const { action } = requestBody;
    
    // Get API key
    if (!AYRSHARE_API_KEY) {
      throw new Error("Ayrshare API key not configured");
    }

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
}

// Handle profile linking
async function handleProfileLinking(data) {
  const { profileType, username, password, userId } = data;
  
  if (!profileType || !userId) {
    throw new Error("Profile type and user ID are required");
  }
  
  console.log("Profile linking requested:");
  console.log("Profile type:", profileType);
  console.log("User ID:", userId);
  
  // For X/Twitter, we'll use Ayrshare's profile linking API
  const linkBody = {
    type: profileType === "twitter" ? "twitter" : profileType,
    username: username || "",
    password: password || "",
    // This won't actually be used by Ayrshare for OAuth-based services like Twitter,
    // but we include it for completeness
  };
  
  // Call Ayrshare API to get OAuth URL for linking profile
  const response = await fetch("https://app.ayrshare.com/api/profiles/social", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AYRSHARE_API_KEY}`,
    },
    body: JSON.stringify(linkBody),
  });
  
  const result = await response.json();
  console.log("Ayrshare profile linking response:", result);
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to link profile via Ayrshare");
  }

  // Return the URL or auth info needed for the user to complete authorization
  return new Response(
    JSON.stringify({
      success: true,
      result,
      authUrl: result.authUrl || null,
      profileId: result.profileId || null,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}
