export interface WeekEntry {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
}

/** Extract YYYY-MM-DD from ESPN ISO date so week value is unique per segment. */
export function isoToDateKey(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const OFF_SEASON_LABELS = ["off season", "offseason"];

export function parseCalendarWeeks(data: any): WeekEntry[] {
  const leagues = data?.leagues ?? [];
  const league = leagues[0];
  const calendar = league?.calendar ?? [];
  const weeks: WeekEntry[] = [];

  for (const season of calendar) {
    const seasonLabel = (season?.label ?? season?.alternateLabel ?? "").toLowerCase();
    if (OFF_SEASON_LABELS.some((l) => seasonLabel.includes(l))) continue;
    const entries = season?.entries ?? [];
    for (const entry of entries) {
      const startDate = entry?.startDate ?? "";
      const endDate = entry?.endDate ?? "";
      const value = isoToDateKey(startDate) || (entry?.value ?? String(weeks.length + 1));
      weeks.push({
        label: entry?.label ?? entry?.alternateLabel ?? `Week ${weeks.length + 1}`,
        value,
        startDate,
        endDate,
      });
    }
  }
  return weeks;
}

/** Season year for CFB: season starts in Aug/Sep, so Jan–July use previous year. Exported for calendar API. */
export function ncaafSeasonYear(): number {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  return month < 7 ? year - 1 : year;
}

/** Build a single WeekEntry with ISO start/end.
 *  ESPN defines weeks with a 7 AM UTC start and 6:59:59.999 AM UTC end. Using these 
 *  boundaries ensures late-night games (ending after midnight Eastern) are grouped 
 *  into the same week as ESPN's official calendar.
 */
function weekEntry(
  label: string,
  startY: number,
  startM: number,
  startD: number,
  endY: number,
  endM: number,
  endD: number
): WeekEntry {
  const startDate = `${startY}-${String(startM).padStart(2, "0")}-${String(startD).padStart(2, "0")}T07:00:00.000Z`;
  const endDate = `${endY}-${String(endM).padStart(2, "0")}-${String(endD).padStart(2, "0")}T06:59:59.999Z`;
  return {
    label,
    value: `${startY}-${String(startM).padStart(2, "0")}-${String(startD).padStart(2, "0")}`,
    startDate,
    endDate,
  };
}

/**
 * Fallback week list for NCAAF when ESPN returns an empty calendar.
 * Aligned with ESPN/CBS 2025-2026 FBS schedule:
 * - Week 0: Aug 23; Week 1: Aug 28–Sep 4; Weeks 2–14: Sep 5–Dec 4 (7-day blocks)
 * - Week 15 (Conf. Champ): Dec 1–7; Week 16: Dec 8–12
 * - Bowls: mid-Dec–early Jan; Semifinals; Championship Jan 19, 2026.
 */
export function getNcaafFallbackWeeks(seasonYear?: number): WeekEntry[] {
  const y = seasonYear ?? ncaafSeasonYear();
  const weeks: WeekEntry[] = [];

  // Week 0: Aug 23–27
  weeks.push(weekEntry("Week 0", y, 8, 23, y, 8, 27));

  // Week 1: Aug 28–Sep 4 (Week 1 through first Thursday of Sep)
  weeks.push(weekEntry("Week 1", y, 8, 28, y, 9, 4));

  // Weeks 2–14: 7-day blocks, no gaps — Sep 5–11 through Nov 28–Dec 4
  for (let i = 2; i <= 14; i++) {
    const start = new Date(Date.UTC(y, 8, 5)); // Sep 5
    start.setUTCDate(start.getUTCDate() + (i - 2) * 7);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    weeks.push(
      weekEntry(
        `Week ${i}`,
        start.getUTCFullYear(),
        start.getUTCMonth() + 1,
        start.getUTCDate(),
        end.getUTCFullYear(),
        end.getUTCMonth() + 1,
        end.getUTCDate()
      )
    );
  }

  // Week 15 (Conference Championship): Dec 1–7
  weeks.push(weekEntry("Week 15 (Conf. Champ)", y, 12, 1, y, 12, 7));

  // Week 16: Dec 8–12
  weeks.push(weekEntry("Week 16", y, 12, 8, y, 12, 12));

  // Postseason: Bowls (Dec 13–Jan 5), Semifinals (Jan 6–12), Championship (Jan 13–20)
  weeks.push(weekEntry("Bowls", y, 12, 13, y + 1, 1, 5));
  weeks.push(weekEntry("Semifinals", y + 1, 1, 6, y + 1, 1, 12));
  weeks.push(weekEntry("Championship", y + 1, 1, 13, y + 1, 1, 20));

  return weeks;
}

/** Format date as YYYYMMDD in UTC for ESPN API. */
export function formatUtcYyyyMmDd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Format date as YYYYMMDD in America/New_York for ESPN daily scoreboards. */
export function formatEtYyyyMmDd(d: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(d);
  const byType: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") byType[part.type] = part.value;
  }
  const y = byType.year ?? "";
  const m = byType.month ?? "";
  const day = byType.day ?? "";
  return `${y}${m}${day}`;
}
