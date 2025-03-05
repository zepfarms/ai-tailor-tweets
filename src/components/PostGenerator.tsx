
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Calendar, Send, Check, Share } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Topic } from '@/lib/types';

interface PostGeneratorProps {
  selectedTopics: Topic[];
  onSchedule: (content: string) => void;
  onPost: (content: string) => void;
}

export const PostGenerator: React.FC<PostGeneratorProps> = ({ 
  selectedTopics, 
  onSchedule,
  onPost
}) => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();

  const generatePost = async () => {
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const topic = selectedTopics[Math.floor(Math.random() * selectedTopics.length)];
      
      const mockContents = {
        "Technology": "Just explored the latest advancements in AI and machine learning - the potential for these technologies to transform how we work is incredible. Excited to see where this leads! #TechTrends #AI #Innovation",
        "Politics": "Interesting policy discussion today about the balance between regulation and innovation. Finding that middle ground is key to progress while ensuring protections are in place. What's your take? #PolicyMatters",
        "Sports": "What a game last night! The teamwork and strategy on display was next level. This is why sports continues to unite and inspire us. Anyone else catch that incredible final play? #SportsFan",
        "Entertainment": "Just finished watching that new series everyone's talking about. The character development and storytelling were absolutely brilliant. No spoilers, but that ending! #MustWatch #StreamingNow",
        "Science": "Fascinating new research on quantum computing published today. The implications for solving complex problems previously thought impossible are mind-blowing. Science continues to amaze! #QuantumLeap #ScienceAdvances",
        "Business": "The most successful companies are those that adapt to changing market conditions while staying true to their core mission. Resilience and vision - an unbeatable combination. #BusinessStrategy #Leadership",
        "Health": "Reminder that small daily habits add up to significant health outcomes. Today's win: a 30-minute walk and plenty of water. What healthy habit are you building? #WellnessJourney #HealthyChoices",
        "Fashion": "Style isn't just about following trends - it's about expressing your authentic self. Today's look: minimalist with a bold accent piece. Fashion as personal storytelling. #StyleInspo #FashionExpression",
        "Food": "Experimented with a fusion recipe tonight combining traditional techniques with unexpected flavors. Culinary creativity at its finest! #FoodieAdventures #CookingExperiments",
        "Travel": "The most memorable travel experiences often come from the unplanned moments and spontaneous detours. It's in getting lost that we truly find what we're seeking. #TravelWisdom #Wanderlust",
        "Gaming": "This new game's world-building and narrative depth are on another level. 10 hours in and I'm completely immersed. Developers really raised the bar with this one. #GamingCommunity #GameReview",
        "Music": "That feeling when you discover an artist whose music seems to perfectly capture your current mood and mindset. Musical serendipity is real. #MusicDiscovery #SoundtrackToLife",
        "Art": "Art challenges us to see the world differently, to question our assumptions and expand our perspectives. Today's gallery visit was exactly the inspiration I needed. #ArtAppreciation #CreativeSpirit"
      };
      
      setContent(mockContents[topic] || "Just had an inspiring conversation about the future of digital content. So many possibilities ahead! What innovations are you most excited about? #DigitalFuture");
      
      toast({
        title: "Post generated",
        description: "AI has created content based on your selected topics",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedule = () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please generate or write content first",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    setTimeout(() => {
      onSchedule(content);
      setIsSaving(false);
      toast({
        title: "Success",
        description: "Post scheduled successfully",
      });
    }, 800);
  };

  const handlePost = () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please generate or write content first",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    
    setTimeout(() => {
      onPost(content);
      setIsPosting(false);
      toast({
        title: "Success",
        description: "Post published successfully",
      });
    }, 800);
  };

  const postToX = () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please generate or write content first",
        variant: "destructive",
      });
      return;
    }

    // Simple X Web Intent implementation that doesn't require authentication
    let intentUrl = "https://twitter.com/intent/tweet?";
    intentUrl += "text=" + encodeURIComponent(content);
    
    // Open in a popup window
    window.open(intentUrl, "_blank", "width=550,height=420");
    
    toast({
      title: "X Post Window Opened",
      description: "Complete your post in the X window",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Create Your Post</h2>
        <p className="text-muted-foreground">
          Generate AI-powered content or write your own post
        </p>
      </div>
      
      <div className="glass-card p-6 rounded-xl">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="content" className="text-sm font-medium">
              Post Content
            </label>
            <span className="text-xs text-muted-foreground">
              {content.length}/280 characters
            </span>
          </div>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="min-h-[120px] resize-none focus:ring-blue-500"
            maxLength={280}
          />
        </div>
        
        <div className="flex flex-wrap gap-3 justify-between">
          <Button 
            onClick={generatePost} 
            variant="outline" 
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isGenerating ? "Generating..." : "Generate with AI"}
          </Button>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleSchedule} 
              variant="outline" 
              disabled={isSaving || !content.trim()}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              {isSaving ? "Scheduling..." : "Schedule"}
            </Button>
            
            <Button 
              onClick={postToX}
              disabled={!content.trim()}
              className="flex items-center gap-2"
              style={{ 
                backgroundColor: "#1DA1F2", 
                color: "white",
                border: "none"
              }}
            >
              <Share className="w-4 h-4" />
              Post to X
            </Button>
            
            <Button 
              onClick={handlePost} 
              disabled={isPosting || !content.trim()}
              className="flex items-center gap-2 button-glow"
            >
              {isPosting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isPosting ? (
                <Check className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isPosting ? "Posting..." : "Post Now"}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground text-center">
        <p>Selected topics: {selectedTopics.join(", ")}</p>
      </div>
    </div>
  );
};

export default PostGenerator;
