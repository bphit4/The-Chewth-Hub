export type EspnSportKey =
  | "nfl"
  | "ncaaf"
  | "nba"
  | "ncaab"
  | "mlb"
  | "ufc";

export type EspnApiSportPath =
  | "football/nfl"
  | "football/college-football"
  | "basketball/nba"
  | "basketball/mens-college-basketball"
  | "baseball/mlb"
  | "mma/ufc";

export const SPORTS: {
  key: EspnSportKey;
  label: string;
  apiPath: EspnApiSportPath;
  scoresTabs: { key: string; label: string; href: (sport: EspnSportKey) => string }[];
}[] = [
  {
    key: "nfl",
    label: "NFL",
    apiPath: "football/nfl",
    scoresTabs: [
      { key: "home", label: "Home", href: (s) => `/sport/${s}` },
      { key: "scores", label: "Scores", href: (s) => `/sport/${s}/scores` },
      { key: "playoffs", label: "Playoffs", href: (s) => `/sport/${s}/playoffs` },
      { key: "bracket", label: "Playoff Bracket", href: (s) => `/sport/${s}/bracket` },
      { key: "stats", label: "Stats", href: (s) => `/sport/${s}/stats` },
      { key: "standings", label: "Standings", href: (s) => `/sport/${s}/standings` },
      { key: "news", label: "News", href: (s) => `/sport/${s}/news` },
      { key: "teams", label: "Teams", href: (s) => `/sport/${s}/teams` },
      { key: "schedule", label: "Schedules", href: (s) => `/sport/${s}/schedule` },
      { key: "odds", label: "Odds", href: (s) => `/sport/${s}/odds` },
    ],
  },
  {
    key: "ncaaf",
    label: "NCAAF",
    apiPath: "football/college-football",
    scoresTabs: [
      { key: "home", label: "Home", href: (s) => `/sport/${s}` },
      { key: "transfer", label: "Transfer Portal", href: (s) => `/sport/${s}/transfer` },
      { key: "scores", label: "Scores", href: (s) => `/sport/${s}/scores` },
      { key: "schedule", label: "Schedules", href: (s) => `/sport/${s}/schedule` },
      { key: "standings", label: "Standings", href: (s) => `/sport/${s}/standings` },
      { key: "standings-fcs", label: "FCS Standings", href: (s) => `/sport/${s}/standings/fcs` },
      { key: "stats", label: "Stats", href: (s) => `/sport/${s}/stats` },
      { key: "teams", label: "Teams", href: (s) => `/sport/${s}/teams` },
      { key: "rankings", label: "Rankings", href: (s) => `/sport/${s}/rankings` },
      { key: "odds", label: "Odds", href: (s) => `/sport/${s}/odds` },
      { key: "bracket", label: "CFP Bracket", href: (s) => `/sport/${s}/bracket` },
    ],
  },
  {
    key: "nba",
    label: "NBA",
    apiPath: "basketball/nba",
    scoresTabs: [
      { key: "home", label: "Home", href: (s) => `/sport/${s}` },
      { key: "scores", label: "Scores", href: (s) => `/sport/${s}/scores` },
      { key: "standings", label: "Standings", href: (s) => `/sport/${s}/standings` },
      { key: "stats", label: "Stats", href: (s) => `/sport/${s}/stats` },
      { key: "teams", label: "Teams", href: (s) => `/sport/${s}/teams` },
      { key: "schedule", label: "Schedules", href: (s) => `/sport/${s}/schedule` },
      { key: "odds", label: "Odds", href: (s) => `/sport/${s}/odds` },
      { key: "news", label: "News", href: (s) => `/sport/${s}/news` },
    ],
  },
  {
    key: "ncaab",
    label: "NCAAM",
    apiPath: "basketball/mens-college-basketball",
    scoresTabs: [
      { key: "home", label: "Home", href: (s) => `/sport/${s}` },
      { key: "scores", label: "Scores", href: (s) => `/sport/${s}/scores` },
      { key: "rankings", label: "Rankings", href: (s) => `/sport/${s}/rankings` },
      { key: "standings", label: "Standings", href: (s) => `/sport/${s}/standings` },
      { key: "stats", label: "Stats", href: (s) => `/sport/${s}/stats` },
      { key: "teams", label: "Teams", href: (s) => `/sport/${s}/teams` },
      { key: "schedule", label: "Schedules", href: (s) => `/sport/${s}/schedule` },
      { key: "odds", label: "Odds", href: (s) => `/sport/${s}/odds` },
      { key: "news", label: "News", href: (s) => `/sport/${s}/news` },
    ],
  },
  {
    key: "mlb",
    label: "MLB",
    apiPath: "baseball/mlb",
    scoresTabs: [
      { key: "home", label: "Home", href: (s) => `/sport/${s}` },
      { key: "scores", label: "Scores", href: (s) => `/sport/${s}/scores` },
      { key: "standings", label: "Standings", href: (s) => `/sport/${s}/standings` },
      { key: "stats", label: "Stats", href: (s) => `/sport/${s}/stats` },
      { key: "teams", label: "Teams", href: (s) => `/sport/${s}/teams` },
      { key: "schedule", label: "Schedules", href: (s) => `/sport/${s}/schedule` },
      { key: "odds", label: "Odds", href: (s) => `/sport/${s}/odds` },
      { key: "news", label: "News", href: (s) => `/sport/${s}/news` },
    ],
  },
  {
    key: "ufc",
    label: "MMA",
    apiPath: "mma/ufc",
    scoresTabs: [
      { key: "home", label: "Home", href: (s) => `/sport/${s}` },
      { key: "scores", label: "Fights", href: (s) => `/sport/${s}/scores` },
      { key: "rankings", label: "Rankings", href: (s) => `/sport/${s}/rankings` },
      { key: "schedule", label: "Schedule", href: (s) => `/sport/${s}/schedule` },
      { key: "news", label: "News", href: (s) => `/sport/${s}/news` },
      { key: "odds", label: "Odds", href: (s) => `/sport/${s}/odds` },
    ],
  },
];

