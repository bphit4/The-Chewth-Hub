import { useMemo, useEffect, useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { AlertCircle, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { getNcaafFallbackWeeks, parseCalendarWeeks, formatEtYyyyMmDd, formatUtcYyyyMmDd, type WeekEntry } from "@/lib/espnCalendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

interface OddsRow {
  id: string;
  label: string;
  status: string;
  provider: string;
  details: string;
  overUnder?: string;
  spread?: string;
  moneylineHome?: string;
  moneylineAway?: string;
  date?: string;
}

function normalizeOdds(data: any): OddsRow[] {
  const events = data?.events ?? [];
  const rows: OddsRow[] = [];

  for (const e of events) {
    const comp = e?.competitions?.[0];
    const odds = comp?.odds?.[0];
    const homeLine = odds?.homeTeamOdds?.moneyLine ?? odds?.homeTeamOdds?.moneyline;
    const awayLine = odds?.awayTeamOdds?.moneyLine ?? odds?.awayTeamOdds?.moneyline;
    rows.push({
      id: String(e?.id ?? comp?.id ?? Math.random()),
      label: e?.name ?? "",
      status: e?.status?.type?.shortDetail ?? "",
      provider: odds?.provider?.name ?? "Odds",
      details: odds?.details ?? "",
      overUnder: odds?.overUnder ? String(odds.overUnder) : undefined,
      spread: odds?.spread ? String(odds.spread) : undefined,
      moneylineHome: homeLine != null ? String(homeLine) : undefined,
      moneylineAway: awayLine != null ? String(awayLine) : undefined,
      date: e?.date,
    });
  }

  return rows;
}

export default function SportOdds() {
  const [match, params] = useRoute("/sport/:sport/odds");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);
  const isWeekBasedSport = sportKey === "nfl" || sportKey === "ncaaf";
  const weekScrollRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
  const [weeks, setWeeks] = useState<WeekEntry[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load calendar for NFL/NCAAF week-based odds
  useEffect(() => {
    if (!isWeekBasedSport) {
      setWeeks([]);
      setSelectedWeek("");
      return;
    }
    let mounted = true;
    async function loadCalendar() {
      try {
        const res = await fetch(`/api/espn/calendar/${sportKey}`);
        if (!res.ok) return;
        const json = await res.json();
        let parsed = parseCalendarWeeks(json);
        if (sportKey === "ncaaf" && parsed.length === 0) parsed = getNcaafFallbackWeeks();
        if (!mounted) return;
        setWeeks(parsed);
        const today = new Date();
        const current = parsed.find((w) => {
          const start = new Date(w.startDate);
          const end = new Date(w.endDate);
          return today >= start && today <= end;
        });
        if (current) {
          setSelectedWeek(current.value);
          setSelectedDate(new Date(current.startDate));
          setSelectedEndDate(new Date(current.endDate));
        } else if (parsed.length > 0) {
          const last = parsed[parsed.length - 1];
          setSelectedWeek(last.value);
          setSelectedDate(new Date(last.startDate));
          setSelectedEndDate(new Date(last.endDate));
        }
      } catch {
        // ignore
      }
    }
    loadCalendar();
    return () => { mounted = false; };
  }, [sportKey, isWeekBasedSport]);

  // Fetch odds by date or date range
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        let dateStr: string;
        if (isWeekBasedSport && selectedEndDate) {
          dateStr = `${formatUtcYyyyMmDd(selectedDate)}-${formatUtcYyyyMmDd(selectedEndDate)}`;
        } else {
          dateStr = formatEtYyyyMmDd(selectedDate);
        }
        const sourceParam = isWeekBasedSport && selectedEndDate ? "" : "&source=cdn";
        const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dateStr}${sourceParam}`);
        if (!res.ok) throw new Error(`Failed to fetch odds (${res.status})`);
        const json = await res.json();
        if (isWeekBasedSport && selectedEndDate) {
          const weekEndMs = selectedEndDate.getTime();
          const events = (json?.events ?? []).filter((e: any) => {
            const t = e?.date ? new Date(e.date).getTime() : 0;
            return t <= weekEndMs;
          });
          if (mounted) setData({ ...json, events });
        } else if (mounted) {
          setData(json);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load odds");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (isWeekBasedSport && !selectedEndDate) {
      setLoading(true);
      return;
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, [sportKey, selectedDate.toDateString(), selectedEndDate?.toDateString(), isWeekBasedSport]);

  const rows = useMemo(() => normalizeOdds(data), [data]);

  const handleWeekChange = (weekValue: string) => {
    setSelectedWeek(weekValue);
    const week = weeks.find((w) => w.value === weekValue);
    if (week?.startDate) {
      setSelectedDate(new Date(week.startDate));
      setSelectedEndDate(week.endDate ? new Date(week.endDate) : undefined);
    }
  };

  const scrollWeeks = (direction: "left" | "right") => {
    weekScrollRef.current?.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
    if (isWeekBasedSport) setSelectedEndDate(undefined);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
    if (isWeekBasedSport) setSelectedEndDate(undefined);
  };

  if (!match || !cfg) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />

      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">
            {cfg.label} Odds
          </h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        {/* Week navigation for NFL/NCAAF */}
        {isWeekBasedSport && weeks.length > 0 && (
          <div className="mb-6 border-b border-border bg-card">
            <div className="flex items-center gap-2 py-3">
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => scrollWeeks("left")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div
                ref={weekScrollRef}
                className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth flex-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
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
                  >
                    {week.label}
                  </Button>
                ))}
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => scrollWeeks("right")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Date picker for non-week-based sports */}
        {!isWeekBasedSport && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="icon" onClick={handlePrevDay} className="shrink-0 hover:bg-primary/10">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("min-w-[260px] justify-start text-left font-normal uppercase font-bold tracking-wider shrink-0", !selectedDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={handleNextDay} className="shrink-0 hover:bg-primary/10">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())} className="shrink-0 ml-1 uppercase font-bold tracking-wider text-xs text-primary hover:text-primary/80">
              Today
            </Button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          </div>
        )}

        {loading && <Card className="h-52 animate-pulse bg-card border-border" data-testid="skeleton-odds" />}

        {!loading && !rows.length && (
          <Card className="p-6 bg-card border-border" data-testid="empty-odds">
            <div className="text-sm text-muted-foreground">
              No odds available for the selected date/week (ESPN doesn't provide odds for every sport/event).
            </div>
            <div className="mt-4">
              <Link href={`/sport/${sportKey}/scores`} data-testid="link-odds-scores" className="block">
                <Button data-testid="button-odds-scores" size="sm" variant="outline" className="uppercase font-bold tracking-wider">
                  Back to Scores
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!loading &&
            rows.map((r) => (
              <Card key={r.id} className="bg-card border-border p-5" data-testid={`card-odds-${r.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-primary text-primary-foreground uppercase font-black tracking-widest text-[10px] rounded-sm" data-testid={`badge-odds-provider-${r.id}`}>
                    {r.provider}
                  </Badge>
                  <div className="text-xs text-muted-foreground" data-testid={`text-odds-status-${r.id}`}>
                    {r.status}
                  </div>
                </div>
                <div className="font-bold leading-tight" data-testid={`text-odds-game-${r.id}`}>
                  {r.label}
                </div>
                {r.date && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.date).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                  </div>
                )}
                <div className="mt-2 text-sm text-muted-foreground" data-testid={`text-odds-details-${r.id}`}>
                  {r.details}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-secondary/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Over/Under</div>
                    <div className="mt-1 font-mono text-lg font-black" data-testid={`text-odds-ou-${r.id}`}>
                      {r.overUnder ?? "—"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Spread</div>
                    <div className="mt-1 font-mono text-lg font-black" data-testid={`text-odds-spread-${r.id}`}>
                      {r.spread ?? "—"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-border bg-secondary/5 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Moneyline</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Home</span>
                    <span>Away</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between font-mono text-lg font-black" data-testid={`text-odds-moneyline-${r.id}`}>
                    <span>{r.moneylineHome ?? "—"}</span>
                    <span>{r.moneylineAway ?? "—"}</span>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
