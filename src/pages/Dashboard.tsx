import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { 
  Calendar, 
  PlusCircle, 
  MessageSquare, 
  LineChart, 
  Share2, 
  BookOpen, 
  Video,
  ClipboardList,
  Users,
  RefreshCw
} from 'lucide-react';
import { DemoData, DemoPost } from '@/lib/types';
import demoData from '@/lib/demoData';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const PostItem: React.FC<{ post: DemoPost }> = ({ post }) => {
  const scheduledDate = post.scheduled_for ? new Date(post.scheduled_for) : null;
  const formattedDate = scheduledDate ? scheduledDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : 'Now';

  return (
    <li className="py-4 border-b border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{post.content}</p>
          <p className="text-xs text-muted-foreground">
            {scheduledDate ? `Scheduled for: ${formattedDate}` : `Published on: ${formattedDate}`}
          </p>
        </div>
        {post.published ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle className="mr-1.5 h-3 w-3 text-green-500" aria-hidden="true" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            Scheduled
          </span>
        )}
      </div>
    </li>
  );
};

import { CheckCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isLoading, hasSubscription } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scheduledPosts, setScheduledPosts] = useState<DemoPost[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<DemoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/login', { state: { from: location } });
      } else if (user && !hasSubscription) {
        navigate('/subscription');
      } else {
        setLoading(false);
      }
    }
  }, [user, isLoading, navigate, location, hasSubscription]);

  useEffect(() => {
    if (user?.isDemoAccount) {
      setScheduledPosts(demoData.posts.scheduledPosts);
      setPublishedPosts(demoData.posts.publishedPosts);
    } else {
      // Fetch real data here in a real application
      // For now, just setting empty arrays
      setScheduledPosts([]);
      setPublishedPosts([]);
    }
  }, [user]);

  const refreshDashboard = async () => {
    setRefreshing(true);
    // Simulate refreshing data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <Breadcrumb
          segments={[
            { name: "Dashboard", href: "/dashboard" }
          ]}
          className="mb-6"
        />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Hello, {user?.name || 'User'}</h1>
            <p className="text-muted-foreground">
              {today}
            </p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Button 
              onClick={() => navigate('/create')}
              className="flex items-center gap-2"
            >
              <PlusCircle size={16} />
              Create Post
            </Button>
            <Button 
              variant="outline" 
              onClick={refreshDashboard}
              className="flex items-center gap-2"
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AnalyticsCard 
            title="Total Posts" 
            value={publishedPosts.length.toString()} 
            icon={MessageSquare} 
            description="Number of posts created"
          />
          <AnalyticsCard 
            title="Scheduled Posts" 
            value={scheduledPosts.length.toString()} 
            icon={Calendar} 
            description="Number of posts scheduled"
          />
          <AnalyticsCard 
            title="Engagement Rate" 
            value="3.2%" 
            icon={LineChart} 
            description="Average engagement rate"
          />
          <AnalyticsCard 
            title="Total Shares" 
            value="1,234" 
            icon={Share2} 
            description="Number of shares"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Scheduled Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledPosts.length > 0 ? (
                <ul className="space-y-2">
                  {scheduledPosts.map(post => (
                    <PostItem key={post.id} post={post} />
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No scheduled posts yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Published Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {publishedPosts.length > 0 ? (
                <ul className="space-y-2">
                  {publishedPosts.map(post => (
                    <PostItem key={post.id} post={post} />
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No published posts yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
