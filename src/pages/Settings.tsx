
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link as LinkIcon, AlertCircle, Twitter, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Settings: React.FC = () => {
  const { user, linkXAccount } = useAuth();
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleConnectX = async () => {
    setIsLinking(true);
    setError(null);
    setDebugInfo(null);
    try {
      await linkXAccount();
    } catch (error) {
      console.error('Error linking X account:', error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      
      // Collect debug info
      try {
        const response = await fetch('/api/debug-x-connection', {
          method: 'POST',
        });
        if (response.ok) {
          const data = await response.json();
          setDebugInfo(JSON.stringify(data, null, 2));
        }
      } catch (debugError) {
        console.error('Error fetching debug info:', debugError);
      }
      
      toast({
        title: "X Integration Error",
        description: "There was an issue connecting your X account. Please check that all required API keys are configured.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Twitter className="mr-2 h-5 w-5 text-blue-500" />
            X Account Connection
          </CardTitle>
          <CardDescription>
            Connect your X account to enable posting and view your analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.xLinked ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <LinkIcon className="h-4 w-4 text-green-500" />
                <AlertTitle>Connected to X</AlertTitle>
                <AlertDescription>
                  Your account is connected to X as {user.xUsername}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                You can now post directly to X and view your analytics.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="default" className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>X Account Not Connected</AlertTitle>
                <AlertDescription>
                  Connect your X account to enable posting and analytics features
                </AlertDescription>
              </Alert>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection Error</AlertTitle>
                  <AlertDescription className="text-sm">
                    {error}
                    <p className="mt-2">
                      Please ensure that the X API keys are correctly configured in your application.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              
              {debugInfo && (
                <div className="p-3 bg-gray-100 rounded-md mt-2 mb-2">
                  <p className="text-sm font-semibold mb-1">Debug Information:</p>
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {debugInfo}
                  </pre>
                </div>
              )}
              
              <Button onClick={handleConnectX} disabled={isLinking} className="flex items-center">
                {isLinking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Twitter className="mr-2 h-4 w-4" />
                )}
                Connect X Account
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Note: You will be redirected to X to authorize this application.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
