
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, LightbulbIcon, Award, TrendingUp, Users, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnalyticsData } from '@/components/XAnalytics';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface XAnalyticsSuggestionsProps {
  analytics: AnalyticsData;
  username: string;
}

interface Suggestion {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'content' | 'engagement' | 'growth';
}

const XAnalyticsSuggestions: React.FC<XAnalyticsSuggestionsProps> = ({ analytics, username }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Here we would normally call a Supabase Edge Function that would use an AI service
      // For now, we'll generate suggestions based on the analytics data directly
      
      // In a real implementation, you would call something like:
      // const { data, error } = await supabase.functions.invoke('generate-x-suggestions', {
      //   body: { analytics, username }
      // });
      
      // Instead, we'll generate suggestions locally
      const generatedSuggestions = generateLocalSuggestions(analytics);
      
      setSuggestions(generatedSuggestions);
      
      toast({
        title: "Suggestions Generated",
        description: "AI-powered suggestions have been created based on your X analytics",
      });
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError('Failed to generate suggestions. Please try again later.');
      
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // This function mimics what an AI would generate based on analytics data
  // In a real implementation, this would be replaced by a call to an AI service
  const generateLocalSuggestions = (data: AnalyticsData): Suggestion[] => {
    const result: Suggestion[] = [];
    
    // Content suggestions based on top posts
    if (data.topPosts && data.topPosts.length > 0) {
      const topPost = data.topPosts[0];
      
      // Check if top post has images
      if (topPost.isImage) {
        result.push({
          title: "Keep using images in your posts",
          description: "Your top performing post included an image. Visual content tends to drive more engagement. Consider using images in more of your posts.",
          icon: <LightbulbIcon className="h-5 w-5 text-yellow-500" />,
          type: 'content'
        });
      } else {
        result.push({
          title: "Try adding more visual content",
          description: "Consider incorporating more images into your posts. Visual content typically receives higher engagement rates.",
          icon: <LightbulbIcon className="h-5 w-5 text-yellow-500" />,
          type: 'content'
        });
      }
      
      // Check if top post has videos
      if (topPost.isVideo) {
        result.push({
          title: "Video content is working well",
          description: "Your top performing post included a video. Keep creating video content as it drives good engagement for your account.",
          icon: <Award className="h-5 w-5 text-purple-500" />,
          type: 'content'
        });
      }
    }
    
    // Posting frequency suggestions
    if (data.postsCount < 30) {
      result.push({
        title: "Increase posting frequency",
        description: "You have a relatively low number of posts. Try to post more regularly to increase visibility and engagement.",
        icon: <Calendar className="h-5 w-5 text-blue-500" />,
        type: 'growth'
      });
    }
    
    // Engagement suggestions
    const engagementRate = parseFloat(data.engagementRate.replace('%', ''));
    if (engagementRate < 2) {
      result.push({
        title: "Improve engagement rate",
        description: "Your engagement rate is below average. Try asking questions in your posts and responding to comments to boost interaction.",
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        type: 'engagement'
      });
    } else if (engagementRate > 5) {
      result.push({
        title: "Great engagement rate",
        description: "Your engagement rate is above average. Keep interacting with your audience to maintain this momentum.",
        icon: <Award className="h-5 w-5 text-amber-500" />,
        type: 'engagement'
      });
    }
    
    // Follower growth suggestions
    if (data.followerCount < 1000) {
      result.push({
        title: "Grow your audience",
        description: "To increase followers, try using relevant hashtags, collaborate with others in your field, and maintain a consistent posting schedule.",
        icon: <Users className="h-5 w-5 text-indigo-500" />,
        type: 'growth'
      });
    }
    
    // If we don't have enough suggestions, add some general ones
    if (result.length < 3) {
      result.push({
        title: "Optimize posting times",
        description: "Analyze when your audience is most active and schedule your posts accordingly to maximize visibility.",
        icon: <Calendar className="h-5 w-5 text-orange-500" />,
        type: 'growth'
      });
      
      result.push({
        title: "Engage with trending topics",
        description: "Join conversations around trending topics relevant to your field to increase your visibility to new audiences.",
        icon: <TrendingUp className="h-5 w-5 text-pink-500" />,
        type: 'growth'
      });
    }
    
    return result;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-amber-500" />
            AI Growth Suggestions
          </CardTitle>
          <CardDescription>
            Get personalized recommendations to improve your X performance
          </CardDescription>
        </div>
        <Button 
          onClick={generateSuggestions} 
          disabled={loading}
          size="sm"
          className="flex items-center"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {suggestions.length > 0 ? "Refresh Suggestions" : "Generate Suggestions"}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-sm text-muted-foreground">Analyzing your X account data...</p>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="border rounded-lg p-4 transition-all hover:border-blue-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center font-medium">
                    {suggestion.icon}
                    <span className="ml-2">{suggestion.title}</span>
                  </div>
                  <Badge variant="outline" className={
                    suggestion.type === 'content' ? 'bg-blue-50' : 
                    suggestion.type === 'engagement' ? 'bg-green-50' : 'bg-purple-50'
                  }>
                    {suggestion.type === 'content' ? 'Content' : 
                     suggestion.type === 'engagement' ? 'Engagement' : 'Growth'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{suggestion.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Click the "Generate Suggestions" button to get AI-powered recommendations based on your X analytics data.
            </p>
            <p className="text-xs text-muted-foreground">
              Our AI will analyze your posts, engagement, and follower metrics to provide personalized growth strategies.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default XAnalyticsSuggestions;
