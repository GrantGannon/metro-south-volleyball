"use client";

import { useState } from "react";
import { deleteAnnouncement, postAnnouncement } from "@/app/admin/actions";
import { btn, ErrorNote, field, useAdminAction } from "@/components/admin/useAdminAction";
import { useTournament } from "@/components/TournamentProvider";
import { formatDayTime } from "@/lib/format";

export default function AnnouncementsAdmin() {
  const { snapshot } = useTournament();
  const { run, pending, error } = useAdminAction();
  const [body, setBody] = useState("");
  const [posted, setPosted] = useState(false);

  return (
    <>
      <section className="rounded-xl bg-sheet p-4">
        <label htmlFor="announcement" className="mb-2 block text-[15px] font-bold">
          New announcement
        </label>
        <textarea
          id="announcement"
          rows={3}
          maxLength={280}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setPosted(false);
          }}
          placeholder="W5 moved to Court 2 at 7:15p"
          className={`${field} py-2`}
        />
        <p className="mt-1 text-right font-mono text-[11px] text-ink/60">{body.length}/280</p>
        <ErrorNote error={error} />
        <button
          type="button"
          className={`${btn.primary} mt-2`}
          disabled={pending || !body.trim()}
          onClick={() =>
            run(() => postAnnouncement(body), () => {
              setBody("");
              setPosted(true);
            })
          }
        >
          Post announcement
        </button>
        {posted && (
          <p role="status" className="mt-2 text-[14px] font-semibold">
            Posted. It’s at the top of Now on every phone.
          </p>
        )}
      </section>

      <h2 className="mt-7 mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-ink/70">Posted</h2>
      {snapshot.announcements.length === 0 ? (
        <p className="text-[14px] text-ink/65">Nothing posted yet.</p>
      ) : (
        <ul className="space-y-2">
          {snapshot.announcements.map((a) => (
            <li key={a.id} className="flex items-start gap-3 rounded-xl bg-sheet px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-snug">{a.body}</p>
                <p className="mt-0.5 font-mono text-[11px] text-ink/60">{formatDayTime(a.createdAt)}</p>
              </div>
              <button
                type="button"
                className={btn.quiet}
                disabled={pending}
                onClick={() => {
                  if (confirm("Delete this announcement?")) run(() => deleteAnnouncement(a.id));
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
