
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { toast } from "@/components/ui/use-toast";

export const EffectsPanel: React.FC = () => {
  const applyEffect = (effect: string) => {
    toast({
      title: "Effect Applied",
      description: `${effect} effect has been applied to your video`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Filters</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline"
            className="h-20 flex flex-col gap-1"
            onClick={() => applyEffect('Vintage')}
          >
            <div className="w-full h-10 bg-gradient-to-r from-amber-200 to-amber-600 rounded"></div>
            <span className="text-xs">Vintage</span>
          </Button>
          <Button 
            variant="outline"
            className="h-20 flex flex-col gap-1"
            onClick={() => applyEffect('B&W')}
          >
            <div className="w-full h-10 bg-gradient-to-r from-gray-400 to-gray-800 rounded"></div>
            <span className="text-xs">B&W</span>
          </Button>
          <Button 
            variant="outline"
            className="h-20 flex flex-col gap-1"
            onClick={() => applyEffect('Vibrant')}
          >
            <div className="w-full h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded"></div>
            <span className="text-xs">Vibrant</span>
          </Button>
          <Button 
            variant="outline"
            className="h-20 flex flex-col gap-1"
            onClick={() => applyEffect('Cool')}
          >
            <div className="w-full h-10 bg-gradient-to-r from-blue-200 to-blue-600 rounded"></div>
            <span className="text-xs">Cool</span>
          </Button>
          <Button 
            variant="outline"
            className="h-20 flex flex-col gap-1"
            onClick={() => applyEffect('Warm')}
          >
            <div className="w-full h-10 bg-gradient-to-r from-yellow-200 to-red-500 rounded"></div>
            <span className="text-xs">Warm</span>
          </Button>
          <Button 
            variant="outline"
            className="h-20 flex flex-col gap-1"
            onClick={() => applyEffect('Retro')}
          >
            <div className="w-full h-10 bg-gradient-to-r from-green-300 to-yellow-400 rounded"></div>
            <span className="text-xs">Retro</span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium">Adjustments</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label>Brightness</Label>
              <span className="text-xs text-muted-foreground">50%</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label>Contrast</Label>
              <span className="text-xs text-muted-foreground">50%</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label>Saturation</Label>
              <span className="text-xs text-muted-foreground">50%</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium">Transitions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline"
            onClick={() => applyEffect('Fade')}
          >
            Fade
          </Button>
          <Button 
            variant="outline"
            onClick={() => applyEffect('Dissolve')}
          >
            Dissolve
          </Button>
          <Button 
            variant="outline"
            onClick={() => applyEffect('Slide')}
          >
            Slide
          </Button>
          <Button 
            variant="outline"
            onClick={() => applyEffect('Wipe')}
          >
            Wipe
          </Button>
        </div>
      </div>
    </div>
  );
};
