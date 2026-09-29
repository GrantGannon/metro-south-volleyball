export const TOURNAMENT_NAME = "Metro-South 8th Grade Girls Volleyball";
export const TIME_ZONE = "America/Chicago";

const dayTime = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

const timeOnly = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const shorten = (s: string) => s.replace(/\s?AM$/, "a").replace(/\s?PM$/, "p").replace(",", "");

/** "Fri 5:00p" */
export function formatDayTime(iso: string | null): string {
  if (!iso) return "Time TBD";
  return shorten(dayTime.format(new Date(iso)));
}

/** "5:00p" */
export function formatTime(iso: string | null): string {
  if (!iso) return "TBD";
  return shorten(timeOnly.format(new Date(iso)));
}

function zoneOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMs));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second")) - utcMs;
}

/** Parses "2026-10-02T17:00" as tournament time. */
export function fromLocalInput(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return new Date(guess - zoneOffsetMs(guess));
}

/** Value for <input type="datetime-local"> in tournament time. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
