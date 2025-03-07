
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Twitter, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Login: React.FC = () => {
  const { login, loginWithX, isLoading, isLoginingWithX } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    }
  };

  const handleXLogin = async () => {
    try {
      if (loginWithX) {
        await loginWithX();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login with X');
    }
  };

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
            
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={handleXLogin}
                disabled={isLoginingWithX}
              >
                {isLoginingWithX ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                )}
                {isLoginingWithX ? "Connecting to X..." : "Continue with X"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
              
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
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Log in"}
                </Button>
              </form>
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
