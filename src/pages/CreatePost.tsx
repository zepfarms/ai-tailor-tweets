
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import TopicSelection from '@/components/TopicSelection';
import PostGenerator from '@/components/PostGenerator';
import PostScheduler from '@/components/PostScheduler';
import { Topic } from '@/lib/types';
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft } from 'lucide-react';

type Stage = "analyze" | "topics" | "create" | "schedule";

const CreatePost: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("analyze");
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [currentContent, setCurrentContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (!isLoading && user && !user.xLinked) {
      toast({
        title: "X Account Not Linked",
        description: "Please link your X account before creating posts",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }
    
    // Simulate account analysis
    if (stage === "analyze") {
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setStage("topics");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, navigate, stage]);

  const handleTopicSelection = (topics: Topic[]) => {
    setSelectedTopics(topics);
    setStage("create");
  };

  const handleSchedulePost = (content: string) => {
    setCurrentContent(content);
    setStage("schedule");
  };

  const handlePostNow = (content: string) => {
    // Simulate posting
    toast({
      title: "Post Published",
      description: "Your post has been published to X",
    });
    navigate('/dashboard');
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
            <TopicSelection onSelectTopics={handleTopicSelection} />
          )}
          
          {stage === "create" && (
            <PostGenerator 
              selectedTopics={selectedTopics} 
              onSchedule={handleSchedulePost}
              onPost={handlePostNow}
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
