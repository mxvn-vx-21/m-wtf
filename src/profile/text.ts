import { z } from "zod";

// Control chars + bidi overrides (used for spoofing). React escapes HTML on output; this keeps stored text clean.
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;

export const clean = (s: string) => s.replace(CTRL, "").normalize("NFC");
export const oneLine = (s: string) => clean(s).replace(/\s+/g, " ").trim();
export const multiLine = (s: string) => clean(s).replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();

/** Single-line plain text, trimmed, max length. */
export const line = (max: number, msg = `Max ${max} characters.`) => z.string().transform(oneLine).pipe(z.string().max(max, msg));
/** Multi-line plain text. */
export const para = (max: number, msg = `Max ${max} characters.`) => z.string().transform(multiLine).pipe(z.string().max(max, msg));

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[?::1\]?$)/i;

/** http(s) links only — blocks javascript:, data:, file:, etc. */
export const httpUrl = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .min(1, "Enter a valid URL.")
      .max(500, "URL is too long.")
      .refine((u) => /^https?:\/\/[^\s"'<>`\\]+$/i.test(u), "Enter a valid URL (starting with https://).")
      .refine((u) => { try { new URL(u); return true; } catch { return false; } }, "Enter a valid URL (starting with https://)."),
  );

/** https only + no private/loopback hosts. Used for anything the browser auto-loads (images, audio). */
export const secureMediaUrl = httpUrl
  .refine((u) => u.toLowerCase().startsWith("https://"), "Use a secure https:// URL.")
  .refine((u) => { try { return !PRIVATE_HOST.test(new URL(u).hostname); } catch { return false; } }, "That address isn't allowed.");

/** Our own uploaded assets: /api/media/<images|avatars|banners>/<userId>/<uuid>.<ext> */
export const MEDIA_PATH_RE = /^\/api\/media\/(avatars|banners|images)\/([A-Za-z0-9_-]{8,64})\/[a-f0-9-]{36}\.(png|jpg|webp)$/;

/** Either one of our uploads or a secure external image URL. Safe to put inside CSS url("…") and <img src>. */
export const imageSrc = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z.string().max(500, "URL is too long.").refine(
      (s) => MEDIA_PATH_RE.test(s) || (!/[()]/.test(s) && secureMediaUrl.safeParse(s).success),
      "Use an uploaded image or a secure https:// image URL.",
    ),
  );

/** Returns the owning userId of one of our media paths, or null for external URLs. */
export function mediaOwner(src: string): string | null {
  const m = MEDIA_PATH_RE.exec(src);
  return m ? m[2] : null;
}
