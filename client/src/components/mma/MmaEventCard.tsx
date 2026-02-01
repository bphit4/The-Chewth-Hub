import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FighterEntry = {
  id?: string;
  name?: string;
  shortName?: string;
  headshot?: string;
  flag?: string;
  record?: string;
  winner?: boolean;
  order?: number;
};

type FightEntry = {
  id: string;
  weightClass?: string;
  matchNumber?: number | null;
  cardSegment?: string;
  status?: string;
  state?: string;
  resultDetail?: string;
  fighters?: FighterEntry[];
};

type MmaEvent = {
  id: string;
  name?: string;
  shortName?: string;
  date?: string;
  status?: string;
  venue?: { name?: string; city?: string; state?: string; country?: string } | null;
  broadcast?: string;
  competitions?: FightEntry[];
};

function groupByCardSegment(fights: FightEntry[]) {
  const groups = new Map<string, FightEntry[]>();
  fights.forEach((fight) => {
    const name = fight.cardSegment || "Fights";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(fight);
  });
  const order = ["Main Card", "Prelims", "Early Prelims", "Fights"];
  return Array.from(groups.entries())
    .sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([name, fights]) => ({
      name,
      fights: [...fights].sort((a, b) => {
        if (a.matchNumber != null && b.matchNumber != null) return a.matchNumber - b.matchNumber;
        return String(a.id).localeCompare(String(b.id));
      }),
    }));
}

export function MmaEventCard({ event }: { event: MmaEvent }) {
  const fights = Array.isArray(event.competitions) ? event.competitions : [];
  const segments = groupByCardSegment(fights);

  return (
    <Card className="bg-card border-border overflow-hidden" data-testid={`mma-event-${event.id}`}>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="space-y-1">
          <div className="font-heading uppercase tracking-wider font-bold">
            {event.name || event.shortName || "Fight Card"}
          </div>
          <div className="text-xs text-muted-foreground">
            {event.date ? new Date(event.date).toLocaleString() : "Date TBD"}
          </div>
          {event.venue?.name && (
            <div className="text-xs text-muted-foreground">
              {event.venue.name}
              {event.venue.city ? ` • ${event.venue.city}` : ""}
              {event.venue.state ? `, ${event.venue.state}` : ""}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {event.status ? (
            <Badge variant="secondary" className="rounded text-[10px] font-bold px-2 py-0.5 bg-transparent text-muted-foreground">
              {event.status}
            </Badge>
          ) : null}
          <Link href={`/sport/ufc/game/${event.id}`} className="text-xs uppercase font-bold tracking-wider text-primary hover:text-primary/80">
            Fightcenter →
          </Link>
        </div>
      </div>

      {segments.map((segment, idx) => (
        <div key={`${event.id}-${segment.name}-${idx}`} className="border-t border-border/70">
          <div className="flex items-center justify-between px-5 py-3 bg-muted/20">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{segment.name}</div>
            {event.broadcast ? (
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{event.broadcast}</div>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left py-2 px-4">Fight</th>
                  <th className="text-left py-2 px-4">Weight</th>
                  <th className="text-right py-2 px-4">Result</th>
                </tr>
              </thead>
              <tbody>
                {segment.fights.map((fight) => {
                  const fighters = Array.isArray(fight.fighters) ? fight.fighters : [];
                  const ordered = [...fighters].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
                  const [away, home] = ordered;
                  const resultText = fight.resultDetail || fight.status || "Scheduled";
                  return (
                    <tr key={fight.id} className="border-b border-border/50 hover:bg-secondary/5">
                      <td className="py-2 px-4">
                        <div className="flex flex-col gap-2">
                          {[away, home].map((f, fi) => (
                            <div key={`${fight.id}-${fi}`} className="flex items-center gap-2">
                              {f?.headshot ? (
                                <img src={f.headshot} alt="" className="h-7 w-7 rounded-full object-cover" />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-secondary/10" />
                              )}
                              {f?.id ? (
                                <Link href={`/sport/ufc/athlete/${f.id}`} className="font-semibold hover:text-primary transition-colors">
                                  {f?.name || "TBD"}
                                </Link>
                              ) : (
                                <div className="font-semibold">{f?.name || "TBD"}</div>
                              )}
                              {f?.flag && <img src={f.flag} alt="" className="h-4 w-4 object-contain" />}
                              {f?.record && <div className="text-xs text-muted-foreground font-mono">{f.record}</div>}
                              {f?.winner && <Badge className="ml-1 text-[9px] uppercase">W</Badge>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-sm text-muted-foreground">{fight.weightClass || "—"}</td>
                      <td className="py-2 px-4 text-right font-mono">{resultText}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </Card>
  );
}
