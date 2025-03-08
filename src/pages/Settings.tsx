import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import XConnectButton from '@/components/XConnectButton';
import { supabase } from '@/integrations/supabase/client';

const Settings: React.FC = () => {
  const { user, logout, updateUserPreferences } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [useHashtags, setUseHashtags] = useState(user?.useHashtags !== false);
  const [isLoading, setIsLoading] = useState(false);
  const [xDiagnosticInfo, setXDiagnosticInfo] = useState<any>(null);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setUseHashtags(user.useHashtags !== false);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpdatePreferences = async () => {
    setIsLoading(true);
    try {
      if (updateUserPreferences) {
        await updateUserPreferences({ name, useHashtags });
        toast({
          title: "Preferences updated",
          description: "Your preferences have been successfully updated.",
        });
      }
    } catch (error) {
      console.error("Update preferences failed:", error);
      toast({
        title: "Update failed",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runXDiagnostic = async () => {
    setIsLoadingDiagnostic(true);
    try {
      const { data, error } = await supabase.functions.invoke('debug-x-connection');
      
      if (error) {
        throw error;
      }
      
      setXDiagnosticInfo(data);
      toast({
        title: "Diagnostic Complete",
        description: "X connection diagnostic information retrieved.",
      });
    } catch (error) {
      console.error("Error running X diagnostic:", error);
      toast({
        title: "Diagnostic Failed",
        description: "Failed to retrieve X connection diagnostic information.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDiagnostic(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 mt-16">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        {/* Profile Section */}
        <div className="space-y-6 mb-10">
          <div>
            <h3 className="text-lg font-medium">Profile Information</h3>
            <p className="text-sm text-muted-foreground">
              Update your profile information here.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                Manage your basic profile information.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          <Separator />
        </div>

        {/* Preferences Section */}
        <div className="space-y-6 mb-10">
          <div>
            <h3 className="text-lg font-medium">Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Customize your experience.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Content Preferences</CardTitle>
              <CardDescription>
                Manage how content is generated for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="space-y-1 leading-none">
                  <p className="text-sm font-medium leading-none">
                    Use Hashtags
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Automatically include relevant hashtags in generated content.
                  </p>
                </div>
                <Switch id="use-hashtags" checked={useHashtags} onCheckedChange={(checked) => setUseHashtags(checked)} />
              </div>
            </CardContent>
          </Card>
          <Separator />
        </div>

        {/* X Connection Section */}
        <div className="space-y-6 mb-10">
          <div>
            <h3 className="text-lg font-medium">X (Twitter) Connection</h3>
            <p className="text-sm text-muted-foreground">
              Connect your X account to post directly and view analytics
            </p>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="font-medium">X Account Status</div>
              <div className="text-sm text-muted-foreground">
                {user?.xLinked ? 
                  `Connected to ${user.xUsername}` : 
                  'Not connected to X'
                }
              </div>
            </div>
            <XConnectButton 
              variant={user?.xLinked ? 'secondary' : 'default'}
            />
          </div>
          <Separator />
        </div>

        {/* X Connection Diagnostic Section */}
        <div className="space-y-6 mb-10">
          <div>
            <h3 className="text-lg font-medium">X Connection Diagnostics</h3>
            <p className="text-sm text-muted-foreground">
              Test and troubleshoot your X connection configuration
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>X API Configuration</CardTitle>
              <CardDescription>
                Run diagnostics to verify your X API connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-sm font-medium">Run Diagnostic Test</h4>
                  <p className="text-xs text-muted-foreground">
                    Check if your X API credentials and configuration are working properly
                  </p>
                </div>
                <Button 
                  onClick={runXDiagnostic} 
                  disabled={isLoadingDiagnostic}
                  size="sm"
                >
                  {isLoadingDiagnostic ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    'Run Diagnostic'
                  )}
                </Button>
              </div>
              
              {xDiagnosticInfo && (
                <div className="border rounded-md p-4 bg-muted/50 space-y-3">
                  <div>
                    <h4 className="text-sm font-medium">Environment Variables</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="col-span-2 text-xs font-medium mt-2">OAuth 2.0 Credentials:</div>
                      
                      <div className="text-xs">Client ID:</div>
                      <div className="text-xs font-mono">{xDiagnosticInfo.environment?.hasTwitterClientId ? 
                        `✅ Present (${xDiagnosticInfo.environment?.twitterClientIdFirstFour})` : 
                        '❌ Missing'}</div>
                      
                      <div className="text-xs">Client Secret:</div>
                      <div className="text-xs font-mono">{xDiagnosticInfo.environment?.hasTwitterClientSecret ? 
                        '✅ Present' : 
                        '❌ Missing'}</div>
                      
                      <div className="text-xs">Callback URL:</div>
                      <div className="text-xs font-mono overflow-hidden text-ellipsis">{xDiagnosticInfo.environment?.twitterCallbackUrl}</div>
                      
                      <div className="col-span-2 text-xs font-medium mt-2">OAuth 1.0a Credentials:</div>
                      
                      <div className="text-xs">Consumer Key:</div>
                      <div className="text-xs font-mono">{xDiagnosticInfo.environment?.hasTwitterConsumerKey ? 
                        '✅ Present' : 
                        '❌ Missing'}</div>
                      
                      <div className="text-xs">Consumer Secret:</div>
                      <div className="text-xs font-mono">{xDiagnosticInfo.environment?.hasTwitterConsumerSecret ? 
                        '✅ Present' : 
                        '❌ Missing'}</div>
                      
                      <div className="text-xs">Access Token:</div>
                      <div className="text-xs font-mono">{xDiagnosticInfo.environment?.hasTwitterAccessToken ? 
                        '✅ Present' : 
                        '❌ Missing'}</div>
                      
                      <div className="text-xs">Access Token Secret:</div>
                      <div className="text-xs font-mono">{xDiagnosticInfo.environment?.hasTwitterAccessTokenSecret ? 
                        '✅ Present' : 
                        '❌ Missing'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">Connectivity Test</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-xs">Can Reach Twitter API:</div>
                      <div className="text-xs font-mono">{xDiagnosticInfo.connectivity?.canReachTwitterApi ? 
                        '✅ Success' : 
                        '❌ Failed'}</div>
                      
                      {xDiagnosticInfo.connectivity?.twitterApiStatus && (
                        <>
                          <div className="text-xs">API Response Status:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.connectivity?.twitterApiStatus} {xDiagnosticInfo.connectivity?.twitterApiStatusText}</div>
                        </>
                      )}
                      
                      {xDiagnosticInfo.connectivity?.error && (
                        <>
                          <div className="text-xs">Error:</div>
                          <div className="text-xs font-mono text-red-500">{xDiagnosticInfo.connectivity?.error}</div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">OAuth 2.0 Test</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-xs">Authentication Test:</div>
                      <div className="text-xs font-mono">
                        {xDiagnosticInfo.oauth2Test?.success ? 
                          '✅ Success' : 
                          xDiagnosticInfo.oauth2Test?.skipped ? 
                            '⚠️ Skipped' : 
                            '❌ Failed'}
                      </div>
                      
                      {!xDiagnosticInfo.oauth2Test?.skipped && (
                        <>
                          <div className="text-xs">Method:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth2Test?.method}</div>
                          
                          <div className="text-xs">Response Status:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth2Test?.status} {xDiagnosticInfo.oauth2Test?.statusText}</div>
                          
                          {xDiagnosticInfo.oauth2Test?.parsedError && (
                            <>
                              <div className="text-xs">Error:</div>
                              <div className="text-xs font-mono text-red-500">{xDiagnosticInfo.oauth2Test?.parsedError}</div>
                            </>
                          )}
                          
                          {xDiagnosticInfo.oauth2Test?.parsedErrorDescription && (
                            <>
                              <div className="text-xs">Error Description:</div>
                              <div className="text-xs font-mono text-red-500">{xDiagnosticInfo.oauth2Test?.parsedErrorDescription}</div>
                            </>
                          )}
                        </>
                      )}
                      
                      {xDiagnosticInfo.oauth2Test?.alternateAttempt && (
                        <>
                          <div className="col-span-2 text-xs font-medium mt-2">Alternative OAuth 2.0 Method:</div>
                          
                          <div className="text-xs">Method:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth2Test?.alternateAttempt.method}</div>
                          
                          <div className="text-xs">Response Status:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth2Test?.alternateAttempt.status} {xDiagnosticInfo.oauth2Test?.alternateAttempt.statusText}</div>
                          
                          <div className="text-xs">Success:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth2Test?.alternateAttempt.success ? '✅ Yes' : '❌ No'}</div>
                          
                          {xDiagnosticInfo.oauth2Test?.alternateAttempt.parsedError && (
                            <>
                              <div className="text-xs">Error:</div>
                              <div className="text-xs font-mono text-red-500">{xDiagnosticInfo.oauth2Test?.alternateAttempt.parsedError}</div>
                            </>
                          )}
                          
                          {xDiagnosticInfo.oauth2Test?.alternateAttempt.parsedErrorDescription && (
                            <>
                              <div className="text-xs">Error Description:</div>
                              <div className="text-xs font-mono text-red-500">{xDiagnosticInfo.oauth2Test?.alternateAttempt.parsedErrorDescription}</div>
                            </>
                          )}
                        </>
                      )}
                      
                      {xDiagnosticInfo.oauth2Test?.reason && (
                        <>
                          <div className="text-xs">Reason:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth2Test?.reason}</div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">OAuth 1.0a Test</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-xs">Credentials Present:</div>
                      <div className="text-xs font-mono">
                        {xDiagnosticInfo.oauth1Test?.credentialsPresent ? 
                          '✅ Yes' : 
                          '❌ No'}
                      </div>
                      
                      {xDiagnosticInfo.oauth1Test?.message && (
                        <>
                          <div className="text-xs">Message:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth1Test?.message}</div>
                        </>
                      )}
                      
                      {xDiagnosticInfo.oauth1Test?.reason && (
                        <>
                          <div className="text-xs">Reason:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth1Test?.reason}</div>
                        </>
                      )}
                      
                      {xDiagnosticInfo.oauth1Test?.missingCredentials && (
                        <>
                          <div className="col-span-2 text-xs">Missing Credentials:</div>
                          <div className="text-xs">Consumer Key:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth1Test?.missingCredentials.consumerKey ? '❌ Missing' : '✅ Present'}</div>
                          <div className="text-xs">Consumer Secret:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth1Test?.missingCredentials.consumerSecret ? '❌ Missing' : '✅ Present'}</div>
                          <div className="text-xs">Access Token:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth1Test?.missingCredentials.accessToken ? '❌ Missing' : '✅ Present'}</div>
                          <div className="text-xs">Access Token Secret:</div>
                          <div className="text-xs font-mono">{xDiagnosticInfo.oauth1Test?.missingCredentials.accessTokenSecret ? '❌ Missing' : '✅ Present'}</div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      Diagnostic run at: {new Date(xDiagnosticInfo.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <p className="text-xs text-muted-foreground mb-2">
                If you're having trouble connecting to X, make sure you have:
              </p>
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                <li><strong>OAuth 2.0 credentials</strong> (Client ID, Client Secret) - Required for the newer Twitter API v2 endpoints</li>
                <li><strong>OAuth 1.0a credentials</strong> (Consumer Key/Secret, Access Token/Secret) - Required for some v1.1 endpoints</li>
                <li>Your app has both <strong>Read and Write permissions</strong> enabled in Twitter Developer Portal</li>
                <li>The <strong>callback URL</strong> in your Twitter Developer portal matches the one shown above</li>
                <li>All required secrets are properly configured in your Supabase project</li>
              </ul>
            </CardFooter>
          </Card>
          <Separator />
        </div>

        {/* Actions Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Actions</h3>
            <p className="text-sm text-muted-foreground">
              Perform actions related to your account.
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
          <Button variant="secondary" onClick={handleUpdatePreferences} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Preferences'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
