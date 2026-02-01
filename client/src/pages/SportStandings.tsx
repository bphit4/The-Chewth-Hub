import { useRoute } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { AlertCircle, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

interface StandingsEntry {
  id: string;
  teamName: string;
  teamAbbr: string;
  logo?: string;
  rank?: string;
  stats: Record<string, string>;
  statsNumeric: Record<string, number>;
}

interface StandingsGroup {
  groupName: string;
  parentGroup?: string;
  entries: StandingsEntry[];
}

type StatMeta = { priority: number };

function parseStats(statsArr: any[]): { stats: Record<string, string>; statsNumeric: Record<string, number> } {
  const stats: Record<string, string> = {};
  const statsNumeric: Record<string, number> = {};
  const statMeta: Record<string, StatMeta> = {};

  for (const s of statsArr) {
    const key = s?.shortDisplayName || s?.abbreviation || s?.name;
    if (!key) continue;

    const type = String(s?.type ?? "");
    const isDerived = type.includes("_");
    const isPrimary =
      s?.id === "0" ||
      ["wins", "losses", "winpercent", "gamesbehind", "pointsfor", "pointsagainst", "streak"].includes(type);
    const priority = isPrimary ? 2 : isDerived ? 0 : 1;

    const current = statMeta[key];
    if (!current || priority >= current.priority) {
      stats[key] = s?.displayValue ?? "";
      const numVal = parseFloat(s?.value ?? s?.displayValue ?? "");
      statsNumeric[key] = isNaN(numVal) ? 0 : numVal;
      statMeta[key] = { priority };
    }
  }
  return { stats, statsNumeric };
}

function parseOverallRecord(statsArr: any[]): { summary?: string; wins?: number; losses?: number; ties?: number } {
  const overall = statsArr.find((s: any) => {
    if (!s) return false;
    const name = String(s?.name ?? "").toLowerCase();
    const abbr = String(s?.abbreviation ?? "").toLowerCase();
    const short = String(s?.shortDisplayName ?? "").toLowerCase();
    return s?.id === "0" || s?.type === "total" || name === "overall" || abbr === "overall" || short === "over";
  });
  const summary = overall?.summary ?? overall?.displayValue ?? "";
  const match = /(\d+)\s*-\s*(\d+)(?:\s*-\s*(\d+))?/.exec(String(summary));
  if (!match) return { summary };
  return {
    summary: String(summary),
    wins: Number(match[1]),
    losses: Number(match[2]),
    ties: match[3] ? Number(match[3]) : 0
  };
}

function isEmptyStat(value?: string) {
  return value == null || value === "" || value === "—" || value === "-";
}

function applyRecordFallbacks(
  stats: Record<string, string>,
  statsNumeric: Record<string, number>,
  record: { wins?: number; losses?: number; ties?: number }
) {
  const wins = record.wins ?? 0;
  const losses = record.losses ?? 0;
  const ties = record.ties ?? 0;
  const total = wins + losses + ties;

  if (total <= 0) return;

  if (isEmptyStat(stats.W)) {
    stats.W = String(wins);
    statsNumeric.W = wins;
  }
  if (isEmptyStat(stats.L)) {
    stats.L = String(losses);
    statsNumeric.L = losses;
  }
  if (isEmptyStat(stats.PCT)) {
    const pct = (wins + ties * 0.5) / total;
    stats.PCT = pct.toFixed(3);
    statsNumeric.PCT = pct;
  }
}

function getStandingsEntries(node: any): any[] {
  const entries = node?.standings?.entries;
  return Array.isArray(entries) ? entries : [];
}

function getChildGroups(node: any): any[] {
  const children = node?.children ?? node?.groups ?? node?.group?.children ?? node?.group?.groups ?? [];
  return Array.isArray(children) ? children : [];
}

function pickStandingsRows(data: any): StandingsGroup[] {
  const out: StandingsGroup[] = [];

  const walk = (node: any, parentName?: string, depth = 0) => {
    if (!node) return;
    const groupName = node?.name ?? parentName ?? "";
    const standings = getStandingsEntries(node);
    if (standings.length) {
      const entries = standings.map((e: any) => {
        const team = e?.team ?? {};
        const { stats, statsNumeric } = parseStats(e?.stats ?? []);
        const overall = parseOverallRecord(e?.stats ?? []);
        applyRecordFallbacks(stats, statsNumeric, overall);
        return {
          id: String(team?.id ?? team?.abbreviation ?? team?.displayName ?? Math.random()),
          teamName: team?.displayName ?? "",
          teamAbbr: team?.abbreviation ?? "",
          logo: team?.logos?.[0]?.href,
          rank: e?.note?.rank ? String(e.note.rank) : undefined,
          stats,
          statsNumeric,
        };
      });
      if (entries.length) out.push({ groupName: groupName || "Standings", parentGroup: parentName, entries });
    }

    const nextParent = depth === 0 ? undefined : (node?.name ?? parentName);
    for (const child of getChildGroups(node)) {
      walk(child, nextParent, depth + 1);
    }
  };

  if (data) walk(data, undefined, 0);
  return out;
}

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

export default function SportStandings() {
  const [matchBase, paramsBase] = useRoute("/sport/:sport/standings");
  const [matchLevel, paramsLevel] = useRoute("/sport/:sport/standings/:level");
  const match = matchLevel || matchBase;
  const params = paramsLevel ?? paramsBase;
  const sport = params?.sport;
  const level = paramsLevel?.level ? String(paramsLevel.level).toLowerCase() : undefined;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);

  const [data, setData] = useState<any>(null);
  const [groupsData, setGroupsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfigs, setSortConfigs] = useState<Record<number, SortConfig>>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const groupParam = sportKey === "ncaaf" && level === "fcs" ? "?group=81" : "";
        const res = await fetch(`/api/espn/standings/${sportKey}${groupParam}`);
        if (!res.ok) throw new Error(`Failed to fetch standings (${res.status})`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load standings");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [sportKey, level]);

  useEffect(() => {
    let mounted = true;
    async function loadGroups() {
      try {
        const supported = ["nfl", "nba", "mlb"];
        if (!supported.includes(sportKey)) {
          if (mounted) setGroupsData(null);
          return;
        }
        const res = await fetch(`/api/espn/groups/${sportKey}`);
        if (!res.ok) throw new Error(`Failed to fetch groups (${res.status})`);
        const json = await res.json();
        if (mounted) setGroupsData(json);
      } catch {
        if (mounted) setGroupsData(null);
      }
    }
    loadGroups();
    return () => { mounted = false; };
  }, [sportKey]);

  if (!match || !cfg) return null;

  const groups = useMemo(() => pickStandingsRows(data), [data]);

  const divisionMap = useMemo(() => {
    const map: Record<string, { conference: string; division: string }> = {};
    const conferences = groupsData?.groups ?? [];
    if (!Array.isArray(conferences)) return map;
    for (const conf of conferences) {
      const confName = conf?.name ?? conf?.displayName ?? conf?.shortName ?? conf?.abbreviation ?? "Conference";
      const divisions = conf?.children ?? [];
      if (!Array.isArray(divisions)) continue;
      for (const div of divisions) {
        const divName = div?.name ?? div?.displayName ?? div?.abbreviation ?? "Division";
        const teams = div?.teams ?? [];
        if (!Array.isArray(teams)) continue;
        for (const team of teams) {
          const id = team?.id;
          if (id == null) continue;
          map[String(id)] = { conference: String(confName), division: String(divName) };
        }
      }
    }
    return map;
  }, [groupsData]);

  const groupedStandings = useMemo(() => {
    const supported = ["nfl", "nba", "mlb"];
    if (!supported.includes(sportKey)) return groups;
    if (!Object.keys(divisionMap).length) return groups;

    const byDivision: Record<string, StandingsGroup> = {};
    const otherEntries: StandingsEntry[] = [];

    for (const g of groups) {
      for (const entry of g.entries) {
        const meta = divisionMap[entry.id];
        if (!meta) {
          otherEntries.push(entry);
          continue;
        }
        const key = meta.division;
        if (!byDivision[key]) {
          byDivision[key] = {
            groupName: meta.division,
            parentGroup: meta.conference,
            entries: [],
          };
        }
        byDivision[key].entries.push(entry);
      }
    }

    const output = Object.values(byDivision);
    if (otherEntries.length) {
      output.push({ groupName: "Other", entries: otherEntries });
    }
    return output;
  }, [groups, divisionMap, sportKey]);
  
  const columnsBySport: Record<EspnSportKey, { key: string; label: string; sortable: boolean }[]> = {
    nfl: [
      { key: "W", label: "W", sortable: true },
      { key: "L", label: "L", sortable: true },
      { key: "PCT", label: "PCT", sortable: true },
      { key: "GB", label: "GB", sortable: true },
      { key: "PF", label: "PF", sortable: true },
      { key: "PA", label: "PA", sortable: true },
      { key: "HOME", label: "HOME", sortable: false },
      { key: "AWAY", label: "AWAY", sortable: false },
      { key: "DIV", label: "DIV", sortable: false },
      { key: "CONF", label: "CONF", sortable: false },
      { key: "STRK", label: "STRK", sortable: false },
    ],
    ncaaf: [
      { key: "W", label: "W", sortable: true },
      { key: "L", label: "L", sortable: true },
      { key: "PCT", label: "PCT", sortable: true },
      { key: "GB", label: "GB", sortable: true },
      { key: "PF", label: "PF", sortable: true },
      { key: "PA", label: "PA", sortable: true },
      { key: "HOME", label: "HOME", sortable: false },
      { key: "AWAY", label: "AWAY", sortable: false },
      { key: "CONF", label: "CONF", sortable: false },
      { key: "STRK", label: "STRK", sortable: false },
    ],
    nba: [
      { key: "W", label: "W", sortable: true },
      { key: "L", label: "L", sortable: true },
      { key: "PCT", label: "PCT", sortable: true },
      { key: "GB", label: "GB", sortable: true },
      { key: "PF", label: "PF", sortable: true },
      { key: "PA", label: "PA", sortable: true },
      { key: "HOME", label: "HOME", sortable: false },
      { key: "AWAY", label: "AWAY", sortable: false },
      { key: "DIV", label: "DIV", sortable: false },
      { key: "CONF", label: "CONF", sortable: false },
      { key: "STRK", label: "STRK", sortable: false },
    ],
    ncaab: [
      { key: "W", label: "W", sortable: true },
      { key: "L", label: "L", sortable: true },
      { key: "PCT", label: "PCT", sortable: true },
      { key: "GB", label: "GB", sortable: true },
      { key: "PF", label: "PF", sortable: true },
      { key: "PA", label: "PA", sortable: true },
      { key: "HOME", label: "HOME", sortable: false },
      { key: "AWAY", label: "AWAY", sortable: false },
      { key: "CONF", label: "CONF", sortable: false },
      { key: "STRK", label: "STRK", sortable: false },
    ],
    mlb: [
      { key: "W", label: "W", sortable: true },
      { key: "L", label: "L", sortable: true },
      { key: "PCT", label: "PCT", sortable: true },
      { key: "GB", label: "GB", sortable: true },
      { key: "RS", label: "RS", sortable: true },
      { key: "RA", label: "RA", sortable: true },
      { key: "HOME", label: "HOME", sortable: false },
      { key: "AWAY", label: "AWAY", sortable: false },
      { key: "STRK", label: "STRK", sortable: false },
    ],
    ufc: [
      { key: "W", label: "W", sortable: true },
      { key: "L", label: "L", sortable: true },
      { key: "PCT", label: "PCT", sortable: true },
      { key: "GB", label: "GB", sortable: true },
      { key: "PF", label: "PF", sortable: true },
      { key: "PA", label: "PA", sortable: true },
      { key: "HOME", label: "HOME", sortable: false },
      { key: "AWAY", label: "AWAY", sortable: false },
      { key: "DIV", label: "DIV", sortable: false },
      { key: "CONF", label: "CONF", sortable: false },
      { key: "STRK", label: "STRK", sortable: false },
    ],
  };

  const columns = columnsBySport[sportKey] ?? columnsBySport.nfl;

  const handleSort = (groupIndex: number, key: string) => {
    setSortConfigs(prev => {
      const current = prev[groupIndex];
      if (current?.key === key) {
        if (current.direction === 'desc') {
          return { ...prev, [groupIndex]: { key, direction: 'asc' } };
        } else {
          return { ...prev, [groupIndex]: null };
        }
      }
      return { ...prev, [groupIndex]: { key, direction: 'desc' } };
    });
  };

  const getSortedEntries = (entries: StandingsEntry[], groupIndex: number) => {
    const sortConfig = sortConfigs[groupIndex];
    if (!sortConfig) {
      const hasPct = entries.some((e) => Number.isFinite(e.statsNumeric.PCT) && e.statsNumeric.PCT !== 0);
      if (!hasPct) return entries;
      return [...entries].sort((a, b) => (b.statsNumeric.PCT ?? 0) - (a.statsNumeric.PCT ?? 0));
    }
    
    return [...entries].sort((a, b) => {
      const aVal = a.statsNumeric[sortConfig.key] ?? 0;
      const bVal = b.statsNumeric[sortConfig.key] ?? 0;
      return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
    });
  };

  const conferenceGroups = useMemo(() => {
    const grouped: Record<string, StandingsGroup[]> = {};
    for (const g of groupedStandings) {
      const key = g.parentGroup || 'Other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(g);
    }
    if (sportKey === "ncaaf") {
      const allGroups = Object.values(grouped).flat();
      const label = level === "fcs" ? "FCS" : "FBS";
      return allGroups.length ? { [label]: allGroups } : grouped;
    }
    return grouped;
  }, [groupedStandings, sportKey, level]);

  const sortedConferenceEntries = useMemo(() => {
    const entries = Object.entries(conferenceGroups);
    const toLeagueKey = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes("american") || lower.includes("al")) return "AL";
      if (lower.includes("national") || lower.includes("nl")) return "NL";
      return name;
    };
    const divisionRank = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes("east")) return 0;
      if (lower.includes("central")) return 1;
      if (lower.includes("west")) return 2;
      return 9;
    };
    return entries
      .sort((a, b) => {
        if (a[0] === "Other") return 1;
        if (b[0] === "Other") return -1;
        if (sportKey === "mlb") {
          const order = { AL: 0, NL: 1 };
          const aKey = toLeagueKey(a[0]);
          const bKey = toLeagueKey(b[0]);
          const aRank = aKey in order ? order[aKey as keyof typeof order] : 9;
          const bRank = bKey in order ? order[bKey as keyof typeof order] : 9;
          if (aRank !== bRank) return aRank - bRank;
        }
        return a[0].localeCompare(b[0]);
      })
      .map(([conference, divisions]) => {
        const sortedDivisions = [...divisions].sort((d1, d2) => {
          if (sportKey === "mlb") {
            const rankDiff = divisionRank(d1.groupName) - divisionRank(d2.groupName);
            if (rankDiff !== 0) return rankDiff;
          }
          return d1.groupName.localeCompare(d2.groupName);
        });
        return [conference, sortedDivisions] as [string, StandingsGroup[]];
      });
  }, [conferenceGroups, sportKey]);

  const groupIndexMap = useMemo(() => {
    const map = new Map<StandingsGroup, number>();
    groupedStandings.forEach((g, i) => map.set(g, i));
    return map;
  }, [groupedStandings]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />
      
      {/* Page Title */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">
            {cfg.label} Standings
          </h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Some leagues may not expose full standings.</div>
          </div>
        )}

        {loading && (
          <Card className="h-52 animate-pulse bg-card border-border" data-testid="skeleton-standings" />
        )}

        {!loading && !groups.length && (
          <Card className="p-6 bg-card border-border" data-testid="empty-standings">
            <div className="text-sm text-muted-foreground">No standings available for this sport right now.</div>
          </Card>
        )}

        <div className="space-y-8">
          {sortedConferenceEntries.map(([conferenceName, divisionGroups]) => (
            <div key={conferenceName} className="space-y-4">
              {conferenceName !== 'Other' && (
                <h2 className="text-lg font-heading font-black uppercase tracking-tight text-primary">
                  {conferenceName}
                </h2>
              )}
              
              {divisionGroups.map((g, gi) => {
                const globalIndex = groupIndexMap.get(g) ?? gi;
                const sortConfig = sortConfigs[globalIndex];
                const sortedEntries = getSortedEntries(g.entries, globalIndex);
                
                return (
                  <Card key={gi} className="bg-card border-border overflow-hidden" data-testid={`card-standings-group-${globalIndex}`}>
                    <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-muted/30">
                      <div className="font-heading uppercase tracking-wider font-bold text-sm">{g.groupName}</div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-[860px] w-full text-sm table-fixed" data-testid={`table-standings-${globalIndex}`}>
                        <thead>
                          <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border/50">
                            <th className="text-left px-5 py-2 w-[260px]">Team</th>
                            {columns.map((c) => (
                              <th key={c.key} className="text-right px-3 py-2 whitespace-nowrap w-[80px]">
                                {c.sortable ? (
                                  <button
                                    onClick={() => handleSort(globalIndex, c.key)}
                                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                                    data-testid={`button-sort-${c.key}-${globalIndex}`}
                                  >
                                    {c.label}
                                    {sortConfig?.key === c.key ? (
                                      sortConfig.direction === 'desc' ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronUp className="h-3 w-3" />
                                      )
                                    ) : (
                                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                                    )}
                                  </button>
                                ) : (
                                  c.label
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedEntries.map((e, ei) => (
                            <tr
                              key={e.id}
                              className="border-t border-border/40 hover:bg-muted/30 transition-colors"
                              data-testid={`row-standings-${globalIndex}-${ei}`}
                            >
                              <td className="px-5 py-2 w-[260px] min-w-0">
                                <div className="flex items-center gap-3 min-w-0">
                                  {e.logo ? (
                                    <img src={e.logo} alt="" className="h-6 w-6 object-contain" data-testid={`img-teamlogo-${e.id}`} />
                                  ) : (
                                    <div className="h-6 w-6 rounded bg-muted" />
                                  )}
                                  <span className="font-semibold text-sm truncate" data-testid={`text-teamname-${e.id}`}>
                                    {e.rank && <span className="text-muted-foreground mr-1">{e.rank}</span>}
                                    {e.teamName}
                                  </span>
                                </div>
                              </td>
                              {columns.map((c) => (
                                <td key={c.key} className="text-right px-3 py-2 font-mono text-sm whitespace-nowrap w-[80px]" data-testid={`text-standings-${c.key}-${e.id}`}>
                                  {e.stats[c.key] ?? "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
