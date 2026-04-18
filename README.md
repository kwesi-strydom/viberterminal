# Viber Terminal

A single-player 3D launchpad for web apps and games.
Fly a plane over the Forest City skies, dive through portals, land in apps.
Anyone can publish a portal — just drop in a URL.

Derived from:
- **Flight-Master** — the 3D flight loop and portal mechanic
- **VIBER** — the launchpad concept (URL upload → portal → app)

## v1 scope

Shipping in this drop:
- Painterly 3D world: floating islands, Bitcoin balloon, gradient sky
- Landing page with Player / Creator dual path
- Dynamic portals loaded from `/api/portals`
- Creator dashboard + "new portal" form (URL upload)
- Fly-through → iframe overlay (with "open in new tab" fallback for sites that block framing)

Deferred to v1.1+:
- Off-chain points / token economy (schema keeps hooks for this)
- Claude Code SDK + Daytona generation path (the VIBER pipeline)
- Auth + creator earnings ledger
- Multiplayer

## Stack

Next.js 14 (App Router) · React Three Fiber + three.js · Drizzle ORM · Neon Postgres · Tailwind · Zustand.

## Local dev

```bash
cd viber-terminal
cp .env.example .env
npm install
npm run dev
# open http://localhost:3000
```

With no `DATABASE_URL` the app uses an in-memory portal store seeded with
three demo portals. Portals added via `/creator/new` persist only until the
process restarts.

## With a real database (Neon or local Postgres)

1. Put the connection string in `.env`:

   ```
   DATABASE_URL=postgres://user:password@host/db
   ```

2. Push the schema:

   ```bash
   npm run db:push
   ```

3. Start dev as usual. The repo layer in `lib/db/portals.ts` will switch
   from the in-memory store to Drizzle automatically.

## On Replit

### Import from GitHub

1. replit.com → **Create Repl** → **Import from GitHub**.
2. Paste `https://github.com/<your-user>/viberterminal`.
3. Replit auto-detects the `.replit` config and the `modules = ["nodejs-20"]` line.
4. Hit **Run**. On first boot the included run command does `npm install`
   (if needed) then starts `npm run dev -- -p 3000 -H 0.0.0.0`. Subsequent
   boots skip install because `node_modules` persists on the Repl.
5. Open the webview — you should land on the hero page in 20–40s after the
   Next.js first compile finishes.

### After import, one-off setup

The `public/hero.mp4` video (114 MB) is **gitignored** — GitHub has a 100 MB
per-file limit. On a fresh import the landing page falls back to the gradient.
Two ways to restore the hero video on Replit:

- **Upload directly**: drag `hero.mp4` into `public/` via Replit's Files pane.
  Works but bloats the Repl.
- **Host on a CDN** (Vercel Blob, Cloudinary, R2, etc.) and set the env var
  in Replit **Secrets**:

  ```
  NEXT_PUBLIC_HERO_VIDEO_URL=https://your-cdn.com/hero.mp4
  ```

### Production deploy on Replit

The `.replit` `[deployment]` block targets **Cloud Run**. Click **Deploy**
in the Replit UI — Replit runs `npm install && npm run build`, then
`npm run start` on the assigned `PORT`. You get a stable `*.replit.app` URL.

### Persistent portal storage (optional)

Without `DATABASE_URL`, new portals added via `/creator/new` live only in
memory and are lost on restart. To persist:

1. Spin up a free [Neon](https://neon.tech) Postgres project (or use
   Replit's Postgres add-on).
2. Paste the connection string into Replit **Secrets** as `DATABASE_URL`.
3. Open the Shell and run `npm run db:push` once to create the `portals`
   table.
4. Restart the Repl. `lib/db/portals.ts` auto-switches from the in-memory
   store to Drizzle + Neon.

## Layout

```
viber-terminal/
├─ app/
│  ├─ page.tsx              ← landing (Player/Creator)
│  ├─ world/page.tsx        ← 3D terminal (client-only)
│  ├─ creator/              ← dashboard + new-portal form
│  └─ api/portals/          ← GET/POST + per-portal routes
├─ components/
│  ├─ landing/              ← LandingHero
│  ├─ creator/              ← CreatorHeader, NewPortalForm
│  └─ world/                ← Scene, Sky, Terrain, Balloon, Airplane,
│                             Portal, PortalField, HUD, AppOverlay, Clouds
└─ lib/
   ├─ db/                   ← Drizzle schema + in-memory fallback + repo
   └─ stores/               ← zustand: useFlight, useWorld
```

## What's different vs. Flight-Master

- Portals are DB-driven, not a hardcoded `PORTAL_MAP`
- Smoother, weighted flight controls (lerped angular velocities, bank-into-yaw, turbo FOV kick)
- Painterly gradient sky shader instead of a solid sky-blue background
- Procedural low-poly islands with vertex-colored strata (moss → sand → stone)
- Chase/cockpit camera toggle follows the plane with a spring
- iframe overlay for portal entry, with embed-blocked fallback
- Next.js App Router monorepo (no separate Vite client + Express server)

## Next steps (v1.1)

1. Off-chain token economy — `tokens` ledger table + `wallets` per user. Portal
   `entryCost` / `rewardMode`, creator earnings routed through the ledger.
2. Claude Code SDK generation path — reuse VIBER's Daytona flow. Creator
   types a prompt → we spin up a sandbox → we host the preview URL → we spawn
   the portal automatically.
3. Auth (email or passkey), so `creatorHandle` becomes real identity.
4. Analytics — "top portals this week", creator dashboard view of earnings.
