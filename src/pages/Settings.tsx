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
import { useToast } from "@/components/ui/use-toast"
import XConnectButton from '@/components/XConnectButton';

const Settings: React.FC = () => {
  const { user, logout, updateUserPreferences } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [useHashtags, setUseHashtags] = useState(user?.useHashtags !== false);
  const [isLoading, setIsLoading] = useState(false);

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
