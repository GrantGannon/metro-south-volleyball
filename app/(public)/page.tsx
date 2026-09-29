"use client";

import { Announcements } from "@/components/Announcements";
import { SectionTitle } from "@/components/AppChrome";
import { MatchCard } from "@/components/MatchCard";
import { useTournament } from "@/components/TournamentProvider";
import { UpcomingList } from "@/components/UpcomingList";
import { useMyTeam } from "@/components/useMyTeam";
import { champion } from "@/lib/bracket";
import { formatDayTime } from "@/lib/format";
import { liveMatches, upcomingMatches } from "@/lib/view";

export default function NowPage() {
  const { snapshot, teams } = useTournament();
  const [myTeam] = useMyTeam();
  const live = liveMatches(snapshot.matches);
  const upcoming = upcomingMatches(snapshot.matches);
  const champId = champion(snapshot.matches);
  const champ = champId ? teams.get(champId) : undefined;

  const next = live.length === 0 ? upcoming[0] : undefined;
  const rest = next ? upcoming.slice(1) : upcoming;

  return (
    <>
      <Announcements />

      {champ && (
        <section className="mb-4 rounded-xl bg-sheet px-4 py-4">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink/70">Champion</p>
          <p className="font-jersey text-[40px] leading-none font-black uppercase">{champ.name}</p>
        </section>
      )}

      {live.length > 0 && (
        <section aria-label="Live now" className="space-y-4">
          {live.map((m) => (
            <MatchCard key={m.id} match={m} highlightTeamId={myTeam} />
          ))}
        </section>
      )}

      {next && (
        <section aria-label="Next game">
          <p className="mb-2 text-[14px] font-semibold">
            No games in play. Next up at <span className="font-mono">{formatDayTime(next.startsAt)}</span>.
          </p>
          <MatchCard match={next} highlightTeamId={myTeam} />
        </section>
      )}

      {rest.length > 0 && (
        <>
          <SectionTitle>Coming up</SectionTitle>
          <UpcomingList matches={rest} highlightTeamId={myTeam} />
        </>
      )}

      {live.length === 0 && upcoming.length === 0 && !champ && (
        <p className="rounded-xl bg-sheet px-4 py-6 text-[15px]">No games are scheduled yet. Check back for the first start time.</p>
      )}
    </>
  );
}
