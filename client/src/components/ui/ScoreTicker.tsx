import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { fetchDirectEspnScoreboard } from "@/lib/espnDirect";
import type { EspnSportKey } from "@/lib/espn";

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
        const leagues = ['nfl', 'nba', 'mlb', 'college-football', 'mma'];
        const results = await Promise.all(
          leagues.map(async (league) => {
            const path = league === "college-football"
              ? "ncaaf"
              : league === "nfl"
                ? "nfl"
                : league === "nba"
                  ? "nba"
                  : league === "mlb"
                    ? "mlb"
                    : "ufc";
            const data = await fetchDirectEspnScoreboard({ sport: path as EspnSportKey });

            const events = Array.isArray(data?.events) ? data.events : [];
            return events.map((event: any) => {
              const comp = event?.competitions?.[0];
              const home = comp?.competitors?.find((c: any) => c.homeAway === "home") ?? comp?.competitors?.[0];
              const away = comp?.competitors?.find((c: any) => c.homeAway === "away") ?? comp?.competitors?.[1];

              const toScore = (v: any) => {
                const n = Number(v);
                return Number.isFinite(n) ? n : undefined;
              };

              return {
                id: String(event.id),
                league: league === "college-football" ? "NCAAF" : league === "mma" ? "MMA" : league.toUpperCase(),
                status: event?.status?.type?.shortDetail ?? "",
                homeTeam: home?.team?.abbreviation ?? "HOME",
                homeScore: toScore(home?.score),
                awayTeam: away?.team?.abbreviation ?? "AWAY",
                awayScore: toScore(away?.score),
                time: event?.status?.type?.shortDetail ?? "",
              };
            });
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
          <a
            key={`${score.id}-${i}`}
            href={`/sport/${score.league === 'NCAAF' ? 'ncaaf' : score.league.toLowerCase()}/game/${score.id}`}
            className="inline-flex items-center space-x-4 px-6 border-r border-white/10 text-sm hover:bg-white/5 transition-colors"
            data-testid={`link-ticker-game-${score.id}`}
          >
            <span className="font-black text-primary text-[10px] tracking-widest">{score.league}</span>
            <div className="flex items-center space-x-2 font-mono">
              <span className={cn((score.homeScore ?? 0) > (score.awayScore ?? 0) ? "font-black text-accent" : "text-muted-foreground")}>
                {score.homeTeam} {score.homeScore ?? '-'}
              </span>
              <span className="text-muted-foreground/50 text-[10px]">-</span>
              <span className={cn((score.awayScore ?? 0) > (score.homeScore ?? 0) ? "font-black text-accent" : "text-muted-foreground")}>
                {score.awayTeam} {score.awayScore ?? '-'}
              </span>
            </div>
            <span className="text-[10px] text-primary/80 font-black uppercase">
              {score.status}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
