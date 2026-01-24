import { SCORES } from "@/lib/mockData";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Scores() {
  const leagues = ["All", "NFL", "NBA", "MLB", "CFB", "UFC"];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-12 border-b border-white/10">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white uppercase italic">
            Scoreboard
          </h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        <Tabs defaultValue="All" className="w-full">
          <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 mb-8 overflow-x-auto">
            {leagues.map((league) => (
              <TabsTrigger 
                key={league} 
                value={league}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary text-lg px-6 py-3 font-heading font-bold uppercase"
              >
                {league}
              </TabsTrigger>
            ))}
          </TabsList>

          {leagues.map((league) => (
            <TabsContent key={league} value={league} className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {SCORES.filter(s => league === "All" || s.league === league).map((score) => (
                  <Card key={score.id} className="bg-card border-l-4 border-l-primary p-4">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
                       <span className="font-bold text-xs text-muted-foreground uppercase tracking-wider">{score.league}</span>
                       <Badge variant={score.status === 'Live' ? 'destructive' : 'secondary'} className="rounded-sm uppercase text-[10px] font-bold">
                         {score.status === 'Live' ? 'Live' : score.status} {score.time && `• ${score.time}`}
                       </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center font-heading font-bold text-secondary text-sm">
                              {score.homeTeam.substring(0,2)}
                           </div>
                           <span className="font-bold text-lg">{score.homeTeam}</span>
                        </div>
                        <span className="font-mono text-2xl font-bold">{score.homeScore ?? '-'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center font-heading font-bold text-secondary text-sm">
                              {score.awayTeam.substring(0,2)}
                           </div>
                           <span className="font-bold text-lg text-muted-foreground">{score.awayTeam}</span>
                        </div>
                        <span className="font-mono text-2xl font-bold text-muted-foreground">{score.awayScore ?? '-'}</span>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {SCORES.filter(s => league === "All" || s.league === league).length === 0 && (
                   <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/5 rounded-lg border border-dashed border-border">
                      <p>No games scheduled for {league}.</p>
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
