import { useRoute, Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

const ET = "America/New_York";
function formatGameDateTime(isoDate: string | undefined): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const weekday = d.toLocaleDateString("en-US", { timeZone: ET, weekday: "long" });
  const monthDay = d.toLocaleDateString("en-US", { timeZone: ET, month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { timeZone: ET, hour: "numeric", minute: "2-digit", hour12: true });
  return `${weekday}, ${monthDay}, ${time} ET`;
}

interface CFPEvent {
  id: string;
  name: string;
  date: string;
  status: string;
  state: string;
  roundLabel: string;
  home: { name: string; abbr: string; logo?: string; score?: string };
  away: { name: string; abbr: string; logo?: string; score?: string };
}

function normalizeCFPEvents(data: any): CFPEvent[] {
  const events = data?.events ?? [];
  return events.map((e: any) => {
    const comp = e?.competitions?.[0];
    const competitors = comp?.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === "home");
    const away = competitors.find((c: any) => c.homeAway === "away");
    const round = comp?.groups?.[0]?.name ?? e?.week?.text ?? "CFP";
    return {
      id: String(e?.id ?? ""),
      name: e?.name ?? "",
      date: e?.date ?? "",
      status: e?.status?.type?.shortDetail ?? "",
      state: e?.status?.type?.state ?? "pre",
      roundLabel: round,
      home: {
        name: home?.team?.displayName ?? "TBD",
        abbr: home?.team?.abbreviation ?? "",
        logo: home?.team?.logos?.[0]?.href ?? home?.team?.logo,
        score: home?.score,
      },
      away: {
        name: away?.team?.displayName ?? "TBD",
        abbr: away?.team?.abbreviation ?? "",
        logo: away?.team?.logos?.[0]?.href ?? away?.team?.logo,
        score: away?.score,
      },
    };
  });
}

export default function SportCFP() {
  const [match, params] = useRoute("/sport/:sport/cfp");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "ncaaf";
  const cfg = getSportConfig(sportKey);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sportKey !== "ncaaf") {
      setLoading(false);
      return;
    }
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/espn/scoreboard/${sportKey}?seasontype=3`);
        if (!res.ok) throw new Error(`Failed to load CFP (${res.status})`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load CFP");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [sportKey]);

  const events = useMemo(() => normalizeCFPEvents(data), [data]);
  const byRound = useMemo(() => {
    const map = new Map<string, CFPEvent[]>();
    for (const e of events) {
      const round = e.roundLabel || "CFP";
      if (!map.has(round)) map.set(round, []);
      map.get(round)!.push(e);
    }
    const order = ["Semifinals", "Semifinal", "National Championship", "CFP National Championship", "College Football Playoff"];
    return Array.from(map.entries()).sort((a, b) => {
      const ai = order.findIndex((x) => a[0].includes(x) || x.includes(a[0]));
      const bi = order.findIndex((x) => b[0].includes(x) || x.includes(b[0]));
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a[0].localeCompare(b[0]);
    });
  }, [events]);

  if (!match || !cfg) return null;

  if (sportKey !== "ncaaf") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <SportSubnav sportKey={sportKey} />
        <div className="border-b border-border/50 bg-card/50">
          <div className="container px-4 md:px-6 py-4">
            <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">College Football Playoff</h1>
          </div>
        </div>
        <div className="container px-4 md:px-6 py-8">
          <Card className="p-8 bg-card border-border text-center" data-testid="card-cfp-placeholder">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">College Football Playoff is available under NCAAF.</p>
            <Link href="/sport/ncaaf/cfp">
              <Button className="mt-4" variant="outline">Go to NCAAF CFP</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">College Football Playoff</h1>
        </div>
      </div>
      <div className="container px-4 md:px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          </div>
        )}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="h-32 animate-pulse bg-card border-border" />
            ))}
          </div>
        )}
        {!loading && events.length === 0 && (
          <Card className="p-8 bg-card border-border text-center" data-testid="card-cfp-placeholder">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2" data-testid="text-cfp-title">CFP Coming Soon</h2>
            <p className="text-muted-foreground" data-testid="text-cfp-description">
              College Football Playoff rankings, brackets, and game results will appear here during the CFP season.
            </p>
            <Link href={`/sport/${sportKey}/bracket`}>
              <Button className="mt-4" variant="outline">View Bracket</Button>
            </Link>
          </Card>
        )}
        {!loading && byRound.length > 0 && (
          <div className="space-y-8">
            {byRound.map(([round, roundEvents]) => (
              <div key={round}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">{round}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {roundEvents.map((e) => (
                    <Link key={e.id} href={`/sport/${sportKey}/game/${e.id}`} className="block group">
                      <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-border transition-all overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-2 bg-muted/30 border-b border-border/40">
                          <Badge variant="secondary" className={cn("rounded text-[10px] font-bold px-2 py-0.5", e.state === "in" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground")}>
                            {e.status}
                          </Badge>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {e.away.logo ? <img src={e.away.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted grid place-items-center font-bold text-[10px]">{e.away.abbr?.slice(0, 1) || "A"}</div>}
                              <span className="font-bold text-sm">{e.away.name}</span>
                            </div>
                            <div className="font-mono text-xl font-black tabular-nums">{e.away.score ?? "—"}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {e.home.logo ? <img src={e.home.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted grid place-items-center font-bold text-[10px]">{e.home.abbr?.slice(0, 1) || "H"}</div>}
                              <span className="font-bold text-sm">{e.home.name}</span>
                            </div>
                            <div className="font-mono text-xl font-black tabular-nums">{e.home.score ?? "—"}</div>
                          </div>
                        </div>
                        <div className="px-4 py-2 border-t border-border/40 bg-muted/20 text-xs text-muted-foreground">
                          {formatGameDateTime(e.date)}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="pt-4 flex gap-4 flex-wrap">
              <Link href={`/sport/${sportKey}/bracket`}>
                <Button variant="outline" className="uppercase font-bold tracking-wider">View CFP Bracket</Button>
              </Link>
              <Link href={`/sport/${sportKey}/playoffs`}>
                <Button variant="ghost" className="uppercase font-bold tracking-wider">All Playoff Games</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
