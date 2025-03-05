
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  "Art"
];

export const TopicSelection: React.FC<TopicSelectionProps> = ({ onSelectTopics }) => {
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);

  const toggleTopic = (topic: Topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
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
      </div>
      
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
