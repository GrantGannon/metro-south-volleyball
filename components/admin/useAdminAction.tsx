"use client";

import { useCallback, useState, useTransition } from "react";
import type { ActionResult } from "@/app/admin/actions";
import { useTournament } from "../TournamentProvider";

export function useAdminAction() {
  const { accept } = useTournament();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    (fn: () => Promise<ActionResult>, onOk?: () => void) => {
      startTransition(async () => {
        const res = await fn();
        if (res.ok) {
          setError(null);
          accept(res.snapshot);
          onOk?.();
        } else {
          setError(res.error);
        }
      });
    },
    [accept],
  );

  return { run, pending, error, clearError: () => setError(null) };
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-md border-l-4 border-whistle bg-sheet px-3 py-2 text-[14px] font-semibold">
      {error}
    </p>
  );
}

export const btn = {
  primary: "min-h-12 rounded-lg bg-tape px-4 text-[15px] font-semibold text-sheet disabled:opacity-50",
  secondary: "min-h-12 rounded-lg bg-sheet px-4 text-[15px] font-semibold text-tape ring-1 ring-tape/30 disabled:opacity-50",
  quiet: "min-h-11 px-2 text-[14px] font-semibold text-tape underline underline-offset-4 disabled:opacity-50",
};

export const field = "min-h-11 w-full rounded-md border border-mesh bg-white px-3 text-[15px]";
