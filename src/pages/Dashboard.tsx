
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Info, Check, AlertTriangle, Download, BarChart2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import XConnectButton from '@/components/XConnectButton';
import { useToast } from '@/hooks/use-toast';
import XPostsAnalyzer from '@/components/XPostsAnalyzer';

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isDemoAccount = user?.email === 'demo@postedpal.com';
  const xAuthSuccess = searchParams.get('x_auth_success') === 'true';
  const username = searchParams.get('username');
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, isLoading, navigate]);

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

  const handleAnalyzeXAccount = async () => {
    if (!user?.id || !user?.xLinked) {
      toast({
        title: "X account not connected",
        description: "Please connect your X account first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-x-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Try to parse as JSON, but fall back to plain text if it's not valid JSON
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to analyze X account';
        } catch {
          errorMessage = errorText || 'Failed to analyze X account';
        }
        throw new Error(errorMessage);
      }

      const data = await response.text();
      let result;
      try {
        // Only parse as JSON if it's not empty
        result = data ? JSON.parse(data) : {};
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        addErrorLog(`Error parsing response: ${parseError}`);
        throw new Error("Received invalid response from server");
      }

      toast({
        title: "Analysis complete",
        description: "Your X account analysis is ready to view",
        variant: "default",
      });
    } catch (error) {
      console.error('Error analyzing X account:', error);
      addErrorLog(`Error analyzing X account: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze X account",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
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
                To post directly to X, analyze your posts, and see your analytics, connect your X account.
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

          {/* Analyze X Account Button (only show if account is linked) */}
          {user?.xLinked && (
            <div className="mt-6 mb-8">
              <Button 
                onClick={handleAnalyzeXAccount} 
                disabled={isAnalyzing}
                className="flex items-center"
                variant="secondary"
              >
                {isAnalyzing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Analyze X Account
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Analyze your last 30 days of X activity and get growth recommendations.
              </p>
            </div>
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