export function getSportConfig(key: EspnSportKey) {
  return SPORTS.find((s) => s.key === key);
}

export function espnScoreboardUrl(apiPath: EspnApiSportPath, date?: string) {
  const base = `https://site.api.espn.com/apis/site/v2/sports/${apiPath}/scoreboard`;
  if (!date) return base;
  return `${base}?dates=${date}`;
}

export function espnSummaryUrl(apiPath: EspnApiSportPath, eventId: string) {
  return `https://site.web.api.espn.com/apis/site/v2/sports/${apiPath}/summary?event=${eventId}`;
}

export type EspnScoreboardEvent = {
  id: string;
  name: string;
  date: string;
  status: {
    type: {
      description: string;
      shortDetail: string;
      state: string;
    };
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      id: string;
      homeAway: "home" | "away";
      score: string;
      team: {
        displayName: string;
        abbreviation: string;
        logo?: string;
      };
    }>;
  }>;
};

export async function fetchScoreboard(apiPath: EspnApiSportPath) {
  const res = await fetch(espnScoreboardUrl(apiPath));
  if (!res.ok) throw new Error(`Scoreboard fetch failed (${res.status})`);
  const data = await res.json();
  const events: EspnScoreboardEvent[] = data?.events ?? [];
  return events;
}

export type ChewthGame = {
  id: string;
  sportKey?: EspnSportKey;
  leagueLabel?: string;
  status: string;
  state: string;
  date?: string;
  home: { id?: string; name: string; abbr: string; logo?: string; score?: number; rank?: number; conferenceId?: string };
  away: { id?: string; name: string; abbr: string; logo?: string; score?: number; rank?: number; conferenceId?: string };
  groups?: string[];
  /**
   * Optional event headline describing the game or bowl/championship title.
   * Examples include "Big Ten Championship" or "The Myrtle Beach Bowl".
   */
  headline?: string;
};

export function mapEspnEventToGame(event: EspnScoreboardEvent, sportKey: EspnSportKey, leagueLabel: string): ChewthGame {
  const comp = event.competitions?.[0];
  const home = comp?.competitors?.find((c) => c.homeAway === "home");
  const away = comp?.competitors?.find((c) => c.homeAway === "away");

  const toScore = (s?: string) => {
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    id: event.id,
    sportKey,
    leagueLabel,
    status: event.status?.type?.shortDetail ?? "",
    state: event.status?.type?.state ?? "",
    date: event.date,
    home: {
      name: home?.team?.displayName ?? "Home",
      abbr: home?.team?.abbreviation ?? "HOME",
      logo: home?.team?.logo,
      score: toScore(home?.score),
    },
    away: {
      name: away?.team?.displayName ?? "Away",
      abbr: away?.team?.abbreviation ?? "AWAY",
      logo: away?.team?.logo,
      score: toScore(away?.score),
    },
  };
}