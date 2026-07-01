"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Benutzername oder Passwort falsch.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8">
        <p className="text-sm uppercase tracking-widest text-lime-400/80">
          Poolbar 2026
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Anmelden</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Zugang nur für berechtigte Nutzer.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-neutral-300"
            >
              Benutzername
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-neutral-300"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-lime-500 py-2.5 text-sm font-medium text-black disabled:opacity-50"
          >
            {loading ? "Anmelden…" : "Anmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}
