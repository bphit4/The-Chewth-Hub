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

function parseStats(statsArr: any[]): { stats: Record<string, string>; statsNumeric: Record<string, number> } {
  const stats: Record<string, string> = {};
  const statsNumeric: Record<string, number> = {};
  for (const s of statsArr) {
    const key = s?.abbreviation || s?.name;
    if (key) {
      stats[key] = s?.displayValue ?? "";
      const numVal = parseFloat(s?.value ?? s?.displayValue ?? "");
      statsNumeric[key] = isNaN(numVal) ? 0 : numVal;
    }
  }
  return { stats, statsNumeric };
}

function pickStandingsRows(data: any): StandingsGroup[] {
  const groups = data?.children ?? [];
  const out: StandingsGroup[] = [];

  for (const g of groups) {
    const parentName = g?.name ?? "";
    const children = g?.children ?? [];
    
    if (children.length > 0) {
      for (const child of children) {
        const groupName = child?.name ?? "";
        const standings = child?.standings?.entries ?? [];
        const entries = standings.map((e: any) => {
          const team = e?.team ?? {};
          const { stats, statsNumeric } = parseStats(e?.stats ?? []);
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
        if (entries.length) out.push({ groupName, parentGroup: parentName, entries });
      }
    } else {
      const standings = g?.standings?.entries ?? [];
      const entries = standings.map((e: any) => {
        const team = e?.team ?? {};
        const { stats, statsNumeric } = parseStats(e?.stats ?? []);
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
      if (entries.length) out.push({ groupName: parentName, entries });
    }
  }

  return out;
}

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

export default function SportStandings() {
  const [match, params] = useRoute("/sport/:sport/standings");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfigs, setSortConfigs] = useState<Record<number, SortConfig>>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/espn/standings/${sportKey}`);
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
  }, [sportKey]);

  if (!match || !cfg) return null;

  const groups = useMemo(() => pickStandingsRows(data), [data]);
  
  const columns = [
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
  ];

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
    if (!sortConfig) return entries;
    
    return [...entries].sort((a, b) => {
      const aVal = a.statsNumeric[sortConfig.key] ?? 0;
      const bVal = b.statsNumeric[sortConfig.key] ?? 0;
      return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
    });
  };

  const conferenceGroups = useMemo(() => {
    const grouped: Record<string, StandingsGroup[]> = {};
    for (const g of groups) {
      const key = g.parentGroup || 'Other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(g);
    }
    return grouped;
  }, [groups]);

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
          {Object.entries(conferenceGroups).map(([conferenceName, divisionGroups]) => (
            <div key={conferenceName} className="space-y-4">
              {conferenceName !== 'Other' && (
                <h2 className="text-lg font-heading font-black uppercase tracking-tight text-primary">
                  {conferenceName}
                </h2>
              )}
              
              {divisionGroups.map((g, gi) => {
                const globalIndex = groups.indexOf(g);
                const sortConfig = sortConfigs[globalIndex];
                const sortedEntries = getSortedEntries(g.entries, globalIndex);
                
                return (
                  <Card key={gi} className="bg-card border-border overflow-hidden" data-testid={`card-standings-group-${globalIndex}`}>
                    <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-muted/30">
                      <div className="font-heading uppercase tracking-wider font-bold text-sm">{g.groupName}</div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm" data-testid={`table-standings-${globalIndex}`}>
                        <thead>
                          <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border/50">
                            <th className="text-left px-5 py-2">Team</th>
                            {columns.map((c) => (
                              <th key={c.key} className="text-right px-3 py-2 whitespace-nowrap">
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
                              <td className="px-5 py-2">
                                <div className="flex items-center gap-3">
                                  {e.logo ? (
                                    <img src={e.logo} alt="" className="h-6 w-6 object-contain" data-testid={`img-teamlogo-${e.id}`} />
                                  ) : (
                                    <div className="h-6 w-6 rounded bg-muted" />
                                  )}
                                  <span className="font-semibold text-sm" data-testid={`text-teamname-${e.id}`}>
                                    {e.rank && <span className="text-muted-foreground mr-1">{e.rank}</span>}
                                    {e.teamName}
                                  </span>
                                </div>
                              </td>
                              {columns.map((c) => (
                                <td key={c.key} className="text-right px-3 py-2 font-mono text-sm" data-testid={`text-standings-${c.key}-${e.id}`}>
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
