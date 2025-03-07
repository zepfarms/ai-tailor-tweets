
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Loader2, Users, MessageSquare, TrendingUp, Eye, ImageIcon, Video, Calendar, Heart, Share2, MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import AnalyticsCard from '@/components/AnalyticsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface XAnalyticsProps {
  className?: string;
}

interface TopPost {
  id: string;
  text: string;
  likes: number;
  shares: number;
  comments: number;
  impressions: number;
  engagementRate: string;
  date: string;
  isImage: boolean;
  isVideo: boolean;
}

interface AnalyticsData {
  username?: string;
  followerCount: number;
  followingCount: number;
  postsCount: number;
  impressions: number;
  profileVisits: number;
  mentionsCount: number;
  engagementRate: string;
  topPosts: TopPost[];
  engagementTrend: Array<{ date: string; value: number }>;
  followersTrend: Array<{ date: string; value: number }>;
}

const XAnalytics: React.FC<XAnalyticsProps> = ({ className }) => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [username, setUsername] = useState<string>('');
  const [displayedUsername, setDisplayedUsername] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    // If the user has a linked X account, fetch analytics for it
    const fetchUserLinkedAnalytics = async () => {
      if (user?.id && user.xLinked && user.xUsername) {
        try {
          setLoading(true);
          setError(null);
          
          // Extract username from the format @username
          const cleanUsername = user.xUsername.startsWith('@') 
            ? user.xUsername.substring(1) 
            : user.xUsername;
            
          setUsername(cleanUsername);
          
          const { data, error: functionError } = await supabase.functions.invoke('twitter-analytics', {
            body: { userId: user.id }
          });

          if (functionError) {
            console.error('Error fetching X analytics:', functionError);
            throw new Error('Failed to fetch analytics');
          }

          if (!data || data.error) {
            throw new Error(data?.error || 'Failed to fetch analytics');
          }

          setAnalytics(data.data);
          setDisplayedUsername(data.username);
          
        } catch (err) {
          console.error('Analytics error:', err);
          setError(err instanceof Error ? err.message : 'Failed to load analytics');
          
          toast({
            title: 'Failed to load analytics',
            description: err instanceof Error ? err.message : 'Please try again later',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserLinkedAnalytics();
  }, [user, toast]);

  const fetchAnalytics = async (xUsername: string) => {
    if (!xUsername) {
      toast({
        title: 'Username required',
        description: 'Please enter an X username to fetch analytics',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Clean the username (remove @ if present)
      const cleanUsername = xUsername.startsWith('@') ? xUsername.substring(1) : xUsername;
      
      const { data, error: functionError } = await supabase.functions.invoke('twitter-analytics', {
        body: { username: cleanUsername }
      });

      if (functionError) {
        console.error('Error fetching X analytics:', functionError);
        throw new Error('Failed to fetch analytics');
      }

      if (!data || data.error) {
        throw new Error(data?.error || 'Failed to fetch analytics');
      }

      setAnalytics(data.data);
      setDisplayedUsername(data.username);
      
      toast({
        title: 'Analytics loaded',
        description: `Displaying analytics for @${data.username}`,
      });
      
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      
      toast({
        title: 'Failed to load analytics',
        description: err instanceof Error ? err.message : 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics(usernameInput);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading X analytics...</p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-2">Error loading analytics: {error}</p>
        <p className="text-sm text-muted-foreground mb-4">Please try again later</p>
        
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Enter X Username</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter X username (e.g., elonmusk)"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                />
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Get Analytics
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>X Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Enter an X username to view their public analytics
            </p>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter X username (e.g., elonmusk)"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Get Analytics
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">X Analytics for @{displayedUsername || username}</h2>
        
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            placeholder="Enter X username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="w-48 md:w-64"
          />
          <Button type="submit" variant="outline" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Load
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Followers"
          value={analytics.followerCount.toLocaleString()}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 8, isPositive: true }}
        />
        <AnalyticsCard
          title="Posts"
          value={analytics.postsCount.toLocaleString()}
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 12, isPositive: true }}
        />
        <AnalyticsCard
          title="Impressions"
          value={analytics.impressions.toLocaleString()}
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 15, isPositive: true }}
        />
        <AnalyticsCard
          title="Engagement Rate"
          value={analytics.engagementRate}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 4, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Follower Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics.followersTrend}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Engagement Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.engagementTrend}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {analytics.topPosts.map((post, index) => (
              <div key={post.id} className="border rounded-lg p-4 transition-all hover:border-blue-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}>
                      #{index + 1}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{formatDate(post.date)}</span>
                    <div className="flex space-x-1">
                      {post.isImage && <ImageIcon size={16} className="text-blue-500" />}
                      {post.isVideo && <Video size={16} className="text-red-500" />}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50">
                    {post.engagementRate} Engagement
                  </Badge>
                </div>
                
                <p className="text-base mb-4">{post.text}</p>
                
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center mb-1">
                      <Eye size={14} className="mr-1 text-gray-500" />
                      <span className="font-medium">{post.impressions.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Impressions</p>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center mb-1">
                      <Heart size={14} className="mr-1 text-red-500" />
                      <span className="font-medium">{post.likes.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center mb-1">
                      <Share2 size={14} className="mr-1 text-green-500" />
                      <span className="font-medium">{post.shares.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Shares</p>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center mb-1">
                      <MessageCircle size={14} className="mr-1 text-blue-500" />
                      <span className="font-medium">{post.comments.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default XAnalytics;
