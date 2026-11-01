import { headerBlock } from "./header";
import { textBlock } from "./text";
import { linkBlock } from "./link";
import { socialsBlock } from "./socials";
import { imageBlock } from "./image";
import { musicBlock } from "./music";
import { spacerBlock } from "./spacer";
import type { BlockDef } from "./types";

/** Future: youtube, spotify, github, discord, twitch, projects, services, gallery, video, embed, contact, guestbook, game, countdown… */
export const BLOCKS: BlockDef[] = [headerBlock, textBlock, linkBlock, socialsBlock, imageBlock, musicBlock, spacerBlock];

export const blockRegistry: ReadonlyMap<string, BlockDef> = new Map(BLOCKS.map((b) => [b.type, b]));
export const getBlockDef = (type: string) => blockRegistry.get(type);

/** Validate untrusted settings for a block type → typed data or per-field messages. */
export function validateSettings(type: string, settings: unknown):
  | { ok: true; data: unknown }
  | { ok: false; errors: Record<string, string> } {
  const def = blockRegistry.get(type);
  if (!def) return { ok: false, errors: { _: "Unknown block type." } };
  const r = def.schema.safeParse(settings);
  if (r.success) return { ok: true, data: r.data };
  const errors: Record<string, string> = {};
  for (const i of r.error.issues) errors[i.path.join(".") || "_"] ??= i.message;
  return { ok: false, errors };
}
