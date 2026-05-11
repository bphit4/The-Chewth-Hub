import { useMemo, useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { fetchDirectEspnApi } from "@/lib/espnDirect";
import { espnHeadshotPng } from "@/lib/espnImages";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

interface Leader {
  id: string;
  athleteName: string;
  athleteId?: string;
  teamId?: string;
  teamAbbr: string;
  teamName: string;
  teamLogo?: string;
  headshot?: string;
  value: string;
  valueNumber?: number;
  rank: string;
}

interface LeaderCategory {
  name: string;
  shortName?: string;
  leaders: Leader[];
}

function normalizeLeaderCategories(data: any, sportKey?: EspnSportKey): LeaderCategory[] {
  let categories: any[] = [];

  if (Array.isArray(data?.stats?.categories)) {
    categories = data.stats.categories;
  } else if (Array.isArray(data?.leaders?.categories)) {
    categories = data.leaders.categories;
  } else if (Array.isArray(data?.leaders?.[0]?.categories)) {
    categories = data.leaders[0].categories;
  } else if (Array.isArray(data?.categories)) {
    categories = data.categories;
  } else if (Array.isArray(data?.leaders)) {
    categories = data.leaders;
  } else if (data?.categories?.categories && Array.isArray(data.categories.categories)) {
    categories = data.categories.categories;
  } else if (data?.id && data?.categories) {
    const innerCats = data.categories;
    if (Array.isArray(innerCats)) {
      categories = innerCats;
    }
  }

  if (!Array.isArray(categories)) {
    return [];
  }

  const parseNumber = (val: any) => {
    if (val == null) return undefined;
    const raw = typeof val === "string" ? val.replace(/,/g, "").replace(/[+]/g, "") : String(val);
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : undefined;
  };

  return categories
    .map((c: any) => {
      const leaders = c?.leaders ?? c?.athletes ?? [];
      return {
        name: c?.displayName ?? c?.name ?? "Leaders",
        shortName: c?.shortDisplayName ?? c?.shortName ?? c?.abbreviation,
        leaders: Array.isArray(leaders)
          ? leaders.map((l: any, idx: number) => {
              const athlete = l?.athlete ?? l?.athletes?.[0] ?? l ?? {};
              const team = l?.team ?? athlete?.team ?? {};
              const athleteId = String(athlete?.id ?? l?.athleteId ?? "");
              const fallbackHeadshot = espnHeadshotPng(sportKey, athleteId || undefined);
              const stat = l?.statValue ?? l?.displayValue ?? l?.value;
              const val = l?.displayValue ?? (stat != null ? String(stat) : "");
              const valueNumber = parseNumber(l?.value ?? l?.statValue ?? l?.displayValue ?? val);
              const teamId = String(team?.id ?? l?.teamId ?? "");
              return {
                id: athleteId || String(l?.id ?? `${idx}`),
                athleteId,
                athleteName: athlete?.displayName ?? athlete?.fullName ?? athlete?.name ?? "",
                teamId,
                teamAbbr: team?.abbreviation ?? "",
                teamName: team?.displayName ?? team?.name ?? "",
                teamLogo: team?.logos?.[0]?.href ?? team?.logo,
                headshot: athlete?.headshot?.href ?? athlete?.headshot ?? fallbackHeadshot,
                value: val,
                valueNumber,
                rank: l?.rank != null ? String(l.rank) : String(idx + 1),
              };
            })
          : [],
      };
    })
    .filter((c: LeaderCategory) => c.leaders.length > 0);
}

export default function SportStats() {
  const [match, params] = useRoute("/sport/:sport/stats");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"statistics" | "leaders" | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [rowsToShow, setRowsToShow] = useState("25");
  const [sortKey, setSortKey] = useState<"rank" | "value" | "player" | "team">("value");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const attempts: { url: string; label: "statistics" | "leaders" }[] = [
          { url: `/api/espn/statistics/${sportKey}`, label: "statistics" },
          { url: `/api/espn/leaders/${sportKey}`, label: "leaders" },
        ];
        let lastError: Error | null = null;
        for (const attempt of attempts) {
          try {
            const res = await fetchDirectEspnApi(attempt.url);
            if (!res.ok) throw new Error(`Failed to fetch stats (${res.status})`);
            const json = await res.json();
            const hasCategories = normalizeLeaderCategories(json, sportKey).length > 0;
            if (!hasCategories && attempt.label === "statistics") {
              lastError = new Error("No stats categories available");
              continue;
            }
            if (mounted) {
              setData(json);
              setSource(attempt.label);
            }
            return;
          } catch (err: any) {
            lastError = err;
          }
        }
        throw lastError ?? new Error("Failed to load stats");
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load stats");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [sportKey]);

  const categories = useMemo(() => normalizeLeaderCategories(data, sportKey), [data, sportKey]);
  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((c) => String(c.name).toLowerCase().includes(query));
  }, [categories, categoryQuery]);

  useEffect(() => {
    if (!filteredCategories.length) return;
    const activeExists = filteredCategories.some((c) => c.name === activeKey);
    if (!activeKey || !activeExists) {
      setActiveKey(filteredCategories[0].name);
    }
  }, [filteredCategories, activeKey]);

  const activeCategory = useMemo(() => {
    return filteredCategories.find((c) => c.name === activeKey) ?? filteredCategories[0];
  }, [filteredCategories, activeKey]);

  const sortedLeaders = useMemo(() => {
    const leaders = activeCategory?.leaders ?? [];
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...leaders].sort((a, b) => {
      if (sortKey === "rank") {
        const aRank = parseInt(a.rank, 10) || 0;
        const bRank = parseInt(b.rank, 10) || 0;
        return (aRank - bRank) * dir;
      }
      if (sortKey === "value") {
        const aVal = a.valueNumber ?? 0;
        const bVal = b.valueNumber ?? 0;
        return (aVal - bVal) * dir;
      }
      if (sortKey === "team") {
        const aTeam = (a.teamAbbr || a.teamName || "").toLowerCase();
        const bTeam = (b.teamAbbr || b.teamName || "").toLowerCase();
        return aTeam.localeCompare(bTeam) * dir;
      }
      const aPlayer = (a.athleteName || "").toLowerCase();
      const bPlayer = (b.athleteName || "").toLowerCase();
      return aPlayer.localeCompare(bPlayer) * dir;
    });
  }, [activeCategory, sortKey, sortDirection]);

  const visibleLeaders = useMemo(() => {
    if (rowsToShow === "all") return sortedLeaders;
    const limit = parseInt(rowsToShow, 10);
    if (!Number.isFinite(limit)) return sortedLeaders;
    return sortedLeaders.slice(0, limit);
  }, [rowsToShow, sortedLeaders]);

  if (!match || !cfg) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />
      
      {/* Page Title */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">
            {cfg.label} Stats
          </h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Some leagues may not have full stats available during offseason.
            </div>
          </div>
        )}

        {loading && <Card className="h-52 animate-pulse bg-card border-border" data-testid="skeleton-stats" />}

        {!loading && !categories.length && (
          <Card className="p-6 bg-card border-border" data-testid="empty-stats">
            <div className="text-sm text-muted-foreground">No stats available for this sport right now.</div>
          </Card>
        )}

        {!loading && categories.length > 0 && !filteredCategories.length && (
          <Card className="p-6 bg-card border-border" data-testid="empty-stats-filter">
            <div className="text-sm text-muted-foreground">No categories match your search.</div>
          </Card>
        )}

        {!loading && filteredCategories.length > 0 && (
          <div className="grid min-w-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="bg-card border-border p-4 min-w-0 xl:hidden" data-testid="card-stats-category-select">
              <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr] sm:items-end">
                <div>
                  <div className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">Search</div>
                  <Input
                    value={categoryQuery}
                    onChange={(e) => setCategoryQuery(e.target.value)}
                    placeholder="Search categories"
                    className="uppercase font-bold tracking-wider"
                    data-testid="input-stats-search-mobile"
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">Category</div>
                  <Select value={activeCategory?.name ?? ""} onValueChange={setActiveKey}>
                    <SelectTrigger className="h-11 w-full uppercase font-black tracking-wider" data-testid="select-stats-category-mobile">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((c, idx) => (
                        <SelectItem key={`${c.name}-${idx}`} value={c.name} className="uppercase font-bold">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="hidden bg-card border-border p-4 h-fit min-w-0 xl:sticky xl:top-32 xl:block" data-testid="card-stats-categories">
              <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Categories</div>
              <div className="mb-3">
                <Input
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  placeholder="Search categories"
                  className="uppercase font-bold tracking-wider"
                  data-testid="input-stats-search"
                />
              </div>
              <div className="grid gap-2">
                {filteredCategories.map((c, idx) => {
                  const isActive = c.name === activeKey;
                  return (
                    <Button
                      key={`${c.name}-${idx}`}
                      data-testid={`button-statcat-${idx}`}
                      variant={isActive ? "default" : "outline"}
                      className={
                        isActive
                          ? "h-auto min-h-10 justify-start whitespace-normal break-words text-left uppercase font-black tracking-wider leading-tight"
                          : "h-auto min-h-10 justify-start whitespace-normal break-words text-left uppercase font-bold tracking-wider leading-tight"
                      }
                      onClick={() => setActiveKey(c.name)}
                    >
                      <span className="min-w-0 line-clamp-2">{c.name}</span>
                    </Button>
                  );
                })}
              </div>
            </Card>

            <Card className="bg-card border-border min-w-0 overflow-hidden" data-testid="card-stats-table">
              <div className="flex flex-col gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="font-heading uppercase tracking-wider font-bold" data-testid="text-stats-activecat">
                  {activeCategory?.name}
                </div>
                <Badge className="bg-secondary/10 text-muted-foreground border-border uppercase tracking-widest text-[10px] font-black rounded-sm">
                  {source === "statistics" ? "Stats" : "Leaders"}
                </Badge>
              </div>
              <div className="flex flex-col justify-between gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Sort</div>
                  <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
                    <SelectTrigger className="h-8 w-[160px] uppercase font-bold tracking-wider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="value" className="uppercase font-bold">Value</SelectItem>
                      <SelectItem value="rank" className="uppercase font-bold">Rank</SelectItem>
                      <SelectItem value="player" className="uppercase font-bold">Player</SelectItem>
                      <SelectItem value="team" className="uppercase font-bold">Team</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="uppercase font-bold tracking-wider"
                    onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
                    data-testid="button-stats-sortdir"
                  >
                    {sortDirection === "asc" ? "Asc" : "Desc"}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Rows</div>
                  <Select value={rowsToShow} onValueChange={setRowsToShow}>
                    <SelectTrigger className="h-8 w-[120px] uppercase font-bold tracking-wider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10" className="uppercase font-bold">10</SelectItem>
                      <SelectItem value="25" className="uppercase font-bold">25</SelectItem>
                      <SelectItem value="50" className="uppercase font-bold">50</SelectItem>
                      <SelectItem value="100" className="uppercase font-bold">100</SelectItem>
                      <SelectItem value="all" className="uppercase font-bold">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full text-sm table-fixed" data-testid="table-stats">
                  <thead>
                    <tr className="text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="text-left px-4 py-3 whitespace-nowrap w-[64px] sm:px-5">
                        <button className="uppercase tracking-widest hover:text-primary" onClick={() => { setSortKey("rank"); setSortDirection((d) => (sortKey === "rank" && d === "desc" ? "asc" : "desc")); }}>
                          Rank{sortKey === "rank" ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 whitespace-nowrap w-[260px] sm:px-5">
                        <button className="uppercase tracking-widest hover:text-primary" onClick={() => { setSortKey("player"); setSortDirection((d) => (sortKey === "player" && d === "desc" ? "asc" : "desc")); }}>
                          Player{sortKey === "player" ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 whitespace-nowrap w-[220px] sm:px-5">
                        <button className="uppercase tracking-widest hover:text-primary" onClick={() => { setSortKey("team"); setSortDirection((d) => (sortKey === "team" && d === "desc" ? "asc" : "desc")); }}>
                          Team{sortKey === "team" ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}
                        </button>
                      </th>
                      <th className="text-right px-4 py-3 whitespace-nowrap w-[140px] sm:px-5">
                        <button className="uppercase tracking-widest hover:text-primary" onClick={() => { setSortKey("value"); setSortDirection((d) => (sortKey === "value" && d === "desc" ? "asc" : "desc")); }}>
                          Value{sortKey === "value" ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLeaders.map((l, idx) => (
                      <tr
                        key={`${l.id}-${idx}`}
                        className="border-t border-border/70 hover:bg-secondary/5 transition-colors"
                        data-testid={`row-stats-${idx}`}
                      >
                        <td className="px-4 py-3 font-mono whitespace-nowrap w-[64px] sm:px-5" data-testid={`text-stats-rank-${idx}`}>{l.rank}</td>
                        <td className="px-4 py-3 min-w-0 w-[260px] sm:px-5">
                          <div className="flex items-center gap-3 min-w-0 w-full">
                            {l.headshot ? (
                              <img
                                src={l.headshot}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                                data-testid={`img-stats-headshot-${idx}`}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-secondary/10" />
                            )}
                            {l.id ? (
                              <Link
                                href={`/sport/${sportKey}/athlete/${l.id}`}
                                className="font-bold truncate min-w-0 flex-1 hover:underline"
                                data-testid={`text-stats-player-${idx}`}
                              >
                                {l.athleteName}
                              </Link>
                            ) : (
                              <div className="font-bold truncate min-w-0 flex-1" data-testid={`text-stats-player-${idx}`}>{l.athleteName}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground min-w-0 w-[220px] sm:px-5" data-testid={`text-stats-team-${idx}`}>
                          <div className="flex items-center gap-2 min-w-0 w-full">
                            {l.teamLogo ? (
                              <img
                                src={l.teamLogo}
                                alt=""
                                className="h-5 w-5 object-contain"
                                data-testid={`img-stats-teamlogo-${idx}`}
                              />
                            ) : (
                              <div className="h-5 w-5 rounded bg-secondary/10" />
                            )}
                            {l.teamId ? (
                              <Link href={`/sport/${sportKey}/team/${l.teamId}`} className="truncate min-w-0 flex-1 hover:text-primary hover:underline">
                                {l.teamAbbr || l.teamName || "—"}
                              </Link>
                            ) : (
                              <span className="truncate min-w-0 flex-1">{l.teamAbbr || l.teamName || "—"}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-black whitespace-nowrap w-[140px] sm:px-5" data-testid={`text-stats-value-${idx}`}>{l.value || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
