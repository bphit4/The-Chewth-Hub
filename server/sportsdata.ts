// SportsDataIO API proxy module
// Keeps API key server-side and provides caching
import path from "path";
import { promises as fs } from "fs";
import { NCAAF_CONFERENCES } from "./data/ncaafConferences";

const API_KEY = process.env.SPORTSDATA_API_KEY;
const BASE_URL = "https://api.sportsdata.io/v3";

if (!API_KEY) {
  console.warn("⚠️  SPORTSDATA_API_KEY not set. Scores use ESPN; SportsData.io is optional for standings/stats.");
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
const ESPN_WEB_V3_BASE = "https://site.web.api.espn.com/apis/common/v3/sports";
const ESPN_CDN_BASE = "https://cdn.espn.com/core";

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

async function fetchEspnCdn(endpoint: string, ttlMs = 20_000): Promise<any> {
  const cacheKey = `espncdn:${endpoint}`;
  const cached = getCached(cacheKey, ttlMs);
  if (cached) return cached;

  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`ESPN CDN error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  setCache(cacheKey, json);
  return json;
}

async function fetchEspnCore(endpoint: string, ttlMs = 60_000): Promise<any> {
  const cacheKey = `espncore:${endpoint}`;
  const cached = getCached(cacheKey, ttlMs);
  if (cached) return cached;

  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`ESPN Core API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  setCache(cacheKey, json);
  return json;
}

function normalizeCoreRef(ref?: string) {
  if (!ref) return undefined;
  return ref.replace("http://", "https://");
}

function formatUtcYyyyMmDd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function fetchEspnCoreRef(ref?: string, ttlMs = 60_000): Promise<any> {
  const normalized = normalizeCoreRef(ref);
  if (!normalized) return null;
  return fetchEspnCore(normalized, ttlMs);
}

function extractIdFromRef(ref?: string) {
  if (!ref) return undefined;
  const match = ref.match(/\/(\d+)(\?.*)?$/);
  return match?.[1];
}

async function getMlbSeasonYear() {
  const league = await fetchEspnCore("https://sports.core.api.espn.com/v2/sports/baseball/leagues/mlb?lang=en&region=us", 10 * 60_000);
  return league?.season?.year ?? new Date().getFullYear();
}

async function getMlbLeadersCore() {
  const seasonYear = await getMlbSeasonYear();
  const leaders = await fetchEspnCore(
    `https://sports.core.api.espn.com/v2/sports/baseball/leagues/mlb/seasons/${seasonYear}/types/2/leaders?lang=en&region=us`,
    10 * 60_000
  );

  const categories = Array.isArray(leaders?.categories) ? leaders.categories : [];
  const hydratedCategories = await Promise.all(
    categories.map(async (category: any) => {
      const rawLeaders = Array.isArray(category?.leaders) ? category.leaders : [];
      const hydratedLeaders = await Promise.all(
        rawLeaders.map(async (leader: any, idx: number) => {
          const athleteRef = normalizeCoreRef(leader?.athlete?.$ref ?? leader?.athlete?.href ?? leader?.athlete);
          const teamRef = normalizeCoreRef(leader?.team?.$ref ?? leader?.team?.href ?? leader?.team);
          const athleteId = extractIdFromRef(athleteRef) ?? String(leader?.athlete?.id ?? "");
          const teamId = extractIdFromRef(teamRef) ?? String(leader?.team?.id ?? "");

          let athleteData: any = null;
          if (athleteRef) {
            try {
              athleteData = await fetchEspnCore(athleteRef, 60 * 60_000);
            } catch {
              athleteData = null;
            }
          }

          let teamData: any = null;
          if (teamRef) {
            try {
              teamData = await fetchEspnCore(teamRef, 60 * 60_000);
            } catch {
              teamData = null;
            }
          }

          const headshot = athleteId
            ? `https://a.espncdn.com/i/headshots/mlb/players/full/${athleteId}.png`
            : undefined;

          return {
            id: athleteId || `${idx}`,
            athlete: {
              id: athleteId,
              displayName: athleteData?.displayName ?? athleteData?.fullName ?? athleteData?.name ?? "",
              headshot: headshot ? { href: headshot } : undefined,
            },
            team: {
              id: teamId || undefined,
              abbreviation: teamData?.abbreviation ?? teamData?.shortDisplayName ?? "",
              displayName: teamData?.displayName ?? teamData?.name ?? "",
              logos: teamData?.logos ?? (teamData?.logo ? [{ href: teamData.logo }] : undefined),
            },
            value: leader?.value ?? null,
            displayValue: leader?.displayValue ?? (leader?.value != null ? String(leader.value) : ""),
            rank: leader?.rank ?? idx + 1,
          };
        })
      );

      return {
        ...category,
        leaders: hydratedLeaders,
      };
    })
  );

  return {
    leaders: {
      categories: hydratedCategories,
    },
  };
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

export async function getEspnTeam(sport: string, teamId: string, enable?: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  const query = enable ? `?enable=${encodeURIComponent(enable)}` : "";
  return fetchEspn(`${ESPN_BASE}/${path}/teams/${teamId}${query}`, 5 * 60_000);
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

async function getMmaAthleteOverviewCore(athleteId: string) {
  const athlete = await fetchEspnCore(
    `https://sports.core.api.espn.com/v2/sports/mma/athletes/${athleteId}?lang=en&region=us`,
    5 * 60_000
  );
  const recordRef = athlete?.records?.$ref ?? athlete?.records?.href ?? athlete?.records;
  const records = await fetchEspnCoreRef(recordRef, 60 * 60_000);
  return { athlete, records };
}

async function getMmaAthleteStatsCore(athleteId: string) {
  return fetchEspnCore(
    `https://sports.core.api.espn.com/v2/sports/mma/athletes/${athleteId}/statistics?lang=en&region=us`,
    5 * 60_000
  );
}

async function getMmaAthleteGamelogCore(athleteId: string) {
  const eventlog = await fetchEspnCore(
    `https://sports.core.api.espn.com/v2/sports/mma/athletes/${athleteId}/eventlog?lang=en&region=us`,
    5 * 60_000
  );
  const items = eventlog?.events?.items ?? eventlog?.items ?? [];
  if (!Array.isArray(items) || items.length === 0) {
    return { events: [] };
  }

  const limit = Math.min(items.length, 12);
  const events = await Promise.all(
    items.slice(0, limit).map(async (entry: any, idx: number) => {
      const eventRef = entry?.event?.$ref ?? entry?.event?.href ?? entry?.event;
      const competitionRef = entry?.competition?.$ref ?? entry?.competition?.href ?? entry?.competition;
      const eventData = await fetchEspnCoreRef(eventRef, 10 * 60_000);
      const competition = await fetchEspnCoreRef(competitionRef, 10 * 60_000);
      const status = await fetchEspnCoreRef(competition?.status?.$ref ?? competition?.status, 2 * 60_000);

      const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];
      const self = competitors.find((c: any) => {
        const ref = c?.athlete?.$ref ?? c?.athlete?.href ?? c?.athlete;
        return extractIdFromRef(ref) === String(athleteId);
      });
      const opponentRef = competitors
        .map((c: any) => c?.athlete?.$ref ?? c?.athlete?.href ?? c?.athlete)
        .find((ref: string | undefined) => ref && extractIdFromRef(ref) !== String(athleteId));
      const opponent = await fetchEspnCoreRef(opponentRef, 10 * 60_000);

      let resultText = "";
      if (self?.winner === true) resultText = "Win";
      else if (self?.winner === false && status?.type?.completed) resultText = "Loss";
      else if (status?.type?.shortDetail) resultText = status.type.shortDetail;

      return {
        id: String(competition?.id ?? eventData?.id ?? idx),
        date: eventData?.date ?? competition?.date,
        opponent: {
          displayName: opponent?.displayName ?? opponent?.fullName ?? opponent?.name ?? "",
        },
        result: { displayValue: resultText },
        event: {
          shortName: eventData?.shortName ?? eventData?.name ?? "",
          date: eventData?.date,
        },
        status,
      };
    })
  );

  return { events };
}

export async function getEspnAthleteOverview(sport: string, athleteId: string) {
  if (sport === "ufc") {
    return getMmaAthleteOverviewCore(athleteId);
  }
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  return fetchEspn(`${ESPN_WEB_V3_BASE}/${path}/athletes/${athleteId}/overview`, 5 * 60_000);
}

export async function getEspnAthleteStats(sport: string, athleteId: string) {
  if (sport === "ufc") {
    return getMmaAthleteStatsCore(athleteId);
  }
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  return fetchEspn(`${ESPN_WEB_V3_BASE}/${path}/athletes/${athleteId}/stats`, 5 * 60_000);
}

export async function getEspnAthleteGamelog(sport: string, athleteId: string) {
  if (sport === "ufc") {
    return getMmaAthleteGamelogCore(athleteId);
  }
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  return fetchEspn(`${ESPN_WEB_V3_BASE}/${path}/athletes/${athleteId}/gamelog`, 5 * 60_000);
}

export async function getEspnTeams(sport: string, groups?: string, limit?: number) {
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
  if (groups) params.push(`groups=${groups}`);
  // ESPN defaults to 50 teams; request more for college sports to get full FBS/FCS/D1 list
  if (limit != null && (sport === "ncaaf" || sport === "ncaab")) params.push(`limit=${limit}`);
  const query = params.length ? `?${params.join("&")}` : "";
  return fetchEspn(`${ESPN_BASE}/${path}/teams${query}`, 60 * 60_000);
}

type ScrapedTeam = {
  id: string;
  name: string;
  logo?: string;
};

type ScrapedConferenceGroup = {
  name: string;
  teams: ScrapedTeam[];
};

const TEAMS_SCRAPE_CACHE = new Map<string, { ts: number; data: ScrapedConferenceGroup[] }>();
const TEAMS_SCRAPE_FILE = path.join(process.cwd(), "server", "data", "teams-scrape-cache.json");

async function readScrapeCacheFromDisk(): Promise<Record<string, ScrapedConferenceGroup[]>> {
  try {
    const raw = await fs.readFile(TEAMS_SCRAPE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeScrapeCacheToDisk(data: Record<string, ScrapedConferenceGroup[]>) {
  await fs.mkdir(path.dirname(TEAMS_SCRAPE_FILE), { recursive: true });
  await fs.writeFile(TEAMS_SCRAPE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTeamKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['".()]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeConferenceKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['".()]/g, "")
    .replace(/\bconference\b/g, "")
    .replace(/\bfootball\b/g, "")
    .replace(/\bassociation\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getTeamKeyVariants(name: string): string[] {
  const base = name.trim();
  const withParen = normalizeTeamKey(base);
  const withoutParen = normalizeTeamKey(base.replace(/\s*\([^)]*\)/g, "").trim());
  const words = base.replace(/\s*\([^)]*\)/g, "").trim().split(/\s+/);
  const dropLast = words.length > 1 ? normalizeTeamKey(words.slice(0, -1).join(" ")) : "";
  const dropLastTwo = words.length > 2 ? normalizeTeamKey(words.slice(0, -2).join(" ")) : "";
  const variants = new Set<string>([withParen, withoutParen, dropLast, dropLastTwo]);
  // Common aliases used in team names vs ESPN location
  if (base.toLowerCase().includes("uconn")) variants.add(normalizeTeamKey("Connecticut"));
  if (base.toLowerCase().startsWith("miami") && !base.toLowerCase().includes("oh")) {
    variants.add(normalizeTeamKey("Miami (FL)"));
  }
  if (base.toLowerCase().includes("appalachian state")) {
    variants.add(normalizeTeamKey("App State"));
  }
  if (base.toLowerCase().includes("louisiana-monroe") || base.toLowerCase().includes("louisiana monroe")) {
    variants.add(normalizeTeamKey("UL Monroe"));
    variants.add(normalizeTeamKey("ULM"));
  }
  return Array.from(variants).filter(Boolean);
}

function parseTeamsFlatFromHtml(html: string): ScrapedTeam[] {
  const teamRegex = /\/team\/_\/id\/(\d+)\/([a-z0-9-]+)\"/gi;
  const teams: ScrapedTeam[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = teamRegex.exec(html))) {
    const id = match[1];
    const slug = match[2];
    if (seen.has(id)) continue;
    seen.add(id);
    teams.push({ id, name: titleCaseFromSlug(slug) });
  }
  return teams;
}

function getRawTeamsFromApi(data: any): any[] {
  const teamsRaw =
    data?.sports?.[0]?.leagues?.[0]?.teams ??
    data?.leagues?.[0]?.teams ??
    data?.teams ??
    [];
  return Array.isArray(teamsRaw) ? teamsRaw : [];
}

function buildTeamMapFromApi(data: any): Map<string, ScrapedTeam> {
  const map = new Map<string, ScrapedTeam>();
  const conflicts = new Set<string>();
  const rawList = getRawTeamsFromApi(data);
  for (const entry of rawList) {
    const team = entry?.team ?? entry;
    if (!team?.id) continue;
    const id = String(team.id);
    const name = team.displayName ?? team.name ?? "";
    const abbr = team.abbreviation ?? "";
    const shortName = team.shortDisplayName ?? "";
    const location = team.location ?? "";
    const nickname = team.name ?? "";
    const combined = location && nickname ? `${location} ${nickname}` : "";
    const candidates = [name, abbr, shortName, combined].filter(Boolean);
    for (const c of candidates) {
      for (const key of getTeamKeyVariants(String(c))) {
        if (conflicts.has(key)) continue;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, { id, name: String(name), logo: team.logos?.[0]?.href ?? team.logo });
        } else if (existing.id !== id) {
          map.delete(key);
          conflicts.add(key);
        }
      }
    }
  }
  return map;
}

const DIVISION_GROUP_IDS: Record<"ncaaf" | "ncaab", Record<string, string>> = {
  ncaaf: { fbs: "80", fcs: "81", d2: "82", d3: "83" },
  ncaab: { d1: "50", d2: "51", d3: "52" }
};

type GroupNode = {
  id?: string | number;
  name?: string;
  children?: GroupNode[];
  groups?: GroupNode[];
  group?: GroupNode;
};

function findGroupNodeById(node: any, id: string): GroupNode | null {
  const stack: any[] = [node];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur) continue;
    if (typeof cur === "object") {
      const curId = cur.id != null ? String(cur.id) : "";
      if (curId === id) return cur as GroupNode;
      for (const v of Object.values(cur)) {
        if (Array.isArray(v)) stack.push(...v);
        else if (v && typeof v === "object") stack.push(v);
      }
    }
  }
  return null;
}

function getGroupChildren(node: GroupNode | null | undefined): GroupNode[] {
  if (!node) return [];
  const candidates = [node.children, node.groups, node.group?.children, node.group?.groups];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c;
  }
  return [];
}

function extractTeamsFromApiResponse(data: any): ScrapedTeam[] {
  const teamsRaw =
    data?.sports?.[0]?.leagues?.[0]?.teams ??
    data?.leagues?.[0]?.teams ??
    data?.teams ??
    [];
  const rawList = Array.isArray(teamsRaw) ? teamsRaw : [];
  const teams: ScrapedTeam[] = [];
  for (const entry of rawList) {
    const team = entry?.team ?? entry;
    if (!team?.id) continue;
    teams.push({
      id: String(team.id),
      name: team.displayName ?? team.name ?? "",
      logo: team.logos?.[0]?.href ?? team.logo
    });
  }
  return teams.filter((t) => t.id && t.name);
}

function parseTeamsFromHtml(html: string, sport: "ncaaf" | "ncaab"): ScrapedConferenceGroup[] {
  const headingRegex = /<(h2|h3)[^>]*>([^<]+)<\/\1>/gi;
  const optionRegex = /<option[^>]*>([^<]+)<\/option>/gi;
  const teamRegex = /\/team\/_\/id\/(\d+)\/([a-z0-9-]+)\"/gi;

  const teamNameSet = new Set<string>();
  const headings: { index: number; name: string }[] = [];
  let match: RegExpExecArray | null;
  const teams: { index: number; id: string; name: string }[] = [];
  while ((match = teamRegex.exec(html))) {
    const id = match[1];
    const slug = match[2];
    const name = titleCaseFromSlug(slug);
    teamNameSet.add(name.toLowerCase());
    teams.push({ index: match.index, id, name });
  }

  // Try to extract conference list from <option> elements (dropdown)
  const conferenceNames: string[] = [];
  while ((match = optionRegex.exec(html))) {
    const name = match[1].replace(/&amp;/g, "&").trim();
    if (!name || /All Conferences/i.test(name) || /Hidden/i.test(name)) continue;
    conferenceNames.push(name);
  }

  if (conferenceNames.length > 0) {
    for (const name of conferenceNames) {
      const safe = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const idxMatch = new RegExp(`>${safe}<`, "i").exec(html) || new RegExp(safe, "i").exec(html);
      if (idxMatch && typeof idxMatch.index === "number") {
        headings.push({ index: idxMatch.index, name });
      }
    }
  }

  if (headings.length === 0) {
    while ((match = headingRegex.exec(html))) {
      const name = match[2].replace(/&amp;/g, "&").trim();
      if (!name || /Teams/i.test(name) || /All Conferences/i.test(name) || /Hidden/i.test(name)) continue;
      if (teamNameSet.has(name.toLowerCase())) continue; // prevent team names from being treated as conferences
      headings.push({ index: match.index, name });
    }
  }

  // Assign each team to the nearest previous heading (conference)
  const groupsMap = new Map<string, ScrapedTeam[]>();
  const seenTeams = new Set<string>();
  for (const team of teams) {
    if (seenTeams.has(team.id)) continue;
    seenTeams.add(team.id);
    const heading = [...headings].reverse().find((h) => h.index < team.index);
    const conf = heading?.name ?? "Other";
    if (!groupsMap.has(conf)) groupsMap.set(conf, []);
    groupsMap.get(conf)!.push({
      id: team.id,
      name: team.name,
      logo:
        sport === "ncaaf" || sport === "ncaab"
          ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.id}.png`
          : undefined,
    });
  }

  return Array.from(groupsMap.entries()).map(([name, teams]) => ({
    name,
    teams,
  }));
}

export async function getEspnTeamsScrape(
  sport: "ncaaf" | "ncaab",
  division: "fbs" | "fcs" | "d1" | "d2" | "d3"
) {
  const cacheKey = `${sport}:${division}:v4`;
  const cached = TEAMS_SCRAPE_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < 6 * 60_000) {
    return cached.data;
  }

  if (sport === "ncaaf" && NCAAF_CONFERENCES[division]) {
    const urls: string[] = [];
    if (division === "fbs") urls.push("https://www.espn.com/college-football/teams");
    if (division === "fcs") urls.push("https://www.espn.com/college-football/teams/_/group/81");
    if (division === "d2") urls.push("https://www.espn.com/college-football/teams/_/group/82");
    if (division === "d3") urls.push("https://www.espn.com/college-football/teams/_/group/83");

    const groupId = DIVISION_GROUP_IDS[sport]?.[division];
    let apiTeamMap = new Map<string, ScrapedTeam>();
    let confIdByName = new Map<string, string>();
    if (groupId) {
      try {
        const apiTeamsData = await getEspnTeams(sport, groupId, 2000);
        apiTeamMap = buildTeamMapFromApi(apiTeamsData);
        const groupData = await getEspnGroupById(sport, groupId);
        const root = findGroupNodeById(groupData, groupId) ?? (groupData?.group as GroupNode);
        const children = getGroupChildren(root);
        for (const g of children) {
          if (!g?.id || !g?.name) continue;
          const key = normalizeConferenceKey(String(g.name));
          if (!key) continue;
          if (!confIdByName.has(key)) confIdByName.set(key, String(g.id));
        if (key === "midamerican" && !confIdByName.has("mac")) {
          confIdByName.set("mac", String(g.id));
        }
        }
      } catch {
        apiTeamMap = new Map<string, ScrapedTeam>();
      }
    }

    let htmlTeamMap = new Map<string, ScrapedTeam>();
    for (const url of urls) {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) continue;
      const html = await res.text();
      const flat = parseTeamsFlatFromHtml(html);
      for (const t of flat) {
        for (const key of getTeamKeyVariants(t.name)) {
          if (!htmlTeamMap.has(key)) htmlTeamMap.set(key, t);
        }
      }
      break;
    }

    const teamLookup = new Map<string, ScrapedTeam>([...apiTeamMap, ...htmlTeamMap]);
    const staticGroups = NCAAF_CONFERENCES[division];
    const staticNameSet = new Set(staticGroups.map((g) => g.name.toLowerCase()));

    const groups = [];
    for (const conf of staticGroups) {
      const confKey = normalizeConferenceKey(conf.name);
      let confTeamMap = new Map<string, ScrapedTeam>();
      const confId = confIdByName.get(confKey);
      if (confId) {
        try {
          const confData = await getEspnTeams(sport, confId, 2000);
          confTeamMap = buildTeamMapFromApi(confData);
        } catch {
          confTeamMap = new Map<string, ScrapedTeam>();
        }
      }

      const seenNames = new Set<string>();
      const teams = conf.teams.map((name) => {
        const keys = getTeamKeyVariants(name);
        const found =
          keys.map((k) => confTeamMap.get(k)).find(Boolean) ??
          keys.map((k) => teamLookup.get(k)).find(Boolean);
        const id = found?.id ?? "";
        seenNames.add(normalizeTeamKey(name));
        return {
          id,
          name,
          logo: id ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png` : undefined
        };
      });

      // Add teams from ESPN conference that are missing from static list
      if (confTeamMap.size > 0) {
        for (const t of confTeamMap.values()) {
          const key = normalizeTeamKey(t.name);
          if (seenNames.has(key)) continue;
          teams.push({
            id: t.id,
            name: t.name,
            logo: t.logo
          });
        }
      }

      groups.push({ name: conf.name, teams });
    }

    // Add any ESPN conferences missing from static list (e.g., MAC, FBS Independents)
    if (groupId) {
      try {
        const groupData = await getEspnGroupById(sport, groupId);
        const root = findGroupNodeById(groupData, groupId) ?? (groupData?.group as GroupNode);
        const children = getGroupChildren(root);
        for (const g of children) {
          if (!g?.id || !g?.name) continue;
          const confName = String(g.name);
          if (staticNameSet.has(confName.toLowerCase())) continue;
          if (/All Conferences/i.test(confName) || /Teams/i.test(confName) || /Hidden/i.test(confName)) continue;
          const data = await getEspnTeams(sport, String(g.id), 2000);
          const teams = extractTeamsFromApiResponse(data);
          if (!teams.length) continue;
          groups.push({ name: confName, teams });
        }
      } catch {
        // ignore and keep static list
      }
    }

    TEAMS_SCRAPE_CACHE.set(cacheKey, { ts: Date.now(), data: groups });
    const disk = await readScrapeCacheFromDisk();
    disk[cacheKey] = groups;
    await writeScrapeCacheToDisk(disk);
    return groups;
  }

  const groupId = DIVISION_GROUP_IDS[sport]?.[division];
  if (groupId) {
    try {
      const groupData = await getEspnGroupById(sport, groupId);
      const root = findGroupNodeById(groupData, groupId) ?? (groupData?.group as GroupNode);
      const children = getGroupChildren(root);
      const conferenceGroups = children
        .filter((g) => g?.id && g?.name)
        .map((g) => ({ id: String(g.id), name: String(g.name) }))
        .filter((g) => !/All Conferences/i.test(g.name) && !/Teams/i.test(g.name) && !/Hidden/i.test(g.name));

      if (conferenceGroups.length) {
        const groups: ScrapedConferenceGroup[] = [];
        for (const conf of conferenceGroups) {
          const data = await getEspnTeams(sport, conf.id, 1000);
          const teams = extractTeamsFromApiResponse(data);
          if (!teams.length) continue;
          groups.push({ name: conf.name, teams });
        }
        if (groups.length) {
          TEAMS_SCRAPE_CACHE.set(cacheKey, { ts: Date.now(), data: groups });
          const disk = await readScrapeCacheFromDisk();
          disk[cacheKey] = groups;
          await writeScrapeCacheToDisk(disk);
          return groups;
        }
      }
    } catch {
      // fall back to HTML scrape
    }
  }

  const urls: string[] = [];
  if (sport === "ncaaf") {
    if (division === "fbs") urls.push("https://www.espn.com/college-football/teams");
    if (division === "fcs") urls.push("https://www.espn.com/college-football/teams/_/group/81");
    if (division === "d2") urls.push("https://www.espn.com/college-football/teams/_/group/82");
    if (division === "d3") urls.push("https://www.espn.com/college-football/teams/_/group/83");
  }
  if (sport === "ncaab") {
    if (division === "d1") urls.push("https://www.espn.com/mens-college-basketball/teams");
    if (division === "d2") urls.push("https://www.espn.com/mens-college-basketball/teams/_/group/51");
    if (division === "d3") urls.push("https://www.espn.com/mens-college-basketball/teams/_/group/52");
  }

  for (const url of urls) {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) continue;
    const html = await res.text();
    const groups = parseTeamsFromHtml(html, sport);
    if (groups.length > 0) {
      TEAMS_SCRAPE_CACHE.set(cacheKey, { ts: Date.now(), data: groups });
      const disk = await readScrapeCacheFromDisk();
      disk[cacheKey] = groups;
      await writeScrapeCacheToDisk(disk);
      return groups;
    }
  }

  const disk = await readScrapeCacheFromDisk();
  if (disk[cacheKey]) {
    TEAMS_SCRAPE_CACHE.set(cacheKey, { ts: Date.now(), data: disk[cacheKey] });
    return disk[cacheKey];
  }
  return [];
}

