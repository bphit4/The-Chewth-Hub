import { useRoute, Link } from "wouter";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertCircle, ChevronRight, CalendarIcon, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { cn } from "@/lib/utils";
import { SPORTS, type EspnSportKey } from "@/lib/espn";
import { useEspnScores } from "@/hooks/useEspnScores";
import { format } from "date-fns";

const sportKeys = SPORTS.map((s) => s.key);

function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

export default function SportScores() {
  const [match, params] = useRoute("/sport/:sport/scores");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { cfg, games, loading, error } = useEspnScores(sportKey, selectedDate);

  if (!match || !cfg) return null;

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

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
        {/* Date Picker Section */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevDay}
              data-testid="button-prev-day"
              className="hover:bg-primary/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal uppercase font-bold tracking-wider",
                    !selectedDate && "text-muted-foreground"
                  )}
                  data-testid="button-date-picker"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              data-testid="button-next-day"
              className="hover:bg-primary/10"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            className="uppercase font-bold tracking-wider text-xs text-primary hover:text-primary/80"
            data-testid="button-today"
          >
            Today
          </Button>
        </div>
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
