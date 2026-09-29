"use client";

import { SectionTitle } from "@/components/AppChrome";
import { MatchCard } from "@/components/MatchCard";
import { useTournament } from "@/components/TournamentProvider";
import { UpcomingList } from "@/components/UpcomingList";
import { useMyTeam } from "@/components/useMyTeam";
import { champion, loserOf } from "@/lib/bracket";
import { formatDayTime } from "@/lib/format";
import { finishedMatches, involves, liveMatches, upcomingMatches } from "@/lib/view";

export default function MyTeamPage() {
  const { snapshot, teams } = useTournament();
  const [myTeam, setMyTeam] = useMyTeam();
  const team = myTeam ? teams.get(myTeam) : undefined;

  if (!team) {
    return (
      <>
        <p className="mb-4 text-[15px]">Pick your team to see its next game and results. This is saved on this phone.</p>
        <ul className="grid gap-2">
          {snapshot.teams.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setMyTeam(t.id)}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl bg-sheet px-4 text-left"
              >
                <span className="grid size-8 place-items-center rounded-full bg-tape text-[13px] font-bold text-sheet">{t.seed}</span>
                <span className="text-[16px] font-semibold">{t.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  }

  const mine = snapshot.matches.filter((m) => involves(m, team.id));
  const live = liveMatches(mine);
  const upcoming = upcomingMatches(mine);
  const results = finishedMatches(mine);
  const losses = results.filter((m) => loserOf(m) === team.id).length;
  const isChamp = champion(snapshot.matches) === team.id;
  const out = !isChamp && losses >= 2 && live.length === 0 && upcoming.length === 0;
  const next = upcoming[0];
  const opponentId = next ? (next.teamAId === team.id ? next.teamBId : next.teamAId) : null;
  const opponent = opponentId ? teams.get(opponentId) : undefined;

  let status: string;
  if (isChamp) status = "Champions.";
  else if (live.length) status = `Playing now on ${live[0].court ?? "court TBD"}.`;
  else if (next) {
    status = `Next: ${formatDayTime(next.startsAt)} on ${next.court ?? "court TBD"}${opponent ? ` vs ${opponent.name}` : ", opponent to be decided"}.`;
  } else if (out) status = "Out of the tournament after two losses.";
  else status = "Waiting on the next game to be scheduled.";

  return (
    <>
      <section className="rounded-xl bg-sheet px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-tape text-[14px] font-bold text-sheet">{team.seed}</span>
          <h2 className="font-jersey text-[34px] leading-none font-black uppercase">{team.name}</h2>
        </div>
        <p className="mt-3 text-[15px] font-semibold">{status}</p>
        <p className="mt-1 font-mono text-[12px] text-ink/65">
          {results.length - losses} won · {losses} lost
        </p>
        <button type="button" onClick={() => setMyTeam(null)} className="mt-3 min-h-11 text-[13px] font-semibold text-tape underline underline-offset-4">
          Change team
        </button>
      </section>

      {live.map((m) => (
        <div key={m.id} className="mt-4">
          <MatchCard match={m} highlightTeamId={team.id} />
        </div>
      ))}

      {upcoming.length > 0 && (
        <>
          <SectionTitle>Upcoming</SectionTitle>
          <UpcomingList matches={upcoming} highlightTeamId={team.id} />
        </>
      )}

      {results.length > 0 && (
        <>
          <SectionTitle>Results</SectionTitle>
          <div className="space-y-3">
            {results.map((m) => (
              <MatchCard key={m.id} match={m} highlightTeamId={team.id} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
