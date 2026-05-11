import type { EspnSportKey } from "@/lib/espn";

const HEADSHOT_SPORT_PATH: Record<EspnSportKey, string> = {
  nfl: "nfl",
  nba: "nba",
  mlb: "mlb",
  ncaaf: "college-football",
  ncaab: "mens-college-basketball",
  ufc: "mma",
};

export function espnHeadshotPng(sportKey: EspnSportKey | undefined, athleteId?: string | number | null) {
  if (!sportKey || athleteId == null || athleteId === "") return undefined;
  const path = HEADSHOT_SPORT_PATH[sportKey];
  return path ? `https://a.espncdn.com/i/headshots/${path}/players/full/${athleteId}.png` : undefined;
}
