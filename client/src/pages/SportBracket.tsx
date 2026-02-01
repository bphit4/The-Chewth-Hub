import { useRoute, Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { AlertCircle, GitBranch } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { cn } from "@/lib/utils";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

const ET = "America/New_York";
function formatGameDateTime(isoDate: string | undefined): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const monthDay = d.toLocaleDateString("en-US", { timeZone: ET, month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { timeZone: ET, hour: "numeric", minute: "2-digit", hour12: true });
  return `${monthDay}, ${time} ET`;
}

interface BracketEvent {
  id: string;
  name: string;
  date: string;
  status: string;
  state: string;
  roundLabel: string;
  isCfp: boolean;
  weekNumber?: number;
  conference?: "AFC" | "NFC";
  home: { id?: string; name: string; abbr: string; logo?: string; score?: string; seed?: number; location?: string };
  away: { id?: string; name: string; abbr: string; logo?: string; score?: string; seed?: number; location?: string };
}

const CFP_ROUND_DATES: Record<string, string> = {
  "First Round": "Dec 19-20",
  "Quarterfinals": "Dec 31 - Jan 1",
  "Quarterfinal": "Dec 31 - Jan 1",
  "Semifinals": "Jan 8-9",
  "Semifinal": "Jan 8-9",
  "National Championship": "Jan 19",
  "CFP National Championship": "Jan 19",
};
const CFP_LOGO = "https://a.espncdn.com/redesign/assets/img/logos/organizations/college-football-playoff/primary.svg";

function CfpLogoInline() {
  return (
    <svg viewBox="0 0 240 80" role="img" aria-label="College Football Playoff">
      <rect x="0" y="0" width="240" height="80" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
      <circle cx="40" cy="40" r="18" fill="hsl(var(--primary))" />
      <text x="70" y="35" fontSize="16" fill="hsl(var(--foreground))" fontWeight="700">College Football</text>
      <text x="70" y="56" fontSize="16" fill="hsl(var(--foreground))" fontWeight="700">Playoff</text>
    </svg>
  );
}

function normalizeCfpRound(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("first")) return "First Round";
  if (l.includes("quarter")) return "Quarterfinals";
  if (l.includes("semi")) return "Semifinals";
  if (l.includes("championship") || l.includes("national")) return "National Championship";
  return label;
}

function deriveCfpRoundLabel(event: any, comp: any): string {
  const groupLabel = comp?.groups?.[0]?.name ?? "";
  if (groupLabel) return groupLabel;
  const note =
    comp?.notes?.[0]?.headline ??
    event?.notes?.[0]?.headline ??
    "";
  if (/first round/i.test(note)) return "First Round";
  if (/quarterfinal/i.test(note)) return "Quarterfinals";
  if (/semifinal/i.test(note)) return "Semifinals";
  if (/national championship|cfp national championship|championship/i.test(note)) return "National Championship";

  const name = event?.name ?? "";
  if (/rose bowl|sugar bowl|peach bowl|fiesta bowl/i.test(name)) return "Quarterfinals";
  if (/orange bowl|cotton bowl/i.test(name)) return "Semifinals";
  return event?.week?.text ?? "CFP";
}

function isCfpEvent(event: any, comp: any): boolean {
  const note =
    comp?.notes?.[0]?.headline ??
    event?.notes?.[0]?.headline ??
    "";
  if (/college football playoff/i.test(note)) return true;
  if (/cfp/i.test(note)) return true;
  return /college football playoff|cfp/i.test(event?.name ?? "");
}

