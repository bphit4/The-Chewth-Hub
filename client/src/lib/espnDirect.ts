import { getSportConfig, type EspnSportKey } from "@/lib/espn";

type ScoreboardRequest = {
  sport: EspnSportKey;
  date?: string;
  groups?: string;
  seasontype?: number;
  week?: string;
  source?: string;
};

type FetchLike = (input: string) => Promise<Pick<Response, "ok" | "status" | "json">>;

const ESPN_SITE_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_SITE_V2_BASE = "https://site.api.espn.com/apis/v2/sports";
const ESPN_SITE_V3_BASE = "https://site.api.espn.com/apis/site/v3/sports";
const ESPN_WEB_BASE = "https://site.web.api.espn.com/apis/site/v2/sports";
const ESPN_WEB_V3_BASE = "https://site.web.api.espn.com/apis/common/v3/sports";
const ESPN_CDN_BASE = "https://cdn.espn.com/core";

const ESPN_CORE_PATH: Partial<Record<EspnSportKey, string>> = {
  nfl: "football/leagues/nfl",
  ncaaf: "football/leagues/college-football",
  nba: "basketball/leagues/nba",
  ncaab: "basketball/leagues/mens-college-basketball",
  mlb: "baseball/leagues/mlb",
  ufc: "mma/leagues/ufc",
};

function getCdnLeagueKey(sport: EspnSportKey): string | undefined {
  const map: Partial<Record<EspnSportKey, string>> = {
    nfl: "nfl",
    nba: "nba",
    mlb: "mlb",
    ncaaf: "ncf",
    ncaab: "ncb",
  };
  return map[sport];
}

function isSimpleCdnRequest(req: ScoreboardRequest) {
  return req.source === "cdn" && !!req.date && !req.date.includes("-") && !req.groups && req.seasontype == null && !req.week;
}

export function buildEspnScoreboardUrl(req: ScoreboardRequest) {
  const cdnLeague = getCdnLeagueKey(req.sport);
  if (isSimpleCdnRequest(req) && cdnLeague) {
    return `${ESPN_CDN_BASE}/${cdnLeague}/scoreboard?xhr=1&dates=${encodeURIComponent(req.date!)}`;
  }

  const cfg = getSportConfig(req.sport);
  if (!cfg) throw new Error(`Unsupported ESPN sport: ${req.sport}`);

  const params = new URLSearchParams();
  if (req.date) params.set("dates", req.date);
  if (req.groups) params.set("groups", req.groups);
  if (req.seasontype != null) params.set("seasontype", String(req.seasontype));
  if (req.week) params.set("week", req.week);

  const query = params.toString();
  return `${ESPN_SITE_BASE}/${cfg.apiPath}/scoreboard${query ? `?${query}` : ""}`;
}

export function buildEspnCalendarUrl(sport: EspnSportKey) {
  const cfg = getSportConfig(sport);
  if (!cfg) throw new Error(`Unsupported ESPN sport: ${sport}`);
  return `${ESPN_SITE_BASE}/${cfg.apiPath}/scoreboard`;
}

export function buildEspnGroupsUrl(sport: EspnSportKey) {
  const cfg = getSportConfig(sport);
  if (!cfg) throw new Error(`Unsupported ESPN sport: ${sport}`);
  return `${ESPN_SITE_BASE}/${cfg.apiPath}/groups`;
}

async function fetchJson(url: string, fetcher: FetchLike) {
  const res = await fetcher(url);
  if (!res.ok) {
    throw new Error(`ESPN API error: ${res.status}`);
  }
  return res.json();
}

function getApiPath(sport: string) {
  const cfg = getSportConfig(sport as EspnSportKey);
  if (!cfg) throw new Error(`Unsupported ESPN sport: ${sport}`);
  return cfg.apiPath;
}

function appendAllowedParams(url: URL, source: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = source.get(name);
    if (value != null && value !== "") url.searchParams.set(name, value);
  }
}

function groupParamFromTeamsRequest(sport: string, searchParams: URLSearchParams) {
  const explicitGroup = searchParams.get("groups");
  if (explicitGroup) return explicitGroup;
  const division = searchParams.get("division");
  const groupByDivision: Record<string, Record<string, string>> = {
    ncaaf: { fbs: "80", fcs: "81", d2: "82", d3: "83" },
    ncaab: { d1: "50", d2: "51", d3: "52" },
  };
  return groupByDivision[sport]?.[division || (sport === "ncaab" ? "d1" : "fbs")];
}

