"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <p className="text-[22px] font-bold tracking-tight">Metro-South</p>
      <p className="mb-8 text-[14px] font-medium text-ink/75">8th Grade Girls Volleyball · Scorer’s table</p>
      <form action={action} className="rounded-xl bg-sheet p-5">
        <label htmlFor="password" className="mb-2 block text-[14px] font-semibold">
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-12 w-full rounded-md border border-mesh bg-white px-3 text-[16px]"
        />
        {error && (
          <p role="alert" className="mt-3 text-[14px] font-semibold text-whistle">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className="mt-4 min-h-12 w-full rounded-lg bg-tape text-[15px] font-semibold text-sheet disabled:opacity-50">
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
