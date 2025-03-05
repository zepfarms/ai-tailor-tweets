import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { Calendar, Clock, Link as LinkIcon, MessageSquare, ArrowRight, Check } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/lib/types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);

  // Initialize user data
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          setIsLoading(false);
          navigate('/login');
          return;
        }
        
        if (!sessionData.session) {
          console.log('No active session found');
          setIsLoading(false);
          navigate('/login');
          return;
        }
        
        // Get user data from Supabase
        const userData = sessionData.session.user;
        
        if (!userData) {
          console.log('No user data found in session');
          setIsLoading(false);
          navigate('/login');
          return;
        }

        // Check for X account linking
        const { data: xAccount, error: xError } = await supabase
          .from('x_accounts')
          .select('*')
          .eq('user_id', userData.id)
          .maybeSingle();
          
        if (xError) {
          console.error('Error fetching X account:', xError);
        }
        
        const currentUser: User = {
          id: userData.id,
          email: userData.email || '',
          name: userData.user_metadata.name || '',
          xLinked: !!xAccount,
          xUsername: xAccount ? `@${xAccount.x_username}` : undefined
        };
        
        console.log('Setting user from session:', currentUser);
        setUser(currentUser);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        navigate('/login');
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed in Dashboard:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          navigate('/login');
          return;
        }
        
        if (session?.user) {
          const userData = session.user;
          
          // Check for X account linking
          const { data: xAccount, error: xError } = await supabase
            .from('x_accounts')
            .select('*')
            .eq('user_id', userData.id)
            .maybeSingle();
            
          if (xError) {
            console.error('Error fetching X account on auth change:', xError);
          }
          
          const currentUser: User = {
            id: userData.id,
            email: userData.email || '',
            name: userData.user_metadata.name || '',
            xLinked: !!xAccount,
            xUsername: xAccount ? `@${xAccount.x_username}` : undefined
          };
          
          console.log('Setting user from auth change:', currentUser);
          setUser(currentUser);
          setIsLoading(false);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleLinkAccount = async () => {
    setIsLinking(true);
    try {
      // Direct URL for X OAuth process to avoid using the broken context method
      const TWITTER_AUTH_URL = `${window.location.origin}/x-callback`;
      console.log('Starting X OAuth flow with redirect to:', TWITTER_AUTH_URL);
      
      // Store current user info for after OAuth flow
      if (user) {
        localStorage.setItem('auth_redirect_user', JSON.stringify(user));
      }
      
      // Call the Supabase Edge Function to get request token
      const { data, error } = await supabase.functions.invoke('twitter-request-token', {
        body: { redirect_uri: TWITTER_AUTH_URL },
      });
      
      if (error) throw error;
      
      if (data && data.auth_url) {
        console.log('Opening X authorization URL:', data.auth_url);
        
        // Open popup with error handling
        const popup = window.open(data.auth_url, 'xAuthWindow', 'width=600,height=800');
        
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          toast({
            title: "Popup Blocked",
            description: "Please allow popups for this site and try again",
            variant: "destructive",
          });
        } else {
          toast({
            title: "X Authorization Started",
            description: "Please complete the authorization in the popup window",
          });
          
          popup.focus();
        }
      } else {
        throw new Error('Failed to get X authorization URL');
      }
    } catch (error) {
      console.error('Error linking X account:', error);
      toast({
        title: "Failed to link X account",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleStartCreating = () => {
    navigate('/create');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12 mt-16">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">
            Manage your content and post scheduling
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Scheduled Posts"
            value="12"
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            trend={{ value: 16, isPositive: true }}
          />
          <AnalyticsCard
            title="Posts Published"
            value="48"
            icon={<Check className="h-4 w-4 text-muted-foreground" />}
            trend={{ value: 8, isPositive: true }}
          />
          <AnalyticsCard
            title="Total Engagement"
            value="1,493"
            icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
            trend={{ value: 3, isPositive: false }}
          />
          <AnalyticsCard
            title="Average Response Time"
            value="2.3h"
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            trend={{ value: 10, isPositive: true }}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              {user.xLinked ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">{user.xUsername || "@username"}</div>
                      <div className="text-sm text-muted-foreground">Account linked successfully</div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button onClick={handleStartCreating} className="group button-glow">
                      Start Creating
                      <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4 p-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <LinkIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium text-center">Link Your X Account</h3>
                  <p className="text-center text-muted-foreground">
                    Connect your X account to start creating and scheduling posts
                  </p>
                  <Button 
                    onClick={handleLinkAccount} 
                    className="group button-glow"
                    disabled={isLinking}
                  >
                    {isLinking ? "Linking..." : "Link X Account"}
                    <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.xLinked ? (
                  <>
                    <div className="border-l-2 border-blue-500 pl-4 py-1">
                      <p className="text-sm font-medium">Post scheduled for tomorrow at 9:00 AM</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                    <div className="border-l-2 border-green-500 pl-4 py-1">
                      <p className="text-sm font-medium">Post published successfully</p>
                      <p className="text-xs text-muted-foreground">Yesterday at 3:45 PM</p>
                    </div>
                    <div className="border-l-2 border-blue-500 pl-4 py-1">
                      <p className="text-sm font-medium">3 new post drafts created</p>
                      <p className="text-xs text-muted-foreground">Yesterday at 1:30 PM</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Link your X account to see your activity
                  </div>
                )}
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
              {user.xLinked ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border rounded-lg p-4 hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">Post #{i}</div>
                          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Scheduled
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {i === 1 && "Excited to share my thoughts on the latest tech developments in AI! Thread incoming..."}
                          {i === 2 && "Just finished testing that new productivity app - here's my honest review..."}
                          {i === 3 && "The future of content creation is here, and it's powered by AI. Here's why..."}
                        </p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Tomorrow at {i + 8}:00 AM</span>
                          <button className="text-blue-500 hover:underline">Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Button variant="outline" className="text-sm">
                      View All Scheduled Posts
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Link your X account to schedule posts
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
