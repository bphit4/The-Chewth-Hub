import { useRoute, Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { getSportConfig, SPORTS, type EspnSportKey } from "@/lib/espn";
import { fetchDirectEspnApi } from "@/lib/espnDirect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

type SortState = { key: string; direction: "asc" | "desc" };

function sortableValue(value: unknown) {
  if (value == null) return "";
  const normalized = String(value).replace(/,/g, "");
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) && /^-?\d+(\.\d+)?$/.test(normalized) ? number : normalized.toLowerCase();
}

function sortRows<T>(rows: T[], sort: SortState | null, getter: (row: T, key: string) => unknown) {
  if (!sort) return rows;
  return [...rows].sort((a, b) => {
    const av = sortableValue(getter(a, sort.key));
    const bv = sortableValue(getter(b, sort.key));
    if (typeof av === "number" && typeof bv === "number") {
      return sort.direction === "asc" ? av - bv : bv - av;
    }
    return sort.direction === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
}

function sortButtonLabel(label: string, sort: SortState | null, key: string) {
  if (sort?.key !== key) return label;
  return `${label} ${sort.direction === "asc" ? "↑" : "↓"}`;
}

export default function GameDetail() {
  const [match, params] = useRoute("/sport/:sport/game/:id");
  const sport = params?.sport;
  const eventId = params?.id;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);
  const isMma = sportKey === "ufc";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("gamecast");
  const [teamStatsSort, setTeamStatsSort] = useState<SortState | null>(null);
  const [leaderSort, setLeaderSort] = useState<SortState | null>(null);
  const [boxSort, setBoxSort] = useState<Record<string, SortState | null>>({});
  const [standingsSort, setStandingsSort] = useState<SortState | null>(null);
  const [playSort, setPlaySort] = useState<SortState | null>(null);

  const toggleSort = (current: SortState | null, key: string): SortState => ({
    key,
    direction: current?.key === key && current.direction === "desc" ? "asc" : "desc",
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!cfg || !eventId) return;
      try {
        setError(null);
        setLoading(true);
        const endpoint = isMma
          ? `/api/espn/mma/event/${eventId}`
          : `/api/espn/game/${sportKey}/${eventId}`;
        const res = await fetchDirectEspnApi(endpoint);
        if (!res.ok) throw new Error(`Summary fetch failed (${res.status})`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load box score");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [sportKey, eventId, isMma, cfg]);

  const header = useMemo(() => {
    const event = data?.header?.competitions?.[0];
    const comps = event?.competitors ?? [];
    const home = comps.find((c: any) => c.homeAway === "home");
    const away = comps.find((c: any) => c.homeAway === "away");
    
    const getTeamLogo = (team: any) => {
      if (!team) return undefined;
      return team.team?.logo || 
             team.team?.logos?.[0]?.href || 
             (team.team?.id ? `https://a.espncdn.com/i/teamlogos/${sportKey === 'ncaaf' || sportKey === 'ncaab' ? 'ncaa' : sportKey}/500/${team.team.id}.png` : undefined);
    };
    
    return {
      status: data?.header?.competitions?.[0]?.status?.type?.shortDetail ?? "",
      home: { ...home, logoUrl: getTeamLogo(home) },
      away: { ...away, logoUrl: getTeamLogo(away) },
      link: data?.header?.links?.find((l: any) => l?.rel?.includes("summary"))?.href,
    };
  }, [data, sportKey]);

  const mmaSegments = useMemo(() => {
    if (!isMma || !data?.competitions) return [];
    const groups = new Map<string, any[]>();
    for (const fight of data.competitions) {
      const name = fight.cardSegment || "Fights";
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name)!.push(fight);
    }
    const order = ["Main Card", "Prelims", "Early Prelims", "Fights"];
    const sorted = Array.from(groups.entries()).sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return sorted.map(([name, fights]) => ({
      name,
      fights: [...fights].sort((a, b) => {
        if (a.matchNumber != null && b.matchNumber != null) return a.matchNumber - b.matchNumber;
        return String(a.id).localeCompare(String(b.id));
      }),
    }));
  }, [data, isMma]);

  const playerBoxscoreGroups = useMemo(() => {
    if (isMma) return [];
    const players = data?.boxscore?.players;
    if (!Array.isArray(players)) return [];
    return players.map((teamGroup: any) => ({
      team: teamGroup?.team ?? {},
      statistics: Array.isArray(teamGroup?.statistics) ? teamGroup.statistics : [],
    })).filter((group: any) => group.statistics.length > 0);
  }, [data, isMma]);

  const gameLeaderRows = useMemo<any[]>(() => {
    if (!Array.isArray(data?.leaders)) return [];
    return data.leaders.flatMap((teamGroup: any) => {
      const team = teamGroup?.team ?? {};
      return (teamGroup?.leaders ?? []).flatMap((category: any) => {
        const leaders = Array.isArray(category?.leaders) ? category.leaders : [];
        return leaders.map((leader: any) => ({
          id: `${team?.id ?? "team"}-${category?.name ?? "leader"}-${leader?.athlete?.id ?? leader?.displayValue}`,
          category: category?.displayName ?? category?.name ?? "Leader",
          team,
          athlete: leader?.athlete ?? {},
          value: leader?.displayValue ?? leader?.mainStat?.value ?? leader?.value ?? "",
          valueNumber: Number(leader?.value ?? leader?.mainStat?.value),
          summary: leader?.summary ?? (Array.isArray(leader?.statistics) ? leader.statistics.map((s: any) => s?.displayValue).filter(Boolean).join(", ") : ""),
        }));
      });
    });
  }, [data]);

  const sortedGameLeaderRows = useMemo(
    () => sortRows(gameLeaderRows, leaderSort, (row, key) => {
      if (key === "leader") return row.athlete?.displayName ?? row.athlete?.shortName ?? "";
      if (key === "team") return row.team?.abbreviation ?? row.team?.displayName ?? "";
      if (key === "category") return row.category;
      if (key === "value") return row.valueNumber ?? row.value;
      return "";
    }),
    [gameLeaderRows, leaderSort],
  );

  const standingsRows = useMemo<any[]>(() => {
    const groups = Array.isArray(data?.standings?.groups) ? data.standings.groups : [];
    return groups.flatMap((group: any) => (group?.standings?.entries ?? []).map((entry: any) => {
      const getStat = (type: string) => entry?.stats?.find((s: any) => s?.type === type || s?.name === type || s?.abbreviation === type)?.displayValue ?? "";
      return {
        id: String(entry?.id ?? entry?.team ?? ""),
        team: entry?.team ?? "",
        teamId: String(entry?.id ?? ""),
        conf: getStat("vsconf"),
        gb: getStat("vsconf_gamesbehind") || getStat("gamesBehind"),
        overall: getStat("total") || (entry?.stats?.[0]?.displayValue ?? ""),
      };
    }));
  }, [data]);

  const sortedStandingsRows = useMemo(
    () => sortRows(standingsRows, standingsSort, (row, key) => row[key as keyof typeof row]),
    [standingsRows, standingsSort],
  );

  const standingsGroups = useMemo<any[]>(() => {
    const groups = Array.isArray(data?.standings?.groups) ? data.standings.groups : [];
    const preferred = [
      "wins",
      "losses",
      "ties",
      "winpercent",
      "pointsfor",
      "pointsagainst",
      "vsconf",
      "vsconf_gamesbehind",
      "total",
    ];
    return groups.map((group: any, groupIdx: number) => {
      const entries = Array.isArray(group?.standings?.entries) ? group.standings.entries : [];
      const available = new Map<string, any>();
      for (const stat of entries[0]?.stats ?? []) {
        const key = stat?.type ?? stat?.name ?? stat?.abbreviation;
        if (key) available.set(key, stat);
      }
      const columns = preferred
        .filter((key) => available.has(key))
        .map((key) => {
          const stat = available.get(key);
          return {
            key,
            label: stat?.abbreviation === "Any" ? "OVR" : (stat?.abbreviation ?? stat?.shortDisplayName ?? stat?.displayName ?? key),
          };
        })
        .slice(0, 6);
      const rows = entries.map((entry: any) => {
        const statMap = new Map<string, any>();
        for (const stat of entry?.stats ?? []) {
          const key = stat?.type ?? stat?.name ?? stat?.abbreviation;
          if (key) statMap.set(key, stat?.displayValue ?? stat?.summary ?? stat?.value ?? "");
        }
        return {
          id: String(entry?.id ?? entry?.team ?? ""),
          team: entry?.team ?? "",
          teamId: String(entry?.id ?? ""),
          stats: Object.fromEntries(statMap),
        };
      });
      return {
        id: `${group?.header ?? groupIdx}`,
        header: group?.divisionHeader ?? group?.header ?? "Standings",
        conferenceHeader: group?.conferenceHeader ?? "",
        columns,
        rows,
      };
    }).filter((group: any) => group.rows.length > 0);
  }, [data]);

  const videos = Array.isArray(data?.videos) ? data.videos : [];
  const plays = Array.isArray(data?.plays) ? data.plays : [];

  const teamStatsRows = useMemo<any[]>(() => {
    const teams = Array.isArray(data?.boxscore?.teams) ? data.boxscore.teams : [];
    const away = teams.find((team: any) => team?.homeAway === "away") ?? teams[0];
    const home = teams.find((team: any) => team?.homeAway === "home") ?? teams[1];
    const stats = away?.statistics ?? home?.statistics ?? [];
    return stats.map((stat: any, idx: number) => ({
      label: stat?.label ?? stat?.displayName ?? stat?.name ?? `Stat ${idx + 1}`,
      away: away?.statistics?.[idx]?.displayValue ?? away?.statistics?.[idx]?.value ?? "",
      home: home?.statistics?.[idx]?.displayValue ?? home?.statistics?.[idx]?.value ?? "",
    }));
  }, [data]);

  const sortedTeamStatsRows = useMemo(
    () => sortRows(teamStatsRows, teamStatsSort, (row, key) => row[key as keyof typeof row]),
    [teamStatsRows, teamStatsSort],
  );

  const sortedPlays = useMemo<any[]>(
    () => sortRows(plays, playSort, (play, key) => {
      if (key === "period") return play?.period?.number ?? play?.period ?? "";
      if (key === "time") return play?.clock?.displayValue ?? play?.clock ?? "";
      if (key === "team") return play?.team?.abbreviation ?? play?.team?.displayName ?? "";
      if (key === "play") return play?.text ?? play?.type?.text ?? "";
      return "";
    }),
    [plays, playSort],
  );

  if (!match || !cfg) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-10 border-b border-white/10">
        <div className="container px-4 md:px-6">
          <Link href={`/sport/${sportKey}/scores`}>
            <Button data-testid="button-back-scores" variant="ghost" className="pl-0 gap-2 text-white hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Scores
            </Button>
          </Link>
          <h1 className="mt-2 text-3xl md:text-5xl font-heading font-black text-white uppercase italic tracking-tighter">
            {isMma ? "Fightcenter" : <>Box Score & <span className="text-primary">Stats</span></>}
          </h1>
          <div className="text-white/70 mt-2">
            {isMma ? (data?.status || "—") : header.status}
          </div>
        </div>
      </div>

      <SportSubnav sportKey={sportKey} />

      <div className="container px-4 md:px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          </div>
        )}

        <Card className="border-border overflow-hidden">
          <CardHeader className="border-b border-border">
            <CardTitle className="font-heading uppercase tracking-wider">
              {isMma ? (data?.name || "Event Details") : "Game Summary"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="h-40 animate-pulse bg-secondary/5 rounded-xl" />
            ) : isMma ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-border p-4 bg-card">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Event Info</div>
                  <div className="mt-2 text-lg font-bold">{data?.name || "Fight Card"}</div>
                  <div className="text-sm text-muted-foreground">
                    {data?.date ? new Date(data.date).toLocaleString() : "Date TBD"}
                  </div>
                  {data?.venue?.name && (
                    <div className="text-sm text-muted-foreground">
                      {data.venue.name}
                      {data.venue.city ? ` • ${data.venue.city}` : ""}
                      {data.venue.state ? `, ${data.venue.state}` : ""}
                    </div>
                  )}
                  {data?.broadcast && (
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">TV: {data.broadcast}</div>
                  )}
                </div>

                {mmaSegments.map((segment, idx) => (
                  <div key={`${segment.name}-${idx}`} className="rounded-xl border border-border p-5 bg-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-heading font-bold uppercase">{segment.name}</div>
                      <Badge className="bg-secondary/10 text-muted-foreground uppercase tracking-widest text-[10px] font-black rounded-sm">
                        Fightcenter
                      </Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                            <th className="text-left py-2 px-3">Fight</th>
                            <th className="text-left py-2 px-3">Weight</th>
                            <th className="text-right py-2 px-3">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {segment.fights.map((fight: any) => {
                            const fighters = Array.isArray(fight?.fighters) ? fight.fighters : [];
                            const [away, home] = fighters.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
                            const resultText = fight.resultDetail || fight.status || "Scheduled";
                            return (
                              <tr key={fight.id} className="border-b border-border/50 hover:bg-secondary/5">
                                <td className="py-2 px-3">
                                  <div className="flex flex-col gap-2">
                                    {[away, home].map((f: any, fi: number) => (
                                      <div key={`${fight.id}-${fi}`} className="flex items-center gap-2">
                                        {f?.headshot ? (
                                          <img src={f.headshot} alt="" className="h-7 w-7 rounded-full object-cover" />
                                        ) : (
                                          <div className="h-7 w-7 rounded-full bg-secondary/10" />
                                        )}
                                        {f?.id ? (
                                          <Link
                                            href={`/sport/${sportKey}/athlete/${f.id}`}
                                            className="font-semibold hover:text-primary transition-colors"
                                          >
                                            {f?.name || "TBD"}
                                          </Link>
                                        ) : (
                                          <div className="font-semibold">{f?.name || "TBD"}</div>
                                        )}
                                        {f?.flag && <img src={f.flag} alt="" className="h-4 w-4 object-contain" />}
                                        {f?.record && <div className="text-xs text-muted-foreground font-mono">{f.record}</div>}
                                        {f?.winner && <Badge className="ml-1 text-[9px] uppercase">W</Badge>}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-sm text-muted-foreground">{fight.weightClass || "—"}</td>
                                <td className="py-2 px-3 text-right font-mono">{resultText}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {data?.links?.fightcenter && (
                  <Button
                    data-testid="button-open-espn"
                    variant="outline"
                    className="gap-2 uppercase font-bold tracking-wider"
                    asChild
                  >
                    <a href={data.links.fightcenter} target="_blank" rel="noreferrer">
                      Open on ESPN <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border p-4 bg-card">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Away</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(header.away?.logoUrl || header.away?.team?.logo) ? (
                          <img src={header.away.logoUrl || header.away.team?.logo} alt="" className="h-10 w-10 object-contain" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-secondary/20 grid place-items-center font-heading font-bold text-sm">
                            {header.away?.team?.abbreviation?.slice(0, 2) || "A"}
                          </div>
                        )}
                        <div>
                          {header.away?.team?.id ? (
                            <Link href={`/sport/${sportKey}/team/${header.away.team.id}`} className="font-bold text-lg hover:text-primary hover:underline">
                              {header.away?.team?.displayName}
                            </Link>
                          ) : (
                            <div className="font-bold text-lg">{header.away?.team?.displayName}</div>
                          )}
                          <div className="text-xs text-muted-foreground font-bold uppercase">{header.away?.team?.abbreviation}</div>
                        </div>
                      </div>
                      <div className="font-mono text-4xl font-black text-accent">{header.away?.score ?? "-"}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4 bg-card">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Home</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(header.home?.logoUrl || header.home?.team?.logo) ? (
                          <img src={header.home.logoUrl || header.home.team?.logo} alt="" className="h-10 w-10 object-contain" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-secondary/20 grid place-items-center font-heading font-bold text-sm">
                            {header.home?.team?.abbreviation?.slice(0, 2) || "H"}
                          </div>
                        )}
                        <div>
                          {header.home?.team?.id ? (
                            <Link href={`/sport/${sportKey}/team/${header.home.team.id}`} className="font-bold text-lg hover:text-primary hover:underline">
                              {header.home?.team?.displayName}
                            </Link>
                          ) : (
                            <div className="font-bold text-lg">{header.home?.team?.displayName}</div>
                          )}
                          <div className="text-xs text-muted-foreground font-bold uppercase">{header.home?.team?.abbreviation}</div>
                        </div>
                      </div>
                      <div className="font-mono text-4xl font-black text-accent">{header.home?.score ?? "-"}</div>
                    </div>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
                  <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg bg-muted/70 p-1">
                    <TabsTrigger value="gamecast" className="shrink-0 uppercase font-black tracking-wider">Gamecast</TabsTrigger>
                    <TabsTrigger value="boxscore" className="shrink-0 uppercase font-black tracking-wider">Box Score</TabsTrigger>
                    <TabsTrigger value="playbyplay" className="shrink-0 uppercase font-black tracking-wider">Play-by-Play</TabsTrigger>
                    <TabsTrigger value="teamstats" className="shrink-0 uppercase font-black tracking-wider">Team Stats</TabsTrigger>
                    <TabsTrigger value="videos" className="shrink-0 uppercase font-black tracking-wider">Videos</TabsTrigger>
                    <TabsTrigger value="standings" className="shrink-0 uppercase font-black tracking-wider">Standings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="gamecast" className="mt-0 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="rounded-xl border border-border p-5 bg-card">
                      <div className="mb-4 font-heading font-bold uppercase">Game Leaders</div>
                      <div className="overflow-x-auto">
                        <table className="min-w-[640px] w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                              {[
                                ["category", "Category"],
                                ["team", "Team"],
                                ["leader", "Player"],
                                ["value", "Value"],
                              ].map(([key, label]) => (
                                <th key={key} className={key === "value" ? "px-3 py-2 text-right" : "px-3 py-2 text-left"}>
                                  <button
                                    className="uppercase tracking-widest hover:text-primary"
                                    onClick={() => setLeaderSort((current) => toggleSort(current, key))}
                                  >
                                    {sortButtonLabel(label, leaderSort, key)}
                                  </button>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sortedGameLeaderRows.slice(0, 12).map((leader: any) => (
                              <tr key={leader.id} className="border-b border-border/60 hover:bg-secondary/5">
                                <td className="px-3 py-3 font-bold">{leader.category}</td>
                                <td className="px-3 py-3 text-muted-foreground">{leader.team?.abbreviation ?? leader.team?.displayName ?? ""}</td>
                                <td className="px-3 py-3">
                                  <div className="flex min-w-0 items-center gap-2">
                                    {leader.athlete?.headshot?.href && (
                                      <img src={leader.athlete.headshot.href} alt="" className="h-7 w-7 rounded-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                                    )}
                                    {leader.athlete?.id ? (
                                      <Link href={`/sport/${sportKey}/athlete/${leader.athlete.id}`} className="truncate font-semibold hover:text-primary hover:underline">
                                        {leader.athlete?.displayName ?? leader.athlete?.shortName ?? "Player"}
                                      </Link>
                                    ) : (
                                      <span className="truncate font-semibold">{leader.athlete?.displayName ?? leader.athlete?.shortName ?? "Player"}</span>
                                    )}
                                  </div>
                                  {leader.summary && <div className="mt-1 text-xs text-muted-foreground">{leader.summary}</div>}
                                </td>
                                <td className="px-3 py-3 text-right font-mono font-black text-primary">{leader.value || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-5 bg-card">
                      <div className="mb-4 font-heading font-bold uppercase">{data?.standings?.header ?? "Standings"}</div>
                      <div className="grid gap-5">
                        {standingsGroups.map((group) => {
                          const rows = sortRows(group.rows, standingsSort, (row: any, key) => key === "team" ? row.team : row.stats?.[key]);
                          return (
                            <div key={group.id} className="min-w-0">
                              {group.conferenceHeader && <div className="mb-1 text-xs font-black uppercase tracking-widest text-muted-foreground">{group.conferenceHeader}</div>}
                              <div className="mb-2 text-sm font-black uppercase">{group.header}</div>
                              <div className="overflow-x-auto">
                                <table className="min-w-[340px] w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                                      <th className="px-2 py-2 text-left">
                                        <button className="uppercase tracking-widest hover:text-primary" onClick={() => setStandingsSort((current) => toggleSort(current, "team"))}>
                                          {sortButtonLabel("Team", standingsSort, "team")}
                                        </button>
                                      </th>
                                      {group.columns.map((column: any) => (
                                        <th key={column.key} className="px-2 py-2 text-right">
                                          <button className="uppercase tracking-widest hover:text-primary" onClick={() => setStandingsSort((current) => toggleSort(current, column.key))}>
                                            {sortButtonLabel(column.label, standingsSort, column.key)}
                                          </button>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((row: any) => (
                                      <tr key={row.id || row.team} className="border-b border-border/60 hover:bg-secondary/5">
                                        <td className="px-2 py-2 font-semibold">
                                          {row.teamId ? <Link href={`/sport/${sportKey}/team/${row.teamId}`} className="hover:text-primary hover:underline">{row.team}</Link> : row.team}
                                        </td>
                                        {group.columns.map((column: any) => (
                                          <td key={column.key} className="px-2 py-2 text-right font-mono">{row.stats?.[column.key] || "-"}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="teamstats" className="mt-0">
                    <div className="rounded-xl border border-border p-5 bg-card">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="font-heading font-bold uppercase">Team Statistics</div>
                        <Badge className="bg-primary text-primary-foreground uppercase font-black tracking-widest text-[10px] rounded-sm">Box Score</Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-[520px] w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                              {[
                                ["label", "Stat"],
                                ["away", header.away?.team?.abbreviation || "Away"],
                                ["home", header.home?.team?.abbreviation || "Home"],
                              ].map(([key, label]) => (
                                <th key={key} className={key === "label" ? "px-3 py-2 text-left" : "px-3 py-2 text-right"}>
                                  <button className="uppercase tracking-widest hover:text-primary" onClick={() => setTeamStatsSort((current) => toggleSort(current, key))}>
                                    {sortButtonLabel(label, teamStatsSort, key)}
                                  </button>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sortedTeamStatsRows.map((row: any, idx: number) => (
                              <tr key={`${row.label}-${idx}`} className="border-b border-border/60 hover:bg-secondary/5">
                                <td className="px-3 py-2 font-medium">{row.label}</td>
                                <td className="px-3 py-2 text-right font-mono">{row.away || "-"}</td>
                                <td className="px-3 py-2 text-right font-mono">{row.home || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="boxscore" className="mt-0">
                    {playerBoxscoreGroups.length > 0 ? (
                      <div className="rounded-xl border border-border p-5 bg-card">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="font-heading font-bold uppercase">Player Box Score</div>
                          <Badge className="bg-secondary/10 text-muted-foreground uppercase tracking-widest text-[10px] font-black rounded-sm">ESPN Stats</Badge>
                        </div>
                        <div className="grid gap-6">
                          {playerBoxscoreGroups.map((group: any, groupIdx: number) => (
                            <div key={`${group.team?.id ?? groupIdx}`}>
                              <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wider">
                                {group.team?.logos?.[0]?.href && <img src={group.team.logos[0].href} alt="" className="h-5 w-5 object-contain" />}
                                {group.team?.displayName ?? group.team?.abbreviation ?? "Team"}
                              </div>
                              <div className="space-y-4">
                                {group.statistics.map((statGroup: any, statIdx: number) => {
                                  const labels = Array.isArray(statGroup?.labels) ? statGroup.labels : [];
                                  const athletes = Array.isArray(statGroup?.athletes) ? statGroup.athletes : [];
                                  const tableKey = `${group.team?.id ?? groupIdx}-${statGroup?.name ?? statIdx}`;
                                  const currentSort = boxSort[tableKey] ?? null;
                                  const sortedAthletes = sortRows(athletes, currentSort, (item: any, key) => {
                                    if (key === "player") return item?.athlete?.displayName ?? item?.athlete?.shortName ?? "";
                                    if (key.startsWith("stat-")) return item?.stats?.[Number(key.replace("stat-", ""))] ?? "";
                                    return "";
                                  });
                                  if (!athletes.length) return null;
                                  return (
                                    <div key={tableKey} className="overflow-x-auto rounded-lg border border-border/70">
                                      <table className="min-w-[720px] w-full text-sm">
                                        <thead>
                                          <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-widest text-muted-foreground">
                                            <th className="px-3 py-2 text-left">
                                              <button className="uppercase tracking-widest hover:text-primary" onClick={() => setBoxSort((prev) => ({ ...prev, [tableKey]: toggleSort(prev[tableKey] ?? null, "player") }))}>
                                                {sortButtonLabel(statGroup?.displayName ?? statGroup?.name ?? "Stats", currentSort, "player")}
                                              </button>
                                            </th>
                                            {labels.map((label: string, labelIdx: number) => (
                                              <th key={label} className="px-3 py-2 text-right">
                                                <button className="uppercase tracking-widest hover:text-primary" onClick={() => setBoxSort((prev) => ({ ...prev, [tableKey]: toggleSort(prev[tableKey] ?? null, `stat-${labelIdx}`) }))}>
                                                  {sortButtonLabel(label, currentSort, `stat-${labelIdx}`)}
                                                </button>
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {sortedAthletes.map((item: any, playerIdx: number) => {
                                            const athlete = item?.athlete ?? {};
                                            const stats = Array.isArray(item?.stats) ? item.stats : [];
                                            return (
                                              <tr key={`${athlete?.id ?? playerIdx}`} className="border-b border-border/50 hover:bg-secondary/5">
                                                <td className="px-3 py-2 font-semibold">
                                                  {athlete?.id ? (
                                                    <Link href={`/sport/${sportKey}/athlete/${athlete.id}`} className="hover:text-primary hover:underline">
                                                      {athlete?.displayName ?? athlete?.shortName ?? "Player"}
                                                    </Link>
                                                  ) : (
                                                    athlete?.displayName ?? athlete?.shortName ?? "Player"
                                                  )}
                                                </td>
                                                {labels.map((label: string, labelIdx: number) => (
                                                  <td key={`${label}-${labelIdx}`} className="px-3 py-2 text-right font-mono">{stats[labelIdx] ?? "-"}</td>
                                                ))}
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border p-5 bg-card text-sm text-muted-foreground">
                        {data?.header?.competitions?.[0]?.status?.type?.state === "pre"
                          ? "Player box score will appear once ESPN publishes live or final stats for this scheduled game."
                          : "No player box score is available from ESPN for this game yet."}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="playbyplay" className="mt-0">
                    <div className="rounded-xl border border-border p-5 bg-card">
                      <div className="mb-4 font-heading font-bold uppercase">Play-by-Play</div>
                      <div className="overflow-x-auto">
                        <table className="min-w-[720px] w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                              {[
                                ["period", "Period"],
                                ["time", "Time"],
                                ["team", "Team"],
                                ["play", "Play"],
                              ].map(([key, label]) => (
                                <th key={key} className={key === "play" ? "px-3 py-2 text-left" : "px-3 py-2 text-left w-28"}>
                                  <button className="uppercase tracking-widest hover:text-primary" onClick={() => setPlaySort((current) => toggleSort(current, key))}>
                                    {sortButtonLabel(label, playSort, key)}
                                  </button>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sortedPlays.map((play: any, idx: number) => (
                              <tr key={`${play?.id ?? idx}`} className="border-b border-border/60 hover:bg-secondary/5">
                                <td className="px-3 py-2 font-mono">{play?.period?.number ?? play?.period ?? "-"}</td>
                                <td className="px-3 py-2 font-mono">{play?.clock?.displayValue ?? play?.clock ?? "-"}</td>
                                <td className="px-3 py-2">{play?.team?.abbreviation ?? "-"}</td>
                                <td className="px-3 py-2">{play?.text ?? play?.type?.text ?? "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="videos" className="mt-0">
                    <div className="rounded-xl border border-border p-5 bg-card">
                      <div className="mb-4 font-heading font-bold uppercase">Videos</div>
                      {videos.length ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {videos.map((video: any, idx: number) => {
                            const href = video?.links?.source?.href ?? video?.links?.web?.href ?? video?.link;
                            const image = video?.thumbnail ?? video?.posterImages?.default?.href;
                            const body = (
                              <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                                {image && <img src={image} alt="" className="aspect-video w-full object-cover" />}
                                <div className="p-3 text-sm font-bold">{video?.headline ?? video?.title ?? "Video"}</div>
                              </div>
                            );
                            return href ? <a key={idx} href={href} target="_blank" rel="noreferrer" className="hover:text-primary">{body}</a> : <div key={idx}>{body}</div>;
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No videos available.</div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="standings" className="mt-0">
                    <div className="rounded-xl border border-border p-5 bg-card">
                      <div className="mb-4 font-heading font-bold uppercase">{data?.standings?.header ?? "Standings"}</div>
                      <div className="grid gap-6 md:grid-cols-2">
                        {standingsGroups.map((group) => {
                          const rows = sortRows(group.rows, standingsSort, (row: any, key) => key === "team" ? row.team : row.stats?.[key]);
                          return (
                            <div key={group.id} className="rounded-lg border border-border/70 p-3">
                              {group.conferenceHeader && <div className="mb-1 text-xs font-black uppercase tracking-widest text-muted-foreground">{group.conferenceHeader}</div>}
                              <div className="mb-2 text-sm font-black uppercase">{group.header}</div>
                              <div className="overflow-x-auto">
                                <table className="min-w-[420px] w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                                      <th className="px-2 py-2 text-left">
                                        <button className="uppercase tracking-widest hover:text-primary" onClick={() => setStandingsSort((current) => toggleSort(current, "team"))}>
                                          {sortButtonLabel("Team", standingsSort, "team")}
                                        </button>
                                      </th>
                                      {group.columns.map((column: any) => (
                                        <th key={column.key} className="px-2 py-2 text-right">
                                          <button className="uppercase tracking-widest hover:text-primary" onClick={() => setStandingsSort((current) => toggleSort(current, column.key))}>
                                            {sortButtonLabel(column.label, standingsSort, column.key)}
                                          </button>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((row: any) => (
                                      <tr key={row.id || row.team} className="border-b border-border/60 hover:bg-secondary/5">
                                        <td className="px-2 py-2 font-semibold">
                                          {row.teamId ? <Link href={`/sport/${sportKey}/team/${row.teamId}`} className="hover:text-primary hover:underline">{row.team}</Link> : row.team}
                                        </td>
                                        {group.columns.map((column: any) => (
                                          <td key={column.key} className="px-2 py-2 text-right font-mono">{row.stats?.[column.key] || "-"}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="hidden">
                  {/* Team Statistics Comparison */}
                  {data?.boxscore?.teams && (
                    <div className="rounded-xl border border-border p-5 bg-card">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-heading font-bold uppercase">Team Statistics</div>
                        <Badge className="bg-primary text-primary-foreground uppercase font-black tracking-widest text-[10px] rounded-sm">Box Score</Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                              <th className="text-left py-2 px-3">Stat</th>
                              <th className="text-right py-2 px-3">{header.away?.team?.abbreviation || "Away"}</th>
                              <th className="text-right py-2 px-3">{header.home?.team?.abbreviation || "Home"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(data.boxscore.teams[0]?.statistics ?? []).slice(0, 12).map((stat: any, idx: number) => {
                              const awayStat = data.boxscore.teams.find((t: any) => t.homeAway === "away")?.statistics?.[idx];
                              const homeStat = data.boxscore.teams.find((t: any) => t.homeAway === "home")?.statistics?.[idx];
                              return (
                                <tr key={idx} className="border-b border-border/50 hover:bg-secondary/5">
                                  <td className="py-2 px-3 font-medium">{stat?.label || stat?.name || `Stat ${idx + 1}`}</td>
                                  <td className="py-2 px-3 text-right font-mono">{awayStat?.displayValue ?? "—"}</td>
                                  <td className="py-2 px-3 text-right font-mono">{homeStat?.displayValue ?? "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Game Leaders */}
                  {data?.leaders && data.leaders.length > 0 && (
                    <div className="rounded-xl border border-border p-5 bg-card">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-heading font-bold uppercase">Game Leaders</div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {data.leaders.slice(0, 6).map((leader: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg border border-border bg-secondary/5">
                            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">
                              {leader?.displayName || leader?.name || "Leader"}
                            </div>
                            {leader?.leaders?.slice(0, 2).map((l: any, li: number) => {
                              const athlete = l?.athlete ?? {};
                              return (
                                <div key={li} className="flex items-center justify-between py-1">
                                  <div className="flex items-center gap-2">
                                    {athlete?.headshot?.href && (
                                      <img
                                        src={athlete.headshot.href}
                                        alt=""
                                        className="h-6 w-6 rounded-full object-cover"
                                        onError={(event) => {
                                          event.currentTarget.style.display = "none";
                                        }}
                                      />
                                    )}
                                    {athlete?.id ? (
                                      <Link href={`/sport/${sportKey}/athlete/${athlete.id}`} className="text-sm font-medium truncate hover:text-primary hover:underline">
                                        {athlete?.displayName ?? "Player"}
                                      </Link>
                                    ) : (
                                      <span className="text-sm font-medium truncate">{athlete?.displayName ?? "Player"}</span>
                                    )}
                                  </div>
                                  <span className="font-mono font-bold text-primary">{l?.displayValue ?? l?.value ?? "—"}</span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {playerBoxscoreGroups.length > 0 && (
                    <div className="rounded-xl border border-border p-5 bg-card">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-heading font-bold uppercase">Player Box Score</div>
                        <Badge className="bg-secondary/10 text-muted-foreground uppercase tracking-widest text-[10px] font-black rounded-sm">
                          ESPN Stats
                        </Badge>
                      </div>
                      <div className="grid gap-6">
                        {playerBoxscoreGroups.map((group: any, groupIdx: number) => (
                          <div key={`${group.team?.id ?? groupIdx}`}>
                            <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wider">
                              {group.team?.logos?.[0]?.href && <img src={group.team.logos[0].href} alt="" className="h-5 w-5 object-contain" />}
                              {group.team?.displayName ?? group.team?.abbreviation ?? "Team"}
                            </div>
                            <div className="space-y-4">
                              {group.statistics.map((statGroup: any, statIdx: number) => {
                                const labels = Array.isArray(statGroup?.labels) ? statGroup.labels : [];
                                const athletes = Array.isArray(statGroup?.athletes) ? statGroup.athletes : [];
                                if (!athletes.length) return null;
                                return (
                                  <div key={`${statGroup?.name ?? statIdx}`} className="overflow-x-auto rounded-lg border border-border/70">
                                    <table className="min-w-[720px] w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-widest text-muted-foreground">
                                          <th className="px-3 py-2 text-left">{statGroup?.displayName ?? statGroup?.name ?? "Stats"}</th>
                                          {labels.map((label: string) => (
                                            <th key={label} className="px-3 py-2 text-right">{label}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {athletes.map((item: any, playerIdx: number) => {
                                          const athlete = item?.athlete ?? {};
                                          const stats = Array.isArray(item?.stats) ? item.stats : [];
                                          return (
                                            <tr key={`${athlete?.id ?? playerIdx}`} className="border-b border-border/50 hover:bg-secondary/5">
                                              <td className="px-3 py-2 font-semibold">
                                                {athlete?.id ? (
                                                  <Link href={`/sport/${sportKey}/athlete/${athlete.id}`} className="hover:text-primary hover:underline">
                                                    {athlete?.displayName ?? athlete?.shortName ?? "Player"}
                                                  </Link>
                                                ) : (
                                                  athlete?.displayName ?? athlete?.shortName ?? "Player"
                                                )}
                                              </td>
                                              {labels.map((label: string, labelIdx: number) => (
                                                <td key={`${label}-${labelIdx}`} className="px-3 py-2 text-right font-mono">
                                                  {stats[labelIdx] ?? "—"}
                                                </td>
                                              ))}
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scoring Summary */}
                  {data?.scoringPlays && data.scoringPlays.length > 0 && (
                    <div className="rounded-xl border border-border p-5 bg-card">
                      <div className="font-heading font-bold uppercase mb-4">Scoring Summary</div>
                      <div className="space-y-2">
                        {data.scoringPlays.slice(0, 10).map((play: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg border border-border/50 bg-secondary/5 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold">{play?.team?.abbreviation || "Team"}</span>
                              <Badge className="bg-secondary/20 text-xs">{play?.clock?.displayValue || play?.period?.displayValue || ""}</Badge>
                            </div>
                            <div className="text-muted-foreground">{play?.text || play?.type?.text || ""}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {header.link && (
                  <Button
                    data-testid="button-open-espn"
                    variant="outline"
                    className="gap-2 uppercase font-bold tracking-wider"
                    asChild
                  >
                    <a href={header.link} target="_blank" rel="noreferrer">
                      Open on ESPN <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
