import { describe, expect, it } from "vitest";
import { champion, needsReset, planAdvance, planFillReset, planUndoAdvance } from "./bracket";
import type { MatchDTO } from "./types";

function match(id: string, over: Partial<MatchDTO> = {}): MatchDTO {
  return {
    id,
    order: 0,
    side: "winners",
    round: 1,
    roundLabel: "",
    court: null,
    startsAt: null,
    status: "scheduled",
    teamAId: null,
    teamBId: null,
    sets: [],
    pointsA: 0,
    pointsB: 0,
    winnerId: null,
    advanced: false,
    winnerToId: null,
    winnerToSlot: null,
    loserToId: null,
    loserToSlot: null,
    isReset: false,
    ...over,
  };
}

function apply(matches: MatchDTO[], updates: Record<string, Partial<MatchDTO>>): MatchDTO[] {
  return matches.map((m) => (updates[m.id] ? { ...m, ...updates[m.id] } : m));
}

const played = (over: Partial<MatchDTO>) => ({ status: "final" as const, sets: [[25, 10], [25, 10]] as MatchDTO["sets"], ...over });

describe("advance", () => {
  const base = [
    match("W1", played({ teamAId: 5, teamBId: 10, winnerId: 10, winnerToId: "W4", winnerToSlot: "B", loserToId: "L1", loserToSlot: "A" })),
    match("W4", { teamAId: 4 }),
    match("L1", { side: "losers" }),
  ];

  it("sends the winner and the loser to their slots", () => {
    const plan = planAdvance(base, "W1");
    expect(plan).toEqual({
      ok: true,
      updates: { W4: { teamBId: 10 }, L1: { teamAId: 5 }, W1: { advanced: true } },
    });
  });

  it("refuses a match without a winner", () => {
    const m = [match("W2", { teamAId: 1, teamBId: 2 })];
    expect(planAdvance(m, "W2").ok).toBe(false);
  });

  it("refuses to overwrite a different team already in the slot", () => {
    const m = base.map((x) => (x.id === "W4" ? { ...x, teamBId: 7 } : x));
    expect(planAdvance(m, "W1").ok).toBe(false);
  });

  it("undo clears both slots when neither game has started", () => {
    const plan = planAdvance(base, "W1");
    if (!plan.ok) throw new Error(plan.error);
    const after = apply(base, plan.updates);
    const undo = planUndoAdvance(after, "W1");
    expect(undo).toEqual({
      ok: true,
      updates: { W4: { teamBId: null }, L1: { teamAId: null }, W1: { advanced: false } },
    });
  });

  it("undo is refused once the destination has started", () => {
    const plan = planAdvance(base, "W1");
    if (!plan.ok) throw new Error(plan.error);
    const after = apply(base, plan.updates).map((x) => (x.id === "W4" ? { ...x, status: "live" as const, pointsA: 3 } : x));
    expect(planUndoAdvance(after, "W1").ok).toBe(false);
  });
});

describe("championship", () => {
  it("winners-bracket team winning the first final is champion", () => {
    const m = [match("F1", played({ side: "final", teamAId: 1, teamBId: 2, winnerId: 1 })), match("F2", { side: "final", isReset: true })];
    expect(needsReset(m)).toBe(false);
    expect(champion(m)).toBe(1);
    expect(planFillReset(m, "F1").ok).toBe(false);
  });

  it("losers-bracket team winning the first final fills the if-necessary game", () => {
    const m = [match("F1", played({ side: "final", teamAId: 1, teamBId: 2, winnerId: 2 })), match("F2", { side: "final", isReset: true })];
    expect(needsReset(m)).toBe(true);
    expect(champion(m)).toBeNull();
    const plan = planFillReset(m, "F1");
    expect(plan).toEqual({
      ok: true,
      updates: { F2: { teamAId: 1, teamBId: 2, status: "scheduled" }, F1: { advanced: true } },
    });
  });
});
