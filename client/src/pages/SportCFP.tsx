import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { SPORTS, type EspnSportKey } from "@/lib/espn";
import { Trophy } from "lucide-react";

const sportKeys = SPORTS.map((s) => s.key);

function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

export default function SportCFP() {
  const [match, params] = useRoute("/sport/:sport/cfp");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "ncaaf";
  const cfg = SPORTS.find((s) => s.key === sportKey);

  if (!match || !cfg) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />
      
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">
            College Football Playoff
          </h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        <Card className="p-8 bg-card border-border text-center" data-testid="card-cfp-placeholder">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2" data-testid="text-cfp-title">CFP Information Coming Soon</h2>
          <p className="text-muted-foreground" data-testid="text-cfp-description">
            College Football Playoff rankings, brackets, and game results will be available during the CFP season.
          </p>
        </Card>
      </div>
    </div>
  );
}
