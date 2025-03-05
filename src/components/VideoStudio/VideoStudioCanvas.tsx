
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Undo, Redo } from 'lucide-react';

export const VideoStudioCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetWidth * 9 / 16; // 16:9 aspect ratio
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw placeholder content 
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Add media to start creating', canvas.width / 2, canvas.height / 2);
    
    // Add window resize handler
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetWidth * 9 / 16;
      
      // Redraw on resize
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add media to start creating', canvas.width / 2, canvas.height / 2);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleUndo = () => {
    // Implement undo functionality
    console.log('Undo action');
  };
  
  const handleRedo = () => {
    // Implement redo functionality
    console.log('Redo action');
  };

  return (
    <div className="w-full">
      <div className="relative w-full rounded-lg overflow-hidden bg-black">
        <canvas 
          ref={canvasRef} 
          className="w-full rounded-lg"
        ></canvas>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20" 
                onClick={handleUndo}
                disabled={!canUndo}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20" 
                onClick={handleRedo}
                disabled={!canRedo}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <div className="text-white text-xs">
              00:00 / 00:15
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
