
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
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
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
  const [isUnlinkingX, setIsUnlinkingX] = useState(false);

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

  const handleUnlinkXAccount = async () => {
    console.log("Starting X account unlinking process");
    setIsUnlinkingX(true);
    try {
      if (!user?.id) {
        throw new Error("User ID not found");
      }
      
      console.log("Deleting X account for user:", user.id);
      // Delete the X account record from the database
      const { error } = await supabase
        .from('x_accounts')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Error deleting X account:", error);
        throw error;
      }
      
      console.log("X account deleted successfully");
      
      // Update the user object with unlinked state
      if (updateUserPreferences) {
        try {
          console.log("Updating user preferences to reflect unlinked state");
          await updateUserPreferences({ xLinked: false, xUsername: null });
          console.log("User preferences updated successfully");
          
          // Force the UI to update immediately by showing a success toast
          toast({
            title: "X Account Unlinked",
            description: "Your X account has been successfully disconnected.",
          });
        } catch (error) {
          console.error("Error updating user metadata:", error);
          // If updating preferences fails, show a partial success message
          toast({
            title: "Partial Success",
            description: "X account unlinked, but profile update failed. Please refresh the page.",
          });
        }
      }
      
      // Force a page refresh to update the UI state properly
      window.location.reload();
    } catch (error) {
      console.error("Error unlinking X account:", error);
      toast({
        title: "Unlink Failed",
        description: "Failed to unlink X account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUnlinkingX(false);
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
            <div className="flex gap-2">
              {user?.xLinked && (
                <Button 
                  variant="destructive"
                  onClick={handleUnlinkXAccount}
                  disabled={isUnlinkingX}
                >
                  {isUnlinkingX ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Unlinking...
                    </>
                  ) : (
                    'Unlink Account'
                  )}
                </Button>
              )}
              <XConnectButton 
                variant={user?.xLinked ? 'secondary' : 'default'}
              />
            </div>
          </div>
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
          <div className="flex flex-wrap gap-4">
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
            <Button variant="secondary" onClick={handleUpdatePreferences} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : 'Update Preferences'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
