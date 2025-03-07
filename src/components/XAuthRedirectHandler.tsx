
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const XAuthRedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're returning from Twitter OAuth
    const isPending = sessionStorage.getItem('twitter_oauth_pending');
    
    if (isPending === 'true') {
      // Clear the pending flag
      sessionStorage.removeItem('twitter_oauth_pending');
      
      // Get the stored return URL or default to dashboard
      const returnUrl = sessionStorage.getItem('twitter_oauth_return_url') || '/dashboard';
      sessionStorage.removeItem('twitter_oauth_return_url');
      
      // Show success notification
      toast({
        title: "X Account Connected",
        description: "Your X account has been successfully linked.",
      });
      
      // Navigate back to the dashboard
      navigate(returnUrl);
    }
  }, [navigate, toast]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p>Completing X authentication...</p>
    </div>
  );
};

export default XAuthRedirectHandler;
