import { Suspense } from "react";
import dynamic from "next/dynamic";

// The whole scene is client-only — R3F/Three.js doesn't make sense on the server.
const World = dynamic(() => import("@/components/world/World"), { ssr: false });

export default function WorldPage() {
  // useSearchParams() inside World requires a Suspense boundary in Next 14
  // App Router, even with ssr:false — wrap it here.
  return (
    <Suspense fallback={null}>
      <World />
    </Suspense>
  );
}
