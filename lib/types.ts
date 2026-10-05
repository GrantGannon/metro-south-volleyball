export type Side = "A" | "B";
export type SetScore = [number, number];
export type MatchStatus = "scheduled" | "live" | "final" | "bye";
export type BracketSide = "winners" | "losers" | "final";
export type BracketFormat = "single" | "double";

export interface TournamentInfo {
  name: string;
  shortName: string;
  format: BracketFormat;
}

export interface Rules {
  setsToWin: number;
  setTarget: number;
  decidingTarget: number;
  winBy: number;
  /** Hard cap for non-deciding sets; null means no cap. */
  cap: number | null;
}

export interface TeamDTO {
  id: number;
  name: string;
  shortName: string;
  seed: number;
}

export interface MatchDTO {
  id: string;
  order: number;
  side: BracketSide;
  round: number;
  roundLabel: string;
  court: string | null;
  startsAt: string | null;
  status: MatchStatus;
  teamAId: number | null;
  teamBId: number | null;
  sets: SetScore[];
  pointsA: number;
  pointsB: number;
  winnerId: number | null;
  forfeit: boolean;
  advanced: boolean;
  winnerToId: string | null;
  winnerToSlot: Side | null;
  loserToId: string | null;
  loserToSlot: Side | null;
  isReset: boolean;
}

export interface AnnouncementDTO {
  id: number;
  body: string;
  createdAt: string;
}

export interface Snapshot {
  teams: TeamDTO[];
  matches: MatchDTO[];
  announcements: AnnouncementDTO[];
  info: TournamentInfo;
  rules: Rules;
  version: number;
}
