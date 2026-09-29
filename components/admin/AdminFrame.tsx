"use client";

import { usePathname } from "next/navigation";

export function useBracketDesk() {
  const path = usePathname();
  return path.startsWith("/admin/bracket");
}

export function AdminFrame({ children }: { children: React.ReactNode }) {
  const wide = useBracketDesk();
  return (
    <main className={wide ? "mx-auto w-full max-w-xl px-4 pt-4 pb-16 lg:max-w-[90rem] lg:px-6" : "mx-auto max-w-xl px-4 pt-4 pb-16"}>
      {children}
    </main>
  );
}
