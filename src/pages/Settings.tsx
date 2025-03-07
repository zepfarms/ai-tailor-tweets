
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

  const handleConnectX = async () => {
    setIsLinking(true);
    try {
      await linkXAccount();
    } catch (error) {
      console.error('Error linking X account:', error);
      toast({
        title: "X Integration Error",
        description: "There was an issue connecting your X account. The X integration feature is currently unavailable.",
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
              <Alert variant="outline" className="border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>X Account Not Connected</AlertTitle>
                <AlertDescription>
                  Connect your X account to enable posting and analytics features
                </AlertDescription>
              </Alert>
              <Button onClick={handleConnectX} disabled={isLinking} className="flex items-center">
                {isLinking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Twitter className="mr-2 h-4 w-4" />
                )}
                Connect X Account
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Note: X integration is currently disabled in demo mode. Contact support for more information.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
