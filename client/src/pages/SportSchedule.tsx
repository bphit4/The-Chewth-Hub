import { useMemo, useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

function yyyymmddFromDateInput(v: string) {
  const clean = v?.trim();
  if (!clean) return null;
  const parts = clean.split("-");
  if (parts.length !== 3) return null;
  return `${parts[0]}${parts[1]}${parts[2]}`;
}

interface ScheduleEvent {
  id: string;
  name: string;
  date: string;
  status: string;
  state: string;
  home: { name: string; abbr: string; logo?: string; score?: string; rank?: number };
  away: { name: string; abbr: string; logo?: string; score?: string; rank?: number };
}

function normalizeEvents(data: any): ScheduleEvent[] {
  const events = data?.events ?? [];
  return events.map((e: any) => {
    const comp = e?.competitions?.[0];
    const comps = comp?.competitors ?? [];
    const home = comps.find((c: any) => c.homeAway === "home");
    const away = comps.find((c: any) => c.homeAway === "away");

    return {
      id: String(e?.id ?? ""),
      name: e?.name ?? "",
      date: e?.date ?? "",
      status: e?.status?.type?.shortDetail ?? "",
      state: e?.status?.type?.state ?? "",
      home: {
        name: home?.team?.displayName ?? "Home",
        abbr: home?.team?.abbreviation ?? "HOME",
        logo: home?.team?.logo ?? home?.team?.logos?.[0]?.href,
        score: home?.score,
        rank: home?.curatedRank?.current && home.curatedRank.current <= 25 ? home.curatedRank.current : undefined,
      },
      away: {
        name: away?.team?.displayName ?? "Away",
        abbr: away?.team?.abbreviation ?? "AWAY",
        logo: away?.team?.logo ?? away?.team?.logos?.[0]?.href,
        score: away?.score,
        rank: away?.curatedRank?.current && away.curatedRank.current <= 25 ? away.curatedRank.current : undefined,
      },
    };
  });
}

export default function SportSchedule() {
  const [match, params] = useRoute("/sport/:sport/schedule");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);
  const isWeekBasedSport = sportKey === "nfl" || sportKey === "ncaaf";

  const [date, setDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const dates = useMemo(() => yyyymmddFromDateInput(date), [date]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const dateParam = dates ? `?dates=${dates}` : "";
        const res = await fetch(`/api/espn/scoreboard/${sportKey}${dateParam}`);
        if (!res.ok) throw new Error(`Failed to fetch schedule (${res.status})`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load schedule");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 2 * 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, [sportKey, dates]);

  const events = useMemo(() => normalizeEvents(data), [data]);

  if (!match || !cfg) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />
      
      {/* Page Title */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">
            {cfg.label} Schedule
          </h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        <div className="mb-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          {/* Show date picker only for non-week-based sports */}
          {!isWeekBasedSport ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() - 1);
                  setDate(d.toISOString().split('T')[0]);
                }}
                data-testid="button-schedule-prev"
                className="hover:bg-primary/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-schedule-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-[180px]"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() + 1);
                  setDate(d.toISOString().split('T')[0]);
                }}
                data-testid="button-schedule-next"
                className="hover:bg-primary/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
                }}
                data-testid="button-schedule-today"
                className="uppercase font-bold tracking-wider text-xs text-primary hover:text-primary/80"
              >
                Today
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground" data-testid="text-schedule-week-note">
              Use the Scores page for week-by-week {cfg.label} schedule
            </div>
          )}
          <Link href={`/sport/${sportKey}/scores`} data-testid="link-schedule-scores" className="block">
            <Button data-testid="button-schedule-scores" size="sm" variant="outline" className="uppercase font-bold tracking-wider">
              View Scores
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(loading ? Array(9).fill(0) : events).map((e: any, idx: number) =>
            loading ? (
              <Card key={idx} className="h-32 animate-pulse bg-card border-border" data-testid={`skeleton-event-${idx}`} />
            ) : (
              <Link
                key={e.id}
                href={`/sport/${sportKey}/game/${e.id}`}
                className="block group"
                data-testid={`card-schedule-event-${e.id}`}
              >
                <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-border transition-all overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-2 bg-muted/30 border-b border-border/40">
                    <Badge
                      variant="secondary"
                      className="rounded text-[10px] font-bold px-2 py-0.5 bg-transparent text-muted-foreground"
                    >
                      {e.status}
                    </Badge>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {e.away.logo ? (
                          <img src={e.away.logo} alt="" className="h-6 w-6 object-contain" />
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted" />
                        )}
                        <div className="flex items-center gap-2">
                          {e.away.rank && (
                            <span className="text-xs text-muted-foreground font-bold">{e.away.rank}</span>
                          )}
                          <span className="font-bold text-sm" data-testid={`text-away-${e.id}`}>{e.away.name}</span>
                        </div>
                      </div>
                      <div className="font-mono text-lg font-black" data-testid={`text-away-score-${e.id}`}>{e.away.score ?? "—"}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {e.home.logo ? (
                          <img src={e.home.logo} alt="" className="h-6 w-6 object-contain" />
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted" />
                        )}
                        <div className="flex items-center gap-2">
                          {e.home.rank && (
                            <span className="text-xs text-muted-foreground font-bold">{e.home.rank}</span>
                          )}
                          <span className="font-bold text-sm" data-testid={`text-home-${e.id}`}>{e.home.name}</span>
                        </div>
                      </div>
                      <div className="font-mono text-lg font-black" data-testid={`text-home-score-${e.id}`}>{e.home.score ?? "—"}</div>
                    </div>
                  </div>

                  <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground" data-testid={`text-event-date-${e.id}`}>
                      {e.date ? new Date(e.date).toLocaleString() : ""}
                    </span>
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      Details →
                    </span>
                  </div>
                </Card>
              </Link>
            )
          )}
        </div>

        {!loading && !events.length && (
          <Card className="mt-6 p-6 bg-card border-border" data-testid="empty-schedule">
            <div className="text-sm text-muted-foreground">No events found for that date.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
