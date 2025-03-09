
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { BarChart, AreaChart } from '@/components/ui/chart';
import { Download, RefreshCw, Sparkles, MessageCircle, Heart, Repeat, LineChart, CheckCircle2, Loader2 } from 'lucide-react';

interface XPostsAnalyzerProps {
  onGenerateFromPost: (content: string) => void;
}

interface XPost {
  id: string;
  content: string;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  impressions_count: number;
  engagement_rate: number;
  has_media: boolean;
  created_at: string;
}

const XPostsAnalyzer: React.FC<XPostsAnalyzerProps> = ({ onGenerateFromPost }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  
  // Query to get top posts
  const { data: topPosts, isLoading: isLoadingTopPosts, refetch: refetchTopPosts } = useQuery({
    queryKey: ['topXPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('x_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('engagement_rate', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as XPost[];
    },
    enabled: !!user?.id && user?.xLinked === true,
  });
  
  // Query to get engagement data for charts
  const { data: engagementData, isLoading: isLoadingEngagement } = useQuery({
    queryKey: ['xEngagementData', user?.id],
    queryFn: async () => {
      if (!user?.id) return { byDay: [], byEngagement: [] };
      
      const { data, error } = await supabase
        .from('x_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Group by day for time-based chart
      const byDay = groupPostsByDay(data);
      
      // Group by engagement rate for distribution chart
      const byEngagement = [
        { name: '0-1%', value: 0 },
        { name: '1-2%', value: 0 },
        { name: '2-5%', value: 0 },
        { name: '5-10%', value: 0 },
        { name: '>10%', value: 0 },
      ];
      
      data.forEach(post => {
        const rate = post.engagement_rate;
        if (rate < 1) byEngagement[0].value++;
        else if (rate < 2) byEngagement[1].value++;
        else if (rate < 5) byEngagement[2].value++;
        else if (rate < 10) byEngagement[3].value++;
        else byEngagement[4].value++;
      });
      
      return { byDay, byEngagement };
    },
    enabled: !!user?.id && user?.xLinked === true,
  });
  
  // Helper function to group posts by day
  const groupPostsByDay = (posts: XPost[]) => {
    const grouped = posts.reduce((acc, post) => {
      const date = new Date(post.created_at);
      const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!acc[day]) {
        acc[day] = {
          day,
          posts: 0,
          engagement: 0,
          likes: 0,
          retweets: 0,
          replies: 0
        };
      }
      
      acc[day].posts++;
      acc[day].engagement += post.engagement_rate;
      acc[day].likes += post.likes_count;
      acc[day].retweets += post.retweets_count;
      acc[day].replies += post.replies_count;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort by date
    return Object.values(grouped)
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-30); // Last 30 days
  };
  
  // Import posts from X
  const importPosts = async () => {
    if (!user?.id) return;
    
    setIsImporting(true);
    toast({
      title: "Importing posts",
      description: "Fetching your posts from X...",
    });
    
    try {
      const response = await supabase.functions.invoke('import-x-posts', {
        body: { userId: user.id },
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to import posts");
      }
      
      toast({
        title: "Import successful",
        description: response.data?.message || "Your X posts have been imported",
      });
      
      // Refresh the data
      refetchTopPosts();
      
    } catch (error) {
      console.error("Error importing posts:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import X posts",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Generate new post based on an existing one
  const generateFromPost = async (content: string) => {
    onGenerateFromPost(content);
  };
  
  // Loading state
  if (isLoadingTopPosts && isLoadingEngagement) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // No X account connected
  if (!user?.xLinked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyze Your X Account</CardTitle>
          <CardDescription>
            Connect your X account to analyze your posts and get insights.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">X Account Analysis</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={importPosts} 
            disabled={isImporting} 
            variant="outline"
            size="sm"
          >
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isImporting ? "Importing..." : "Import Posts"}
          </Button>
          <Button 
            onClick={() => refetchTopPosts()} 
            variant="outline"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="top-posts">
        <TabsList className="mb-4">
          <TabsTrigger value="top-posts">Top Posts</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="top-posts" className="space-y-4">
          {topPosts && topPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topPosts.map(post => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {new Date(post.created_at).toLocaleDateString()}
                        </CardTitle>
                        <CardDescription className="flex gap-2 mt-1">
                          <span className="flex items-center">
                            <Heart className="h-3 w-3 mr-1 text-red-500" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center">
                            <Repeat className="h-3 w-3 mr-1 text-green-500" />
                            {post.retweets_count}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="h-3 w-3 mr-1 text-blue-500" />
                            {post.replies_count}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="text-xs font-medium bg-primary/10 text-primary py-1 px-2 rounded-full">
                        {post.engagement_rate.toFixed(2)}% Engagement
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3 line-clamp-3">{post.content}</p>
                    <Button 
                      onClick={() => generateFromPost(post.content)}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-3 w-3" />
                      Create Similar Post
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">
                  {isLoadingTopPosts
                    ? "Loading your top posts..."
                    : "No posts imported yet. Import your posts to see your top performers."}
                </p>
                {!isLoadingTopPosts && (
                  <Button onClick={importPosts} disabled={isImporting}>
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Import Posts from X
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="engagement">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Over Time</CardTitle>
                <CardDescription>
                  Average engagement rate of your posts over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {engagementData?.byDay && engagementData.byDay.length > 0 ? (
                  <AreaChart 
                    data={engagementData.byDay.map(item => ({
                      name: item.day.split('-').slice(1).join('/'),
                      "Engagement Rate": (item.engagement / item.posts).toFixed(2)
                    }))} 
                    categories={["Engagement Rate"]}
                    index="name"
                    colors={["blue"]}
                    valueFormatter={(value) => `${value}%`}
                    className="h-72"
                  />
                ) : (
                  <div className="flex items-center justify-center h-72 text-muted-foreground">
                    No engagement data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
                <CardDescription>
                  Distribution of posts by engagement rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {engagementData?.byEngagement && engagementData.byEngagement.some(item => item.value > 0) ? (
                  <BarChart 
                    data={engagementData.byEngagement}
                    index="name"
                    categories={["value"]}
                    colors={["blue"]}
                    valueFormatter={(value) => `${value} posts`}
                    className="h-72"
                  />
                ) : (
                  <div className="flex items-center justify-center h-72 text-muted-foreground">
                    No engagement data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Insights</CardTitle>
                <CardDescription>
                  Analysis of your most engaging content themes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topPosts && topPosts.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Media Impact</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Posts with media</span>
                            <span>{topPosts.filter(p => p.has_media).length}/{topPosts.length}</span>
                          </div>
                          <Progress 
                            value={(topPosts.filter(p => p.has_media).length / topPosts.length) * 100} 
                            className="h-2" 
                          />
                        </div>
                        <div className="text-sm font-medium">
                          {topPosts.filter(p => p.has_media).length > 0 
                            ? `${(topPosts.filter(p => p.has_media)
                                .reduce((acc, post) => acc + post.engagement_rate, 0) / 
                                topPosts.filter(p => p.has_media).length).toFixed(2)}%` 
                            : "0%"}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Engagement Patterns</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-background p-3 rounded-lg text-center">
                          <Heart className="h-5 w-5 mx-auto mb-1 text-red-500" />
                          <div className="text-xs text-muted-foreground">Likes</div>
                          <div className="text-lg font-semibold">
                            {(topPosts.reduce((acc, p) => acc + p.likes_count, 0) / topPosts.length).toFixed(0)}
                          </div>
                        </div>
                        <div className="bg-background p-3 rounded-lg text-center">
                          <Repeat className="h-5 w-5 mx-auto mb-1 text-green-500" />
                          <div className="text-xs text-muted-foreground">Retweets</div>
                          <div className="text-lg font-semibold">
                            {(topPosts.reduce((acc, p) => acc + p.retweets_count, 0) / topPosts.length).toFixed(0)}
                          </div>
                        </div>
                        <div className="bg-background p-3 rounded-lg text-center">
                          <MessageCircle className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                          <div className="text-xs text-muted-foreground">Replies</div>
                          <div className="text-lg font-semibold">
                            {(topPosts.reduce((acc, p) => acc + p.replies_count, 0) / topPosts.length).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    Import posts to see content insights
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Tips to improve your X engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topPosts && topPosts.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Use media in your posts</p>
                        <p className="text-xs text-muted-foreground">
                          Posts with images or videos tend to get {topPosts.filter(p => p.has_media).length > 0 ? 
                            `${Math.round(((topPosts.filter(p => p.has_media)
                              .reduce((acc, post) => acc + post.engagement_rate, 0) / 
                              topPosts.filter(p => p.has_media).length) /
                              (topPosts.filter(p => !p.has_media)
                              .reduce((acc, post) => acc + post.engagement_rate, 0) / 
                              topPosts.filter(p => !p.has_media).length)) * 100)}%` : 
                            "more"} higher engagement.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Optimal post length</p>
                        <p className="text-xs text-muted-foreground">
                          Your top-performing posts average {
                            Math.round(topPosts.slice(0, 3)
                              .reduce((acc, post) => acc + post.content.length, 0) / 3)
                          } characters in length.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Engagement drivers</p>
                        <p className="text-xs text-muted-foreground">
                          Focus on content that drives {
                            topPosts.reduce((acc, p) => acc + p.likes_count, 0) > 
                            topPosts.reduce((acc, p) => acc + p.replies_count, 0) ? 
                              "likes" : "replies"
                          }, your audience engages most through them.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        onClick={() => generateFromPost(topPosts[0]?.content || "")}
                        className="w-full"
                        disabled={!topPosts.length}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Based on Top Post
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    Import posts to see recommendations
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default XPostsAnalyzer;
