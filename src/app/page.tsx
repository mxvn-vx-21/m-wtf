import Link from "next/link";
import { Reveal } from "@/components/fx/Reveal";
import { ThemeSwatch } from "@/components/editor/ThemeSwatch";
import { Emblem3D } from "@/components/three/Emblem3D";
import { Alert, Logo, LinkButton } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import { Icon } from "@/profile/icons";
import { PRESETS } from "@/profile/theme";

const FEATURES = [
  { icon: "sliders", title: "Live builder", text: "Build, see, tweak. Every change shows instantly in a real preview of your page — on a phone frame or full desktop." },
  { icon: "layers", title: "Blocks that stack", text: "Header, text, links, socials, images and music. Drag them around, hide them, duplicate them, undo a delete." },
  { icon: "palette", title: "Hero themes", text: "Hero, Vigilante, Tech, Cosmic, Villain. Start with an identity, then bend every colour, font and glow to taste." },
  { icon: "bolt", title: "Draft & publish", text: "Experiment freely. Visitors only see your page when you hit Publish — and you can pull it back any time." },
  { icon: "share", title: "One link, one QR", text: "marvel.wtf/you is yours. Copy it, scan it, drop it in every bio you own." },
  { icon: "rocket", title: "Fast on any screen", text: "Server-rendered, lightweight, and built mobile-first — your profile loads quick and looks right in everyone's pocket." },
];

