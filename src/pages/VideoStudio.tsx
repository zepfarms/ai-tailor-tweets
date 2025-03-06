
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "@/components/ui/use-toast";
import { VideoStudioCanvas } from '@/components/VideoStudio/VideoStudioCanvas';
import { MediaPicker } from '@/components/VideoStudio/MediaPicker';
import { TextEditor } from '@/components/VideoStudio/TextEditor';
import { EffectsPanel } from '@/components/VideoStudio/EffectsPanel';
import { MusicPanel } from '@/components/VideoStudio/MusicPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save } from 'lucide-react';

export interface TextElement {
  id: string;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  alignment: 'left' | 'center' | 'right';
  position?: { x: number; y: number };
}

const VideoStudio: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [postText, setPostText] = useState<string>("");
  
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, isLoading, navigate]);

  const handleExport = () => {
    toast({
      title: "Video Exported",
      description: "Your video has been saved to your library",
    });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-slow">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background page-transition">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-2 md:px-4 py-6 mt-16">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-2xl font-bold text-center flex-grow">Video Creator Studio</h1>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="glass-card p-4 rounded-xl mb-4">
              <VideoStudioCanvas 
                selectedMedia={selectedMedia} 
                textElements={textElements} 
                setTextElements={setTextElements}
              />
            </div>
          </div>
          
          <div className="glass-card p-4 rounded-xl h-fit">
            <Tabs defaultValue="media">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
                <TabsTrigger value="music">Music</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>
              
              <TabsContent value="media">
                <MediaPicker 
                  selectedMedia={selectedMedia}
                  setSelectedMedia={setSelectedMedia}
                />
              </TabsContent>
              
              <TabsContent value="text">
                <TextEditor 
                  textElements={textElements}
                  setTextElements={setTextElements}
                />
              </TabsContent>
              
              <TabsContent value="effects">
                <EffectsPanel />
              </TabsContent>
              
              <TabsContent value="music">
                <MusicPanel />
              </TabsContent>
              
              <TabsContent value="export">
                <div className="space-y-4">
                  <h3 className="font-medium">Export Settings</h3>
                  
                  <div className="space-y-2">
                    <label htmlFor="post-text" className="text-sm font-medium">
                      Post Text (Optional)
                    </label>
                    <Textarea
                      id="post-text"
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder="Add text to accompany your media..."
                      className="min-h-[80px] resize-none"
                      maxLength={280}
                    />
                    <div className="text-xs text-right text-muted-foreground">
                      {postText.length}/280
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full"
                      onClick={handleExport}
                    >
                      Export Video
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Videos will be exported in MP4 format, optimized for social media.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default VideoStudio;
