"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  advanceWinner,
  clearScore,
  scorePoint,
  setScore,
  startGame,
  startIfNecessaryGame,
  undoAdvance,
} from "@/app/admin/actions";
import { btn, ErrorNote, field, useAdminAction } from "@/components/admin/useAdminAction";
import { MatchCard } from "@/components/MatchCard";
import { useTournament } from "@/components/TournamentProvider";
import { targetForSet } from "@/lib/scoring";
import type { MatchDTO, SetScore, Side } from "@/lib/types";

export default function ScorerPage() {
  const { id } = useParams<{ id: string }>();
  const { snapshot, teams } = useTournament();
  const { run, pending, error } = useAdminAction();
  const m = snapshot.matches.find((x) => x.id === id);

  if (!m) {
    return (
      <p className="rounded-xl bg-sheet px-4 py-6">
        Game {id} isn’t in the bracket. <Link href="/admin" className="font-semibold text-tape underline">Back to games</Link>
      </p>
    );
  }

  const canScore = Boolean(m.teamAId && m.teamBId) && !m.advanced && m.status !== "bye";
  const winner = m.winnerId ? teams.get(m.winnerId) : undefined;
  const isFirstFinal = m.side === "final" && !m.isReset;

  const pointControls = (side: Side) => {
    const points = side === "A" ? m.pointsA : m.pointsB;
    const buttons = (
      <div className="flex gap-2">
        <button
          type="button"
          aria-label={`Take a point from ${side === "A" ? "top" : "bottom"} team`}
          disabled={!canScore || pending}
          onClick={() => run(() => scorePoint(m.id, side, -1))}
          className="size-12 rounded-lg bg-white text-[18px] font-bold text-tape ring-1 ring-mesh disabled:opacity-40"
        >
          −1
        </button>
        <button
          type="button"
          aria-label={`Point to ${side === "A" ? "top" : "bottom"} team`}
          disabled={!canScore || m.status === "final" || pending}
          onClick={() => run(() => scorePoint(m.id, side, 1))}
          className="h-14 w-18 rounded-lg bg-tape text-[22px] font-bold text-sheet disabled:opacity-40"
        >
          +1
        </button>
      </div>
    );
    const numeral = (
      <span key={`${side}-${points}-${m.sets.length}`} className="point-flip block text-right font-jersey text-[64px] leading-[0.85] font-black tabular-nums">
        {points}
      </span>
    );
    return side === "A" ? (
      <div className="flex flex-col items-end gap-2">
        {buttons}
        {numeral}
      </div>
    ) : (
      <div className="flex flex-col items-end gap-2">
        {numeral}
        {buttons}
      </div>
    );
  };

  return (
    <>
      <Link href="/admin" className={btn.quiet}>
        ← All games
      </Link>

      <div className="mt-2">
        <MatchCard match={m} renderPoints={pointControls} showRouting />
      </div>

      <p className="mt-3 font-mono text-[12px] text-ink/70">
        {m.status === "live" && `Set ${m.sets.length + 1} to ${targetForSet(m.sets.length, snapshot.rules)}, win by ${snapshot.rules.winBy}.`}
        {m.status === "scheduled" && (canScore ? "Tap +1 or Start game to go live." : "Waiting for both teams.")}
        {m.status === "final" && winner && `${winner.name} won.`}
      </p>

      <div className="mt-3">
        <ErrorNote error={error} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {m.status === "scheduled" && canScore && (
          <button type="button" className={btn.secondary} disabled={pending} onClick={() => run(() => startGame(m.id))}>
            Start game
          </button>
        )}

        {(m.status === "final" || m.status === "bye") && !m.advanced && (
          <AdvanceButtons match={m} isFirstFinal={isFirstFinal} run={run} pending={pending} />
        )}

        {m.advanced && m.status !== "bye" && (
          <button type="button" className={btn.secondary} disabled={pending} onClick={() => run(() => undoAdvance(m.id))}>
            Undo advance
          </button>
        )}
        {m.advanced && m.status === "bye" && (
          <button type="button" className={btn.secondary} disabled={pending} onClick={() => run(() => undoAdvance(m.id))}>
            Undo bye advance
          </button>
        )}
      </div>

      {canScore && <CorrectScore match={m} />}

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-tape/15 pt-4">
        <Link href={`/admin/bracket#${m.id}`} className={`${btn.quiet} inline-flex items-center`}>
          Edit time, court, or teams
        </Link>
        {canScore && (m.status === "live" || m.status === "final") && (
          <button
            type="button"
            className={btn.quiet}
            disabled={pending}
            onClick={() => {
              if (confirm(`Clear every set and point for ${m.id} and mark it not started?`)) run(() => clearScore(m.id));
            }}
          >
            Clear score
          </button>
        )}
      </div>
    </>
  );
}

