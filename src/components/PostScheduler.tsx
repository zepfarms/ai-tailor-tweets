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
  mediaPreviews?: string[];
}

export const PostScheduler: React.FC<PostSchedulerProps> = ({ 
  content, 
  onScheduleComplete,
  mediaPreviews = []
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("PM");
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
    
    // Convert to 24-hour format for backend
    const hour24 = period === "AM" 
      ? (hour === "12" ? "00" : hour) 
      : (hour === "12" ? "12" : String(Number(hour) + 12));
    
    const formattedTime = `${hour24}:${minute}`;
    
    // Simulate API call
    setTimeout(() => {
      setIsScheduling(false);
      toast({
        title: "Post Scheduled",
        description: `Your post will be published on ${format(date, 'PP')} at ${hour}:${minute} ${period}`,
      });
      onScheduleComplete();
    }, 1000);
  };

  // Generate hour options (1-12)
  const generateHourOptions = () => {
    const options = [];
    for (let i = 1; i <= 12; i++) {
      options.push(i.toString().padStart(2, '0'));
    }
    return options;
  };

  // Generate minute options in 15-minute increments (00, 15, 30, 45)
  const generateMinuteOptions = () => {
    const options = [];
    for (let i = 0; i < 60; i += 15) {
      options.push(i.toString().padStart(2, '0'));
    }
    return options;
  };

  const hourOptions = generateHourOptions();
  const minuteOptions = generateMinuteOptions();

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
          
          {mediaPreviews && mediaPreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {mediaPreviews.map((url, index) => (
                <div key={index} className="rounded-md overflow-hidden aspect-video bg-gray-100">
                  {url.includes('video') ? (
                    <video src={url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={url} alt={`Media ${index + 1}`} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}
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
            <div className="flex space-x-2">
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Hour">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {hour}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {hourOptions.map((hourOption) => (
                    <SelectItem key={hourOption} value={hourOption}>
                      {hourOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="flex items-center">:</span>
              
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Minute">
                    {minute}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {minuteOptions.map((minuteOption) => (
                    <SelectItem key={minuteOption} value={minuteOption}>
                      {minuteOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={period} onValueChange={(value) => setPeriod(value as "AM" | "PM")}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="AM/PM">
                    {period}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
