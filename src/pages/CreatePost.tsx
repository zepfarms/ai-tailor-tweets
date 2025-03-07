
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
      // Open Twitter web intent in a new window (free option)
      let intentUrl = "https://twitter.com/intent/tweet?";
      intentUrl += "text=" + encodeURIComponent(content);
      
      // Add media URLs if available (note: Twitter web intent doesn't directly support image uploads)
      if (mediaPreviews && mediaPreviews.length > 0) {
        // Alert the user about the limitations of the free approach
        toast({
          title: "Media Sharing Note",
          description: "The free web intent approach doesn't support direct image uploads. Consider Zapier or IFTTT for more features.",
          variant: "default",
        });
      }
      
      window.open(intentUrl, "_blank", "width=550,height=420");
      
      toast({
        title: "X Post Window Opened",
        description: "Complete your post in the X window. For direct posting with images, consider Zapier (free tier) or IFTTT ($5/month).",
      });
      
      // Navigate back to dashboard
      navigate('/dashboard?status=shared');
    } catch (error) {
      console.error("Error posting to X:", error);
      toast({
        title: "Error",
        description: "Could not open X web intent. Please try again.",
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
              useWebIntent={true}
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
