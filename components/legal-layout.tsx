import Link from "next/link";
import type { ReactNode } from "react";

export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/"
        className="text-sm text-neutral-500 hover:text-neutral-300"
      >
        ← Zurück zum Generator
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{title}</h1>
      <article className="prose-legal mt-8 space-y-6 text-neutral-300">
        {children}
      </article>
    </main>
  );
}
