import { useRoute, Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { espnSummaryUrl, getSportConfig, SPORTS, type EspnSportKey } from "@/lib/espn";

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
        const res = await fetch(espnSummaryUrl(cfg.apiPath, eventId));
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
    return {
      status: data?.header?.competitions?.[0]?.status?.type?.shortDetail ?? "",
      home,
      away,
      link: data?.header?.links?.find((l: any) => l?.rel?.includes("summary"))?.href,
    };
  }, [data]);

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
                        {header.away?.team?.logo && (
                          <img src={header.away.team.logo} alt="" className="h-10 w-10 object-contain" />
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
                        {header.home?.team?.logo && (
                          <img src={header.home.team.logo} alt="" className="h-10 w-10 object-contain" />
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

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-border p-5 bg-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-heading font-bold uppercase">Team Stats</div>
                      <Badge className="bg-primary text-primary-foreground uppercase font-black tracking-widest text-[10px] rounded-sm">Auto</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      This view is wired to ESPN's summary endpoint. Next, we can map specific stat tables (passing/rushing/receiving, etc.) per sport.
                    </div>
                    <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-secondary/5 p-3 text-[11px] leading-snug">
{JSON.stringify(data?.boxscore?.teams?.[0]?.statistics?.slice?.(0, 8) ?? [], null, 2)}
                    </pre>
                  </div>

                  <div className="rounded-xl border border-border p-5 bg-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-heading font-bold uppercase">Leaders</div>
                      <div className="text-xs text-muted-foreground">Preview</div>
                    </div>
                    <pre className="max-h-64 overflow-auto rounded-lg bg-secondary/5 p-3 text-[11px] leading-snug">
{JSON.stringify(data?.leaders?.slice?.(0, 2) ?? [], null, 2)}
                    </pre>
                  </div>
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
