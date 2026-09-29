"use client";

import Link from "next/link";
import { useTournament } from "@/components/TournamentProvider";
import { feederLabel } from "@/lib/bracket";
import { formatDayTime } from "@/lib/format";
import { setsWon } from "@/lib/scoring";
import type { MatchDTO, Side } from "@/lib/types";
import { finishedMatches, liveMatches, upcomingMatches } from "@/lib/view";

export default function GamesBoard() {
  const { snapshot } = useTournament();
  const ms = snapshot.matches;
  const live = liveMatches(ms);
  const toAdvance = ms.filter((m) => (m.status === "final" || (m.status === "bye" && m.winnerToId)) && !m.advanced);
  const upcoming = upcomingMatches(ms);
  const ready = upcoming.filter((m) => m.teamAId && m.teamBId);
  const waiting = upcoming.filter((m) => !m.teamAId || !m.teamBId);
  const done = finishedMatches(ms).filter((m) => m.advanced);

  return (
    <>
      <Group title="Live" empty="No games in play.">
        {live}
      </Group>
      <Group title="Ready to advance" empty="Nothing waiting to advance.">
        {toAdvance}
      </Group>
      <Group title="Ready to start" empty="No games have both teams yet.">
        {ready}
      </Group>
      <Group title="Waiting on earlier games">{waiting}</Group>
      <Group title="Done">{done}</Group>
    </>
  );
}

function Group({ title, empty, children }: { title: string; empty?: string; children: MatchDTO[] }) {
  if (children.length === 0 && !empty) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-ink/70">{title}</h2>
      {children.length === 0 ? (
        <p className="text-[14px] text-ink/65">{empty}</p>
      ) : (
        <ul className="divide-y divide-mesh overflow-hidden rounded-xl bg-sheet">
          {children.map((m) => (
            <li key={m.id}>
              <Row match={m} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Row({ match: m }: { match: MatchDTO }) {
  const { snapshot, teams } = useTournament();
  const name = (side: Side) => {
    const id = side === "A" ? m.teamAId : m.teamBId;
    return id ? teams.get(id)?.name : feederLabel(snapshot.matches, m.id, side) ?? (m.status === "bye" ? "Bye" : "TBD");
  };
  const w = setsWon(m.sets);
  const score =
    m.status === "live" ? `${m.pointsA}–${m.pointsB} · sets ${w.a}–${w.b}` : m.status === "final" ? `Sets ${w.a}–${w.b}` : null;

  return (
    <Link href={`/admin/match/${m.id}`} className="grid min-h-16 grid-cols-[3.5rem_1fr_auto] items-center gap-3 px-4 py-3">
      <span className="font-mono text-[14px] font-medium">{m.id}</span>
      <span className="min-w-0 text-[15px] leading-snug">
        <span className="block truncate font-semibold">{name("A")}</span>
        <span className="block truncate font-semibold">{name("B")}</span>
        <span className="block font-mono text-[12px] text-ink/60">
          {m.court ?? "Court TBD"} · {formatDayTime(m.startsAt)}
        </span>
      </span>
      <span className={["text-right font-mono text-[13px]", m.status === "live" ? "font-semibold text-whistle" : "text-ink/70"].join(" ")}>
        {score ?? "Open"}
      </span>
    </Link>
  );
}
