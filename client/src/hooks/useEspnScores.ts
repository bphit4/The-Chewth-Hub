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
        rank: home?.curatedRank?.current ?? home?.rank ?? undefined,
        conferenceId: home?.team?.conferenceId,
      },
      away: {
        id: away?.team?.id ?? "",
        name: away?.team?.displayName ?? away?.team?.name ?? "",
        abbr: away?.team?.abbreviation ?? "",
        logo: away?.team?.logos?.[0]?.href ?? away?.team?.logo,
        score: parseInt(away?.score ?? "0", 10) || 0,
        rank: away?.curatedRank?.current ?? away?.rank ?? undefined,
        conferenceId: away?.team?.conferenceId,
      },
      groups: event?.competitions?.[0]?.groups?.map((g: any) => g?.id) ?? [],
    };
  });
}

async function fetchScoresFromBackend(sportKey: EspnSportKey, date: Date, filter?: string): Promise<ChewthGame[]> {
  const dateStr = format(date, "yyyyMMdd");
  
  // For college sports with specific group filters
  if ((sportKey === "ncaaf" || sportKey === "ncaab") && filter) {
    let groupParam = "";
    if (filter === "fbs") groupParam = "&groups=80";
    else if (filter === "fcs") groupParam = "&groups=81";
    else if (filter === "d1") groupParam = "&groups=50";
    else if (filter.startsWith("conf-")) {
      const confId = filter.replace("conf-", "");
      groupParam = `&groups=${confId}`;
    }
    
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dateStr}${groupParam}`);
    if (!res.ok) {
      throw new Error(`ESPN API error: ${res.status}`);
    }
    const data = await res.json();
    return normalizeEspnScoreboard(data);
  }
  
  // For college sports without filter, use ESPN scoreboard (more reliable)
  if (sportKey === "ncaaf" || sportKey === "ncaab") {
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dateStr}`);
    if (!res.ok) {
      throw new Error(`ESPN API error: ${res.status}`);
    }
    const data = await res.json();
    const games = normalizeEspnScoreboard(data);
    
    // Client-side filter for Top 25
    if (filter === "top25") {
      return games.filter(g => 
        (g.home?.rank && g.home.rank <= 25) || 
        (g.away?.rank && g.away.rank <= 25)
      );
    }
    
    return games;
  }
  
  // For pro sports, use SportsDataIO
  const formattedDate = format(date, "yyyy-MMM-dd").toUpperCase();
  const sportMap: Record<EspnSportKey, string> = {
    nfl: "nfl",
    nba: "nba",
    mlb: "mlb",
    ncaaf: "cfb",
    ncaab: "cbb",
    ufc: "ufc"
  };
  
  const apiSport = sportMap[sportKey];
  const endpoint = `/api/${apiSport}/scores/${formattedDate}`;
  
  const res = await fetch(endpoint);
  if (!res.ok) {
    // Fallback to ESPN for any sport
    const espnRes = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dateStr}`);
    if (espnRes.ok) {
      const data = await espnRes.json();
      return normalizeEspnScoreboard(data);
    }
    throw new Error(`API error: ${res.status}`);
  }
  
  return await res.json();
}

export function useEspnScores(sportKey: EspnSportKey, date?: Date, filter?: string) {
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
        const data = await fetchScoresFromBackend(sportKey, currentDate, filter);
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
  }, [sportKey, currentDate.toDateString(), filter]);

  return useMemo(() => ({ cfg, games, loading, error }), [cfg, games, loading, error]);
}
