import { useMemo, useState } from "react";
import { useRoute } from "wouter";
import { AlertCircle, ChevronRight } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { espnLeadersUrl } from "@/lib/espnApi";
import { useEspnResource } from "@/hooks/useEspnResource";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

function normalizeLeaderCategories(data: any) {
  const categories = data?.categories ?? data?.leaders ?? [];
  return (categories ?? []).map((c: any) => {
    const leaders = c?.leaders ?? [];
    return {
      name: c?.displayName ?? c?.name ?? "Leaders",
      shortName: c?.shortDisplayName ?? c?.shortName,
      leaders: leaders.map((l: any, idx: number) => {
        const athlete = l?.athlete ?? l?.athletes?.[0] ?? {};
        const team = l?.team ?? athlete?.team ?? {};
        const stat = l?.statValue ?? l?.displayValue ?? l?.value;
        const val = l?.displayValue ?? (stat != null ? String(stat) : "");
        return {
          id: String(l?.id ?? athlete?.id ?? `${idx}`),
          athleteName: athlete?.displayName ?? athlete?.fullName ?? "",
          teamAbbr: team?.abbreviation ?? "",
          teamName: team?.displayName ?? "",
          headshot: athlete?.headshot?.href,
          value: val,
          rank: l?.rank != null ? String(l.rank) : String(idx + 1),
        };
      }),
    };
  });
}

export default function SportStats() {
  const [match, params] = useRoute("/sport/:sport/stats");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);

  const url = cfg ? espnLeadersUrl(cfg.apiPath) : null;
  const { data, loading, error } = useEspnResource<any>(`leaders-${sportKey}`, url, { intervalMs: 5 * 60_000 });

  const categories = useMemo(() => normalizeLeaderCategories(data), [data]);
  const [active, setActive] = useState(0);

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
            {cfg.label} <span className="text-primary">Stats</span>
          </h1>
          <p className="text-white/70 mt-2">Player leaderboards (full tables per category).</p>
        </div>
      </div>

      <SportSubnav sportKey={sportKey} />

      <div className="container px-4 md:px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ESPN\u2019s leaders endpoint is inconsistent per league. If this stays unavailable, we can fall back to team stats or the core API.
            </div>
          </div>
        )}

        {loading && <Card className="h-52 animate-pulse bg-card border-border" data-testid="skeleton-stats" />}

        {!loading && !categories.length && (
          <Card className="p-6 bg-card border-border" data-testid="empty-stats">
            <div className="text-sm text-muted-foreground">No stats available for this sport right now.</div>
          </Card>
        )}

        {!loading && categories.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <Card className="bg-card border-border p-4 h-fit" data-testid="card-stats-categories">
              <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Categories</div>
              <div className="grid gap-2">
                {categories.map((c: any, idx: number) => {
                  const isActive = idx === active;
                  return (
                    <Button
                      key={`${c.name}-${idx}`}
                      data-testid={`button-statcat-${idx}`}
                      variant={isActive ? "default" : "outline"}
                      className={
                        isActive
                          ? "justify-start uppercase font-black tracking-wider"
                          : "justify-start uppercase font-bold tracking-wider"
                      }
                      onClick={() => setActive(idx)}
                    >
                      {c.shortName ?? c.name}
                    </Button>
                  );
                })}
              </div>
            </Card>

            <Card className="bg-card border-border overflow-hidden" data-testid="card-stats-table">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="font-heading uppercase tracking-wider font-bold" data-testid="text-stats-activecat">
                  {categories[active]?.name}
                </div>
                <Badge className="bg-secondary/10 text-muted-foreground border-border uppercase tracking-widest text-[10px] font-black rounded-sm">
                  Leaders
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm" data-testid="table-stats">
                  <thead>
                    <tr className="text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="text-left px-5 py-3">Rank</th>
                      <th className="text-left px-5 py-3">Player</th>
                      <th className="text-left px-5 py-3">Team</th>
                      <th className="text-right px-5 py-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(categories[active]?.leaders ?? []).map((l: any, idx: number) => (
                      <tr
                        key={`${l.id}-${idx}`}
                        className="border-t border-border/70 hover:bg-secondary/5 transition-colors"
                        data-testid={`row-stats-${idx}`}
                      >
                        <td className="px-5 py-3 font-mono" data-testid={`text-stats-rank-${idx}`}>{l.rank}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {l.headshot ? (
                              <img
                                src={l.headshot}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                                data-testid={`img-stats-headshot-${idx}`}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-secondary/10" />
                            )}
                            <div className="font-bold" data-testid={`text-stats-player-${idx}`}>{l.athleteName}</div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground" data-testid={`text-stats-team-${idx}`}>
                          {l.teamAbbr || l.teamName || "\u2014"}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-black" data-testid={`text-stats-value-${idx}`}>{l.value || "\u2014"}</td>
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
