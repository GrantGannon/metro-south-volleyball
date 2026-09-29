"use client";

import { useState } from "react";
import { addMatch, deleteMatch, updateMatch, updateTeam, type MatchEdit } from "@/app/admin/actions";
import { btn, ErrorNote, field, useAdminAction } from "@/components/admin/useAdminAction";
import { useTournament } from "@/components/TournamentProvider";
import { formatDayTime, toLocalInput } from "@/lib/format";
import type { BracketSide, MatchDTO, MatchStatus, Side, TeamDTO } from "@/lib/types";

const SIDE_LABEL: Record<BracketSide, string> = { winners: "Winners", losers: "Losers", final: "Finals" };

export function TeamEditor({ team }: { team: TeamDTO }) {
  const { run, pending, error } = useAdminAction();
  const [name, setName] = useState(team.name);
  const [shortName, setShortName] = useState(team.shortName);
  const [seed, setSeed] = useState(String(team.seed));
  const dirty = name !== team.name || shortName !== team.shortName || seed !== String(team.seed);

  return (
    <div className="rounded-xl bg-sheet p-3">
      <div className="grid grid-cols-[4rem_1fr_5rem] gap-2">
        <label className="text-[12px] font-semibold text-ink/70">
          Seed
          <input inputMode="numeric" value={seed} onChange={(e) => setSeed(e.target.value.replace(/\D/g, ""))} className={field} />
        </label>
        <label className="text-[12px] font-semibold text-ink/70">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="text-[12px] font-semibold text-ink/70">
          Short
          <input value={shortName} onChange={(e) => setShortName(e.target.value)} className={field} />
        </label>
      </div>
      {dirty && (
        <button type="button" className={`${btn.primary} mt-2`} disabled={pending} onClick={() => run(() => updateTeam(team.id, name, shortName, Number(seed)))}>
          Save team
        </button>
      )}
      <div className="mt-2">
        <ErrorNote error={error} />
      </div>
    </div>
  );
}

function toEdit(m: MatchDTO): MatchEdit {
  return {
    roundLabel: m.roundLabel,
    side: m.side,
    round: m.round,
    court: m.court ?? "",
    startsAt: toLocalInput(m.startsAt),
    status: m.status,
    teamAId: m.teamAId,
    teamBId: m.teamBId,
    winnerToId: m.winnerToId,
    winnerToSlot: m.winnerToSlot,
    loserToId: m.loserToId,
    loserToSlot: m.loserToSlot,
    isReset: m.isReset,
  };
}

