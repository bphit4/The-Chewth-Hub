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
