
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

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
    </div>
  );
};

export default Settings;
