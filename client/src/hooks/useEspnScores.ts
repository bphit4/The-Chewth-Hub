import { useEffect, useMemo, useState } from "react";
import { fetchScoreboard, getSportConfig, mapEspnEventToGame, type ChewthGame, type EspnSportKey } from "@/lib/espn";

export function useEspnScores(sportKey: EspnSportKey) {
  const cfg = getSportConfig(sportKey);
  const [games, setGames] = useState<ChewthGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let interval: number | undefined;

    async function load() {
      if (!cfg) return;
      try {
        setError(null);
        const events = await fetchScoreboard(cfg.apiPath);
        const mapped = events.map((e) => mapEspnEventToGame(e, cfg.key, cfg.label));
        if (mounted) setGames(mapped);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load scores");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    setLoading(true);
    load();
    interval = window.setInterval(load, 30_000);

    return () => {
      mounted = false;
      if (interval) window.clearInterval(interval);
    };
  }, [sportKey]);

  return useMemo(() => ({ cfg, games, loading, error }), [cfg, games, loading, error]);
}
