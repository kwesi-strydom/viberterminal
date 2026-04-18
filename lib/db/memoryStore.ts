import type { Portal, NewPortal } from "./schema";

/**
 * In-memory portal store for zero-setup local dev.
 *
 * Seeded with the launch lineup of real apps the user provided. Each one has
 * a real URL and an external thumbnail hosted on postimg.cc.
 *
 * Once DATABASE_URL is set, the real DB takes over (see lib/db/portals.ts).
 */

function rid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += "-";
    else if (i === 14) out += "4";
    else if (i === 19) out += hex[(Math.random() * 4) | 0 | 8];
    else out += hex[(Math.random() * 16) | 0];
  }
  return out;
}

const now = () => new Date();

/**
 * Seed lineup. Spread on a wide ring around the spawn point with strong
 * altitude variation so they're visibly floating and easy to pick out.
 *
 * Coordinates are picked to space them visually — the spawn island sits at
 * z=280, so portals at lower or negative z appear "ahead" of the player.
 */
const seed: Portal[] = [
  {
    id: rid(),
    slug: "sperm-racer",
    name: "Sperm Racer",
    description:
      "A fast-paced arcade racer. The original Viber launchpad app, ported from Flight-Master's portal map.",
    url: "https://spermracer-git-new-jake-randalls-projects.vercel.app/",
    thumbnailUrl: "/textures/sperm-racer.jpg",
    color: "#ff4ea0",
    x: 200,
    y: 70,
    z: 50,
    radius: 15,
    creatorHandle: "jakerandall",
    tags: ["arcade", "racer"],
    playCount: 0,
    ratingSum: 0,
    ratingCount: 0,
    isPublished: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: rid(),
    slug: "pushup-guru",
    name: "Pushup Guru",
    description: "Track your push-ups, build a streak, become the pushup guru.",
    url: "https://www.pushup.guru/",
    thumbnailUrl: "https://i.postimg.cc/FsMc3KsG/homeworkouts-push-ups.gif",
    color: "#7fc97f",
    x: -210,
    y: 90,
    z: 30,
    radius: 14,
    creatorHandle: "pushupguru",
    tags: ["fitness", "habit"],
    playCount: 0,
    ratingSum: 0,
    ratingCount: 0,
    isPublished: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: rid(),
    slug: "far-go",
    name: "Far-Go",
    description: "An e-scooter rental experience for Forest City Network School.",
    url: "https://escootersfargo.fillout.com/t/emZLKUp12fus",
    thumbnailUrl: "https://i.postimg.cc/G2tJz50t/scooter.png",
    color: "#fdb515",
    x: 70,
    y: 110,
    z: -180,
    radius: 14,
    creatorHandle: "fargo",
    tags: ["transport", "scooter"],
    playCount: 0,
    ratingSum: 0,
    ratingCount: 0,
    isPublished: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: rid(),
    slug: "bryan-johnson-clicker",
    name: "Bryan Johnson Clicker",
    description: "Click to extend your lifespan. Don't die.",
    url: "https://byron-blood-pressure-systems15.replit.app/",
    thumbnailUrl: "https://i.postimg.cc/XqDPQCDN/bryan-johnson.png",
    color: "#b89cf2",
    x: -120,
    y: 140,
    z: -180,
    radius: 14,
    creatorHandle: "longevitylab",
    tags: ["clicker", "health"],
    playCount: 0,
    ratingSum: 0,
    ratingCount: 0,
    isPublished: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: rid(),
    slug: "sausage-slapper",
    name: "Sausage Slapper",
    description: "Slap the sausage. Reflex arcade game.",
    url: "https://phuaky.github.io/sausageslapper/",
    thumbnailUrl: "https://i.postimg.cc/Kzb48Kf3/slapper.png",
    color: "#ff6a3d",
    x: 250,
    y: 60,
    z: -120,
    radius: 14,
    creatorHandle: "phuaky",
    tags: ["arcade"],
    playCount: 0,
    ratingSum: 0,
    ratingCount: 0,
    isPublished: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: rid(),
    slug: "network-state-builder",
    name: "Network State Builder",
    description: "Design and visualize your own network state in the browser.",
    url: "https://createnetworkstate.replit.app/",
    thumbnailUrl: "https://i.postimg.cc/ydC33p1d/builder.png",
    color: "#68f0ff",
    x: 0,
    y: 170,
    z: -260,
    radius: 16,
    creatorHandle: "networkstate",
    tags: ["builder", "ns"],
    playCount: 0,
    ratingSum: 0,
    ratingCount: 0,
    isPublished: true,
    createdAt: now(),
    updatedAt: now(),
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __viberMemStore: Portal[] | undefined;
}

const store: Portal[] = (globalThis.__viberMemStore ??= [...seed]);

export const memoryStore = {
  list(): Portal[] {
    return store.filter((p) => p.isPublished);
  },
  get(idOrSlug: string): Portal | undefined {
    return store.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  },
  create(input: Omit<NewPortal, "id" | "createdAt" | "updatedAt">): Portal {
    const portal: Portal = {
      id: rid(),
      slug: input.slug!,
      name: input.name!,
      description: input.description ?? null,
      url: input.url!,
      thumbnailUrl: input.thumbnailUrl ?? null,
      color: input.color ?? "#8be0d4",
      x: input.x ?? 0,
      y: input.y ?? 40,
      z: input.z ?? -60,
      radius: input.radius ?? 10,
      creatorHandle: input.creatorHandle ?? null,
      tags: (input.tags as string[] | null) ?? null,
      playCount: 0,
      ratingSum: 0,
      ratingCount: 0,
      isPublished: input.isPublished ?? true,
      createdAt: now(),
      updatedAt: now(),
    };
    store.push(portal);
    return portal;
  },
  incrementPlay(idOrSlug: string): void {
    const p = store.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    if (p) p.playCount += 1;
  },
};
