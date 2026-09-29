"use client";

import type { ReactNode } from "react";
import { feederLabel } from "@/lib/bracket";
import { formatDayTime } from "@/lib/format";
import { setsWon } from "@/lib/scoring";
import type { MatchDTO, Side } from "@/lib/types";
import { useTournament } from "./TournamentProvider";

interface Props {
  match: MatchDTO;
  highlightTeamId?: number | null;
  showRouting?: boolean;
  /** Replaces the point numerals, used by the admin scorer. */
  renderPoints?: (side: Side) => ReactNode;
  footer?: ReactNode;
}

export function StatusLabel({ match }: { match: MatchDTO }) {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-whistle">
        <span className="size-2 rounded-full bg-whistle" aria-hidden />
        Live
      </span>
    );
  }
  if (match.status === "final") return <span className="font-semibold">Final</span>;
  if (match.status === "bye") return <span>Bye</span>;
  return <span className="font-mono">{formatDayTime(match.startsAt)}</span>;
}

function routing(m: MatchDTO): string | null {
  if (m.side === "final") return null;
  const parts: string[] = [];
  if (m.winnerToId) parts.push(`Winner to ${m.winnerToId}`);
  parts.push(m.loserToId ? `Loser to ${m.loserToId}` : "Loser is out");
  return parts.join(" · ");
}

export function MatchCard({ match, highlightTeamId, showRouting, renderPoints, footer }: Props) {
  const { snapshot, teams } = useTournament();
  const boxes = snapshot.rules.setsToWin * 2 - 1;
  const won = setsWon(match.sets);
  const isMine = highlightTeamId != null && (match.teamAId === highlightTeamId || match.teamBId === highlightTeamId);

  const half = (side: Side) => {
    const teamId = side === "A" ? match.teamAId : match.teamBId;
    const team = teamId ? teams.get(teamId) : undefined;
    const points = side === "A" ? match.pointsA : match.pointsB;
    const setCount = side === "A" ? won.a : won.b;
    const lost = match.status === "final" && match.winnerId != null && match.winnerId !== teamId;
    const mine = highlightTeamId != null && teamId === highlightTeamId;

    const setRow = (
      <div className="flex gap-1.5" aria-label="Sets">
        {Array.from({ length: boxes }, (_, i) => {
          const set = match.sets[i];
          const current = match.status === "live" && i === match.sets.length;
          const mineWon = set && (side === "A" ? set[0] > set[1] : set[1] > set[0]);
          return (
            <span
              key={i}
              className={[
                "grid h-7 w-8 place-items-center rounded-[4px] font-mono text-[13px] tabular-nums",
                current ? "bg-whistle" : set ? "bg-white ring-1 ring-mesh" : "ring-1 ring-mesh",
                mineWon ? "font-bold text-ink" : "text-ink/60",
              ].join(" ")}
            >
              {set ? (side === "A" ? set[0] : set[1]) : ""}
              {current && <span className="sr-only">Current set</span>}
            </span>
          );
        })}
      </div>
    );

    const name = team ? (
      <div className="flex min-w-0 items-baseline gap-2">
        <span
          className={[
            "truncate font-jersey text-[30px] leading-[1.05] font-extrabold uppercase tracking-tight",
            lost ? "text-ink/45" : "text-ink",
          ].join(" ")}
        >
          {team.name}
        </span>
        {mine && <span className="shrink-0 rounded-full bg-tape px-2 py-0.5 text-[11px] font-semibold text-sheet">Your team</span>}
      </div>
    ) : (
      <span className="block py-1 text-[15px] italic text-ink/55">{feederLabel(snapshot.matches, match.id, side) ?? "To be decided"}</span>
    );

    const seed = (
      <span
        className={[
          "grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-bold",
          team ? "bg-tape text-sheet" : "ring-1 ring-mesh text-ink/40",
        ].join(" ")}
        aria-label={team ? `Seed ${team.seed}` : undefined}
      >
        {team?.seed ?? "–"}
      </span>
    );

    let numeral: ReactNode = null;
    if (renderPoints) numeral = renderPoints(side);
    else if (match.status === "live") {
      numeral = (
        <span key={`${side}-${points}-${match.sets.length}`} className="point-flip font-jersey text-[60px] leading-[0.85] font-black tabular-nums">
          {points}
        </span>
      );
    } else if (match.status === "final") {
      numeral = <span className={["font-jersey text-[40px] leading-none font-black tabular-nums", lost ? "text-ink/45" : ""].join(" ")}>{setCount}</span>;
    }

    const nameRow = (
      <div className="flex min-w-0 items-center gap-2.5">
        {seed}
        <div className="min-w-0 flex-1">{name}</div>
      </div>
    );
    const showSets = match.status !== "scheduled" || match.sets.length > 0;
    const sets = showSets && <div className={["pl-[2.625rem]", side === "A" ? "mt-1.5" : "mb-1.5"].join(" ")}>{setRow}</div>;

    return (
      <div className={["flex gap-3 px-4 py-3", side === "A" ? "items-end" : "items-start", mine ? "bg-white/70" : ""].join(" ")}>
        <div className="min-w-0 flex-1">
          {side === "A" ? (
            <>
              {nameRow}
              {sets}
            </>
          ) : (
            <>
              {sets}
              {nameRow}
            </>
          )}
        </div>
        {numeral != null && <div className={side === "A" ? "self-end" : "self-start"}>{numeral}</div>}
      </div>
    );
  };

  if (match.status === "bye") {
    const team = match.teamAId ? teams.get(match.teamAId) : undefined;
    return (
      <article className="flex items-center gap-3 rounded-xl bg-sheet/70 px-4 py-2.5 text-sm">
        <span className="grid size-7 place-items-center rounded-full bg-tape text-[12px] font-bold text-sheet">{team?.seed}</span>
        <span className="flex-1 truncate font-semibold">{team?.name ?? "Open slot"}</span>
        <span className="font-mono text-[12px] text-ink/60">Bye to {match.winnerToId}</span>
      </article>
    );
  }

  return (
    <article
      className={[
        "overflow-hidden rounded-xl bg-sheet shadow-[0_1px_0_rgb(16_32_51/0.08),0_8px_24px_-12px_rgb(16_32_51/0.35)]",
        isMine ? "ring-2 ring-tape" : "",
      ].join(" ")}
      aria-label={`Game ${match.id}`}
    >
      <header className="flex items-center justify-between px-4 pt-3 text-[13px]">
        <StatusLabel match={match} />
        <span className="text-ink/60">
          <span className="font-mono">{match.id}</span> · {match.roundLabel}
        </span>
      </header>
      {half("A")}
      <div className="net" aria-hidden />
      {half("B")}
      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-mesh px-4 py-2.5 font-mono text-[12px] text-ink/70">
        <span>
          {match.court ?? "Court TBD"}
          {match.status !== "scheduled" && match.startsAt ? `  ${formatDayTime(match.startsAt)}` : ""}
        </span>
        {showRouting && routing(match) && <span>{routing(match)}</span>}
      </footer>
      {footer}
    </article>
  );
}
