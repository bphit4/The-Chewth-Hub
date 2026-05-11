import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Users, Calendar, BarChart3 } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { fetchDirectEspnApi } from "@/lib/espnDirect";
import { espnHeadshotPng } from "@/lib/espnImages";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

function normalizeTeamData(data: any) {
  const team = data?.team ?? data ?? {};
  return {
    id: team?.id,
    name: team?.displayName ?? team?.name ?? "",
    abbr: team?.abbreviation ?? "",
    logo: team?.logos?.[0]?.href ?? team?.logo,
    color: team?.color ? `#${team.color}` : undefined,
    record: team?.record?.items?.[0]?.summary ?? "",
    standingSummary: team?.standingSummary ?? "",
  };
}

function normalizeRoster(data: any, sportKey: EspnSportKey) {
  const athletes = data?.athletes ?? data?.team?.athletes ?? [];
  if (!Array.isArray(athletes)) return [];
  
  return athletes.flatMap((group: any) => {
    const items = group?.items ?? [group];
    return items.map((a: any) => ({
      id: a?.id ?? Math.random().toString(),
      name: a?.displayName ?? a?.fullName ?? "",
      position: a?.position?.abbreviation ?? a?.position ?? "",
      jersey: a?.jersey ?? "",
      headshot: a?.headshot?.href ?? a?.headshot ?? espnHeadshotPng(sportKey, a?.id),
      height: a?.height ?? a?.displayHeight,
      weight: a?.weight ?? a?.displayWeight,
      age: a?.age,
      experience: a?.experience?.years ?? a?.experience,
      birthPlace: a?.birthPlace?.city ?? a?.birthPlace?.state ?? a?.birthPlace?.country,
      college: a?.college?.name ?? a?.college,
    }));
  }).filter((p: any) => p.name);
}

function normalizeSchedule(scheduleData: any) {
  const events = scheduleData?.events ?? scheduleData?.team?.nextEvent ?? [];
  if (!Array.isArray(events)) return [];
  
  return events.slice(0, 15).map((e: any) => {
    const comp = e?.competitions?.[0] ?? e;
    const competitors = comp?.competitors ?? [];
    
    return {
      id: e?.id ?? Math.random().toString(),
      date: e?.date ?? comp?.date ?? "",
      name: e?.name ?? e?.shortName ?? "",
      homeTeam: competitors.find((c: any) => c.homeAway === "home")?.team?.displayName ?? "",
      awayTeam: competitors.find((c: any) => c.homeAway === "away")?.team?.displayName ?? "",
      homeLogo: competitors.find((c: any) => c.homeAway === "home")?.team?.logos?.[0]?.href,
      awayLogo: competitors.find((c: any) => c.homeAway === "away")?.team?.logos?.[0]?.href,
      status: e?.status?.type?.shortDetail ?? e?.status?.type?.description ?? "",
      homeScore: competitors.find((c: any) => c.homeAway === "home")?.score?.displayValue,
      awayScore: competitors.find((c: any) => c.homeAway === "away")?.score?.displayValue,
    };
  });
}

