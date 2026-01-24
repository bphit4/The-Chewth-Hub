import { SCORES } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export function ScoreTicker() {
  return (
    <div className="w-full bg-secondary text-secondary-foreground overflow-hidden border-b border-white/10">
      <div className="flex whitespace-nowrap animate-marquee py-2">
        {[...SCORES, ...SCORES, ...SCORES].map((score, i) => (
          <div key={`${score.id}-${i}`} className="inline-flex items-center space-x-4 px-6 border-r border-white/10 text-sm">
            <span className="font-bold text-primary text-xs">{score.league}</span>
            <div className="flex items-center space-x-2">
              <span className={cn(score.homeScore && score.awayScore && score.homeScore > score.awayScore ? "font-bold text-white" : "text-muted-foreground")}>
                {score.homeTeam} {score.homeScore}
              </span>
              <span className="text-muted-foreground text-xs">vs</span>
              <span className={cn(score.homeScore && score.awayScore && score.awayScore > score.homeScore ? "font-bold text-white" : "text-muted-foreground")}>
                {score.awayTeam} {score.awayScore}
              </span>
            </div>
            <span className="text-xs text-primary/80 font-medium">
              {score.status === 'Live' ? '● LIVE' : score.status === 'Final' ? 'FINAL' : score.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
