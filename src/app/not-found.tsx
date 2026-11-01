import { Emblem3D } from "@/components/three/Emblem3D";
import { LinkButton } from "@/components/ui";

export const metadata = { title: "Page not found — MARVEL.WTF", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-10">
      <div className="ambient" aria-hidden><div className="grid-floor" /></div>
      <main id="main" className="relative flex flex-col items-center text-center">
        <div className="relative h-56 w-56 sm:h-72 sm:w-72"><Emblem3D model="shield" accent="#ffd400" look="obsidian" label="3D shield" /></div>
        <p className="hud -mt-2 text-spark">Error 404</p>
        <h1 className="mt-2 text-[clamp(3rem,12vw,6rem)]">Page <span className="text-hero [text-shadow:4px_4px_0_#ffd400]">not found</span></h1>
        <p className="mx-auto mt-3 max-w-sm text-lg text-zinc-400">This page doesn&apos;t exist.</p>
        <LinkButton href="/" pow className="mt-8">Back home</LinkButton>
      </main>
    </div>
  );
}
