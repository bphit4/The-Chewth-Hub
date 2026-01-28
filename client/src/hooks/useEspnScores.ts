import { useEffect, useMemo, useState } from "react";
import { getSportConfig, type ChewthGame, type EspnSportKey } from "@/lib/espn";
import { format } from "date-fns";

function normalizeEspnScoreboard(data: any): ChewthGame[] {
  const events = data?.events ?? [];
  return events.map((event: any) => {
    const comp = event?.competitions?.[0];
    const competitors = comp?.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === "home");
    const away = competitors.find((c: any) => c.homeAway === "away");
    
    return {
      id: event?.id ?? "",
      state: event?.status?.type?.state ?? "pre",
      status: event?.status?.type?.shortDetail ?? event?.status?.type?.description ?? "",
      home: {
        id: home?.team?.id ?? "",
        name: home?.team?.displayName ?? home?.team?.name ?? "",
        abbr: home?.team?.abbreviation ?? "",
        logo: home?.team?.logos?.[0]?.href ?? home?.team?.logo,
        score: parseInt(home?.score ?? "0", 10) || 0,
      },
      away: {
        id: away?.team?.id ?? "",
        name: away?.team?.displayName ?? away?.team?.name ?? "",
        abbr: away?.team?.abbreviation ?? "",
        logo: away?.team?.logos?.[0]?.href ?? away?.team?.logo,
        score: parseInt(away?.score ?? "0", 10) || 0,
      },
    };
  });
}

async function fetchScoresFromBackend(sportKey: EspnSportKey, date: Date): Promise<ChewthGame[]> {
  // For college sports, use ESPN scoreboard (more reliable)
  if (sportKey === "ncaaf" || sportKey === "ncaab") {
    const dateStr = format(date, "yyyyMMdd");
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dateStr}`);
    if (!res.ok) {
      throw new Error(`ESPN API error: ${res.status}`);
    }
    const data = await res.json();
    return normalizeEspnScoreboard(data);
  }
  
  // For pro sports, use SportsDataIO
  const dateStr = format(date, "yyyy-MMM-dd").toUpperCase();
  const sportMap: Record<EspnSportKey, string> = {
    nfl: "nfl",
    nba: "nba",
    mlb: "mlb",
    ncaaf: "cfb",
    ncaab: "cbb",
    ufc: "ufc"
  };
  
  const apiSport = sportMap[sportKey];
  const endpoint = `/api/${apiSport}/scores/${dateStr}`;
  
  const res = await fetch(endpoint);
  if (!res.ok) {
    // Fallback to ESPN for any sport
    const espnDateStr = format(date, "yyyyMMdd");
    const espnRes = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${espnDateStr}`);
    if (espnRes.ok) {
      const data = await espnRes.json();
      return normalizeEspnScoreboard(data);
    }
    throw new Error(`API error: ${res.status}`);
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
