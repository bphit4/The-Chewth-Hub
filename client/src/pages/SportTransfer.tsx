import { useRoute, Link } from "wouter";
import { useMemo, useState, useEffect } from "react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { ArrowRightLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

const ESPN_TRANSFER_PORTAL_URL = "https://www.espn.com/college-football/player/transferportal";
const TRANSFER_247_URL = "https://247sports.com/season/2026-football/transferportaltop/";

const YEARS = [2026, 2025, 2024];
const STATUS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "committed", label: "Committed" },
  { id: "enrolled", label: "Enrolled" },
  { id: "available", label: "Available" },
  { id: "withdrawn", label: "Withdrawn" },
];
const POSITION_OPTIONS = [
  { id: "all", label: "All" },
  { id: "QB", label: "Quarterback" },
  { id: "RB", label: "Running Back" },
  { id: "WR", label: "Receiver" },
  { id: "TE", label: "Tight End" },
  { id: "OT", label: "Offensive Tackle" },
  { id: "IOL", label: "Interior OL" },
  { id: "Edge", label: "Edge" },
  { id: "DL", label: "Defensive Line" },
  { id: "LB", label: "Linebacker" },
  { id: "CB", label: "Cornerback" },
  { id: "S", label: "Safety" },
  { id: "ATH", label: "ATH" },
  { id: "K", label: "Kicker" },
];
const CONFERENCES = [
  "All",
  "ACC",
  "AAC",
  "Big 12",
  "Big Ten",
  "C-USA",
  "IND",
  "MAC",
  "MWC",
  "Pac-12",
  "SEC",
  "Sun Belt",
];
const SORT_OPTIONS = [
  { id: "top", label: "Top" },
  { id: "latest", label: "Latest" },
  { id: "position", label: "Position" },
];

interface TransferPlayer {
  id: string;
  rank: number;
  name: string;
  position: string;
  heightWeight: string;
  rating: string;
  status: string;
  fromSchool: string;
  toSchool: string;
  year: number;
}

interface TransferTeamRank {
  rank: number;
  school: string;
  teamScore: string;
}

// Mock data matching 247 structure (replace with API when available)
const MOCK_PLAYERS: TransferPlayer[] = [
  { id: "1", rank: 1, name: "Sam Leavitt", position: "QB", heightWeight: "6-2 / 205", rating: "0.9800", status: "Committed", fromSchool: "Arizona State", toSchool: "LSU", year: 2026 },
  { id: "2", rank: 2, name: "Brendan Sorsby", position: "QB", heightWeight: "6-3 / 235", rating: "0.9800", status: "Committed", fromSchool: "Cincinnati", toSchool: "Texas Tech", year: 2026 },
  { id: "3", rank: 3, name: "Drew Mestemaker", position: "QB", heightWeight: "6-4 / 211", rating: "0.9800", status: "Enrolled", fromSchool: "North Texas", toSchool: "Oklahoma State", year: 2026 },
  { id: "4", rank: 4, name: "Jordan Seaton", position: "OT", heightWeight: "6-5 / 330", rating: "0.9800", status: "Committed", fromSchool: "Colorado", toSchool: "LSU", year: 2026 },
  { id: "5", rank: 5, name: "Princewill Umanmielen", position: "Edge", heightWeight: "6-5 / 245", rating: "0.9800", status: "Committed", fromSchool: "Ole Miss", toSchool: "LSU", year: 2026 },
  { id: "6", rank: 6, name: "Cam Coleman", position: "WR", heightWeight: "6-3 / 201", rating: "0.9800", status: "Committed", fromSchool: "Auburn", toSchool: "Texas", year: 2026 },
  { id: "7", rank: 7, name: "Chaz Coleman", position: "Edge", heightWeight: "6-4 / 246", rating: "0.9800", status: "Enrolled", fromSchool: "Penn State", toSchool: "Tennessee", year: 2026 },
  { id: "8", rank: 8, name: "Damon Wilson II", position: "Edge", heightWeight: "6-4 / 250", rating: "0.9600", status: "Committed", fromSchool: "Missouri", toSchool: "Miami", year: 2026 },
  { id: "9", rank: 9, name: "James Smith", position: "DL", heightWeight: "6-3 / 297", rating: "0.9600", status: "Committed", fromSchool: "Alabama", toSchool: "Ohio State", year: 2026 },
  { id: "10", rank: 10, name: "Mateen Ibirogba", position: "DL", heightWeight: "6-3 / 296", rating: "0.9600", status: "Committed", fromSchool: "Wake Forest", toSchool: "Texas Tech", year: 2026 },
];

const MOCK_TEAM_RANKINGS: TransferTeamRank[] = [
  { rank: 1, school: "LSU", teamScore: "98.45" },
  { rank: 2, school: "Ohio State", teamScore: "97.12" },
  { rank: 3, school: "Texas", teamScore: "96.88" },
  { rank: 4, school: "Oregon", teamScore: "95.20" },
  { rank: 5, school: "Miami", teamScore: "94.50" },
  { rank: 6, school: "Tennessee", teamScore: "93.75" },
  { rank: 7, school: "Penn State", teamScore: "92.30" },
  { rank: 8, school: "Notre Dame", teamScore: "91.80" },
  { rank: 9, school: "Texas A&M", teamScore: "90.45" },
  { rank: 10, school: "Georgia", teamScore: "89.90" },
];

