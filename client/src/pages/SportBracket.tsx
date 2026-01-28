import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { SPORTS, type EspnSportKey } from "@/lib/espn";
import { GitBranch } from "lucide-react";

const sportKeys = SPORTS.map((s) => s.key);

function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

export default function SportBracket() {
  const [match, params] = useRoute("/sport/:sport/bracket");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = SPORTS.find((s) => s.key === sportKey);

  if (!match || !cfg) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />
      
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">
            {cfg.label} Playoff Bracket
          </h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        <Card className="p-8 bg-card border-border text-center" data-testid="card-bracket-placeholder">
          <GitBranch className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2" data-testid="text-bracket-title">Bracket Visualization Coming Soon</h2>
          <p className="text-muted-foreground" data-testid="text-bracket-description">
            Interactive playoff bracket will be available during the {cfg.label} postseason.
          </p>
        </Card>
      </div>
    </div>
  );
}
