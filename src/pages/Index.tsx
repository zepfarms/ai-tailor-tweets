
import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Navbar from '@/components/Navbar';
import { FileText } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col page-transition">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        
        <div className="container mx-auto px-4 md:px-6 py-8 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
              <FileText size={14} />
              <span>Terms of Service</span>
            </Link>
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
              <FileText size={14} />
              <span>Privacy Policy</span>
            </Link>
          </div>
          <div className="mt-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Posted Pal. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
