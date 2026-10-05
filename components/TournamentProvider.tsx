"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Snapshot, TeamDTO } from "@/lib/types";

const FALLBACK_INFO: Snapshot["info"] = {
  name: "Metro-South 8th Grade Girls Volleyball",
  shortName: "Metro-South",
  format: "double",
};

function complete(snap: Snapshot): Snapshot {
  return { ...snap, info: snap.info ?? FALLBACK_INFO };
}

const STORAGE_KEY = "msv:snapshot";

interface TournamentState {
  snapshot: Snapshot;
  teams: Map<number, TeamDTO>;
  connected: boolean;
  receivedAt: number;
  accept: (snap: Snapshot) => void;
}

const TournamentContext = createContext<TournamentState | null>(null);

export function TournamentProvider({ initial, children }: { initial: Snapshot; children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState(() => complete(initial));
  const [connected, setConnected] = useState(true);
  const [receivedAt, setReceivedAt] = useState(() => Date.now());
  const versionRef = useRef(initial.version);

  const accept = useCallback((snap: Snapshot) => {
    const next = complete(snap);
    if (next.version < versionRef.current) return;
    versionRef.current = next.version;
    setSnapshot(next);
    setReceivedAt(Date.now());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/snapshot", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      accept(await res.json());
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, [accept]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const snap = JSON.parse(saved) as Snapshot;
        if (snap.version > versionRef.current) accept(snap);
      }
    } catch {}

    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const open = () => {
      es?.close();
      es = new EventSource("/api/stream");
      es.addEventListener("snapshot", (e) => {
        setConnected(true);
        accept(JSON.parse((e as MessageEvent).data));
      });
      es.onerror = () => {
        setConnected(false);
        if (es?.readyState === EventSource.CLOSED) {
          clearTimeout(retry);
          retry = setTimeout(open, 3000);
        }
      };
    };
    open();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      refetch();
      if (!es || es.readyState === EventSource.CLOSED) open();
    };
    const onOnline = () => {
      refetch();
      open();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      clearTimeout(retry);
      es?.close();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [accept, refetch]);

  const value = useMemo<TournamentState>(
    () => ({ snapshot, teams: new Map(snapshot.teams.map((t) => [t.id, t])), connected, receivedAt, accept }),
    [snapshot, connected, receivedAt, accept],
  );

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament(): TournamentState {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament must be used inside TournamentProvider");
  return ctx;
}
