
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Twitter, Info, ArrowLeft, Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");

  const handleConnectX = async () => {
    try {
      // Open web intent
      const intentUrl = "https://twitter.com/intent/tweet";
      window.open(intentUrl, "_blank");
      
      toast({
        title: "X Web Intent Opened",
        description: "To post to X, use the web intent window.",
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

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Settings", href: "/settings" }
        ]}
        className="mb-6"
      />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <Link to="/dashboard">
            <Button className="flex items-center gap-2">
              <Home size={16} />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
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
                X/Twitter Posting
              </CardTitle>
              <CardDescription>
                Web intent approach for posting to X/Twitter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-blue-50 border-blue-200 mb-4">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle>About Web Intent</AlertTitle>
                <AlertDescription>
                  We use Twitter's web intent feature for posting. This opens a pre-filled tweet window.
                </AlertDescription>
              </Alert>
              
              <Button 
                variant="outline"
                onClick={handleConnectX}
                className="flex items-center gap-2"
              >
                <Twitter className="mr-2 h-4 w-4 text-blue-500" />
                Try X Web Intent
              </Button>
              
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-700">
                  <strong>Note about images:</strong> When using the web intent approach, you'll need to manually attach images in the Twitter window that opens.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscription">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Subscription Settings</CardTitle>
              <CardDescription>
                Manage your Posted Pal Pro subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="font-medium">Status: <span className="text-green-600">Active</span></p>
                  <p className="text-sm text-muted-foreground mt-1">Your Posted Pal Pro subscription is active.</p>
                </div>
                
                <Link to="/subscription">
                  <Button variant="outline" className="w-full">
                    Manage Subscription
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
