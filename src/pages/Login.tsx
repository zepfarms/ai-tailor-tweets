
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  // Check if user is already logged in - with safeguard timeout
  useEffect(() => {
    // Use a timeout to prevent infinite loading
    const redirectTimeout = setTimeout(() => {
      if (user) {
        console.log('Login: User already logged in, redirecting to dashboard');
        navigate('/dashboard');
      }
    }, 500);
    
    return () => clearTimeout(redirectTimeout);
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLocalLoading(true);
    
    try {
      if (email.trim() === '') {
        setError('Email is required');
        setLocalLoading(false);
        return;
      }
      
      if (password.trim() === '') {
        setError('Password is required');
        setLocalLoading(false);
        return;
      }
      
      console.log('Login: Attempting login with email:', email);
      await login(email, password);
      
      // The login function in AuthContext handles navigation to dashboard
      
    } catch (err) {
      console.error('Login: Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setLocalLoading(false);
    }
  };

  // Pre-fill with demo account for easy testing
  const fillDemoAccount = () => {
    setEmail('demo@example.com');
    setPassword('password');
  };

  // If global auth is still loading initially, show a loading state
  // but add a timeout to avoid getting stuck in loading
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000); // Show content after 2 seconds even if still loading
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading && !showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 mt-16">
        <div className="w-full max-w-md">
          <Card className="glass-card animate-scale-in">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">
                Log in to your account to continue
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-blue-500 hover:text-blue-600">
                      Forgot password?
                    </Link>
                  </div>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
                
                <Button type="submit" className="w-full" disabled={localLoading}>
                  {localLoading ? "Logging in..." : "Log in"}
                </Button>
              </form>
              
              <div className="mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full text-sm" 
                  onClick={fillDemoAccount}
                >
                  Use demo account
                </Button>
              </div>
            </CardContent>
            
            <CardFooter>
              <div className="text-sm text-center w-full">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-500 hover:text-blue-600 font-medium">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
