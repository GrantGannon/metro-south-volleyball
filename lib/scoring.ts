import type { Rules, SetScore, Side } from "./types";

export const DEFAULT_RULES: Rules = {
  setsToWin: 2,
  setTarget: 25,
  decidingTarget: 15,
  winBy: 2,
  cap: null,
};

export interface ScoreState {
  sets: SetScore[];
  pointsA: number;
  pointsB: number;
}

/** The last possible set of a best of 3 or best of 5. A heads-up match is one regular set. */
export function isDecidingSet(index: number, rules: Rules): boolean {
  return rules.setsToWin > 1 && index === rules.setsToWin * 2 - 2;
}

export function targetForSet(index: number, rules: Rules): number {
  return isDecidingSet(index, rules) ? rules.decidingTarget : rules.setTarget;
}

export function setWinner(a: number, b: number, index: number, rules: Rules): Side | null {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  if (hi === lo) return null;
  const side: Side = a > b ? "A" : "B";
  if (rules.cap && !isDecidingSet(index, rules) && hi >= rules.cap) return side;
  if (hi >= targetForSet(index, rules) && hi - lo >= rules.winBy) return side;
  return null;
}

export function setsWon(sets: SetScore[]): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (const [x, y] of sets) {
    if (x > y) a++;
    else if (y > x) b++;
  }
  return { a, b };
}

export function matchWinner(sets: SetScore[], rules: Rules): Side | null {
  const { a, b } = setsWon(sets);
  if (a >= rules.setsToWin) return "A";
  if (b >= rules.setsToWin) return "B";
  return null;
}

/**
 * Adds `delta` (+1 or -1) to one side. A point that wins the set closes it and starts the next.
 * A -1 with no points in the current set reopens the previous set, so a mistaken set-winning tap can be undone.
 */
export function addPoint(state: ScoreState, side: Side, delta: 1 | -1, rules: Rules): ScoreState {
  let sets = state.sets.map((s) => [...s] as SetScore);
  let pointsA = state.pointsA;
  let pointsB = state.pointsB;

  if (delta > 0) {
    if (matchWinner(sets, rules)) return state;
    if (side === "A") pointsA++;
    else pointsB++;
    if (setWinner(pointsA, pointsB, sets.length, rules)) {
      sets = [...sets, [pointsA, pointsB]];
      pointsA = 0;
      pointsB = 0;
    }
    return { sets, pointsA, pointsB };
  }

  if (pointsA === 0 && pointsB === 0 && sets.length > 0) {
    const last = sets[sets.length - 1];
    sets = sets.slice(0, -1);
    [pointsA, pointsB] = last;
  }
  if (side === "A") pointsA = Math.max(0, pointsA - 1);
  else pointsB = Math.max(0, pointsB - 1);
  return { sets, pointsA, pointsB };
}

/** Validates a typed correction. Current points that already win a set are closed into that set. */
export function applyManual(
  input: ScoreState,
  rules: Rules,
): { ok: true; state: ScoreState } | { ok: false; error: string } {
  const sets: SetScore[] = [];
  for (let i = 0; i < input.sets.length; i++) {
    const [a, b] = input.sets[i];
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      return { ok: false, error: `Set ${i + 1} needs two whole numbers.` };
    }
    if (matchWinner(sets, rules)) {
      return { ok: false, error: `Set ${i + 1} comes after the match was already won.` };
    }
    if (!setWinner(a, b, i, rules)) {
      return { ok: false, error: `Set ${i + 1} (${a}–${b}) is not a finished set. Play to ${targetForSet(i, rules)}, win by ${rules.winBy}.` };
    }
    sets.push([a, b]);
  }

  let { pointsA, pointsB } = input;
  if (!Number.isInteger(pointsA) || !Number.isInteger(pointsB) || pointsA < 0 || pointsB < 0) {
    return { ok: false, error: "Current points need two whole numbers." };
  }
  if (matchWinner(sets, rules)) {
    if (pointsA || pointsB) return { ok: false, error: "The match is already won, so current points must be 0–0." };
    return { ok: true, state: { sets, pointsA: 0, pointsB: 0 } };
  }
  if (setWinner(pointsA, pointsB, sets.length, rules)) {
    sets.push([pointsA, pointsB]);
    pointsA = 0;
    pointsB = 0;
  }
  return { ok: true, state: { sets, pointsA, pointsB } };
}
