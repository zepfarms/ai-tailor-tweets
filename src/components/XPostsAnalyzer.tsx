
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BarChart2, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import TopPerformingPosts from '@/components/TopPerformingPosts';
import { XPost, XAnalysis } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface XPostsAnalyzerProps {
  onGenerateFromPost: (content: string) => void;
}

const XPostsAnalyzer: React.FC<XPostsAnalyzerProps> = ({ onGenerateFromPost }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(true);
  const [posts, setPosts] = useState<XPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<XAnalysis | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('x_posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        // Cast the data to XPost[] type to ensure compatibility
        setPosts(data as XPost[] || []);
      } catch (err) {
        console.error('Error fetching X posts:', err);
        setError('Failed to load X posts. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAnalysis = async () => {
      setIsAnalysisLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('x_analyses')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.log('Error fetching analysis:', error);
          // Continue without analysis instead of throwing error
        } else if (data) {
          // Safely cast data to XAnalysis type
          setAnalysis(data as unknown as XAnalysis);
        }
      } catch (err) {
        console.error('Error fetching X analysis:', err);
        // Continue without analysis
      } finally {
        setIsAnalysisLoading(false);
      }
    };
    
    fetchPosts();
    fetchAnalysis();
  }, [user?.id]);

  // Helper function to render recommendations
  const renderRecommendations = () => {
    if (!analysis?.recommendations) return null;
    
    try {
      const recommendations = JSON.parse(analysis.recommendations);
      if (!Array.isArray(recommendations)) return null;
      
      return (
        <ul className="list-disc pl-5 space-y-2">
          {recommendations.map((recommendation, index) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ul>
      );
    } catch (e) {
      console.error('Error parsing recommendations:', e);
      return null;
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your X Posts Analytics</CardTitle>
        <CardDescription>
          Insights and analytics from your X posts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="posts">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Top Posts</TabsTrigger>
            <TabsTrigger value="analysis">Account Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : posts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No X posts available. Connect your X account and post some content to see analytics.
              </p>
            ) : (
              <TopPerformingPosts posts={posts} onSelectPost={onGenerateFromPost} />
            )}
          </TabsContent>
          
          <TabsContent value="analysis">
            {isAnalysisLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Account Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Engagement</p>
                      <p className="text-xl font-bold">{analysis.average_engagement.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Posting Frequency</p>
                      <p className="text-xl font-bold">{analysis.posting_frequency.toFixed(1)} posts/day</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Last analyzed: {formatTimestamp(analysis.last_analyzed)}
                  </div>
                </div>
                
                {analysis.top_tweet_text && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Top Performing Tweet</h3>
                    <blockquote className="border-l-4 pl-4 italic">
                      {analysis.top_tweet_text}
                    </blockquote>
                  </div>
                )}
                
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Growth Recommendations</h3>
                  {renderRecommendations()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No analysis available yet. Click the button below to analyze your X account.
                </p>
                <Button disabled={true} className="flex items-center">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Analyze Account
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Please use the Analyze X Account button on the dashboard.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default XPostsAnalyzer;
