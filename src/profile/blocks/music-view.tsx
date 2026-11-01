"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import type { MusicSettings } from "./music";
import type { BlockCtx } from "./types";

const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

export function MusicPlayer({ settings: s, ctx }: { settings: MusicSettings; ctx: BlockCtx }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [err, setErr] = useState(false);

  // Autoplay respects browser policy: we try once; if the browser blocks it we wait for the visitor's
  // first tap/click/key anywhere on the page (a real user gesture) and then start. We never try to bypass anything.
  useEffect(() => {
    if (!s.autoplay || ctx.editing) return;
    const a = audio.current;
    if (!a) return;
    let cancelled = false;
    const gesture = () => { if (!cancelled) void a.play().catch(() => {}); cleanup(); };
    const cleanup = () => { window.removeEventListener("pointerdown", gesture); window.removeEventListener("keydown", gesture); };
    a.play().catch(() => {
      window.addEventListener("pointerdown", gesture, { once: true });
      window.addEventListener("keydown", gesture, { once: true });
    });
    return () => { cancelled = true; cleanup(); };
  }, [s.autoplay, s.url, ctx.editing]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setErr(true)); else a.pause();
  };

  return (
    <section className="pv-card pv-music" aria-label={`Music player: ${s.title}`}>
      <audio
        ref={audio}
        src={s.url}
        loop={s.loop}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onError={() => setErr(true)}
      />
      <button type="button" className="pv-play" onClick={toggle} aria-label={playing ? `Pause ${s.title}` : `Play ${s.title}`}>
        <Icon name={playing ? "pause" : "play"} size={20} />
      </button>
      <div className="pv-music-meta">
        <p className="pv-music-title">{s.title}</p>
        {s.artist && <p className="pv-music-artist">{s.artist}</p>}
        {err ? (
          <p className="pv-music-err" role="alert">This audio could not be played.</p>
        ) : (
          <div className="pv-music-bar">
            <input
              type="range"
              min={0}
              max={dur || 1}
              step={0.1}
              value={Math.min(t, dur || 1)}
              onChange={(e) => { if (audio.current) audio.current.currentTime = Number(e.target.value); }}
              aria-label="Seek"
              disabled={!dur}
            />
            <span className="pv-music-time">{fmt(t)} / {fmt(dur)}</span>
          </div>
        )}
      </div>
    </section>
  );
}

