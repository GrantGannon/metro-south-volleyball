"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";
import { useTournament } from "../TournamentProvider";

const LINKS = [
  { href: "/admin", label: "Games" },
  { href: "/admin/bracket", label: "Bracket" },
  { href: "/admin/announcements", label: "Announce" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const path = usePathname();
  const { connected } = useTournament();

  return (
    <header className="sticky top-0 z-20 bg-tape text-sheet pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 pt-3">
        <p className="text-[15px] font-bold">
          Metro-South <span className="font-medium text-sheet/70">· Scorer’s table</span>
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-sheet/70">{connected ? "Synced" : "Reconnecting"}</span>
          <form action={logout}>
            <button type="submit" className="min-h-11 text-[13px] font-semibold underline underline-offset-4">
              Log out
            </button>
          </form>
        </div>
      </div>
      <nav className="mx-auto grid max-w-xl grid-cols-4 px-2" aria-label="Admin">
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? path === "/admin" || path.startsWith("/admin/match") : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-h-12 items-center justify-center border-b-4 text-[14px] font-semibold",
                active ? "border-sheet" : "border-transparent text-sheet/70",
              ].join(" ")}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
