import { useMemo, useEffect, useState } from "react";
import { useRoute } from "wouter";
import { AlertCircle } from "lucide-react";
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

interface FighterRank {
  rank: string;
  name: string;
  record: string;
  headshot?: string;
  flag?: string;
  trend?: string;
  defenses?: number;
  hasAccolade?: boolean;
}

interface MmaRankingGroup {
  name: string;
  ranks: FighterRank[];
  type?: string;
  weightClass?: string;
}

interface ChampionEntry {
  division: string;
  fighter: FighterRank;
}

function normalizeRankings(data: any): RankingGroup[] {
  const rankings = data?.rankings ?? [];
  return rankings.map((r: any) => {
    const ranks = r?.ranks ?? [];
    return {
      name: r?.name ?? r?.shortName ?? r?.type ?? "Rankings",
      ranks: ranks.map((x: any, index: number) => {
        // ESPN may use "rank", "current", or "position"; fallback to 1-based index
        const rankValue = x?.rank ?? x?.current ?? x?.position ?? (index + 1);
        return {
          rank: String(rankValue),
          teamName: x?.team?.displayName ?? "",
          abbr: x?.team?.abbreviation ?? "",
          logo: x?.team?.logo ?? x?.team?.logos?.[0]?.href,
          record: x?.recordSummary ?? x?.record?.summary ?? "",
          points: x?.points != null ? String(x.points) : "",
        };
      }),
    };
  });
}

function normalizeMmaRankings(data: any): { champions: ChampionEntry[]; groups: MmaRankingGroup[] } {
  const rankings = Array.isArray(data?.rankings) ? data.rankings : [];
  const isChampion = (r: any) => /champions/i.test(r?.name ?? "") || String(r?.type ?? "").includes("champions");

  const toFighterRank = (x: any, index: number): FighterRank => {
    const athlete = x?.athlete ?? {};
    const rankValue = x?.current ?? x?.rank ?? x?.position ?? (index + 1);
    const headshot = athlete?.headshot;
    const flag = athlete?.flag;
    return {
      rank: String(rankValue),
      name: athlete?.displayName ?? athlete?.fullName ?? athlete?.name ?? "",
      record: x?.recordSummary ?? "",
      headshot: typeof headshot === "string" ? headshot : headshot?.href,
      flag: typeof flag === "string" ? flag : flag?.href,
      trend: x?.trend,
      defenses: x?.defenses,
      hasAccolade: x?.hasAccolade,
    };
  };

  const champions = rankings
    .filter(isChampion)
    .map((r: any) => {
      const top = Array.isArray(r?.ranks) ? r.ranks[0] : null;
      if (!top) return null;
      const division = r?.weightClass?.text ?? r?.shortName ?? r?.name ?? "Champions";
      return {
        division,
        fighter: toFighterRank(top, 0),
      };
    })
    .filter(Boolean) as ChampionEntry[];

  const groups = rankings
    .filter((r: any) => !isChampion(r))
    .map((r: any) => {
      const ranks = Array.isArray(r?.ranks) ? r.ranks : [];
      return {
        name: r?.name ?? r?.shortName ?? r?.type ?? "Rankings",
        type: r?.type,
        weightClass: r?.weightClass?.text ?? r?.weightClass?.shortName ?? r?.name,
        ranks: ranks.map((x: any, index: number) => toFighterRank(x, index)),
      };
    })
    .filter((g: MmaRankingGroup) => g.ranks.length > 0);

  return { champions, groups };
}

