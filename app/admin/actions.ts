"use server";

import { redirect } from "next/navigation";
import { checkPassword, endSession, isAdmin, startSession } from "@/lib/auth";
import { planAdvance, planFillReset, planUndoAdvance, type MatchPatch } from "@/lib/bracket";
import { buildBracket } from "@/lib/draw";
import { prisma } from "@/lib/db";
import { fromLocalInput } from "@/lib/format";
import { addPoint, applyManual, matchWinner } from "@/lib/scoring";
import { getRules, getSnapshot, loadMatches, publish, toMatchDTO } from "@/lib/snapshot";
import type { BracketFormat, MatchDTO, MatchStatus, Side, SetScore, Snapshot } from "@/lib/types";

export type ActionResult = { ok: true; snapshot: Snapshot } | { ok: false; error: string };

let queue: Promise<unknown> = Promise.resolve();

/** Serializes writes so two quick taps can't read the same score. */
async function write(fn: () => Promise<string | void>): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Your admin session ended. Log in again." };
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  try {
    const error = await run;
    if (error) return { ok: false, error };
    await publish();
    return { ok: true, snapshot: await getSnapshot() };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "The change didn't save. Try again." };
  }
}

async function getMatch(id: string): Promise<MatchDTO | null> {
  const row = await prisma.match.findUnique({ where: { id } });
  return row ? toMatchDTO(row) : null;
}

async function applyUpdates(updates: Record<string, MatchPatch>) {
  await prisma.$transaction(Object.entries(updates).map(([id, data]) => prisma.match.update({ where: { id }, data })));
}

/* Session */

export async function login(_: string | null, form: FormData): Promise<string | null> {
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) return "That password doesn't match. Check with the tournament director.";
  await startSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

/* Scoring */

async function saveScore(m: MatchDTO, sets: SetScore[], pointsA: number, pointsB: number) {
  const rules = await getRules();
  const winSide = matchWinner(sets, rules);
  const winnerId = winSide === "A" ? m.teamAId : winSide === "B" ? m.teamBId : null;
  await prisma.match.update({
    where: { id: m.id },
    data: { sets, pointsA, pointsB, winnerId, forfeit: false, status: winnerId ? "final" : "live" },
  });
}

export async function scorePoint(id: string, side: Side, delta: 1 | -1): Promise<ActionResult> {
  return write(async () => {
    const m = await getMatch(id);
    if (!m) return `Game ${id} does not exist.`;
    if (!m.teamAId || !m.teamBId) return "Both teams need to be set before scoring.";
    if (m.advanced) return "This game has been advanced. Undo the advance to change the score.";
    if (m.forfeit) return "This game was awarded by forfeit. Clear the score to play it.";
    const rules = await getRules();
    const next = addPoint(m, side, delta, rules);
    await saveScore(m, next.sets, next.pointsA, next.pointsB);
  });
}

export async function setScore(id: string, sets: SetScore[], pointsA: number, pointsB: number): Promise<ActionResult> {
  return write(async () => {
    const m = await getMatch(id);
    if (!m) return `Game ${id} does not exist.`;
    if (!m.teamAId || !m.teamBId) return "Both teams need to be set before scoring.";
    if (m.advanced) return "This game has been advanced. Undo the advance to change the score.";
    if (m.forfeit) return "This game was awarded by forfeit. Clear the score to play it.";
    const result = applyManual({ sets, pointsA, pointsB }, await getRules());
    if (!result.ok) return result.error;
    await saveScore(m, result.state.sets, result.state.pointsA, result.state.pointsB);
  });
}

export async function startGame(id: string): Promise<ActionResult> {
  return write(async () => {
    const m = await getMatch(id);
    if (!m) return `Game ${id} does not exist.`;
    if (!m.teamAId || !m.teamBId) return "Both teams need to be set before the game starts.";
    if (m.status !== "scheduled") return "This game has already started.";
    await prisma.match.update({ where: { id }, data: { status: "live" } });
  });
}

export async function clearScore(id: string): Promise<ActionResult> {
  return write(async () => {
    const m = await getMatch(id);
    if (!m) return `Game ${id} does not exist.`;
    if (m.advanced) return "This game has been advanced. Undo the advance first.";
    await prisma.match.update({
      where: { id },
      data: { status: "scheduled", sets: [], pointsA: 0, pointsB: 0, winnerId: null, forfeit: false },
    });
  });
}

/* Advancing */

export async function forfeitGame(id: string, winnerId: number): Promise<ActionResult> {
  return write(async () => {
    const m = await getMatch(id);
    if (!m) return `Game ${id} does not exist.`;
    if (m.status === "bye") return "A bye has no forfeit.";
    if (!m.teamAId || !m.teamBId) return "Both teams need to be set before a forfeit.";
    if (winnerId !== m.teamAId && winnerId !== m.teamBId) return "The winner has to be one of the teams in this game.";
    if (m.advanced) return "This game has been advanced. Undo the advance first.";
    await prisma.match.update({
      where: { id },
      data: { status: "final", winnerId, forfeit: true, sets: [], pointsA: 0, pointsB: 0 },
    });
  });
}

