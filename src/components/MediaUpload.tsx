
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image, X, Video, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface MediaUploadProps {
  onMediaChange: (mediaPreviews: string[]) => void;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ onMediaChange }) => {
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (mediaPreviews.length + files.length > 4) {
      toast({
        title: "Too many files",
        description: "You can only upload a maximum of 4 images or 1 video",
        variant: "destructive"
      });
      return;
    }
    
    // Check if we already have a video
    const hasVideo = mediaPreviews.some(preview => preview.includes('video'));
    const hasNewVideo = Array.from(files).some(file => file.type.startsWith('video/'));
    
    if (hasVideo || (hasNewVideo && mediaPreviews.length > 0)) {
      toast({
        title: "Video restrictions",
        description: "You can only upload 1 video OR up to 4 images",
        variant: "destructive"
      });
      return;
    }
    
    // Process files
    const newPreviews: string[] = [];
    
    Array.from(files).forEach(file => {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 20MB limit`,
          variant: "destructive"
        });
        return;
      }
      
      // Create preview URL
      const preview = URL.createObjectURL(file);
      newPreviews.push(preview);
    });
    
    if (newPreviews.length > 0) {
      const updatedPreviews = [...mediaPreviews, ...newPreviews];
      setMediaPreviews(updatedPreviews);
      onMediaChange(updatedPreviews);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeMedia = (index: number) => {
    const updatedPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaPreviews(updatedPreviews);
    onMediaChange(updatedPreviews);
  };
  
  const clearAll = () => {
    setMediaPreviews([]);
    onMediaChange([]);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Media
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*, video/*"
            className="hidden"
            onChange={handleFileSelect}
            multiple
          />
        </div>
        
        {mediaPreviews.length > 0 && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={clearAll}
          >
            Clear All
          </Button>
        )}
      </div>
      
      {mediaPreviews.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {mediaPreviews.map((preview, index) => (
            <div key={index} className="relative aspect-square bg-muted rounded-md overflow-hidden">
              {preview.includes('video') ? (
                <video 
                  src={preview} 
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <img 
                  src={preview} 
                  alt={`Media ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              )}
              <Button 
                type="button"
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => removeMedia(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center">
                {preview.includes('video') ? (
                  <>
                    <Video className="h-3 w-3 mr-1" />
                    Video
                  </>
                ) : (
                  <>
                    <Image className="h-3 w-3 mr-1" />
                    Image
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground">
        You can upload up to 4 images or 1 video (max 20MB each)
      </div>
    </div>
  );
};

export default MediaUpload;
