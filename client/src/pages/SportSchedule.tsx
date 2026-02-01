import { useMemo, useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { SportSubnav } from "@/components/sports/SportSubnav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPORTS, type EspnSportKey, getSportConfig } from "@/lib/espn";
import { getNcaafFallbackWeeks, ncaafSeasonYear, parseCalendarWeeks, formatUtcYyyyMmDd, formatEtYyyyMmDd, type WeekEntry } from "@/lib/espnCalendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MmaEventCard } from "@/components/mma/MmaEventCard";

const sportKeys = SPORTS.map((s) => s.key);
function isSportKey(v: any): v is EspnSportKey {
  return sportKeys.includes(v);
}

const ET = "America/New_York";
function formatEventDateTime(isoDate: string | undefined, useET: boolean): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (useET) {
    const weekday = d.toLocaleDateString("en-US", { timeZone: ET, weekday: "long" });
    const monthDay = d.toLocaleDateString("en-US", { timeZone: ET, month: "short", day: "numeric" });
    const time = d.toLocaleTimeString("en-US", { timeZone: ET, hour: "numeric", minute: "2-digit", hour12: true });
    return `${weekday}, ${monthDay}, ${time} ET`;
  }
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function formatMmaDate(isoDate: string | undefined): string {
  if (!isoDate) return "TBD";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMmaTime(isoDate: string | undefined): string {
  if (!isoDate) return "TBD";
  const d = new Date(isoDate);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function yyyymmddFromDateInput(v: string) {
  const clean = v?.trim();
  if (!clean) return null;
  const parts = clean.split("-");
  if (parts.length !== 3) return null;
  return `${parts[0]}${parts[1]}${parts[2]}`;
}

function formatEspnDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function formatInputDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toLocalDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildDateRange(start: Date, end: Date): string {
  return `${formatEspnDate(start)}-${formatEspnDate(end)}`;
}

async function findAdjacentGameDate(
  sportKey: EspnSportKey,
  startDate: Date,
  direction: "next" | "prev"
): Promise<Date | null> {
  const maxForward = 180;
  const maxBackward = 180;
  const step = 14;
  const base = toLocalDateOnly(startDate);

  const scan = async (forward: boolean) => {
    const max = forward ? maxForward : maxBackward;
    for (let offset = 1; offset <= max; offset += step) {
      const rangeStart = new Date(base);
      const rangeEnd = new Date(base);
      if (forward) {
        rangeStart.setDate(rangeStart.getDate() + offset);
        rangeEnd.setDate(rangeEnd.getDate() + Math.min(offset + step - 1, max));
      } else {
        rangeEnd.setDate(rangeEnd.getDate() - offset);
        rangeStart.setDate(rangeStart.getDate() - Math.min(offset + step - 1, max));
      }
      const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${buildDateRange(rangeStart, rangeEnd)}`);
      if (!res.ok) continue;
      const json = await res.json();
      const events = json?.events ?? [];
      if (!events.length) continue;
      const dates = events
        .map((e: any) => e?.date ? new Date(e.date) : null)
        .filter(Boolean) as Date[];
      dates.sort((a, b) => a.getTime() - b.getTime());
      const candidate = forward
        ? dates.find((d) => d.getTime() >= rangeStart.getTime())
        : dates.reverse().find((d) => d.getTime() <= rangeEnd.getTime());
      if (candidate) return toLocalDateOnly(candidate);
    }
    return null;
  };

  if (direction === "next") {
    return (await scan(true)) ?? (await scan(false));
  }
  return (await scan(false)) ?? (await scan(true));
}

async function findNextGameDate(sportKey: EspnSportKey, startDate: Date): Promise<Date | null> {
  const maxForward = 180;
  const maxBackward = 180;
  const step = 14;
  const base = toLocalDateOnly(startDate);

  for (let offset = 1; offset <= maxForward; offset += step) {
    const rangeStart = new Date(base);
    rangeStart.setDate(rangeStart.getDate() + offset);
    const rangeEnd = new Date(base);
    rangeEnd.setDate(rangeEnd.getDate() + Math.min(offset + step - 1, maxForward));
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${buildDateRange(rangeStart, rangeEnd)}`);
    if (!res.ok) continue;
    const json = await res.json();
    const events = json?.events ?? [];
    if (!events.length) continue;
    const nextEvent = events
      .map((e: any) => e?.date ? new Date(e.date) : null)
      .filter(Boolean)
      .sort((a: any, b: any) => a.getTime() - b.getTime())
      .find((d: Date) => d.getTime() >= rangeStart.getTime());
    if (nextEvent) return toLocalDateOnly(nextEvent);
  }

  for (let offset = 1; offset <= maxBackward; offset += step) {
    const rangeEnd = new Date(base);
    rangeEnd.setDate(rangeEnd.getDate() - offset);
    const rangeStart = new Date(base);
    rangeStart.setDate(rangeStart.getDate() - Math.min(offset + step - 1, maxBackward));
    const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${buildDateRange(rangeStart, rangeEnd)}`);
    if (!res.ok) continue;
    const json = await res.json();
    const events = json?.events ?? [];
    if (!events.length) continue;
    const prevEvent = events
      .map((e: any) => e?.date ? new Date(e.date) : null)
      .filter(Boolean)
      .sort((a: any, b: any) => b.getTime() - a.getTime())
      .find((d: Date) => d.getTime() <= rangeEnd.getTime());
    if (prevEvent) return toLocalDateOnly(prevEvent);
  }

  return null;
}

interface ScheduleEvent {
  id: string;
  name: string;
  date: string;
  status: string;
  state: string;
  home: { name: string; abbr: string; logo?: string; score?: string; rank?: number };
  away: { name: string; abbr: string; logo?: string; score?: string; rank?: number };
}

interface ConferenceGroup {
  id: string;
  name: string;
  abbreviation?: string;
  abbr?: string;
}

const CFB_FILTERS = [
  { id: "top25", label: "Top 25" },
  { id: "fbs", label: "All FBS" },
  { id: "fcs", label: "All FCS" },
];

const CBB_FILTERS = [
  { id: "top25", label: "Top 25" },
  { id: "d1", label: "All Division I" },
];

const MAJOR_CFB_CONFERENCES = [
  { id: "1", name: "ACC", abbr: "ACC" },
  { id: "4", name: "Big 12", abbr: "Big 12" },
  { id: "5", name: "Big Ten", abbr: "Big Ten" },
  { id: "9", name: "Pac-12", abbr: "Pac-12" },
  { id: "8", name: "SEC", abbr: "SEC" },
  { id: "151", name: "American", abbr: "AAC" },
  { id: "12", name: "Conference USA", abbr: "CUSA" },
  { id: "15", name: "Mid-American", abbr: "MAC" },
  { id: "17", name: "Mountain West", abbr: "MWC" },
  { id: "37", name: "Sun Belt", abbr: "Sun Belt" },
];

const MAJOR_CBB_CONFERENCES = [
  { id: "2", name: "ACC", abbr: "ACC" },
  { id: "7", name: "Atlantic 10", abbr: "A-10" },
  { id: "8", name: "Big 12", abbr: "Big 12" },
  { id: "3", name: "Big East", abbr: "Big East" },
  { id: "4", name: "Big Ten", abbr: "Big Ten" },
  { id: "21", name: "Pac-12", abbr: "Pac-12" },
  { id: "23", name: "SEC", abbr: "SEC" },
  { id: "62", name: "American", abbr: "AAC" },
  { id: "11", name: "Conference USA", abbr: "CUSA" },
  { id: "16", name: "Mountain West", abbr: "MWC" },
];

/** MMA: scoreboard events → list of { id, name, date, status, venue, location, broadcast, fights } for schedule cards. */
function normalizeMmaEvents(data: any): Array<{
  id: string;
  name: string;
  date: string;
  status: string;
  venue?: string;
  location?: string;
  broadcast?: string;
  fights: Array<{ id: string; weightClass?: string; fighters: Array<{ name?: string }> }>;
}> {
  const events = data?.events ?? [];
  if (!Array.isArray(events)) return [];
  return events.map((e: any) => {
    const comps = e?.competitions ?? [];
    const venue = e?.venue?.fullName ?? e?.venue?.name;
    const location = [e?.venue?.address?.city, e?.venue?.address?.state, e?.venue?.address?.country].filter(Boolean).join(", ");
    const broadcast = e?.broadcasts?.[0]?.names?.join(", ") ?? e?.broadcasts?.[0]?.shortName;
    const fights = comps.map((c: any) => {
      const competitors = c?.competitors ?? [];
      const ordered = [...competitors].sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
      const away = ordered[0];
      const home = ordered[1];
      return {
        id: String(c?.id ?? ""),
        weightClass: c?.type?.abbreviation ?? c?.type?.displayName,
        fighters: [
          { name: away?.athlete?.displayName ?? away?.athlete?.shortName },
          { name: home?.athlete?.displayName ?? home?.athlete?.shortName },
        ],
      };
    });
    return {
      id: String(e?.id ?? ""),
      name: e?.name ?? "",
      date: e?.date ?? "",
      status: e?.status?.type?.shortDetail ?? e?.status?.type?.description ?? "",
      venue,
      location,
      broadcast,
      fights,
    };
  });
}

function normalizeEvents(data: any): ScheduleEvent[] {
  const events = data?.events ?? [];
  return events.map((e: any) => {
    const comp = e?.competitions?.[0];
    const comps = comp?.competitors ?? [];
    let home = comps.find((c: any) => c.homeAway === "home");
    let away = comps.find((c: any) => c.homeAway === "away");
    if ((!home || !away) && comps.length >= 2) {
      const ordered = [...comps].sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
      away = away ?? ordered[0];
      home = home ?? ordered[1];
    }
    const isMma = (e?.competitions?.[0]?.type?.abbreviation || "").length > 0 && !home?.team;

    return {
      id: String(e?.id ?? ""),
      name: e?.name ?? "",
      date: e?.date ?? "",
      status: e?.status?.type?.shortDetail ?? "",
      state: e?.status?.type?.state ?? "",
      home: {
        name: isMma ? (home?.athlete?.displayName ?? "Home") : (home?.team?.displayName ?? "Home"),
        abbr: isMma ? (home?.athlete?.shortName ?? "HOME") : (home?.team?.abbreviation ?? "HOME"),
        logo: isMma ? (home?.athlete?.headshot?.href || home?.athlete?.flag?.href) : (home?.team?.logo ?? home?.team?.logos?.[0]?.href),
        score: home?.score,
        rank: home?.curatedRank?.current && home.curatedRank.current <= 25 ? home.curatedRank.current : undefined,
      },
      away: {
        name: isMma ? (away?.athlete?.displayName ?? "Away") : (away?.team?.displayName ?? "Away"),
        abbr: isMma ? (away?.athlete?.shortName ?? "AWAY") : (away?.team?.abbreviation ?? "AWAY"),
        logo: isMma ? (away?.athlete?.headshot?.href || away?.athlete?.flag?.href) : (away?.team?.logo ?? away?.team?.logos?.[0]?.href),
        score: away?.score,
        rank: away?.curatedRank?.current && away.curatedRank.current <= 25 ? away.curatedRank.current : undefined,
      },
    };
  });
}

export default function SportSchedule() {
  const [match, params] = useRoute("/sport/:sport/schedule");
  const sport = params?.sport;
  const sportKey: EspnSportKey = isSportKey(sport) ? sport : "nfl";
  const cfg = getSportConfig(sportKey);
  const isWeekBasedSport = sportKey === "nfl" || sportKey === "ncaaf";
  const isCollegeSport = sportKey === "ncaaf" || sportKey === "ncaab";
  const isMma = sportKey === "ufc";
  const weekScrollRef = useRef<HTMLDivElement>(null);

  const [date, setDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [weeks, setWeeks] = useState<WeekEntry[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState(() => (sportKey === "ncaab" ? "d1" : "all"));
  const [conferences, setConferences] = useState<ConferenceGroup[]>([]);
  const autoDateSearchRef = useRef<string>("");
  const arrowNavRef = useRef(false);

  useEffect(() => {
    if (sportKey === "ncaab") {
      setFilter("d1");
    } else {
      setFilter("all");
    }
  }, [sportKey]);

  const dates = useMemo(() => yyyymmddFromDateInput(date), [date]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mmaSchedule, setMmaSchedule] = useState<any>(null);
  const [mmaScheduleLoading, setMmaScheduleLoading] = useState(false);
  const [mmaScheduleError, setMmaScheduleError] = useState<string | null>(null);

  useEffect(() => {
    if (!isMma) return;
    let mounted = true;
    async function loadMmaSchedule() {
      try {
        setMmaScheduleLoading(true);
        setMmaScheduleError(null);
        const res = await fetch(`/api/espn/mma/schedule`);
        if (!res.ok) throw new Error(`Failed to fetch MMA schedule (${res.status})`);
        const json = await res.json();
        if (mounted) setMmaSchedule(json);
      } catch (e: any) {
        if (mounted) setMmaScheduleError(e?.message ?? "Failed to load MMA schedule");
      } finally {
        if (mounted) setMmaScheduleLoading(false);
      }
    }
    loadMmaSchedule();
    return () => { mounted = false; };
  }, [isMma]);

  // Load calendar for NFL/NCAAF week-based schedule; NCAAF always has fallback weeks if API fails
  useEffect(() => {
    if (!isWeekBasedSport) return;
    let mounted = true;
    async function loadCalendar() {
      try {
        const yearParam = sportKey === "ncaaf" ? `?year=${ncaafSeasonYear()}` : "";
        const res = await fetch(`/api/espn/calendar/${sportKey}${yearParam}`);
        let parsed: WeekEntry[] = [];
        if (res.ok) {
          const json = await res.json();
          parsed = parseCalendarWeeks(json);
        }
        if (sportKey === "ncaaf" && parsed.length === 0) parsed = getNcaafFallbackWeeks();
        if (parsed.length === 0 || !mounted) return;
        setWeeks(parsed);
        const today = new Date();
        const current = parsed.find((w) => {
          const start = new Date(w.startDate);
          const end = new Date(w.endDate);
          return today >= start && today <= end;
        });
        if (current) {
          setSelectedWeek(current.value);
          setSelectedDate(new Date(current.startDate));
          setSelectedEndDate(new Date(current.endDate));
        } else {
          const nextWeek = parsed.find((w) => new Date(w.startDate) > today);
          const fallbackWeek = nextWeek ?? parsed[parsed.length - 1];
          setSelectedWeek(fallbackWeek.value);
          setSelectedDate(new Date(fallbackWeek.startDate));
          setSelectedEndDate(new Date(fallbackWeek.endDate));
        }
      } catch {
        if (sportKey === "ncaaf" && mounted) {
          const fallback = getNcaafFallbackWeeks();
          setWeeks(fallback);
          const today = new Date();
          const current = fallback.find((w) => {
            const start = new Date(w.startDate);
            const end = new Date(w.endDate);
            return today >= start && today <= end;
          });
          const week = current ?? fallback[fallback.length - 1];
          setSelectedWeek(week.value);
          setSelectedDate(new Date(week.startDate));
          setSelectedEndDate(new Date(week.endDate));
        }
      }
    }
    loadCalendar();
    return () => { mounted = false; };
  }, [sportKey, isWeekBasedSport]);

  // Fetch schedule: MMA only when sport is UFC (fully separate from NFL/NCAAF/other)
  useEffect(() => {
    if (sportKey === "ufc" && dates) {
      let mounted = true;
      async function loadMmaByDate() {
        try {
          setLoading(true);
          setError(null);
          const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dates}`);
          if (!res.ok) throw new Error(`Failed to fetch MMA schedule (${res.status})`);
          const json = await res.json();
          const events = json?.events ?? [];
          if (mounted) setData({ ...json, events });
        } catch (e: any) {
          if (mounted) setError(e?.message ?? "Failed to load schedule");
        } finally {
          if (mounted) setLoading(false);
        }
      }
      loadMmaByDate();
      return () => { mounted = false; };
    }
    if (sportKey === "ufc") {
      setLoading(false);
      setData(null);
      return;
    }
    if (isWeekBasedSport && (!selectedDate || !selectedEndDate)) {
      setLoading(true);
      return;
    }
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (isWeekBasedSport && selectedDate && selectedEndDate) {
          const startStr = formatUtcYyyyMmDd(selectedDate);
          const endStr = formatUtcYyyyMmDd(selectedEndDate);
          const selectedWeekEntry = weeks.find((w) => w.value === selectedWeek);
          const isCFPWeek = sportKey === "ncaaf" && selectedWeekEntry?.label && /CFP|BOWL|Playoff|Postseason|Semifinals|Championship/i.test(selectedWeekEntry.label);
          const seasonParam = isCFPWeek ? "&seasontype=3" : "";
          let groupParam = "";
          if (sportKey === "ncaaf" && filter !== "all") {
            if (filter === "fbs") groupParam = "&groups=80";
            else if (filter === "fcs") groupParam = "&groups=81";
            else if (filter.startsWith("conf-")) {
              const confId = filter.replace("conf-", "");
              groupParam = `&groups=${confId}`;
            }
          }
          const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${startStr}-${endStr}${groupParam}${seasonParam}`);
          if (!res.ok) throw new Error(`Failed to fetch schedule (${res.status})`);
          const json = await res.json();
          const weekEndMs = selectedEndDate.getTime();
          const events = (json?.events ?? []).filter((e: any) => {
            const t = e?.date ? new Date(e.date).getTime() : 0;
            return t <= weekEndMs;
          });
          const filtered = filter === "top25"
            ? events.filter((e: any) => {
                const competitors = e?.competitions?.[0]?.competitors ?? [];
                return competitors.some((c: any) => {
                  const rank = c?.curatedRank?.current ?? c?.rank;
                  return rank && rank <= 25;
                });
              })
            : events;
          if (mounted) setData({ ...json, events: filtered });
        } else if (!isWeekBasedSport && dates) {
          let groupParam = "";
          if (isCollegeSport) {
            if (filter === "fbs") groupParam = "&groups=80";
            else if (filter === "fcs") groupParam = "&groups=81";
            else if (filter === "d1") groupParam = "&groups=50";
            else if (filter === "all" && sportKey === "ncaab") groupParam = "&groups=50";
            else if (filter.startsWith("conf-")) {
              const confId = filter.replace("conf-", "");
              groupParam = `&groups=${confId}`;
            }
          }
          const res = await fetch(`/api/espn/scoreboard/${sportKey}?dates=${dates}${groupParam}`);
          if (!res.ok) throw new Error(`Failed to fetch schedule (${res.status})`);
          const json = await res.json();
          const events = json?.events ?? [];
          const filtered = filter === "top25"
            ? events.filter((e: any) => {
                const competitors = e?.competitions?.[0]?.competitors ?? [];
                return competitors.some((c: any) => {
                  const rank = c?.curatedRank?.current ?? c?.rank;
                  return rank && rank <= 25;
                });
              })
            : events;
          if (mounted) setData({ ...json, events: filtered });
        } else {
          if (mounted) setData(null);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load schedule");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 2 * 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, [sportKey, isWeekBasedSport, isMma, dates, selectedDate?.getTime(), selectedEndDate?.getTime(), filter, isCollegeSport, selectedWeek, weeks]);

  const events = useMemo(() => normalizeEvents(data), [data]);
  const mmaEvents = useMemo(() => (isMma ? normalizeMmaEvents(data) : []), [data, isMma]);
  const eventCount = isMma ? mmaEvents.length : events.length;
  const mmaScheduleEvents = useMemo(
    () => (Array.isArray(mmaSchedule?.events) ? mmaSchedule.events : []),
    [mmaSchedule]
  );
  const mmaThisWeek = useMemo(() => {
    if (!mmaScheduleEvents.length) return [];
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return mmaScheduleEvents.filter((e: any) => {
      if (!e?.date) return false;
      const d = new Date(e.date);
      return d >= now && d <= weekEnd;
    });
  }, [mmaScheduleEvents]);
  const mmaUpcoming = useMemo(() => {
    if (!mmaScheduleEvents.length) return [];
    const now = new Date();
    return mmaScheduleEvents.filter((e: any) => {
      if (!e?.date) return false;
      return new Date(e.date) > now;
    });
  }, [mmaScheduleEvents]);
  const mmaUpcomingLater = useMemo(() => {
    if (!mmaUpcoming.length) return [];
    const thisWeekIds = new Set(mmaThisWeek.map((e: any) => String(e.id)));
    return mmaUpcoming.filter((e: any) => !thisWeekIds.has(String(e.id)));
  }, [mmaUpcoming, mmaThisWeek]);

  useEffect(() => {
    if (!isCollegeSport) {
      setConferences([]);
      return;
    }
    let mounted = true;
    async function loadConferences() {
      try {
        const res = await fetch(`/api/espn/groups/${sportKey}`);
        if (res.ok) {
          const json = await res.json();
          const groups = json?.groups ?? json?.children ?? [];
          const confList = groups.map((g: any) => ({
            id: String(g?.id ?? ""),
            name: g?.name ?? g?.displayName ?? "",
            abbreviation: g?.abbreviation ?? g?.shortName ?? "",
          })).filter((c: ConferenceGroup) => c.id && c.name);
          if (mounted) setConferences(confList);
        }
      } catch {
        if (mounted) setConferences([]);
      }
    }
    loadConferences();
    return () => { mounted = false; };
  }, [sportKey, isCollegeSport]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);
  // Default date for date-based sports: if today has no games, show next date with games (or last date with games)
  useEffect(() => {
    if (isWeekBasedSport || loading || eventCount > 0 || date !== todayStr) return;
    if (autoDateSearchRef.current === date) return;
    autoDateSearchRef.current = date;
    let active = true;
    (async () => {
      const next = await findNextGameDate(sportKey, new Date(date));
      if (active && next) setDate(formatInputDate(next));
    })();
    return () => { active = false; };
  }, [isWeekBasedSport, loading, eventCount, date, todayStr, sportKey]);

  // Use US Eastern for week-based (NFL/NCAAF) so game days match ESPN (e.g. Thursday 8:20 PM ET = Thursday, not Wednesday)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    const useET = isWeekBasedSport;
    for (const e of events) {
      if (!e.date) continue;
      const d = new Date(e.date);
      const key = useET
        ? d.toLocaleDateString("en-CA", { timeZone: ET })
        : format(d, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((key) => ({
      dateKey: key,
      dateLabel: useET
        ? new Date(key + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: ET, weekday: "long", year: "numeric", month: "long", day: "numeric" })
        : format(new Date(key), "EEEE, MMMM d, yyyy"),
      events: map.get(key)!,
    }));
  }, [events, isWeekBasedSport]);

  const handleWeekChange = (weekValue: string) => {
    const week = weeks.find((w) => w.value === weekValue);
    if (week?.startDate) {
      setSelectedWeek(weekValue);
      setSelectedDate(new Date(week.startDate));
      setSelectedEndDate(week.endDate ? new Date(week.endDate) : null);
    }
  };

  if (!match || !cfg) return null;

  const filterOptions = useMemo(() => {
    if (sportKey === "ncaaf") {
      const opts = [...CFB_FILTERS];
      const confs = conferences.length > 0 ? conferences : MAJOR_CFB_CONFERENCES;
      confs.forEach((c: any) => {
        opts.push({ id: `conf-${c.id}`, label: c.abbreviation || c.abbr || c.name });
      });
      return opts;
    }
    if (sportKey === "ncaab") {
      const opts = [...CBB_FILTERS];
      const confs = conferences.length > 0 ? conferences : MAJOR_CBB_CONFERENCES;
      confs.forEach((c: any) => {
        opts.push({ id: `conf-${c.id}`, label: c.abbreviation || c.abbr || c.name });
      });
      return opts;
    }
    return [];
  }, [sportKey, conferences]);

  if (isMma) {
    const mmaYear = mmaSchedule?.year ?? new Date().getFullYear();
    return (
      <div className="min-h-screen bg-background pb-20">
        <SportSubnav sportKey={sportKey} />
        <div className="border-b border-border/50 bg-card/50">
          <div className="container px-4 md:px-6 py-4">
            <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">
              {cfg.label} Schedule - {mmaYear}
            </h1>
          </div>
        </div>

        <div className="container px-4 md:px-6 py-8 space-y-6">
          {mmaScheduleError && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-destructive font-bold">
                <AlertCircle className="h-4 w-4" /> {mmaScheduleError}
              </div>
            </div>
          )}

          {mmaScheduleLoading && (
            <Card className="h-40 animate-pulse bg-card border-border" />
          )}

          {!mmaScheduleLoading && mmaScheduleEvents.length === 0 && (
            <Card className="p-6 bg-card border-border">
              <div className="text-sm text-muted-foreground">No MMA events found for this season.</div>
            </Card>
          )}

          {!mmaScheduleLoading && mmaScheduleEvents.length > 0 && (
            <>
              <Card className="bg-card border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border font-heading uppercase tracking-wider font-bold">
                  This Week&apos;s Events
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                        <th className="text-left px-5 py-3">Date</th>
                        <th className="text-left px-5 py-3">Time</th>
                        <th className="text-left px-5 py-3">Event</th>
                        <th className="text-left px-5 py-3">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mmaThisWeek.length === 0 && (
                        <tr className="border-b border-border/50">
                          <td className="px-5 py-4 text-sm text-muted-foreground" colSpan={4}>
                            No events scheduled this week.
                          </td>
                        </tr>
                      )}
                      {mmaThisWeek.map((e: any) => {
                        const location = [e?.venue?.city, e?.venue?.state, e?.venue?.country].filter(Boolean).join(", ");
                        return (
                          <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/5 transition-colors">
                            <td className="px-5 py-3 font-mono">{formatMmaDate(e.date)}</td>
                            <td className="px-5 py-3 font-mono">{formatMmaTime(e.date)}</td>
                            <td className="px-5 py-3">
                              <Link href={`/sport/${sportKey}/game/${e.id}`} className="font-semibold hover:text-primary">
                                {e.name || "Event"}
                              </Link>
                            </td>
                            <td className="px-5 py-3 text-sm text-muted-foreground">
                              {e?.venue?.name ? `${e.venue.name}${location ? ` • ${location}` : ""}` : location || "TBD"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="bg-card border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border font-heading uppercase tracking-wider font-bold">
                  Scheduled Events
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                        <th className="text-left px-5 py-3">Date</th>
                        <th className="text-left px-5 py-3">Time</th>
                        <th className="text-left px-5 py-3">Event</th>
                        <th className="text-left px-5 py-3">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mmaUpcomingLater.length === 0 && (
                        <tr className="border-b border-border/50">
                          <td className="px-5 py-4 text-sm text-muted-foreground" colSpan={4}>
                            No future events scheduled.
                          </td>
                        </tr>
                      )}
                      {mmaUpcomingLater.map((e: any) => {
                        const location = [e?.venue?.city, e?.venue?.state, e?.venue?.country].filter(Boolean).join(", ");
                        return (
                          <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/5 transition-colors">
                            <td className="px-5 py-3 font-mono">{formatMmaDate(e.date)}</td>
                            <td className="px-5 py-3 font-mono">{formatMmaTime(e.date)}</td>
                            <td className="px-5 py-3">
                              <Link href={`/sport/${sportKey}/game/${e.id}`} className="font-semibold hover:text-primary">
                                {e.name || "Event"}
                              </Link>
                            </td>
                            <td className="px-5 py-3 text-sm text-muted-foreground">
                              {e?.venue?.name ? `${e.venue.name}${location ? ` • ${location}` : ""}` : location || "TBD"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <SportSubnav sportKey={sportKey} />
      
      {/* Page Title */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-heading font-black uppercase tracking-tight">
            {cfg.label} Schedule
          </h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        {isCollegeSport && filterOptions.length > 0 && (
          <div className="mb-4 flex justify-end">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px] uppercase font-bold tracking-wider" data-testid="select-schedule-filter">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="uppercase font-bold">All Games</SelectItem>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} className="uppercase font-bold">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Week navigation for NFL/NCAAF */}
        {isWeekBasedSport && weeks.length > 0 && (
          <div className="mb-6 border-b border-border bg-card">
            <div className="flex items-center gap-2 py-3 overflow-x-auto">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => weekScrollRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div ref={weekScrollRef} className="flex gap-1 flex-1 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
                {weeks.map((w, idx) => (
                  <Button
                    key={`${idx}-${w.value}`}
                    variant={selectedWeek === w.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleWeekChange(w.value)}
                    className={cn(
                      "shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-wider",
                      selectedWeek === w.value ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                    )}
                  >
                    {w.label}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => weekScrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Date picker for non-week-based sports */}
        {!isWeekBasedSport && (
          <div className="mb-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  if (arrowNavRef.current) return;
                  arrowNavRef.current = true;
                  try {
                    const target = await findAdjacentGameDate(sportKey, new Date(date), "prev");
                    if (target) setDate(formatInputDate(target));
                  } finally {
                    arrowNavRef.current = false;
                  }
                }}
                data-testid="button-schedule-prev"
                className="shrink-0 hover:bg-primary/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                data-testid="input-schedule-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-[180px] shrink-0"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  if (arrowNavRef.current) return;
                  arrowNavRef.current = true;
                  try {
                    const target = await findAdjacentGameDate(sportKey, new Date(date), "next");
                    if (target) setDate(formatInputDate(target));
                  } finally {
                    arrowNavRef.current = false;
                  }
                }}
                data-testid="button-schedule-next"
                className="shrink-0 hover:bg-primary/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
                }}
                data-testid="button-schedule-today"
                className="shrink-0 ml-1 uppercase font-bold tracking-wider text-xs text-primary hover:text-primary/80"
              >
                Today
              </Button>
            </div>
            <Link href={`/sport/${sportKey}/scores`} data-testid="link-schedule-scores">
              <Button data-testid="button-schedule-scores" size="sm" variant="outline" className="uppercase font-bold tracking-wider">
                View Scores
              </Button>
            </Link>
          </div>
        )}

        {isWeekBasedSport && (
          <div className="mb-4 flex justify-end">
            <Link href={`/sport/${sportKey}/scores`}>
              <Button size="sm" variant="outline" className="uppercase font-bold tracking-wider">
                View Scores
              </Button>
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-destructive font-bold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          </div>
        )}

        {loading && !data && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(6).fill(0).map((_, idx) => (
              <Card key={idx} className="h-32 animate-pulse bg-card border-border" data-testid={`skeleton-event-${idx}`} />
            ))}
          </div>
        )}

        {/* Week-based: group by date (ESPN-style) */}
        {!loading && isWeekBasedSport && eventsByDate.length > 0 && (
          <div className="space-y-8">
            {eventsByDate.map(({ dateKey, dateLabel, events: dayEvents }) => (
              <div key={dateKey}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">{dateLabel}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dayEvents.map((e) => (
                    <Link key={e.id} href={`/sport/${sportKey}/game/${e.id}`} className="block group" data-testid={`card-schedule-event-${e.id}`}>
                      <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-border transition-all overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-2 bg-muted/30 border-b border-border/40">
                          <Badge variant="secondary" className="rounded text-[10px] font-bold px-2 py-0.5 bg-transparent text-muted-foreground">
                            {e.status}
                          </Badge>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {e.away.logo ? <img src={e.away.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted" />}
                              <div className="flex items-center gap-2">
                                {e.away.rank && <span className="text-xs text-muted-foreground font-bold">{e.away.rank}</span>}
                                <span className="font-bold text-sm">{e.away.name}</span>
                              </div>
                            </div>
                            <div className="font-mono text-lg font-black">{e.away.score ?? "—"}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {e.home.logo ? <img src={e.home.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted" />}
                              <div className="flex items-center gap-2">
                                {e.home.rank && <span className="text-xs text-muted-foreground font-bold">{e.home.rank}</span>}
                                <span className="font-bold text-sm">{e.home.name}</span>
                              </div>
                            </div>
                            <div className="font-mono text-lg font-black">{e.home.score ?? "—"}</div>
                          </div>
                        </div>
                        <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex justify-between items-center">
                          <span className="text-xs text-muted-foreground shrink-0">{formatEventDateTime(e.date, true)}</span>
                          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors shrink-0">Details →</span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MMA schedule: event cards with fight card preview */}
        {!loading && !isWeekBasedSport && isMma && mmaEvents.length > 0 && (
          <div className="space-y-4">
            {mmaEvents.map((e) => (
              <Link key={e.id} href={`/sport/${sportKey}/game/${e.id}`} className="block group" data-testid={`card-schedule-event-${e.id}`}>
                <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-border transition-all overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-2 bg-muted/30 border-b border-border/40">
                    <Badge variant="secondary" className="rounded text-[10px] font-bold px-2 py-0.5 bg-transparent text-muted-foreground">
                      {e.status || "Scheduled"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatEventDateTime(e.date, false)}</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="font-bold text-lg">{e.name}</div>
                    {e.venue && (
                      <div className="text-xs text-muted-foreground">
                        {e.venue}{e.location ? ` • ${e.location}` : ""}
                      </div>
                    )}
                    {e.broadcast && (
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">TV: {e.broadcast}</div>
                    )}
                    <div className="pt-3 border-t border-border/50">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Fight Card</div>
                      <div className="space-y-2">
                        {e.fights.slice(0, 6).map((f) => (
                          <div key={f.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{f.fighters[0]?.name || "TBD"}</span>
                              <span className="text-muted-foreground text-xs">vs</span>
                              <span className="font-semibold">{f.fighters[1]?.name || "TBD"}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{f.weightClass || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors shrink-0">Fightcenter →</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Non-week-based: flat grid */}
        {!loading && !isWeekBasedSport && !isMma && events.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Link key={e.id} href={`/sport/${sportKey}/game/${e.id}`} className="block group" data-testid={`card-schedule-event-${e.id}`}>
                <Card className="bg-card hover:bg-accent/5 border border-border/60 hover:border-border transition-all overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-2 bg-muted/30 border-b border-border/40">
                    <Badge variant="secondary" className="rounded text-[10px] font-bold px-2 py-0.5 bg-transparent text-muted-foreground">{e.status}</Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {e.away.logo ? <img src={e.away.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted" />}
                        <div className="flex items-center gap-2">
                          {e.away.rank && <span className="text-xs text-muted-foreground font-bold">{e.away.rank}</span>}
                          <span className="font-bold text-sm">{e.away.name}</span>
                        </div>
                      </div>
                      <div className="font-mono text-lg font-black">{e.away.score ?? "—"}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {e.home.logo ? <img src={e.home.logo} alt="" className="h-6 w-6 object-contain" /> : <div className="h-6 w-6 rounded bg-muted" />}
                        <div className="flex items-center gap-2">
                          {e.home.rank && <span className="text-xs text-muted-foreground font-bold">{e.home.rank}</span>}
                          <span className="font-bold text-sm">{e.home.name}</span>
                        </div>
                      </div>
                      <div className="font-mono text-lg font-black">{e.home.score ?? "—"}</div>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground shrink-0">{formatEventDateTime(e.date, false)}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors shrink-0">Details →</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!loading && !isMma && !events.length && (
          <Card className="p-6 bg-card border-border" data-testid="empty-schedule">
            <div className="text-sm text-muted-foreground">
              {isWeekBasedSport ? "No games for this week." : "No events found for that date."}
            </div>
          </Card>
        )}

        {!loading && isMma && mmaEvents.length === 0 && (
          <Card className="p-6 bg-card border-border" data-testid="empty-schedule-mma">
            <div className="text-sm text-muted-foreground">No fight cards found for that date.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
