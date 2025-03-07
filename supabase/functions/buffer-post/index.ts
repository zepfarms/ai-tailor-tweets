
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BUFFER_ACCESS_TOKEN = Deno.env.get("BUFFER_ACCESS_TOKEN") || "";

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
    console.log("Buffer post function called");
    
    // Check the request type - post or profile linking
    const requestBody = await req.json();
    const { action } = requestBody;
    
    // Get API key
    if (!BUFFER_ACCESS_TOKEN) {
      throw new Error("Buffer access token not configured");
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

// Handle posting content to social media via Buffer
async function handlePosting(data) {
  const { content, mediaUrls, platforms } = data;
  
  if (!content && (!mediaUrls || mediaUrls.length === 0)) {
    throw new Error("Post content or media is required");
  }
  
  console.log("Content:", content);
  console.log("Media URLs:", mediaUrls);
  console.log("Platforms:", platforms);
  
  // Call Buffer API to create a post
  // https://buffer.com/developers/api/updates#updatescreate
  const response = await fetch("https://api.bufferapp.com/1/updates/create.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      access_token: BUFFER_ACCESS_TOKEN,
      text: content,
      profile_ids: JSON.stringify(["default"]), // This would need to be dynamically set based on the user's linked profiles
      media: mediaUrls && mediaUrls.length > 0 ? JSON.stringify({
        link: mediaUrls[0], // Buffer handles one media item at a time
        description: content
      }) : "",
      now: "true" // Post immediately
    })
  });
  
  const result = await response.json();
  console.log("Buffer API response:", result);
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to publish post via Buffer");
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

// Handle profile linking with Buffer
async function handleProfileLinking(data) {
  const { profileType, userId } = data;
  
  if (!profileType || !userId) {
    throw new Error("Profile type and user ID are required");
  }
  
  console.log("Profile linking requested:");
  console.log("Profile type:", profileType);
  console.log("User ID:", userId);
  
  // For Buffer, we need to redirect users to the Buffer authorization URL
  // This is typically done via OAuth flow
  const authUrl = "https://bufferapp.com/oauth2/authorize";
  const clientId = Deno.env.get("BUFFER_CLIENT_ID") || "";
  
  if (!clientId) {
    throw new Error("Buffer client ID not configured");
  }
  
  const redirectUri = Deno.env.get("BUFFER_REDIRECT_URI") || "";
  
  if (!redirectUri) {
    throw new Error("Buffer redirect URI not configured");
  }
  
  const fullAuthUrl = `${authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

  // Return the auth URL for the frontend to handle the redirect
  return new Response(
    JSON.stringify({
      success: true,
      authUrl: fullAuthUrl,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}
