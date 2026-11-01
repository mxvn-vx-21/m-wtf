import { z } from "zod";
import type { BlockDef } from "./types";

const schema = z.object({ height: z.number().int().min(8, "Min 8px.").max(240, "Max 240px.") });
export type SpacerSettings = z.infer<typeof schema>;

export const spacerBlock: BlockDef<SpacerSettings> = {
  type: "spacer",
  label: "Spacer",
  description: "Empty vertical space.",
  icon: "spacer",
  schema,
  defaults: () => ({ height: 32 }),
  Render: ({ settings: s }) => <div aria-hidden style={{ height: s.height }} />,
};