export async function getEspnStandings(sport: string, group?: string) {
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
  const query = group ? `?group=${group}` : "";
  return fetchEspn(`https://site.api.espn.com/apis/v2/sports/${path}/standings${query}`, 5 * 60_000);
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

async function getEspnGroupById(sport: string, groupId: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  return fetchEspn(`${ESPN_BASE}/${path}/groups/${groupId}`, 60 * 60_000);
}

export async function getEspnScoreboard(
  sport: string,
  date?: string,
  groups?: string,
  seasontype?: number,
  week?: string,
  source?: string
) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  if (source === "cdn" && date && !date.includes("-") && !groups && seasontype == null && !week) {
    try {
      return await getEspnScoreboardCdn(sport, date);
    } catch {
      // fallback to site API when CDN is unavailable
    }
  }

  // NCAAF "All Games": ESPN returns a limited set with no groups. Fetch FBS (80) + FCS (81) and merge.
  if (sport === "ncaaf" && !groups && path === "football/college-football") {
    const [fbsResult, fcsResult] = await Promise.allSettled([
      fetchEspn(buildScoreboardUrl(ESPN_BASE, path, date, "80", seasontype, week), 60_000),
      fetchEspn(buildScoreboardUrl(ESPN_BASE, path, date, "81", seasontype, week), 60_000),
    ]);
    const fbs = fbsResult.status === "fulfilled" ? fbsResult.value : null;
    const fcs = fcsResult.status === "fulfilled" ? fcsResult.value : null;
    const seen = new Set<string>();
    const events: any[] = [];
    for (const e of [...(fbs?.events ?? []), ...(fcs?.events ?? [])]) {
      const id = e?.id != null ? String(e.id) : "";
      if (id && !seen.has(id)) {
        seen.add(id);
        events.push(e);
      }
    }
    events.sort((a, b) => {
      const ta = a?.date ? new Date(a.date).getTime() : 0;
      const tb = b?.date ? new Date(b.date).getTime() : 0;
      return ta - tb;
    });
    return { ...(fbs ?? fcs ?? {}), events };
  }

  const params: string[] = [];
  if (date) params.push(`dates=${date}`);
  if (groups) params.push(`groups=${groups}`);
  if (seasontype !== undefined) params.push(`seasontype=${seasontype}`);
  if (week) params.push(`week=${week}`);
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";
  return fetchEspn(`${ESPN_BASE}/${path}/scoreboard${queryString}`, 60_000);
}

