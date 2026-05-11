import assert from "node:assert/strict";
import {
  buildDirectEspnApiUrl,
  buildEspnGroupsUrl,
  buildEspnCalendarUrl,
  buildEspnScoreboardUrl,
  fetchDirectEspnScoreboard,
} from "./espnDirect";

async function run() {
  assert.equal(
    buildEspnScoreboardUrl({ sport: "nba", date: "20260510", source: "cdn" }),
    "https://cdn.espn.com/core/nba/scoreboard?xhr=1&dates=20260510",
  );

  assert.equal(
    buildEspnScoreboardUrl({ sport: "nba", date: "20260510" }),
    "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20260510",
  );

  assert.equal(
    buildEspnCalendarUrl("nfl"),
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
  );

  assert.equal(
    buildEspnGroupsUrl("ncaab"),
    "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/groups",
  );

  assert.equal(
    buildDirectEspnApiUrl("/api/espn/standings/nba?group=5"),
    "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?group=5",
  );

  assert.equal(
    buildDirectEspnApiUrl("/api/espn/statistics/mlb"),
    "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/statistics",
  );

  assert.equal(
    buildDirectEspnApiUrl("/api/espn/leaders/nfl"),
    "https://site.api.espn.com/apis/site/v3/sports/football/nfl/leaders",
  );

  assert.equal(
    buildDirectEspnApiUrl("/api/espn/teams/ncaaf?groups=80&limit=2000"),
    "https://site.api.espn.com/apis/v2/sports/football/college-football/standings?group=80",
  );

  assert.equal(
    buildDirectEspnApiUrl("/api/espn/teams/nba"),
    "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings",
  );

  assert.equal(
    buildDirectEspnApiUrl("/api/espn/teams-scrape/ncaaf?division=fcs"),
    "https://site.api.espn.com/apis/v2/sports/football/college-football/standings?group=81",
  );

  assert.equal(
    buildDirectEspnApiUrl("/api/espn/team/nba/13?enable=stats"),
    "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/13?enable=stats",
  );

  assert.equal(
    buildDirectEspnApiUrl("/api/espn/game/ncaab/401746036"),
    "https://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event=401746036",
  );

  assert.equal(
    buildDirectEspnApiUrl("/api/espn/news/ufc?limit=30"),
    "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/news?limit=30",
  );

  assert.equal(
    buildDirectEspnApiUrl("/api/espn/rankings/ncaaf"),
    "https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings",
  );

  assert.equal(
    buildDirectEspnApiUrl("/api/espn/mma/schedule"),
    "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard",
  );

  const requested: string[] = [];
  const fakeFetch = async (url: string) => {
    requested.push(url);
    const group = url.includes("groups=80") ? "fbs" : "fcs";
    return {
      ok: true,
      status: 200,
      json: async () => ({
        leagues: [{ id: "23" }],
        events: [
          { id: "shared", date: "2026-09-05T18:00:00Z" },
          { id: group, date: group === "fbs" ? "2026-09-05T17:00:00Z" : "2026-09-05T19:00:00Z" },
        ],
      }),
    };
  };

  const merged = await fetchDirectEspnScoreboard(
    { sport: "ncaaf", date: "20260905" },
    fakeFetch as typeof fetch,
  );

  assert.equal(requested.length, 2);
  assert.ok(requested.every((url) => url.startsWith("https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?")));
  assert.ok(requested.some((url) => url.includes("groups=80")));
  assert.ok(requested.some((url) => url.includes("groups=81")));
  assert.deepEqual(
    merged.events.map((event: any) => event.id),
    ["fbs", "shared", "fcs"],
  );

  const standingsTeamsResponse = await (await import("./espnDirect")).fetchDirectEspnApi(
    "/api/espn/teams/nba",
    (async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        children: [
          {
            name: "Eastern Conference",
            standings: {
              entries: [
                {
                  team: {
                    id: "8",
                    displayName: "Detroit Pistons",
                    abbreviation: "DET",
                    logos: [{ href: "https://a.espncdn.com/i/teamlogos/nba/500/det.png" }],
                  },
                },
              ],
            },
          },
        ],
      }),
    })) as any,
  );
  const standingsTeams = await standingsTeamsResponse.json();
  assert.equal(standingsTeams.sports[0].leagues[0].teams[0].team.displayName, "Detroit Pistons");

  const scrapedResponse = await (await import("./espnDirect")).fetchDirectEspnApi(
    "/api/espn/teams-scrape/ncaaf?division=fbs",
    (async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        children: [
          {
            name: "ACC",
            standings: {
              entries: [
                { team: { id: "228", displayName: "Clemson Tigers", abbreviation: "CLEM" } },
              ],
            },
          },
        ],
      }),
    })) as any,
  );
  const scraped = await scrapedResponse.json();
  assert.equal(scraped.scrapedGroups[0].name, "ACC");
  assert.equal(scraped.scrapedGroups[0].teams[0].name, "Clemson Tigers");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
