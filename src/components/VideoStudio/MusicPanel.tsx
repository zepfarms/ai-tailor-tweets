
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Music, Play, Pause, Upload } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: string;
  isPlaying: boolean;
}

export const MusicPanel: React.FC = () => {
  const [uploadedTracks, setUploadedTracks] = useState<File[]>([]);
  const [volume, setVolume] = useState(50);
  
  const sampleTracks: MusicTrack[] = [
    { id: '1', name: 'Summer Vibes', artist: 'StudioX', duration: '0:30', isPlaying: false },
    { id: '2', name: 'Energetic Beat', artist: 'MusicLab', duration: '0:45', isPlaying: false },
    { id: '3', name: 'Chill Mood', artist: 'ChillWave', duration: '0:55', isPlaying: false },
    { id: '4', name: 'Epic Theme', artist: 'SoundMasters', duration: '1:20', isPlaying: false },
  ];
  
  const [tracks, setTracks] = useState<MusicTrack[]>(sampleTracks);
  
  const handleMusicUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please select audio files only",
        variant: "destructive"
      });
      return;
    }
    
    setUploadedTracks(prev => [...prev, ...audioFiles]);
    
    toast({
      title: "Music added",
      description: `${audioFiles.length} audio files added to your project`,
    });
  };
  
  const togglePlayTrack = (id: string) => {
    setTracks(prev => prev.map(track => ({
      ...track,
      isPlaying: track.id === id ? !track.isPlaying : false
    })));
  };
  
  const addTrack = (id: string) => {
    toast({
      title: "Track added",
      description: "Music track has been added to your video",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-medium">Upload Music</h3>
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2"
          onClick={() => document.getElementById('music-upload')?.click()}
        >
          <Upload className="h-4 w-4" />
          Upload Audio
        </Button>
        <Input 
          id="music-upload"
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={handleMusicUpload}
        />
        
        {uploadedTracks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Tracks</h4>
            {uploadedTracks.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => addTrack(`upload-${index}`)}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <h3 className="font-medium">Sample Tracks</h3>
        <div className="space-y-2">
          {tracks.map(track => (
            <div 
              key={track.id}
              className="flex items-center justify-between p-2 border rounded-md"
            >
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => togglePlayTrack(track.id)}
                >
                  {track.isPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{track.name}</span>
                  <span className="text-xs text-muted-foreground">{track.artist} • {track.duration}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => addTrack(track.id)}
              >
                Add
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="font-medium">Audio Settings</h3>
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label>Volume</Label>
              <span className="text-xs text-muted-foreground">{volume}%</span>
            </div>
            <Slider 
              value={[volume]} 
              max={100} 
              step={1} 
              onValueChange={(values) => setVolume(values[0])}
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label>Background Noise Reduction</Label>
              <span className="text-xs text-muted-foreground">Off</span>
            </div>
            <Slider defaultValue={[0]} max={100} step={1} />
          </div>
        </div>
      </div>
    </div>
  );
};
