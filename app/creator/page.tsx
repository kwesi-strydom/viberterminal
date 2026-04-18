import Link from "next/link";
import { listPortals } from "@/lib/db/portals";
import { CreatorHeader } from "@/components/creator/CreatorHeader";

/**
 * Creator dashboard — lists all published portals and links to /creator/new.
 *
 * v1: anyone can see everything (no auth). Creator identity is just a
 * self-declared handle on submit. We'll plug in real auth once we add tokens.
 */
export default async function CreatorDashboardPage() {
  const portals = await listPortals();

  return (
    <main className="min-h-screen bg-ink-50">
      <CreatorHeader />

      <section className="mx-auto max-w-6xl px-8 pb-20 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-900/60">Creators</p>
            <h1 className="mt-1 font-display text-4xl font-semibold">Your sky, your portals</h1>
            <p className="mt-2 max-w-xl text-ink-900/70">
              Publish a URL — it becomes a portal in the terminal. v1 embeds the site in an iframe.
              Token economics and the Claude-Code build path come next.
            </p>
          </div>
          <Link
            href="/creator/new"
            className="rounded-full bg-ink-900 px-5 py-3 text-ink-50 hover:bg-ink-900/90"
          >
            + New portal
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portals.length === 0 && (
            <p className="text-ink-900/60">No portals yet. Be the first.</p>
          )}
          {portals.map((p) => (
            <article
              key={p.id}
              className="relative overflow-hidden rounded-2xl border border-ink-900/10 bg-white p-5"
            >
              <div
                className="absolute right-0 top-0 h-20 w-20 rounded-full opacity-40 blur-2xl"
                style={{ backgroundColor: p.color }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  <p className="mt-0.5 text-xs text-ink-900/60">{new URL(p.url).host}</p>
                </div>
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
              </div>
              {p.description && (
                <p className="mt-3 text-sm text-ink-900/70">{p.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between text-xs text-ink-900/60">
                <span>
                  {p.creatorHandle ? `@${p.creatorHandle}` : "anonymous"} · {p.playCount} plays
                </span>
                <span>
                  [{p.x.toFixed(0)}, {p.y.toFixed(0)}, {p.z.toFixed(0)}]
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