function buildStandingsUrl(path: string, group?: string) {
  const url = new URL(`${ESPN_SITE_V2_BASE}/${path}/standings`);
  if (group) url.searchParams.set("group", group);
  return url.toString();
}

function directUrl(pathname: string, searchParams: URLSearchParams) {
  const parts = pathname.split("/").filter(Boolean);
  const route = parts[2];
  const sport = parts[3];

  if (route === "mma" && parts[3] === "schedule") {
    return `${ESPN_SITE_BASE}/mma/ufc/scoreboard`;
  }

  if (route === "mma" && parts[3] === "event" && parts[4]) {
    return `https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${parts[4]}?lang=en&region=us`;
  }

  const path = sport ? getApiPath(sport) : "";

  if (route === "game" && sport && parts[4]) {
    const url = new URL(`${ESPN_WEB_BASE}/${path}/summary`);
    url.searchParams.set("event", parts[4]);
    return url.toString();
  }

  if (route === "team" && sport && parts[4]) {
    const suffix = parts[5] ? `/${parts[5]}` : "";
    const url = new URL(`${ESPN_SITE_BASE}/${path}/teams/${parts[4]}${suffix}`);
    appendAllowedParams(url, searchParams, ["enable"]);
    return url.toString();
  }

  if (route === "teams" && sport) {
    return buildStandingsUrl(path, groupParamFromTeamsRequest(sport, searchParams));
  }

  if (route === "teams-scrape" && sport) {
    return buildStandingsUrl(path, groupParamFromTeamsRequest(sport, searchParams));
  }

  if (route === "standings" && sport) {
    const url = new URL(`${ESPN_SITE_V2_BASE}/${path}/standings`);
    appendAllowedParams(url, searchParams, ["group"]);
    return url.toString();
  }

  if (route === "groups" && sport) {
    return `${ESPN_SITE_BASE}/${path}/groups`;
  }

  if (route === "scoreboard" && sport) {
    return buildEspnScoreboardUrl({
      sport: sport as EspnSportKey,
      date: searchParams.get("dates") ?? undefined,
      groups: searchParams.get("groups") ?? undefined,
      seasontype: searchParams.has("seasontype") ? Number(searchParams.get("seasontype")) : undefined,
      week: searchParams.get("week") ?? undefined,
      source: searchParams.get("source") ?? undefined,
    });
  }

  if (route === "athlete" && sport && parts[4] && parts[5]) {
    const section = parts[5];
    if (sport === "ufc") {
      const coreSection = section === "overview" ? "" : `/${section === "gamelog" ? "eventlog" : "statistics"}`;
      return `https://sports.core.api.espn.com/v2/sports/mma/athletes/${parts[4]}${coreSection}?lang=en&region=us`;
    }
    return `${ESPN_WEB_V3_BASE}/${path}/athletes/${parts[4]}/${section}`;
  }

  if (route === "news" && sport) {
    const url = new URL(`${ESPN_SITE_BASE}/${path}/news`);
    appendAllowedParams(url, searchParams, ["limit"]);
    return url.toString();
  }

  if (route === "leaders" && sport) {
    return `${ESPN_SITE_V3_BASE}/${path}/leaders`;
  }

  if (route === "statistics" && sport) {
    return `${ESPN_SITE_BASE}/${path}/statistics`;
  }

  if (route === "rankings" && sport) {
    return `${ESPN_SITE_BASE}/${path}/rankings`;
  }

  if (route === "calendar" && sport) {
    return `${ESPN_SITE_BASE}/${path}/scoreboard`;
  }

  throw new Error(`Unsupported ESPN API route: ${pathname}`);
}

export function buildDirectEspnApiUrl(input: string) {
  const url = new URL(input, "https://the-chewth.local");
  return directUrl(url.pathname, url.searchParams);
}

