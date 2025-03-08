
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, TrendingUp } from 'lucide-react';

interface TopPost {
  text: string;
  impressions: number;
  engagementRate: string;
  likes: number;
  shares: number;
}

export const TopPerformingPosts = ({ onSelectPost }: { onSelectPost: (content: string) => void }) => {
  const { toast } = useToast();

  const { data: topPosts, isLoading } = useQuery({
    queryKey: ['topPosts'],
    queryFn: async () => {
      const response = await supabase.functions.invoke('twitter-analytics', {
        body: { fetchTopPosts: true },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data.topPosts as TopPost[];
    },
  });

  const generateNewPost = async (inspiration: TopPost) => {
    try {
      toast({
        title: "Generating new post",
        description: "Using AI to create a similar high-performing post...",
      });

      const response = await supabase.functions.invoke('twitter-analytics', {
        body: {
          generateSimilarPost: true,
          inspiration: inspiration.text,
        },
      });

      if (response.error) throw new Error(response.error.message);
      onSelectPost(response.data.generatedPost);
      
      toast({
        title: "Post generated",
        description: "New post created based on your top-performing content",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate post. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading top posts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold">Your Top Performing Posts</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {topPosts?.map((post, index) => (
          <Card key={index} className="p-4">
            <p className="text-sm mb-2 line-clamp-3">{post.text}</p>
            <div className="flex justify-between text-sm text-muted-foreground mb-3">
              <span>{post.impressions.toLocaleString()} impressions</span>
              <span>{post.engagementRate} engagement</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => generateNewPost(post)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Similar Post
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TopPerformingPosts;
