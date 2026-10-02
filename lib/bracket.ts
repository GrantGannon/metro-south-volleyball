import type { MatchDTO, Side, TeamDTO } from "./types";

export type MatchPatch = Partial<Pick<MatchDTO, "teamAId" | "teamBId" | "advanced" | "status">>;
export type Plan = { ok: true; updates: Record<string, MatchPatch> } | { ok: false; error: string };

const slotKey = (slot: Side) => (slot === "A" ? "teamAId" : "teamBId");

export function hasStarted(m: MatchDTO): boolean {
  return m.status === "live" || m.status === "final" || m.sets.length > 0 || m.pointsA > 0 || m.pointsB > 0;
}

export function loserOf(m: MatchDTO): number | null {
  if (!m.winnerId) return null;
  if (m.winnerId === m.teamAId) return m.teamBId;
  if (m.winnerId === m.teamBId) return m.teamAId;
  return null;
}

function place(
  byId: Map<string, MatchDTO>,
  updates: Record<string, MatchPatch>,
  targetId: string | null,
  slot: Side | null,
  teamId: number | null,
): string | null {
  if (!targetId || !slot || !teamId) return null;
  const target = byId.get(targetId);
  if (!target) return `Game ${targetId} does not exist. Fix the link in the bracket editor.`;
  const key = slotKey(slot);
  const current = target[key];
  if (current && current !== teamId) {
    return `Game ${targetId} slot ${slot} already has another team. Clear it in the bracket editor first.`;
  }
  if (hasStarted(target) && current !== teamId) return `Game ${targetId} has already started.`;
  updates[targetId] = { ...updates[targetId], [key]: teamId };
  return null;
}

export function planAdvance(matches: MatchDTO[], id: string): Plan {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const m = byId.get(id);
  if (!m) return { ok: false, error: `Game ${id} does not exist.` };
  if (m.advanced) return { ok: false, error: `Game ${id} has already been advanced.` };
  if (!m.winnerId) return { ok: false, error: `Game ${id} has no winner yet.` };

  const updates: Record<string, MatchPatch> = {};
  const err =
    place(byId, updates, m.winnerToId, m.winnerToSlot, m.winnerId) ??
    place(byId, updates, m.loserToId, m.loserToSlot, loserOf(m));
  if (err) return { ok: false, error: err };
  updates[id] = { ...updates[id], advanced: true };
  return { ok: true, updates };
}

export function planUndoAdvance(matches: MatchDTO[], id: string): Plan {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const m = byId.get(id);
  if (!m) return { ok: false, error: `Game ${id} does not exist.` };
  if (!m.advanced) return { ok: false, error: `Game ${id} has not been advanced.` };

  const updates: Record<string, MatchPatch> = {};
  const moves: [string | null, Side | null, number | null][] = [
    [m.winnerToId, m.winnerToSlot, m.winnerId],
    [m.loserToId, m.loserToSlot, loserOf(m)],
  ];
  for (const [targetId, slot, teamId] of moves) {
    if (!targetId || !slot || !teamId) continue;
    const target = byId.get(targetId);
    if (!target) continue;
    const key = slotKey(slot);
    if (target[key] !== teamId) continue;
    if (hasStarted(target)) return { ok: false, error: `Game ${targetId} has already started, so this can't be undone.` };
    updates[targetId] = { ...updates[targetId], [key]: null };
  }

  const reset = m.side === "final" && !m.isReset ? matches.find((x) => x.isReset) : undefined;
  if (reset && (reset.teamAId || reset.teamBId)) {
    if (hasStarted(reset)) return { ok: false, error: `Game ${reset.id} has already started, so this can't be undone.` };
    updates[reset.id] = { teamAId: null, teamBId: null };
  }

  updates[id] = { ...updates[id], advanced: false };
  return { ok: true, updates };
}

/** The losers-bracket team won the first final, so both teams play the if-necessary game. */
export function planFillReset(matches: MatchDTO[], finalId: string): Plan {
  const f = matches.find((m) => m.id === finalId);
  if (!f || f.side !== "final" || f.isReset) return { ok: false, error: "Pick the first championship game." };
  if (f.status !== "final" || !f.winnerId) return { ok: false, error: `Game ${f.id} is not finished.` };
  if (f.winnerId !== f.teamBId) {
    return { ok: false, error: "The winners-bracket team won, so no second game is needed." };
  }
  const reset = matches.find((m) => m.isReset);
  if (!reset) return { ok: false, error: "There is no if-necessary game in the bracket." };
  if (hasStarted(reset)) return { ok: false, error: `Game ${reset.id} has already started.` };
  return {
    ok: true,
    updates: {
      [reset.id]: { teamAId: f.teamAId, teamBId: f.teamBId, status: "scheduled" },
      [f.id]: { advanced: true },
    },
  };
}

export function needsReset(matches: MatchDTO[]): boolean {
  const f = matches.find((m) => m.side === "final" && !m.isReset);
  return Boolean(f && f.status === "final" && f.winnerId && f.winnerId === f.teamBId && !f.advanced);
}

export function champion(matches: MatchDTO[]): number | null {
  const reset = matches.find((m) => m.isReset);
  if (reset?.status === "final" && reset.winnerId) return reset.winnerId;
  const f = matches.find((m) => m.side === "final" && !m.isReset);
  if (f?.status === "final" && f.winnerId && f.winnerId === f.teamAId) return f.winnerId;
  return null;
}

type NamedTeams = { get(id: number): { name: string } | undefined };

/** "Simmons v Hewitt" when those schools are known, otherwise the game code. */
export function matchupName(match: MatchDTO, teams?: NamedTeams): string {
  const name = (id: number | null) => (id && teams ? teams.get(id)?.name : null) ?? null;
  const a = name(match.teamAId);
  const b = match.status === "bye" ? null : name(match.teamBId);
  if (a && b) return `${a} v ${b}`;
  if (a || b) return (a ?? b) as string;
  return match.id;
}

/** "Loser of Simmons v Hewitt" for a slot still waiting on another game. */
export function feederLabel(
  matches: MatchDTO[],
  id: string,
  slot: Side,
  teams?: NamedTeams,
): string | null {
  for (const m of matches) {
    if (m.winnerToId === id && m.winnerToSlot === slot) return m.status === "bye" ? null : `Winner of ${matchupName(m, teams)}`;
    if (m.loserToId === id && m.loserToSlot === slot) return `Loser of ${matchupName(m, teams)}`;
  }
  const reset = matches.find((m) => m.id === id);
  if (reset?.isReset) return "If needed";
  return null;
}

/** Team name, or the winner/loser matchup still headed for this side. */
export function slotLabel(matches: MatchDTO[], teams: NamedTeams, match: MatchDTO, slot: Side): string {
  if (match.status === "bye" && slot === "B") return "bye";
  const id = slot === "A" ? match.teamAId : match.teamBId;
  if (id) return teams.get(id)?.name ?? "Open";
  return feederLabel(matches, match.id, slot, teams) ?? "Open";
}

export function teamMap(teams: TeamDTO[]): Map<number, TeamDTO> {
  return new Map(teams.map((t) => [t.id, t]));
}