function AdvanceButtons({
  match: m,
  isFirstFinal,
  run,
  pending,
}: {
  match: MatchDTO;
  isFirstFinal: boolean;
  run: ReturnType<typeof useAdminAction>["run"];
  pending: boolean;
}) {
  const { teams } = useTournament();
  const winner = m.winnerId ? teams.get(m.winnerId) : undefined;
  if (!winner) return null;

  if (isFirstFinal && m.winnerId === m.teamBId) {
    return (
      <button type="button" className={btn.primary} disabled={pending} onClick={() => run(() => startIfNecessaryGame(m.id))}>
        Set up the if-necessary game
      </button>
    );
  }
  if (m.side === "final") {
    return (
      <button type="button" className={btn.primary} disabled={pending} onClick={() => run(() => advanceWinner(m.id))}>
        Confirm {winner.name} as champion
      </button>
    );
  }
  return (
    <button
      type="button"
      className={btn.primary}
      disabled={pending}
      onClick={() => {
        const dest = [m.winnerToId && `${winner.name} to ${m.winnerToId}`, m.loserToId && `loser to ${m.loserToId}`].filter(Boolean).join(", ");
        if (confirm(`Advance winner: ${dest || winner.name}?`)) run(() => advanceWinner(m.id));
      }}
    >
      Advance winner
    </button>
  );
}

function CorrectScore({ match: m }: { match: MatchDTO }) {
  const { snapshot } = useTournament();
  const { run, pending, error } = useAdminAction();
  const boxes = snapshot.rules.setsToWin * 2 - 1;
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState<string[][]>([]);
  const [points, setPoints] = useState<[string, string]>(["0", "0"]);

  const openEditor = () => {
    setSets(Array.from({ length: boxes }, (_, i) => (m.sets[i] ? m.sets[i].map(String) : ["", ""])));
    setPoints([String(m.pointsA), String(m.pointsB)]);
    setOpen(true);
  };

  const save = () => {
    const parsed: SetScore[] = [];
    for (const [a, b] of sets) {
      if (a === "" && b === "") continue;
      parsed.push([Number(a), Number(b)]);
    }
    run(() => setScore(m.id, parsed, Number(points[0] || 0), Number(points[1] || 0)), () => setOpen(false));
  };

  if (!open) {
    return (
      <button type="button" className={`${btn.quiet} mt-4`} onClick={openEditor}>
        Correct the score
      </button>
    );
  }

  const cell = (value: string, onChange: (v: string) => void, label: string) => (
    <input inputMode="numeric" pattern="[0-9]*" aria-label={label} value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} className={`${field} text-center font-mono`} />
  );

  return (
    <section className="mt-5 rounded-xl bg-sheet p-4">
      <h2 className="mb-1 text-[15px] font-bold">Correct the score</h2>
      <p className="mb-3 text-[13px] text-ink/70">Finished sets, top team first. Leave unplayed sets blank.</p>
      <div className="grid grid-cols-[5rem_1fr_1fr] items-center gap-2">
        <span />
        <span className="text-center text-[12px] font-semibold text-ink/70">Top</span>
        <span className="text-center text-[12px] font-semibold text-ink/70">Bottom</span>
        {sets.map((s, i) => (
          <div key={i} className="contents">
            <span className="text-[14px] font-semibold">Set {i + 1}</span>
            {cell(s[0], (v) => setSets((all) => all.map((x, j) => (j === i ? [v, x[1]] : x))), `Set ${i + 1} top team`)}
            {cell(s[1], (v) => setSets((all) => all.map((x, j) => (j === i ? [x[0], v] : x))), `Set ${i + 1} bottom team`)}
          </div>
        ))}
        <span className="text-[14px] font-semibold">Now</span>
        {cell(points[0], (v) => setPoints(([, b]) => [v, b]), "Current points top team")}
        {cell(points[1], (v) => setPoints(([a]) => [a, v]), "Current points bottom team")}
      </div>
      <div className="mt-3">
        <ErrorNote error={error} />
      </div>
      <div className="mt-3 flex gap-3">
        <button type="button" className={btn.primary} disabled={pending} onClick={save}>
          Save score
        </button>
        <button type="button" className={btn.secondary} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </section>
  );
}
