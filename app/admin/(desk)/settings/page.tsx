"use client";

import { useState } from "react";
import { buildGeneratedBracket, updateRules, updateTournament } from "@/app/admin/actions";
import { AddTeam, TeamEditor } from "@/components/admin/MatchEditor";
import { useConfirmAction } from "@/components/admin/ConfirmSheet";
import { btn, ErrorNote, field, useAdminAction } from "@/components/admin/useAdminAction";
import { useTournament } from "@/components/TournamentProvider";
import type { BracketFormat } from "@/lib/types";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <TournamentForm />
      <TeamsForm />
      <RulesForm />
    </div>
  );
}

function TournamentForm() {
  const { snapshot } = useTournament();
  const info = snapshot.info;
  const { run, pending, error } = useAdminAction();
  const [name, setName] = useState(info.name);
  const [shortName, setShortName] = useState(info.shortName);
  const [format, setFormat] = useState<BracketFormat>(info.format);
  const [saved, setSaved] = useState(false);

  return (
    <section className="rounded-xl bg-sheet p-4">
      <h2 className="text-[15px] font-bold">Tournament</h2>
      <p className="mb-4 text-[13px] text-ink/70">The name is what families see. The format is what a new bracket will use.</p>
      <label className="mb-3 block text-[13px] font-semibold">
        Name
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          className={`${field} mt-1`}
        />
      </label>
      <label className="mb-3 block text-[13px] font-semibold">
        Short name
        <input
          value={shortName}
          onChange={(e) => {
            setShortName(e.target.value);
            setSaved(false);
          }}
          className={`${field} mt-1`}
        />
        <span className="mt-1 block text-[12px] font-normal text-ink/65">Shows large in the header. The rest of the name sits underneath.</span>
      </label>
      <fieldset className="mb-3">
        <legend className="mb-2 text-[13px] font-semibold">Elimination</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["double", "single"] as const).map((value) => (
            <label key={value} className="flex min-h-11 items-center gap-2 rounded-md bg-white px-3 text-[14px] ring-1 ring-mesh">
              <input
                type="radio"
                name="format"
                value={value}
                checked={format === value}
                onChange={() => {
                  setFormat(value);
                  setSaved(false);
                }}
                className="size-4"
              />
              {value === "double" ? "Double elimination" : "Single elimination"}
            </label>
          ))}
        </div>
      </fieldset>
      <ErrorNote error={error} />
      <button type="button" className={`${btn.primary} mt-3`} disabled={pending} onClick={() => run(() => updateTournament({ name, shortName, format }), () => setSaved(true))}>
        Save tournament
      </button>
      {saved && <p className="mt-2 text-[14px] font-semibold">Tournament saved.</p>}
    </section>
  );
}

function TeamsForm() {
  const { snapshot } = useTournament();
  const { pending, error, request, sheet } = useConfirmAction();
  const format = snapshot.info.format === "single" ? "single elimination" : "double elimination";

  return (
    <section className="rounded-xl bg-sheet p-4">
      <h2 className="text-[15px] font-bold">Teams</h2>
      <p className="mb-3 text-[13px] text-ink/70">
        Seed 1 is the top seed. Save the format above before you build. Building a {format} bracket replaces every game, and scores already entered will be deleted.
      </p>
      <ul className="space-y-2">
        {snapshot.teams.map((t) => (
          <li key={t.id}>
            <TeamEditor team={t} />
          </li>
        ))}
      </ul>
      {snapshot.teams.length === 0 && <p className="text-[14px]">No teams yet.</p>}
      <AddTeam />
      <div className="mt-4">
        <ErrorNote error={error} />
      </div>
      <button
        type="button"
        className={`${btn.secondary} mt-3`}
        disabled={pending || snapshot.teams.length < 2}
        onClick={() =>
          request({
            title: "Build bracket",
            body: snapshot.matches.length
              ? `This replaces all ${snapshot.matches.length} games with a new ${format} bracket. Scores already entered will be deleted.`
              : `This builds a ${format} bracket for ${snapshot.teams.length} teams.`,
            confirmLabel: snapshot.matches.length ? "Replace games" : "Build bracket",
            tone: snapshot.matches.length ? "whistle" : "tape",
            run: () => buildGeneratedBracket(),
          })
        }
      >
        Build bracket
      </button>
      {sheet}
    </section>
  );
}

function RulesForm() {
  const { snapshot } = useTournament();
  const r = snapshot.rules;
  const { run, pending, error } = useAdminAction();
  const [saved, setSaved] = useState(false);
  const [setsToWin, setSetsToWin] = useState(r.setsToWin);
  const [setTarget, setSetTarget] = useState(String(r.setTarget));
  const [decidingTarget, setDecidingTarget] = useState(String(r.decidingTarget));
  const [winBy, setWinBy] = useState(String(r.winBy));
  const [cap, setCap] = useState(r.cap ? String(r.cap) : "");

  const num = (v: string, set: (s: string) => void, label: string, hint?: string) => (
    <label className="text-[13px] font-semibold">
      {label}
      <input
        inputMode="numeric"
        value={v}
        onChange={(e) => {
          set(e.target.value.replace(/\D/g, ""));
          setSaved(false);
        }}
        className={`${field} mt-1 font-mono`}
      />
      {hint && <span className="mt-1 block text-[12px] font-normal text-ink/65">{hint}</span>}
    </label>
  );

  return (
    <section className="rounded-xl bg-sheet p-4">
      <h2 className="text-[15px] font-bold">Scoring rules</h2>
      <p className="mb-4 text-[13px] text-ink/70">These apply to every game from the next point on.</p>
      <fieldset className="mb-4">
        <legend className="mb-2 text-[13px] font-semibold">Match length</legend>
        <div className="grid gap-2">
          {(
            [
              [1, "Heads up", "One set"],
              [2, "Best of 3", "First team to two sets"],
              [3, "Best of 5", "First team to three sets"],
            ] as const
          ).map(([value, label, hint]) => (
            <label key={value} className="flex min-h-11 items-center gap-2 rounded-md bg-white px-3 text-[14px] ring-1 ring-mesh">
              <input
                type="radio"
                name="setsToWin"
                value={value}
                checked={setsToWin === value}
                onChange={() => {
                  setSetsToWin(value);
                  setSaved(false);
                }}
                className="size-4"
              />
              <span>
                {label}
                <span className="mt-0.5 block text-[12px] font-normal text-ink/65">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        {num(setTarget, setSetTarget, "Set to")}
        {num(decidingTarget, setDecidingTarget, "Deciding set to", "Last set of a best of 3 or best of 5. Heads up uses the regular set.")}
        {num(winBy, setWinBy, "Win by")}
        {num(cap, setCap, "Point cap", "Regular sets only. Blank means no cap.")}
      </div>
      <div className="mt-3">
        <ErrorNote error={error} />
      </div>
      <button
        type="button"
        className={`${btn.primary} mt-3`}
        disabled={pending}
        onClick={() =>
            run(
              () =>
                updateRules({
                  setsToWin,
                  setTarget: Number(setTarget),
                  decidingTarget: Number(decidingTarget),
                  winBy: Number(winBy),
                  cap: cap ? Number(cap) : null,
                }),
              () => setSaved(true),
            )
        }
      >
        Save rules
      </button>
      {saved && <p className="mt-2 text-[14px] font-semibold">Rules saved.</p>}
    </section>
  );
}
