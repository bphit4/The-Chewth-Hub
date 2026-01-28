import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";


export default function Scores() {
  // ESPN-like entry point: choose a sport, then use consistent per-sport tabs.
  // This keeps the architecture clean and makes it easy to swap data providers later.
  const sports = [
    { key: "nfl", label: "NFL", href: "/sport/nfl/scores" },
    { key: "ncaaf", label: "College Football", href: "/sport/ncaaf/scores" },
    { key: "nba", label: "NBA", href: "/sport/nba/scores" },
    { key: "ncaab", label: "College Basketball", href: "/sport/ncaab/scores" },
    { key: "mlb", label: "MLB", href: "/sport/mlb/scores" },
    { key: "ufc", label: "UFC", href: "/sport/ufc/scores" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-12 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />
        <div className="container px-4 md:px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white uppercase italic tracking-tighter">
            Live <span className="text-primary">Scoreboard</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Real-time updates from across the leagues.</p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sports.map((s) => (
            <Link key={s.key} href={s.href}>
              <a data-testid={`card-sport-${s.key}`} className="block">
                <Card className="relative overflow-hidden border-border p-6 bg-card hover:shadow-xl hover:shadow-primary/10 transition-all group">
                  <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-primary">Scores Hub</div>
                      <div className="mt-2 font-heading text-3xl font-black uppercase italic tracking-tight">{s.label}</div>
                      <div className="mt-2 text-sm text-muted-foreground">Scores • News • Standings • Stats</div>
                    </div>
                    <Badge className="bg-secondary/10 text-muted-foreground border-border uppercase tracking-widest text-[10px] font-black rounded-sm">
                      Open
                    </Badge>
                  </div>
                </Card>
              </a>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-secondary/5 p-6">
          <div className="font-heading font-bold uppercase tracking-wider">What’s next</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Each sport now has the same ESPN-style navigation pattern and clickable games that open a box score view.
            We can keep expanding each tab (Standings/Stats/Teams/etc.) with ESPN endpoints or swap to an official provider later.
          </div>
        </div>
      </div>
    </div>
  );
}
