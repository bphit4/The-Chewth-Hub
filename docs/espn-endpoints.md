ESPN Endpoints Reference
========================

This document is a quick reference for ESPN endpoints we currently use and
additional endpoints that may improve data depth or performance.

Sources (for reference):
- https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b
- https://github.com/pseudo-r/Public-ESPN-API?tab=readme-ov-file#endpoints

Base Domains
------------
- site.api.espn.com        (scores, news, teams, standings)
- site.web.api.espn.com    (summary, athlete details)
- sports.core.api.espn.com (detailed data, odds, athletes)
- cdn.espn.com             (fast/live scoreboard, boxscore)

Current App Usage
-----------------
- Scoreboard:
  https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard
- Summary:
  https://site.web.api.espn.com/apis/site/v2/sports/{sport}/{league}/summary?event={id}
- Team:
  https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams/{id}
  - Enable extra data (example):
    https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/12?enable=stats
- Team roster:
  https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams/{id}/roster
- Team schedule:
  https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams/{id}/schedule
- Standings (v2):
  https://site.api.espn.com/apis/v2/sports/{sport}/{league}/standings
- Leaders:
  https://site.api.espn.com/apis/site/v3/sports/{sport}/{league}/leaders
- Statistics:
  https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/statistics

College Football Grouping (Important)
--------------------------------------
- FBS standings:
  https://site.api.espn.com/apis/v2/sports/football/college-football/standings?groups=80
- FCS standings:
  https://site.api.espn.com/apis/v2/sports/football/college-football/standings?group=81
  Note: ESPN uses "group" (singular) for FCS standings.

High-Value Additions
--------------------
Athlete Details
- Athlete overview:
  https://site.web.api.espn.com/apis/common/v3/sports/{sport}/{league}/athletes/{id}/overview
- Athlete stats:
  https://site.web.api.espn.com/apis/common/v3/sports/{sport}/{league}/athletes/{id}/stats
- Athlete game log:
  https://site.web.api.espn.com/apis/common/v3/sports/{sport}/{league}/athletes/{id}/gamelog

Odds and Probabilities
- Event odds:
  https://sports.core.api.espn.com/v2/sports/{sport}/leagues/{league}/events/{eventId}/competitions/{eventId}/odds
- Win probabilities:
  https://sports.core.api.espn.com/v2/sports/{sport}/leagues/{league}/events/{eventId}/competitions/{eventId}/probabilities

CDN (Fast/Live)
- Live scoreboard:
  https://cdn.espn.com/core/{league}/scoreboard?xhr=1
- Live boxscore:
  https://cdn.espn.com/core/{league}/boxscore?xhr=1&gameId={id}

Notes
-----
- Use caching and error handling; these APIs are unofficial and can change.
- College sports may require "groups" to pull all games/conferences.
