import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Info, Check, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import XConnectButton from '@/components/XConnectButton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import XPostsAnalyzer from '@/components/XPostsAnalyzer';

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isDemoAccount = user?.email === 'demo@postedpal.com';
  const xAuthSuccess = searchParams.get('x_auth_success') === 'true';
  const username = searchParams.get('username');
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importResult, setImportResult] = useState<{total?: number, inserted?: number, errors?: number} | null>(null);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, isLoading, navigate]);

  const handleImportPosts = async () => {
    if (!user?.id) {
      addErrorLog("Cannot import posts: No user ID available");
      toast({
        title: "Error",
        description: "You must be logged in to import posts",
        variant: "destructive",
      });
      return;
    }

    setImportLoading(true);
    setImportSuccess(false);
    setImportResult(null);
    addErrorLog("Starting import process for user: " + user.id);

    try {
      const { data, error } = await supabase.functions.invoke('import-x-posts', {
        body: { userId: user.id }
      });

      if (error) {
        throw new Error(error.message || "Unknown error occurred during import");
      }

      addErrorLog("Import response: " + JSON.stringify(data));
      
      if (data.success) {
        setImportSuccess(true);
        setImportResult({
          total: data.total,
          inserted: data.inserted,
          errors: data.errors
        });
        
        toast({
          title: "Success",
          description: data.message || `Successfully imported ${data.inserted || 0} posts`,
          variant: "default",
        });
      } else {
        throw new Error(data.error || "Import failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addErrorLog("Import error: " + errorMessage);
      
      toast({
        title: "Error",
        description: "Failed to import posts: " + errorMessage,
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const addErrorLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.error(logEntry);
    setErrorLogs(prev => [...prev, logEntry]);
  };

  const handleDownloadLogs = () => {
    const logsText = errorLogs.join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'error-logs.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearErrorLogs = () => {
    setErrorLogs([]);
  };

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 mt-16">
        {/* Welcome Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome, {user?.name || 'User'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isDemoAccount ? 'Demo Account' : 'Manage your social media presence'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <XConnectButton />
              <Button 
                variant="outline" 
                onClick={handleImportPosts}
                disabled={importLoading || !user?.xLinked}
                className="flex items-center"
              >
                {importLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Import X Posts
              </Button>
              <Button 
                variant="default" 
                onClick={() => navigate('/create')}
                className="flex items-center"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Post
              </Button>
            </div>
          </div>
          
          {/* Alert for X connection status */}
          {!user?.xLinked && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Connect your X account</AlertTitle>
              <AlertDescription>
                To post directly to X, import your posts, and see your analytics, connect your X account.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Success alert when X auth completed */}
          {xAuthSuccess && (
            <Alert className="mb-6" variant="success">
              <Check className="h-4 w-4" />
              <AlertTitle>X account connected</AlertTitle>
              <AlertDescription>
                Successfully connected to {username ? `@${username}` : 'your X account'}.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Import Results Alert */}
          {importSuccess && importResult && (
            <Alert className="mb-6 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-700 dark:text-green-300">Import Successful</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Successfully imported {importResult.inserted} out of {importResult.total} posts 
                {importResult.errors ? ` (${importResult.errors} errors)` : ''}.
              </AlertDescription>
            </Alert>
          )}
        </section>
        
        {/* Posts Analytics Section */}
        {user?.xLinked && (
          <section className="mb-12">
            <XPostsAnalyzer onGenerateFromPost={(content) => navigate('/create', { state: { initialContent: content } })} />
          </section>
        )}

        {/* Error Logs Section */}
        {errorLogs.length > 0 && (
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold tracking-tight">Error Logs</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Logs
                </Button>
                <Button variant="outline" size="sm" onClick={clearErrorLogs}>
                  Clear Logs
                </Button>
              </div>
            </div>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Debug Information</AlertTitle>
              <AlertDescription>
                Error logs are displayed below. You can download these logs to help troubleshoot issues.
              </AlertDescription>
            </Alert>
            <div className="bg-black text-green-400 p-4 rounded-md overflow-auto max-h-80 font-mono text-sm">
              {errorLogs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap mb-1">{log}</div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
