import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { 
  Calendar, 
  Clock, 
  Link as LinkIcon, 
  MessageSquare, 
  ArrowRight, 
  Check, 
  Loader2, 
  AlertCircle, 
  Twitter,
  Settings
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { demoData } from '@/lib/demoData';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  
  const { user, isLoading, linkXAccount, updateUserPreferences } = useAuth();
  const [isXLinking, setIsXLinking] = useState(false);
  const [isXPremium, setIsXPremium] = useState(false);
  const [useHashtags, setUseHashtags] = useState(true);

  const { data: postsData, isLoading: isPostsLoading, error: postsError } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return { scheduledPosts: [], publishedPosts: [] };
      
      if (user.isDemoAccount) {
        console.log('Using demo data for demo account');
        return {
          scheduledPosts: demoData.posts.scheduledPosts,
          publishedPosts: demoData.posts.publishedPosts,
        };
      }
      
      try {
        const { data: scheduledPosts, error: scheduledError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .eq('published', false)
          .not('scheduled_for', 'is', null);
        
        if (scheduledError) throw scheduledError;
        
        const { data: publishedPosts, error: publishedError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .eq('published', true);
        
        if (publishedError) throw publishedError;
        
        return {
          scheduledPosts: scheduledPosts || [],
          publishedPosts: publishedPosts || [],
        };
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Data loading error",
          description: "Dashboard data could not be loaded. Displaying default view.",
          variant: "destructive",
        });
        
        return {
          scheduledPosts: [],
          publishedPosts: [],
        };
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const xAuthSuccess = params.get('x_auth_success');
    const username = params.get('username');
    
    if (xAuthSuccess === 'true' && username && user) {
      try {
        const updatedUser = {
          ...user,
          xLinked: true,
          xUsername: `@${username}`,
        };
        
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        toast({
          title: "X Account Linked",
          description: `Successfully linked to @${username}`,
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error('Error handling X auth callback:', error);
      }
    }
  }, [location.search, user, toast]);

  useEffect(() => {
    if (user) {
      setIsXPremium(user.isXPremium || false);
      setUseHashtags(user.useHashtags !== false); // Default to true if not set
    }
  }, [user]);

  const scheduledPostsCount = postsData?.scheduledPosts?.length || 0;
  const publishedPostsCount = postsData?.publishedPosts?.length || 0;
  
  const calculateEngagement = () => {
    if (!postsData?.publishedPosts || postsData.publishedPosts.length === 0) return 0;
    return postsData.publishedPosts.length * (Math.floor(Math.random() * 20) + 10);
  };
  
  const totalEngagement = calculateEngagement();
  
  const calculateResponseTime = () => {
    if (!postsData?.publishedPosts || postsData.publishedPosts.length === 0) return "0h";
    return ((Math.random() * 3) + 1).toFixed(1) + "h";
  };
  
  const avgResponseTime = calculateResponseTime();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setIsPageLoading(false);
      
      if (!user) {
        navigate('/login');
      }
    }
  }, [user, isLoading, navigate]);

  const handleStartCreating = () => {
    navigate('/create');
  };

  const toggleDebugInfo = () => {
    setIsDebugVisible(!isDebugVisible);
  };

  const handleLinkXAccount = async () => {
    try {
      setIsXLinking(true);
      setIsPageLoading(true);
      await linkXAccount();
    } catch (error) {
      console.error('Error linking X account:', error);
      setIsPageLoading(false);
      setIsXLinking(false);
      toast({
        title: "X Integration Error",
        description: "There was an issue connecting your X account. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleSavePreferences = async () => {
    if (!updateUserPreferences) {
      toast({
        title: "Update Not Supported",
        description: "User preference updates are not supported in demo mode.",
        variant: "default",
      });
      return;
    }

    setIsSavingPreferences(true);
    try {
      await updateUserPreferences({
        isXPremium,
        useHashtags
      });
      
      toast({
        title: "Preferences Saved",
        description: "Your posting preferences have been updated.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error Saving Preferences",
        description: "There was an issue saving your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const renderErrorState = () => (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12 mt-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="mb-4">We encountered an error loading your dashboard.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );

  if (isPageLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="mb-4">Please log in to access your dashboard</p>
            <Button onClick={() => navigate('/login')}>
              Log In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (postsError) {
    console.error('Posts data error:', postsError);
    return renderErrorState();
  }

  const getScheduledPostsTrend = () => {
    return { value: 8, isPositive: true };
  };
  
  const getPublishedPostsTrend = () => {
    return { value: 12, isPositive: true };
  };
  
  const getEngagementTrend = () => {
    return { value: 5, isPositive: publishedPostsCount > 0 };
  };
  
  const getResponseTimeTrend = () => {
    return { value: 10, isPositive: true };
  };

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12 mt-16">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}</h1>
            <p className="text-muted-foreground">
              {user.xLinked 
                ? `Manage your content and post scheduling` 
                : `Manage your content and post scheduling`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleDebugInfo}
              className="text-xs"
            >
              {isDebugVisible ? "Hide Debug" : "Show Debug"}
            </Button>
          </div>
        </header>

        {isDebugVisible && (
          <Card className="mb-6 bg-slate-50 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-mono overflow-auto max-h-40">
                <p>User ID: {user.id}</p>
                <p>X Linked: {user.xLinked ? "Yes" : "No"}</p>
                <p>X Username: {user.xUsername || "None"}</p>
                <p>X Premium: {isXPremium ? "Yes" : "No"}</p>
                <p>Use Hashtags: {useHashtags ? "Yes" : "No"}</p>
                <p>Demo Account: {user.isDemoAccount ? "Yes" : "No"}</p>
                <p>Environment: {window.location.origin}</p>
                <p>Scheduled Posts: {scheduledPostsCount}</p>
                <p>Published Posts: {publishedPostsCount}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Scheduled Posts"
            value={scheduledPostsCount.toString()}
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            trend={getScheduledPostsTrend()}
          />
          <AnalyticsCard
            title="Posts Published"
            value={publishedPostsCount.toString()}
            icon={<Check className="h-4 w-4 text-muted-foreground" />}
            trend={getPublishedPostsTrend()}
          />
          <AnalyticsCard
            title="Total Engagement"
            value={totalEngagement.toString()}
            icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
            trend={getEngagementTrend()}
          />
          <AnalyticsCard
            title="Average Response Time"
            value={avgResponseTime}
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            trend={getResponseTimeTrend()}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4 p-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  {user.xLinked ? (
                    <Twitter className="h-8 w-8 text-blue-500" />
                  ) : (
                    <LinkIcon className="h-8 w-8 text-blue-500" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-center">
                  {user.xLinked && user.xUsername
                    ? `X Account: ${user.xUsername}`
                    : "Connect Your X Account"
                  }
                </h3>
                <p className="text-center text-muted-foreground mb-2">
                  {user.xLinked
                    ? "Your X account is connected"
                    : "Connect your X account to post directly"
                  }
                </p>
                {user.xLinked ? (
                  <Button 
                    onClick={handleStartCreating}
                    className="group"
                  >
                    Create New Post
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleLinkXAccount}
                    disabled={isXLinking}
                    className="group"
                  >
                    {isXLinking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Twitter className="mr-2 h-4 w-4" />
                        Link X Account
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Post Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="x-premium" className="font-medium">X Premium Account</Label>
                      <p className="text-sm text-muted-foreground">Enable to use longer character limits in posts</p>
                    </div>
                    <Switch 
                      id="x-premium" 
                      checked={isXPremium} 
                      onCheckedChange={setIsXPremium}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="use-hashtags" className="font-medium">Use Hashtags</Label>
                      <p className="text-sm text-muted-foreground">Include hashtags in generated posts</p>
                    </div>
                    <Switch 
                      id="use-hashtags" 
                      checked={useHashtags} 
                      onCheckedChange={setUseHashtags}
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    onClick={handleSavePreferences} 
                    className="w-full"
                    disabled={isSavingPreferences}
                  >
                    {isSavingPreferences ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>These preferences will be applied when generating new posts.</p>
                  {isXPremium ? (
                    <p className="mt-1">X Premium: Up to 4,000 characters per post</p>
                  ) : (
                    <p className="mt-1">Standard: Up to 280 characters per post</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Upcoming Scheduled Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {isPostsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : postsData && postsData.scheduledPosts.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {postsData.scheduledPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="border rounded-lg p-4 hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">Scheduled Post</div>
                          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Scheduled
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {post.content}
                        </p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{new Date(post.scheduled_for).toLocaleDateString()} at {new Date(post.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <button className="text-blue-500 hover:underline">Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {postsData.scheduledPosts.length > 3 && (
                    <div className="flex justify-center">
                      <Button variant="outline" className="text-sm">
                        View All Scheduled Posts
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No scheduled posts</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/create')}
                  >
                    Schedule Your First Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