function buildScoreboardUrl(
  base: string,
  path: string,
  date?: string,
  groups?: string,
  seasontype?: number,
  week?: string
): string {
  const params: string[] = [];
  if (date) params.push(`dates=${date}`);
  if (groups) params.push(`groups=${groups}`);
  if (seasontype !== undefined) params.push(`seasontype=${seasontype}`);
  if (week) params.push(`week=${week}`);
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";
  return `${base}/${path}/scoreboard${queryString}`;
}

function getCdnLeagueKey(sport: string): string | undefined {
  const map: Record<string, string> = {
    nfl: "nfl",
    nba: "nba",
    mlb: "mlb",
    ncaaf: "ncf",
    ncaab: "ncb",
  };
  return map[sport];
}

async function getEspnScoreboardCdn(sport: string, date?: string) {
  const league = getCdnLeagueKey(sport);
  if (!league) {
    throw new Error(`ESPN CDN not supported for sport: ${sport}`);
  }
  let url = `${ESPN_CDN_BASE}/${league}/scoreboard?xhr=1`;
  if (date) url += `&dates=${encodeURIComponent(date)}`;
  const data = await fetchEspnCdn(url, 20_000);
  return data?.content?.sbData ?? data?.sbData ?? data;
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

export async function getEspnCalendar(sport: string, _seasonYear?: number) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    ncaaf: "football/college-football"
  };
  const path = sportPaths[sport];
  if (!path) return null;
  // ESPN scoreboard with no params returns current calendar; ?season= causes 500 for ncaaf
  return fetchEspn(`${ESPN_BASE}/${path}/scoreboard`, 60 * 60_000);
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
  try {
    return await fetchEspn(`https://site.api.espn.com/apis/site/v3/sports/${path}/leaders`, 10 * 60_000);
  } catch (err) {
    if (sport === "mlb") {
      return getMlbLeadersCore();
    }
    throw err;
  }
}