const TICKER = ["Live preview", "Drag & drop", "Hero themes", "3D emblems", "Draft & publish", "QR codes", "Mobile first", "Music player", "Social links", "Your own URL"];

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  return (
    <div className="relative">
      <div className="ambient" aria-hidden><div className="grid-floor" /></div>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-ink/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Logo size="sm" />
          <nav className="flex items-center gap-1.5 sm:gap-3" aria-label="Main">
            <a href="#features" className="hud hidden rounded-lg px-2.5 py-2 text-zinc-300 hover:text-white md:block">Features</a>
            <a href="#themes" className="hud hidden rounded-lg px-2.5 py-2 text-zinc-300 hover:text-white md:block">Themes</a>
            {user ? (
              <LinkButton href="/dashboard" className="!min-h-10">Dashboard</LinkButton>
            ) : (
              <>
                <Link href="/login" className="hud rounded-lg px-2.5 py-2 text-zinc-200 hover:text-spark">Log in</Link>
                <LinkButton href="/signup" pow className="!min-h-10">Sign up</LinkButton>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main">
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative mx-auto grid max-w-6xl items-center gap-2 px-4 pb-10 pt-8 sm:pt-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-6 lg:pb-20 lg:pt-16">
          <div className="relative z-10">
            {sp.deleted && <div className="mb-6 max-w-md"><Alert kind="success">Your account has been deleted.</Alert></div>}
            <p className="hud mb-5 inline-flex items-center gap-2.5 rounded-full border border-spark/40 bg-spark/5 px-3.5 py-1.5 text-spark" style={{ animation: "rise .7s var(--ease-out-expo) both" }}>
              <span className="size-2 rounded-full bg-hero" style={{ animation: "pulse-glow 2s infinite" }} aria-hidden />
              Profile builder · now live
            </p>
            <h1 className="text-[clamp(3.1rem,11.5vw,6.6rem)] leading-[.92]" style={{ animation: "rise .8s .08s var(--ease-out-expo) both" }}>
              Build your<br />
              <span className="text-hero [text-shadow:2px_2px_0_#ffd400] sm:[text-shadow:5px_5px_0_#ffd400]">identity.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-300 sm:text-xl" style={{ animation: "rise .8s .18s var(--ease-out-expo) both" }}>
              Claim your name. Assemble a superhero-grade page from blocks, themes and 3D flair. One link to share everywhere —{" "}
              <span className="whitespace-nowrap text-white">marvel.wtf/<span className="text-spark">you</span></span>.
            </p>

            <form action="/signup" method="get" className="mt-8 flex w-full max-w-lg flex-col gap-3 sm:flex-row" style={{ animation: "rise .8s .28s var(--ease-out-expo) both" }}>
              <label htmlFor="claim" className="sr-only">Choose your username</label>
              <div className="field flex flex-1 items-center !p-0 focus-within:!border-spark focus-within:shadow-[0_0_0_3px_rgba(255,212,0,.16),0_0_24px_-6px_rgba(255,212,0,.4)]">
                <span className="select-none pl-3.5 text-zinc-500">marvel.wtf/</span>
                <input id="claim" name="username" placeholder="yourname" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={20}
                  className="min-w-0 flex-1 bg-transparent px-1 py-3 text-white outline-none placeholder:text-zinc-600 focus-visible:outline-none" />
              </div>
              <button data-fx="pow" className="btn btn-primary">Claim it</button>
            </form>

            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-3" style={{ animation: "rise .8s .38s var(--ease-out-expo) both" }}>
              {[["6", "Hero themes"], ["7", "Block types"], ["1", "Link to share"]].map(([n, l]) => (
                <div key={l} className="border-l-2 border-hero pl-3">
                  <dt className="font-display text-4xl leading-none text-white">{n}</dt>
                  <dd className="hud mt-0.5 text-[.62rem] text-mute">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 3D emblem */}
          <div className="relative mx-auto h-[330px] w-full max-w-[520px] sm:h-[440px] lg:h-[560px]" style={{ animation: "fade-in 1.2s .2s both" }}>
            <div className="pointer-events-none absolute inset-[8%] rounded-full border border-dashed border-white/10" style={{ animation: "spin-slow 60s linear infinite" }} aria-hidden />
            <div className="pointer-events-none absolute inset-[18%] rounded-full border border-hero/20" style={{ animation: "spin-slow 40s linear infinite reverse" }} aria-hidden />
            <Emblem3D model="logo" accent="#e11d2e" label="Interactive 3D MARVEL.WTF emblem. Drag to spin, click for a shockwave." />
            <div className="hud glass pointer-events-none absolute left-[2%] top-[14%] rounded-xl px-3 py-2 text-[.62rem] text-white sm:left-0" style={{ animation: "float-y 5s ease-in-out infinite" }}>@you</div>
            <div className="hud glass pointer-events-none absolute bottom-[18%] right-[2%] flex items-center gap-2 rounded-xl px-3 py-2 text-[.62rem] text-white sm:right-0" style={{ animation: "float-y 6s .8s ease-in-out infinite" }}><span className="size-2 rounded-full bg-emerald-400" aria-hidden />Published</div>
            <div className="hud glass pointer-events-none absolute bottom-[34%] left-[4%] hidden rounded-xl px-3 py-2 text-[.62rem] text-spark sm:block" style={{ animation: "float-y 7s .3s ease-in-out infinite" }}>Theme · Hero</div>
            <p className="hud pointer-events-none absolute inset-x-0 -bottom-1 text-center text-[.6rem] text-zinc-500">Drag to spin · Click to ignite</p>
          </div>
        </section>

        {/* ── Ticker ─────────────────────────────────────────── */}
        <div className="overflow-hidden border-y border-white/8 bg-black/40 py-3.5" aria-hidden>
          <div className="ticker hud text-zinc-400">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center">
                {TICKER.map((t) => (<span key={`${k}-${t}`} className="flex items-center whitespace-nowrap">{t}<span className="mx-6 inline-block size-1.5 rotate-45 bg-hero" /></span>))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Features ───────────────────────────────────────── */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:py-28">
          <Reveal>
            <p className="hud text-spark">What you get</p>
            <h2 className="mt-3 max-w-2xl text-[clamp(2.2rem,6vw,3.8rem)]">A page that feels like <span className="text-hero">you</span>.</h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 90} tilt>
                <article className="glass hud-corners h-full p-6">
                  <div className="mb-5 grid size-12 place-items-center rounded-xl border border-spark/30 bg-spark/8 text-spark"><Icon name={f.icon} size={22} /></div>
                  <h3 className="text-2xl">{f.title}</h3>
                  <p className="mt-2 text-zinc-400">{f.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Themes ─────────────────────────────────────────── */}
        <section id="themes" className="relative scroll-mt-20 border-y border-white/8 bg-black/30 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <p className="hud text-spark">Pick your identity</p>
              <h2 className="mt-3 max-w-2xl text-[clamp(2.2rem,6vw,3.8rem)]">Six hero looks. <span className="text-hero">Infinite</span> remixes.</h2>
              <p className="mt-4 max-w-xl text-lg text-zinc-400">Each theme is a starting point — colours, fonts, glow, particles, 3D emblems and click reactions are all yours to change.</p>
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
              {PRESETS.map((p, i) => (
                <Reveal key={p.id} delay={i * 70} tilt="strong">
                  <div className="glass p-2.5">
                    <ThemeSwatch theme={p.theme} />
                    <p className="font-display mt-3 text-xl leading-none">{p.name}</p>
                    <p className="mt-1 text-sm text-mute">{p.tagline}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Steps ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <Reveal><h2 className="text-[clamp(2.2rem,6vw,3.8rem)]">Live in <span className="text-hero">three</span> moves.</h2></Reveal>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {[["01", "Claim", "Pick your @username. It becomes your public URL."], ["02", "Build", "Add blocks, choose a theme, watch the preview react as you go."], ["03", "Publish", "Hit publish. Share marvel.wtf/you with the world."]].map(([n, t, d], i) => (
              <Reveal as="li" key={n} delay={i * 110}>
                <div className="glass relative h-full overflow-hidden p-6">
                  <span className="font-hud pointer-events-none absolute -right-2 -top-4 text-[7rem] leading-none text-white/[.04]" aria-hidden>{n}</span>
                  <p className="hud text-hero">Step {n}</p>
                  <h3 className="mt-2 text-3xl">{t}</h3>
                  <p className="mt-2 text-zinc-400">{d}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-24">
          <Reveal>
            <div className="glass hud-corners relative overflow-hidden px-6 py-14 text-center sm:py-20">
              <div className="halftone pointer-events-none absolute inset-0 opacity-60" aria-hidden />
              <h2 className="relative mx-auto max-w-3xl text-[clamp(2.2rem,7vw,4.4rem)]">Your origin story starts <span className="text-hero [text-shadow:3px_3px_0_#ffd400]">here.</span></h2>
              <p className="relative mx-auto mt-4 max-w-md text-lg text-zinc-300">Free to start. Takes about two minutes.</p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <LinkButton href={user ? "/dashboard/editor" : "/signup"} pow className="!min-h-14 !px-8 !text-[.8rem]">{user ? "Open the builder" : "Claim your name"}</LinkButton>
                {!user && <LinkButton href="/login" variant="ghost" className="!min-h-14">I have an account</LinkButton>}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/8 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:text-left">
          <Logo size="sm" />
          <p className="hud text-[.62rem] text-zinc-500">Build your identity · © MARVEL.WTF</p>
        </div>
      </footer>
    </div>
  );
}
