"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/profile/icons";
import { Button } from "./ui";

/** Clipboard with a fallback for older browsers / non-secure contexts. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

export function CopyLinkButton({ url, className, variant = "ghost" }: { url: string; className?: string; variant?: "ghost" | "primary" }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 1800);
    return () => clearTimeout(t);
  }, [state]);
  return (
    <Button type="button" variant={variant} className={className} onClick={async () => setState((await copyText(url)) ? "copied" : "failed")}>
      <Icon name={state === "copied" ? "check" : "copy"} size={16} />
      <span aria-live="polite">{state === "copied" ? "Copied!" : state === "failed" ? "Copy failed" : "Copy link"}</span>
    </Button>
  );
}

/** QR rendered as plain SVG shapes from the QR matrix (no innerHTML, no network). */
function useQr(url: string, open: boolean) {
  const [qr, setQr] = useState<{ size: number; d: string } | null>(null);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    void import("qrcode").then((Q) => {
      if (!alive) return;
      const m = Q.create(url, { errorCorrectionLevel: "M" }).modules;
      let d = "";
      for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (m.get(x, y)) d += `M${x} ${y}h1v1h-1z`;
      setQr({ size: m.size, d });
    });
    return () => { alive = false; };
  }, [url, open]);
  return qr;
}

export function QrButton({ url, className }: { url: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const qr = useQr(url, open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const download = () => {
    if (!qr) return;
    const pad = 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${qr.size + pad * 2} ${qr.size + pad * 2}" width="512" height="512"><rect x="${-pad}" y="${-pad}" width="${qr.size + pad * 2}" height="${qr.size + pad * 2}" fill="#fff"/><path d="${qr.d}" fill="#000"/></svg>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    a.download = "marvel-wtf-qr.svg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <>
      <Button type="button" variant="ghost" className={className} onClick={() => setOpen(true)}>
        <Icon name="qr" size={16} /> QR code
      </Button>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Profile QR code" onClick={() => setOpen(false)}>
          <div className="comic-card w-full max-w-xs p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-52 rounded-lg bg-white p-2">
              {qr ? (
                <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} role="img" aria-label={`QR code for ${url}`} shapeRendering="crispEdges"><path d={qr.d} fill="#000" /></svg>
              ) : <div className="skeleton aspect-square" />}
            </div>
            <p className="mt-3 break-all text-xs text-mute">{url}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button type="button" variant="ghost" onClick={download} disabled={!qr}>Download SVG</Button>
              <Button type="button" onClick={() => setOpen(false)} autoFocus>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
