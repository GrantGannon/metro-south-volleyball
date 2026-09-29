"use client";

import { AddGame, MatchEditor, TeamEditor } from "@/components/admin/MatchEditor";
import { BracketDesk } from "@/components/admin/BracketDesk";
import { useTournament } from "@/components/TournamentProvider";

export default function BracketEditor() {
  const { snapshot } = useTournament();

  return (
    <>
      <div className="lg:hidden">
        <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-ink/70">Teams</h2>
        <ul className="mb-8 space-y-2">
          {snapshot.teams.map((t) => (
            <li key={t.id}>
              <TeamEditor team={t} />
            </li>
          ))}
        </ul>

        <h2 className="mb-1 text-[13px] font-bold uppercase tracking-[0.08em] text-ink/70">Games</h2>
        <p className="mb-3 text-[13px] text-ink/70">Each game says where its winner and loser go. Times are Central. On a laptop this page opens the full bracket.</p>
        <ul className="space-y-2">
          {snapshot.matches.map((m) => (
            <li key={m.id} id={m.id} className="scroll-mt-28">
              <MatchEditor match={m} />
            </li>
          ))}
        </ul>
        <AddGame />
      </div>

      <div className="hidden lg:block">
        <BracketDesk />
        <details className="mt-10 max-w-xl">
          <summary className="cursor-pointer text-[15px] font-semibold">Team names and seeds</summary>
          <ul className="mt-3 space-y-2">
            {snapshot.teams.map((t) => (
              <li key={t.id}>
                <TeamEditor team={t} />
              </li>
            ))}
          </ul>
        </details>
      </div>
    </>
  );
}
