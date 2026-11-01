import { Emblem3D } from "@/components/three/Emblem3D";
import { LinkButton } from "@/components/ui";

export const metadata = { title: "Profile not found — MARVEL.WTF", robots: { index: false } };

export default function ProfileNotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-10">
      <div className="ambient" aria-hidden><div className="grid-floor" /></div>
      <main id="main" className="relative flex flex-col items-center text-center">
        <div className="relative h-56 w-56 sm:h-72 sm:w-72"><Emblem3D model="orb" accent="#e11d2e" look="obsidian" label="3D crystal" /></div>
        <p className="hud -mt-2 text-spark">404</p>
        <h1 className="mt-2 text-[clamp(3rem,12vw,6rem)]">Profile <span className="text-hero [text-shadow:4px_4px_0_#ffd400]">not found</span></h1>
        <p className="mx-auto mt-3 max-w-sm text-lg text-zinc-400">This profile doesn&apos;t exist.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="/" variant="ghost">Home</LinkButton>
          <LinkButton href="/signup" pow>Claim a username</LinkButton>
        </div>
      </main>
    </div>
  );
}
