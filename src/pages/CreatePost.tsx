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

type Stage = "analyze" | "topics" | "create" | "schedule";

const CreatePost: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stage, setStage] = useState<Stage>("analyze");
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [currentContent, setCurrentContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  
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
    
    // Simulate account analysis
    if (stage === "analyze") {
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setStage("topics");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, navigate, stage, searchParams]);

  const handleTopicSelection = (topics: Topic[]) => {
    setSelectedTopics(topics);
    setStage("create");
  };

  const handleSchedulePost = (content: string) => {
    setCurrentContent(content);
    setStage("schedule");
  };

  const handlePostNow = (content: string, mediaPreviews?: string[]) => {
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
          description: "Local images can't be shared directly via X. Consider posting to X directly after linking your account.",
          variant: "default",
        });
      }
    }
    
    window.open(intentUrl, "_blank", "width=550,height=420");
    
    toast({
      title: "X Post Window Opened",
      description: "Complete your post in the X window",
    });
    
    // Navigate back to dashboard
    navigate('/dashboard?status=shared');
  };

  const handleScheduleComplete = () => {
    navigate('/dashboard');
  };

  const goBack = () => {
    if (stage === "topics") {
      navigate('/dashboard');
    } else if (stage === "create") {
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
        {stage !== "analyze" && (
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={goBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        
        <div className="max-w-3xl mx-auto">
          {stage === "analyze" && (
            <div className="text-center space-y-6 animate-fade-in py-12">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Analyzing Your X Account</h2>
              <p className="text-muted-foreground">
                We're analyzing your posting patterns and preferences to provide better content suggestions.
              </p>
              <div className="relative h-2 max-w-md mx-auto bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-2000"
                  style={{ width: isAnalyzing ? '90%' : '100%' }}
                ></div>
              </div>
            </div>
          )}
          
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
