import { useMemo, useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { AlertCircle, ChevronRight, Search, ChevronDown } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
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

function normalizeTeamsWithGroups(data: any, sport: string): ConferenceGroup[] {
  const sports = data?.sports ?? [];
  if (!sports.length) return [];

  const groups: ConferenceGroup[] = [];
  
  for (const sportData of sports) {
    const leagues = sportData?.leagues ?? [];
    
    for (const league of leagues) {
      const leagueName = league?.name ?? "";
      const leagueAbbr = league?.abbreviation ?? "";
      
      // For college sports, separate FBS/FCS or D1/D2/D3
      const isFBS = leagueName.includes("FBS") || leagueAbbr === "FBS";
      const isFCS = leagueName.includes("FCS") || leagueAbbr === "FCS";
      const isD1 = leagueName.includes("Division I") || leagueName.includes("D1") || !leagueName.includes("Division");
      
      // Skip FCS for college football, skip non-D1 for college basketball
      if (sport === "ncaaf" && isFCS) continue;
      if (sport === "ncaab" && !isD1) continue;
      
      const teams = league?.teams ?? [];
      
      // Group by conference if available
      const conferenceMap = new Map<string, TeamData[]>();
      
      for (const t of teams) {
        const team = t?.team ?? t;
        if (!team?.id) continue;
        
        const confName = team?.groups?.name ?? team?.conference?.name ?? "Other";
        const teamData: TeamData = {
          id: String(team.id),
          name: team.displayName ?? team.name ?? "",
          abbr: team.abbreviation ?? "",
          logo: team.logos?.[0]?.href ?? team.logo,
          color: team.color ? `#${team.color}` : undefined,
          conference: confName,
          division: team.groups?.parent?.name ?? undefined,
        };
        
        if (!conferenceMap.has(confName)) {
          conferenceMap.set(confName, []);
        }
        conferenceMap.get(confName)!.push(teamData);
      }
      
      // Convert map to groups, sorted alphabetically
      Array.from(conferenceMap.entries()).forEach(([confName, confTeams]) => {
        const prefix = sport === "ncaaf" ? "FBS - " : sport === "ncaab" ? "" : "";
        groups.push({
          name: prefix + confName,
          teams: confTeams.sort((a: TeamData, b: TeamData) => a.name.localeCompare(b.name)),
        });
      });
    }
  }
  
  // Sort groups: major conferences first, then alphabetically
  const majorConferences = ["SEC", "Big Ten", "Big 12", "ACC", "Pac-12", "Big East", "American", "Mountain West"];
  
  return groups.sort((a, b) => {
    const aIsMajor = majorConferences.some(c => a.name.includes(c));
    const bIsMajor = majorConferences.some(c => b.name.includes(c));
    if (aIsMajor && !bIsMajor) return -1;
    if (!aIsMajor && bIsMajor) return 1;
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

export default function SportTeams() {
  const [match, params] = useRoute("/sport/:sport/teams");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);
  const isCollegeSport = sportKey === "ncaaf" || sportKey === "ncaab";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedConfs, setExpandedConfs] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        // Use backend proxy for teams
        // Group 80 = FBS for CFB, Group 50 = D1 for CBB
        let groupsParam = "";
        if (sportKey === "ncaaf") {
          groupsParam = "?groups=80";
        } else if (sportKey === "ncaab") {
          groupsParam = "?groups=50";
        }
        const res = await fetch(`/api/espn/teams/${sportKey}${groupsParam}`);
        if (!res.ok) throw new Error(`Failed to fetch teams (${res.status})`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load teams");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [sportKey]);

  const [q, setQ] = useState("");
  
  const conferenceGroups = useMemo(() => {
    if (isCollegeSport) {
      return normalizeTeamsWithGroups(data, sportKey);
    }
    // For pro sports, just show flat list
    const teams = normalizeTeamsFlat(data);
    return teams.length ? [{ name: "All Teams", teams }] : [];
  }, [data, sportKey, isCollegeSport]);

  const filteredGroups = useMemo(() => {
    const searchTerm = q.trim().toLowerCase();
    if (!searchTerm) return conferenceGroups;
    
    return conferenceGroups
      .map(g => ({
        ...g,
        teams: g.teams.filter(t => 
          `${t.name} ${t.abbr} ${t.conference}`.toLowerCase().includes(searchTerm)
        ),
      }))
      .filter(g => g.teams.length > 0);
  }, [conferenceGroups, q]);

  const totalTeams = useMemo(() => 
    filteredGroups.reduce((acc, g) => acc + g.teams.length, 0),
    [filteredGroups]
  );

  const toggleConf = (name: string) => {
    setExpandedConfs(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Auto-expand first 5 conferences
  useEffect(() => {
    if (conferenceGroups.length && expandedConfs.size === 0) {
      setExpandedConfs(new Set(conferenceGroups.slice(0, 5).map(g => g.name)));
    }
  }, [conferenceGroups]);

  if (!match || !cfg) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-10 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex items-center gap-3 text-white/80 text-sm font-bold uppercase tracking-widest">
            <span>The Chewth</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{cfg.label}</span>
          </div>
          <h1 className="mt-2 text-3xl md:text-5xl font-heading font-black text-white uppercase italic tracking-tighter">
            {cfg.label} <span className="text-primary">Teams</span>
          </h1>
          <p className="text-white/70 mt-2">
            {isCollegeSport 
              ? `All ${sportKey === "ncaaf" ? "FBS" : "Division I"} teams organized by conference.`
              : "Complete team directory."}
          </p>
        </div>
      </div>

      <SportSubnav sportKey={sportKey} />

      <div className="container px-4 md:px-6 py-8">
        <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-team-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${cfg.label} teams...`}
              className="pl-9"
            />
          </div>
          <Badge className="w-fit bg-secondary/10 text-muted-foreground border-border uppercase tracking-widest text-[10px] font-black rounded-sm" data-testid="badge-team-count">
            {totalTeams} teams • {filteredGroups.length} {isCollegeSport ? "conferences" : "groups"}
          </Badge>
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
              <Card key={i} className="h-20 animate-pulse bg-card border-border" data-testid={`skeleton-conf-${i}`} />
            ))}
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {filteredGroups.map((group) => {
              const isExpanded = expandedConfs.has(group.name);
              return (
                <Card key={group.name} className="bg-card border-border overflow-hidden" data-testid={`card-conference-${group.name}`}>
                  <button
                    onClick={() => toggleConf(group.name)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-heading uppercase tracking-wider font-bold">{group.name}</div>
                      <Badge className="bg-primary/10 text-primary text-[10px] font-bold">
                        {group.teams.length} teams
                      </Badge>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t border-border p-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {group.teams.map((t) => (
                          <Link
                            key={t.id}
                            href={`/sport/${sportKey}/team/${t.id}`}
                            className="block"
                            data-testid={`card-team-${t.id}`}
                          >
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/10 transition-all">
                              {t.logo ? (
                                <img src={t.logo} alt="" className="h-10 w-10 object-contain" data-testid={`img-team-${t.id}`} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-secondary/10" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-bold leading-tight truncate text-sm" data-testid={`text-team-${t.id}`}>{t.name}</div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold" data-testid={`text-teamabbr-${t.id}`}>{t.abbr}</div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
