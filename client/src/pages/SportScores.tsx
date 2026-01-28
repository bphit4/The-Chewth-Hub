import { useRoute, Link } from "wouter";
import { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ChevronRight, CalendarIcon, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { cn } from "@/lib/utils";
import { SPORTS, type EspnSportKey } from "@/lib/espn";
import { useEspnScores } from "@/hooks/useEspnScores";
import { format } from "date-fns";

interface WeekEntry {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
}

function parseCalendarWeeks(data: any): WeekEntry[] {
  const leagues = data?.leagues ?? [];
  const league = leagues[0];
  const calendar = league?.calendar ?? [];
  
  const weeks: WeekEntry[] = [];
  
  for (const season of calendar) {
    const entries = season?.entries ?? [];
    for (const entry of entries) {
      weeks.push({
        label: entry?.label ?? entry?.alternateLabel ?? `Week ${weeks.length + 1}`,
        value: entry?.value ?? String(weeks.length + 1),
        startDate: entry?.startDate ?? "",
        endDate: entry?.endDate ?? ""
      });
    }
  }
  
  return weeks;
}

const sportKeys = SPORTS.map((s) => s.key);

function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

interface ConferenceGroup {
  id: string;
  name: string;
  abbreviation?: string;
  abbr?: string;
}

const CFB_FILTERS = [
  { id: "top25", label: "Top 25" },
  { id: "fbs", label: "All FBS" },
  { id: "fcs", label: "All FCS" },
];

const CBB_FILTERS = [
  { id: "top25", label: "Top 25" },
  { id: "d1", label: "All Division I" },
];

const MAJOR_CFB_CONFERENCES = [
  { id: "1", name: "ACC", abbr: "ACC" },
  { id: "4", name: "Big 12", abbr: "Big 12" },
  { id: "5", name: "Big Ten", abbr: "Big Ten" },
  { id: "9", name: "Pac-12", abbr: "Pac-12" },
  { id: "8", name: "SEC", abbr: "SEC" },
  { id: "151", name: "American", abbr: "AAC" },
  { id: "12", name: "Conference USA", abbr: "CUSA" },
  { id: "15", name: "Mid-American", abbr: "MAC" },
  { id: "17", name: "Mountain West", abbr: "MWC" },
  { id: "37", name: "Sun Belt", abbr: "Sun Belt" },
];

const MAJOR_CBB_CONFERENCES = [
  { id: "2", name: "ACC", abbr: "ACC" },
  { id: "7", name: "Atlantic 10", abbr: "A-10" },
  { id: "8", name: "Big 12", abbr: "Big 12" },
  { id: "3", name: "Big East", abbr: "Big East" },
  { id: "4", name: "Big Ten", abbr: "Big Ten" },
  { id: "21", name: "Pac-12", abbr: "Pac-12" },
  { id: "23", name: "SEC", abbr: "SEC" },
  { id: "62", name: "American", abbr: "AAC" },
  { id: "11", name: "Conference USA", abbr: "CUSA" },
  { id: "16", name: "Mountain West", abbr: "MWC" },
];

export default function SportScores() {
  const [match, params] = useRoute("/sport/:sport/scores");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
  const [filter, setFilter] = useState("all");
  const [conferences, setConferences] = useState<ConferenceGroup[]>([]);
  const [weeks, setWeeks] = useState<WeekEntry[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const weekScrollRef = useRef<HTMLDivElement>(null);

  const isCollegeSport = sportKey === "ncaaf" || sportKey === "ncaab";
  const isWeekBasedSport = sportKey === "nfl" || sportKey === "ncaaf";

  // Load weeks for NFL and CFB
  useEffect(() => {
    if (!isWeekBasedSport) {
      setWeeks([]);
      setSelectedWeek("");
      return;
    }
    
    async function loadCalendar() {
      try {
        const res = await fetch(`/api/espn/calendar/${sportKey}`);
        if (res.ok) {
          const data = await res.json();
          const parsedWeeks = parseCalendarWeeks(data);
          setWeeks(parsedWeeks);
          
          // Find current week based on today's date
          const today = new Date();
          const currentWeek = parsedWeeks.find(w => {
            const start = new Date(w.startDate);
            const end = new Date(w.endDate);
            return today >= start && today <= end;
          });
          
          if (currentWeek) {
            setSelectedWeek(currentWeek.value);
            setSelectedDate(new Date(currentWeek.startDate));
            setSelectedEndDate(new Date(currentWeek.endDate));
          } else if (parsedWeeks.length > 0) {
            // Default to last week if not in season
            const lastWeek = parsedWeeks[parsedWeeks.length - 1];
            setSelectedWeek(lastWeek.value);
            setSelectedDate(new Date(lastWeek.startDate));
            setSelectedEndDate(new Date(lastWeek.endDate));
          }
        }
      } catch (e) {
        console.error("Failed to load calendar:", e);
      }
    }
    loadCalendar();
  }, [sportKey, isWeekBasedSport]);

  useEffect(() => {
    if (!isCollegeSport) {
      setConferences([]);
      return;
    }
    
    async function loadConferences() {
      try {
        const res = await fetch(`/api/espn/groups/${sportKey}`);
        if (res.ok) {
          const data = await res.json();
          const groups = data?.groups ?? data?.children ?? [];
          const confList = groups.map((g: any) => ({
            id: String(g?.id ?? ""),
            name: g?.name ?? g?.displayName ?? "",
            abbreviation: g?.abbreviation ?? g?.shortName ?? "",
          })).filter((c: ConferenceGroup) => c.id && c.name);
          setConferences(confList);
        }
      } catch (e) {
        console.error("Failed to load conferences:", e);
      }
    }
    loadConferences();
  }, [sportKey, isCollegeSport]);

  const handleWeekChange = (weekValue: string) => {
    setSelectedWeek(weekValue);
    const week = weeks.find(w => w.value === weekValue);
    if (week?.startDate) {
      setSelectedDate(new Date(week.startDate));
      setSelectedEndDate(week.endDate ? new Date(week.endDate) : undefined);
    }
  };

  const scrollWeeks = (direction: 'left' | 'right') => {
    if (weekScrollRef.current) {
      const scrollAmount = 200;
      weekScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const { cfg, games, loading, error } = useEspnScores(sportKey, selectedDate, filter !== "all" ? filter : undefined, isWeekBasedSport ? selectedEndDate : undefined);

  const filterOptions = useMemo(() => {
    if (sportKey === "ncaaf") {
      const opts = [...CFB_FILTERS];
      const confs = conferences.length > 0 ? conferences : MAJOR_CFB_CONFERENCES;
      confs.forEach((c: any) => {
        opts.push({ id: `conf-${c.id}`, label: c.abbreviation || c.abbr || c.name });
      });
      return opts;
    }
    if (sportKey === "ncaab") {
      const opts = [...CBB_FILTERS];
      const confs = conferences.length > 0 ? conferences : MAJOR_CBB_CONFERENCES;
      confs.forEach((c: any) => {
        opts.push({ id: `conf-${c.id}`, label: c.abbreviation || c.abbr || c.name });
      });
      return opts;
    }
    return [];
  }, [sportKey, conferences]);

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

      {/* Week Navigation for NFL and CFB */}
      {isWeekBasedSport && weeks.length > 0 && (
        <div className="border-b border-border bg-card">
          <div className="container px-4 md:px-6">
            <div className="flex items-center gap-2 py-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollWeeks('left')}
                className="shrink-0 h-8 w-8"
                data-testid="button-week-scroll-left"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div
                ref={weekScrollRef}
                className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {weeks.map((week, idx) => (
                  <Button
                    key={`${idx}-${week.value}`}
                    variant={selectedWeek === week.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleWeekChange(week.value)}
                    className={cn(
                      "shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-wider",
                      selectedWeek === week.value ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                    )}
                    data-testid={`button-week-${idx}-${week.value}`}
                  >
                    {week.label}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollWeeks('right')}
                className="shrink-0 h-8 w-8"
                data-testid="button-week-scroll-right"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container px-4 md:px-6 py-8">
        <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
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
                    "w-[200px] justify-start text-left font-normal uppercase font-bold tracking-wider",
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

          {isCollegeSport && filterOptions.length > 0 && (
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px] uppercase font-bold tracking-wider" data-testid="select-filter">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="uppercase font-bold">All Games</SelectItem>
                {filterOptions.map(opt => (
                  <SelectItem key={opt.id} value={opt.id} className="uppercase font-bold">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
            ) : !g || !g.away || !g.home ? null : (
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
                        {g.away?.logo ? (
                          <img src={g.away.logo} alt="" className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-secondary/10 grid place-items-center font-heading font-bold text-xs">
                            {g.away?.abbr || "A"}
                          </div>
                        )}
                        <div>
                          <div className="font-bold leading-tight">{g.away?.name || "Away"}</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{g.away?.abbr || "AWAY"}</div>
                        </div>
                      </div>
                      <div className={cn("font-mono text-3xl font-black", (g.away?.score ?? 0) > (g.home?.score ?? 0) ? "text-accent" : "text-foreground/70")}>
                        {g.away?.score ?? "-"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {g.home?.logo ? (
                          <img src={g.home.logo} alt="" className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-secondary/10 grid place-items-center font-heading font-bold text-xs">
                            {g.home?.abbr || "H"}
                          </div>
                        )}
                        <div>
                          <div className="font-bold leading-tight">{g.home?.name || "Home"}</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{g.home?.abbr || "HOME"}</div>
                        </div>
                      </div>
                      <div className={cn("font-mono text-3xl font-black", (g.home?.score ?? 0) > (g.away?.score ?? 0) ? "text-accent" : "text-foreground/70")}>
                        {g.home?.score ?? "-"}
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

        {!loading && games.length === 0 && (
          <Card className="p-6 bg-card border-border" data-testid="empty-scores">
            <div className="text-sm text-muted-foreground">No games found for the selected date and filter.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