export default function SportRankings() {
  const [match, params] = useRoute("/sport/:sport/rankings");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);
  const isCollege = sportKey === "ncaaf" || sportKey === "ncaab";
  const isMma = sportKey === "ufc";

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
  const mmaData = useMemo(() => normalizeMmaRankings(data), [data]);

  if (!match || !cfg) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />
      
      {/* Page Title */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">
            {cfg.label} Rankings
          </h1>
        </div>
      </div>

      <div className={isCollege ? "container px-4 md:px-6 py-6" : "container px-4 md:px-6 py-8"}>
        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          </div>
        )}

        {loading && <Card className="h-52 animate-pulse bg-card border-border" data-testid="skeleton-rankings" />}

        {!loading && !isMma && !groups.length && (
          <Card className="p-6 bg-card border-border" data-testid="empty-rankings">
            <div className="text-sm text-muted-foreground">No rankings available for this sport right now.</div>
          </Card>
        )}

        {!loading && isMma && !mmaData.groups.length && !mmaData.champions.length && (
          <Card className="p-6 bg-card border-border" data-testid="empty-rankings-mma">
            <div className="text-sm text-muted-foreground">No MMA rankings available right now.</div>
          </Card>
        )}

        {isMma ? (
          <div className="space-y-8">
            {mmaData.champions.length > 0 && (
              <Card className="bg-card border-border overflow-hidden" data-testid="card-mma-champions">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div className="font-heading uppercase tracking-wider font-bold">Champions</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm" data-testid="table-mma-champions">
                    <thead>
                      <tr className="text-xs uppercase tracking-widest text-muted-foreground">
                        <th className="text-left px-5 py-3">Division</th>
                        <th className="text-left px-5 py-3">Champion</th>
                        <th className="text-right px-5 py-3">Record</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mmaData.champions.map((c, ci) => (
                        <tr key={`${c.division}-${ci}`} className="border-t border-border/70 hover:bg-secondary/5 transition-colors">
                          <td className="px-5 py-3 font-semibold">{c.division}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              {c.fighter.headshot ? (
                                <img src={c.fighter.headshot} alt="" className="h-7 w-7 rounded-full object-cover" />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-secondary/10" />
                              )}
                              <div className="font-bold">{c.fighter.name || "TBD"}</div>
                              {c.fighter.flag ? <img src={c.fighter.flag} alt="" className="h-4 w-4 object-contain" /> : null}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right font-mono">{c.fighter.record || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {mmaData.groups.map((g, gi) => (
              <Card key={`${g.name}-${gi}`} className="bg-card border-border overflow-hidden" data-testid={`card-rankings-${gi}`}>
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div className="font-heading uppercase tracking-wider font-bold">{g.name}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm" data-testid={`table-rankings-${gi}`}>
                    <thead>
                      <tr className="text-xs uppercase tracking-widest text-muted-foreground">
                        <th className="text-left px-5 py-3">Rank</th>
                        <th className="text-left px-5 py-3">Fighter</th>
                        <th className="text-right px-5 py-3">Record</th>
                        <th className="text-right px-5 py-3">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.ranks.map((r, ri) => (
                        <tr key={`${r.rank}-${ri}`} className="border-t border-border/70 hover:bg-secondary/5 transition-colors">
                          <td className="px-5 py-3 font-mono">{r.rank}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              {r.headshot ? (
                                <img src={r.headshot} alt="" className="h-7 w-7 rounded-full object-cover" />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-secondary/10" />
                              )}
                              <div className="font-bold">{r.name || "—"}</div>
                              {r.flag ? <img src={r.flag} alt="" className="h-4 w-4 object-contain" /> : null}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right font-mono">{r.record || "—"}</td>
                          <td className="px-5 py-3 text-right font-mono">{r.trend || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className={isCollege ? "grid gap-4 md:grid-cols-2" : "space-y-8"}>
            {!loading &&
              groups.map((g, gi) => (
                <Card key={gi} className="bg-card border-border overflow-hidden" data-testid={`card-rankings-${gi}`}>
                  <div className={isCollege ? "flex items-center justify-between border-b border-border px-4 py-2" : "flex items-center justify-between border-b border-border px-5 py-4"}>
                    <div className={isCollege ? "font-heading uppercase tracking-wider font-bold text-sm" : "font-heading uppercase tracking-wider font-bold"}>{g.name}</div>
                    <Badge className={isCollege ? "bg-secondary/10 text-muted-foreground border-border uppercase tracking-widest text-[9px] font-black rounded-sm" : "bg-secondary/10 text-muted-foreground border-border uppercase tracking-widest text-[10px] font-black rounded-sm"}>
                      Top 25
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <table className={isCollege ? "min-w-full text-xs" : "min-w-full text-sm"} data-testid={`table-rankings-${gi}`}>
                      <thead>
                        <tr className={isCollege ? "text-[10px] uppercase tracking-widest text-muted-foreground" : "text-xs uppercase tracking-widest text-muted-foreground"}>
                          <th className={isCollege ? "text-left px-4 py-2" : "text-left px-5 py-3"}>Rank</th>
                          <th className={isCollege ? "text-left px-4 py-2" : "text-left px-5 py-3"}>Team</th>
                          <th className={isCollege ? "text-right px-4 py-2" : "text-right px-5 py-3"}>Record</th>
                          <th className={isCollege ? "text-right px-4 py-2" : "text-right px-5 py-3"}>Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.ranks.map((r, ri) => (
                          <tr key={`${r.rank}-${ri}`} className="border-t border-border/70 hover:bg-secondary/5 transition-colors" data-testid={`row-rank-${gi}-${ri}`}>
                            <td className={isCollege ? "px-4 py-2 font-mono" : "px-5 py-3 font-mono"} data-testid={`text-rank-${gi}-${ri}`}>{r.rank}</td>
                            <td className={isCollege ? "px-4 py-2" : "px-5 py-3"}>
                              <div className={isCollege ? "flex items-center gap-2" : "flex items-center gap-3"}>
                                {r.logo ? (
                                  <img src={r.logo} alt="" className={isCollege ? "h-5 w-5 object-contain" : "h-7 w-7 object-contain"} data-testid={`img-ranklogo-${gi}-${ri}`} />
                                ) : (
                                  <div className={isCollege ? "h-5 w-5 rounded-full bg-secondary/10" : "h-7 w-7 rounded-full bg-secondary/10"} />
                                )}
                                <div className={isCollege ? "font-bold text-xs" : "font-bold"} data-testid={`text-rankteam-${gi}-${ri}`}>{r.teamName}</div>
                                <div className={isCollege ? "text-[10px] text-muted-foreground font-bold uppercase" : "text-xs text-muted-foreground font-bold uppercase"} data-testid={`text-rankabbr-${gi}-${ri}`}>{r.abbr}</div>
                              </div>
                            </td>
                            <td className={isCollege ? "px-4 py-2 text-right font-mono" : "px-5 py-3 text-right font-mono"} data-testid={`text-rankrecord-${gi}-${ri}`}>{r.record || "—"}</td>
                            <td className={isCollege ? "px-4 py-2 text-right font-mono" : "px-5 py-3 text-right font-mono"} data-testid={`text-rankpoints-${gi}-${ri}`}>{r.points || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
