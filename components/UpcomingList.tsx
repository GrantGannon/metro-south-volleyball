"use client";

import { feederLabel } from "@/lib/bracket";
import { formatDayTime } from "@/lib/format";
import type { MatchDTO, Side } from "@/lib/types";
import { useTournament } from "./TournamentProvider";

export function UpcomingList({ matches, highlightTeamId }: { matches: MatchDTO[]; highlightTeamId?: number | null }) {
  const { snapshot, teams } = useTournament();

  const label = (m: MatchDTO, side: Side) => {
    const id = side === "A" ? m.teamAId : m.teamBId;
    const t = id ? teams.get(id) : undefined;
    if (t) {
      return (
        <span className={id === highlightTeamId ? "font-bold text-tape" : "font-semibold"}>
          <span className="mr-1.5 text-[12px] text-ink/55">{t.seed}</span>
          {t.name}
        </span>
      );
    }
    return <span className="italic text-ink/55">{feederLabel(snapshot.matches, m.id, side, teams) ?? "To be decided"}</span>;
  };

  return (
    <ol className="divide-y divide-mesh overflow-hidden rounded-xl bg-sheet">
      {matches.map((m) => (
        <li key={m.id} className="grid grid-cols-[5.5rem_1fr] gap-3 px-4 py-3">
          <div className="font-mono text-[12px] leading-5 text-ink/75">
            <div className="text-ink">{formatDayTime(m.startsAt)}</div>
            <div>{m.court ?? "Court TBD"}</div>
            <div className="text-ink/50">{m.id}</div>
          </div>
          <div className="min-w-0 space-y-0.5 text-[15px] leading-snug">
            <div className="truncate">{label(m, "A")}</div>
            <div className="truncate">{label(m, "B")}</div>
            <div className="text-[12px] text-ink/55">{m.roundLabel}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
