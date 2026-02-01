import { useRoute, Link } from "wouter";
import { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { cn } from "@/lib/utils";
import { SPORTS, type EspnSportKey } from "@/lib/espn";
import { formatEtYyyyMmDd, getNcaafFallbackWeeks, ncaafSeasonYear, parseCalendarWeeks, type WeekEntry } from "@/lib/espnCalendar";
import { useEspnScores } from "@/hooks/useEspnScores";
import { format } from "date-fns";
import { MmaEventCard } from "@/components/mma/MmaEventCard";

const ET = "America/New_York";

/** Format game date/time like schedule: "Thursday, Sept 4, 8:20 PM ET" for week-based, or short date+time for others. */
function formatGameDateTime(isoDate: string | undefined, isWeekBased: boolean): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isWeekBased) {
    const weekday = d.toLocaleDateString("en-US", { timeZone: ET, weekday: "long" });
    const monthDay = d.toLocaleDateString("en-US", { timeZone: ET, month: "short", day: "numeric" });
    const time = d.toLocaleTimeString("en-US", { timeZone: ET, hour: "numeric", minute: "2-digit", hour12: true });
    return `${weekday}, ${monthDay}, ${time} ET`;
  }
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function formatEspnDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function toLocalDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildDateRange(start: Date, end: Date): string {
  return `${formatEspnDate(start)}-${formatEspnDate(end)}`;
}

