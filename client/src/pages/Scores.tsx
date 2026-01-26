import { SCORES } from "@/lib/mockData";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface ApiScore {
  id: string;
  league: string;
  status: string;
  homeTeam: string;
  homeScore?: number;
  awayTeam: string;
  awayScore?: number;
  time?: string;
}

export default function Scores() {
  const leagues = ["All", "NFL", "NBA", "MLB", "CFB"];
  const [apiScores, setApiScores] = useState<ApiScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      try {
        const sportLeagues = ['nfl', 'nba', 'mlb', 'college-football'];
        const results = await Promise.all(
          sportLeagues.map(async (league) => {
            const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${league === 'college-football' ? 'football/college-football' : league === 'nfl' ? 'football/nfl' : league === 'nba' ? 'basketball/nba' : 'baseball/mlb'}/scoreboard`);
            const data = await res.json();
            return data.events.map((event: any) => ({
              id: event.id,
              league: league === 'college-football' ? 'CFB' : league.toUpperCase(),
              status: event.status.type.shortDetail,
              homeTeam: event.competitions[0].competitors[0].team.displayName,
              homeScore: parseInt(event.competitions[0].competitors[0].score),
              awayTeam: event.competitions[0].competitors[1].team.displayName,
              awayScore: parseInt(event.competitions[0].competitors[1].score),
              time: event.status.type.shortDetail,
              homeLogo: event.competitions[0].competitors[0].team.logo,
              awayLogo: event.competitions[0].competitors[1].team.logo
            }));
          })
        );
        setApiScores(results.flat());
      } catch (error) {
        console.error("Error fetching scores:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchScores();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-12 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />
        <div className="container px-4 md:px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white uppercase italic tracking-tighter">
            Live <span className="text-primary">Scoreboard</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Real-time updates from across the leagues.</p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        <Tabs defaultValue="All" className="w-full">
          <TabsList className="bg-secondary/20 border-b border-border w-full justify-start rounded-none h-auto p-0 mb-8 overflow-x-auto flex-nowrap scrollbar-hide">
            {leagues.map((league) => (
              <TabsTrigger 
                key={league} 
                value={league}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-lg px-8 py-4 font-heading font-bold uppercase tracking-wider transition-all"
              >
                {league}
              </TabsTrigger>
            ))}
          </TabsList>

          {leagues.map((league) => (
            <TabsContent key={league} value={league} className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <Card key={i} className="bg-card border-border p-4 animate-pulse h-40" />
                  ))
                ) : apiScores.filter(s => league === "All" || s.league === league).map((score: any) => (
                  <Card key={score.id} className="bg-card border-l-4 border-l-primary p-5 hover:shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                       <span className="font-heading text-4xl font-black italic">{score.league}</span>
                    </div>
                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-border/50">
                       <span className="font-bold text-xs text-primary uppercase tracking-widest">{score.league}</span>
                       <Badge variant={score.status.includes('Live') || score.status.includes('IN') ? 'destructive' : 'secondary'} className="rounded-sm uppercase text-[10px] font-bold px-2 py-0.5">
                         {score.status}
                       </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           {score.homeLogo ? (
                             <img src={score.homeLogo} alt="" className="w-8 h-8 object-contain" />
                           ) : (
                             <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center font-heading font-bold text-secondary text-xs">
                                {score.homeTeam.substring(0,2)}
                             </div>
                           )}
                           <span className="font-bold text-lg tracking-tight">{score.homeTeam}</span>
                        </div>
                        <span className={cn("font-mono text-3xl font-black", score.homeScore > score.awayScore ? "text-accent" : "text-foreground/80")}>
                          {score.homeScore ?? '0'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           {score.awayLogo ? (
                             <img src={score.awayLogo} alt="" className="w-8 h-8 object-contain" />
                           ) : (
                             <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center font-heading font-bold text-secondary text-xs">
                                {score.awayTeam.substring(0,2)}
                             </div>
                           )}
                           <span className="font-bold text-lg tracking-tight text-foreground/70">{score.awayTeam}</span>
                        </div>
                        <span className={cn("font-mono text-3xl font-black", score.awayScore > score.homeScore ? "text-accent" : "text-foreground/50")}>
                          {score.awayScore ?? '0'}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {!loading && apiScores.filter(s => league === "All" || s.league === league).length === 0 && (
                   <div className="col-span-full py-20 text-center text-muted-foreground bg-secondary/5 rounded-2xl border border-dashed border-border/50">
                      <p className="text-xl font-heading uppercase tracking-widest opacity-50">No Active Games</p>
                      <p className="text-sm mt-2">Check back later for {league} updates.</p>
                   </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
