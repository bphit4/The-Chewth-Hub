import { useMemo } from "react";
import { useRoute } from "wouter";
import { AlertCircle, ChevronRight, ExternalLink } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { espnNewsUrl } from "@/lib/espnApi";
import { useEspnResource } from "@/hooks/useEspnResource";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

function normalizeArticles(data: any) {
  const articles = data?.articles ?? [];
  return articles
    .map((a: any) => {
      const img = a?.images?.[0]?.url;
      return {
        id: String(a?.id ?? a?.headline ?? Math.random()),
        headline: a?.headline ?? "",
        description: a?.description ?? a?.summary ?? "",
        published: a?.published ?? "",
        byline: a?.byline ?? "",
        img,
        link: a?.links?.web?.href || a?.links?.api?.news?.href,
      };
    })
    .filter((a: any) => a.headline);
}

export default function SportNews() {
  const [match, params] = useRoute("/sport/:sport/news");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);

  const url = cfg ? espnNewsUrl(cfg.apiPath, 30) : null;
  const { data, loading, error } = useEspnResource<any>(`news-${sportKey}`, url, { intervalMs: 3 * 60_000 });

  const articles = useMemo(() => normalizeArticles(data), [data]);

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
            {cfg.label} <span className="text-primary">News</span>
          </h1>
          <p className="text-white/70 mt-2">Latest headlines. Auto-refreshes every 3 minutes.</p>
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

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {(loading ? Array(9).fill(0) : articles).map((a: any, idx: number) =>
            loading ? (
              <Card key={idx} className="h-72 animate-pulse bg-card border-border" data-testid={`skeleton-article-${idx}`} />
            ) : (
              <Card key={a.id} className="overflow-hidden bg-card border-border" data-testid={`card-article-${a.id}`}>
                {a.img && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={a.img} alt="" className="h-full w-full object-cover" data-testid={`img-article-${a.id}`} />
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary text-primary-foreground uppercase font-black tracking-widest text-[10px] rounded-sm" data-testid={`badge-article-${a.id}`}>
                      {cfg.label}
                    </Badge>
                    <div className="text-xs text-muted-foreground" data-testid={`text-article-date-${a.id}`}>
                      {a.published ? new Date(a.published).toLocaleString() : ""}
                    </div>
                  </div>
                  <div className="font-heading text-2xl font-black leading-tight" data-testid={`text-article-headline-${a.id}`}>{a.headline}</div>
                  {a.description && (
                    <div className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-article-desc-${a.id}`}>{a.description}</div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground truncate" data-testid={`text-article-byline-${a.id}`}>{a.byline}</div>
                    {a.link && (
                      <Button
                        data-testid={`button-open-article-${a.id}`}
                        size="sm"
                        variant="outline"
                        className="gap-2 uppercase font-bold tracking-wider"
                        asChild
                      >
                        <a href={a.link} target="_blank" rel="noreferrer">
                          Open <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
}
