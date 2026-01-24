import { Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

interface AudioPlayerProps {
  title: string;
  episodeNumber?: string;
  duration?: string;
}

export function AudioPlayer({ title, episodeNumber, duration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([33]);

  return (
    <Card className="bg-secondary text-secondary-foreground border-white/10 p-4 rounded-xl shadow-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Now Playing</p>
            <h4 className="font-heading text-lg font-bold leading-none truncate max-w-[250px] md:max-w-md">{title}</h4>
            {episodeNumber && <p className="text-sm text-muted-foreground mt-1">{episodeNumber}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Slider 
            value={progress} 
            onValueChange={setProgress} 
            max={100} 
            step={1} 
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>12:45</span>
            <span>{duration || "58:00"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hover:text-primary text-muted-foreground">
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              className="h-12 w-12 rounded-full bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
            </Button>
            <Button variant="ghost" size="icon" className="hover:text-primary text-muted-foreground">
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 w-24 md:w-32">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider defaultValue={[75]} max={100} step={1} className="w-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}
