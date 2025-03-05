
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Plus
} from 'lucide-react';
import { TextElement } from '@/pages/VideoStudio';

interface TextEditorProps {
  textElements: TextElement[];
  setTextElements: React.Dispatch<React.SetStateAction<TextElement[]>>;
}

export const TextEditor: React.FC<TextEditorProps> = ({ textElements, setTextElements }) => {
  const [currentElement, setCurrentElement] = useState<TextElement>({
    id: '',
    text: '',
    fontSize: 24,
    color: '#ffffff',
    bold: false,
    italic: false,
    alignment: 'center'
  });

  const addTextElement = () => {
    if (!currentElement.text.trim()) return;
    
    const newElement = {
      ...currentElement,
      id: Date.now().toString()
    };
    
    setTextElements(prev => [...prev, newElement]);
    setCurrentElement({
      id: '',
      text: '',
      fontSize: 24,
      color: '#ffffff',
      bold: false,
      italic: false,
      alignment: 'center'
    });
  };

  const removeTextElement = (id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id));
  };

  const editTextElement = (id: string) => {
    const element = textElements.find(el => el.id === id);
    if (element) {
      setCurrentElement(element);
      removeTextElement(id);
    }
  };

  const toggleBold = () => {
    setCurrentElement(prev => ({
      ...prev,
      bold: !prev.bold
    }));
  };

  const toggleItalic = () => {
    setCurrentElement(prev => ({
      ...prev,
      italic: !prev.italic
    }));
  };

  const setAlignment = (alignment: 'left' | 'center' | 'right') => {
    setCurrentElement(prev => ({
      ...prev,
      alignment
    }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea 
          placeholder="Enter text..."
          value={currentElement.text}
          onChange={(e) => setCurrentElement(prev => ({ ...prev, text: e.target.value }))}
          className="w-full resize-none"
          rows={2}
        />
        
        <div className="flex gap-2">
          <Button 
            variant={currentElement.bold ? "default" : "outline"} 
            size="sm"
            onClick={toggleBold}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant={currentElement.italic ? "default" : "outline"}
            size="sm"
            onClick={toggleItalic}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant={currentElement.alignment === 'left' ? "default" : "outline"}
            size="sm"
            onClick={() => setAlignment('left')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant={currentElement.alignment === 'center' ? "default" : "outline"}
            size="sm"
            onClick={() => setAlignment('center')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button 
            variant={currentElement.alignment === 'right' ? "default" : "outline"}
            size="sm"
            onClick={() => setAlignment('right')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Input 
            type="color"
            value={currentElement.color}
            onChange={(e) => setCurrentElement(prev => ({ ...prev, color: e.target.value }))}
            className="w-10 h-8 p-0 border-0"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Font Size: {currentElement.fontSize}px</label>
          <Slider
            value={[currentElement.fontSize]}
            min={12}
            max={72}
            step={1}
            onValueChange={(value) => setCurrentElement(prev => ({ ...prev, fontSize: value[0] }))}
          />
        </div>
        
        <Button 
          className="w-full"
          onClick={addTextElement}
          disabled={!currentElement.text.trim()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Text
        </Button>
      </div>
      
      {textElements.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Text Elements</h3>
          <div className="space-y-2">
            {textElements.map((element) => (
              <div 
                key={element.id} 
                className="p-2 border rounded-md flex justify-between items-center"
              >
                <div 
                  style={{ 
                    color: element.color,
                    fontWeight: element.bold ? 'bold' : 'normal',
                    fontStyle: element.italic ? 'italic' : 'normal',
                    fontSize: Math.min(element.fontSize, 20) + 'px',
                    textAlign: element.alignment
                  }}
                  className="truncate w-4/5"
                >
                  {element.text}
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => editTextElement(element.id)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeTextElement(element.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
