
import { supabase } from '@/integrations/supabase/client';

export interface AyrsharePostData {
  content: string;
  mediaUrls?: string[];
  platforms?: string[];
}

export const postToSocialMedia = async (postData: AyrsharePostData): Promise<any> => {
  try {
    const response = await supabase.functions.invoke('ayrshare-post', {
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
    const response = await supabase.functions.invoke('ayrshare-post', {
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
    // For now, we're creating temporary URLs that can be publicly accessed
    // In a real-world scenario, you would upload these to a CDN or storage service
    const urls = mediaFiles.map(file => URL.createObjectURL(file));
    
    // This is a placeholder for actual file uploading logic
    // TODO: Replace with actual file upload implementation
    console.log("Media files would be uploaded here:", mediaFiles);
    
    return urls;
  } catch (error) {
    console.error("Error processing media files:", error);
    throw error;
  }
};
