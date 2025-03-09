
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Custom implementation of createHmac using Deno's native crypto API
function createHmac(algorithm: string, key: string) {
  // Convert the key to Uint8Array
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  
  // Return an object that mimics the Node.js createHmac interface
  return {
    update(data: string): { digest: (encoding: string) => string } {
      const dataArr = encoder.encode(data);
      
      // Create a method to perform the digest operation with the specified encoding
      return {
        digest(encoding: string): string {
          // If algorithm is sha1, use the Deno.subtle.digest with SHA-1
          if (algorithm.toLowerCase() === "sha1") {
            // Create a SubtleCrypto HmacKey
            const cryptoKey = crypto.subtle.importKey(
              "raw",
              keyData,
              { name: "HMAC", hash: "SHA-1" },
              false,
              ["sign"]
            );
            
            // Sign the data
            const signature = cryptoKey.then(key => 
              crypto.subtle.sign({ name: "HMAC", hash: "SHA-1" }, key, dataArr)
            );
            
            // Convert to the requested encoding
            if (encoding === "base64") {
              return signature.then(sig => btoa(String.fromCharCode(...new Uint8Array(sig))));
            } else {
              throw new Error(`Unsupported encoding: ${encoding}`);
            }
          } else {
            throw new Error(`Unsupported algorithm: ${algorithm}`);
          }
        }
      };
    }
  };
}

// Custom implementation of randomBytes for nonce generation
function randomBytes(size: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(size));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("X post function called");
    
    const { userId, content, media } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    if (!content && (!media || media.length === 0)) {
      throw new Error("Post content or media is required");
    }
    
    console.log("User ID:", userId);
    console.log("Content:", content);
    if (media) {
      console.log("Media included:", media.length, "items");
    }
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get the user's X account token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'twitter')
      .single();
    
    if (tokenError || !tokenData) {
      console.error("Error retrieving X token:", tokenError);
      
      // Fallback to x_accounts table for backward compatibility
      const { data: accountData, error: accountError } = await supabase
        .from('x_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (accountError || !accountData) {
        console.error("Error retrieving X account:", accountError);
        throw new Error("X account not found. Please link your account first.");
      }
      
      console.log("Found X account in legacy table:", accountData.x_username);
      tokenData = accountData;
    } else {
      console.log("Found X token in user_tokens table");
    }
    
    // Build the post payload
    const postPayload: any = {
      text: content || ""
    };
    
    // If we have media, we need to upload it first
    if (media && media.length > 0) {
      const mediaIds = await uploadMediaToTwitter(media, tokenData.access_token);
      if (mediaIds.length > 0) {
        postPayload.media = { media_ids: mediaIds };
      }
    }
    
    // Post to X
    const postResponse = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify(postPayload),
    });
    
    const postData = await postResponse.json();
    
    if (!postResponse.ok) {
      console.error("Post response error:", postData);
      throw new Error(postData.detail || "Failed to publish post");
    }
    
    console.log("Post published successfully:", postData);
    
    // Store the post in our database
    const { error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: content,
        published: true,
        created_at: new Date().toISOString(),
        tweet_id: postData.data?.id,
        has_media: media && media.length > 0
      });
    
    if (postError) {
      console.error("Error storing post:", postError);
      // Don't fail the request if storing the post fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        post: postData.data
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

// Function to upload media to Twitter and get media IDs
async function uploadMediaToTwitter(mediaItems, accessToken) {
  const mediaIds = [];
  
  for (const item of mediaItems) {
    try {
      console.log("Uploading media item:", item.type);
      
      // Decode base64 data
      const base64Data = item.data.split(',')[1];
      const binaryData = atob(base64Data);
      
      // Convert to Uint8Array
      const uint8Array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }
      
      // Step 1: Initialize upload
      const initResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json?command=INIT", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${accessToken}`
        },
        body: new URLSearchParams({
          command: "INIT",
          total_bytes: uint8Array.length.toString(),
          media_type: item.type
        })
      });
      
      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        console.error("Media INIT error:", errorData);
        throw new Error("Failed to initialize media upload");
      }
      
      const initData = await initResponse.json();
      const mediaId = initData.media_id_string;
      console.log("Media initialized, ID:", mediaId);
      
      // Step 2: APPEND (upload the data)
      // Twitter expects chunks of 5MB or less, so we'll upload all at once if it's small enough
      const chunkSize = 5 * 1024 * 1024; // 5MB in bytes
      let segmentIndex = 0;
      
      for (let byteStart = 0; byteStart < uint8Array.length; byteStart += chunkSize) {
        const chunk = uint8Array.slice(byteStart, Math.min(byteStart + chunkSize, uint8Array.length));
        
        // Create form data for the APPEND request
        const formData = new FormData();
        formData.append('command', 'APPEND');
        formData.append('media_id', mediaId);
        formData.append('segment_index', segmentIndex.toString());
        
        // Convert chunk to Blob
        const blob = new Blob([chunk], { type: item.type });
        formData.append('media', blob);
        
        const appendResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`
          },
          body: formData
        });
        
        if (!appendResponse.ok) {
          const errorText = await appendResponse.text();
          console.error(`Media APPEND error for segment ${segmentIndex}:`, errorText);
          throw new Error(`Failed to upload media chunk ${segmentIndex}`);
        }
        
        console.log(`Segment ${segmentIndex} uploaded successfully`);
        segmentIndex++;
      }
      
      // Step 3: FINALIZE
      const finalizeResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json?command=FINALIZE", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${accessToken}`
        },
        body: new URLSearchParams({
          command: "FINALIZE",
          media_id: mediaId
        })
      });
      
      if (!finalizeResponse.ok) {
        const errorData = await finalizeResponse.json();
        console.error("Media FINALIZE error:", errorData);
        throw new Error("Failed to finalize media upload");
      }
      
      console.log("Media finalized successfully:", mediaId);
      
      // For certain media types (e.g., videos), we might need to check the processing status
      // But for images it's usually ready immediately
      mediaIds.push(mediaId);
      
    } catch (error) {
      console.error("Error uploading media item:", error);
      // Continue with other media items even if one fails
    }
  }
  
  return mediaIds;
}
