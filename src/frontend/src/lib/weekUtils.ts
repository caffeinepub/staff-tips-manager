/**
 * ISO 8601 week utilities. Weeks start on Monday.
 */

export function getISOWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { year: d.getUTCFullYear(), week };
}

export function getISOWeekKey(date: Date): string {
  const { year, week } = getISOWeekNumber(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function getWeekDates(weekKey: string): Date[] {
  const [yearStr, weekPart] = weekKey.split("-W");
  const year = Number.parseInt(yearStr, 10);
  const week = Number.parseInt(weekPart, 10);
  // Jan 4 is always in week 1 of the ISO year
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1) + (week - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d;
  });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatDateRange(weekKey: string): string {
  const dates = getWeekDates(weekKey);
  const mon = dates[0].toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const sun = dates[6].toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${mon} – ${sun}`;
}

export function navigateWeek(weekKey: string, delta: number): string {
  const dates = getWeekDates(weekKey);
  const monday = new Date(dates[0]);
  monday.setUTCDate(monday.getUTCDate() + delta * 7);
  return getISOWeekKey(monday);
}

export function formatMoney(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getUTCFullYear() === today.getFullYear() &&
    date.getUTCMonth() === today.getMonth() &&
    date.getUTCDate() === today.getDate()
  );
}

export const SHIFT_LABELS = ["12pm – 5pm", "5pm – 11pm"];
