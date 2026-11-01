import type { ComponentType } from "react";
import type { ZodType } from "zod";
import type { Plan } from "../theme";

export interface IdentityView {
  displayName: string;
  username: string;
  bio: string;
  status: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
}

export interface BlockCtx {
  identity: IdentityView;
  /** true inside the editor preview (e.g. music never autoplays while you are editing) */
  editing: boolean;
}

/**
 * A block = one self-describing unit of profile content.
 *
 * TO ADD A BLOCK (youtube, github, gallery, countdown, …):
 *   1. create blocks/<name>.tsx exporting a BlockDef (schema + defaults + Render)
 *   2. add it to registry.ts
 *   3. add a settings form for it in components/editor/block-editors.tsx
 * The DB (profile_block.type + jsonb), API, snapshot/publish flow and renderer need NO changes.
 * Set `requiresPlan: "PREMIUM"` to gate a block later (server already enforces it).
 */
export interface BlockDef<S = any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  type: string;
  label: string;
  description: string;
  icon: string;
  maxPerProfile?: number;
  requiresPlan?: Plan;
  schema: ZodType<S>;
  defaults: () => S;
  Render: ComponentType<{ settings: S; ctx: BlockCtx }>;
}
