import type { BracketSide, MatchDTO, TournamentInfo } from "./types";

export function bracketBands(info: TournamentInfo, matches: MatchDTO[]): { id: BracketSide; label: string }[] {
  const has = (side: BracketSide) => matches.some((m) => m.side === side);
  const single = info.format === "single" && !has("losers");
  const bands: { id: BracketSide; label: string }[] = [{ id: "winners", label: single ? "Bracket" : "Winners" }];
  if (info.format === "double" || has("losers")) bands.push({ id: "losers", label: "Losers" });
  if (info.format === "double" || has("final")) bands.push({ id: "final", label: "Finals" });
  return bands;
}

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
