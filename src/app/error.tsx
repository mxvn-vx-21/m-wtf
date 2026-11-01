"use client";

// Generic boundary: never renders error.message or stack (they may contain DB details).
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="relative grid min-h-dvh place-items-center px-5 text-center">
      <div className="ambient" aria-hidden />
      <main id="main" className="relative">
        <p className="hud text-hero">System error</p>
        <h1 className="mt-2 text-[clamp(2.6rem,10vw,5rem)]">Something broke</h1>
        <p className="mt-3 text-lg text-zinc-400">An unexpected error occurred. Please try again.</p>
        <button onClick={reset} data-fx="pow" className="btn btn-primary mt-8">Try again</button>
      </main>
    </div>
  );
}
