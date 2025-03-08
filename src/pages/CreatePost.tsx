
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

type Stage = "topics" | "create" | "schedule";

const CreatePost: React.FC = () => {
  const { user, isLoading, postToX } = useAuth();
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
    
    // Check if returning from a post action
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
      if (!postToX) {
        throw new Error("Posting to X functionality not available");
      }
      
      // Directly post to X using the auth context function
      await postToX({
        content,
        // We'll handle media in a future update
      });
      
      toast({
        title: "Posted to X",
        description: "Your post has been published successfully!",
      });
      
      // Navigate back to dashboard
      navigate('/dashboard?status=posted');
    } catch (error) {
      console.error("Error posting to X:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not post to X. Please try again.",
        variant: "destructive", 
      });
    } finally {
      setIsPosting(false);
    }
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

  // Determine character limit based on X Premium status
  const getCharacterLimit = () => {
    if (user?.isXPremium) {
      return 4000; // X Premium character limit
    }
    return 280; // Standard X character limit
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
          {stage === "topics" && (
            <>
              <TopicSelection onSelectTopics={handleTopicSelection} />
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
              useWebIntent={false} // Set to false to use direct posting
              characterLimit={getCharacterLimit()}
              useHashtags={user.useHashtags !== false}
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
