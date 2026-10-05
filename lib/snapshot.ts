import "server-only";
import { EventEmitter } from "node:events";
import { prisma } from "./db";
import type { BracketFormat, MatchDTO, Rules, SetScore, Snapshot, TournamentInfo } from "./types";

const globalForEvents = globalThis as unknown as { tournamentEvents?: EventEmitter };
export const tournamentEvents = globalForEvents.tournamentEvents ?? new EventEmitter();
tournamentEvents.setMaxListeners(0);
globalForEvents.tournamentEvents = tournamentEvents;

export async function getRules(): Promise<Rules & { version: number }> {
  const s = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  return { setsToWin: s.setsToWin, setTarget: s.setTarget, decidingTarget: s.decidingTarget, winBy: s.winBy, cap: s.cap, version: s.version };
}

type MatchRow = Awaited<ReturnType<typeof prisma.match.findMany>>[number];

export function toMatchDTO(m: MatchRow): MatchDTO {
  return {
    id: m.id,
    order: m.order,
    side: m.side as MatchDTO["side"],
    round: m.round,
    roundLabel: m.roundLabel,
    court: m.court,
    startsAt: m.startsAt?.toISOString() ?? null,
    status: m.status as MatchDTO["status"],
    teamAId: m.teamAId,
    teamBId: m.teamBId,
    sets: (m.sets as SetScore[]) ?? [],
    pointsA: m.pointsA,
    pointsB: m.pointsB,
    winnerId: m.winnerId,
    forfeit: m.forfeit,
    advanced: m.advanced,
    winnerToId: m.winnerToId,
    winnerToSlot: m.winnerToSlot as MatchDTO["winnerToSlot"],
    loserToId: m.loserToId,
    loserToSlot: m.loserToSlot as MatchDTO["loserToSlot"],
    isReset: m.isReset,
  };
}

export async function loadMatches(): Promise<MatchDTO[]> {
  const rows = await prisma.match.findMany({ orderBy: [{ order: "asc" }] });
  return rows.map(toMatchDTO);
}

const FALLBACK_INFO: TournamentInfo = {
  name: "Metro-South 8th Grade Girls Volleyball",
  shortName: "Metro-South",
  format: "double",
};

export function readInfo(row: { name?: string | null; shortName?: string | null; format?: string | null } | null): TournamentInfo {
  const format: BracketFormat = row?.format === "single" ? "single" : "double";
  return {
    name: row?.name?.trim() || FALLBACK_INFO.name,
    shortName: row?.shortName?.trim() || FALLBACK_INFO.shortName,
    format,
  };
}

export async function getSnapshot(): Promise<Snapshot> {
  const [teams, matches, announcements, settings] = await Promise.all([
    prisma.team.findMany({ orderBy: { seed: "asc" } }),
    loadMatches(),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
  ]);
  return {
    teams: teams.map((t) => ({ id: t.id, name: t.name, shortName: t.shortName, seed: t.seed })),
    matches,
    announcements: announcements.map((a) => ({ id: a.id, body: a.body, createdAt: a.createdAt.toISOString() })),
    info: readInfo(settings),
    rules: {
      setsToWin: settings.setsToWin,
      setTarget: settings.setTarget,
      decidingTarget: settings.decidingTarget,
      winBy: settings.winBy,
      cap: settings.cap,
    },
    version: settings.version,
  };
}

/** Call after every admin write. Bumps the version and pushes a fresh snapshot to every open stream. */
export async function publish(): Promise<void> {
  await prisma.settings.upsert({ where: { id: 1 }, update: { version: { increment: 1 } }, create: { id: 1, version: 1 } });
  const snap = await getSnapshot();
  tournamentEvents.emit("snapshot", snap);
}
