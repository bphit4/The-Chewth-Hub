import { useRoute } from "wouter";
import { PODCAST_EPISODES } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Play, Download, Share2 } from "lucide-react";
import { Link } from "wouter";
import NotFound from "./not-found";
import { AudioPlayer } from "@/components/ui/AudioPlayer";

export default function EpisodeDetail() {
  const [match, params] = useRoute("/podcast/:id");
  const episode = PODCAST_EPISODES.find(e => e.id === params?.id);

  if (!match || !episode) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
       <div className="container px-4 md:px-6 py-8">
         <Link href="/podcast">
            <Button variant="ghost" className="mb-6 gap-2 pl-0 hover:pl-2 transition-all">
              <ArrowLeft className="h-4 w-4" /> Back to Episodes
            </Button>
         </Link>

         <div className="grid gap-12 lg:grid-cols-[400px_1fr]">
            {/* Left Column - Cover & Player */}
            <div className="space-y-6">
               <div className="aspect-square rounded-xl overflow-hidden shadow-2xl relative group">
                  <img src={episode.imageUrl} alt={episode.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="bg-primary rounded-full p-4 text-white">
                        <Play className="h-10 w-10 ml-1" />
                     </div>
                  </div>
               </div>
               
               <AudioPlayer 
                 title={episode.title} 
                 episodeNumber={episode.id}
                 duration={episode.duration}
               />
               
               <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" /> Download
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
               </div>
            </div>

            {/* Right Column - Info */}
            <div className="space-y-8">
               <div>
                 <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary" className="uppercase tracking-wider font-bold">
                       {episode.id.replace('ep-', 'Episode ')}
                    </Badge>
                    <span className="flex items-center text-sm text-muted-foreground font-medium uppercase tracking-wide">
                       <Calendar className="h-4 w-4 mr-2" /> {episode.date}
                    </span>
                    <span className="flex items-center text-sm text-muted-foreground font-medium uppercase tracking-wide">
                       <Clock className="h-4 w-4 mr-2" /> {episode.duration}
                    </span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase italic leading-tight text-foreground mb-6">
                   {episode.title}
                 </h1>
                 <p className="text-xl text-muted-foreground leading-relaxed">
                   {episode.description}
                 </p>
               </div>

               <div className="bg-secondary/5 p-8 rounded-xl border border-border">
                  <h3 className="font-heading text-xl font-bold uppercase mb-4">Listen On</h3>
                  <div className="flex flex-wrap gap-4">
                     <Button className="bg-[#1DB954] hover:bg-[#1ed760] text-white border-none font-bold">
                        Spotify
                     </Button>
                     <Button className="bg-[#FA243C] hover:bg-[#fc4257] text-white border-none font-bold">
                        Apple Podcasts
                     </Button>
                     <Button className="bg-[#FF0000] hover:bg-[#ff3333] text-white border-none font-bold">
                        YouTube
                     </Button>
                  </div>
               </div>

               <div className="prose dark:prose-invert max-w-none">
                  <h3>Show Notes</h3>
                  <ul>
                    <li>00:00 - Intro & Reactions</li>
                    <li>12:30 - College Football Playoff breakdown</li>
                    <li>25:45 - NFL Trade Deadline winners & losers</li>
                    <li>40:10 - MMA 300 Main Card Preview</li>
                    <li>55:00 - Q&A and Outro</li>
                  </ul>
               </div>
            </div>
         </div>
       </div>
    </div>
  );
}
