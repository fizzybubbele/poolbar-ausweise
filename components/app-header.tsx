"use client";

import { signOut, useSession } from "next-auth/react";
import { useAuthEnabled } from "@/components/auth-provider";

function HeaderShell({
  userName,
  onLogout,
}: {
  userName?: string;
  onLogout?: () => void;
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-widest text-lime-400/80">
          Poolbar 2026
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Ausweis-Generator
        </h1>
        <p className="mt-2 max-w-2xl text-neutral-400">
          MA- und BL-Vorlagen 1:1 befüllen — CSV/XLSX + Foto-ZIP.
        </p>
      </div>
      {userName && onLogout && (
        <div className="flex shrink-0 items-center gap-3 pt-1">
          <span className="text-sm text-neutral-500">{userName}</span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-500"
          >
            Abmelden
          </button>
        </div>
      )}
    </header>
  );
}

function AppHeaderWithSession() {
  const { data: session } = useSession();

  if (!session?.user?.name) return <HeaderShell />;

  return (
    <HeaderShell
      userName={session.user.name}
      onLogout={() => signOut({ callbackUrl: "/login" })}
    />
  );
}

export function AppHeader() {
  const authEnabled = useAuthEnabled();

  if (!authEnabled) {
    return <HeaderShell />;
  }

  return <AppHeaderWithSession />;
}
