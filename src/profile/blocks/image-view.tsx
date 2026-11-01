"use client";
import { useState } from "react";
import type { ImageSettings } from "./image";

const RADIUS = { none: "0", sm: "8px", md: "16px", lg: "28px", full: "9999px" } as const;
const ASPECT = { auto: undefined, square: "1 / 1", wide: "16 / 9" } as const;

export function ImageBlockView({ settings: s }: { settings: ImageSettings }) {
  const [failed, setFailed] = useState(false);
  const img = failed ? (
    <div className="pv-img-fail" role="img" aria-label={s.alt || "Image"}>This image could not be loaded.</div>
  ) : (
    <img
      src={s.src}
      alt={s.alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={{ borderRadius: RADIUS[s.radius], aspectRatio: ASPECT[s.aspect], objectFit: "cover" }}
    />
  );
  return (
    <figure className="pv-image pv-skel" style={{ borderRadius: RADIUS[s.radius] }}>
      {s.link && !failed ? <a href={s.link} target="_blank" rel="noopener noreferrer nofollow ugc">{img}</a> : img}
      {s.caption && <figcaption>{s.caption}</figcaption>}
    </figure>
  );
}