export async function getEspnStatistics(sport: string) {
  const sportPaths: Record<string, string> = {
    nfl: "football/nfl",
    nba: "basketball/nba",
    mlb: "baseball/mlb",
    ncaaf: "football/college-football",
    ncaab: "basketball/mens-college-basketball",
    ufc: "mma/ufc"
  };
  const path = sportPaths[sport] || "football/nfl";
  return fetchEspn(`${ESPN_BASE}/${path}/statistics`, 10 * 60_000);
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
  const ttl = sport === "ufc" ? 30_000 : 10 * 60_000;
  return fetchEspn(`${ESPN_BASE}/${path}/rankings`, ttl);
}

function extractRecordSummary(recordData: any): string {
  if (!recordData) return "";
  if (typeof recordData?.summary === "string") return recordData.summary;
  if (Array.isArray(recordData?.items) && recordData.items.length > 0) {
    return recordData.items[0]?.summary ?? recordData.items[0]?.displayValue ?? "";
  }
  return "";
}

function pickResultDetail(details: any[]): string {
  if (!Array.isArray(details)) return "";
  const priority = details.find((d) => /Winner|Result/i.test(d?.type?.text ?? d?.text ?? ""));
  if (priority) return priority.type?.text ?? priority.text ?? "";
  const fallback = details[0];
  return fallback?.type?.text ?? fallback?.text ?? "";
}

