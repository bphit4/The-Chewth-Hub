import type { EspnApiSportPath } from "@/lib/espn";

export function espnSiteV2(path: string) {
  return `https://site.api.espn.com/apis/site/v2/${path}`;
}

export function espnStandingsUrl(apiPath: EspnApiSportPath) {
  return espnSiteV2(`sports/${apiPath}/standings`);
}

export function espnTeamsUrl(apiPath: EspnApiSportPath) {
  return espnSiteV2(`sports/${apiPath}/teams`);
}

export function espnNewsUrl(apiPath: EspnApiSportPath, limit = 30) {
  return espnSiteV2(`sports/${apiPath}/news?limit=${limit}`);
}

export function espnRankingsUrl(apiPath: EspnApiSportPath) {
  // Only meaningful for college football/basketball and UFC.
  // For pro leagues, this may 404 or return empty.
  return espnSiteV2(`sports/${apiPath}/rankings`);
}

export function espnLeadersUrl(apiPath: EspnApiSportPath) {
  // Leaders lives on site/v3 for many leagues.
  return `https://site.api.espn.com/apis/site/v3/sports/${apiPath}/leaders`;
}
