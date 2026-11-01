import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { Logo } from "./ui";

export function AppHeader({ username }: { username: string | null }) {
  const nav = "hud rounded-lg px-2 py-2 text-[.6rem] sm:px-2.5 sm:text-[.68rem] text-zinc-300 transition hover:bg-white/5 hover:text-white";
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Logo size="sm" markOnlyOnPhone />
        <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-1">
          <Link href="/dashboard" className={nav}>Dashboard</Link>
          <Link href="/settings" className={nav}>Settings</Link>
          {username && <Link href={`/${username}`} className={`${nav} hidden !text-spark sm:block`}>My page</Link>}
          <LogoutButton className="ml-0.5 !min-h-9 !px-2.5 !text-[.6rem] sm:ml-1 sm:!px-3 sm:!text-[.72rem]" />
        </nav>
      </div>
    </header>
  );
}