export async function advanceWinner(id: string): Promise<ActionResult> {
  return write(async () => {
    const plan = planAdvance(await loadMatches(), id);
    if (!plan.ok) return plan.error;
    await applyUpdates(plan.updates);
  });
}

export async function undoAdvance(id: string): Promise<ActionResult> {
  return write(async () => {
    const plan = planUndoAdvance(await loadMatches(), id);
    if (!plan.ok) return plan.error;
    await applyUpdates(plan.updates);
  });
}

export async function startIfNecessaryGame(id: string): Promise<ActionResult> {
  return write(async () => {
    const plan = planFillReset(await loadMatches(), id);
    if (!plan.ok) return plan.error;
    await applyUpdates(plan.updates);
  });
}

/* Bracket and schedule */

export interface MatchEdit {
  roundLabel: string;
  side: MatchDTO["side"];
  round: number;
  court: string;
  startsAt: string;
  status: MatchStatus;
  teamAId: number | null;
  teamBId: number | null;
  winnerToId: string | null;
  winnerToSlot: Side | null;
  loserToId: string | null;
  loserToSlot: Side | null;
  isReset: boolean;
}

export async function updateMatch(id: string, edit: MatchEdit): Promise<ActionResult> {
  return write(async () => {
    const m = await getMatch(id);
    if (!m) return `Game ${id} does not exist.`;
    const ids = new Set((await prisma.match.findMany({ select: { id: true } })).map((x) => x.id));
    for (const target of [edit.winnerToId, edit.loserToId]) {
      if (target && !ids.has(target)) return `Game ${target} does not exist.`;
      if (target === id) return "A game can't feed into itself.";
    }
    if ((edit.winnerToId && !edit.winnerToSlot) || (edit.loserToId && !edit.loserToSlot)) {
      return "Pick slot A or B for each destination.";
    }
    if (edit.teamAId && edit.teamAId === edit.teamBId) return "A team can't play itself.";
    const startsAt = edit.startsAt ? fromLocalInput(edit.startsAt) : null;
    if (edit.startsAt && !startsAt) return "Start time isn't a valid date and time.";

    const teamsChanged = edit.teamAId !== m.teamAId || edit.teamBId !== m.teamBId;
    if (teamsChanged && m.advanced) return "This game has been advanced. Undo the advance before changing its teams.";

    let status = edit.status;
    if (status === "bye" && edit.teamBId) return "A bye has only one team. Clear team B or change the status.";
    const byeWinner = status === "bye" ? edit.teamAId : null;
    if (status !== "bye" && m.status === "bye") status = "scheduled";

    await prisma.match.update({
      where: { id },
      data: {
        roundLabel: edit.roundLabel.trim() || m.roundLabel,
        side: edit.side,
        round: edit.round,
        court: edit.court.trim() || null,
        startsAt,
        status,
        teamAId: edit.teamAId,
        teamBId: edit.teamBId,
        winnerToId: edit.winnerToId,
        winnerToSlot: edit.winnerToId ? edit.winnerToSlot : null,
        loserToId: edit.loserToId,
        loserToSlot: edit.loserToId ? edit.loserToSlot : null,
        isReset: edit.isReset,
        ...(status === "bye" ? { winnerId: byeWinner, forfeit: false, sets: [], pointsA: 0, pointsB: 0 } : {}),
        ...(status !== "final" ? { forfeit: false } : {}),
        ...(m.status === "bye" && status !== "bye" ? { winnerId: null, advanced: false } : {}),
      },
    });
  });
}

export async function addMatch(id: string, side: MatchDTO["side"], round: number, roundLabel: string): Promise<ActionResult> {
  return write(async () => {
    const code = id.trim().toUpperCase();
    if (!/^[A-Z0-9-]{1,8}$/.test(code)) return "Use a short game code like W10 or L9.";
    if (await prisma.match.findUnique({ where: { id: code } })) return `Game ${code} already exists.`;
    const last = await prisma.match.aggregate({ _max: { order: true } });
    await prisma.match.create({
      data: { id: code, side, round, roundLabel: roundLabel.trim() || `Round ${round}`, order: (last._max.order ?? 0) + 1 },
    });
  });
}

export async function deleteMatch(id: string): Promise<ActionResult> {
  return write(async () => {
    const m = await getMatch(id);
    if (!m) return `Game ${id} does not exist.`;
    if (m.status === "live" || m.status === "final") return "This game has a score. Clear the score before deleting it.";
    await prisma.$transaction([
      prisma.match.updateMany({ where: { winnerToId: id }, data: { winnerToId: null, winnerToSlot: null } }),
      prisma.match.updateMany({ where: { loserToId: id }, data: { loserToId: null, loserToSlot: null } }),
      prisma.match.delete({ where: { id } }),
    ]);
  });
}

