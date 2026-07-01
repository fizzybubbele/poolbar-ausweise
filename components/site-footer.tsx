import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-800 px-6 py-6">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-sm text-neutral-500">
        <p>© {new Date().getFullYear()} Poolbar Ausweis-Generator</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/impressum" className="hover:text-neutral-300">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-neutral-300">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
