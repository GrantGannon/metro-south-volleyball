"use client";

import { useState } from "react";
import { formatDayTime } from "@/lib/format";
import { useTournament } from "./TournamentProvider";

export function Announcements() {
  const { snapshot } = useTournament();
  const [open, setOpen] = useState(false);
  const [latest, ...older] = snapshot.announcements;
  if (!latest) return null;

  return (
    <section aria-label="Announcements" className="mb-4">
      <div className="tape-strip rounded-md px-4 py-3">
        <p className="text-[15px] leading-snug font-semibold">{latest.body}</p>
        <p className="mt-1 font-mono text-[11px] text-sheet/70">{formatDayTime(latest.createdAt)}</p>
      </div>
      {older.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-2 min-h-11 px-1 text-[13px] font-semibold text-tape underline underline-offset-4"
          >
            {open ? "Hide earlier announcements" : `Show ${older.length} earlier announcement${older.length > 1 ? "s" : ""}`}
          </button>
          {open && (
            <ul className="mt-1 space-y-2">
              {older.map((a) => (
                <li key={a.id} className="rounded-md bg-sheet/80 px-4 py-2.5">
                  <p className="text-[14px] leading-snug">{a.body}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-ink/60">{formatDayTime(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
