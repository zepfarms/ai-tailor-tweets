
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Undo, Redo } from 'lucide-react';
import { TextElement } from '@/pages/VideoStudio';

interface VideoStudioCanvasProps {
  selectedMedia: File[];
  textElements: TextElement[];
  setTextElements: React.Dispatch<React.SetStateAction<TextElement[]>>;
}

export const VideoStudioCanvas: React.FC<VideoStudioCanvasProps> = ({ 
  selectedMedia, 
  textElements,
  setTextElements
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [activeTextElementId, setActiveTextElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Initialize canvas and handle resizing
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetWidth * 9 / 16; // 16:9 aspect ratio
    
    setCanvasWidth(canvas.width);
    setCanvasHeight(canvas.height);

    // Add window resize handler
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetWidth * 9 / 16;
      
      setCanvasWidth(canvas.width);
      setCanvasHeight(canvas.height);
      
      // Redraw when resized
      renderCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update canvas when media or text changes
  useEffect(() => {
    renderCanvas();
  }, [selectedMedia, textElements]);

  // Render all content on canvas
  const renderCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If no media or text, show placeholder
    if (selectedMedia.length === 0 && textElements.length === 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add media to start creating', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Draw media (first one as background for now)
    if (selectedMedia.length > 0) {
      const file = selectedMedia[0];
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        // Calculate position to center and cover the canvas
        const imageAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (imageAspect > canvasAspect) {
          // Image is wider than canvas (relative to height)
          drawHeight = canvas.width / imageAspect;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          // Image is taller than canvas (relative to width)
          drawWidth = canvas.height * imageAspect;
          offsetX = (canvas.width - drawWidth) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        URL.revokeObjectURL(img.src);
        
        // After drawing image, draw text elements on top
        drawTextElements();
      };
    } else {
      // If no media but text exists, draw text on black background
      drawTextElements();
    }
  };

  // Draw text elements on canvas
  const drawTextElements = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    textElements.forEach((element) => {
      const x = element.position?.x || canvas.width / 2;
      const y = element.position?.y || canvas.height / 2;
      
      ctx.font = `${element.bold ? 'bold ' : ''}${element.italic ? 'italic ' : ''}${element.fontSize}px sans-serif`;
      ctx.fillStyle = element.color;
      ctx.textAlign = element.alignment as CanvasTextAlign;
      
      ctx.fillText(element.text, x, y);
      
      // Draw highlight for active text element
      if (element.id === activeTextElementId) {
        const metrics = ctx.measureText(element.text);
        const textWidth = metrics.width;
        const textHeight = element.fontSize;
        let boxX = x;
        
        if (element.alignment === 'center') {
          boxX = x - textWidth / 2;
        } else if (element.alignment === 'right') {
          boxX = x - textWidth;
        }
        
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(
          boxX - 5, 
          y - textHeight, 
          textWidth + 10, 
          textHeight + 10
        );
        ctx.setLineDash([]);
      }
    });
  };

  // Handle canvas click to select text elements
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if user clicked on a text element
    let clickedElement = null;
    
    for (const element of textElements) {
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      
      const elementX = element.position?.x || canvas.width / 2;
      const elementY = element.position?.y || canvas.height / 2;
      
      ctx.font = `${element.bold ? 'bold ' : ''}${element.italic ? 'italic ' : ''}${element.fontSize}px sans-serif`;
      const metrics = ctx.measureText(element.text);
      const textWidth = metrics.width;
      const textHeight = element.fontSize;
      
      let boxX = elementX;
      if (element.alignment === 'center') {
        boxX = elementX - textWidth / 2;
      } else if (element.alignment === 'right') {
        boxX = elementX - textWidth;
      }
      
      if (
        x >= boxX - 5 &&
        x <= boxX + textWidth + 5 &&
        y >= elementY - textHeight - 5 &&
        y <= elementY + 5
      ) {
        clickedElement = element;
        break;
      }
    }
    
    if (clickedElement) {
      setActiveTextElementId(clickedElement.id);
      setIsDragging(true);
      setDragStartPos({ x, y });
    } else {
      setActiveTextElementId(null);
    }
  };

  // Handle mouse movement for dragging text
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !activeTextElementId || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const deltaX = x - dragStartPos.x;
    const deltaY = y - dragStartPos.y;
    
    setTextElements(prev => prev.map(element => {
      if (element.id === activeTextElementId) {
        const oldX = element.position?.x || canvas.width / 2;
        const oldY = element.position?.y || canvas.height / 2;
        
        return {
          ...element,
          position: {
            x: oldX + deltaX,
            y: oldY + deltaY
          }
        };
      }
      return element;
    }));
    
    setDragStartPos({ x, y });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleUndo = () => {
    // Implement undo functionality
    console.log('Undo action');
    setCanUndo(true);
  };
  
  const handleRedo = () => {
    // Implement redo functionality
    console.log('Redo action');
    setCanRedo(true);
  };

  return (
    <div className="w-full">
      <div className="relative w-full rounded-lg overflow-hidden bg-black">
        <canvas 
          ref={canvasRef} 
          className="w-full rounded-lg"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