function normalizeBracketEvents(data: any): BracketEvent[] {
  const events = data?.events ?? [];
  return events.map((e: any) => {
    const comp = e?.competitions?.[0];
    const competitors = comp?.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === "home");
    const away = competitors.find((c: any) => c.homeAway === "away");
    const round = deriveCfpRoundLabel(e, comp);
    const note =
      comp?.notes?.[0]?.headline ??
      e?.notes?.[0]?.headline ??
      "";
    const conference = /AFC/i.test(note) ? "AFC" : /NFC/i.test(note) ? "NFC" : undefined;
    return {
      id: String(e?.id ?? ""),
      name: e?.name ?? "",
      date: e?.date ?? "",
      status: e?.status?.type?.shortDetail ?? "",
      state: e?.status?.type?.state ?? "pre",
      roundLabel: round,
      isCfp: isCfpEvent(e, comp),
      weekNumber: e?.week?.number ?? comp?.week?.number,
      conference,
      home: {
        id: home?.team?.id,
        name: home?.team?.displayName ?? "TBD",
        abbr: home?.team?.abbreviation ?? "",
        logo: home?.team?.logos?.[0]?.href ?? home?.team?.logo,
        score: home?.score,
        seed: home?.curatedRank?.current ?? home?.seed,
        location: home?.team?.location,
      },
      away: {
        id: away?.team?.id,
        name: away?.team?.displayName ?? "TBD",
        abbr: away?.team?.abbreviation ?? "",
        logo: away?.team?.logos?.[0]?.href ?? away?.team?.logo,
        score: away?.score,
        seed: away?.curatedRank?.current ?? away?.seed,
        location: away?.team?.location,
      },
    };
  });
}

