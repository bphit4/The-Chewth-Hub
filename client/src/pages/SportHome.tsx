import { useRoute, Link } from "wouter";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

export default function SportHome() {
  const [match, params] = useRoute("/sport/:sport");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);

  if (!match || !cfg) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-10 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex items-center gap-3 text-white/80 text-sm font-bold uppercase tracking-widest">
            <span>The Chewth</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{cfg.label}</span>
          </div>
          <h1 className="mt-2 text-3xl md:text-5xl font-heading font-black text-white uppercase italic tracking-tighter">
            {cfg.label} <span className="text-primary">Hub</span>
          </h1>
          <p className="text-white/70 mt-2">
            Scores, standings, stats, teams, schedule, news, and odds — ESPN-style.
          </p>
        </div>
      </div>

      <SportSubnav sportKey={sportKey} />

      <div className="container px-4 md:px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href={`/sport/${sportKey}/scores`} data-testid="link-sporthome-scores" className="block">
            <Card className="p-6 bg-card border-border hover:shadow-xl hover:shadow-primary/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Live</div>
                  <div className="mt-2 font-heading text-3xl font-black uppercase italic tracking-tight">Scores</div>
                  <div className="mt-2 text-sm text-muted-foreground">Auto-refreshing scoreboard</div>
                </div>
                <Badge className="bg-secondary/10 text-muted-foreground border-border uppercase tracking-widest text-[10px] font-black rounded-sm">
                  Open
                </Badge>
              </div>
            </Card>
          </Link>

          <Link href={`/sport/${sportKey}/standings`} data-testid="link-sporthome-standings" className="block">
            <Card className="p-6 bg-card border-border hover:shadow-xl hover:shadow-primary/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Table</div>
                  <div className="mt-2 font-heading text-3xl font-black uppercase italic tracking-tight">Standings</div>
                  <div className="mt-2 text-sm text-muted-foreground">Conference / division view</div>
                </div>
                <Button data-testid="button-sporthome-standings" size="sm" variant="outline" className="uppercase font-bold tracking-wider">
                  View
                </Button>
              </div>
            </Card>
          </Link>

          <Link href={`/sport/${sportKey}/stats`} data-testid="link-sporthome-stats" className="block">
            <Card className="p-6 bg-card border-border hover:shadow-xl hover:shadow-primary/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Leaders</div>
                  <div className="mt-2 font-heading text-3xl font-black uppercase italic tracking-tight">Stats</div>
                  <div className="mt-2 text-sm text-muted-foreground">Player tables & categories</div>
                </div>
                <Button data-testid="button-sporthome-stats" size="sm" variant="outline" className="uppercase font-bold tracking-wider">
                  View
                </Button>
              </div>
            </Card>
          </Link>

          <Link href={`/sport/${sportKey}/teams`} data-testid="link-sporthome-teams" className="block">
            <Card className="p-6 bg-card border-border hover:shadow-xl hover:shadow-primary/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Directory</div>
                  <div className="mt-2 font-heading text-3xl font-black uppercase italic tracking-tight">Teams</div>
                  <div className="mt-2 text-sm text-muted-foreground">Logos, records, quick links</div>
                </div>
                <Button data-testid="button-sporthome-teams" size="sm" variant="outline" className="uppercase font-bold tracking-wider">
                  View
                </Button>
              </div>
            </Card>
          </Link>

          <Link href={`/sport/${sportKey}/schedule`} data-testid="link-sporthome-schedule" className="block">
            <Card className="p-6 bg-card border-border hover:shadow-xl hover:shadow-primary/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Calendar</div>
                  <div className="mt-2 font-heading text-3xl font-black uppercase italic tracking-tight">Schedule</div>
                  <div className="mt-2 text-sm text-muted-foreground">Upcoming games / events</div>
                </div>
                <Button data-testid="button-sporthome-schedule" size="sm" variant="outline" className="uppercase font-bold tracking-wider">
                  View
                </Button>
              </div>
            </Card>
          </Link>

          <Link href={`/sport/${sportKey}/news`} data-testid="link-sporthome-news" className="block">
            <Card className="p-6 bg-card border-border hover:shadow-xl hover:shadow-primary/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Headlines</div>
                  <div className="mt-2 font-heading text-3xl font-black uppercase italic tracking-tight">News</div>
                  <div className="mt-2 text-sm text-muted-foreground">Latest stories per sport</div>
                </div>
                <Button data-testid="button-sporthome-news" size="sm" variant="outline" className="uppercase font-bold tracking-wider">
                  View
                </Button>
              </div>
            </Card>
          </Link>

          <Link href={`/sport/${sportKey}/odds`} data-testid="link-sporthome-odds" className="block">
            <Card className="p-6 bg-card border-border hover:shadow-xl hover:shadow-primary/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Lines</div>
                  <div className="mt-2 font-heading text-3xl font-black uppercase italic tracking-tight">Odds</div>
                  <div className="mt-2 text-sm text-muted-foreground">Spread / ML / O-U (when available)</div>
                </div>
                <Button data-testid="button-sporthome-odds" size="sm" variant="outline" className="uppercase font-bold tracking-wider">
                  View
                </Button>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
