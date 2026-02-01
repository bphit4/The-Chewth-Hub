import { useEffect, useMemo, useState } from "react";
import { getSportConfig, type ChewthGame, type EspnSportKey } from "@/lib/espn";
import { formatEtYyyyMmDd, formatUtcYyyyMmDd } from "@/lib/espnCalendar";

function getTeamLogo(team: any, sportKey?: string, competitor?: any): string | undefined {
  if (!team) {
    if (sportKey === "ufc") {
      return competitor?.athlete?.headshot?.href || competitor?.athlete?.flag?.href;
    }
    return undefined;
  }
  // Try multiple logo sources - prioritize ESPN CDN if available
  if (team.logos?.[0]?.href) return team.logos[0].href;
  if (team.logo) return team.logo;
  // Only use fallback for college sports where it's reliable
  if (team.id && (sportKey === 'ncaaf' || sportKey === 'ncaab')) {
    return `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.id}.png`;
  }
  return undefined;
}

function normalizeEspnScoreboard(data: any, sportKey?: string): ChewthGame[] {
  const events = data?.events ?? [];
  return events.map((event: any) => {
    const comp = event?.competitions?.[0];
    const competitors = comp?.competitors ?? [];
    let home = competitors.find((c: any) => c.homeAway === "home");
    let away = competitors.find((c: any) => c.homeAway === "away");
    if ((!home || !away) && competitors.length >= 2) {
      const ordered = [...competitors].sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
      away = away ?? ordered[0];
      home = home ?? ordered[1];
    }
    const isMma = sportKey === "ufc";
    const homeName = isMma ? (home?.athlete?.displayName ?? "Home") : (home?.team?.displayName ?? home?.team?.name ?? "Home");
    const awayName = isMma ? (away?.athlete?.displayName ?? "Away") : (away?.team?.displayName ?? away?.team?.name ?? "Away");
    const homeAbbr = isMma ? (home?.athlete?.shortName ?? "HOME") : (home?.team?.abbreviation ?? "");
    const awayAbbr = isMma ? (away?.athlete?.shortName ?? "AWAY") : (away?.team?.abbreviation ?? "");
    
    return {
      id: event?.id ?? "",
      date: event?.date ?? "",
      state: event?.status?.type?.state ?? "pre",
      status: event?.status?.type?.shortDetail ?? event?.status?.type?.description ?? "",
      home: {
        id: home?.team?.id ?? "",
        name: homeName,
        abbr: homeAbbr,
        logo: getTeamLogo(home?.team, sportKey, home),
        score: parseInt(home?.score ?? "0", 10) || 0,
        rank: home?.curatedRank?.current ?? home?.rank ?? undefined,
        conferenceId: home?.team?.conferenceId,
      },
      away: {
        id: away?.team?.id ?? "",
        name: awayName,
        abbr: awayAbbr,
        logo: getTeamLogo(away?.team, sportKey, away),
        score: parseInt(away?.score ?? "0", 10) || 0,
        rank: away?.curatedRank?.current ?? away?.rank ?? undefined,
        conferenceId: away?.team?.conferenceId,
      },
      groups: Array.isArray(event?.competitions?.[0]?.groups) 
        ? event.competitions[0].groups.map((g: any) => g?.id) 
        : [],
    };
  });
}

