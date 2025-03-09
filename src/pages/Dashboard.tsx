
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Info, Check } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import XConnectButton from '@/components/XConnectButton';
import XDashboard from '@/components/XDashboard';

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isDemoAccount = user?.email === 'demo@postedpal.com';
  const xAuthSuccess = searchParams.get('x_auth_success') === 'true';
  const username = searchParams.get('username');
  const postStatus = searchParams.get('status');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 mt-16">
        {/* Welcome Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome, {user?.name || 'User'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isDemoAccount ? 'Demo Account' : 'Manage your social media presence'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <XConnectButton />
              <Button 
                variant="default" 
                onClick={() => navigate('/create')}
                className="flex items-center"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Post
              </Button>
            </div>
          </div>
          
          {/* Alert for X connection status */}
          {!user?.xLinked && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Connect your X account</AlertTitle>
              <AlertDescription>
                To post directly to X and see your analytics, connect your X account.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Success alert when X auth completed */}
          {xAuthSuccess && (
            <Alert className="mb-6" variant="success">
              <Check className="h-4 w-4" />
              <AlertTitle>X account connected</AlertTitle>
              <AlertDescription>
                Successfully connected to {username ? `@${username}` : 'your X account'}.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Success alert when post is published */}
          {postStatus === 'posted' && (
            <Alert className="mb-6" variant="success">
              <Check className="h-4 w-4" />
              <AlertTitle>Post published</AlertTitle>
              <AlertDescription>
                Your post has been successfully published to X.
              </AlertDescription>
            </Alert>
          )}
        </section>
        
        {/* X Dashboard Section */}
        <section className="mb-12">
          <XDashboard />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
