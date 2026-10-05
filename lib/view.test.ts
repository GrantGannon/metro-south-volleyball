import { describe, expect, it } from "vitest";
import type { MatchDTO, TournamentInfo } from "./types";
import { bracketBands } from "./view";

const info = (format: TournamentInfo["format"]): TournamentInfo => ({
  name: "Example",
  shortName: "Example",
  format,
});

function match(side: MatchDTO["side"]): MatchDTO {
  return {
    id: side,
    order: 1,
    side,
    round: 1,
    roundLabel: side,
    status: "scheduled",
    teamAId: null,
    teamBId: null,
    winnerId: null,
    sets: [],
    pointsA: 0,
    pointsB: 0,
    court: null,
    startsAt: null,
    winnerToId: null,
    winnerToSlot: null,
    loserToId: null,
    loserToSlot: null,
    isReset: false,
    forfeit: false,
    advanced: false,
  };
}

describe("bracketBands", () => {
  it("hides losers and finals on an empty single-elimination draw", () => {
    expect(bracketBands(info("single"), []).map((b) => b.label)).toEqual(["Bracket"]);
  });

  it("keeps losers and finals when those games already exist", () => {
    const labels = bracketBands(info("single"), [match("winners"), match("losers"), match("final")]).map((b) => b.label);
    expect(labels).toEqual(["Winners", "Losers", "Finals"]);
  });
});
