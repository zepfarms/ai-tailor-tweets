
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import TopicSelection from '@/components/TopicSelection';
import PostGenerator from '@/components/PostGenerator';
import PostScheduler from '@/components/PostScheduler';
import { Topic } from '@/lib/types';
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Video } from 'lucide-react';
import { postToSocialMedia } from '@/lib/ayrshareUtils';

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
    
    // Check if returning from X web intent
    const status = searchParams.get('status');
    if (status === 'shared') {
      toast({
        title: "Shared to X",
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
      // First try posting via Ayrshare
      await postToSocialMedia({
        content,
        mediaUrls: mediaPreviews,
        platforms: ["twitter"]
      });
      
      toast({
        title: "Posted to X",
        description: "Your post has been shared to X via Ayrshare",
      });
      
      // Navigate back to dashboard
      navigate('/dashboard?status=shared');
    } catch (error) {
      console.error("Error posting to X:", error);
      
      // Fallback to web intent if Ayrshare fails
      // Open Twitter web intent in a new window
      let intentUrl = "https://twitter.com/intent/tweet?";
      intentUrl += "text=" + encodeURIComponent(content);
      
      // Add media URLs if available
      if (mediaPreviews && mediaPreviews.length > 0) {
        // For the web intent, we can only include one URL in the text
        // X will automatically expand this into a card with the image
        const firstImageUrl = mediaPreviews[0];
        
        // Add the image URL at the end of the text
        // Only add if it's a real URL (not a blob URL)
        if (firstImageUrl && !firstImageUrl.startsWith('blob:')) {
          intentUrl += "%20" + encodeURIComponent(firstImageUrl);
        } else {
          // Alert the user that local images can't be shared directly
          toast({
            title: "Media Sharing Limitation",
            description: "Local images can't be shared directly via X. Please connect your X account to Ayrshare to enable image posting.",
            variant: "default",
          });
        }
      }
      
      window.open(intentUrl, "_blank", "width=550,height=420");
      
      toast({
        title: "X Post Window Opened",
        description: "Complete your post in the X window. To enable direct posting with images, connect your X account in Settings.",
      });
      
      // Navigate back to dashboard
      navigate('/dashboard?status=shared');
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
              useWebIntent={false}
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
      
      <Footer />
    </div>
  );
};

export default CreatePost;
