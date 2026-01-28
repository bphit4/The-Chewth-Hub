import { useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import { AlertCircle, ChevronRight, Search } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { espnTeamsUrl } from "@/lib/espnApi";
import { useEspnResource } from "@/hooks/useEspnResource";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

function normalizeTeams(data: any) {
  const teams = data?.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return teams
    .map((t: any) => {
      const team = t?.team ?? {};
      return {
        id: String(team?.id ?? ""),
        name: team?.displayName ?? "",
        abbr: team?.abbreviation ?? "",
        logo: team?.logos?.[0]?.href ?? team?.logo,
        color: team?.color ? `#${team.color}` : undefined,
        altColor: team?.alternateColor ? `#${team.alternateColor}` : undefined,
      };
    })
    .filter((t: any) => t.id && t.name);
}

export default function SportTeams() {
  const [match, params] = useRoute("/sport/:sport/teams");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);

  const url = cfg ? espnTeamsUrl(cfg.apiPath) : null;
  const { data, loading, error } = useEspnResource<any>(`teams-${sportKey}`, url, { intervalMs: 60 * 60_000 });

  const [q, setQ] = useState("");
  const teams = useMemo(() => normalizeTeams(data), [data]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return teams;
    return teams.filter((t: any) => `${t.name} ${t.abbr}`.toLowerCase().includes(s));
  }, [teams, q]);

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
            {cfg.label} <span className="text-primary">Teams</span>
          </h1>
          <p className="text-white/70 mt-2">Searchable directory. Updates hourly.</p>
        </div>
      </div>

      <SportSubnav sportKey={sportKey} />

      <div className="container px-4 md:px-6 py-8">
        <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-team-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${cfg.label} teams...`}
              className="pl-9"
            />
          </div>
          <Badge className="w-fit bg-secondary/10 text-muted-foreground border-border uppercase tracking-widest text-[10px] font-black rounded-sm" data-testid="badge-team-count">
            {filtered.length} teams
          </Badge>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(loading ? Array(12).fill(0) : filtered).map((t: any, idx: number) =>
            loading ? (
              <Card key={idx} className="h-28 animate-pulse bg-card border-border" data-testid={`skeleton-team-${idx}`} />
            ) : (
              <Link
                key={t.id}
                href={`/sport/${sportKey}/team/${t.id}`}
                className="block"
                data-testid={`card-team-${t.id}`}
              >
                <Card className="bg-card border-border hover:shadow-xl hover:shadow-primary/10 transition-all overflow-hidden">
                  <div className="h-1" style={{ background: t.color ?? "transparent" }} />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      {t.logo ? (
                        <img src={t.logo} alt="" className="h-10 w-10 object-contain" data-testid={`img-team-${t.id}`} />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-secondary/10" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold leading-tight truncate" data-testid={`text-team-${t.id}`}>{t.name}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold" data-testid={`text-teamabbr-${t.id}`}>{t.abbr}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
