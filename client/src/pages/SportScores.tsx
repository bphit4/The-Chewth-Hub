import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronRight } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { cn } from "@/lib/utils";
import { SPORTS, type EspnSportKey } from "@/lib/espn";
import { useEspnScores } from "@/hooks/useEspnScores";

const sportKeys = SPORTS.map((s) => s.key);

function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

export default function SportScores() {
  const [match, params] = useRoute("/sport/:sport/scores");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";

  const { cfg, games, loading, error } = useEspnScores(sportKey);

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
            {cfg.label} <span className="text-primary">Scores</span>
          </h1>
          <p className="text-white/70 mt-2">Auto-refreshes every 30 seconds.</p>
        </div>
      </div>

      <SportSubnav sportKey={sportKey} />

      <div className="container px-4 md:px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              If ESPN blocks browser requests, we can switch to a proper API provider via backend.
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(loading ? Array(9).fill(0) : games).map((g: any, idx: number) =>
            loading ? (
              <Card key={idx} className="h-40 animate-pulse bg-card" />
            ) : (
              <Link key={g.id} href={`/sport/${sportKey}/game/${g.id}`} data-testid={`card-game-${g.id}`} className="block">
                <Card className="bg-card border-l-4 border-l-primary p-5 hover:shadow-xl hover:shadow-primary/10 transition-all group relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-center mb-5 pb-2 border-b border-border/60">
                    <span className="font-bold text-xs text-primary uppercase tracking-widest">{cfg.label}</span>
                    <Badge
                      className={cn(
                        "rounded-sm uppercase text-[10px] font-black px-2 py-0.5",
                        g.state === "in" ? "bg-primary text-primary-foreground" : "bg-secondary/10 text-muted-foreground"
                      )}
                    >
                      {g.status}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {g.away.logo ? (
                          <img src={g.away.logo} alt="" className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-secondary/10 grid place-items-center font-heading font-bold text-xs">
                            {g.away.abbr}
                          </div>
                        )}
                        <div>
                          <div className="font-bold leading-tight">{g.away.name}</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{g.away.abbr}</div>
                        </div>
                      </div>
                      <div className={cn("font-mono text-3xl font-black", (g.away.score ?? 0) > (g.home.score ?? 0) ? "text-accent" : "text-foreground/70")}>
                        {g.away.score ?? "-"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {g.home.logo ? (
                          <img src={g.home.logo} alt="" className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-secondary/10 grid place-items-center font-heading font-bold text-xs">
                            {g.home.abbr}
                          </div>
                        )}
                        <div>
                          <div className="font-bold leading-tight">{g.home.name}</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{g.home.abbr}</div>
                        </div>
                      </div>
                      <div className={cn("font-mono text-3xl font-black", (g.home.score ?? 0) > (g.away.score ?? 0) ? "text-accent" : "text-foreground/70")}>
                        {g.home.score ?? "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Click for box score & stats</div>
                    <Button size="sm" variant="outline" className="uppercase font-bold tracking-wider" data-testid={`button-boxscore-${g.id}`}>
                      Box Score
                    </Button>
                  </div>
                </Card>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
