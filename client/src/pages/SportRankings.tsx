import { useMemo, useEffect, useState } from "react";
import { useRoute } from "wouter";
import { AlertCircle, ChevronRight } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

interface RankTeam {
  rank: string;
  teamName: string;
  abbr: string;
  logo?: string;
  record: string;
  points: string;
}

interface RankingGroup {
  name: string;
  ranks: RankTeam[];
}

function normalizeRankings(data: any): RankingGroup[] {
  const rankings = data?.rankings ?? [];
  return rankings.map((r: any) => {
    const ranks = r?.ranks ?? [];
    return {
      name: r?.name ?? r?.shortName ?? r?.type ?? "Rankings",
      ranks: ranks.map((x: any) => ({
        rank: String(x?.rank ?? ""),
        teamName: x?.team?.displayName ?? "",
        abbr: x?.team?.abbreviation ?? "",
        logo: x?.team?.logo ?? x?.team?.logos?.[0]?.href,
        record: x?.recordSummary ?? x?.record?.summary ?? "",
        points: x?.points != null ? String(x.points) : "",
      })),
    };
  });
}

export default function SportRankings() {
  const [match, params] = useRoute("/sport/:sport/rankings");
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
        const res = await fetch(`/api/espn/rankings/${sportKey}`);
        if (!res.ok) throw new Error(`Failed to fetch rankings (${res.status})`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load rankings");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [sportKey]);

  const groups = useMemo(() => normalizeRankings(data), [data]);

  if (!match || !cfg) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-10 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex items-center gap-3 text-white/80 text-sm font-bold uppercase tracking-widest">
            <span>The Chewth</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{cfg.label}</span>
          </div>
          <h1 className="mt-2 text-3xl md:text-5xl font-heading font-black text-white uppercase italic tracking-tighter">
            {cfg.label} <span className="text-primary">Rankings</span>
          </h1>
          <p className="text-white/70 mt-2">AP/Coaches/CFP-style lists (when available).</p>
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

        {loading && <Card className="h-52 animate-pulse bg-card border-border" data-testid="skeleton-rankings" />}

        {!loading && !groups.length && (
          <Card className="p-6 bg-card border-border" data-testid="empty-rankings">
            <div className="text-sm text-muted-foreground">No rankings available for this sport right now.</div>
          </Card>
        )}

        <div className="space-y-8">
          {!loading &&
            groups.map((g, gi) => (
              <Card key={gi} className="bg-card border-border overflow-hidden" data-testid={`card-rankings-${gi}`}>
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div className="font-heading uppercase tracking-wider font-bold">{g.name}</div>
                  <Badge className="bg-secondary/10 text-muted-foreground border-border uppercase tracking-widest text-[10px] font-black rounded-sm">
                    Top 25
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm" data-testid={`table-rankings-${gi}`}>
                    <thead>
                      <tr className="text-xs uppercase tracking-widest text-muted-foreground">
                        <th className="text-left px-5 py-3">Rank</th>
                        <th className="text-left px-5 py-3">Team</th>
                        <th className="text-right px-5 py-3">Record</th>
                        <th className="text-right px-5 py-3">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.ranks.map((r, ri) => (
                        <tr key={`${r.rank}-${ri}`} className="border-t border-border/70 hover:bg-secondary/5 transition-colors" data-testid={`row-rank-${gi}-${ri}`}>
                          <td className="px-5 py-3 font-mono" data-testid={`text-rank-${gi}-${ri}`}>{r.rank}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              {r.logo ? (
                                <img src={r.logo} alt="" className="h-7 w-7 object-contain" data-testid={`img-ranklogo-${gi}-${ri}`} />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-secondary/10" />
                              )}
                              <div className="font-bold" data-testid={`text-rankteam-${gi}-${ri}`}>{r.teamName}</div>
                              <div className="text-xs text-muted-foreground font-bold uppercase" data-testid={`text-rankabbr-${gi}-${ri}`}>{r.abbr}</div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right font-mono" data-testid={`text-rankrecord-${gi}-${ri}`}>{r.record || "—"}</td>
                          <td className="px-5 py-3 text-right font-mono" data-testid={`text-rankpoints-${gi}-${ri}`}>{r.points || "—"}</td>
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