export async function getEspnMmaEvent(eventId: string) {
  const coreEvent = await fetchEspnCore(
    `https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${eventId}?lang=en&region=us`,
    2 * 60_000
  );

  let scoreboardEvent: any = null;
  if (coreEvent?.date) {
    const dateStr = formatUtcYyyyMmDd(new Date(coreEvent.date));
    try {
      const scoreboard = await getEspnScoreboard("ufc", dateStr);
      scoreboardEvent = (scoreboard?.events ?? []).find((e: any) => String(e?.id) === String(eventId)) ?? null;
    } catch {
      scoreboardEvent = null;
    }
  }

  const scoreboardCompetitions = new Map<string, any>();
  const sbComps = scoreboardEvent?.competitions ?? [];
  sbComps.forEach((c: any) => {
    if (c?.id != null) scoreboardCompetitions.set(String(c.id), c);
  });

  const venueRef = coreEvent?.venues?.[0]?.$ref ?? coreEvent?.venues?.[0]?.href;
  const venueData = await fetchEspnCoreRef(venueRef, 60 * 60_000);

  const competitionsRaw = Array.isArray(coreEvent?.competitions) ? coreEvent.competitions : [];
  const competitions = await Promise.all(
    competitionsRaw.map(async (comp: any) => {
      const sbComp = scoreboardCompetitions.get(String(comp?.id ?? ""));
      const fightersRaw = Array.isArray(comp?.competitors) ? comp.competitors : [];
      const fighters = await Promise.all(
        fightersRaw.map(async (c: any) => {
          const athleteRef = c?.athlete?.$ref ?? c?.athlete?.href ?? c?.athlete;
          const recordRef = c?.record?.$ref ?? c?.record?.href ?? c?.record;
          const [athlete, record] = await Promise.all([
            fetchEspnCoreRef(athleteRef, 60 * 60_000),
            fetchEspnCoreRef(recordRef, 60 * 60_000),
          ]);
          return {
            id: String(athlete?.id ?? c?.id ?? ""),
            name: athlete?.displayName ?? athlete?.fullName ?? athlete?.name ?? "",
            shortName: athlete?.shortName ?? athlete?.displayName ?? "",
            headshot: athlete?.headshot?.href ?? athlete?.headshot,
            flag: athlete?.flag?.href ?? athlete?.flag,
            record: extractRecordSummary(record),
            winner: Boolean(c?.winner),
            order: c?.order,
          };
        })
      );

      return {
        id: String(comp?.id ?? ""),
        weightClass: comp?.type?.text ?? comp?.type?.abbreviation ?? "",
        matchNumber: comp?.matchNumber ?? null,
        cardSegment: comp?.cardSegment?.description ?? comp?.cardSegment?.name ?? "",
        status: sbComp?.status?.type?.shortDetail ?? sbComp?.status?.type?.description ?? "",
        state: sbComp?.status?.type?.state ?? "",
        resultDetail: pickResultDetail(sbComp?.details ?? []),
        fighters,
      };
    })
  );

  return {
    id: String(coreEvent?.id ?? eventId),
    name: coreEvent?.name ?? scoreboardEvent?.name ?? "",
    shortName: coreEvent?.shortName ?? scoreboardEvent?.shortName ?? "",
    date: coreEvent?.date ?? scoreboardEvent?.date ?? "",
    status: scoreboardEvent?.status?.type?.shortDetail ?? coreEvent?.status?.type?.shortDetail ?? "",
    venue: venueData?.fullName
      ? {
          name: venueData?.fullName ?? "",
          city: venueData?.address?.city ?? "",
          state: venueData?.address?.state ?? "",
          country: venueData?.address?.country ?? "",
        }
      : null,
    broadcast:
      scoreboardEvent?.competitions?.[0]?.broadcast ??
      scoreboardEvent?.competitions?.[0]?.broadcasts?.[0]?.names?.[0] ??
      "",
    links: {
      fightcenter: `https://www.espn.com/mma/fightcenter/_/id/${eventId}/league/ufc`,
    },
    competitions,
  };
}