export function MatchEditor({ match: m, panel, onClose }: { match: MatchDTO; panel?: boolean; onClose?: () => void }) {
  const { snapshot, teams } = useTournament();
  const { run, pending, error } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<MatchEdit>(() => toEdit(m));
  const set = <K extends keyof MatchEdit>(k: K, v: MatchEdit[K]) => setEdit((e) => ({ ...e, [k]: v }));
  const others = snapshot.matches.filter((x) => x.id !== m.id);
  const teamName = (id: number | null) => (id ? teams.get(id)?.name ?? "?" : "Open");

  if (!panel && !open) {
    return (
      <button
        type="button"
        onClick={() => {
          setEdit(toEdit(m));
          setOpen(true);
        }}
        className="grid min-h-14 w-full grid-cols-[3.5rem_1fr] gap-3 rounded-xl bg-sheet px-4 py-3 text-left"
      >
        <span className="font-mono text-[14px] font-medium">{m.id}</span>
        <span className="min-w-0 text-[14px] leading-snug">
          <span className="block truncate font-semibold">
            {teamName(m.teamAId)} vs {m.status === "bye" ? "bye" : teamName(m.teamBId)}
          </span>
          <span className="block font-mono text-[12px] text-ink/65">
            {SIDE_LABEL[m.side]} · {m.roundLabel} · {m.court ?? "Court TBD"} · {formatDayTime(m.startsAt)}
          </span>
          <span className="block font-mono text-[12px] text-ink/65">
            {m.winnerToId ? `W→${m.winnerToId}${m.winnerToSlot}` : "W→none"} · {m.loserToId ? `L→${m.loserToId}${m.loserToSlot}` : "L→out"}
          </span>
        </span>
      </button>
    );
  }

  const teamSelect = (key: "teamAId" | "teamBId", label: string) => (
    <label className="text-[12px] font-semibold text-ink/70">
      {label}
      <select value={edit[key] ?? ""} onChange={(e) => set(key, e.target.value ? Number(e.target.value) : null)} className={field}>
        <option value="">Open slot</option>
        {snapshot.teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.seed}. {t.name}
          </option>
        ))}
      </select>
    </label>
  );

  const destSelect = (idKey: "winnerToId" | "loserToId", slotKey: "winnerToSlot" | "loserToSlot", label: string, none: string) => (
    <div className="grid grid-cols-[1fr_5rem] gap-2">
      <label className="text-[12px] font-semibold text-ink/70">
        {label}
        <select value={edit[idKey] ?? ""} onChange={(e) => set(idKey, e.target.value || null)} className={field}>
          <option value="">{none}</option>
          {others.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id} · {teamName(o.teamAId)} / {o.status === "bye" ? "bye" : teamName(o.teamBId)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-[12px] font-semibold text-ink/70">
        Slot
        <select value={edit[slotKey] ?? ""} onChange={(e) => set(slotKey, (e.target.value || null) as Side | null)} className={field} disabled={!edit[idKey]}>
          <option value="">–</option>
          <option value="A">Top</option>
          <option value="B">Bottom</option>
        </select>
      </label>
    </div>
  );

  return (
    <div className="space-y-3 rounded-xl bg-sheet p-4 ring-2 ring-tape">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[16px] font-semibold">{m.id}</p>
        <button type="button" className={btn.quiet} onClick={() => (panel ? onClose?.() : setOpen(false))}>
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-[12px] font-semibold text-ink/70">
          Court
          <input value={edit.court} onChange={(e) => set("court", e.target.value)} className={field} placeholder="Court 1" />
        </label>
        <label className="text-[12px] font-semibold text-ink/70">
          Start time
          <input type="datetime-local" value={edit.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={field} />
        </label>
      </div>

      <div className="grid grid-cols-[1fr_1fr_4rem] gap-2">
        <label className="text-[12px] font-semibold text-ink/70">
          Round name
          <input value={edit.roundLabel} onChange={(e) => set("roundLabel", e.target.value)} className={field} />
        </label>
        <label className="text-[12px] font-semibold text-ink/70">
          Bracket
          <select value={edit.side} onChange={(e) => set("side", e.target.value as BracketSide)} className={field}>
            <option value="winners">Winners</option>
            <option value="losers">Losers</option>
            <option value="final">Finals</option>
          </select>
        </label>
        <label className="text-[12px] font-semibold text-ink/70">
          Round
          <input inputMode="numeric" value={edit.round} onChange={(e) => set("round", Number(e.target.value.replace(/\D/g, "")) || 1)} className={field} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {teamSelect("teamAId", "Top team")}
        {teamSelect("teamBId", "Bottom team")}
      </div>

      <label className="block text-[12px] font-semibold text-ink/70">
        Game type
        <select
          value={edit.status === "bye" ? "bye" : "game"}
          onChange={(e) => set("status", (e.target.value === "bye" ? "bye" : m.status === "bye" ? "scheduled" : m.status) as MatchStatus)}
          className={field}
          disabled={m.status === "live" || m.status === "final"}
        >
          <option value="game">Game</option>
          <option value="bye">Bye (top team moves on)</option>
        </select>
      </label>

      {destSelect("winnerToId", "winnerToSlot", "Winner goes to", "Nowhere (final)")}
      {destSelect("loserToId", "loserToSlot", "Loser goes to", "Out of the tournament")}

      {m.side === "final" && (
        <label className="flex min-h-11 items-center gap-2 text-[14px]">
          <input type="checkbox" checked={edit.isReset} onChange={(e) => set("isReset", e.target.checked)} className="size-5" />
          This is the if-necessary championship game
        </label>
      )}

      <ErrorNote error={error} />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btn.primary} disabled={pending} onClick={() => run(() => updateMatch(m.id, edit), () => { if (!panel) setOpen(false); })}>
          Save game
        </button>
        <button
          type="button"
          className={btn.quiet}
          disabled={pending}
          onClick={() => {
            if (confirm(`Delete game ${m.id}? Links pointing to it will be cleared.`)) {
              run(() => deleteMatch(m.id), () => (panel ? onClose?.() : setOpen(false)));
            }
          }}
        >
          Delete game
        </button>
      </div>
    </div>
  );
}

export function AddGame() {
  const { run, pending, error } = useAdminAction();
  const [code, setCode] = useState("");
  const [side, setSide] = useState<BracketSide>("winners");
  const [round, setRound] = useState("1");
  const [label, setLabel] = useState("");

  return (
    <section className="mt-8 max-w-xl rounded-xl bg-sheet p-4">
      <h2 className="mb-3 text-[15px] font-bold">Add a game</h2>
      <div className="grid grid-cols-[5rem_1fr_4rem] gap-2">
        <label className="text-[12px] font-semibold text-ink/70">
          Code
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="W10" className={field} />
        </label>
        <label className="text-[12px] font-semibold text-ink/70">
          Bracket
          <select value={side} onChange={(e) => setSide(e.target.value as BracketSide)} className={field}>
            <option value="winners">Winners</option>
            <option value="losers">Losers</option>
            <option value="final">Finals</option>
          </select>
        </label>
        <label className="text-[12px] font-semibold text-ink/70">
          Round
          <input inputMode="numeric" value={round} onChange={(e) => setRound(e.target.value.replace(/\D/g, ""))} className={field} />
        </label>
      </div>
      <label className="mt-2 block text-[12px] font-semibold text-ink/70">
        Round name
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Quarterfinals" className={field} />
      </label>
      <div className="mt-3">
        <ErrorNote error={error} />
      </div>
      <button
        type="button"
        className={`${btn.primary} mt-3`}
        disabled={pending || !code}
        onClick={() =>
          run(() => addMatch(code, side, Number(round) || 1, label), () => {
            setCode("");
            setLabel("");
          })
        }
      >
        Add game
      </button>
    </section>
  );
}