async function fetchScoresFromBackend(sportKey: EspnSportKey, date: Date, filter?: string, endDate?: Date, seasontype?: number): Promise<ChewthGame[]> {
  // Use UTC for week ranges; use ET date for single-day scoreboards
  const dateStr = endDate 
    ? `${formatUtcYyyyMmDd(date)}-${formatUtcYyyyMmDd(endDate)}`
    : formatEtYyyyMmDd(date);

  // Prefer ESPN CDN for single-day scoreboards (faster live updates) — never for UFC or NCAAF "all" (NCAAF all uses server merge of FBS+FCS)
  if (!endDate && !filter && sportKey !== "ufc" && sportKey !== "ncaaf") {
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dateStr}&source=cdn`);
    if (!res.ok) {
      throw new Error(`ESPN API error: ${res.status}`);
    }
    const data = await res.json();
    return normalizeEspnScoreboard(data, sportKey);
  }
  // NCAAF single-day "all": use site API so server returns merged FBS+FCS
  if (!endDate && sportKey === "ncaaf" && !filter) {
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dateStr}`);
    if (!res.ok) {
      throw new Error(`ESPN API error: ${res.status}`);
    }
    const data = await res.json();
    return normalizeEspnScoreboard(data, sportKey);
  }
  
  // For week-based sports (NFL, CFB) with date range, always use ESPN
  if ((sportKey === "nfl" || sportKey === "ncaaf") && endDate) {
    let groupParam = "";
    if (sportKey === "ncaaf" && filter) {
      if (filter === "fbs") groupParam = "&groups=80";
      else if (filter === "fcs") groupParam = "&groups=81";
      else if (filter.startsWith("conf-")) {
        const confId = filter.replace("conf-", "");
        groupParam = `&groups=${confId}`;
      }
    }
    const seasonParam = seasontype !== undefined ? `&seasontype=${seasontype}` : "";
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dateStr}${groupParam}${seasonParam}`);
    if (!res.ok) {
      throw new Error(`ESPN API error: ${res.status}`);
    }
    const data = await res.json();
    // Respect week boundary: ESPN calendar ends at e.g. 06:59 UTC; API date range is inclusive by day,
    // so exclude games that start after the week's end (e.g. HOF week ends Aug 7 06:59, Preseason Week 1 starts Aug 7 07:00+)
    const events = data?.events ?? [];
    const weekEnd = endDate ? endDate.getTime() : null;
    const filteredEvents = weekEnd
      ? events.filter((e: any) => {
          const gameTime = e?.date ? new Date(e.date).getTime() : 0;
          return gameTime <= weekEnd;
        })
      : events;
    const games = normalizeEspnScoreboard({ ...data, events: filteredEvents }, sportKey);
    
    // Client-side filter for Top 25 (CFB only)
    if (filter === "top25") {
      return games.filter(g => 
        (g.home?.rank && g.home.rank <= 25) || 
        (g.away?.rank && g.away.rank <= 25)
      );
    }
    
    return games;
  }
  
  // For college sports with specific group filters (single day)
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
    return normalizeEspnScoreboard(data, sportKey);
  }
  
  // For college sports without filter, use ESPN scoreboard (more reliable)
  if (sportKey === "ncaaf" || sportKey === "ncaab") {
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dateStr}&source=cdn`);
    if (!res.ok) {
      throw new Error(`ESPN API error: ${res.status}`);
    }
    const data = await res.json();
    const games = normalizeEspnScoreboard(data, sportKey);
    
    // Client-side filter for Top 25
    if (filter === "top25") {
      return games.filter(g => 
        (g.home?.rank && g.home.rank <= 25) || 
        (g.away?.rank && g.away.rank <= 25)
      );
    }
    
    return games;
  }
  
  // For UFC, use ESPN MMA hub directly
  if (sportKey === "ufc") {
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dateStr}`);
    if (!res.ok) {
      throw new Error(`ESPN API error: ${res.status}`);
    }
    const data = await res.json();
    return normalizeEspnScoreboard(data, sportKey);
  }

  // All other scores: use ESPN (no SportsData.io key required)
  const sourceParam = endDate ? "" : "&source=cdn";
  const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dateStr}${sourceParam}`);
  if (!res.ok) {
    throw new Error(`ESPN API error: ${res.status}`);
  }
  const data = await res.json();
  return normalizeEspnScoreboard(data, sportKey);
}

export function useEspnScores(sportKey: EspnSportKey, date?: Date, filter?: string, endDate?: Date, seasontype?: number) {
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
        const data = await fetchScoresFromBackend(sportKey, currentDate, filter, endDate, seasontype);
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
  }, [sportKey, currentDate.toDateString(), filter, endDate?.toDateString(), seasontype]);

  return useMemo(() => ({ cfg, games, loading, error }), [cfg, games, loading, error]);
}
