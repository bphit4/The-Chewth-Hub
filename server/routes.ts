import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as sportsdata from "./sportsdata";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // SportsDataIO proxy routes (keeps API key server-side)

  // NFL
  app.get("/api/nfl/scores/:date", async (req, res, next) => {
    try {
      const data = await sportsdata.getNFLScoresByDate(req.params.date);
      res.json(data);
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
      const data = await sportsdata.getNBAGamesByDate(req.params.date);
      res.json(data);
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
      const data = await sportsdata.getMLBGamesByDate(req.params.date);
      res.json(data);
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
      const data = await sportsdata.getCFBGamesByWeek(req.params.season, req.params.week);
      res.json(data);
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
      const data = await sportsdata.getCBBGamesByDate(req.params.date);
      res.json(data);
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

  return httpServer;
}
