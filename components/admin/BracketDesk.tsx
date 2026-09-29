"use client";

import { useState } from "react";
import { AddGame, MatchEditor } from "@/components/admin/MatchEditor";
import { useTournament } from "@/components/TournamentProvider";
import { feederLabel } from "@/lib/bracket";
import { formatDayTime } from "@/lib/format";
import type { BracketSide, MatchDTO, Side } from "@/lib/types";

type Place = { match: MatchDTO; col: number; rowStart: number; rowSpan: number };

const BANDS: { side: BracketSide; title: string; layout: "tree" | "row" }[] = [
  { side: "winners", title: "Winners", layout: "tree" },
  { side: "losers", title: "Losers", layout: "tree" },
  { side: "final", title: "Finals", layout: "row" },
];

function slotOrder(m: MatchDTO) {
  return m.winnerToSlot === "B" ? 1 : 0;
}

function layoutMatches(matches: MatchDTO[], mode: "tree" | "row"): { places: Place[]; columns: string[]; rowCount: number } {
  const sorted = [...matches].sort((a, b) => a.round - b.round || a.order - b.order);
  if (sorted.length === 0) return { places: [], columns: [], rowCount: 0 };

  if (mode === "row") {
    return {
      places: sorted.map((match, i) => ({ match, col: i + 1, rowStart: 1, rowSpan: 1 })),
      columns: sorted.map((m) => m.roundLabel),
      rowCount: 1,
    };
  }

  const rounds = [...new Set(sorted.map((m) => m.round))].sort((a, b) => a - b);
  const colOf = new Map(rounds.map((r, i) => [r, i + 1]));
  const columns = rounds.map((r) => sorted.find((m) => m.round === r)!.roundLabel);
  const ids = new Set(sorted.map((m) => m.id));
  const childrenOf = new Map<string, MatchDTO[]>();
  for (const m of sorted) {
    if (m.winnerToId && ids.has(m.winnerToId)) {
      const list = childrenOf.get(m.winnerToId) ?? [];
      list.push(m);
      childrenOf.set(m.winnerToId, list);
    }
  }
  for (const list of childrenOf.values()) list.sort((a, b) => slotOrder(a) - slotOrder(b) || a.order - b.order);

  const roots = sorted.filter((m) => !(m.winnerToId && ids.has(m.winnerToId)));
  const places: Place[] = [];
  const seen = new Set<string>();
  let cursor = 1;

  const walk = (m: MatchDTO): { start: number; end: number } => {
    if (seen.has(m.id)) {
      const existing = places.find((p) => p.match.id === m.id);
      return existing
        ? { start: existing.rowStart, end: existing.rowStart + existing.rowSpan }
        : { start: cursor, end: cursor + 1 };
    }
    seen.add(m.id);
    const kids = childrenOf.get(m.id) ?? [];
    if (kids.length === 0) {
      const start = cursor;
      cursor += 1;
      places.push({ match: m, col: colOf.get(m.round)!, rowStart: start, rowSpan: 1 });
      return { start, end: start + 1 };
    }
    const ranges = kids.map(walk);
    const start = ranges[0].start;
    const end = ranges[ranges.length - 1].end;
    places.push({ match: m, col: colOf.get(m.round)!, rowStart: start, rowSpan: Math.max(1, end - start) });
    return { start, end };
  };

  for (const root of roots) walk(root);
  for (const m of sorted) {
    if (seen.has(m.id)) continue;
    const start = cursor;
    cursor += 1;
    places.push({ match: m, col: colOf.get(m.round)!, rowStart: start, rowSpan: 1 });
    seen.add(m.id);
  }

  return { places, columns, rowCount: Math.max(1, cursor - 1) };
}

function slotWord(slot: Side | null) {
  if (slot === "A") return "top";
  if (slot === "B") return "bottom";
  return "";
}