function responseFromJson(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function normalizeApiResponse(input: string, data: any, fetcher: FetchLike) {
  const url = new URL(input, "https://the-chewth.local");
  const parts = url.pathname.split("/").filter(Boolean);
  const route = parts[2];
  const sport = parts[3];

  if (route === "scoreboard") {
    const source = url.searchParams.get("source") ?? undefined;
    const isCdn = source === "cdn" && url.searchParams.has("dates") && !url.searchParams.get("dates")!.includes("-");
    return isCdn ? unwrapCdnScoreboard(data) : data;
  }

  if (route === "athlete" && sport && parts[4] && parts[5] === "overview" && !data?.athlete && !data?.player) {
    const corePath = ESPN_CORE_PATH[sport as EspnSportKey];
    if (corePath) {
      try {
        const athlete = await fetchJson(
          `https://sports.core.api.espn.com/v2/sports/${corePath}/athletes/${parts[4]}?lang=en&region=us`,
          fetcher,
        );
        return { ...data, athlete };
      } catch {
        return data;
      }
    }
  }

  const collectStandingsTeamGroups = (node: any, parentName?: string): Array<{ name: string; teams: any[] }> => {
    if (!node) return [];
    const nodeName = node?.name ?? node?.displayName ?? node?.shortName ?? parentName ?? "Teams";
    const entries = node?.standings?.entries ?? node?.entries ?? [];
    const teams = Array.isArray(entries)
      ? entries
          .map((entry: any) => entry?.team)
          .filter(Boolean)
      : [];
    const children = node?.children ?? node?.groups ?? node?.standings?.children ?? [];
    const childGroups = Array.isArray(children)
      ? children.flatMap((child: any) => collectStandingsTeamGroups(child, nodeName))
      : [];
    return teams.length ? [{ name: nodeName, teams }] : childGroups;
  };

  if (route === "teams") {
    const groups = collectStandingsTeamGroups(data);
    const teams = groups.flatMap((group) => group.teams).map((team) => ({ team }));
    return {
      sports: [
        {
          leagues: [
            {
              teams,
            },
          ],
        },
      ],
    };
  }

  if (route === "teams-scrape") {
    const groups = collectStandingsTeamGroups(data).map((group) => ({
      name: group.name,
      teams: group.teams
        .map((team: any) => ({
          id: String(team?.id ?? ""),
          name: team?.displayName ?? team?.name ?? "",
          logo: team?.logos?.[0]?.href ?? team?.logo,
        }))
        .filter((team: any) => team.id && team.name),
    })).filter((group) => group.teams.length > 0);
    return { scrapedGroups: groups.length ? groups : [{ name: sport === "ncaab" ? "Division I" : "Teams", teams: [] }] };
  }

  if (route === "mma" && parts[3] === "schedule") {
    const league = data?.leagues?.[0] ?? {};
    const events = (data?.events ?? []).map((event: any) => ({
      id: String(event?.id ?? ""),
      name: event?.name ?? event?.shortName ?? "",
      shortName: event?.shortName ?? "",
      date: event?.date ?? "",
      endDate: "",
      status: event?.status?.type?.shortDetail ?? "",
      venue: event?.competitions?.[0]?.venue
        ? {
            name: event.competitions[0].venue.fullName ?? event.competitions[0].venue.name ?? "",
            city: event.competitions[0].venue.address?.city ?? "",
            state: event.competitions[0].venue.address?.state ?? "",
            country: event.competitions[0].venue.address?.country ?? "",
          }
        : null,
    }));
    return {
      year: league?.season?.year ?? data?.season?.year ?? new Date().getFullYear(),
      league: {
        name: league?.name ?? "UFC",
        shortName: league?.shortName ?? league?.abbreviation ?? "UFC",
        logo: league?.logos?.[0]?.href ?? "",
      },
      events,
    };
  }

  if (route === "mma" && parts[3] === "event") {
    return {
      id: String(data?.id ?? parts[4] ?? ""),
      name: data?.name ?? "",
      shortName: data?.shortName ?? "",
      date: data?.date ?? "",
      status: data?.status?.type?.shortDetail ?? "",
      venue: null,
      broadcast: "",
      links: { fightcenter: `https://www.espn.com/mma/fightcenter/_/id/${parts[4]}/league/ufc` },
      competitions: [],
    };
  }

  return data;
}

export async function fetchDirectEspnApi(input: string, fetcher: FetchLike = fetch) {
  const source = new URL(input, "https://the-chewth.local");
  if (source.pathname.includes("/scoreboard/")) {
    const sport = source.pathname.split("/").filter(Boolean)[3] as EspnSportKey;
    const data = await fetchDirectEspnScoreboard({
      sport,
      date: source.searchParams.get("dates") ?? undefined,
      groups: source.searchParams.get("groups") ?? undefined,
      seasontype: source.searchParams.has("seasontype") ? Number(source.searchParams.get("seasontype")) : undefined,
      week: source.searchParams.get("week") ?? undefined,
      source: source.searchParams.get("source") ?? undefined,
    }, fetcher);
    return responseFromJson(data);
  }

  const data = await fetchJson(buildDirectEspnApiUrl(input), fetcher);
  return responseFromJson(await normalizeApiResponse(input, data, fetcher));
}

function unwrapCdnScoreboard(data: any) {
  return data?.content?.sbData ?? data?.sbData ?? data;
}

function mergeScoreboards(primary: any, secondary: any) {
  const seen = new Set<string>();
  const events: any[] = [];
  for (const event of [...(primary?.events ?? []), ...(secondary?.events ?? [])]) {
    const id = event?.id != null ? String(event.id) : "";
    if (id && !seen.has(id)) {
      seen.add(id);
      events.push(event);
    }
  }
  events.sort((a, b) => {
    const aTime = a?.date ? new Date(a.date).getTime() : 0;
    const bTime = b?.date ? new Date(b.date).getTime() : 0;
    return aTime - bTime;
  });
  return { ...(primary ?? secondary ?? {}), events };
}

export async function fetchDirectEspnScoreboard(req: ScoreboardRequest, fetcher: FetchLike = fetch) {
  if (req.sport === "ncaaf" && !req.groups) {
    const [fbs, fcs] = await Promise.all([
      fetchJson(buildEspnScoreboardUrl({ ...req, source: undefined, groups: "80" }), fetcher),
      fetchJson(buildEspnScoreboardUrl({ ...req, source: undefined, groups: "81" }), fetcher),
    ]);
    return mergeScoreboards(fbs, fcs);
  }

  const url = buildEspnScoreboardUrl(req);
  const data = await fetchJson(url, fetcher);
  return isSimpleCdnRequest(req) ? unwrapCdnScoreboard(data) : data;
}

function hasUsableOdds(odds: any) {
  return Boolean(
    odds &&
      (
        odds.details ||
        odds.overUnder != null ||
        odds.spread != null ||
        odds.homeTeamOdds?.moneyLine != null ||
        odds.awayTeamOdds?.moneyLine != null ||
        odds.current?.total?.alternateDisplayValue ||
        odds.current?.over?.alternateDisplayValue ||
        odds.current?.under?.alternateDisplayValue
      )
  );
}

async function fetchCompetitionOdds(sport: EspnSportKey, eventId: string, competitionId: string, fetcher: FetchLike) {
  const corePath = ESPN_CORE_PATH[sport];
  if (!corePath || !eventId || !competitionId) return null;
  const url = `https://sports.core.api.espn.com/v2/sports/${corePath}/events/${eventId}/competitions/${competitionId}/odds?lang=en&region=us`;
  try {
    const data = await fetchJson(url, fetcher);
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.find(hasUsableOdds) ?? items[0] ?? null;
  } catch {
    return null;
  }
}

export async function hydrateEspnScoreboardOdds(scoreboard: any, sport: EspnSportKey, fetcher: FetchLike = fetch) {
  const events = Array.isArray(scoreboard?.events) ? scoreboard.events : [];
  const hydratedEvents = await Promise.all(
    events.map(async (event: any) => {
      const competitions = Array.isArray(event?.competitions) ? event.competitions : [];
      const hydratedCompetitions = await Promise.all(
        competitions.map(async (competition: any) => {
          const existing = Array.isArray(competition?.odds) ? competition.odds : [];
          if (existing.some(hasUsableOdds)) return competition;
          const odds = await fetchCompetitionOdds(sport, String(event?.id ?? ""), String(competition?.id ?? ""), fetcher);
          return odds ? { ...competition, odds: [odds] } : competition;
        }),
      );
      return { ...event, competitions: hydratedCompetitions };
    }),
  );
  return { ...scoreboard, events: hydratedEvents };
}

export function fetchDirectEspnCalendar(sport: EspnSportKey, fetcher: FetchLike = fetch) {
  return fetchJson(buildEspnCalendarUrl(sport), fetcher);
}

export function fetchDirectEspnGroups(sport: EspnSportKey, fetcher: FetchLike = fetch) {
  return fetchJson(buildEspnGroupsUrl(sport), fetcher);
}
