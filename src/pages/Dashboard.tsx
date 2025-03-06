
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import XAnalytics from '@/components/XAnalytics';
import { Calendar, Clock, Link as LinkIcon, MessageSquare, ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  
  const { user, isLoading } = useAuth();

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

  if (isPageLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

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
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}</h1>
            <p className="text-muted-foreground">
              Manage your content and post scheduling
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex border rounded-lg overflow-hidden">
              <Button 
                variant={activeTab === 'overview' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('overview')}
                className="rounded-none"
              >
                Overview
              </Button>
              <Button 
                variant={activeTab === 'analytics' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('analytics')}
                className="rounded-none"
              >
                X Analytics
              </Button>
            </div>
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
                <p>Environment: {window.location.origin}</p>
                <p>Active Tab: {activeTab}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'analytics' ? (
          <XAnalytics className="mb-8" />
        ) : (
          <>
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
                  <div className="flex flex-col items-center space-y-4 p-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <LinkIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium text-center">
                      {user.xLinked 
                        ? `X Account: ${user.xUsername}`
                        : "X Analytics Available"
                      }
                    </h3>
                    <p className="text-center text-muted-foreground mb-2">
                      {user.xLinked 
                        ? "Your X account is connected"
                        : "Access X analytics by entering any username"
                      }
                    </p>
                    <Button 
                      onClick={() => setActiveTab('analytics')} 
                      className="group"
                    >
                      View X Analytics
                      <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card overflow-hidden">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
