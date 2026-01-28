// SportsDataIO API proxy module
// Keeps API key server-side and provides caching

const API_KEY = process.env.SPORTSDATA_API_KEY;
const BASE_URL = "https://api.sportsdata.io/v3";

if (!API_KEY) {
  console.warn("⚠️  SPORTSDATA_API_KEY not set. SportsDataIO endpoints will fail.");
}

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL_MS = 60_000; // 1 minute

function getCached<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age > ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchSportsData(endpoint: string, ttlMs = DEFAULT_TTL_MS): Promise<any> {
  const cacheKey = endpoint;
  const cached = getCached(cacheKey, ttlMs);
  if (cached) return cached;

  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": API_KEY! },
  });

  if (!res.ok) {
    throw new Error(`SportsDataIO error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  setCache(cacheKey, json);
  return json;
}

// NFL
export async function getNFLScoresByDate(date: string) {
  // date format: YYYY-MMM-DD (e.g., "2026-JAN-28")
  return fetchSportsData(`/nfl/scores/json/ScoresByDate/${date}`);
}

export async function getNFLStandings(season: string) {
  return fetchSportsData(`/nfl/scores/json/Standings/${season}`, 5 * 60_000);
}

export async function getNFLPlayerSeasonStats(season: string) {
  return fetchSportsData(`/nfl/stats/json/PlayerSeasonStats/${season}`, 10 * 60_000);
}

export async function getNFLTeamSeasonStats(season: string) {
  return fetchSportsData(`/nfl/scores/json/TeamSeasonStats/${season}`, 10 * 60_000);
}

// NBA
export async function getNBAGamesByDate(date: string) {
  // date format: YYYY-MMM-DD
  return fetchSportsData(`/nba/scores/json/GamesByDate/${date}`);
}

export async function getNBAStandings(season: string) {
  return fetchSportsData(`/nba/scores/json/Standings/${season}`, 5 * 60_000);
}

export async function getNBAPlayerSeasonStats(season: string) {
  return fetchSportsData(`/nba/stats/json/PlayerSeasonStats/${season}`, 10 * 60_000);
}

export async function getNBATeamSeasonStats(season: string) {
  return fetchSportsData(`/nba/scores/json/TeamSeasonStats/${season}`, 10 * 60_000);
}

// MLB
export async function getMLBGamesByDate(date: string) {
  return fetchSportsData(`/mlb/scores/json/GamesByDate/${date}`);
}

export async function getMLBStandings(season: string) {
  return fetchSportsData(`/mlb/scores/json/Standings/${season}`, 5 * 60_000);
}

export async function getMLBPlayerSeasonStats(season: string) {
  return fetchSportsData(`/mlb/stats/json/PlayerSeasonStats/${season}`, 10 * 60_000);
}

export async function getMLBTeamSeasonStats(season: string) {
  return fetchSportsData(`/mlb/scores/json/TeamSeasonStats/${season}`, 10 * 60_000);
}

// CFB (College Football)
export async function getCFBGamesByWeek(season: string, week: string) {
  return fetchSportsData(`/cfb/scores/json/GamesByWeek/${season}/${week}`);
}

export async function getCFBStandings(season: string) {
  return fetchSportsData(`/cfb/scores/json/Standings/${season}`, 5 * 60_000);
}

export async function getCFBPlayerSeasonStats(season: string) {
  return fetchSportsData(`/cfb/stats/json/PlayerSeasonStats/${season}`, 10 * 60_000);
}

export async function getCFBTeamSeasonStats(season: string) {
  return fetchSportsData(`/cfb/scores/json/TeamSeasonStats/${season}`, 10 * 60_000);
}

// CBB (College Basketball)
export async function getCBBGamesByDate(date: string) {
  return fetchSportsData(`/cbb/scores/json/GamesByDate/${date}`);
}

export async function getCBBStandings(season: string) {
  return fetchSportsData(`/cbb/scores/json/Standings/${season}`, 5 * 60_000);
}

export async function getCBBPlayerSeasonStats(season: string) {
  return fetchSportsData(`/cbb/stats/json/PlayerSeasonStats/${season}`, 10 * 60_000);
}

export async function getCBBTeamSeasonStats(season: string) {
  return fetchSportsData(`/cbb/scores/json/TeamSeasonStats/${season}`, 10 * 60_000);
}

// ESPN Proxy Functions (for data not available in SportsDataIO)
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_WEB_BASE = "https://site.web.api.espn.com/apis/site/v2/sports";

async function fetchEspn(endpoint: string, ttlMs = 60_000): Promise<any> {
  const cacheKey = `espn:${endpoint}`;
  const cached = getCached(cacheKey, ttlMs);
  if (cached) return cached;

  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`ESPN API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  setCache(cacheKey, json);
  return json;
}

export async function getEspnGameSummary(sport: string, eventId: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  return fetchEspn(`${ESPN_WEB_BASE}/${path}/summary?event=${eventId}`);
}

export async function getEspnTeam(sport: string, teamId: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  return fetchEspn(`${ESPN_BASE}/${path}/teams/${teamId}`, 5 * 60_000);
}

export async function getEspnTeamSchedule(sport: string, teamId: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  return fetchEspn(`${ESPN_BASE}/${path}/teams/${teamId}/schedule`, 5 * 60_000);
}

export async function getEspnTeamRoster(sport: string, teamId: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  return fetchEspn(`${ESPN_BASE}/${path}/teams/${teamId}/roster`, 5 * 60_000);
}

export async function getEspnTeams(sport: string, groups?: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  const groupParam = groups ? `?groups=${groups}` : "";
  return fetchEspn(`${ESPN_BASE}/${path}/teams${groupParam}`, 60 * 60_000);
}

export async function getEspnStandings(sport: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  // Standings endpoint uses v2 not site/v2
  return fetchEspn(`https://site.api.espn.com/apis/v2/sports/${path}/standings`, 5 * 60_000);
}

export async function getEspnGroups(sport: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  // Get conferences/groups for filtering
  return fetchEspn(`${ESPN_BASE}/${path}/groups`, 60 * 60_000);
}

export async function getEspnScoreboard(sport: string, date?: string, groups?: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  const params: string[] = [];
  if (date) params.push(`dates=${date}`);
  if (groups) params.push(`groups=${groups}`);
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";
  return fetchEspn(`${ESPN_BASE}/${path}/scoreboard${queryString}`, 60_000);
}

export async function getEspnNews(sport: string, limit = 30) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  return fetchEspn(`${ESPN_BASE}/${path}/news?limit=${limit}`, 5 * 60_000);
}

export async function getEspnLeaders(sport: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  // Leaders is on v3 for most leagues
  return fetchEspn(`https://site.api.espn.com/apis/site/v3/sports/${path}/leaders`, 10 * 60_000);
}

export async function getEspnRankings(sport: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  return fetchEspn(`${ESPN_BASE}/${path}/rankings`, 10 * 60_000);
}