export default function SportTransfer() {
  const [match, params] = useRoute("/sport/:sport/transfer");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "ncaaf";
  const cfg = getSportConfig(sportKey);

  const [year, setYear] = useState<string>("2026");
  const [conference, setConference] = useState<string>("All");
  const [status, setStatus] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("top");
  const [data, setData] = useState<{ players: TransferPlayer[]; teamRankings: TransferTeamRank[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sportKey !== "ncaaf") return;
    setLoading(true);
    // In production: fetch from API (e.g. /api/transfer-portal?year=2026)
    setTimeout(() => {
      setData({ players: MOCK_PLAYERS, teamRankings: MOCK_TEAM_RANKINGS });
      setLoading(false);
    }, 300);
  }, [sportKey, year]);

  const filteredAndSortedPlayers = useMemo(() => {
    if (!data?.players) return [];
    let list = [...data.players].filter((p) => {
      if (status !== "all" && p.status.toLowerCase() !== status) return false;
      if (position !== "all" && p.position !== position) return false;
      if (conference !== "All") {
        const inFrom = p.fromSchool.toUpperCase().includes(conference.toUpperCase()) || CONFERENCES.some((c) => c !== "All" && p.fromSchool.includes(c));
        const inTo = p.toSchool.toUpperCase().includes(conference.toUpperCase()) || CONFERENCES.some((c) => c !== "All" && p.toSchool.includes(c));
        if (!inFrom && !inTo) return false;
      }
      return true;
    });
    if (sortBy === "latest") list.sort((a, b) => b.rank - a.rank);
    else if (sortBy === "position") list.sort((a, b) => a.position.localeCompare(b.position) || a.rank - b.rank);
    else list.sort((a, b) => a.rank - b.rank);
    return list;
  }, [data?.players, status, position, conference, sortBy]);

  if (!match || !cfg) return null;

  if (sportKey !== "ncaaf") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <SportSubnav sportKey={sportKey} />
        <div className="border-b border-border/50 bg-card/50">
          <div className="container px-4 md:px-6 py-4">
            <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">Transfer Portal</h1>
          </div>
        </div>
        <div className="container px-4 md:px-6 py-8">
          <Card className="p-8 bg-card border-border text-center" data-testid="card-transfer-placeholder">
            <ArrowRightLeft className="h-16 w-16 mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Transfer portal is available for college football (NCAAF).</p>
            <Link href="/sport/ncaaf/transfer">
              <Button className="mt-4" variant="outline">Go to NCAAF Transfer Portal</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">Transfer Portal</h1>
        </div>
      </div>
      <div className="container px-4 md:px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <a href={TRANSFER_247_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
            <ExternalLink className="h-4 w-4" />
            View on 247Sports (live data)
          </a>
          <a href={ESPN_TRANSFER_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            ESPN Transfer Portal
          </a>
        </div>

        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="players" className="uppercase font-bold tracking-wider">Player Rankings</TabsTrigger>
            <TabsTrigger value="teams" className="uppercase font-bold tracking-wider">Team Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="space-y-4">
            <Card className="p-4 border-border">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Year</span>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-muted-foreground">School</span>
                  <Select value={conference} onValueChange={setConference}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONFERENCES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Status</span>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Position</span>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_OPTIONS.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Sort</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="border-border overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/30">
                      <TableHead className="w-12 font-bold uppercase text-[10px]">Rank</TableHead>
                      <TableHead className="font-bold uppercase text-[10px]">Pos</TableHead>
                      <TableHead className="font-bold uppercase text-[10px]">HT/WT</TableHead>
                      <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
                      <TableHead className="font-bold uppercase text-[10px]">From → To</TableHead>
                      <TableHead className="w-16 font-bold uppercase text-[10px] text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedPlayers.map((p) => (
                      <TableRow key={p.id} className="border-border/50 hover:bg-muted/20">
                        <TableCell className="font-mono font-bold">{p.rank}</TableCell>
                        <TableCell className="font-bold text-xs">{p.position}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{p.heightWeight}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("text-[10px]", p.status === "Committed" && "bg-primary/20 text-primary", p.status === "Enrolled" && "bg-green-500/20 text-green-700 dark:text-green-400")}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">{p.fromSchool}</span>
                          <span className="mx-1 text-muted-foreground">→</span>
                          <span className="font-bold">{p.toSchool}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{p.rating}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!loading && filteredAndSortedPlayers.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No players match filters.</div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card className="border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/30">
                    <TableHead className="w-16 font-bold uppercase text-[10px]">Rk</TableHead>
                    <TableHead className="font-bold uppercase text-[10px]">School</TableHead>
                    <TableHead className="w-24 font-bold uppercase text-[10px] text-right">Team Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.teamRankings ?? []).map((t) => (
                    <TableRow key={t.rank} className="border-border/50 hover:bg-muted/20">
                      <TableCell className="font-mono font-bold">{t.rank}</TableCell>
                      <TableCell className="font-bold">{t.school}</TableCell>
                      <TableCell className="text-right font-mono">{t.teamScore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!data?.teamRankings?.length && !loading && (
                <div className="p-8 text-center text-muted-foreground">No team rankings available.</div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground">
          <p>
            Transfer portal player and team data is modeled after <a href={TRANSFER_247_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">247Sports</a>. For live rankings, entries, and commitments, use the 247Sports link above. In-app data can be connected to an API or feed when available.
          </p>
        </div>
      </div>
    </div>
  );
}
