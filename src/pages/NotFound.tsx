
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

const NotFound: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md mx-auto space-y-6 animate-fade-in">
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
          <div className="relative glass-card rounded-full w-full h-full flex items-center justify-center text-6xl font-bold text-blue-500">
            404
          </div>
        </div>
        
        <h1 className="text-3xl font-bold">Page not found</h1>
        
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="pt-6">
          <Link to="/">
            <Button className="button-glow">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
