"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "msv:my-team";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function read(): number | null {
  const v = localStorage.getItem(KEY);
  return v ? Number(v) : null;
}

export function useMyTeam(): [number | null, (id: number | null) => void] {
  const teamId = useSyncExternalStore(subscribe, read, () => null);
  const set = useCallback((id: number | null) => {
    if (id == null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(id));
    listeners.forEach((l) => l());
  }, []);
  return [teamId, set];
}
