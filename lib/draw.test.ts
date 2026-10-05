import { describe, expect, it } from "vitest";
import { buildBracket, type DrawnMatch } from "./draw";

function linksHold(matches: DrawnMatch[]) {
  const ids = new Set(matches.map((m) => m.id));
  const slots = new Map<string, number>();
  for (const m of matches) {
    for (const dest of [m.winnerTo, m.loserTo]) {
      if (!dest) continue;
      expect(ids.has(dest[0]), `${m.id} points at missing ${dest[0]}`).toBe(true);
      const key = dest.join("");
      slots.set(key, (slots.get(key) ?? 0) + 1);
    }
    if (m.status === "bye") expect(m.winnerTo, m.id).toBeTruthy();
  }
  const open = matches.filter((m) => m.status !== "bye" && !m.winnerTo);
  expect(open.length).toBeGreaterThan(0);
  expect(open.length).toBeLessThanOrEqual(2);
  for (const [key, count] of slots) expect(count, key).toBe(1);
}

describe("buildBracket", () => {
  it("gives a 3-team single-elimination field one bye and no losers bracket", () => {
    const draw = buildBracket([1, 2, 3], "single");
    expect(draw.ok).toBe(true);
    if (!draw.ok) return;
    expect(draw.matches.filter((m) => m.status === "bye")).toHaveLength(1);
    expect(draw.matches.some((m) => m.side === "losers" || m.isReset)).toBe(false);
    linksHold(draw.matches);
  });

  it("builds an 8-team double-elimination bracket with an if-necessary final", () => {
    const draw = buildBracket([1, 2, 3, 4, 5, 6, 7, 8], "double");
    expect(draw.ok).toBe(true);
    if (!draw.ok) return;
    expect(draw.matches.filter((m) => m.side === "winners")).toHaveLength(7);
    expect(draw.matches.filter((m) => m.side === "losers")).toHaveLength(6);
    expect(draw.matches.filter((m) => m.isReset)).toHaveLength(1);
    const final = draw.matches.find((m) => m.id === "F1");
    const winnersFinal = draw.matches.find((m) => m.roundLabel === "Winners final");
    const losersFinal = draw.matches.find((m) => m.roundLabel === "Losers final");
    expect(winnersFinal?.winnerTo).toEqual(["F1", "A"]);
    expect(losersFinal?.winnerTo).toEqual(["F1", "B"]);
    expect(final?.side).toBe("final");
    linksHold(draw.matches);
  });

  it("refuses a generated double-elimination bracket that is not 4, 8, 16, or 32 teams", () => {
    const draw = buildBracket([1, 2, 3, 4, 5, 6], "double");
    expect(draw.ok).toBe(false);
  });
});
