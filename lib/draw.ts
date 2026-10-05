import type { BracketSide, Side } from "./types";

export type BracketFormat = "single" | "double";

export interface DrawnMatch {
  id: string;
  side: BracketSide;
  round: number;
  roundLabel: string;
  status: "scheduled" | "bye";
  /** Seed number, not a database id. */
  teamA?: number;
  teamB?: number;
  winnerTo?: [string, Side];
  loserTo?: [string, Side];
  isReset?: boolean;
}

export type Draw = { ok: true; matches: DrawnMatch[] } | { ok: false; error: string };

interface Node extends DrawnMatch {}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** 1-based seeds in bracket order, so seed 1 plays the bottom seed. */
function seedOrder(size: number): number[] {
  let slots = [1];
  while (slots.length < size) {
    const next: number[] = [];
    const sum = slots.length * 2 + 1;
    for (const seed of slots) next.push(seed, sum - seed);
    slots = next;
  }
  return slots;
}

function roundName(playersEntering: number, last: boolean, winnersFinal: boolean): string {
  if (last && winnersFinal) return "Winners final";
  if (last) return "Final";
  if (playersEntering === 4) return "Semifinals";
  if (playersEntering === 8) return "Quarterfinals";
  return `Round of ${playersEntering}`;
}

function buildWinners(seeds: number[], winnersFinal: boolean): Node[][] {
  const size = nextPowerOf2(seeds.length);
  const present = new Set(seeds);
  const order = seedOrder(size);
  const rounds: Node[][] = [];
  let pending: { seed?: number; from?: Node }[] = order.map((seed) => (present.has(seed) ? { seed } : {}));
  let round = 1;
  let nextId = 1;

  while (pending.length > 1) {
    const games: Node[] = [];
    const winners: { from: Node }[] = [];
    const entering = pending.length;
    const last = entering === 2;
    for (let i = 0; i < pending.length; i += 2) {
      const a = pending[i];
      const b = pending[i + 1];
      const game: Node = {
        id: `W${nextId++}`,
        side: "winners",
        round,
        roundLabel: roundName(entering, last, winnersFinal),
        status: "scheduled",
      };
      if (a.seed) game.teamA = a.seed;
      if (b.seed) game.teamB = b.seed;
      if (a.from) a.from.winnerTo = [game.id, "A"];
      if (b.from) b.from.winnerTo = [game.id, "B"];
      const opening = !a.from && !b.from;
      if (opening && Boolean(game.teamA) !== Boolean(game.teamB)) {
        game.status = "bye";
        if (!game.teamA && game.teamB) {
          game.teamA = game.teamB;
          delete game.teamB;
        }
      }
      games.push(game);
      winners.push({ from: game });
    }
    rounds.push(games);
    pending = winners;
    round += 1;
  }
  return rounds;
}

/** Power-of-two winners rounds drop into a losers bracket. The last game is the losers final. */
function buildLosers(wb: Node[][]): Node[] {
  const games: Node[] = [];
  let serial = 1;
  let round = 1;
  const make = (): Node => {
    const game: Node = {
      id: `L${serial++}`,
      side: "losers",
      round,
      roundLabel: `Losers round ${round}`,
      status: "scheduled",
    };
    games.push(game);
    return game;
  };

  const first: Node[] = [];
  for (let i = 0; i < wb[0].length; i += 2) {
    const game = make();
    wb[0][i].loserTo = [game.id, "A"];
    wb[0][i + 1].loserTo = [game.id, "B"];
    first.push(game);
  }
  let incoming = first;

  for (let r = 1; r < wb.length; r++) {
    const drops = wb[r];
    if (incoming.length === drops.length * 2) {
      round += 1;
      const down: Node[] = [];
      for (let i = 0; i < incoming.length; i += 2) {
        const game = make();
        incoming[i].winnerTo = [game.id, "A"];
        incoming[i + 1].winnerTo = [game.id, "B"];
        down.push(game);
      }
      incoming = down;
    }
    if (incoming.length !== drops.length) throw new Error("Losers bracket could not be paired.");
    round += 1;
    const mixed: Node[] = [];
    for (let i = 0; i < drops.length; i++) {
      const game = make();
      incoming[i].winnerTo = [game.id, "A"];
      drops[drops.length - 1 - i].loserTo = [game.id, "B"];
      mixed.push(game);
    }
    incoming = mixed;
  }

  incoming[0].roundLabel = "Losers final";
  return games;
}

export function buildBracket(seeds: number[], format: BracketFormat): Draw {
  if (seeds.length < 2) return { ok: false, error: "Add at least two teams before building a bracket." };
  if (seeds.length > 32) return { ok: false, error: "32 teams is the maximum." };
  if (new Set(seeds).size !== seeds.length) return { ok: false, error: "Each team needs its own seed." };

  const size = nextPowerOf2(seeds.length);
  if (format === "double" && (size !== seeds.length || seeds.length < 4)) {
    return {
      ok: false,
      error: "A generated double-elimination bracket needs 4, 8, 16, or 32 teams. Use single elimination, or add and link the games yourself.",
    };
  }

  const wb = buildWinners(seeds, format === "double");
  const matches: DrawnMatch[] = wb.flat();

  if (format === "double") {
    const losers = buildLosers(wb);
    const winnersFinal = wb[wb.length - 1][0];
    const losersFinal = losers[losers.length - 1];
    winnersFinal.winnerTo = ["F1", "A"];
    losersFinal.winnerTo = ["F1", "B"];
    matches.push(...losers, {
      id: "F1",
      side: "final",
      round: 1,
      roundLabel: "Championship",
      status: "scheduled",
    }, {
      id: "F2",
      side: "final",
      round: 2,
      roundLabel: "Championship (if necessary)",
      status: "scheduled",
      isReset: true,
    });
  }

  return { ok: true, matches };
}
