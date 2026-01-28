import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as sportsdata from "./sportsdata";
import * as normalizers from "./normalizers";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // SportsDataIO proxy routes (keeps API key server-side)

  // NFL
  app.get("/api/nfl/scores/:date", async (req, res, next) => {
    try {
      const rawData = await sportsdata.getNFLScoresByDate(req.params.date);
      const normalized = Array.isArray(rawData) 
        ? rawData.map(normalizers.normalizeNFLGame)
        : [];
      res.json(normalized);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/nfl/standings/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getNFLStandings(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/nfl/stats/players/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getNFLPlayerSeasonStats(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/nfl/stats/teams/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getNFLTeamSeasonStats(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // NBA
  app.get("/api/nba/scores/:date", async (req, res, next) => {
    try {
      const rawData = await sportsdata.getNBAGamesByDate(req.params.date);
      const normalized = Array.isArray(rawData)
        ? rawData.map(normalizers.normalizeNBAGame)
        : [];
      res.json(normalized);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/nba/standings/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getNBAStandings(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/nba/stats/players/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getNBAPlayerSeasonStats(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/nba/stats/teams/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getNBATeamSeasonStats(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // MLB
  app.get("/api/mlb/scores/:date", async (req, res, next) => {
    try {
      const rawData = await sportsdata.getMLBGamesByDate(req.params.date);
      const normalized = Array.isArray(rawData)
        ? rawData.map(normalizers.normalizeMLBGame)
        : [];
      res.json(normalized);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/mlb/standings/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getMLBStandings(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/mlb/stats/players/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getMLBPlayerSeasonStats(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/mlb/stats/teams/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getMLBTeamSeasonStats(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // CFB (College Football)
  app.get("/api/cfb/scores/:season/:week", async (req, res, next) => {
    try {
      const rawData = await sportsdata.getCFBGamesByWeek(req.params.season, req.params.week);
      const normalized = Array.isArray(rawData)
        ? rawData.map(normalizers.normalizeCFBGame)
        : [];
      res.json(normalized);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/cfb/standings/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getCFBStandings(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/cfb/stats/players/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getCFBPlayerSeasonStats(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/cfb/stats/teams/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getCFBTeamSeasonStats(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // CBB (College Basketball)
  app.get("/api/cbb/scores/:date", async (req, res, next) => {
    try {
      const rawData = await sportsdata.getCBBGamesByDate(req.params.date);
      const normalized = Array.isArray(rawData)
        ? rawData.map(normalizers.normalizeCBBGame)
        : [];
      res.json(normalized);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/cbb/standings/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getCBBStandings(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/cbb/stats/players/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getCBBPlayerSeasonStats(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/cbb/stats/teams/:season", async (req, res, next) => {
    try {
      const data = await sportsdata.getCBBTeamSeasonStats(req.params.season);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ESPN Proxy Routes (for game summaries, team data - avoids CORS issues)
  app.get("/api/espn/game/:sport/:eventId", async (req, res, next) => {
    try {
      const data = await sportsdata.getEspnGameSummary(req.params.sport, req.params.eventId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/espn/team/:sport/:teamId", async (req, res, next) => {
    try {
      const data = await sportsdata.getEspnTeam(req.params.sport, req.params.teamId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/espn/team/:sport/:teamId/schedule", async (req, res, next) => {
    try {
      const data = await sportsdata.getEspnTeamSchedule(req.params.sport, req.params.teamId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/espn/team/:sport/:teamId/roster", async (req, res, next) => {
    try {
      const data = await sportsdata.getEspnTeamRoster(req.params.sport, req.params.teamId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ESPN teams list with optional groups parameter
  app.get("/api/espn/teams/:sport", async (req, res, next) => {
    try {
      const groups = req.query.groups as string | undefined;
      const data = await sportsdata.getEspnTeams(req.params.sport, groups);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ESPN standings proxy
  app.get("/api/espn/standings/:sport", async (req, res, next) => {
    try {
      const data = await sportsdata.getEspnStandings(req.params.sport);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ESPN scoreboard proxy
  app.get("/api/espn/scoreboard/:sport", async (req, res, next) => {
    try {
      const date = req.query.dates as string | undefined;
      const data = await sportsdata.getEspnScoreboard(req.params.sport, date);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ESPN news proxy
  app.get("/api/espn/news/:sport", async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const data = await sportsdata.getEspnNews(req.params.sport, limit);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ESPN leaders/stats proxy
  app.get("/api/espn/leaders/:sport", async (req, res, next) => {
    try {
      const data = await sportsdata.getEspnLeaders(req.params.sport);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  // ESPN rankings proxy
  app.get("/api/espn/rankings/:sport", async (req, res, next) => {
    try {
      const data = await sportsdata.getEspnRankings(req.params.sport);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  return httpServer;
}
