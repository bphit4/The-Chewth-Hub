import { useRoute } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
}

interface StandingsGroup {
  groupName: string;
  entries: StandingsEntry[];
}

function pickStandingsRows(data: any): StandingsGroup[] {
  const groups = data?.children ?? [];
  const out: StandingsGroup[] = [];

  for (const g of groups) {
    const groupName = g?.name ?? "";
    const standings = g?.standings?.entries ?? [];
    const entries = standings.map((e: any) => {
      const team = e?.team ?? {};
      const statsArr = e?.stats ?? [];
      const stats: Record<string, string> = {};
      for (const s of statsArr) {
        const key = s?.abbreviation || s?.name;
        if (key) stats[key] = s?.displayValue ?? "";
      }
      return {
        id: String(team?.id ?? team?.abbreviation ?? team?.displayName ?? Math.random()),
        teamName: team?.displayName ?? "",
        teamAbbr: team?.abbreviation ?? "",
        logo: team?.logos?.[0]?.href,
        rank: e?.note?.rank ? String(e.note.rank) : undefined,
        stats,
      };
    });

    if (entries.length) out.push({ groupName, entries });
  }

  return out;
}

export default function SportStandings() {
  const [match, params] = useRoute("/sport/:sport/standings");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    { key: "W", label: "W" },
    { key: "L", label: "L" },
    { key: "PCT", label: "PCT" },
    { key: "GB", label: "GB" },
    { key: "PF", label: "PF" },
    { key: "PA", label: "PA" },
    { key: "HOME", label: "HOME" },
    { key: "AWAY", label: "AWAY" },
    { key: "DIV", label: "DIV" },
    { key: "CONF", label: "CONF" },
    { key: "STRK", label: "STRK" },
  ];

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
          {groups.map((g, gi) => (
            <Card key={gi} className="bg-card border-border overflow-hidden" data-testid={`card-standings-group-${gi}`}>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="font-heading uppercase tracking-wider font-bold">{g.groupName}</div>
                <Badge className="bg-secondary/10 text-muted-foreground border-border uppercase tracking-widest text-[10px] font-black rounded-sm">
                  Updated
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm" data-testid={`table-standings-${gi}`}>
                  <thead>
                    <tr className="text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="text-left px-5 py-3">Team</th>
                      {columns.map((c) => (
                        <th key={c.key} className="text-right px-3 py-3 whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.entries.map((e, ei) => (
                      <tr
                        key={e.id}
                        className="border-t border-border/70 hover:bg-secondary/5 transition-colors"
                        data-testid={`row-standings-${gi}-${ei}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {e.logo ? (
                              <img src={e.logo} alt="" className="h-7 w-7 object-contain" data-testid={`img-teamlogo-${e.id}`} />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-secondary/10" />
                            )}
                            <div className="min-w-[160px]">
                              <div className="font-bold leading-tight" data-testid={`text-teamname-${e.id}`}>
                                {e.rank ? `${e.rank}. ` : ""}
                                {e.teamName}
                              </div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold" data-testid={`text-teamabbr-${e.id}`}>
                                {e.teamAbbr}
                              </div>
                            </div>
                          </div>
                        </td>
                        {columns.map((c) => (
                          <td key={c.key} className="text-right px-3 py-3 font-mono" data-testid={`text-standings-${c.key}-${e.id}`}>
                            {e.stats[c.key] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
