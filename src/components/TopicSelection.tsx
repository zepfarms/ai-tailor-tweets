
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { Topic } from '@/lib/types';

interface TopicSelectionProps {
  onSelectTopics: (topics: Topic[]) => void;
}

const availableTopics: Topic[] = [
  "Technology",
  "Politics",
  "Sports",
  "Entertainment",
  "Science",
  "Business",
  "Health",
  "Fashion",
  "Food",
  "Travel",
  "Gaming",
  "Music",
  "Art",
  "Cryptocurrency",
  "Trending",
  "Finance",
  "Education",
  "Real Estate",
  "Marketing",
  "Fitness",
  "Parenting",
  "DIY",
  "Environment",
  "Startups"
];

export const TopicSelection: React.FC<TopicSelectionProps> = ({ onSelectTopics }) => {
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const toggleTopic = (topic: Topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleAddCustomTopic = () => {
    if (customTopic.trim() && !selectedTopics.includes(customTopic.trim())) {
      setSelectedTopics([...selectedTopics, customTopic.trim()]);
      setCustomTopic('');
      setShowCustomInput(false);
    }
  };

  const handleSubmit = () => {
    onSelectTopics(selectedTopics);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Your Topics</h2>
        <p className="text-muted-foreground">
          Choose topics that match your typical content to help our AI generate relevant posts.
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {availableTopics.map((topic) => (
          <Button
            key={topic}
            variant={selectedTopics.includes(topic) ? "default" : "outline"}
            className={`transition-all duration-200 ${
              selectedTopics.includes(topic) 
                ? "bg-blue-500 text-white hover:bg-blue-600" 
                : "hover:border-blue-500 hover:text-blue-500"
            }`}
            onClick={() => toggleTopic(topic)}
          >
            {topic}
          </Button>
        ))}
        
        {/* Add Custom Topic Button */}
        <Button
          variant="outline"
          className="border-dashed border-2 hover:border-blue-500 hover:text-blue-500"
          onClick={() => setShowCustomInput(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Custom
        </Button>
      </div>
      
      {/* Custom Topic Input */}
      {showCustomInput && (
        <div className="flex items-end gap-2 mt-4 animate-fade-in">
          <div className="flex-1">
            <Label htmlFor="customTopic" className="mb-2">
              Enter your own topic
            </Label>
            <Input
              id="customTopic"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="E.g., Cryptocurrency, Fitness, etc."
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCustomTopic();
                }
              }}
            />
          </div>
          <Button 
            onClick={handleAddCustomTopic}
            disabled={!customTopic.trim()}
          >
            Add
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              setShowCustomInput(false);
              setCustomTopic('');
            }}
          >
            Cancel
          </Button>
        </div>
      )}
      
      {/* Selected Topics Display */}
      {selectedTopics.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Selected Topics:</p>
          <div className="flex flex-wrap gap-2">
            {selectedTopics.map((topic) => (
              <div 
                key={topic}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {topic}
                <button 
                  className="ml-2 text-blue-500 hover:text-blue-700"
                  onClick={() => toggleTopic(topic)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-center mt-8">
        <Button 
          onClick={handleSubmit}
          disabled={selectedTopics.length === 0}
          className="px-8 button-glow"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default TopicSelection;
