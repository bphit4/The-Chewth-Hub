import { useEffect, useMemo, useState } from "react";
import { getSportConfig, type ChewthGame, type EspnSportKey } from "@/lib/espn";
import { format } from "date-fns";

async function fetchScoresFromBackend(sportKey: EspnSportKey, date: Date): Promise<ChewthGame[]> {
  // Format date for SportsDataIO: YYYY-MMM-DD (e.g., "2026-JAN-28")
  const dateStr = format(date, "yyyy-MMM-dd").toUpperCase();
  
  // Map sport keys to backend routes
  const sportMap: Record<EspnSportKey, string> = {
    nfl: "nfl",
    nba: "nba",
    mlb: "mlb",
    ncaaf: "cfb",
    ncaab: "cbb",
    ufc: "ufc"
  };
  
  const apiSport = sportMap[sportKey];
  
  // CFB uses season/week format, others use date
  let endpoint: string;
  if (sportKey === "ncaaf") {
    // For CFB, use current season and week 1 for now (TODO: calculate proper week)
    const season = date.getFullYear().toString();
    endpoint = `/api/cfb/scores/${season}/1`;
  } else {
    endpoint = `/api/${apiSport}/scores/${dateStr}`;
  }
  
  const res = await fetch(endpoint);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend API error: ${res.status} - ${text}`);
  }
  
  return await res.json();
}

export function useEspnScores(sportKey: EspnSportKey, date?: Date) {
  const cfg = getSportConfig(sportKey);
  const [games, setGames] = useState<ChewthGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentDate = date || new Date();

  useEffect(() => {
    let mounted = true;
    let interval: number | undefined;

    async function load() {
      if (!cfg) return;
      try {
        setError(null);
        const data = await fetchScoresFromBackend(sportKey, currentDate);
        if (mounted) setGames(data);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load scores");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    setLoading(true);
    load();
    interval = window.setInterval(load, 30_000);

    return () => {
      mounted = false;
      if (interval) window.clearInterval(interval);
    };
  }, [sportKey, currentDate.toDateString()]);

  return useMemo(() => ({ cfg, games, loading, error }), [cfg, games, loading, error]);
}
