
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link as LinkIcon, AlertCircle, Twitter, Loader2, RefreshCcw, ExternalLink, Info, CheckCircle, Code } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Settings: React.FC = () => {
  const { user, linkXAccount } = useAuth();
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("account");
  const [showRawResponses, setShowRawResponses] = useState(false);

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
      console.log("Debug info:", response.data);
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
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
        </TabsContent>
        
        <TabsContent value="integrations">
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
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowRawResponses(!showRawResponses)}
                            className="h-8"
                          >
                            <Code className="h-4 w-4 mr-1" />
                            {showRawResponses ? "Hide Raw Responses" : "Show Raw Responses"}
                          </Button>
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
                      </div>
                      
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="env">
                          <AccordionTrigger>
                            <span className="flex items-center">
                              Environment Variables
                              {!debugInfo.environmentInfo.twitterClientIdSet || 
                               !debugInfo.environmentInfo.twitterClientSecretSet || 
                               !debugInfo.environmentInfo.twitterCallbackUrlSet && (
                                <Badge variant="destructive" className="ml-2">Issues</Badge>
                              )}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                              <ul className="list-disc list-inside mb-2 space-y-1">
                                <li className={!debugInfo.environmentInfo.twitterClientIdSet ? "text-red-500 font-semibold" : ""}>
                                  Twitter Client ID: {debugInfo.environmentInfo.twitterClientIdSet ? 
                                    `Set (${debugInfo.environmentInfo.twitterClientIdLength} chars, starts with ${debugInfo.environmentInfo.twitterClientIdFirstChars || 'N/A'})` : 
                                    'Not set - Required!'}
                                </li>
                                <li className={!debugInfo.environmentInfo.twitterClientSecretSet ? "text-red-500 font-semibold" : ""}>
                                  Twitter Client Secret: {debugInfo.environmentInfo.twitterClientSecretSet ? 
                                    `Set (${debugInfo.environmentInfo.twitterClientSecretLength} chars, starts with ${debugInfo.environmentInfo.twitterClientSecretFirstChars || 'N/A'})` : 
                                    'Not set - Required!'}
                                </li>
                                <li className={!debugInfo.environmentInfo.twitterCallbackUrlSet ? "text-red-500 font-semibold" : ""}>
                                  Twitter Callback URL: {debugInfo.environmentInfo.twitterCallbackUrlSet ? 
                                    debugInfo.environmentInfo.twitterCallbackUrl : 
                                    'Not set - Required!'}
                                  {debugInfo.environmentInfo.twitterCallbackUrlSet && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="h-3 w-3 inline ml-1 text-gray-400" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="max-w-xs">
                                            This must match exactly what's configured in your X Developer Portal.
                                            Make sure it's set to <code>https://postedpal.com/x-callback</code> with no trailing slash.
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </li>
                                <li>
                                  Supabase URL: {debugInfo.environmentInfo.supabaseUrlSet ? 
                                    debugInfo.environmentInfo.supabaseUrl : 'Not set'}
                                </li>
                                <li>
                                  Supabase Service Role Key: {debugInfo.environmentInfo.supabaseServiceRoleKeySet ? 
                                    'Set' : 'Not set'}
                                </li>
                              </ul>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="api">
                          <AccordionTrigger>
                            <span className="flex items-center">
                              Twitter API Status
                              {debugInfo.twitterApiStatus.authEndpoint.includes("unreachable") || 
                               debugInfo.twitterApiStatus.apiEndpoint.includes("unreachable") && (
                                <Badge variant="destructive" className="ml-2">Connection Issues</Badge>
                              )}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                              <ul className="list-disc list-inside mb-2 space-y-1">
                                <li>
                                  OpenAPI Endpoint: {debugInfo.twitterApiStatus.openapi}
                                </li>
                                <li className={debugInfo.twitterApiStatus.authEndpoint.includes("unreachable") ? "text-red-500 font-semibold" : ""}>
                                  Auth Endpoint: {debugInfo.twitterApiStatus.authEndpoint}
                                </li>
                                <li className={debugInfo.twitterApiStatus.apiEndpoint.includes("unreachable") ? "text-red-500 font-semibold" : ""}>
                                  API Endpoint: {debugInfo.twitterApiStatus.apiEndpoint}
                                </li>
                                <li className={debugInfo.twitterApiStatus.oauthEndpoint?.includes("unreachable") ? "text-red-500 font-semibold" : ""}>
                                  OAuth Endpoint: {debugInfo.twitterApiStatus.oauthEndpoint || "not tested"}
                                </li>
                              </ul>
                              
                              {showRawResponses && debugInfo.fullErrorResponses && (
                                <div className="mt-3 space-y-3">
                                  <div>
                                    <p className="font-semibold mb-1">OAuth Endpoint Response:</p>
                                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto max-h-40">
                                      {debugInfo.fullErrorResponses.oauthEndpoint || "No response"}
                                    </pre>
                                  </div>
                                  <div>
                                    <p className="font-semibold mb-1">API Endpoint Response:</p>
                                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto max-h-40">
                                      {debugInfo.fullErrorResponses.apiEndpoint || "No response"}
                                    </pre>
                                  </div>
                                </div>
                              )}
                              
                              <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                <p className="font-semibold mb-1">Common Error Codes:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  <li>401 - Unauthorized: API keys may be incorrect or OAuth token is missing/invalid</li>
                                  <li>403 - Forbidden: Your app may not have proper permissions or the API keys lack necessary privileges</li>
                                  <li>429 - Rate Limited: Too many requests to the Twitter API</li>
                                </ul>
                              </div>
                            </div>
                            
                            {debugInfo.clientCredentialsTest && (
                              <div className="mt-3 p-3 bg-white rounded border border-gray-200 text-xs">
                                <p className="font-semibold mb-1">Client Credentials Flow Test:</p>
                                <p>Status: {debugInfo.clientCredentialsTest.success ? 
                                  <span className="text-green-600 flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Success
                                  </span> : 
                                  <span className="text-red-600">Failed - {debugInfo.clientCredentialsTest.error}</span>}
                                </p>
                                {showRawResponses && debugInfo.clientCredentialsTest.response && (
                                  <div className="mt-1">
                                    <p className="font-semibold mb-1">Response:</p>
                                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto max-h-40">
                                      {debugInfo.clientCredentialsTest.response}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {debugInfo.authUrlTest && (
                              <div className="mt-3 p-3 bg-white rounded border border-gray-200 text-xs">
                                <p className="font-semibold mb-1">Auth URL Generation Test:</p>
                                <p>Status: {debugInfo.authUrlTest.success ? 
                                  <span className="text-green-600">Success</span> : 
                                  <span className="text-red-600">Failed - {debugInfo.authUrlTest.error}</span>}
                                </p>
                                {debugInfo.authUrlTest.url && (
                                  <div className="mt-1">
                                    <p>Test URL: <span className="break-all font-mono text-xs">{debugInfo.authUrlTest.url}</span></p>
                                  </div>
                                )}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="dns">
                          <AccordionTrigger>
                            <span className="flex items-center">
                              DNS Resolution
                              {debugInfo.dnsStatus.twitter.includes("error") || 
                               debugInfo.dnsStatus.api.includes("error") && (
                                <Badge variant="destructive" className="ml-2">DNS Issues</Badge>
                              )}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                              <ul className="list-disc list-inside space-y-1">
                                <li className={debugInfo.dnsStatus.twitter.includes("error") ? "text-red-500 font-semibold" : ""}>
                                  twitter.com: {debugInfo.dnsStatus.twitter}
                                </li>
                                <li className={debugInfo.dnsStatus.api.includes("error") ? "text-red-500 font-semibold" : ""}>
                                  api.twitter.com: {debugInfo.dnsStatus.api}
                                </li>
                                <li className={debugInfo.dnsStatus.upload?.includes("error") ? "text-red-500 font-semibold" : ""}>
                                  upload.twitter.com: {debugInfo.dnsStatus.upload || "not tested"}
                                </li>
                              </ul>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      
                      <p className="text-xs text-gray-500 mt-3">Last checked: {new Date(debugInfo.timestamp).toLocaleString()}</p>
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
                    <p className="font-medium">Twitter Developer Portal Configuration Requirements:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li><strong>OAuth 2.0 (Not OAuth 1.0a)</strong> must be enabled in your app</li>
                      <li>Set Type of App to <strong>Web App, Automated App or Bot</strong></li>
                      <li>App permissions must include <strong>Read and Write</strong></li>
                      <li>Callback URL must be set to <strong>https://postedpal.com/x-callback</strong> exactly</li>
                      <li>Ensure you copy the <strong>OAuth 2.0 Client ID and Client Secret</strong>, not the API Key/Secret</li>
                      <li>Website URL should be <strong>https://postedpal.com</strong></li>
                    </ul>
                    
                    <div className="mt-3 flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs flex items-center text-blue-600"
                        asChild
                      >
                        <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer">
                          Open X Developer Portal 
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
