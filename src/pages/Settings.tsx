
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Twitter, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Settings: React.FC = () => {
  const { user, linkXAccount, isLinkingX } = useAuth();
  const { toast } = useToast();

  const handleLinkX = async () => {
    try {
      // Get the current hostname and protocol for the redirect
      const redirectUri = window.location.origin + '/x-callback';
      await linkXAccount(redirectUri);
    } catch (error) {
      console.error('Error linking X account:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to link X account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <div className="border-b pb-4 mb-4">
          <p className="text-sm text-muted-foreground mb-2">Email</p>
          <p className="font-medium">{user?.email}</p>
        </div>
        <div className="border-b pb-4 mb-4">
          <p className="text-sm text-muted-foreground mb-2">Name</p>
          <p className="font-medium">{user?.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div className="flex items-center gap-3">
            <Twitter className="h-6 w-6 text-[#1DA1F2]" />
            <div>
              <p className="font-medium">X (Twitter)</p>
              {user?.xLinked ? (
                <p className="text-sm text-green-600">Connected as {user.xUsername}</p>
              ) : (
                <p className="text-sm text-amber-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Not connected
                </p>
              )}
            </div>
          </div>
          {user?.xLinked ? (
            <Button variant="outline" disabled className="text-green-600 border-green-600">
              Connected
            </Button>
          ) : (
            <Button 
              onClick={handleLinkX} 
              disabled={isLinkingX}
              className="bg-[#1DA1F2] hover:bg-[#1a94da] text-white"
            >
              {isLinkingX ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>Connect</>
              )}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Connecting your X account allows you to post directly from PostedPal.
        </p>
      </div>
    </div>
  );
};

export default Settings;
