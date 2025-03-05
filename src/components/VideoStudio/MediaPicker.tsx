
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImagePlus, Video } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

export const MediaPicker: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (newFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please select image or video files only",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedMedia(prev => [...prev, ...newFiles]);
    
    toast({
      title: "Media added",
      description: `${newFiles.length} files added to your project`,
    });
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <Button className="flex flex-col items-center justify-center h-20 gap-2" onClick={() => document.getElementById('image-upload')?.click()}>
            <ImagePlus size={24} />
            <span className="text-xs">Add Images</span>
          </Button>
          <Button className="flex flex-col items-center justify-center h-20 gap-2" onClick={() => document.getElementById('video-upload')?.click()}>
            <Video size={24} />
            <span className="text-xs">Add Videos</span>
          </Button>
        </div>
        <Input 
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
        <Input 
          id="video-upload"
          type="file" 
          accept="video/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {selectedMedia.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Added Media</h3>
          <div className="grid grid-cols-4 gap-2">
            {selectedMedia.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-200 rounded-md overflow-hidden">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                  />
                </div>
                <button 
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeMedia(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
