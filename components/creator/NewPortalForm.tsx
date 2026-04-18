"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COLORS = [
  "#8be0d4",
  "#f5a88a",
  "#ffb74a",
  "#b89cf2",
  "#7fae72",
  "#e9c98d",
  "#f29ab8",
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export function NewPortalForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [handle, setHandle] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/portals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          url,
          description: description || undefined,
          color,
          creatorHandle: handle || undefined,
          tags: tags
            ? tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8)
            : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
      router.push("/creator");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-3xl border border-ink-900/10 bg-white p-8 shadow-sm">
      <Field label="Name" hint="Shows above the portal in the sky">
        <input
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          maxLength={60}
          className="field"
          placeholder="Orbital Tetris"
        />
      </Field>

      <Field label="Slug" hint="Used in URLs. Lowercase, dashes only.">
        <input
          required
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value.replace(/[^a-z0-9-]/g, ""));
          }}
          pattern="[a-z0-9-]+"
          minLength={2}
          maxLength={40}
          className="field font-mono"
          placeholder="orbital-tetris"
        />
      </Field>

      <Field label="URL" hint="Where we'll embed your app from">
        <input
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="field"
          placeholder="https://example.com"
        />
      </Field>

      <Field label="Description" hint="Optional — 1–2 sentences">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={400}
          rows={3}
          className="field resize-none"
          placeholder="A tetris variant where the board drifts in zero-gravity…"
        />
      </Field>

      <Field label="Creator handle" hint="Optional — shown on the portal">
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          maxLength={40}
          className="field"
          placeholder="yourname"
        />
      </Field>

      <Field label="Tags" hint="Comma-separated, up to 8">
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="field"
          placeholder="puzzle, arcade"
        />
      </Field>

      <Field label="Portal color">
        <div className="mt-1 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Pick ${c}`}
              className={`h-9 w-9 rounded-full border-2 transition ${color === c ? "scale-110 border-ink-900" : "border-white"}`}
              style={{ backgroundColor: c, boxShadow: `0 0 0 1px rgba(15,17,21,0.1)` }}
            />
          ))}
        </div>
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || !name || !url}
          className="rounded-full bg-ink-900 px-6 py-3 text-sm font-medium text-ink-50 transition hover:bg-ink-900/90 disabled:opacity-50"
        >
          {submitting ? "Publishing…" : "Publish portal"}
        </button>
      </div>

      <style jsx>{`
        .field {
          margin-top: 4px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid rgba(15, 17, 21, 0.12);
          background: #fbf8f2;
          font-size: 14px;
          color: #0f1115;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field:focus {
          border-color: #6ea2c5;
          box-shadow: 0 0 0 3px rgba(110, 162, 197, 0.2);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-900">{label}</span>
      {hint && <span className="ml-2 text-xs text-ink-900/50">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}