export async function getEspnMmaSchedule(year?: number) {
  const scoreboard = await fetchEspn(`${ESPN_BASE}/mma/ufc/scoreboard`, 60_000);
  const league = scoreboard?.leagues?.[0] ?? {};
  const seasonYear = league?.season?.year ?? scoreboard?.season?.year ?? new Date().getFullYear();
  const targetYear = year ?? seasonYear;
  const calendar = Array.isArray(league?.calendar)
    ? league.calendar
    : Array.isArray(scoreboard?.calendar)
      ? scoreboard.calendar
      : [];

  const entries = calendar
    .map((entry: any) => {
      const eventRef = entry?.event?.$ref ?? entry?.event?.href ?? entry?.event;
      const eventId = extractIdFromRef(eventRef);
      if (!eventId) return null;
      return {
        id: String(eventId),
        label: entry?.label ?? "",
        startDate: entry?.startDate ?? entry?.date ?? "",
        endDate: entry?.endDate ?? "",
      };
    })
    .filter(Boolean) as Array<{ id: string; label: string; startDate: string; endDate: string }>;

  const filtered = entries.filter((e) => {
    if (!e.startDate) return true;
    const y = new Date(e.startDate).getUTCFullYear();
    return y === targetYear;
  });

  const events = await Promise.all(
    filtered.map(async (entry) => {
      const coreEvent = await fetchEspnCore(
        `https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${entry.id}?lang=en&region=us`,
        10 * 60_000
      );
      const venueRef = coreEvent?.venues?.[0]?.$ref ?? coreEvent?.venues?.[0]?.href;
      const venueData = await fetchEspnCoreRef(venueRef, 60 * 60_000);
      return {
        id: entry.id,
        name: coreEvent?.name ?? entry.label ?? "",
        shortName: coreEvent?.shortName ?? "",
        date: coreEvent?.date ?? entry.startDate ?? "",
        endDate: entry.endDate ?? "",
        status: coreEvent?.status?.type?.shortDetail ?? "",
        venue: venueData?.fullName
          ? {
              name: venueData?.fullName ?? "",
              city: venueData?.address?.city ?? "",
              state: venueData?.address?.state ?? "",
              country: venueData?.address?.country ?? "",
            }
          : null,
      };
    })
  );

  events.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

  return {
    year: targetYear,
    league: {
      name: league?.name ?? "UFC",
      shortName: league?.shortName ?? league?.abbreviation ?? "UFC",
      logo: league?.logos?.[0]?.href ?? "",
    },
    events,
  };
}
