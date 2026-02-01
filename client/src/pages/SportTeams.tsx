import { useMemo, useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { AlertCircle, Search, ExternalLink } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: unknown): v is EspnSportKey {
  return typeof v === "string" && sportKeys.includes(v);
}

interface TeamData {
  id: string;
  name: string;
  abbr: string;
  logo?: string;
  color?: string;
  conference?: string;
  division?: string;
}

interface ConferenceGroup {
  name: string;
  teams: TeamData[];
}

const CONFERENCE_ORDER = [
  "SEC",
  "Big Ten",
  "Big 12",
  "ACC",
  "Pac-12",
  "Big East",
  "American",
  "Mountain West",
  "Mid-American",
  "Sun Belt",
  "Conference USA",
  "Independent",
  "Other",
];

/** Get conference name from team object (ESPN uses various shapes). */
function getConferenceName(team: any): string {
  const g = team?.groups ?? team?.group;
  const name = g?.name ?? g?.displayName ?? team?.conference?.name ?? team?.conference?.displayName ?? "";
  if (typeof name === "string" && name.trim()) return name.trim();
  return "Other";
}

/** Normalize teams from API and group by conference. Only include leagues matching requested division. */
function normalizeTeamsByConference(
  data: any,
  sportKey: string,
  requestedDivision: string | null
): ConferenceGroup[] {
  const sports = data?.sports ?? [];
  if (!sports.length) return [];

  const conferenceMap = new Map<string, TeamData[]>();

  // Pre-scan leagues to see if we can reliably detect FBS/FCS/D1
  const leagues = sports.flatMap((s: any) => s?.leagues ?? []);
  const hasFBSLeague = leagues.some((l: any) => {
    const n = (l?.name ?? "").toLowerCase();
    const a = (l?.abbreviation ?? "").toLowerCase();
    return a === "fbs" || n.includes("fbs") || n.includes("football bowl subdivision");
  });
  const hasFCSLeague = leagues.some((l: any) => {
    const n = (l?.name ?? "").toLowerCase();
    const a = (l?.abbreviation ?? "").toLowerCase();
    return a === "fcs" || n.includes("fcs") || n.includes("football championship subdivision");
  });
  const hasD1League = leagues.some((l: any) => {
    const n = (l?.name ?? "").toLowerCase();
    const a = (l?.abbreviation ?? "").toLowerCase();
    return a === "d1" || n.includes("division i") || n.includes("d1");
  });

  for (const sportData of sports) {
    const leagues = sportData?.leagues ?? [];
    for (const league of leagues) {
      const leagueName = (league?.name ?? "").toLowerCase();
      const leagueAbbr = (league?.abbreviation ?? "").toLowerCase();

      // NCAAF: only include leagues that match the requested division (FBS or FCS)
      if (sportKey === "ncaaf" && requestedDivision) {
        const isFBS =
          leagueAbbr === "fbs" ||
          leagueName.includes("fbs") ||
          leagueName.includes("football bowl subdivision");
        const isFCS =
          leagueAbbr === "fcs" ||
          leagueName.includes("fcs") ||
          leagueName.includes("football championship subdivision");
        const isD2 = leagueName.includes("division ii") || leagueName.includes("d2") || leagueAbbr === "d2";
        const isD3 = leagueName.includes("division iii") || leagueName.includes("d3") || leagueAbbr === "d3";

        // If ESPN doesn't label leagues, don't filter by league type to avoid empty pages
        const shouldFilterByLeague = hasFBSLeague || hasFCSLeague;

        if (shouldFilterByLeague) {
          if (requestedDivision === "80" && !isFBS) continue; // FBS tab: only FBS league
          if (requestedDivision === "81" && !isFCS) continue; // FCS tab: only FCS league
        }
        if (isD2 || isD3) continue; // never show D2/D3 on NCAAF teams page
      }

      // NCAAB: only Division I when we requested D1
      if (sportKey === "ncaab" && requestedDivision === "50") {
        const isD1 =
          leagueAbbr === "d1" ||
          leagueName.includes("division i") ||
          leagueName.includes("d1") ||
          (!leagueName.includes("division ii") && !leagueName.includes("division iii"));
        const isD2 = leagueName.includes("division ii") || leagueName.includes("d2");
        const isD3 = leagueName.includes("division iii") || leagueName.includes("d3");
        const shouldFilterByLeague = hasD1League;
        if (shouldFilterByLeague && (!isD1 || isD2 || isD3)) continue;
        if (isD2 || isD3) continue;
      }

      const teams = league?.teams ?? [];
      for (const t of teams) {
        const team = t?.team ?? t;
        if (!team?.id) continue;
        const confName = getConferenceName(team);
        const teamData: TeamData = {
          id: String(team.id),
          name: team.displayName ?? team.name ?? "",
          abbr: team.abbreviation ?? "",
          logo: team.logos?.[0]?.href ?? team.logo,
          color: team.color ? `#${team.color}` : undefined,
          conference: confName,
          division: team.groups?.parent?.name ?? team.group?.parent?.name ?? undefined,
        };
        if (!conferenceMap.has(confName)) conferenceMap.set(confName, []);
        conferenceMap.get(confName)!.push(teamData);
      }
    }
  }

  const groups: ConferenceGroup[] = Array.from(conferenceMap.entries()).map(([name, teams]) => ({
    name,
    teams: teams.sort((a, b) => a.name.localeCompare(b.name)),
  }));

  return groups.sort((a, b) => {
    const ai = CONFERENCE_ORDER.findIndex((c) => a.name.includes(c) || c === a.name);
    const bi = CONFERENCE_ORDER.findIndex((c) => b.name.includes(c) || c === b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
}

function normalizeTeamsFlat(data: any): TeamData[] {
  const teams = data?.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return teams
    .map((t: any) => {
      const team = t?.team ?? t;
      return {
        id: String(team?.id ?? ""),
        name: team?.displayName ?? team?.name ?? "",
        abbr: team?.abbreviation ?? "",
        logo: team?.logos?.[0]?.href ?? team?.logo,
        color: team?.color ? `#${team.color}` : undefined,
      };
    })
    .filter((t: TeamData) => t.id && t.name);
}

function normalizeNcaabStandings(data: any): ConferenceGroup[] {
  const conferences = data?.children ?? [];
  const groups: ConferenceGroup[] = [];
  for (const conf of conferences) {
    if (!conf?.isConference) continue;
    const entries = conf?.standings?.entries ?? [];
    const teams: TeamData[] = entries
      .map((e: any) => {
        const t = e?.team;
        if (!t?.id) return null;
        return {
          id: String(t.id),
          name: t.displayName ?? t.name ?? "",
          abbr: t.abbreviation ?? "",
          logo: t.logos?.[0]?.href ?? t.logo,
          conference: conf?.shortName ?? conf?.name ?? "",
        } as TeamData;
      })
      .filter(Boolean) as TeamData[];
    if (teams.length) {
      groups.push({
        name: conf?.shortName ?? conf?.name ?? "Conference",
        teams: teams.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
  }
  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

export default function SportTeams() {
  const [match, params] = useRoute("/sport/:sport/teams");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ncaafDivision, setNcaafDivision] = useState<"80" | "81" | "82" | "83">("80");
  const [ncaabDivision, setNcaabDivision] = useState<"50" | "51" | "52">("50");
  const [conferenceFilter, setConferenceFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [expandedConfs, setExpandedConfs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setConferenceFilter("all");
    setQ("");
  }, [sportKey, ncaafDivision, ncaabDivision]);

  useEffect(() => {
    let mounted = true;
    async function fetchJson(url: string) {
      const res = await fetch(url);
      const text = await res.text();
      try {
        return { ok: res.ok, data: JSON.parse(text) };
      } catch {
        throw new Error("Teams scrape returned invalid JSON. Restart the dev server and try again.");
      }
    }

    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (sportKey === "ncaaf") {
          const division =
            ncaafDivision === "80"
              ? "fbs"
              : ncaafDivision === "81"
                ? "fcs"
                : ncaafDivision === "82"
                  ? "d2"
                  : "d3";
          const { ok, data } = await fetchJson(`/api/espn/teams-scrape/${sportKey}?division=${division}`);
          if (!ok) throw new Error(data?.error ?? "Failed to fetch teams");
          const json = data;
          if (mounted) setData(json);
        } else if (sportKey === "ncaab") {
          if (ncaabDivision === "50") {
            const { ok, data } = await fetchJson(`/api/espn/standings/${sportKey}`);
            if (!ok) throw new Error(data?.error ?? "Failed to fetch standings");
            if (mounted) setData(data);
          } else {
            const division = ncaabDivision === "51" ? "d2" : "d3";
            const { ok, data } = await fetchJson(`/api/espn/teams-scrape/${sportKey}?division=${division}`);
            if (!ok) throw new Error(data?.error ?? "Failed to fetch teams");
            const json = data;
            if (mounted) setData(json);
          }
        } else {
          const { ok, data } = await fetchJson(`/api/espn/teams/${sportKey}`);
          if (!ok) throw new Error(data?.error ?? "Failed to fetch teams");
          const json = data;
          if (mounted) setData(json);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load teams");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [sportKey, ncaafDivision, ncaabDivision]);

  const requestedDivision = sportKey === "ncaaf" ? ncaafDivision : sportKey === "ncaab" ? ncaabDivision : null;

  const conferenceGroups = useMemo(() => {
    if (sportKey === "ncaaf" || sportKey === "ncaab") {
      if (sportKey === "ncaab" && ncaabDivision === "50" && data?.children) {
        return normalizeNcaabStandings(data);
      }
      if (data?.scrapedGroups?.length) {
        return data.scrapedGroups as ConferenceGroup[];
      }
      return normalizeTeamsByConference(data, sportKey, requestedDivision);
    }
    const teams = normalizeTeamsFlat(data);
    return teams.length ? [{ name: "All Teams", teams }] : [];
  }, [data, sportKey, requestedDivision]);

  const conferenceOptions = useMemo(() => {
    const list = conferenceGroups.map((g) => g.name);
    return [{ id: "all", label: "All Conferences" }, ...list.map((name) => ({ id: name, label: name }))];
  }, [conferenceGroups]);

  const filteredGroups = useMemo(() => {
    let groups = conferenceFilter === "all" ? conferenceGroups : conferenceGroups.filter((g) => g.name === conferenceFilter);
    const searchTerm = q.trim().toLowerCase();
    if (searchTerm) {
      groups = groups
        .map((g) => ({
          ...g,
          teams: g.teams.filter((t) => `${t.name} ${t.abbr} ${t.conference ?? ""}`.toLowerCase().includes(searchTerm)),
        }))
        .filter((g) => g.teams.length > 0);
    }
    return groups;
  }, [conferenceGroups, conferenceFilter, q]);

  const totalTeams = useMemo(() => filteredGroups.reduce((acc, g) => acc + g.teams.length, 0), [filteredGroups]);

  const toggleConf = (name: string) => {
    setExpandedConfs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (!match || !cfg) return null;

  // NCAAF: FBS / FCS tabs, conferences, two-column layout
  if (sportKey === "ncaaf") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <SportSubnav sportKey={sportKey} />
        <div className="border-b border-border/50 bg-card/50">
          <div className="container px-4 md:px-6 py-4">
            <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">College Football Teams</h1>
          </div>
        </div>
        <div className="container px-4 md:px-6 py-8">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between flex-wrap">
            <div className="flex flex-wrap items-center gap-3">
              <Tabs value={ncaafDivision} onValueChange={(v) => setNcaafDivision(v as "80" | "81" | "82" | "83")}>
                <TabsList className="grid w-full max-w-[320px] grid-cols-4">
                  <TabsTrigger value="80" className="uppercase font-bold tracking-wider">FBS</TabsTrigger>
                  <TabsTrigger value="81" className="uppercase font-bold tracking-wider">FCS</TabsTrigger>
                  <TabsTrigger value="82" className="uppercase font-bold tracking-wider">D2</TabsTrigger>
                  <TabsTrigger value="83" className="uppercase font-bold tracking-wider">D3</TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={conferenceFilter} onValueChange={setConferenceFilter}>
                <SelectTrigger className="w-[200px] uppercase font-bold tracking-wider" data-testid="select-conference">
                  <SelectValue placeholder="All Conferences" />
                </SelectTrigger>
                <SelectContent>
                  {conferenceOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id} className="uppercase font-bold">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search teams..." className="pl-9 w-[200px]" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider">{totalTeams} teams</div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-destructive font-bold">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-6">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-32 animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          )}

          {!loading && (
            <div className="space-y-10">
              {filteredGroups.map((group) => (
                <div key={group.name}>
                  <h2 className="text-base font-bold uppercase tracking-wider text-foreground mb-4 border-b border-border pb-2">
                    {group.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {group.teams.map((t) => (
                      <div key={t.id} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                        {t.logo ? (
                          <img src={t.logo} alt="" className="h-10 w-10 object-contain shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted shrink-0 flex items-center justify-center font-bold text-xs">{t.abbr?.slice(0, 2) || "?"}</div>
                        )}
                        <div className="min-w-0 flex-1">
                          {t.id ? (
                            <Link href={`/sport/${sportKey}/team/${t.id}`} className="font-bold text-sm hover:text-primary hover:underline block truncate">
                              {t.name}
                            </Link>
                          ) : (
                            <span className="font-bold text-sm block truncate">{t.name}</span>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                            {t.id ? (
                              <>
                                <Link href={`/sport/${sportKey}/team/${t.id}`} className="hover:text-primary hover:underline">Statistics</Link>
                                <span className="text-border">|</span>
                                <Link href={`/sport/${sportKey}/schedule`} className="hover:text-primary hover:underline">Schedule</Link>
                                <span className="text-border">|</span>
                                <Link href={`/sport/${sportKey}/team/${t.id}`} className="hover:text-primary hover:underline">Roster</Link>
                                <span className="text-border">|</span>
                                <a href={`https://www.espn.com/college-football/team/_/id/${t.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline inline-flex items-center gap-0.5">
                                  Tickets <ExternalLink className="h-3 w-3" />
                                </a>
                              </>
                            ) : (
                              <span className="text-muted-foreground">Team details coming soon</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredGroups.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">No teams match your filters.</div>
          )}
        </div>
      </div>
    );
  }

  // NCAAM: Division I only, by conference
  if (sportKey === "ncaab") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <SportSubnav sportKey={sportKey} />
        <div className="border-b border-border/50 bg-card/50">
          <div className="container px-4 md:px-6 py-4">
            <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">College Basketball Teams</h1>
          </div>
        </div>
        <div className="container px-4 md:px-6 py-8">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between flex-wrap">
            <div className="flex flex-wrap items-center gap-3">
              <Tabs value={ncaabDivision} onValueChange={(v) => setNcaabDivision(v as "50" | "51" | "52")}>
                <TabsList className="grid w-full max-w-[240px] grid-cols-3">
                  <TabsTrigger value="50" className="uppercase font-bold tracking-wider">D1</TabsTrigger>
                  <TabsTrigger value="51" className="uppercase font-bold tracking-wider">D2</TabsTrigger>
                  <TabsTrigger value="52" className="uppercase font-bold tracking-wider">D3</TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={conferenceFilter} onValueChange={setConferenceFilter}>
                <SelectTrigger className="w-[200px] uppercase font-bold tracking-wider">
                  <SelectValue placeholder="All Conferences" />
                </SelectTrigger>
                <SelectContent>
                  {conferenceOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id} className="uppercase font-bold">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search teams..." className="pl-9 w-[200px]" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider">{totalTeams} teams</div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-destructive font-bold">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-6">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-32 animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          )}

          {!loading && (
            <div className="space-y-10">
              {filteredGroups.map((group) => (
                <div key={group.name}>
                  <h2 className="text-base font-bold uppercase tracking-wider text-foreground mb-4 border-b border-border pb-2">
                    {group.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    {group.teams.map((t) => (
                      <div key={t.id} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                        {t.logo ? (
                          <img src={t.logo} alt="" className="h-10 w-10 object-contain shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted shrink-0 flex items-center justify-center font-bold text-xs">{t.abbr?.slice(0, 2) || "?"}</div>
                        )}
                        <div className="min-w-0 flex-1">
                          {t.id ? (
                            <Link href={`/sport/${sportKey}/team/${t.id}`} className="font-bold text-sm hover:text-primary hover:underline block truncate">
                              {t.name}
                            </Link>
                          ) : (
                            <span className="font-bold text-sm block truncate">{t.name}</span>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                            {t.id ? (
                              <>
                                <Link href={`/sport/${sportKey}/team/${t.id}`} className="hover:text-primary hover:underline">Statistics</Link>
                                <span className="text-border">|</span>
                                <Link href={`/sport/${sportKey}/schedule`} className="hover:text-primary hover:underline">Schedule</Link>
                                <span className="text-border">|</span>
                                <a href={`https://www.espn.com/mens-college-basketball/team/_/id/${t.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline inline-flex items-center gap-0.5">
                                  Tickets <ExternalLink className="h-3 w-3" />
                                </a>
                              </>
                            ) : (
                              <span className="text-muted-foreground">Team details coming soon</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredGroups.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">No teams match your filters.</div>
          )}
        </div>
      </div>
    );
  }

  // Pro sports: flat list with optional division grouping
  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">{cfg.label} Teams</h1>
        </div>
      </div>
      <div className="container px-4 md:px-6 py-8">
        <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${cfg.label} teams...`} className="pl-9" />
          </div>
          <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider">{totalTeams} teams</div>
        </div>
        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          </div>
        )}
        {loading && (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Card key={i} className="h-20 animate-pulse bg-card border-border" />
            ))}
          </div>
        )}
        {!loading && (
          <div className="space-y-4">
            {filteredGroups.map((group) => {
              const isExpanded = expandedConfs.has(group.name) || expandedConfs.size === 0;
              return (
                <Card key={group.name} className="bg-card border-border overflow-hidden">
                  <button onClick={() => toggleConf(group.name)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/5 transition-colors text-left">
                    <div className="font-heading uppercase tracking-wider font-bold">{group.name}</div>
                    <span className="text-xs text-muted-foreground">{group.teams.length} teams</span>
                  </button>
                  <div className="border-t border-border p-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {group.teams.map((t) => (
                        <Link key={t.id} href={`/sport/${sportKey}/team/${t.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/10 transition-all">
                          {t.logo ? <img src={t.logo} alt="" className="h-10 w-10 object-contain" /> : <div className="h-10 w-10 rounded-full bg-secondary/10" />}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm truncate">{t.name}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.abbr}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
