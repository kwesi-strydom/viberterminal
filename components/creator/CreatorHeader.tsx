import Link from "next/link";

export function CreatorHeader() {
  return (
    <header className="border-b border-ink-900/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
        <Link href="/" className="font-display text-xl font-semibold">
          viber<span className="text-sky-deep">·</span>terminal
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/creator" className="text-ink-900/70 hover:text-ink-900">Dashboard</Link>
          <Link href="/creator/new" className="text-ink-900/70 hover:text-ink-900">New portal</Link>
          <Link href="/world" className="rounded-full bg-ink-900 px-4 py-2 text-ink-50 hover:bg-ink-900/90">
            Fly →
          </Link>
        </nav>
      </div>
    </header>
  );
}
