
import { supabase } from '@/integrations/supabase/client';

export interface BufferPostData {
  content: string;
  mediaUrls?: string[];
  platforms?: string[];
}

export const postToSocialMedia = async (postData: BufferPostData): Promise<any> => {
  try {
    const response = await supabase.functions.invoke('buffer-post', {
      body: {
        ...postData,
        action: "post"
      }
    });
    
    if (response.error) {
      throw new Error(response.error.message || "Failed to post to social media");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error posting to social media:", error);
    throw error;
  }
};

export const linkSocialMediaProfile = async (profileType: string, userId: string): Promise<any> => {
  try {
    const response = await supabase.functions.invoke('buffer-post', {
      body: {
        action: "link_profile",
        profileType,
        userId
      }
    });
    
    if (response.error) {
      throw new Error(response.error.message || "Failed to initiate profile linking");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error linking social media profile:", error);
    throw error;
  }
};

export const uploadAndGetMediaUrls = async (mediaFiles: File[]): Promise<string[]> => {
  if (!mediaFiles.length) return [];
  
  try {
    // For testing and development, we'll use blob URLs to display images in the preview
    // In production, we would upload these files to a storage service
    const urls = mediaFiles.map(file => URL.createObjectURL(file));
    
    // Log the files that would be uploaded
    console.log("Media files would be uploaded here:", mediaFiles);
    
    return urls;
  } catch (error) {
    console.error("Error processing media files:", error);
    throw error;
  }
};
