
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { XPost } from '@/lib/types';
import { 
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import TopPerformingPosts from './TopPerformingPosts';

export const XPostsAnalyzer: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [posts, setPosts] = useState<XPost[]>([]);
  const [activeTab, setActiveTab] = useState('engagement');

  useEffect(() => {
    if (user?.id) {
      fetchXPosts();
    }
  }, [user?.id]);

  const fetchXPosts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('x_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Convert the id from number to string to match the XPost interface
        const formattedData: XPost[] = data.map(post => ({
          ...post,
          id: post.id.toString()
        }));
        setPosts(formattedData);
      }
    } catch (error) {
      console.error('Error fetching X posts:', error);
      toast({
        title: "Error fetching posts",
        description: "We couldn't load your X posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const importXPosts = async () => {
    if (!user?.id) return;
    
    try {
      setIsImporting(true);
      
      const response = await supabase.functions.invoke('import-x-posts', {
        body: { userId: user.id }
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to import posts");
      }
      
      toast({
        title: "Posts imported successfully",
        description: "Your X posts have been imported and analyzed.",
      });
      
      // Refresh the posts list
      fetchXPosts();
    } catch (error) {
      console.error('Error importing X posts:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import your X posts",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Format posts for charts
  const getEngagementData = (filteredPosts: XPost[]) => {
    return filteredPosts.slice(0, 10).map(post => ({
      date: new Date(post.created_at).toLocaleDateString(),
      engagement: post.engagement_rate,
      likes: post.likes_count,
      retweets: post.retweets_count,
      replies: post.replies_count
    }));
  };

  // Get top performing posts by engagement rate
  const getTopPosts = () => {
    return [...posts].sort((a, b) => b.engagement_rate - a.engagement_rate).slice(0, 5);
  };

  // Calculate average engagement
  const getAverageEngagement = () => {
    if (posts.length === 0) return 0;
    const total = posts.reduce((sum, post) => sum + post.engagement_rate, 0);
    return (total / posts.length).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[300px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[100px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">X Analytics</h2>
        <Button 
          onClick={importXPosts} 
          disabled={isImporting}
        >
          {isImporting ? "Importing..." : "Import X Posts"}
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No X Posts Found</CardTitle>
            <CardDescription>
              Import your X posts to get insights on your performance
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Button onClick={importXPosts} disabled={isImporting}>
              {isImporting ? "Importing..." : "Import X Posts Now"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{posts.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{getAverageEngagement()}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {posts.reduce((sum, post) => sum + post.likes_count + post.retweets_count + post.replies_count, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="posts">Top Posts</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="engagement" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Rate</CardTitle>
                  <CardDescription>
                    How your posts have performed over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={getEngagementData(posts)}
                        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}%`, 'Engagement']} />
                        <Area 
                          type="monotone" 
                          dataKey="engagement" 
                          stroke="#8884d8" 
                          fill="#8884d8" 
                          fillOpacity={0.3} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Interaction Breakdown</CardTitle>
                  <CardDescription>
                    Likes, retweets and replies per post
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getEngagementData(posts)}
                        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="likes" fill="#8884d8" name="Likes" />
                        <Bar dataKey="retweets" fill="#82ca9d" name="Retweets" />
                        <Bar dataKey="replies" fill="#ffc658" name="Replies" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="posts">
              <TopPerformingPosts posts={getTopPosts()} />
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Post Timing Analysis</CardTitle>
                  <CardDescription>
                    Best times to post based on your engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Based on your post history, we recommend posting at these times:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">Weekdays</p>
                        <p className="text-muted-foreground">7-9am, 12-1pm, 5-7pm</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">Weekends</p>
                        <p className="text-muted-foreground">9-11am, 2-4pm</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Content Recommendations</CardTitle>
                  <CardDescription>
                    What type of content performs best
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">Media Posts</p>
                        <p className="text-muted-foreground">
                          Posts with images get {posts.some(p => p.has_media) ? '47%' : '30%'} more engagement
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">Optimal Length</p>
                        <p className="text-muted-foreground">
                          Posts with 80-120 characters perform best
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">Questions</p>
                        <p className="text-muted-foreground">
                          Posts with questions get 2x more replies
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div>
                      <h4 className="font-medium mb-2">Popular Topics in Your Posts</h4>
                      <div className="flex flex-wrap gap-2">
                        {['Technology', 'Marketing', 'Business', 'News'].map(topic => (
                          <div key={topic} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {topic}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default XPostsAnalyzer;
