import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

export const metadata: Metadata = {
  title: "Viber Terminal — fly the open app metaverse",
  description: "A 3D launchpad for web apps and games. Fly between portals; anyone can build a world.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain min-h-screen">{children}</body>
    </html>
  );
}
