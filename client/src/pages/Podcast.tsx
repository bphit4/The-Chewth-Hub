import { PODCAST_EPISODES } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Calendar } from "lucide-react";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { useState } from "react";

export default function Podcast() {
  const [activeEpisode, setActiveEpisode] = useState(PODCAST_EPISODES[0]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-secondary py-16 md:py-24 border-b border-white/10">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-white uppercase italic mb-6">
            Podcast <span className="text-primary">Episodes</span>
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg">
            Listen to our latest breakdowns, debates, and interviews.
          </p>
        </div>
      </div>

      {/* Featured Player Section */}
      <div className="container px-4 md:px-6 -mt-12 mb-16 relative z-10">
        <AudioPlayer 
          title={activeEpisode.title} 
          episodeNumber={activeEpisode.id}
          duration={activeEpisode.duration}
        />
      </div>

      {/* Episode Grid */}
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 md:gap-8">
          {PODCAST_EPISODES.map((ep) => (
            <Card 
              key={ep.id} 
              className={`overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4 ${activeEpisode.id === ep.id ? 'border-l-primary bg-secondary/5' : 'border-l-transparent'}`}
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-64 h-48 md:h-auto relative flex-shrink-0">
                  <img 
                    src={ep.imageUrl} 
                    alt={ep.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setActiveEpisode(ep)}>
                    <div className="bg-primary rounded-full p-3 text-white">
                      <Play className="h-8 w-8 ml-1" />
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6 flex flex-col justify-center flex-grow">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
                    <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {ep.date}</span>
                    <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {ep.duration}</span>
                    {ep.featured && <Badge variant="secondary" className="text-[10px] h-5">Featured</Badge>}
                  </div>
                  
                  <h3 className="text-2xl font-heading font-bold mb-2 hover:text-primary cursor-pointer transition-colors" onClick={() => setActiveEpisode(ep)}>
                    {ep.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 line-clamp-2">
                    {ep.description}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-auto">
                    <Button 
                      size="sm" 
                      className="gap-2 bg-secondary text-white hover:bg-secondary/90"
                      onClick={() => setActiveEpisode(ep)}
                    >
                      <Play className="h-4 w-4" /> Play Episode
                    </Button>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
