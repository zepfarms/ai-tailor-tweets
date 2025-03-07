
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link as LinkIcon, AlertCircle, Twitter, Loader2, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const Settings: React.FC = () => {
  const { user, linkXAccount } = useAuth();
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);

  const handleConnectX = async () => {
    setIsLinking(true);
    setError(null);
    setDetailedError(null);
    try {
      await linkXAccount();
    } catch (error) {
      console.error('Error linking X account:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      
      // Add more detail to common error messages
      if (errorMessage.includes("hostname could not be found")) {
        setDetailedError("The Twitter API servers could not be reached. This could be due to network connectivity issues or DNS problems.");
      } else if (errorMessage.includes("Failed to initialize X authentication")) {
        setDetailedError("The X authentication service returned an error. This may be due to incorrect API credentials or configuration.");
      }
      
      // Collect debug info
      fetchDebugInfo();
      
      toast({
        title: "X Integration Error",
        description: "There was an issue connecting your X account. Please see the error details below.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const fetchDebugInfo = async () => {
    setIsLoadingDebug(true);
    try {
      const response = await supabase.functions.invoke('debug-x-connection');
      if (response.error) {
        throw new Error(`Debug function error: ${response.error.message}`);
      }
      setDebugInfo(response.data);
    } catch (debugError) {
      console.error('Error fetching debug info:', debugError);
      setDetailedError((prev) => 
        `${prev || ''}\n\nCould not retrieve debug information: ${debugError instanceof Error ? debugError.message : "Unknown error"}`
      );
    } finally {
      setIsLoadingDebug(false);
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
                    {detailedError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="font-semibold">Troubleshooting Information:</p>
                        <p className="whitespace-pre-wrap">{detailedError}</p>
                      </div>
                    )}
                    <p className="mt-2">
                      Please ensure that the X API keys are correctly configured in your application.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              
              {debugInfo && (
                <div className="p-4 bg-gray-100 rounded-md mt-2 mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold">Debug Information:</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchDebugInfo} 
                      disabled={isLoadingDebug}
                      className="h-8"
                    >
                      {isLoadingDebug ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <RefreshCcw className="h-4 w-4 mr-1" />
                      )}
                      Refresh
                    </Button>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                    <h4 className="font-semibold mb-1">Environment Variables:</h4>
                    <ul className="list-disc list-inside mb-2">
                      <li>Twitter Client ID: {debugInfo.environmentInfo.twitterClientIdSet ? 'Set' : 'Not set'}</li>
                      <li>Twitter Client Secret: {debugInfo.environmentInfo.twitterClientSecretSet ? 'Set' : 'Not set'}</li>
                      <li>Twitter Callback URL: {debugInfo.environmentInfo.twitterCallbackUrlSet ? debugInfo.environmentInfo.twitterCallbackUrl : 'Not set'}</li>
                      <li>Supabase URL: {debugInfo.environmentInfo.supabaseUrlSet ? debugInfo.environmentInfo.supabaseUrl : 'Not set'}</li>
                      <li>Supabase Service Role Key: {debugInfo.environmentInfo.supabaseServiceRoleKeySet ? 'Set' : 'Not set'}</li>
                    </ul>
                    
                    <h4 className="font-semibold mb-1">Twitter API Status:</h4>
                    {typeof debugInfo.twitterApiStatus === 'object' ? (
                      <ul className="list-disc list-inside mb-2">
                        <li>OpenAPI Endpoint: {debugInfo.twitterApiStatus.openapi}</li>
                        <li>Auth Endpoint: {debugInfo.twitterApiStatus.authEndpoint}</li>
                        <li>API Endpoint: {debugInfo.twitterApiStatus.apiEndpoint}</li>
                      </ul>
                    ) : (
                      <p>{debugInfo.twitterApiStatus}</p>
                    )}
                    
                    {debugInfo.dnsStatus && (
                      <>
                        <h4 className="font-semibold mb-1">DNS Resolution:</h4>
                        <ul className="list-disc list-inside">
                          <li>twitter.com: {debugInfo.dnsStatus.twitter}</li>
                          <li>api.twitter.com: {debugInfo.dnsStatus.api}</li>
                        </ul>
                      </>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">Last checked: {new Date(debugInfo.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col space-y-3">
                <Button onClick={handleConnectX} disabled={isLinking} className="flex items-center">
                  {isLinking ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Twitter className="mr-2 h-4 w-4" />
                  )}
                  Connect X Account
                </Button>
                
                {!debugInfo && (
                  <Button 
                    variant="outline" 
                    onClick={fetchDebugInfo} 
                    disabled={isLoadingDebug}
                    className="flex items-center"
                  >
                    {isLoadingDebug ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="mr-2 h-4 w-4" />
                    )}
                    Run Connection Diagnostics
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <p>Note: You will be redirected to X to authorize this application.</p>
                <p>Required configuration:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>TWITTER_CLIENT_ID: Your X app's client ID</li>
                  <li>TWITTER_CLIENT_SECRET: Your X app's client secret</li>
                  <li>TWITTER_CALLBACK_URL: Should be set to https://postedpal.com/x-callback</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
