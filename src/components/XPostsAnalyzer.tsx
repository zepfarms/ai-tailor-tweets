
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { XPost } from '@/lib/types';
import TopPerformingPosts from '@/components/TopPerformingPosts';
import { RefreshCw, Lightbulb } from 'lucide-react';

interface XPostsAnalyzerProps {
  onGenerateFromPost: (content: string) => void;
}

const XPostsAnalyzer: React.FC<XPostsAnalyzerProps> = ({ onGenerateFromPost }) => {
  const [posts, setPosts] = useState<XPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('engagement');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchXPosts();
    }
  }, [user?.id]);

  const fetchXPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('x_posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      if (data) {
        // Convert id to string if it's a number
        const formattedPosts = data.map(post => ({
          ...post,
          id: String(post.id)
        })) as unknown as XPost[];
        
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Error fetching X posts:', error);
      toast({
        title: "Error",
        description: "Failed to load X post analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTopPost = (content: string) => {
    onGenerateFromPost(content);
  };

  // Format data for engagement chart
  const getEngagementData = () => {
    return posts.slice(0, 15).map(post => ({
      date: new Date(post.created_at).toLocaleDateString(),
      engagement: Number((post.engagement_rate * 100).toFixed(2)),
      likes: post.likes_count,
      retweets: post.retweets_count,
      replies: post.replies_count,
    })).reverse();
  };

  // Format data for impressions chart
  const getImpressionsData = () => {
    return posts.slice(0, 15).map(post => ({
      date: new Date(post.created_at).toLocaleDateString(),
      impressions: post.impressions_count,
    })).reverse();
  };

  // Check if we have enough data to show analysis
  const hasEnoughData = posts.length >= 3;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">X Analytics</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchXPosts} 
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="mb-4">No X posts found. Import your posts from X to see analytics.</p>
          <Button onClick={() => {}}>Import X Posts</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <Tabs defaultValue="engagement" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="impressions">Impressions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="engagement" className="pt-4">
              <div className="bg-card rounded-md p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    width={500}
                    height={300}
                    data={getEngagementData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="likes" fill="#8884d8" name="Likes" />
                    <Bar dataKey="retweets" fill="#82ca9d" name="Retweets" />
                    <Bar dataKey="replies" fill="#ffc658" name="Replies" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="impressions" className="pt-4">
              <div className="bg-card rounded-md p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    width={500}
                    height={300}
                    data={getImpressionsData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="impressions" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
          
          {hasEnoughData && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-blue-700 dark:text-blue-300">Insights</h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your posts with media get {Math.round(posts.filter(p => p.has_media).reduce((acc, p) => acc + p.engagement_rate, 0) / posts.filter(p => p.has_media).length * 100)}% 
                more engagement than posts without media. Try including images or videos in your next post!
              </p>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Top Performing Posts</h3>
            {/* Pass the posts as prop to TopPerformingPosts */}
            <TopPerformingPosts posts={posts} onSelectPost={handleSelectTopPost} />
          </div>
        </div>
      )}
    </div>
  );
};

export default XPostsAnalyzer;