export default function SportBracket() {
  const [match, params] = useRoute("/sport/:sport/bracket");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);
  const isBracketSport = sportKey === "nfl" || sportKey === "ncaaf";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nflSeeds, setNflSeeds] = useState<Record<string, { seed: number; conference?: "AFC" | "NFC"; name?: string; logo?: string }>>({});

  useEffect(() => {
    if (!isBracketSport) {
      setLoading(false);
      return;
    }
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (sportKey === "ncaaf") {
          const url = `/api/espn/scoreboard/${sportKey}?seasontype=3&week=999`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to load bracket (${res.status})`);
          const json = await res.json();
          if (mounted) setData(json);
        } else {
          const weeks = [1, 2, 3, 4, 5];
          const results = await Promise.all(
            weeks.map((week) => fetch(`/api/espn/scoreboard/${sportKey}?seasontype=3&week=${week}`))
          );
          const jsons = await Promise.all(
            results.map(async (res) => {
              if (!res.ok) return null;
              return res.json();
            })
          );
          const events = jsons.flatMap((j: any) => j?.events ?? []).filter(Boolean);
          if (mounted) setData({ events });
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load bracket");
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
  }, [sportKey, isBracketSport]);

  useEffect(() => {
    if (sportKey !== "nfl") return;
    let mounted = true;
    async function loadSeeds() {
      try {
        const res = await fetch(`/api/espn/standings/${sportKey}`);
        if (!res.ok) return;
        const json = await res.json();
        const map: Record<string, { seed: number; conference?: "AFC" | "NFC"; name?: string; logo?: string }> = {};
        const walk = (node: any, confHint?: "AFC" | "NFC") => {
          if (!node) return;
          const label = node?.name ?? node?.displayName ?? node?.shortName ?? "";
          let conf = confHint;
          if (/AFC/i.test(label)) conf = "AFC";
          if (/NFC/i.test(label)) conf = "NFC";
          const entries = node?.standings?.entries ?? node?.entries ?? [];
          for (const entry of entries) {
            const team = entry?.team;
            const stats = entry?.stats ?? [];
            const seedStat =
              stats.find((s: any) => s?.name === "playoffSeed") ??
              stats.find((s: any) => s?.name === "seed") ??
              stats.find((s: any) => s?.abbreviation === "PS");
            const seedVal = seedStat?.value ?? seedStat?.displayValue;
            const seed = seedVal != null ? Number(seedVal) : NaN;
            if (team?.id && Number.isFinite(seed)) {
              map[String(team.id)] = {
                seed,
                conference: conf,
                name: team?.shortDisplayName ?? team?.displayName ?? team?.name,
                logo: team?.logos?.[0]?.href ?? team?.logo,
              };
            }
          }
          const children = node?.children ?? node?.standings?.children ?? [];
          for (const child of children) walk(child, conf);
        };
        walk(json);
        if (mounted) setNflSeeds(map);
      } catch {
        // ignore
      }
    }
    loadSeeds();
    const interval = setInterval(loadSeeds, 5 * 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [sportKey]);

  const events = useMemo(() => {
    const all = normalizeBracketEvents(data);
    if (sportKey === "nfl") {
      return all.filter((e) => !/pro bowl/i.test(e.name));
    }
    return all;
  }, [data, sportKey]);

  const getDisplayTeamName = (shortName?: string, fullName?: string, location?: string) => {
    if (sportKey === "ncaaf") {
      return location || fullName || shortName || "TBD";
    }
    return fullName || shortName || "TBD";
  };

  const getBracketLabel = (e: BracketEvent) => {
    if (sportKey !== "nfl") return e.roundLabel || "Playoffs";
    if (e.weekNumber === 1) return "Wild Card";
    if (e.weekNumber === 2) return "Divisional Round";
    if (e.weekNumber === 3) return "Conference Championships";
    if (e.weekNumber === 5) return "Super Bowl";
    return e.roundLabel || "Playoffs";
  };
  const byRound = useMemo(() => {
    const map = new Map<string, BracketEvent[]>();
    for (const e of events) {
      const round = getBracketLabel(e);
      if (!map.has(round)) map.set(round, []);
      map.get(round)!.push(e);
    }
    // NFL order then NCAAF/CFP order
    const nflOrder = ["Wild Card", "Wild Card Weekend", "Divisional", "Divisional Round", "Conference", "Conference Championships", "Super Bowl"];
    const ncaafOrder = ["First Round", "Quarterfinals", "Quarterfinal", "Semifinals", "Semifinal", "National Championship", "CFP National Championship", "College Football Playoff"];
    const order = sportKey === "ncaaf" ? ncaafOrder : nflOrder;
    return Array.from(map.entries()).sort((a, b) => {
      const ai = order.findIndex((x) => a[0].toLowerCase().includes(x.toLowerCase()) || x.toLowerCase().includes(a[0].toLowerCase()));
      const bi = order.findIndex((x) => b[0].toLowerCase().includes(x.toLowerCase()) || x.toLowerCase().includes(b[0].toLowerCase()));
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a[0].localeCompare(b[0]);
    });
  }, [events, sportKey]);

  const nflBracket = useMemo(() => {
    if (sportKey !== "nfl") return null;
    const rounds = ["Wild Card", "Divisional Round", "Conference Championships"];
    const afc: Record<string, BracketEvent[]> = {};
    const nfc: Record<string, BracketEvent[]> = {};
    for (const r of rounds) {
      afc[r] = [];
      nfc[r] = [];
    }
    let superBowl: BracketEvent | null = null;
    for (const e of events) {
      const round = getBracketLabel(e);
      if (round === "Super Bowl") {
        superBowl = e;
        continue;
      }
      if (!rounds.includes(round)) continue;
      if (e.conference === "AFC") afc[round].push(e);
      if (e.conference === "NFC") nfc[round].push(e);
    }
    const getBye = (conf: "AFC" | "NFC") => {
      const entry = Object.entries(nflSeeds).find(([, v]) => v.conference === conf && v.seed === 1);
      if (!entry) return null;
      const [teamId, v] = entry;
      return { teamId, ...v };
    };
    return { rounds, afc, nfc, superBowl, afcBye: getBye("AFC"), nfcBye: getBye("NFC") };
  }, [events, sportKey, nflSeeds]);

  const cfpColumns = useMemo(() => {
    if (sportKey !== "ncaaf") return null;
    const map = new Map<string, BracketEvent[]>();
    const cfpEvents = events.filter((e) => e.isCfp);
    for (const e of cfpEvents) {
      const round = normalizeCfpRound(e.roundLabel || "Playoffs");
      if (!map.has(round)) map.set(round, []);
      map.get(round)!.push(e);
    }
    const sortEvents = (list: BracketEvent[]) =>
      [...list].sort((a, b) => {
        const ad = a.date ? new Date(a.date).getTime() : 0;
        const bd = b.date ? new Date(b.date).getTime() : 0;
        if (ad !== bd) return ad - bd;
        return a.id.localeCompare(b.id);
      });

    const first = sortEvents(map.get("First Round") ?? []);
    const quarters = sortEvents(map.get("Quarterfinals") ?? []);
    const semis = sortEvents(map.get("Semifinals") ?? []);
    const final = sortEvents(map.get("National Championship") ?? []);

    const split = (list: BracketEvent[]) => {
      const mid = Math.ceil(list.length / 2);
      return [list.slice(0, mid), list.slice(mid)];
    };
    const [firstLeft, firstRight] = split(first);
    const [qLeft, qRight] = split(quarters);
    const [sLeft, sRight] = split(semis);

    return [
      { key: "first-left", label: "First Round", date: CFP_ROUND_DATES["First Round"], events: firstLeft, side: "left" as const },
      { key: "quarters-left", label: "Quarterfinals", date: CFP_ROUND_DATES["Quarterfinals"], events: qLeft, side: "left" as const },
      { key: "semis-left", label: "Semifinals", date: CFP_ROUND_DATES["Semifinals"], events: sLeft, side: "left" as const },
      { key: "final", label: "National Championship", date: CFP_ROUND_DATES["National Championship"], events: final, side: "center" as const },
      { key: "semis-right", label: "Semifinals", date: CFP_ROUND_DATES["Semifinals"], events: sRight.slice().reverse(), side: "right" as const },
      { key: "quarters-right", label: "Quarterfinals", date: CFP_ROUND_DATES["Quarterfinals"], events: qRight.slice().reverse(), side: "right" as const },
      { key: "first-right", label: "First Round", date: CFP_ROUND_DATES["First Round"], events: firstRight.slice().reverse(), side: "right" as const },
    ];
  }, [events, sportKey]);

  if (!match || !cfg) return null;

  if (!isBracketSport) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <SportSubnav sportKey={sportKey} />
        <div className="border-b border-border/50 bg-card/50">
          <div className="container px-4 md:px-6 py-4">
            <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">{cfg.label} Playoff Bracket</h1>
          </div>
        </div>
        <div className="container px-4 md:px-6 py-8">
          <Card className="p-8 bg-card border-border text-center" data-testid="card-bracket-placeholder">
            <GitBranch className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2" data-testid="text-bracket-title">Playoff Bracket</h2>
            <p className="text-muted-foreground" data-testid="text-bracket-description">Bracket view is available for NFL and college football.</p>
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
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">
            {sportKey === "ncaaf" ? "College Football Playoff Bracket" : `${cfg.label} Playoff Bracket`}
          </h1>
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
          <div className="space-y-6">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="h-24 animate-pulse bg-card border-border" />
            ))}
          </div>
        )}
        {!loading && events.length === 0 && (
          <Card className="p-8 bg-card border-border text-center" data-testid="card-bracket-placeholder">
            <GitBranch className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2" data-testid="text-bracket-title">Bracket Coming Soon</h2>
            <p className="text-muted-foreground" data-testid="text-bracket-description">
              The playoff bracket will be available during the {cfg.label} postseason.
            </p>
            <Link href={`/sport/${sportKey}/playoffs`}>
              <Button className="mt-4" variant="outline">View Playoffs</Button>
            </Link>
          </Card>
        )}
        {!loading && byRound.length > 0 && (
          <div className="space-y-8">
            {sportKey !== "ncaaf" && (
              <div className="flex justify-end">
                <Link href={`/sport/${sportKey}/playoffs`}>
                  <Button variant="outline" size="sm" className="uppercase font-bold tracking-wider">View All Playoff Games</Button>
                </Link>
              </div>
            )}
            {/* ESPN-style horizontal bracket: rounds as columns with dates, connecting lines */}
            <div className={cn("overflow-x-auto pb-4", sportKey === "ncaaf" ? "bracket-cfp" : "")}>
              {sportKey === "ncaaf" && cfpColumns ? (
                <div className="grid gap-3 min-w-[1300px] grid-cols-7 cfp-bracket">
                  {cfpColumns.map((col, idx) => (
                    <div
                      key={col.key}
                      className={cn(
                        "bracket-round min-w-[180px] cfp-col",
                        col.side === "left" && "cfp-left",
                        col.side === "right" && "cfp-right",
                        col.side === "center" && "cfp-center",
                        col.events.length > 1 && "cfp-col-two",
                        idx > 0 && "border-l border-border/60 pl-3"
                      )}
                    >
                      <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">{col.label}</h2>
                      {col.date && <p className="text-xs text-muted-foreground mb-4">{col.date}</p>}
                      {col.side === "center" && (
                        <div className="cfp-logo-wrap">
                          <img
                            src={CFP_LOGO}
                            alt="College Football Playoff"
                            className="cfp-logo"
                            onError={(e) => {
                              const el = e.currentTarget as HTMLImageElement;
                              el.style.display = "none";
                            }}
                          />
                          <div className="cfp-logo-fallback">
                            <CfpLogoInline />
                          </div>
                        </div>
                      )}
                      <div className={cn("cfp-col-body", col.events.length >= 4 && "cfp-col-4", col.events.length === 2 && "cfp-col-2", col.events.length === 1 && "cfp-col-1")}>
                        {col.events.map((e) => {
                          const awayScore = e.away.score != null ? Number(e.away.score) : null;
                          const homeScore = e.home.score != null ? Number(e.home.score) : null;
                          const awayWins = awayScore != null && homeScore != null && awayScore > homeScore;
                          const homeWins = awayScore != null && homeScore != null && homeScore > awayScore;
                          return (
                            <Link key={e.id} href={`/sport/${sportKey}/game/${e.id}`} className="block group cfp-game">
                              <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-primary/50 transition-all overflow-hidden rounded-lg cfp-game-card">
                                <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 border-b border-border/40">
                                  <Badge variant="secondary" className={cn("rounded text-[10px] font-bold px-2 py-0.5", e.state === "in" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground")}>
                                    {e.status}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">{formatGameDateTime(e.date)}</span>
                                </div>
                                <div className="p-3 space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {e.away.logo ? <img src={e.away.logo} alt="" className="h-6 w-6 object-contain shrink-0" /> : <div className="h-6 w-6 rounded bg-muted shrink-0" />}
                                      {e.away.seed != null && <span className="text-xs text-muted-foreground font-bold shrink-0">{e.away.seed}</span>}
                                    <span className={cn("font-bold text-sm truncate", awayWins && "text-foreground")}>{getDisplayTeamName(e.away.abbr, e.away.name, e.away.location)}</span>
                                    </div>
                                    <span className={cn("font-mono text-lg font-black tabular-nums shrink-0", awayWins && "text-foreground")}>{e.away.score ?? "—"}</span>
                                    {awayWins && <span className="text-primary shrink-0" aria-hidden>▸</span>}
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {e.home.logo ? <img src={e.home.logo} alt="" className="h-6 w-6 object-contain shrink-0" /> : <div className="h-6 w-6 rounded bg-muted shrink-0" />}
                                      {e.home.seed != null && <span className="text-xs text-muted-foreground font-bold shrink-0">{e.home.seed}</span>}
                                    <span className={cn("font-bold text-sm truncate", homeWins && "text-foreground")}>{getDisplayTeamName(e.home.abbr, e.home.name, e.home.location)}</span>
                                    </div>
                                    <span className={cn("font-mono text-lg font-black tabular-nums shrink-0", homeWins && "text-foreground")}>{e.home.score ?? "—"}</span>
                                    {homeWins && <span className="text-primary shrink-0" aria-hidden>▸</span>}
                                  </div>
                                </div>
                              </Card>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : sportKey === "nfl" && nflBracket ? (
                <div className="min-w-[1200px]">
                  <div className="grid grid-cols-7 gap-4 items-start">
                    <div className="col-span-3">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">AFC</h2>
                      <div className="grid grid-cols-3 gap-3">
                        {nflBracket.rounds.map((round) => (
                          <div key={`afc-${round}`} className={cn("space-y-3 nfl-col", round === "Wild Card" && "nfl-col-4", round === "Divisional Round" && "nfl-col-2", round === "Conference Championships" && "nfl-col-1")}>
                            <div className="text-xs font-bold uppercase tracking-wider text-foreground">{round}</div>
                            {round === "Wild Card" && nflBracket.afcBye && (
                              <Card className="bg-card border border-border/60 rounded-lg">
                                <div className="p-3 space-y-2">
                                  <div className="flex items-center gap-2">
                                    {nflBracket.afcBye.logo ? <img src={nflBracket.afcBye.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted" />}
                                    <span className="text-xs font-bold">{nflBracket.afcBye.seed}</span>
                                    <span className="font-bold text-sm truncate">{nflBracket.afcBye.name ?? "Team"}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">Bye</div>
                                  <div className="text-[10px] text-muted-foreground">Will play lowest remaining seed</div>
                                </div>
                              </Card>
                            )}
                            {nflBracket.afc[round].map((e) => (
                              <Link key={e.id} href={`/sport/${sportKey}/game/${e.id}`} className="block group">
                                <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-primary/50 transition-all overflow-hidden rounded-lg">
                                  <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 border-b border-border/40">
                                    <Badge variant="secondary" className={cn("rounded text-[10px] font-bold px-2 py-0.5", e.state === "in" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground")}>
                                      {e.status}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{formatGameDateTime(e.date)}</span>
                                  </div>
                                  <div className="p-3 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {e.away.logo ? <img src={e.away.logo} alt="" className="h-6 w-6 object-contain shrink-0" /> : <div className="h-6 w-6 rounded bg-muted shrink-0" />}
                                        {(e.away.seed ?? nflSeeds[e.away.id ?? ""]?.seed) != null && <span className="text-xs text-muted-foreground font-bold shrink-0">{e.away.seed ?? nflSeeds[e.away.id ?? ""]?.seed}</span>}
                                        <span className="font-bold text-sm truncate">{e.away.name}</span>
                                      </div>
                                      <span className="font-mono text-lg font-black tabular-nums shrink-0">{e.away.score ?? "—"}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {e.home.logo ? <img src={e.home.logo} alt="" className="h-6 w-6 object-contain shrink-0" /> : <div className="h-6 w-6 rounded bg-muted shrink-0" />}
                                        {(e.home.seed ?? nflSeeds[e.home.id ?? ""]?.seed) != null && <span className="text-xs text-muted-foreground font-bold shrink-0">{e.home.seed ?? nflSeeds[e.home.id ?? ""]?.seed}</span>}
                                        <span className="font-bold text-sm truncate">{e.home.name}</span>
                                      </div>
                                      <span className="font-mono text-lg font-black tabular-nums shrink-0">{e.home.score ?? "—"}</span>
                                    </div>
                                  </div>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-1 nfl-superbowl-col">
                      <div className="nfl-superbowl-wrap">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 text-center">Super Bowl</h2>
                        {nflBracket.superBowl && (
                          <Link href={`/sport/${sportKey}/game/${nflBracket.superBowl.id}`} className="block group">
                            <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-primary/50 transition-all overflow-hidden rounded-lg">
                              <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 border-b border-border/40">
                                <Badge variant="secondary" className={cn("rounded text-[10px] font-bold px-2 py-0.5", nflBracket.superBowl.state === "in" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground")}>
                                  {nflBracket.superBowl.status}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{formatGameDateTime(nflBracket.superBowl.date)}</span>
                              </div>
                              <div className="p-3 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {nflBracket.superBowl.away.logo ? <img src={nflBracket.superBowl.away.logo} alt="" className="h-6 w-6 object-contain shrink-0" /> : <div className="h-6 w-6 rounded bg-muted shrink-0" />}
                                    {nflBracket.superBowl.away.seed != null && <span className="text-xs text-muted-foreground font-bold shrink-0">{nflBracket.superBowl.away.seed}</span>}
                                    <span className="font-bold text-sm truncate">{nflBracket.superBowl.away.name}</span>
                                  </div>
                                  <span className="font-mono text-lg font-black tabular-nums shrink-0">{nflBracket.superBowl.away.score ?? "—"}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {nflBracket.superBowl.home.logo ? <img src={nflBracket.superBowl.home.logo} alt="" className="h-6 w-6 object-contain shrink-0" /> : <div className="h-6 w-6 rounded bg-muted shrink-0" />}
                                    {nflBracket.superBowl.home.seed != null && <span className="text-xs text-muted-foreground font-bold shrink-0">{nflBracket.superBowl.home.seed}</span>}
                                    <span className="font-bold text-sm truncate">{nflBracket.superBowl.home.name}</span>
                                  </div>
                                  <span className="font-mono text-lg font-black tabular-nums shrink-0">{nflBracket.superBowl.home.score ?? "—"}</span>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="col-span-3">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 text-right">NFC</h2>
                      <div className="grid grid-cols-3 gap-3">
                        {nflBracket.rounds.slice().reverse().map((round) => (
                          <div key={`nfc-${round}`} className={cn("space-y-3 nfl-col", round === "Wild Card" && "nfl-col-4", round === "Divisional Round" && "nfl-col-2", round === "Conference Championships" && "nfl-col-1")}>
                            <div className="text-xs font-bold uppercase tracking-wider text-foreground text-right">{round}</div>
                            {round === "Wild Card" && nflBracket.nfcBye && (
                              <Card className="bg-card border border-border/60 rounded-lg">
                                <div className="p-3 space-y-2">
                                  <div className="flex items-center gap-2">
                                    {nflBracket.nfcBye.logo ? <img src={nflBracket.nfcBye.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted" />}
                                    <span className="text-xs font-bold">{nflBracket.nfcBye.seed}</span>
                                    <span className="font-bold text-sm truncate">{nflBracket.nfcBye.name ?? "Team"}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">Bye</div>
                                  <div className="text-[10px] text-muted-foreground">Will play lowest remaining seed</div>
                                </div>
                              </Card>
                            )}
                            {nflBracket.nfc[round].map((e) => (
                              <Link key={e.id} href={`/sport/${sportKey}/game/${e.id}`} className="block group">
                                <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-primary/50 transition-all overflow-hidden rounded-lg">
                                  <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 border-b border-border/40">
                                    <Badge variant="secondary" className={cn("rounded text-[10px] font-bold px-2 py-0.5", e.state === "in" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground")}>
                                      {e.status}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{formatGameDateTime(e.date)}</span>
                                  </div>
                                  <div className="p-3 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {e.away.logo ? <img src={e.away.logo} alt="" className="h-6 w-6 object-contain shrink-0" /> : <div className="h-6 w-6 rounded bg-muted shrink-0" />}
                                        {(e.away.seed ?? nflSeeds[e.away.id ?? ""]?.seed) != null && <span className="text-xs text-muted-foreground font-bold shrink-0">{e.away.seed ?? nflSeeds[e.away.id ?? ""]?.seed}</span>}
                                        <span className="font-bold text-sm truncate">{e.away.name}</span>
                                      </div>
                                      <span className="font-mono text-lg font-black tabular-nums shrink-0">{e.away.score ?? "—"}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {e.home.logo ? <img src={e.home.logo} alt="" className="h-6 w-6 object-contain shrink-0" /> : <div className="h-6 w-6 rounded bg-muted shrink-0" />}
                                        {(e.home.seed ?? nflSeeds[e.home.id ?? ""]?.seed) != null && <span className="text-xs text-muted-foreground font-bold shrink-0">{e.home.seed ?? nflSeeds[e.home.id ?? ""]?.seed}</span>}
                                        <span className="font-bold text-sm truncate">{e.home.name}</span>
                                      </div>
                                      <span className="font-mono text-lg font-black tabular-nums shrink-0">{e.home.score ?? "—"}</span>
                                    </div>
                                  </div>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={cn("grid gap-4 min-w-0", byRound.length <= 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1", sportKey === "ncaaf" && "gap-8")}>
                  {byRound.map(([round, roundEvents], roundIdx) => {
                    const roundDate = sportKey === "ncaaf" && CFP_ROUND_DATES[round] ? CFP_ROUND_DATES[round] : null;
                    return (
                      <div key={round} className={cn("bracket-round min-w-[220px]", roundIdx > 0 && sportKey === "ncaaf" && "border-l border-border/60 pl-6")}>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">{round}</h2>
                        {roundDate && <p className="text-xs text-muted-foreground mb-4">{roundDate}</p>}
                        <div className={cn("space-y-3", sportKey === "ncaaf" && "space-y-4")}>
                          {roundEvents.map((e) => {
                            const awayScore = e.away.score != null ? Number(e.away.score) : null;
                            const homeScore = e.home.score != null ? Number(e.home.score) : null;
                            const awayWins = awayScore != null && homeScore != null && awayScore > homeScore;
                            const homeWins = awayScore != null && homeScore != null && homeScore > awayScore;
                            return (
                              <Link key={e.id} href={`/sport/${sportKey}/game/${e.id}`} className="block group">
                                <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-primary/50 transition-all overflow-hidden rounded-lg">
                                  <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 border-b border-border/40">
                                    <Badge variant="secondary" className={cn("rounded text-[10px] font-bold px-2 py-0.5", e.state === "in" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground")}>
                                      {e.status}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{formatGameDateTime(e.date)}</span>
                                  </div>
                                  <div className="p-3 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {e.away.logo ? <img src={e.away.logo} alt="" className="h-6 w-6 object-contain shrink-0" /> : <div className="h-6 w-6 rounded bg-muted shrink-0" />}
                                        {e.away.seed != null && <span className="text-xs text-muted-foreground font-bold shrink-0">{e.away.seed}</span>}
                                        <span className={cn("font-bold text-sm truncate", awayWins && "text-foreground")}>{e.away.name}</span>
                                      </div>
                                      <span className={cn("font-mono text-lg font-black tabular-nums shrink-0", awayWins && "text-foreground")}>{e.away.score ?? "—"}</span>
                                      {awayWins && <span className="text-primary shrink-0" aria-hidden>▸</span>}
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {e.home.logo ? <img src={e.home.logo} alt="" className="h-6 w-6 object-contain shrink-0" /> : <div className="h-6 w-6 rounded bg-muted shrink-0" />}
                                        {e.home.seed != null && <span className="text-xs text-muted-foreground font-bold shrink-0">{e.home.seed}</span>}
                                        <span className={cn("font-bold text-sm truncate", homeWins && "text-foreground")}>{e.home.name}</span>
                                      </div>
                                      <span className={cn("font-mono text-lg font-black tabular-nums shrink-0", homeWins && "text-foreground")}>{e.home.score ?? "—"}</span>
                                      {homeWins && <span className="text-primary shrink-0" aria-hidden>▸</span>}
                                    </div>
                                  </div>
                                </Card>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