async function findAdjacentGameDate(
  sportKey: EspnSportKey,
  startDate: Date,
  direction: "next" | "prev"
): Promise<Date | null> {
  const maxForward = 180;
  const maxBackward = 180;
  const step = 14;
  const base = toLocalDateOnly(startDate);

  const scan = async (forward: boolean) => {
    const max = forward ? maxForward : maxBackward;
    for (let offset = 1; offset <= max; offset += step) {
      const rangeStart = new Date(base);
      const rangeEnd = new Date(base);
      if (forward) {
        rangeStart.setDate(rangeStart.getDate() + offset);
        rangeEnd.setDate(rangeEnd.getDate() + Math.min(offset + step - 1, max));
      } else {
        rangeEnd.setDate(rangeEnd.getDate() - offset);
        rangeStart.setDate(rangeStart.getDate() - Math.min(offset + step - 1, max));
      }
      const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${buildDateRange(rangeStart, rangeEnd)}`);
      if (!res.ok) continue;
      const json = await res.json();
      const events = json?.events ?? [];
      if (!events.length) continue;
      const dates = events
        .map((e: any) => e?.date ? new Date(e.date) : null)
        .filter(Boolean) as Date[];
      dates.sort((a, b) => a.getTime() - b.getTime());
      const candidate = forward
        ? dates.find((d) => d.getTime() >= rangeStart.getTime())
        : dates.reverse().find((d) => d.getTime() <= rangeEnd.getTime());
      if (candidate) return toLocalDateOnly(candidate);
    }
    return null;
  };

  if (direction === "next") {
    return (await scan(true)) ?? (await scan(false));
  }
  return (await scan(false)) ?? (await scan(true));
}

async function findNextGameDate(sportKey: EspnSportKey, startDate: Date): Promise<Date | null> {
  const maxForward = 180;
  const maxBackward = 180;
  const step = 14;
  const base = toLocalDateOnly(startDate);

  for (let offset = 1; offset <= maxForward; offset += step) {
    const rangeStart = new Date(base);
    rangeStart.setDate(rangeStart.getDate() + offset);
    const rangeEnd = new Date(base);
    rangeEnd.setDate(rangeEnd.getDate() + Math.min(offset + step - 1, maxForward));
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${buildDateRange(rangeStart, rangeEnd)}`);
    if (!res.ok) continue;
    const json = await res.json();
    const events = json?.events ?? [];
    if (!events.length) continue;
    const nextEvent = events
      .map((e: any) => e?.date ? new Date(e.date) : null)
      .filter(Boolean)
      .sort((a: any, b: any) => a.getTime() - b.getTime())
      .find((d: Date) => d.getTime() >= rangeStart.getTime());
    if (nextEvent) return toLocalDateOnly(nextEvent);
  }

  for (let offset = 1; offset <= maxBackward; offset += step) {
    const rangeEnd = new Date(base);
    rangeEnd.setDate(rangeEnd.getDate() - offset);
    const rangeStart = new Date(base);
    rangeStart.setDate(rangeStart.getDate() - Math.min(offset + step - 1, maxBackward));
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${buildDateRange(rangeStart, rangeEnd)}`);
    if (!res.ok) continue;
    const json = await res.json();
    const events = json?.events ?? [];
    if (!events.length) continue;
    const prevEvent = events
      .map((e: any) => e?.date ? new Date(e.date) : null)
      .filter(Boolean)
      .sort((a: any, b: any) => b.getTime() - a.getTime())
      .find((d: Date) => d.getTime() <= rangeEnd.getTime());
    if (prevEvent) return toLocalDateOnly(prevEvent);
  }

  return null;
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
  const isMma = sportKey === "ufc";
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
  const [filter, setFilter] = useState("all");
  const [conferences, setConferences] = useState<ConferenceGroup[]>([]);
  const [weeks, setWeeks] = useState<WeekEntry[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const weekScrollRef = useRef<HTMLDivElement>(null);
  const autoDateSearchRef = useRef<string>("");
  const arrowNavRef = useRef(false);
  const [mmaEvents, setMmaEvents] = useState<any[]>([]);
  const [mmaLoading, setMmaLoading] = useState(false);
  const [mmaError, setMmaError] = useState<string | null>(null);

  const isCollegeSport = sportKey === "ncaaf" || sportKey === "ncaab";
  const isWeekBasedSport = sportKey === "nfl" || sportKey === "ncaaf";

  // Load weeks for NFL and CFB; NCAAF always has fallback weeks if API fails or returns empty
  useEffect(() => {
    if (!isWeekBasedSport) {
      setWeeks([]);
      setSelectedWeek("");
      return;
    }

    async function loadCalendar() {
      try {
        const yearParam = sportKey === "ncaaf" ? `?year=${ncaafSeasonYear()}` : "";
        const res = await fetch(`/api/espn/calendar/${sportKey}${yearParam}`);
        let parsedWeeks: WeekEntry[] = [];
        if (res.ok) {
          const data = await res.json();
          parsedWeeks = parseCalendarWeeks(data);
        }
        if (sportKey === "ncaaf" && parsedWeeks.length === 0) {
          parsedWeeks = getNcaafFallbackWeeks();
        }
        if (parsedWeeks.length === 0) return;

        setWeeks(parsedWeeks);
        const today = new Date();
        const currentWeek = parsedWeeks.find((w) => {
          const start = new Date(w.startDate);
          const end = new Date(w.endDate);
          return today >= start && today <= end;
        });
        if (currentWeek) {
          setSelectedWeek(currentWeek.value);
          setSelectedDate(new Date(currentWeek.startDate));
          setSelectedEndDate(new Date(currentWeek.endDate));
        } else {
          const nextWeek = parsedWeeks.find((w) => new Date(w.startDate) > today);
          const fallbackWeek = nextWeek ?? parsedWeeks[parsedWeeks.length - 1];
          setSelectedWeek(fallbackWeek.value);
          setSelectedDate(new Date(fallbackWeek.startDate));
          setSelectedEndDate(new Date(fallbackWeek.endDate));
        }
      } catch (e) {
        console.error("Failed to load calendar:", e);
        if (sportKey === "ncaaf") {
          const fallback = getNcaafFallbackWeeks();
          setWeeks(fallback);
          const today = new Date();
          const current = fallback.find((w) => {
            const start = new Date(w.startDate);
            const end = new Date(w.endDate);
            return today >= start && today <= end;
          });
          const week = current ?? fallback[fallback.length - 1];
          setSelectedWeek(week.value);
          setSelectedDate(new Date(week.startDate));
          setSelectedEndDate(new Date(week.endDate));
        }
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

  // NCAAF: when selected week is CFP/Bowls/Playoff, use seasontype=3 so only CFP games show (see ESPN week/999/year/2025/seasontype/3)
  const selectedWeekEntry = useMemo(() => weeks.find((w) => w.value === selectedWeek), [weeks, selectedWeek]);
  const isCFPWeek = sportKey === "ncaaf" && selectedWeekEntry?.label && /CFP|BOWL|Playoff|Postseason|Semifinals|Championship/i.test(selectedWeekEntry.label);
  const seasontype = isCFPWeek ? 3 : undefined;

  const { cfg, games, loading, error } = useEspnScores(
    sportKey,
    selectedDate,
    filter !== "all" ? filter : undefined,
    isWeekBasedSport ? selectedEndDate : undefined,
    seasontype
  );

  useEffect(() => {
    if (!isMma || !selectedDate) return;
    let mounted = true;
    async function loadMma() {
      try {
        setMmaLoading(true);
        setMmaError(null);
        const dateStr = formatEtYyyyMmDd(selectedDate);
        const res = await fetch(`/api/espn/scoreboard/ufc?dates=${dateStr}`);
        if (!res.ok) throw new Error(`Failed to fetch MMA events (${res.status})`);
        const data = await res.json();
        const events = Array.isArray(data?.events) ? data.events : [];
        const details = await Promise.all(
          events.map(async (e: any) => {
            const id = e?.id ? String(e.id) : "";
            if (!id) return null;
            const detailRes = await fetch(`/api/espn/mma/event/${id}`);
            if (!detailRes.ok) return null;
            return detailRes.json();
          })
        );
        if (mounted) setMmaEvents(details.filter(Boolean));
      } catch (e: any) {
        if (mounted) setMmaError(e?.message ?? "Failed to load MMA events");
      } finally {
        if (mounted) setMmaLoading(false);
      }
    }
    loadMma();
    return () => { mounted = false; };
  }, [isMma, selectedDate]);

  // Group week-based (NFL/NCAAF) games by day (ET) like schedule page
  const gamesByDate = useMemo(() => {
    if (!isWeekBasedSport || !games.length) return [];
    const map = new Map<string, typeof games>();
    for (const g of games) {
      if (!g?.date) continue;
      const d = new Date(g.date);
      const key = d.toLocaleDateString("en-CA", { timeZone: ET });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((key) => ({
      dateKey: key,
      dateLabel: new Date(key + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: ET, weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      games: map.get(key)!,
    }));
  }, [games, isWeekBasedSport]);

  // Default date for date-based sports: if today has no games, show next date with games (or last date with games)
  const isToday = useMemo(() => {
    if (!selectedDate) return false;
    const t = new Date();
    return selectedDate.getDate() === t.getDate() && selectedDate.getMonth() === t.getMonth() && selectedDate.getFullYear() === t.getFullYear();
  }, [selectedDate]);
  useEffect(() => {
    const hasEvents = isMma ? mmaEvents.length > 0 : games.length > 0;
    if (isWeekBasedSport || loading || hasEvents || !isToday) return;
    const dateKey = selectedDate.toISOString().split("T")[0];
    if (autoDateSearchRef.current === dateKey) return;
    autoDateSearchRef.current = dateKey;
    let active = true;
    (async () => {
      const next = await findNextGameDate(sportKey, selectedDate);
      if (active && next) setSelectedDate(next);
    })();
    return () => { active = false; };
  }, [isWeekBasedSport, loading, games.length, mmaEvents.length, isToday, selectedDate, sportKey, isMma]);

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
  const displayError = isMma ? mmaError : error;
  const displayLoading = isMma ? mmaLoading : loading;

  const handlePrevDay = async () => {
    if (isWeekBasedSport || arrowNavRef.current) return;
    arrowNavRef.current = true;
    try {
      const target = await findAdjacentGameDate(sportKey, selectedDate, "prev");
      if (target) setSelectedDate(target);
    } finally {
      arrowNavRef.current = false;
    }
  };

  const handleNextDay = async () => {
    if (isWeekBasedSport || arrowNavRef.current) return;
    arrowNavRef.current = true;
    try {
      const target = await findAdjacentGameDate(sportKey, selectedDate, "next");
      if (target) setSelectedDate(target);
    } finally {
      arrowNavRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />
      
      {/* Page Title */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">
            {cfg.label} Scoreboard
          </h1>
        </div>
      </div>

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
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container px-4 md:px-6 py-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          {/* Date picker - only for non-week-based sports */}
          {!isWeekBasedSport && (
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevDay}
                data-testid="button-prev-day"
                className="shrink-0 hover:bg-primary/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "min-w-[260px] justify-start text-left font-normal uppercase font-bold tracking-wider shrink-0",
                      !selectedDate && "text-muted-foreground"
                    )}
                    data-testid="button-date-picker"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
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
                className="shrink-0 hover:bg-primary/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="shrink-0 ml-1 uppercase font-bold tracking-wider text-xs text-primary hover:text-primary/80"
                data-testid="button-today"
              >
                Today
              </Button>
            </div>
          )}

          {/* Filter dropdown - for college sports */}
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

        {displayError && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {displayError}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              If ESPN blocks browser requests, we can switch to a proper API provider via backend.
            </div>
          </div>
        )}

        {/* Week-based (NFL/NCAAF): group by day like schedule */}
        {isWeekBasedSport && !isMma && !displayLoading && gamesByDate.length > 0 && (
          <div className="space-y-8">
            {gamesByDate.map(({ dateKey, dateLabel, games: dayGames }) => (
              <div key={dateKey}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">{dateLabel}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dayGames.map((g: any) =>
                    !g || !g.away || !g.home ? null : (
                      <Link key={g.id} href={`/sport/${sportKey}/game/${g.id}`} data-testid={`card-game-${g.id}`} className="block group">
                        <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-border transition-all overflow-hidden">
                          <div className="flex justify-between items-center px-4 py-2 bg-muted/30 border-b border-border/40">
                            <Badge variant="secondary" className={cn("rounded text-[10px] font-bold px-2 py-0.5", g.state === "in" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground")}>
                              {g.status}
                            </Badge>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {g.away?.logo ? <img src={g.away.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted grid place-items-center font-bold text-[10px]">{g.away?.abbr?.charAt(0) || "A"}</div>}
                                <div className="flex items-center gap-2">
                                  {g.away?.rank && g.away.rank <= 25 && <span className="text-xs text-muted-foreground font-bold">{g.away.rank}</span>}
                                  <span className="font-bold text-sm">{g.away?.name || "Away"}</span>
                                </div>
                              </div>
                              <div className={cn("font-mono text-xl font-black tabular-nums", g.state === "post" && (g.away?.score ?? 0) > (g.home?.score ?? 0) ? "text-foreground" : "text-muted-foreground")}>{g.away?.score ?? "-"}</div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {g.home?.logo ? <img src={g.home.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted grid place-items-center font-bold text-[10px]">{g.home?.abbr?.charAt(0) || "H"}</div>}
                                <div className="flex items-center gap-2">
                                  {g.home?.rank && g.home.rank <= 25 && <span className="text-xs text-muted-foreground font-bold">{g.home.rank}</span>}
                                  <span className="font-bold text-sm">{g.home?.name || "Home"}</span>
                                </div>
                              </div>
                              <div className={cn("font-mono text-xl font-black tabular-nums", g.state === "post" && (g.home?.score ?? 0) > (g.away?.score ?? 0) ? "text-foreground" : "text-muted-foreground")}>{g.home?.score ?? "-"}</div>
                            </div>
                          </div>
                          <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex justify-between items-center gap-2">
                            <span className="text-xs text-muted-foreground shrink-0">{formatGameDateTime(g.date, true)}</span>
                            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors shrink-0">Gamecast →</span>
                          </div>
                        </Card>
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isMma && !displayLoading && mmaEvents.length > 0 && (
          <div className="space-y-6">
            {mmaEvents.map((event) => (
              <MmaEventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Date-based or loading: flat grid */}
        {(!isWeekBasedSport || displayLoading || gamesByDate.length === 0) && !isMma && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(displayLoading ? Array(9).fill(0) : games).map((g: any, idx: number) =>
              displayLoading ? (
                <Card key={idx} className="h-32 animate-pulse bg-card" />
              ) : !g || !g.away || !g.home ? null : (
                <Link key={g.id} href={`/sport/${sportKey}/game/${g.id}`} data-testid={`card-game-${g.id}`} className="block group">
                  <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-border transition-all overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-2 bg-muted/30 border-b border-border/40">
                      <Badge variant="secondary" className={cn("rounded text-[10px] font-bold px-2 py-0.5", g.state === "in" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground")}>{g.status}</Badge>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {g.away?.logo ? <img src={g.away.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted grid place-items-center font-bold text-[10px]">{g.away?.abbr?.charAt(0) || "A"}</div>}
                          <div className="flex items-center gap-2">
                            {g.away?.rank && g.away.rank <= 25 && <span className="text-xs text-muted-foreground font-bold">{g.away.rank}</span>}
                            <span className="font-bold text-sm">{g.away?.name || "Away"}</span>
                          </div>
                        </div>
                        <div className={cn("font-mono text-xl font-black tabular-nums", g.state === "post" && (g.away?.score ?? 0) > (g.home?.score ?? 0) ? "text-foreground" : "text-muted-foreground")}>{g.away?.score ?? "-"}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {g.home?.logo ? <img src={g.home.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted grid place-items-center font-bold text-[10px]">{g.home?.abbr?.charAt(0) || "H"}</div>}
                          <div className="flex items-center gap-2">
                            {g.home?.rank && g.home.rank <= 25 && <span className="text-xs text-muted-foreground font-bold">{g.home.rank}</span>}
                            <span className="font-bold text-sm">{g.home?.name || "Home"}</span>
                          </div>
                        </div>
                        <div className={cn("font-mono text-xl font-black tabular-nums", g.state === "post" && (g.home?.score ?? 0) > (g.away?.score ?? 0) ? "text-foreground" : "text-muted-foreground")}>{g.home?.score ?? "-"}</div>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex justify-between items-center gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">{formatGameDateTime(g.date, isWeekBasedSport)}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors shrink-0">Gamecast →</span>
                    </div>
                  </Card>
                </Link>
              )
            )}
          </div>
        )}

        {!displayLoading && !isMma && games.length === 0 && (
          <Card className="p-6 bg-card border-border" data-testid="empty-scores">
            <div className="text-sm text-muted-foreground">No games found for the selected date and filter.</div>
          </Card>
        )}

        {!displayLoading && isMma && mmaEvents.length === 0 && (
          <Card className="p-6 bg-card border-border" data-testid="empty-scores-mma">
            <div className="text-sm text-muted-foreground">No fight cards found for the selected date.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
