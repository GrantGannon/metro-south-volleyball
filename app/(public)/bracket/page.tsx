"use client";

import { useState } from "react";
import { MatchCard } from "@/components/MatchCard";
import { useTournament } from "@/components/TournamentProvider";
import { useMyTeam } from "@/components/useMyTeam";
import type { BracketSide, MatchDTO } from "@/lib/types";

const SIDES: { id: BracketSide; label: string }[] = [
  { id: "winners", label: "Winners" },
  { id: "losers", label: "Losers" },
  { id: "final", label: "Finals" },
];

export default function BracketPage() {
  const { snapshot } = useTournament();
  const [myTeam] = useMyTeam();
  const [side, setSide] = useState<BracketSide>("winners");

  const rounds = new Map<number, MatchDTO[]>();
  for (const m of snapshot.matches.filter((x) => x.side === side)) {
    rounds.set(m.round, [...(rounds.get(m.round) ?? []), m]);
  }
  const ordered = [...rounds.entries()].sort(([a], [b]) => a - b);

  return (
    <>
      <div role="tablist" aria-label="Bracket" className="mb-5 grid grid-cols-3 rounded-lg bg-sheet/60 p-1">
        {SIDES.map((s) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={side === s.id}
            onClick={() => setSide(s.id)}
            className={[
              "min-h-11 rounded-md text-[14px] font-semibold",
              side === s.id ? "bg-tape text-sheet" : "text-ink/70",
            ].join(" ")}
          >
            {s.label}
          </button>
        ))}
      </div>

      {ordered.map(([round, ms]) => (
        <section key={round} className="mb-7">
          <h2 className="mb-3 flex items-baseline justify-between text-[13px] font-bold uppercase tracking-[0.08em] text-ink/70">
            {ms[0].roundLabel}
          </h2>
          <div className="space-y-3">
            {ms.map((m) => (
              <MatchCard key={m.id} match={m} highlightTeamId={myTeam} showRouting />
            ))}
          </div>
        </section>
      ))}

      {ordered.length === 0 && <p className="rounded-xl bg-sheet px-4 py-6">No games in this bracket yet.</p>}
    </>
  );
}
