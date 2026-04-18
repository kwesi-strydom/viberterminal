import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { NewPortalForm } from "@/components/creator/NewPortalForm";

export default function NewPortalPage() {
  return (
    <main className="min-h-screen bg-ink-50">
      <CreatorHeader />
      <section className="mx-auto max-w-2xl px-8 pb-20 pt-10">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-900/60">Publish</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Drop a new portal in the sky</h1>
        <p className="mt-2 text-ink-900/70">
          Paste the URL of your app. We&apos;ll spawn a portal at a random location — you can
          fly to it right after publishing.
        </p>
        <NewPortalForm />
      </section>
    </main>
  );
}
