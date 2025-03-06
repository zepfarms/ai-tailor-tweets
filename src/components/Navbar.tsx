
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { X, Menu, Twitter } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border py-4">
      <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
        <Link 
          to="/" 
          className="flex items-center space-x-1"
        >
          <span className="font-black text-2xl text-black tracking-tight">
            Posted
          </span>
          <span className="font-serif text-2xl italic bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Pal
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors">
            Home
          </Link>
          <Link to="/features" className="text-foreground/80 hover:text-foreground transition-colors">
            Features
          </Link>
          <Link to="/pricing" className="text-foreground/80 hover:text-foreground transition-colors">
            Pricing
          </Link>
          
          {user ? (
            <div className="flex items-center space-x-4">
              {user.xLinked && user.xUsername && (
                <div className="flex items-center gap-1 text-sm text-foreground/70">
                  <Twitter size={14} className="text-blue-400" />
                  <span>{user.xUsername}</span>
                </div>
              )}
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button onClick={logout} variant="outline">Logout</Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button className="button-glow">Sign Up</Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden focus:outline-none" 
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border animate-slide-down">
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link 
              to="/" 
              className="text-foreground/80 hover:text-foreground transition-colors py-2" 
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/features" 
              className="text-foreground/80 hover:text-foreground transition-colors py-2" 
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              to="/pricing" 
              className="text-foreground/80 hover:text-foreground transition-colors py-2" 
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            
            {user ? (
              <>
                {user.xLinked && user.xUsername && (
                  <div className="flex items-center gap-1 text-sm text-foreground/70 py-2">
                    <Twitter size={14} className="text-blue-400" />
                    <span>{user.xUsername}</span>
                  </div>
                )}
                <Link 
                  to="/dashboard" 
                  className="block" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                </Link>
                <Button 
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start">Login</Button>
                </Link>
                <Link 
                  to="/signup" 
                  className="block" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full justify-start">Sign Up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
