import { useMemo, useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { AlertCircle, ChevronRight } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

interface OddsRow {
  id: string;
  label: string;
  status: string;
  provider: string;
  details: string;
  overUnder?: string;
  spread?: string;
}

function normalizeOdds(data: any): OddsRow[] {
  const events = data?.events ?? [];
  const rows: OddsRow[] = [];

  for (const e of events) {
    const comp = e?.competitions?.[0];
    const odds = comp?.odds?.[0];
    if (!odds) continue;
    rows.push({
      id: String(e?.id ?? comp?.id ?? Math.random()),
      label: e?.name ?? "",
      status: e?.status?.type?.shortDetail ?? "",
      provider: odds?.provider?.name ?? "Odds",
      details: odds?.details ?? "",
      overUnder: odds?.overUnder ? String(odds.overUnder) : undefined,
      spread: odds?.spread ? String(odds.spread) : undefined,
    });
  }

  return rows;
}

export default function SportOdds() {
  const [match, params] = useRoute("/sport/:sport/odds");
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
        const res = await fetch(`/api/espn/scoreboard/${sportKey}`);
        if (!res.ok) throw new Error(`Failed to fetch odds (${res.status})`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load odds");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, [sportKey]);

  const rows = useMemo(() => normalizeOdds(data), [data]);

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
            {cfg.label} <span className="text-primary">Odds</span>
          </h1>
          <p className="text-white/70 mt-2">Lines from ESPN where available. Auto-refreshes every 60 seconds.</p>
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

        {loading && <Card className="h-52 animate-pulse bg-card border-border" data-testid="skeleton-odds" />}

        {!loading && !rows.length && (
          <Card className="p-6 bg-card border-border" data-testid="empty-odds">
            <div className="text-sm text-muted-foreground">
              No odds available for the current slate (ESPN doesn't provide odds for every sport/event).
            </div>
            <div className="mt-4">
              <Link href={`/sport/${sportKey}/scores`} data-testid="link-odds-scores" className="block">
                <Button data-testid="button-odds-scores" size="sm" variant="outline" className="uppercase font-bold tracking-wider">
                  Back to Scores
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!loading &&
            rows.map((r) => (
              <Card key={r.id} className="bg-card border-border p-5" data-testid={`card-odds-${r.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-primary text-primary-foreground uppercase font-black tracking-widest text-[10px] rounded-sm" data-testid={`badge-odds-provider-${r.id}`}>
                    {r.provider}
                  </Badge>
                  <div className="text-xs text-muted-foreground" data-testid={`text-odds-status-${r.id}`}>{r.status}</div>
                </div>
                <div className="font-bold leading-tight" data-testid={`text-odds-game-${r.id}`}>{r.label}</div>
                <div className="mt-2 text-sm text-muted-foreground" data-testid={`text-odds-details-${r.id}`}>{r.details}</div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-secondary/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Over/Under</div>
                    <div className="mt-1 font-mono text-lg font-black" data-testid={`text-odds-ou-${r.id}`}>{r.overUnder ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Spread</div>
                    <div className="mt-1 font-mono text-lg font-black" data-testid={`text-odds-spread-${r.id}`}>{r.spread ?? "—"}</div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
