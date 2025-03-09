
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { XPost } from '@/lib/types';
import TopPerformingPosts from '@/components/TopPerformingPosts';
import { RefreshCw, Lightbulb, Download, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface XPostsAnalyzerProps {
  onGenerateFromPost: (content: string) => void;
}

const XPostsAnalyzer: React.FC<XPostsAnalyzerProps> = ({ onGenerateFromPost }) => {
  const [posts, setPosts] = useState<XPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('engagement');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<XPost[]>([]);
  const [errorLog, setErrorLog] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchXPosts();
    }
  }, [user?.id]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post => 
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  }, [searchTerm, posts]);

  const fetchXPosts = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching X posts for user:", user?.id);
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
        setFilteredPosts(formattedPosts);
        console.log(`Fetched ${formattedPosts.length} X posts`);
      } else {
        console.log("No posts data returned from Supabase");
      }
    } catch (error) {
      console.error('Error fetching X posts:', error);
      addErrorLog(`Error fetching X posts: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error",
        description: "Failed to load X post analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const importXPosts = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to import X posts",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    addErrorLog(`Starting X posts import for user: ${user.id}`);
    
    try {
      const response = await supabase.functions.invoke('import-x-posts', {
        body: { userId: user.id }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to import X posts');
      }

      console.log("Import response:", response);
      addErrorLog(`Import response: ${JSON.stringify(response.data)}`);
      
      if (response.data?.success) {
        toast({
          title: "Success",
          description: response.data.message || `Imported ${response.data.inserted || 0} X posts`,
        });
        fetchXPosts(); // Refresh the posts list
      } else {
        throw new Error(response.data?.error || 'Unknown error during import');
      }
    } catch (error) {
      console.error('Error importing X posts:', error);
      addErrorLog(`Error importing X posts: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to import X posts',
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectTopPost = (content: string) => {
    onGenerateFromPost(content);
  };

  // Add to error log
  const addErrorLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setErrorLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Download error logs
  const downloadErrorLogs = () => {
    const logText = errorLog.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'x-posts-error-log.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format data for engagement chart
  const getEngagementData = () => {
    return filteredPosts.slice(0, 15).map(post => ({
      date: new Date(post.created_at).toLocaleDateString(),
      engagement: Number((post.engagement_rate * 100).toFixed(2)),
      likes: post.likes_count,
      retweets: post.retweets_count,
      replies: post.replies_count,
    })).reverse();
  };

  // Format data for impressions chart
  const getImpressionsData = () => {
    return filteredPosts.slice(0, 15).map(post => ({
      date: new Date(post.created_at).toLocaleDateString(),
      impressions: post.impressions_count,
    })).reverse();
  };

  // Check if we have enough data to show analysis
  const hasEnoughData = filteredPosts.length >= 3;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">X Analytics</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={importXPosts} 
              disabled={isImporting}
            >
              {isImporting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Import X Posts
            </Button>
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
        </div>

        {/* Search Posts */}
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearchTerm('')}
              className="h-8 px-2"
            >
              Clear
            </Button>
          )}
          {searchTerm && (
            <span className="text-sm text-muted-foreground">
              {filteredPosts.length} results
            </span>
          )}
        </div>
      </div>

      {posts.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="mb-4">No X posts found. Import your posts from X to see analytics.</p>
          <Button onClick={importXPosts} disabled={isImporting}>
            {isImporting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Import X Posts
          </Button>
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
                Your posts with media get {Math.round(filteredPosts.filter(p => p.has_media).reduce((acc, p) => acc + p.engagement_rate, 0) / Math.max(filteredPosts.filter(p => p.has_media).length, 1) * 100)}% 
                more engagement than posts without media. Try including images or videos in your next post!
              </p>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Top Performing Posts</h3>
            {/* Pass the posts as prop to TopPerformingPosts */}
            <TopPerformingPosts posts={filteredPosts} onSelectPost={handleSelectTopPost} />
          </div>

          {/* Error Log Section */}
          {errorLog.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Error Logs</h3>
                <Button variant="outline" size="sm" onClick={downloadErrorLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Logs
                </Button>
              </div>
              <Card className="p-4">
                <div className="bg-black/5 dark:bg-white/5 rounded-md p-4 max-h-60 overflow-y-auto font-mono text-xs">
                  {errorLog.map((log, i) => (
                    <div key={i} className="mb-1 whitespace-pre-wrap">{log}</div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default XPostsAnalyzer;
