import { describe, expect, it } from "vitest";
import { addPoint, applyManual, DEFAULT_RULES, matchWinner, setWinner, type ScoreState } from "./scoring";

const R = DEFAULT_RULES;
const start: ScoreState = { sets: [], pointsA: 0, pointsB: 0 };

function tap(state: ScoreState, seq: string): ScoreState {
  for (const ch of seq) state = addPoint(state, ch === "a" ? "A" : "B", 1, R);
  return state;
}

describe("setWinner", () => {
  it("25-23 ends a set", () => expect(setWinner(25, 23, 0, R)).toBe("A"));
  it("25-24 does not end a set", () => expect(setWinner(25, 24, 0, R)).toBeNull());
  it("26-24 ends a set", () => expect(setWinner(24, 26, 1, R)).toBe("B"));
  it("15-13 ends the deciding set", () => expect(setWinner(15, 13, 2, R)).toBe("A"));
  it("15-13 does not end a regular set", () => expect(setWinner(15, 13, 0, R)).toBeNull());
  it("cap ends a regular set at the cap without win-by-2", () => {
    expect(setWinner(27, 26, 0, { ...R, cap: 27 })).toBe("A");
    expect(setWinner(16, 15, 2, { ...R, cap: 27 })).toBeNull();
  });
});

describe("addPoint", () => {
  it("closes a set at 25-23 and starts the next", () => {
    const s = tap({ sets: [], pointsA: 24, pointsB: 23 }, "a");
    expect(s).toEqual({ sets: [[25, 23]], pointsA: 0, pointsB: 0 });
  });

  it("keeps going at 25-24", () => {
    const s = tap({ sets: [], pointsA: 24, pointsB: 24 }, "a");
    expect(s).toEqual({ sets: [], pointsA: 25, pointsB: 24 });
  });

  it("wins the match after two sets", () => {
    let s: ScoreState = { sets: [[25, 20]], pointsA: 24, pointsB: 10 };
    s = tap(s, "a");
    expect(matchWinner(s.sets, R)).toBe("A");
    expect(tap(s, "b")).toEqual(s);
  });

  it("-1 at 0-0 reopens the previous set", () => {
    const s = addPoint({ sets: [[25, 23]], pointsA: 0, pointsB: 0 }, "A", -1, R);
    expect(s).toEqual({ sets: [], pointsA: 24, pointsB: 23 });
  });

  it("-1 never goes below zero", () => {
    expect(addPoint(start, "B", -1, R)).toEqual(start);
  });
});

describe("applyManual", () => {
  it("accepts finished sets and in-progress points", () => {
    const r = applyManual({ sets: [[25, 18], [22, 25]], pointsA: 9, pointsB: 7 }, R);
    expect(r).toEqual({ ok: true, state: { sets: [[25, 18], [22, 25]], pointsA: 9, pointsB: 7 } });
  });

  it("rejects an unfinished set", () => {
    const r = applyManual({ sets: [[25, 24]], pointsA: 0, pointsB: 0 }, R);
    expect(r.ok).toBe(false);
  });

  it("rejects sets after the match is decided", () => {
    const r = applyManual({ sets: [[25, 10], [25, 10], [15, 3]], pointsA: 0, pointsB: 0 }, R);
    expect(r.ok).toBe(false);
  });

  it("closes current points that already win a set", () => {
    const r = applyManual({ sets: [[25, 18], [22, 25]], pointsA: 15, pointsB: 13 }, R);
    expect(r).toEqual({ ok: true, state: { sets: [[25, 18], [22, 25], [15, 13]], pointsA: 0, pointsB: 0 } });
  });
});