export default function TeamDetail() {
  const [match, params] = useRoute("/sport/:sport/team/:teamId");
  const sport = params?.sport;
  const teamId = params?.teamId;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);
  const [tab, setTab] = useState("roster");
  
  const [teamData, setTeamData] = useState<any>(null);
  const [rosterData, setRosterData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      if (!teamId) return;
      try {
        setLoading(true);
        setError(null);
        
        const [teamRes, rosterRes, scheduleRes] = await Promise.all([
          fetchDirectEspnApi(`/api/espn/team/${sportKey}/${teamId}?enable=stats`),
          fetchDirectEspnApi(`/api/espn/team/${sportKey}/${teamId}/roster`),
          fetchDirectEspnApi(`/api/espn/team/${sportKey}/${teamId}/schedule`),
        ]);
        
        if (mounted) {
          if (teamRes.ok) setTeamData(await teamRes.json());
          if (rosterRes.ok) setRosterData(await rosterRes.json());
          if (scheduleRes.ok) setScheduleData(await scheduleRes.json());
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load team data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    loadData();
    return () => { mounted = false; };
  }, [sportKey, teamId]);

  if (!match || !cfg) return null;

  const team = normalizeTeamData(teamData);
  const roster = normalizeRoster(rosterData, sportKey);
  const schedule = normalizeSchedule(scheduleData);
  const teamStats = teamData?.team?.record?.items?.[0]?.stats ?? [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-10 border-b border-white/10">
        <div className="container px-4 md:px-6">
          <Link href={`/sport/${sportKey}/teams`}>
            <Button variant="ghost" className="pl-0 gap-2 text-white hover:text-white" data-testid="button-back-teams">
              <ArrowLeft className="h-4 w-4" /> Back to Teams
            </Button>
          </Link>
          
          <div className="flex items-center gap-4 mt-4">
            {team.logo && (
              <img src={team.logo} alt="" className="h-16 w-16 object-contain" data-testid="img-team-logo" />
            )}
            <div>
              <h1 className="text-3xl md:text-5xl font-heading font-black text-white uppercase italic tracking-tighter" data-testid="text-team-name">
                {team.name || "Team Details"}
              </h1>
              {team.record && (
                <div className="text-white/70 mt-1" data-testid="text-team-record">{team.record}</div>
              )}
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

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3 max-w-md" data-testid="tabs-team">
            <TabsTrigger value="roster" className="gap-2" data-testid="tab-roster">
              <Users className="h-4 w-4" /> Roster
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2" data-testid="tab-schedule">
              <Calendar className="h-4 w-4" /> Schedule
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2" data-testid="tab-stats">
              <BarChart3 className="h-4 w-4" /> Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roster">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-heading uppercase tracking-wider">Team Roster</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-40 animate-pulse bg-secondary/5 rounded-xl" />
                ) : roster.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No roster data available.</div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {roster.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/5" data-testid={`player-${p.id}`}>
                        {p.headshot ? (
                          <img
                            src={p.headshot}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-sm">
                            {p.jersey || "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          {p.id ? (
                            <Link
                              href={`/sport/${sportKey}/athlete/${p.id}`}
                              className="font-bold text-sm truncate hover:underline block"
                            >
                              {p.name}
                            </Link>
                          ) : (
                            <div className="font-bold text-sm truncate">{p.name}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {p.position} {p.jersey && `#${p.jersey}`}
                          </div>
                          {(p.height || p.weight || p.age || p.experience || p.college) && (
                            <div className="text-[10px] text-muted-foreground">
                              {[
                                p.height && `HT ${p.height}`,
                                p.weight && `WT ${p.weight}`,
                                p.age != null && `Age ${p.age}`,
                                p.experience != null && `Exp ${p.experience}`,
                                p.college && p.college,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-heading uppercase tracking-wider">Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-40 animate-pulse bg-secondary/5 rounded-xl" />
                ) : schedule.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No schedule data available.</div>
                ) : (
                  <div className="space-y-3">
                    {schedule.map((g: any) => (
                      <div key={g.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/5" data-testid={`game-${g.id}`}>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            {g.awayLogo && <img src={g.awayLogo} alt="" className="h-6 w-6 object-contain" />}
                            <span className="text-sm font-medium truncate">{g.awayTeam}</span>
                            {g.awayScore && <span className="font-mono font-bold">{g.awayScore}</span>}
                          </div>
                          <span className="text-muted-foreground text-xs">@</span>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            {g.homeLogo && <img src={g.homeLogo} alt="" className="h-6 w-6 object-contain" />}
                            <span className="text-sm font-medium truncate">{g.homeTeam}</span>
                            {g.homeScore && <span className="font-mono font-bold">{g.homeScore}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">{g.status}</div>
                          <Badge className="bg-secondary/10 text-muted-foreground text-xs">{new Date(g.date).toLocaleDateString()}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-heading uppercase tracking-wider">Team Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-40 animate-pulse bg-secondary/5 rounded-xl" />
                ) : teamStats.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No team statistics available right now. View the{" "}
                    <Link href={`/sport/${sportKey}/stats`} className="text-primary underline">
                      league stats page
                    </Link>{" "}
                    for player leaderboards.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                          <th className="text-left py-2 px-3">Stat</th>
                          <th className="text-right py-2 px-3">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamStats.map((stat: any, idx: number) => (
                          <tr key={`${stat?.name ?? idx}`} className="border-b border-border/50 hover:bg-secondary/5">
                            <td className="py-2 px-3 font-medium">
                              {stat?.displayName ?? stat?.name ?? `Stat ${idx + 1}`}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {stat?.displayValue ?? (stat?.value != null ? String(stat.value) : "—")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
