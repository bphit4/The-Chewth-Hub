import React, { useEffect, useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { fetchDirectEspnApi } from "@/lib/espnDirect";
import { espnHeadshotPng } from "@/lib/espnImages";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

function textValue(value: any): string {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function normalizeAthleteBio(data: any, sportKey: EspnSportKey) {
  const athlete = data?.athlete ?? data?.player ?? data?.athletes?.[0] ?? data ?? {};
  const team = athlete?.team ?? data?.team ?? data?.teams?.[0] ?? {};
  const birthParts = [
    athlete?.birthPlace?.city,
    athlete?.birthPlace?.state,
    athlete?.birthPlace?.country,
  ].filter(Boolean);
  const birthPlace = birthParts.join(", ");
  const athleteId = athlete?.id ?? data?.id;
  const headshot =
    athlete?.headshot?.href ??
    athlete?.headshot?.url ??
    espnHeadshotPng(sportKey, athleteId);

  return {
    id: athleteId,
    name: athlete?.displayName ?? athlete?.fullName ?? athlete?.name ?? "",
    shortName: athlete?.shortName ?? "",
    headshot,
    position: textValue(athlete?.position?.displayName ?? athlete?.position?.abbreviation ?? athlete?.position),
    teamName: textValue(team?.displayName ?? team?.name),
    teamAbbr: textValue(team?.abbreviation),
    teamLogo: team?.logos?.[0]?.href ?? team?.logo,
    height: textValue(athlete?.displayHeight ?? athlete?.height),
    weight: textValue(athlete?.displayWeight ?? athlete?.weight),
    age: textValue(athlete?.age),
    experience: textValue(athlete?.experience?.years ?? athlete?.experience),
    birthPlace,
    college: textValue(athlete?.college?.name ?? athlete?.college?.displayName ?? athlete?.college),
    status: textValue(athlete?.status?.name ?? athlete?.status?.type?.name ?? athlete?.status),
    facts: [
      ["Jersey", athlete?.jersey],
      ["Birth Date", athlete?.dateOfBirth ? new Date(athlete.dateOfBirth).toLocaleDateString() : athlete?.displayDOB],
      ["Debut", athlete?.debutYear],
      ["Draft", athlete?.draft?.displayText ?? athlete?.draft?.selection],
      ["Hand", athlete?.hand?.displayValue ?? athlete?.hand],
      ["Reach", athlete?.displayReach ?? athlete?.reach],
      ["Stance", athlete?.stance?.displayName ?? athlete?.stance],
    ].map(([label, value]) => [label, textValue(value)]).filter(([, value]) => value),
  };
}

type StatRow = { name: string; value: string };
type StatCategory = { name: string; rows: StatRow[] };

function normalizeStatRows(raw: any): StatRow[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((s) => ({
        name: s?.displayName ?? s?.shortDisplayName ?? s?.name ?? "",
        value: s?.displayValue ?? s?.value ?? (typeof s === "string" ? s : ""),
      }))
      .filter((r) => r.name || r.value);
  }
  if (Array.isArray(raw?.stats)) {
    return normalizeStatRows(raw.stats);
  }
  if (typeof raw === "object") {
    return Object.entries(raw).map(([key, value]) => ({
      name: key,
      value: value != null ? String(value) : "",
    }));
  }
  return [];
}

function normalizeStatCategories(data: any): StatCategory[] {
  const statBlock = data?.statistics ?? data?.stats ?? data;
  const labels = statBlock?.labels ?? statBlock?.displayNames;
  const splits = statBlock?.splits;
  if (Array.isArray(labels) && Array.isArray(splits)) {
    return splits
      .map((split: any) => {
        const values = split?.stats ?? split?.values ?? [];
        return {
          name: split?.displayName ?? split?.name ?? split?.season?.displayName ?? "Stats",
          rows: labels
            .map((label: string, idx: number) => ({
              name: statBlock?.displayNames?.[idx] ?? label,
              value: values?.[idx] != null ? String(values[idx]) : "",
            }))
            .filter((row: StatRow) => row.name || row.value),
        };
      })
      .filter((cat: StatCategory) => cat.rows.length > 0);
  }

  const categories =
    data?.categories ??
    data?.stats?.categories ??
    data?.splits?.categories ??
    data?.statistics?.splits?.categories ??
    [];
  if (!Array.isArray(categories)) return [];
  return categories.map((cat: any) => ({
    name: cat?.displayName ?? cat?.name ?? "Stats",
    rows: Array.isArray(cat?.labels) && Array.isArray(cat?.totals)
      ? cat.labels.map((label: string, idx: number) => ({
          name: cat?.displayNames?.[idx] ?? label,
          value: cat.totals?.[idx] != null ? String(cat.totals[idx]) : "",
        }))
      : normalizeStatRows(cat?.stats ?? cat?.statistics ?? cat?.items ?? []),
  }));
}

function buildStatLine(raw: any): string {
  if (!raw) return "";
  const rows = normalizeStatRows(raw);
  if (rows.length === 0) return "";
  return rows.slice(0, 6).map((r) => (r.name ? `${r.name}: ${r.value}` : r.value)).join(" • ");
}

type GameLogRow = { id: string; date?: string; opponent?: string; result?: string; statLine?: string };

function normalizeGameLog(data: any): GameLogRow[] {
  const events = data?.events ?? data?.event ?? data?.items ?? data?.entries ?? data?.gamelog ?? [];
  if (!Array.isArray(events)) return [];
  return events.map((e: any, idx: number) => {
    const date = e?.date ?? e?.event?.date ?? e?.game?.date;
    const opponent =
      e?.opponent?.displayName ??
      e?.opponent?.shortDisplayName ??
      e?.opponent?.name ??
      e?.event?.shortName ??
      e?.name ??
      e?.label ??
      "";
    const result =
      e?.result?.displayValue ??
      e?.game?.status?.type?.shortDetail ??
      e?.status?.type?.shortDetail ??
      e?.status?.type?.description ??
      "";
    const statLine = buildStatLine(e?.stats ?? e?.statistics ?? e?.statLines ?? e?.athlete?.stats ?? e?.game?.stats);
    return {
      id: String(e?.id ?? idx),
      date,
      opponent,
      result,
      statLine,
    };
  });
}

export default function AthleteDetail() {
  const [match, params] = useRoute("/sport/:sport/athlete/:athleteId");
  const sport = params?.sport;
  const athleteId = params?.athleteId;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);

  const [overview, setOverview] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [gamelog, setGamelog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!athleteId) return;
      try {
        setLoading(true);
        setError(null);
        const [overviewRes, statsRes, gamelogRes] = await Promise.all([
          fetchDirectEspnApi(`/api/espn/athlete/${sportKey}/${athleteId}/overview`),
          fetchDirectEspnApi(`/api/espn/athlete/${sportKey}/${athleteId}/stats`),
          fetchDirectEspnApi(`/api/espn/athlete/${sportKey}/${athleteId}/gamelog`),
        ]);
        if (!mounted) return;
        if (overviewRes.ok) setOverview(await overviewRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
        if (gamelogRes.ok) setGamelog(await gamelogRes.json());
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load athlete data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [sportKey, athleteId]);

  if (!match || !cfg) return null;

  const bio = useMemo(() => normalizeAthleteBio(overview, sportKey), [overview, sportKey]);
  const statCategories = useMemo(() => {
    const fromStats = normalizeStatCategories(sportKey === "ufc" ? stats?.splits ?? stats : stats);
    const hasRows = fromStats.some((cat) => cat.rows.length > 0);
    if (hasRows) return fromStats;
    const fromOverview = normalizeStatCategories(overview?.statistics ?? overview?.stats ?? overview);
    if (fromOverview.some((cat) => cat.rows.length > 0)) return fromOverview;
    if (sportKey === "ufc") {
      return fromStats;
    }
    return fromStats;
  }, [overview, stats, sportKey]);
  const splitCategories = useMemo(() => {
    if (sportKey === "ufc") {
      return [];
    }
    return normalizeStatCategories(stats?.splits ?? stats?.statistics?.splits ?? {});
  }, [stats, sportKey]);
  const gamelogRows = useMemo(() => {
    const fromLog = normalizeGameLog(gamelog);
    return fromLog.length ? fromLog : normalizeGameLog(overview?.gameLog ?? overview?.gamelog ?? overview);
  }, [gamelog, overview]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-10 border-b border-white/10">
        <div className="container px-4 md:px-6">
          <Link href={`/sport/${sportKey}/teams`}>
            <Button variant="ghost" className="pl-0 gap-2 text-white hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Teams
            </Button>
          </Link>
          <div className="flex items-center gap-4 mt-4">
            {bio.headshot ? (
              <img
                src={bio.headshot}
                alt=""
                className="h-20 w-20 rounded-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-secondary/20" />
            )}
            <div>
              <h1 className="text-3xl md:text-5xl font-heading font-black text-white uppercase italic tracking-tighter">
                {bio.name || "Athlete Details"}
              </h1>
              <div className="flex items-center gap-3 text-white/70 mt-2">
                {(bio.teamName || bio.teamAbbr) && (
                  <div className="flex items-center gap-2">
                    {bio.teamLogo && <img src={bio.teamLogo} alt="" className="h-6 w-6 object-contain" />}
                    <span>{bio.teamName || bio.teamAbbr}</span>
                  </div>
                )}
                {bio.position && <Badge variant="secondary">{bio.position}</Badge>}
                {bio.status && <Badge variant="outline">{bio.status}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SportSubnav sportKey={sportKey} />

      <div className="container px-4 md:px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              {error}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-heading uppercase tracking-wider">Bio</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-40 animate-pulse bg-secondary/5 rounded-xl" />
              ) : (
                <div className="grid gap-3 text-sm">
                  {bio.height && <div><span className="text-muted-foreground">Height:</span> {bio.height}</div>}
                  {bio.weight && <div><span className="text-muted-foreground">Weight:</span> {bio.weight}</div>}
                  {bio.age && <div><span className="text-muted-foreground">Age:</span> {bio.age}</div>}
                  {bio.experience && <div><span className="text-muted-foreground">Experience:</span> {bio.experience}</div>}
                  {bio.birthPlace && <div><span className="text-muted-foreground">Birthplace:</span> {bio.birthPlace}</div>}
                  {bio.college && <div><span className="text-muted-foreground">College:</span> {bio.college}</div>}
                  {bio.facts.map(([label, value]) => (
                    <div key={label}>
                      <span className="text-muted-foreground">{label}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-heading uppercase tracking-wider">Season Stats</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-40 animate-pulse bg-secondary/5 rounded-xl" />
              ) : statCategories.length === 0 ? (
                <div className="text-sm text-muted-foreground">No stats available.</div>
              ) : (
                <div className="grid gap-4">
                  {statCategories.map((cat, idx) => (
                    <div key={`${cat.name}-${idx}`}>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">
                        {cat.name}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {cat.rows.map((row, rIdx) => (
                          <div key={`${row.name}-${rIdx}`} className="flex justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">{row.name || "Stat"}</span>
                            <span className="font-mono">{row.value || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-heading uppercase tracking-wider">Splits</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-40 animate-pulse bg-secondary/5 rounded-xl" />
              ) : splitCategories.length === 0 ? (
                <div className="text-sm text-muted-foreground">No split data available.</div>
              ) : (
                <div className="grid gap-4">
                  {splitCategories.map((cat, idx) => (
                    <div key={`${cat.name}-${idx}`}>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">
                        {cat.name}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {cat.rows.map((row, rIdx) => (
                          <div key={`${row.name}-${rIdx}`} className="flex justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">{row.name || "Split"}</span>
                            <span className="font-mono">{row.value || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-heading uppercase tracking-wider">Game Log</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-40 animate-pulse bg-secondary/5 rounded-xl" />
              ) : gamelogRows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No gamelog data available.</div>
              ) : (
                <div className="grid gap-3 text-sm">
                  {gamelogRows.slice(0, 12).map((row) => (
                    <div key={row.id} className="flex flex-col gap-1 border-b border-border/60 pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{row.opponent || "Game"}</div>
                        <div className="text-xs text-muted-foreground">{row.date ? new Date(row.date).toLocaleDateString() : ""}</div>
                      </div>
                      {row.result && <div className="text-xs text-muted-foreground">{row.result}</div>}
                      {row.statLine && <div className="text-xs">{row.statLine}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