export async function updateTeam(id: number, name: string, shortName: string, seed: number): Promise<ActionResult> {
  return write(async () => {
    if (!name.trim()) return "Team name can't be empty.";
    if (!Number.isInteger(seed) || seed < 1) return "Seed must be a whole number, 1 or higher.";
    await prisma.team.update({
      where: { id },
      data: { name: name.trim(), shortName: shortName.trim() || name.trim().slice(0, 4), seed },
    });
  });
}

/* Announcements */

export async function postAnnouncement(body: string): Promise<ActionResult> {
  return write(async () => {
    const text = body.trim();
    if (!text) return "Write the announcement first.";
    if (text.length > 280) return "Keep announcements under 280 characters.";
    await prisma.announcement.create({ data: { body: text } });
  });
}

export async function deleteAnnouncement(id: number): Promise<ActionResult> {
  return write(async () => {
    await prisma.announcement.deleteMany({ where: { id } });
  });
}

/* Settings */

export async function addTeam(name: string): Promise<ActionResult> {
  return write(async () => {
    const trimmed = name.trim();
    if (!trimmed) return "Team name can't be empty.";
    const count = await prisma.team.count();
    if (count >= 32) return "32 teams is the maximum.";
    const short = trimmed.split(/\s+/)[0].slice(0, 12);
    await prisma.team.create({ data: { name: trimmed, shortName: short, seed: count + 1 } });
  });
}

export async function deleteTeam(id: number): Promise<ActionResult> {
  return write(async () => {
    const started = await prisma.match.findFirst({
      where: { OR: [{ teamAId: id }, { teamBId: id }, { winnerId: id }], status: { in: ["live", "final"] } },
    });
    if (started) return "This team is in a game that already started.";
    await prisma.team.delete({ where: { id } });
  });
}

export async function updateTournament(input: { name: string; shortName: string; format: BracketFormat }): Promise<ActionResult> {
  return write(async () => {
    const name = input.name.trim();
    const shortName = input.shortName.trim();
    if (!name) return "The tournament needs a name.";
    if (!shortName) return "The short name is what shows in the header.";
    if (input.format !== "single" && input.format !== "double") return "Choose single or double elimination.";
    await prisma.settings.update({ where: { id: 1 }, data: { name, shortName, format: input.format } });
  });
}

export async function buildGeneratedBracket(): Promise<ActionResult> {
  return write(async () => {
    const [settings, teams] = await Promise.all([
      prisma.settings.findUnique({ where: { id: 1 } }),
      prisma.team.findMany({ orderBy: { seed: "asc" } }),
    ]);
    const format: BracketFormat = settings?.format === "single" ? "single" : "double";
    const ranked = [...teams].sort((a, b) => a.seed - b.seed || a.id - b.id);
    const draw = buildBracket(ranked.map((_, i) => i + 1), format);
    if (!draw.ok) return draw.error;
    const idBySeed = new Map(ranked.map((t, i) => [i + 1, t.id]));
    await prisma.match.deleteMany();
    const placed = new Map<string, number>();
    for (const [order, m] of draw.matches.entries()) {
      const teamAId = m.teamA ? idBySeed.get(m.teamA) ?? null : null;
      const teamBId = m.teamB ? idBySeed.get(m.teamB) ?? null : null;
      const bye = m.status === "bye" && teamAId;
      if (bye && m.winnerTo) placed.set(`${m.winnerTo[0]}:${m.winnerTo[1]}`, teamAId);
      await prisma.match.create({
        data: {
          id: m.id,
          order,
          side: m.side,
          round: m.round,
          roundLabel: m.roundLabel,
          status: bye ? "bye" : "scheduled",
          teamAId: placed.get(`${m.id}:A`) ?? teamAId,
          teamBId: placed.get(`${m.id}:B`) ?? teamBId,
          winnerId: bye ? teamAId : null,
          advanced: Boolean(bye),
          winnerToId: m.winnerTo?.[0] ?? null,
          winnerToSlot: m.winnerTo?.[1] ?? null,
          loserToId: m.loserTo?.[0] ?? null,
          loserToSlot: m.loserTo?.[1] ?? null,
          isReset: Boolean(m.isReset),
        },
      });
    }
  });
}

export async function updateRules(r: { setsToWin: number; setTarget: number; decidingTarget: number; winBy: number; cap: number | null }): Promise<ActionResult> {
  return write(async () => {
    if (![1, 2, 3].includes(r.setsToWin)) return "Choose heads up, best of 3, or best of 5.";
    const nums = [r.setTarget, r.decidingTarget, r.winBy];
    if (nums.some((n) => !Number.isInteger(n) || n < 1)) return "Targets and win-by need whole numbers, 1 or higher.";
    if (r.cap != null && (!Number.isInteger(r.cap) || r.cap <= r.setTarget)) return "The cap has to be higher than the set target.";
    await prisma.settings.update({
      where: { id: 1 },
      data: { setsToWin: r.setsToWin, setTarget: r.setTarget, decidingTarget: r.decidingTarget, winBy: r.winBy, cap: r.cap },
    });
  });
}
