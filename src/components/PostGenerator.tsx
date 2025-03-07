import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Calendar, Share, TrendingUp, ImagePlus, X, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Topic } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from 'react-router-dom';

interface PostGeneratorProps {
  selectedTopics: Topic[];
  onSchedule: (content: string) => void;
  onPost: (content: string, mediaPreviews?: string[]) => void;
  useWebIntent?: boolean;
  isPosting?: boolean;
}

export const PostGenerator: React.FC<PostGeneratorProps> = ({ 
  selectedTopics, 
  onSchedule,
  onPost,
  useWebIntent = false,
  isPosting = false
}) => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPostingInternal, setIsPostingInternal] = useState(false);
  const [suggestedPosts, setSuggestedPosts] = useState<string[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (selectedTopics.length > 0) {
      generateSuggestedPosts();
    }
  }, [selectedTopics]);

  useEffect(() => {
    return () => {
      mediaPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [mediaPreviews]);

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
      
      const customTopicTemplates = [
        `Just read an insightful article about #TOPIC# trends. The innovation happening in this space is remarkable! What aspects of #TOPIC# interest you the most? #Trending#TOPIC# ${currentDate}`,
        `The #TOPIC# community continues to grow and evolve. Today's developments show promising directions for the future. Are you following the latest #TOPIC# news? #Discover#TOPIC# ${currentDate}`,
        `Fascinating discussion today about the impact of #TOPIC# on our daily lives. The potential applications are endless! What's your take on how #TOPIC# will shape our future? #TOPIC#Insights ${currentDate}`
      ];
      
      let generated: string[] = [];
      
      selectedTopics.forEach(topic => {
        if (mockTrendingTopics[topic]) {
          generated = [...generated, ...mockTrendingTopics[topic]];
        } else {
          const customPosts = customTopicTemplates.map(template => 
            template.replace(/#TOPIC#/g, topic)
          );
          generated = [...generated, ...customPosts];
        }
      });
      
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
        "Art": "Art challenges us to see the world differently, to question our assumptions and expand our perspectives. Today's gallery visit was exactly the inspiration I needed. #ArtAppreciation #CreativeSpirit",
        "Crypto": "Just analyzed the latest trends in cryptocurrency markets. The volatility continues to present both challenges and opportunities for investors. What's your strategy in this evolving landscape? #Crypto #BlockchainTech #DigitalAssets",
        "Cryptocurrency": "The intersection of DeFi and traditional finance is creating fascinating new possibilities. Today's announcements could reshape how we think about financial systems. #Cryptocurrency #DeFi #FinancialFreedom",
        "Finance": "Market analysis today reveals interesting patterns for long-term investors. Remember that patience and strategy often outperform reactive trading. What's your investment philosophy? #FinanceTips #InvestorMindset",
        "AI": "The ethical implications of advanced AI systems deserve more discussion. As capabilities expand, so must our frameworks for responsible implementation. What guardrails do you think are most important? #AIEthics #TechResponsibility",
        "Fitness": "Consistency over intensity - that's the key lesson from today's workout session. Small daily improvements compound into remarkable results over time. What's your fitness philosophy? #FitnessJourney #HealthyHabits",
        "Writing": "The blank page can be intimidating, but showing up daily to write is half the battle. Today's writing session reminded me that perfection is the enemy of progress. Fellow writers, what keeps you motivated? #WritingCommunity #CreativeProcess",
      };
      
      const customPostTemplates = [
        `Just dove deep into the world of ${topic} today. The innovations and discussions happening in this space are truly eye-opening. Anyone else passionate about ${topic}? Let's connect and share insights! #${topic.replace(/\s+/g, '')} #Trends`,
        `Fascinating developments in ${topic} this week that might reshape how we think about this field. The possibilities are endless when you consider the long-term implications. What aspects of ${topic} excite you the most? #${topic.replace(/\s+/g, '')}`,
        `The ${topic} community is growing in remarkable ways. Just discovered some groundbreaking work that's happening behind the scenes. This could be a game-changer for everyone involved in ${topic}! #${topic.replace(/\s+/g, '')} #Innovation`
      ];
      
      let generatedContent;
      if (mockContents[topic]) {
        generatedContent = mockContents[topic];
      } else {
        const randomTemplate = customPostTemplates[Math.floor(Math.random() * customPostTemplates.length)];
        generatedContent = randomTemplate;
      }
      
      setContent(generatedContent);
      
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
    if (!content.trim() && mediaFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please add content or media first",
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

  const handleMediaSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mediaFiles.length + files.length > 4) {
      toast({
        title: "Too many files",
        description: "You can only attach up to 4 media items",
        variant: "destructive",
      });
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: "Unsupported file type",
          description: "Only images and videos are supported",
          variant: "destructive",
        });
        return;
      }

      const sizeLimit = file.type.startsWith('video/') ? 15 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > sizeLimit) {
        toast({
          title: "File too large",
          description: file.type.startsWith('video/') 
            ? "Videos must be smaller than 15MB" 
            : "Images must be smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setMediaFiles(prev => [...prev, ...newFiles]);
    setMediaPreviews(prev => [...prev, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const postDirectlyToX = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please add content or media first",
        variant: "destructive",
      });
      return;
    }

    if (useWebIntent) {
      openXWebIntent();
      return;
    }

    setIsPostingInternal(true);
    
    try {
      onPost(content, mediaPreviews);
    } catch (error) {
      console.error("Error posting to X:", error);
      toast({
        title: "Failed to post to X",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsPostingInternal(false);
    }
  };

  const openXWebIntent = () => {
    if (!content.trim() && mediaFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please add content or media first",
        variant: "destructive",
      });
      return;
    }

    onPost(content, mediaPreviews);
  };

  const selectSuggestedPost = (post: string) => {
    setContent(post);
    toast({
      title: "Post selected",
      description: "You can edit it before posting or scheduling",
    });
  };

  const getPostButtonDisabledReason = (): string | null => {
    if (useWebIntent) {
      if (!content.trim() && mediaFiles.length === 0) {
        return "Please add content or media before posting";
      }
      return null;
    }
    
    if (!content.trim() && mediaFiles.length === 0) {
      return "Please add content or media before posting";
    }
    return null;
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
        
        <div className="mb-4">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden" 
            accept="image/*, video/*"
            multiple
          />
          
          {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative rounded-md overflow-hidden aspect-video bg-gray-100">
                  {mediaFiles[index]?.type.startsWith('video/') ? (
                    <video 
                      src={preview} 
                      className="w-full h-full object-cover" 
                      controls
                    />
                  ) : (
                    <img 
                      src={preview} 
                      alt={`Media ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  )}
                  <button 
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={handleMediaSelect}
            disabled={mediaFiles.length >= 4}
            className="w-full flex items-center justify-center gap-2 border-dashed"
          >
            <ImagePlus className="h-4 w-4" />
            {mediaFiles.length > 0 ? `Add More Media (${mediaFiles.length}/4)` : "Add Photos/Videos"}
          </Button>
          
          {mediaFiles.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {mediaFiles.filter(f => f.type.startsWith('image/')).length} photos, {mediaFiles.filter(f => f.type.startsWith('video/')).length} videos added
            </p>
          )}
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
              disabled={isSaving || (!content.trim() && mediaFiles.length === 0)}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              {isSaving ? "Scheduling..." : "Schedule"}
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <Button 
                      onClick={postDirectlyToX}
                      disabled={isPosting || isPostingInternal || (!content.trim() && mediaFiles.length === 0)}
                      className="flex items-center gap-2 button-glow"
                      style={{ 
                        backgroundColor: "#1DA1F2", 
                        color: "white",
                        border: "none"
                      }}
                    >
                      {isPosting || isPostingInternal ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : useWebIntent ? (
                        <ExternalLink className="w-4 h-4" />
                      ) : (
                        <Share className="w-4 h-4" />
                      )}
                      {useWebIntent ? "Share to X" : "Post to X"}
                    </Button>
                  </div>
                </TooltipTrigger>
                {getPostButtonDisabledReason() && (
                  <TooltipContent side="top">
                    <p>{getPostButtonDisabledReason()}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
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
