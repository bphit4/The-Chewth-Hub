import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Score {
  id: string;
  league: string;
  status: string;
  homeTeam: string;
  homeScore?: number;
  awayTeam: string;
  awayScore?: number;
  time?: string;
}

export function ScoreTicker() {
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    async function fetchScores() {
      try {
        // Using ESPN's public API endpoints for common leagues
        // These are public and don't require an API key
        const leagues = ['nfl', 'nba', 'mlb', 'college-football'];
        const results = await Promise.all(
          leagues.map(async (league) => {
            const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${league === 'college-football' ? 'football/college-football' : league === 'nfl' ? 'football/nfl' : league === 'nba' ? 'basketball/nba' : 'baseball/mlb'}/scoreboard`);
            const data = await res.json();
            return data.events.map((event: any) => ({
              id: event.id,
              league: league.toUpperCase(),
              status: event.status.type.shortDetail,
              homeTeam: event.competitions[0].competitors[0].team.abbreviation,
              homeScore: parseInt(event.competitions[0].competitors[0].score),
              awayTeam: event.competitions[0].competitors[1].team.abbreviation,
              awayScore: parseInt(event.competitions[0].competitors[1].score),
              time: event.status.type.shortDetail
            }));
          })
        );
        
        setScores(results.flat().slice(0, 15));
      } catch (error) {
        console.error("Error fetching scores:", error);
      }
    }

    fetchScores();
    const interval = setInterval(fetchScores, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (scores.length === 0) return null;

  return (
    <div className="w-full bg-secondary text-secondary-foreground overflow-hidden border-b border-white/10">
      <div className="flex whitespace-nowrap animate-marquee py-2 group hover:[animation-play-state:paused]">
        {[...scores, ...scores].map((score, i) => (
          <div key={`${score.id}-${i}`} className="inline-flex items-center space-x-4 px-6 border-r border-white/10 text-sm">
            <span className="font-bold text-primary text-[10px] tracking-tighter">{score.league}</span>
            <div className="flex items-center space-x-2 font-mono">
              <span className={cn(score.homeScore! > score.awayScore! ? "font-bold text-accent" : "text-muted-foreground")}>
                {score.homeTeam} {score.homeScore}
              </span>
              <span className="text-muted-foreground/50 text-[10px]">-</span>
              <span className={cn(score.awayScore! > score.homeScore! ? "font-bold text-accent" : "text-muted-foreground")}>
                {score.awayTeam} {score.awayScore}
              </span>
            </div>
            <span className="text-[10px] text-primary/80 font-bold uppercase">
              {score.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
