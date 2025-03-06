
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Calendar, Send, Check, Share, TrendingUp } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Topic } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

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
  const [suggestedPosts, setSuggestedPosts] = useState<string[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const { toast } = useToast();
  const { user, postToX } = useAuth();

  useEffect(() => {
    // Generate post suggestions when topics are selected
    if (selectedTopics.length > 0) {
      generateSuggestedPosts();
    }
  }, [selectedTopics]);

  const generateSuggestedPosts = async () => {
    setIsLoadingTrends(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const currentDate = new Date().toLocaleDateString();
      const mockTrendingTopics = {
        "Technology": [
          `Latest AI advancements are changing how we work. Just explored a demo that can create content in seconds! What possibilities do you see for AI in your field? #TechTrends #AI ${currentDate}`,
          `The new foldable phones are finally addressing durability concerns. Had hands-on time with the latest model - impressive engineering! Would you switch to a foldable? #TechReview #Innovation ${currentDate}`,
          `Privacy in tech remains a hot debate. New regulations coming next month could change how our data is handled. Are you concerned about your digital privacy? #DataPrivacy #TechPolicy ${currentDate}`
        ],
        "Politics": [
          `Following today's policy announcement on climate initiatives. The proposed targets are ambitious but necessary. What's your take on the timeline? #ClimatePolicy #GreenFuture ${currentDate}`,
          `Interesting town hall discussion yesterday about local infrastructure funding. The community engagement was impressive. How involved are you in local politics? #LocalPolitics #CommunityEngagement ${currentDate}`,
          `The upcoming election debates are scheduled for next week. What issues do you think need more focus in the political discourse? #ElectionSeason #PoliticalDebate ${currentDate}`
        ],
        "Sports": [
          `What a comeback in last night's game! That final quarter showed why sports are so unpredictable and exciting. Were you watching? #GameDay #SportsHighlight ${currentDate}`,
          `Training techniques are evolving - just read about the data analytics being used by top teams now. Sports science is fascinating! #SportsTech #AthleticPerformance ${currentDate}`,
          `The trade deadline approaches and rumors are flying. Which moves do you think will actually happen? #SportsTrades #LeagueNews ${currentDate}`
        ],
        "Entertainment": [
          `Just watched that new series everyone's talking about. The character development was exceptional. No spoilers, but that finale! What did you think? #MustWatch #StreamingNow ${currentDate}`,
          `Industry awards season is coming up - predictions? I'm seeing some unexpected nominations this year that could shake things up. #AwardsSeason #Entertainment ${currentDate}`,
          `The revival of practical effects in filmmaking is a welcome trend. CGI has its place, but nothing beats the authenticity of real stunts and props. Agree? #FilmProduction #MovieMagic ${currentDate}`
        ],
        "Science": [
          `The latest space telescope images are simply mind-blowing. Our understanding of galaxy formation might need revision. Science continues to humble us! #SpaceDiscovery #Astronomy ${currentDate}`,
          `New research on renewable energy efficiency breaks previous records. The path to sustainable power is accelerating! #CleanEnergy #ScienceAdvancement ${currentDate}`,
          `The recent breakthroughs in quantum computing are bringing us closer to practical applications. The implications for cryptography and medicine are profound. #QuantumScience #FutureTech ${currentDate}`
        ],
        "Business": [
          `Remote work policies are being reassessed at major corporations. The hybrid model seems to be winning out. How has your work setup evolved? #FutureOfWork #BusinessTrends ${currentDate}`,
          `Startup funding in Q3 shows interesting shifts toward sustainability-focused ventures. The market is speaking clearly about priorities. #StartupEconomy #GreenBusiness ${currentDate}`,
          `Supply chain resilience remains the top conversation in manufacturing. Today's announcement about nearshoring initiatives signals a major shift. #SupplyChain #BusinessStrategy ${currentDate}`
        ],
        "Health": [
          `New research confirms what we suspected - even short walks throughout the day have significant health benefits. What's your favorite way to stay active? #HealthTips #WellnessJourney ${currentDate}`,
          `Mental health awareness continues to improve. The new resources being made available through healthcare providers are a positive step. #MentalHealthMatters #SelfCare ${currentDate}`,
          `Nutrition science updates: the latest studies on gut health show promising connections to overall wellbeing. Have you made any dietary changes recently? #NutritionFacts #HealthyLiving ${currentDate}`
        ],
        "Fashion": [
          `Sustainable fashion is finally moving from niche to mainstream. Today's industry announcement about recycled materials is a game-changer. #SustainableFashion #EcoStyle ${currentDate}`,
          `Seasonal trends are evolving - the lines between traditional seasons are blurring in interesting ways. Fashion is becoming more fluid and practical. #FashionTrends #StyleEvolution ${currentDate}`,
          `The revival of vintage styles with modern twists continues to dominate street fashion. What era's style do you think deserves more appreciation? #VintageFashion #StyleInspiration ${currentDate}`
        ],
        "Food": [
          `Fusion cuisine continues to evolve in exciting directions. Just had a meal combining traditional techniques with unexpected flavors - culinary creativity at its finest! #FoodieFinds #CulinaryExploration ${currentDate}`,
          `The farm-to-table movement is gaining momentum with new partnerships announced today between restaurants and local farms. Supporting local has never tasted better! #LocalFood #SustainableEating ${currentDate}`,
          `Home cooking trends show interesting patterns post-pandemic. Are you cooking more or less than you were a year ago? #HomeCooking #FoodCommunity ${currentDate}`
        ],
        "Travel": [
          `Sustainable tourism is reshaping how we explore. The new certification standards announced today will help travelers make informed choices. How important is sustainability in your travel plans? #ResponsibleTravel #EcoTourism ${currentDate}`,
          `Off-season travel has its unique charms - just experienced a popular destination with half the crowds and found hidden gems I would have missed. What's your best off-season discovery? #TravelTips #ExplorationMode ${currentDate}`,
          `Local immersion vs. tourist highlights - the debate continues. I find the richest experiences come from blending both approaches. What's your travel philosophy? #TravelCulture #AuthentucExperiences ${currentDate}`
        ],
        "Gaming": [
          `The indie game that just launched today is already breaking records. Amazing to see small studios creating such innovative gameplay. Have you checked it out yet? #IndieGaming #GameRecommendations ${currentDate}`,
          `Gaming accessibility continues to improve with today's announcement of new adaptive controller options. Gaming is for everyone! #GameAccessibility #InclusiveGaming ${currentDate}`,
          `The evolution of storytelling in games continues to impress. Today's narrative-driven releases are rivaling film and literature in emotional impact. #GameNarrative #DigitalStorytelling ${currentDate}`
        ],
        "Music": [
          `Genre-blending continues to produce some of the most innovative sounds in music. Today's new release defies traditional categorization in the best ways. What artists do you think blend genres most effectively? #MusicEvolution #SoundInnovation ${currentDate}`,
          `The revival of vinyl isn't slowing down - new pressing plants are opening to meet demand. There's something special about physical media in a digital world. Do you collect vinyl? #VinylCommunity #MusicCollectors ${currentDate}`,
          `Live music is back in full force. Just got tickets to a show I've been waiting two years to see! Which artists are on your must-see list? #LiveMusic #ConcertSeason ${currentDate}`
        ],
        "Art": [
          `Digital art platforms are changing how creators connect with audiences. Today's announcement about new artist-friendly policies is an important step. How do you discover new artists? #DigitalArt #CreatorEconomy ${currentDate}`,
          `The intersection of technology and traditional art forms is producing fascinating results. Just experienced an exhibition that blended classical techniques with interactive elements. #ArtInnovation #CreativeTech ${currentDate}`,
          `Art accessibility initiatives are expanding - the new virtual tour options announced today for major museums makes global collections available to everyone. #ArtForAll #MuseumExperience ${currentDate}`
        ],
      };
      
      let generated: string[] = [];
      
      selectedTopics.forEach(topic => {
        if (mockTrendingTopics[topic]) {
          // Add all posts for this topic
          generated = [...generated, ...mockTrendingTopics[topic]];
        }
      });
      
      // Shuffle the array to mix up the topics
      generated = generated.sort(() => Math.random() - 0.5).slice(0, 6);
      
      setSuggestedPosts(generated);
      
      toast({
        title: "Trending content generated",
        description: `Found ${generated.length} trending posts related to your topics`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate trending content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTrends(false);
    }
  };

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

  const postDirectlyToX = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please generate or write content first",
        variant: "destructive",
      });
      return;
    }

    if (!user?.xLinked) {
      toast({
        title: "Error",
        description: "Please link your X account first",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    
    try {
      await postToX(content);
      
      toast({
        title: "Success",
        description: "Your post has been published to X",
      });
    } catch (error) {
      console.error("Error posting to X:", error);
      toast({
        title: "Failed to post to X",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const openXWebIntent = () => {
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

  const selectSuggestedPost = (post: string) => {
    setContent(post);
    toast({
      title: "Post selected",
      description: "You can edit it before posting or scheduling",
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
      
      {suggestedPosts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="text-lg font-medium">Trending Content for Your Topics</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedPosts.map((post, index) => (
              <div 
                key={index} 
                className="p-4 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => selectSuggestedPost(post)}
              >
                <p className="text-sm line-clamp-3">{post}</p>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={generateSuggestedPosts}
              variant="outline"
              disabled={isLoadingTrends}
              className="flex items-center gap-2"
            >
              {isLoadingTrends ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Trending Content
            </Button>
          </div>
        </div>
      )}
      
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
            
            {user?.xLinked ? (
              <Button 
                onClick={postDirectlyToX}
                disabled={isPosting || !content.trim()}
                className="flex items-center gap-2"
                style={{ 
                  backgroundColor: "#1DA1F2", 
                  color: "white",
                  border: "none"
                }}
              >
                {isPosting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Share className="w-4 h-4" />
                )}
                {isPosting ? "Posting..." : "Post to X"}
              </Button>
            ) : (
              <Button 
                onClick={openXWebIntent}
                disabled={!content.trim()}
                className="flex items-center gap-2"
                style={{ 
                  backgroundColor: "#1DA1F2", 
                  color: "white",
                  border: "none"
                }}
              >
                <Share className="w-4 h-4" />
                Post via Web
              </Button>
            )}
            
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
