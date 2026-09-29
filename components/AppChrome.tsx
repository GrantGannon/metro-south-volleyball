"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatTime } from "@/lib/format";
import { useTournament } from "./TournamentProvider";

const TABS = [
  { href: "/", label: "Now" },
  { href: "/bracket", label: "Bracket" },
  { href: "/results", label: "Results" },
  { href: "/my-team", label: "My team" },
];

export function Header() {
  const { connected, receivedAt } = useTournament();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="mx-auto flex max-w-xl items-end justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
      <h1 className="leading-tight">
        <span className="block text-[22px] font-bold tracking-tight">Metro-South</span>
        <span className="block text-[14px] font-medium text-ink/75">8th Grade Girls Volleyball</span>
      </h1>
      {mounted && (
        <p className="pb-0.5 text-right font-mono text-[11px] text-ink/70" aria-live="polite">
          {connected ? "Live updates on" : `Offline · last update ${formatTime(new Date(receivedAt).toISOString())}`}
        </p>
      )}
    </header>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-tape/15 bg-sheet/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      aria-label="Sections"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex h-14 flex-col items-center justify-center text-[13px] font-semibold",
                  active ? "text-tape" : "text-ink/55",
                ].join(" ")}
              >
                <span className={["mb-1 h-[3px] w-8 rounded-full", active ? "bg-tape" : "bg-transparent"].join(" ")} aria-hidden />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-7 mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-ink/70">{children}</h2>;
}
