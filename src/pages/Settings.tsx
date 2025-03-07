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
import { linkSocialMediaProfile } from '@/lib/ayrshareUtils';

const Settings: React.FC = () => {
  const { user, linkXAccount } = useAuth();
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);
  const [isLinkingAyrshare, setIsLinkingAyrshare] = useState(false);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("account");
  const [showRawResponses, setShowRawResponses] = useState(false);

  const handleConnectX = async () => {
    try {
      // Instead of an expensive API approach, let's redirect to web intent
      const intentUrl = "https://twitter.com/intent/tweet";
      window.open(intentUrl, "_blank");
      
      toast({
        title: "X Web Intent Opened",
        description: "To post to X, use the web intent window. For frequent posting, consider affordable services like IFTTT ($5/month) or Zapier (free tier available).",
      });
    } catch (error) {
      console.error('Error opening X web intent:', error);
      toast({
        title: "Error",
        description: "Could not open X web intent. Please check your internet connection.",
        variant: "destructive",
      });
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
                X/Twitter Posting Options
              </CardTitle>
              <CardDescription>
                Affordable options for posting to X/Twitter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-blue-50 border-blue-200 mb-4">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle>Cost-Effective Posting Options</AlertTitle>
                <AlertDescription>
                  X/Twitter's API requires a paid subscription ($5,000/month). We offer free alternatives.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Here are cost-effective options for posting to X/Twitter:
                </p>
                
                <div className="space-y-2">
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2 text-blue-500" />
                      Web Intent (Free)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Opens a pre-filled tweet window. User must click send. No API key required.
                    </p>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleConnectX}
                      className="w-full justify-start"
                    >
                      <Twitter className="mr-2 h-4 w-4 text-blue-500" />
                      Try X Web Intent
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Code className="h-4 w-4 mr-2 text-purple-500" />
                      Zapier Integration (Free tier available)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Connect X to your app via Zapier. Free tier for basic usage.
                    </p>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href="https://zapier.com/apps/twitter/integrations" target="_blank" rel="noopener noreferrer">
                        Explore Zapier Integration
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <RefreshCcw className="h-4 w-4 mr-2 text-orange-500" />
                      IFTTT ($5/month)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Create automated posting workflows with IFTTT's affordable plan.
                    </p>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href="https://ifttt.com/twitter" target="_blank" rel="noopener noreferrer">
                        Explore IFTTT Integration
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm font-medium text-amber-800 mb-1">Note about X/Twitter API:</p>
                <p className="text-sm text-amber-700">
                  X/Twitter now charges $5,000/month for their API with posting capabilities. For a more cost-effective solution, we recommend using the free web intent option or affordable services like Zapier (free tier available) or IFTTT ($5/month).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
