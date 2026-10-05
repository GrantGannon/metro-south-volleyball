"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/app/admin/actions";
import { btn, ErrorNote, useAdminAction } from "./useAdminAction";

interface Ask {
  kicker?: string;
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "tape" | "whistle";
  run: () => Promise<ActionResult>;
  onOk?: () => void;
}

export function useConfirmAction() {
  const action = useAdminAction();
  const [ask, setAsk] = useState<Ask | null>(null);

  const { clearError } = action;
  const request = useCallback(
    (next: Ask) => {
      clearError();
      setAsk(next);
    },
    [clearError],
  );

  const cancel = () => {
    if (action.pending) return;
    setAsk(null);
    action.clearError();
  };

  const sheet = (
    <ConfirmSheet
      open={ask != null}
      kicker={ask?.kicker}
      title={ask?.title ?? ""}
      body={ask?.body ?? ""}
      confirmLabel={ask?.confirmLabel ?? "Confirm"}
      tone={ask?.tone}
      pending={action.pending}
      error={action.error}
      onCancel={cancel}
      onConfirm={() => {
        if (!ask) return;
        action.run(ask.run, () => {
          setAsk(null);
          ask.onOk?.();
        });
      }}
    />
  );

  return { ...action, request, sheet };
}

export function ConfirmSheet({
  open,
  kicker,
  title,
  body,
  confirmLabel,
  tone = "tape",
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  kicker?: string;
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "tape" | "whistle";
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return <ConfirmDialog {...{ kicker, title, body, confirmLabel, tone, pending, error, onConfirm, onCancel }} />;
}

function ConfirmDialog({
  kicker,
  title,
  body,
  confirmLabel,
  tone = "tape",
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  kicker?: string;
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "tape" | "whistle";
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!node.open) node.showModal();
    return () => {
      if (node.open) node.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      className="confirm-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="flex h-full items-end justify-center" onClick={(e) => e.target === e.currentTarget && onCancel()}>
        <div className="sheet-up w-full max-w-xl overflow-hidden rounded-t-2xl bg-sheet shadow-[0_-12px_40px_-16px_rgb(16_32_51/0.55)]">
          <div className="tape-strip px-5 pt-4 pb-3">
            {kicker && <p className="font-mono text-[12px] tracking-wide text-sheet/70">{kicker}</p>}
            <h2 id="confirm-title" className="font-jersey text-[34px] leading-none font-extrabold tracking-tight uppercase">
              {title}
            </h2>
          </div>
          <div className="net" aria-hidden />
          <div className="px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <p className="text-[15px] leading-snug">{body}</p>
            {error && (
              <div className="mt-3">
                <ErrorNote error={error} />
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className={btn.secondary} disabled={pending} onClick={onCancel}>
                Not yet
              </button>
              <button
                type="button"
                autoFocus
                className={tone === "whistle" ? "min-h-12 rounded-lg bg-whistle px-4 text-[15px] font-semibold text-sheet disabled:opacity-50" : btn.primary}
                disabled={pending}
                onClick={onConfirm}
              >
                {pending ? "Working…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
