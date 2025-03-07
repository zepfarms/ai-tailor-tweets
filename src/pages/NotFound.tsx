
import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HomeIcon, ArrowLeft } from "lucide-react";

const NotFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log the error for debugging
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // For deep links on mobile, try to redirect to the closest parent route
    // that might exist if the current path doesn't exist
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // If we're on mobile and this is a deep path, try redirecting to a parent route
    if (pathSegments.length > 1 && isMobileDevice()) {
      const mainRoute = `/${pathSegments[0]}`;
      
      // List of valid routes (should match routes in App.tsx)
      const validRoutes = ['/', '/login', '/signup', '/dashboard', '/create', '/video-studio', 
                          '/verify-email', '/settings', '/pricing', '/contact',
                          '/terms-of-service', '/privacy-policy', '/cookie-policy', '/x-callback'];
      
      if (validRoutes.includes(mainRoute)) {
        // If the main route exists, navigate to it
        setTimeout(() => navigate(mainRoute), 100);
      } else {
        // If we can't determine a valid parent route, just go home
        setTimeout(() => navigate('/'), 100);
      }
    }
  }, [location.pathname, navigate]);

  // Helper function to detect mobile devices
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768);
  };

  const goBack = () => {
    navigate(-1);
  };

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
        
        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={goBack} className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Go Back
          </Button>
          <Link to="/">
            <Button className="button-glow flex items-center gap-2 w-full sm:w-auto">
              <HomeIcon size={16} />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
