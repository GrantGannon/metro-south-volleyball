"use client";

import { MatchCard } from "@/components/MatchCard";
import { useTournament } from "@/components/TournamentProvider";
import { useMyTeam } from "@/components/useMyTeam";
import { finishedMatches } from "@/lib/view";

export default function ResultsPage() {
  const { snapshot } = useTournament();
  const [myTeam] = useMyTeam();
  const done = finishedMatches(snapshot.matches);

  if (done.length === 0) {
    return <p className="rounded-xl bg-sheet px-4 py-6 text-[15px]">No games have finished yet. Results show here as soon as a game ends.</p>;
  }

  return (
    <div className="space-y-3">
      {done.map((m) => (
        <MatchCard key={m.id} match={m} highlightTeamId={myTeam} />
      ))}
    </div>
  );
}
