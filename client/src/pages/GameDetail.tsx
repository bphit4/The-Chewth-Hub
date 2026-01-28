import { useRoute, Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { getSportConfig, SPORTS, type EspnSportKey } from "@/lib/espn";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

export default function GameDetail() {
  const [match, params] = useRoute("/sport/:sport/game/:id");
  const sport = params?.sport;
  const eventId = params?.id;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!cfg || !eventId) return;
      try {
        setError(null);
        setLoading(true);
        // Use backend proxy to avoid CORS issues
        const res = await fetch(`/api/espn/game/${sportKey}/${eventId}`);
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
  }, [sportKey, eventId]);

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
            Box Score & <span className="text-primary">Stats</span>
          </h1>
          <div className="text-white/70 mt-2">{header.status}</div>
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
            <CardTitle className="font-heading uppercase tracking-wider">Game Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="h-40 animate-pulse bg-secondary/5 rounded-xl" />
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
                          <div className="font-bold text-lg">{header.away?.team?.displayName}</div>
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
                          <div className="font-bold text-lg">{header.home?.team?.displayName}</div>
                          <div className="text-xs text-muted-foreground font-bold uppercase">{header.home?.team?.abbreviation}</div>
                        </div>
                      </div>
                      <div className="font-mono text-4xl font-black text-accent">{header.home?.score ?? "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
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
                                      <img src={athlete.headshot.href} alt="" className="h-6 w-6 rounded-full object-cover" />
                                    )}
                                    <span className="text-sm font-medium truncate">{athlete?.displayName ?? "Player"}</span>
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
