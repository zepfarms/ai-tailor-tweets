
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { Calendar, Clock, Link as LinkIcon, MessageSquare, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [linkingError, setLinkingError] = useState<string | null>(null);
  const [linkButtonClicked, setLinkButtonClicked] = useState(false);
  
  // Get auth context
  const { user, isLoading, isLinkingX, linkXAccount } = useAuth();

  useEffect(() => {
    // Set a timeout to ensure we don't show loading state forever in case of errors
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

  // Verify if X account is linked when component mounts
  useEffect(() => {
    const verifyXAccount = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('x_accounts')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (data && !error) {
            console.log("X account verification:", data);
          }
        } catch (err) {
          console.error("Error verifying X account:", err);
        }
      }
    };
    
    verifyXAccount();
  }, [user?.id]);

  // Check for X auth success parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('x_auth_success') === 'true') {
      const username = params.get('username');
      if (username) {
        toast({
          title: "X Account Linked",
          description: `Successfully linked to @${username}`,
        });
        
        // Clean URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [toast]);

  const handleLinkAccount = async () => {
    if (linkButtonClicked || isLinkingX) return; // Prevent multiple clicks
    
    try {
      setLinkButtonClicked(true);
      setLinkingError(null);
      
      console.log("Initiating X account linking from Dashboard");
      await linkXAccount();
      
      // Set a timeout to reset the button state in case the redirect doesn't happen
      setTimeout(() => {
        setLinkButtonClicked(false);
      }, 5000);
    } catch (error) {
      console.error('Error linking account:', error);
      setLinkButtonClicked(false);
      setLinkingError(error instanceof Error ? error.message : 'Failed to link account');
      
      toast({
        title: "Failed to link X account",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleStartCreating = () => {
    navigate('/create');
  };

  // Show loading state
  if (isPageLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please log in to access your dashboard</p>
          <Button onClick={() => navigate('/login')}>
            Log In
          </Button>
        </div>
      </div>
    );
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
        
        {/* Analytics Cards */}
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
        
        {/* Account Status and Recent Activity */}
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
                  {linkingError && (
                    <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md w-full">
                      {linkingError}
                    </div>
                  )}
                  <Button 
                    onClick={handleLinkAccount} 
                    className="group button-glow"
                    disabled={isLinkingX || linkButtonClicked}
                  >
                    {isLinkingX || linkButtonClicked ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        Link X Account
                        <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
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
        
        {/* Upcoming Scheduled Posts */}
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
