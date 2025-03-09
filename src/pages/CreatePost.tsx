
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import TopicSelection from '@/components/TopicSelection';
import PostGenerator from '@/components/PostGenerator';
import PostScheduler from '@/components/PostScheduler';
import { Topic } from '@/lib/types';
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Video } from 'lucide-react';
import TopPerformingPosts from '@/components/TopPerformingPosts';
import { supabase } from '@/integrations/supabase/client';
import XConnectButton from '@/components/XConnectButton';

type Stage = "topics" | "create" | "schedule";

const CreatePost: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stage, setStage] = useState<Stage>("topics");
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [currentContent, setCurrentContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
      return;
    }
    
    const status = searchParams.get('status');
    if (status === 'posted') {
      toast({
        title: "Posted to X",
        description: "Your post has been shared to X successfully",
      });
    }
  }, [user, isLoading, navigate, searchParams]);

  const handleTopicSelection = (topics: Topic[]) => {
    setSelectedTopics(topics);
    setStage("create");
  };

  const handleSchedulePost = (content: string) => {
    setCurrentContent(content);
    setStage("schedule");
  };

  const handlePostNow = async (content: string, mediaPreviews?: string[]) => {
    setIsPosting(true);
    
    try {
      if (!user?.xLinked) {
        throw new Error("Please connect your X account first to post");
      }

      // Convert media previews to base64 if provided
      const mediaData = [];
      
      if (mediaPreviews && mediaPreviews.length > 0) {
        for (const previewUrl of mediaPreviews) {
          try {
            // Fetch the image/video file
            const response = await fetch(previewUrl);
            const blob = await response.blob();
            
            // Convert to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            
            const base64Data = await base64Promise;
            
            mediaData.push({
              data: base64Data,
              type: blob.type,
              size: blob.size
            });
          } catch (error) {
            console.error("Error processing media file:", error);
          }
        }
      }
      
      console.log("Calling twitter-post function with userId:", user?.id);
      
      const response = await supabase.functions.invoke('twitter-post', {
        body: { 
          content, 
          userId: user?.id,
          media: mediaData.length > 0 ? mediaData : undefined
        },
      });
      
      if (response.error) {
        console.error("Error from twitter-post function:", response.error);
        throw new Error(response.error.message || "Could not post to X");
      }
      
      toast({
        title: "Posted to X",
        description: "Your post has been published successfully!",
      });
      
      navigate('/dashboard?status=posted');
    } catch (error) {
      console.error("Error posting to X:", error);
      
      if (error instanceof Error && error.message.includes("reconnect")) {
        toast({
          title: "Authentication Error",
          description: "Your X connection has expired. Please reconnect your account.",
          variant: "destructive", 
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not post to X. Please try again.",
          variant: "destructive", 
        });
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleTopPostSelect = (content: string) => {
    setCurrentContent(content);
    setStage("create");
  };

  const handleScheduleComplete = () => {
    navigate('/dashboard');
  };

  const goBack = () => {
    if (stage === "create") {
      setStage("topics");
    } else if (stage === "schedule") {
      setStage("create");
    }
  };

  const goToVideoStudio = () => {
    navigate('/video-studio');
  };

  const getCharacterLimit = () => {
    if (user?.isXPremium) {
      return 4000;
    }
    return 280;
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-slow">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12 mt-16">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={goBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="max-w-3xl mx-auto">
          {!user.xLinked && (
            <div className="mb-8 p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="text-lg font-medium mb-2">X Account Not Connected</h3>
              <p className="mb-4">You need to connect your X account before you can post.</p>
              <XConnectButton />
            </div>
          )}
          
          {stage === "topics" && (
            <>
              <TopPerformingPosts onSelectPost={handleTopPostSelect} />
              <div className="mt-8">
                <TopicSelection onSelectTopics={handleTopicSelection} />
              </div>
              <div className="mt-8 text-center">
                <p className="text-muted-foreground mb-4">Want to create rich media content instead?</p>
                <Button 
                  variant="outline"
                  onClick={goToVideoStudio}
                  className="flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  Go to Video Studio
                </Button>
              </div>
            </>
          )}
          
          {stage === "create" && (
            <PostGenerator 
              selectedTopics={selectedTopics} 
              onSchedule={handleSchedulePost}
              onPost={handlePostNow}
              isPosting={isPosting}
              useWebIntent={false}
              characterLimit={getCharacterLimit()}
              useHashtags={user?.useHashtags !== false}
            />
          )}
          
          {stage === "schedule" && (
            <PostScheduler 
              content={currentContent}
              onScheduleComplete={handleScheduleComplete}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default CreatePost;