export function BracketDesk() {
  const { snapshot, teams } = useTournament();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = snapshot.matches.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-6">
      <div className="min-w-0">
        <p className="max-w-3xl text-[15px] leading-snug">
          Navy marks where the winner goes. Red marks where the loser goes. Top and bottom are the two sides of that next game.
        </p>
        <p className="mt-2 mb-6 font-mono text-[12px] text-ink/70">Codes on the cards — W1, L3, F1 — are the names you edit. The printed sheet uses its own letters.</p>

        <div className="space-y-10">
          {BANDS.map((band) => (
            <Band
              key={band.side}
              title={band.title}
              matches={snapshot.matches.filter((m) => m.side === band.side)}
              layout={band.layout}
              selectedId={selectedId}
              winnerDest={selected?.winnerToId ?? null}
              loserDest={selected?.loserToId ?? null}
              onSelect={setSelectedId}
              teams={teams}
              all={snapshot.matches}
            />
          ))}
        </div>
        <AddGame />
      </div>

      <aside className="mt-6 lg:sticky lg:top-24 lg:mt-0">
        {selected ? (
          <MatchEditor key={selected.id} match={selected} panel onClose={() => setSelectedId(null)} />
        ) : (
          <div className="rounded-xl bg-sheet p-4 ring-2 ring-tape">
            <p className="font-jersey text-[32px] uppercase leading-none tracking-wide">Pick a game</p>
            <p className="mt-3 text-[14px] leading-snug">The board stays up while you change the court, the time, and where the winner and loser go.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Band({
  title,
  matches,
  layout,
  selectedId,
  winnerDest,
  loserDest,
  onSelect,
  teams,
  all,
}: {
  title: string;
  matches: MatchDTO[];
  layout: "tree" | "row";
  selectedId: string | null;
  winnerDest: string | null;
  loserDest: string | null;
  onSelect: (id: string) => void;
  teams: Map<number, { seed: number; name: string }>;
  all: MatchDTO[];
}) {
  const { places, columns, rowCount } = layoutMatches(matches, layout);
  const ids = new Set(matches.map((m) => m.id));

  return (
    <section aria-label={title}>
      <h2 className="mb-3 font-jersey text-[28px] uppercase leading-none tracking-wide text-tape">{title}</h2>
      {places.length === 0 ? (
        <p className="rounded-xl bg-sheet px-4 py-5 text-[14px]">No games on this side yet.</p>
      ) : (
        <div className="overflow-x-hidden pb-1">
          <div
            className="grid w-full gap-x-3"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              gridTemplateRows: `auto repeat(${rowCount}, minmax(6.75rem, auto))`,
            }}
          >
            {columns.map((label, i) => (
              <h3
                key={`${label}-${i}`}
                style={{ gridColumn: i + 1, gridRow: 1 }}
                className="pb-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-ink/55"
              >
                {label}
              </h3>
            ))}
            {places.map((p) => (
              <div
                key={p.match.id}
                style={{ gridColumn: p.col, gridRow: `${p.rowStart + 1} / span ${p.rowSpan}` }}
                className="flex items-center py-1"
              >
                <GameCard
                  match={p.match}
                  selected={p.match.id === selectedId}
                  winnerHere={p.match.id === winnerDest}
                  loserHere={p.match.id === loserDest}
                  connect={Boolean(p.match.winnerToId && ids.has(p.match.winnerToId))}
                  teams={teams}
                  all={all}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function GameCard({
  match: m,
  selected,
  winnerHere,
  loserHere,
  connect,
  teams,
  all,
  onSelect,
}: {
  match: MatchDTO;
  selected: boolean;
  winnerHere: boolean;
  loserHere: boolean;
  connect: boolean;
  teams: Map<number, { seed: number; name: string }>;
  all: MatchDTO[];
  onSelect: (id: string) => void;
}) {
  const ring = selected
    ? "bg-white ring-2 ring-tape"
    : loserHere
      ? "bg-sheet ring-2 ring-whistle"
      : winnerHere
        ? "bg-court/70 ring-2 ring-tape"
        : "bg-sheet ring-1 ring-tape/15";

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => onSelect(m.id)}
        aria-pressed={selected}
        className={`w-full rounded-lg px-2.5 py-2 text-left ${ring}`}
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[13px] font-semibold">
            {m.id}
            {m.status === "live" && <span className="ml-1.5 text-whistle">Live</span>}
            {m.status === "final" && <span className="ml-1.5 text-ink/50">Final</span>}
          </span>
          <span className="truncate font-mono text-[11px] text-ink/60">
            {m.status === "bye" ? "Bye" : formatDayTime(m.startsAt)}
            {m.court ? ` · ${m.court}` : ""}
          </span>
        </span>
        {(winnerHere || loserHere) && (
          <span className="mt-1 flex flex-wrap gap-1">
            {winnerHere && <span className="tape-strip px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">Winner lands here</span>}
            {loserHere && <span className="bg-whistle px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sheet">Loser lands here</span>}
          </span>
        )}
        <span className="mt-1.5 block space-y-1">
          <SlotLine slot="A" match={m} teams={teams} all={all} />
          {m.status !== "bye" && (
            <>
              <span className="net block" />
              <SlotLine slot="B" match={m} teams={teams} all={all} />
            </>
          )}
        </span>
        <span className="mt-1.5 block font-mono text-[11px] leading-snug">
          <span className="text-tape">Winner → {m.winnerToId ? `${m.winnerToId} ${slotWord(m.winnerToSlot)}` : "end"}</span>
          {m.status !== "bye" && (
            <span className="mt-0.5 block text-whistle">Loser → {m.loserToId ? `${m.loserToId} ${slotWord(m.loserToSlot)}` : "out"}</span>
          )}
        </span>
      </button>
      {connect && <span aria-hidden className="absolute top-1/2 -right-3 h-0.5 w-3 bg-tape" />}
    </div>
  );
}

function SlotLine({
  slot,
  match: m,
  teams,
  all,
}: {
  slot: Side;
  match: MatchDTO;
  teams: Map<number, { seed: number; name: string }>;
  all: MatchDTO[];
}) {
  const teamId = slot === "A" ? m.teamAId : m.teamBId;
  const team = teamId ? teams.get(teamId) : null;
  const feed = feederLabel(all, m.id, slot);
  const text = team ? `${team.seed} ${team.name}` : feed ?? "Open";
  return (
    <span className="flex min-w-0 items-baseline gap-1.5">
      <span className="w-7 shrink-0 font-mono text-[10px] uppercase tracking-wide text-ink/45">{slot === "A" ? "Top" : "Bot"}</span>
      <span className={`min-w-0 truncate font-jersey text-[18px] uppercase leading-none tracking-wide ${team ? "" : "text-ink/45"}`}>{text}</span>
    </span>
  );
}
