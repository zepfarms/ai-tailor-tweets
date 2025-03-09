
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ChartBar, MessageSquare, RefreshCw, Repeat, Heart, Image, Video, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import XConnectButton from './XConnectButton';
import { Link } from 'react-router-dom';

interface Post {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  replies_count: number;
  retweets_count: number;
  impressions_count: number;
  engagement_rate: number;
  has_media: boolean;
  media_urls?: string[];
}

const XDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    if (user?.xLinked) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch posts from the database
      const { data, error } = await supabase
        .from('x_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load your X posts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    if (!user?.id || !user?.xLinked) return;
    
    setIsRefreshing(true);
    try {
      // Call the Twitter analytics function to refresh data
      const { error } = await supabase.functions.invoke('twitter-analytics', {
        body: { userId: user.id }
      });
      
      if (error) throw error;
      
      toast({
        title: "Data Refreshed",
        description: "Your X analytics data has been updated",
      });
      
      fetchPosts();
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh your X data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!user?.xLinked) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect your X account to see your posts and analytics
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <XConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Your X Dashboard</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Link to="/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="recent" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="recent">Recent Posts</TabsTrigger>
          <TabsTrigger value="popular">Most Popular</TabsTrigger>
          <TabsTrigger value="templates">Post Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map(post => (
                <Card key={post.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="mb-2 text-sm text-muted-foreground">
                      {formatDate(post.created_at)}
                    </div>
                    <p className="text-sm mb-4 line-clamp-3">{post.content}</p>
                    
                    {post.has_media && post.media_urls && post.media_urls.length > 0 && (
                      <div className="mb-4 relative aspect-video bg-muted rounded-md overflow-hidden">
                        {post.media_urls[0].includes('video') ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ) : (
                          <img 
                            src={post.media_urls[0]} 
                            alt="Post media" 
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ChartBar className="h-4 w-4" />
                        <span>{post.impressions_count.toLocaleString()} views</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.replies_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Repeat className="h-4 w-4" />
                          <span>{post.retweets_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes_count}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No posts found. Create your first post or refresh your data.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...posts]
                .sort((a, b) => b.impressions_count - a.impressions_count)
                .slice(0, 6)
                .map(post => (
                  <Card key={post.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-lg flex items-center">
                        <ChartBar className="h-5 w-5 mr-2 text-green-500" />
                        {post.impressions_count.toLocaleString()} views
                      </CardTitle>
                      <CardDescription>
                        Engagement rate: {post.engagement_rate}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="mb-2 text-sm text-muted-foreground">
                        {formatDate(post.created_at)}
                      </div>
                      <p className="text-sm mb-4 line-clamp-3">{post.content}</p>
                      
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.replies_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Repeat className="h-4 w-4" />
                            <span>{post.retweets_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            <span>{post.likes_count}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No popular posts found. Create more posts to see which ones perform best.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Template 1: Thread Starter */}
            <Card>
              <CardHeader>
                <CardTitle>Thread Starter</CardTitle>
                <CardDescription>Start a compelling thread to boost engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">🧵 [TOPIC] THREAD: I'm going to share [X] tips about [TOPIC] that will help you [BENEFIT].</p>
                <p className="text-sm mb-4">Let's dive in! 👇</p>
                <Button variant="outline" size="sm" className="w-full" 
                  onClick={() => {
                    navigate('/create', { 
                      state: { 
                        template: `🧵 [TOPIC] THREAD: I'm going to share [X] tips about [TOPIC] that will help you [BENEFIT].\n\nLet's dive in! 👇` 
                      } 
                    });
                  }}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>

            {/* Template 2: Question Post */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Question</CardTitle>
                <CardDescription>Ask a question to drive replies and discussion</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">Question for my network:</p>
                <p className="text-sm mb-4">What's one [TOPIC] tool/technique you couldn't live without?</p>
                <p className="text-sm mb-4">I'll start: [YOUR ANSWER]</p>
                <p className="text-sm mb-4">Your turn! 👇</p>
                <Button variant="outline" size="sm" className="w-full"
                  onClick={() => {
                    navigate('/create', { 
                      state: { 
                        template: `Question for my network:\n\nWhat's one [TOPIC] tool/technique you couldn't live without?\n\nI'll start: [YOUR ANSWER]\n\nYour turn! 👇` 
                      } 
                    });
                  }}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>

            {/* Template 3: Insight Post */}
            <Card>
              <CardHeader>
                <CardTitle>Value-Add Insight</CardTitle>
                <CardDescription>Share valuable insights to position yourself as an expert</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">I just discovered something interesting about [TOPIC]:</p>
                <p className="text-sm mb-4">[INSIGHT]</p>
                <p className="text-sm mb-4">This matters because [WHY IT MATTERS]</p>
                <p className="text-sm mb-4">Save this for later! 🔖</p>
                <Button variant="outline" size="sm" className="w-full"
                  onClick={() => {
                    navigate('/create', { 
                      state: { 
                        template: `I just discovered something interesting about [TOPIC]:\n\n[INSIGHT]\n\nThis matters because [WHY IT MATTERS]\n\nSave this for later! 🔖` 
                      } 
                    });
                  }}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>

            {/* Template 4: Stat Post */}
            <Card>
              <CardHeader>
                <CardTitle>Stat-Based Post</CardTitle>
                <CardDescription>Use statistics to add credibility to your content</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">Did you know?</p>
                <p className="text-sm mb-4">[X]% of [GROUP] struggle with [PROBLEM].</p>
                <p className="text-sm mb-4">Here's a simple way to solve it:</p>
                <p className="text-sm mb-4">[SOLUTION IN 1-2 SENTENCES]</p>
                <Button variant="outline" size="sm" className="w-full"
                  onClick={() => {
                    navigate('/create', { 
                      state: { 
                        template: `Did you know?\n\n[X]% of [GROUP] struggle with [PROBLEM].\n\nHere's a simple way to solve it:\n\n[SOLUTION IN 1-2 SENTENCES]` 
                      } 
                    });
                  }}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default XDashboard;
