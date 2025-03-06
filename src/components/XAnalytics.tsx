
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Loader2, Users, MessageSquare, TrendingUp, Eye, Twitter } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import AnalyticsCard from '@/components/AnalyticsCard';

interface XAnalyticsProps {
  className?: string;
}

interface AnalyticsData {
  followerCount: number;
  followingCount: number;
  tweetsCount: number;
  impressions: number;
  profileVisits: number;
  mentionsCount: number;
  tweetEngagementRate: string;
  topTweet: {
    text: string;
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
  };
  engagementTrend: Array<{ date: string; value: number }>;
  followersTrend: Array<{ date: string; value: number }>;
}

const XAnalytics: React.FC<XAnalyticsProps> = ({ className }) => {
  const [loading, setLoading] = React.useState(true);
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(null);
  const [username, setUsername] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id || !user.xLinked) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

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
        setUsername(data.username);
        
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

    fetchAnalytics();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading X analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-2">Error loading analytics: {error}</p>
        <p className="text-sm text-muted-foreground">Please try again later</p>
      </div>
    );
  }

  if (!user?.xLinked) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>X Analytics</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Twitter className="h-12 w-12 mx-auto text-blue-500 mb-4" />
          <p className="text-lg font-medium mb-2">Link your X account to see analytics</p>
          <p className="text-sm text-muted-foreground">
            Connect your X account to view engagement metrics and follower growth
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>X Analytics</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-lg font-medium">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">X Analytics for {username || user.xUsername}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Followers"
          value={analytics.followerCount.toLocaleString()}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 8, isPositive: true }}
        />
        <AnalyticsCard
          title="Tweets"
          value={analytics.tweetsCount.toLocaleString()}
          icon={<Twitter className="h-4 w-4 text-muted-foreground" />}
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
          value={analytics.tweetEngagementRate}
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
          <CardTitle>Top Tweet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4">
            <p className="text-base mb-4">{analytics.topTweet.text}</p>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <p className="font-bold">{analytics.topTweet.impressions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Impressions</p>
              </div>
              <div>
                <p className="font-bold">{analytics.topTweet.likes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Likes</p>
              </div>
              <div>
                <p className="font-bold">{analytics.topTweet.retweets.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Retweets</p>
              </div>
              <div>
                <p className="font-bold">{analytics.topTweet.replies.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Replies</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default XAnalytics;
