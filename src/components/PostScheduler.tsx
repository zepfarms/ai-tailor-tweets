
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/components/ui/use-toast";

interface PostSchedulerProps {
  content: string;
  onScheduleComplete: () => void;
}

export const PostScheduler: React.FC<PostSchedulerProps> = ({ content, onScheduleComplete }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("12:00");
  const [isScheduling, setIsScheduling] = useState(false);
  const { toast } = useToast();

  const handleScheduleSubmit = () => {
    if (!date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    setIsScheduling(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsScheduling(false);
      toast({
        title: "Post Scheduled",
        description: `Your post will be published on ${format(date, 'PP')} at ${time}`,
      });
      onScheduleComplete();
    }, 1000);
  };

  // Generate time options in 15-minute increments
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="space-y-6 animate-fade-in p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Schedule Your Post</h2>
        <p className="text-muted-foreground mb-4">
          Choose when you want your post to be published
        </p>
      </div>
      
      <div className="glass-card p-6 rounded-xl">
        <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-border">
          <p className="text-sm">{content}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Time</label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {time}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {timeOptions.map((timeOption) => (
                  <SelectItem key={timeOption} value={timeOption}>
                    {timeOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={handleScheduleSubmit}
            disabled={isScheduling || !date}
            className="px-8 button-glow"
          >
            {isScheduling ? "Scheduling..." : "Schedule Post"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostScheduler;
