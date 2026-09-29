import type { MatchDTO } from "./types";

const time = (m: MatchDTO) => (m.startsAt ? Date.parse(m.startsAt) : Number.MAX_SAFE_INTEGER);
const byTime = (a: MatchDTO, b: MatchDTO) => time(a) - time(b) || a.order - b.order;

export function liveMatches(ms: MatchDTO[]): MatchDTO[] {
  return ms.filter((m) => m.status === "live").sort(byTime);
}

/** Scheduled games, including ones still waiting on a feeder. Skips an empty if-necessary game. */
export function upcomingMatches(ms: MatchDTO[]): MatchDTO[] {
  return ms
    .filter((m) => m.status === "scheduled" && !(m.isReset && !m.teamAId && !m.teamBId))
    .sort(byTime);
}

export function finishedMatches(ms: MatchDTO[]): MatchDTO[] {
  return ms.filter((m) => m.status === "final").sort((a, b) => byTime(b, a));
}

export function involves(m: MatchDTO, teamId: number): boolean {
  return m.teamAId === teamId || m.teamBId === teamId;
}
