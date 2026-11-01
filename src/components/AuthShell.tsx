import type { ReactNode } from "react";
import { Emblem3D } from "./three/Emblem3D";
import { Logo } from "./ui";

export function AuthShell({ title, subtitle, children, footer, emblem = "logo" }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; emblem?: "logo" | "shield" | "bolt" | "star" | "orb" }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="ambient" aria-hidden><div className="grid-floor" /></div>
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-center lg:gap-10 lg:px-6">
        {/* brand side — desktop only (3D never loads on phones) */}
        <aside className="relative hidden h-[34rem] lg:block" aria-hidden>
          <Emblem3D model={emblem} accent="#e11d2e" label="Interactive 3D emblem. Drag to spin, click for a shockwave." />
          <p className="hud pointer-events-none absolute inset-x-0 bottom-4 text-center text-zinc-500">Drag to spin · Click to ignite</p>
        </aside>
        <main id="main" className="relative mx-auto flex w-full max-w-md flex-col justify-center px-4 py-10 sm:py-14">
          <Logo className="mb-6 self-center" />
          <div className="glass hud-corners p-6 sm:p-8" style={{ animation: "rise .6s var(--ease-out-expo) both" }}>
            <h1 className="text-3xl sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-mute">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <p className="mt-5 text-center text-mute">{footer}</p>}
        </main>
      </div>
    </div>
  );
}
