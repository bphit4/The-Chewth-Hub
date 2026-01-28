// Data normalization functions for SportsDataIO API responses
// Convert SportsDataIO format to ChewthGame format expected by frontend

type ChewthGame = {
  id: string;
  sportKey: string;
  leagueLabel: string;
  status: string;
  state: string;
  date: string;
  home: { name: string; abbr: string; logo?: string; score?: number };
  away: { name: string; abbr: string; logo?: string; score?: number };
};

function getTeamLogo(team: string, sport: string): string {
  // ESPN logo pattern
  const base = "https://a.espncdn.com/i/teamlogos";
  if (sport === "nfl") {
    return `${base}/nfl/500/${team}.png`;
  }
  if (sport === "nba") {
    return `${base}/nba/500/${team}.png`;
  }
  if (sport === "mlb") {
    return `${base}/mlb/500/${team}.png`;
  }
  return "";
}

export function normalizeNFLGame(game: any): ChewthGame {
  const status = game.Status || "Scheduled";
  const state = status === "InProgress" ? "in" : status === "Final" ? "post" : "pre";
  
  return {
    id: game.GameID?.toString() || game.ScoreID?.toString() || Math.random().toString(),
    sportKey: "nfl",
    leagueLabel: "NFL",
    status: game.Quarter ? `Q${game.Quarter} ${game.TimeRemaining || ""}` : status,
    state,
    date: game.DateTime || game.Date || "",
    home: {
      name: game.HomeTeam || "Home",
      abbr: game.HomeTeam || "HOME",
      logo: getTeamLogo(game.HomeTeam, "nfl"),
      score: game.HomeScore ?? undefined,
    },
    away: {
      name: game.AwayTeam || "Away",
      abbr: game.AwayTeam || "AWAY",
      logo: getTeamLogo(game.AwayTeam, "nfl"),
      score: game.AwayScore ?? undefined,
    },
  };
}

export function normalizeNBAGame(game: any): ChewthGame {
  const status = game.Status || "Scheduled";
  const state = status === "InProgress" ? "in" : status === "Final" ? "post" : "pre";
  
  return {
    id: game.GameID?.toString() || Math.random().toString(),
    sportKey: "nba",
    leagueLabel: "NBA",
    status: game.Quarter ? `Q${game.Quarter} ${game.TimeRemaining || ""}` : status,
    state,
    date: game.DateTime || game.Day || "",
    home: {
      name: game.HomeTeam || "Home",
      abbr: game.HomeTeam || "HOME",
      logo: getTeamLogo(game.HomeTeam, "nba"),
      score: game.HomeTeamScore ?? undefined,
    },
    away: {
      name: game.AwayTeam || "Away",
      abbr: game.AwayTeam || "AWAY",
      logo: getTeamLogo(game.AwayTeam, "nba"),
      score: game.AwayTeamScore ?? undefined,
    },
  };
}

export function normalizeMLBGame(game: any): ChewthGame {
  const status = game.Status || "Scheduled";
  const state = status === "InProgress" ? "in" : status === "Final" ? "post" : "pre";
  
  return {
    id: game.GameID?.toString() || Math.random().toString(),
    sportKey: "mlb",
    leagueLabel: "MLB",
    status: game.Inning ? `${game.InningHalf === "T" ? "Top" : "Bot"} ${game.Inning}` : status,
    state,
    date: game.DateTime || game.Day || "",
    home: {
      name: game.HomeTeam || "Home",
      abbr: game.HomeTeam || "HOME",
      logo: getTeamLogo(game.HomeTeam, "mlb"),
      score: game.HomeTeamRuns ?? undefined,
    },
    away: {
      name: game.AwayTeam || "Away",
      abbr: game.AwayTeam || "AWAY",
      logo: getTeamLogo(game.AwayTeam, "mlb"),
      score: game.AwayTeamRuns ?? undefined,
    },
  };
}

export function normalizeCFBGame(game: any): ChewthGame {
  const status = game.Status || "Scheduled";
  const state = status === "InProgress" ? "in" : status === "Final" ? "post" : "pre";
  
  return {
    id: game.GameID?.toString() || Math.random().toString(),
    sportKey: "ncaaf",
    leagueLabel: "College Football",
    status: game.Quarter ? `Q${game.Quarter} ${game.TimeRemaining || ""}` : status,
    state,
    date: game.DateTime || game.Day || "",
    home: {
      name: game.HomeTeam || "Home",
      abbr: game.HomeTeam || "HOME",
      logo: game.HomeTeamLogo || "",
      score: game.HomeTeamScore ?? undefined,
    },
    away: {
      name: game.AwayTeam || "Away",
      abbr: game.AwayTeam || "AWAY",
      logo: game.AwayTeamLogo || "",
      score: game.AwayTeamScore ?? undefined,
    },
  };
}

export function normalizeCBBGame(game: any): ChewthGame {
  const status = game.Status || "Scheduled";
  const state = status === "InProgress" ? "in" : status === "Final" ? "post" : "pre";
  
  return {
    id: game.GameID?.toString() || Math.random().toString(),
    sportKey: "ncaab",
    leagueLabel: "College Basketball",
    status: game.Period ? `H${game.Period} ${game.TimeRemaining || ""}` : status,
    state,
    date: game.DateTime || game.Day || "",
    home: {
      name: game.HomeTeam || "Home",
      abbr: game.HomeTeam || "HOME",
      logo: game.HomeTeamLogo || "",
      score: game.HomeTeamScore ?? undefined,
    },
    away: {
      name: game.AwayTeam || "Away",
      abbr: game.AwayTeam || "AWAY",
      logo: game.AwayTeamLogo || "",
      score: game.AwayTeamScore ?? undefined,
    },
  };
}
