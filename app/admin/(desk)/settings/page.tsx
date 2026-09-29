"use client";

import { useState } from "react";
import { updateRules } from "@/app/admin/actions";
import { btn, ErrorNote, field, useAdminAction } from "@/components/admin/useAdminAction";
import { useTournament } from "@/components/TournamentProvider";

export default function SettingsPage() {
  const { snapshot } = useTournament();
  const r = snapshot.rules;
  const { run, pending, error } = useAdminAction();
  const [saved, setSaved] = useState(false);
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
      <p className="mb-4 text-[13px] text-ink/70">Best of 3. These apply to every game from the next point on.</p>
      <div className="grid grid-cols-2 gap-3">
        {num(setTarget, setSetTarget, "Sets 1–2 to")}
        {num(decidingTarget, setDecidingTarget, "Deciding set to")}
        {num(winBy, setWinBy, "Win by")}
        {num(cap, setCap, "Point cap", "Sets 1–2 only. Blank means no cap.")}
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
            () => updateRules({ setTarget: Number(setTarget), decidingTarget: Number(decidingTarget), winBy: Number(winBy), cap: cap ? Number(cap) : null }),
            () => setSaved(true),
          )
        }
      >
        Save rules
      </button>
      {saved && (
        <p role="status" className="mt-2 text-[14px] font-semibold">
          Rules saved.
        </p>
      )}
    </section>
  );
}
