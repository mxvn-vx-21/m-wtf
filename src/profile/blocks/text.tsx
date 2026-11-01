import { z } from "zod";
import { line, para } from "../text";
import type { BlockDef } from "./types";

const schema = z
  .object({
    title: line(80),
    body: para(2000),
    align: z.enum(["left", "center", "right"]).default("left"), // default keeps V0-era text blocks valid
  })
  .refine((v) => v.title.length > 0 || v.body.length > 0, { message: "Add a title or some text.", path: ["body"] });
export type TextSettings = z.infer<typeof schema>;

export const textBlock: BlockDef<TextSettings> = {
  type: "text",
  label: "Text",
  description: "A title and a short paragraph.",
  icon: "text",
  schema,
  defaults: () => ({ title: "About me", body: "Tell the multiverse your origin story.", align: "left" }),
  // Plain text only. React escapes it; no HTML is ever injected.
  Render: ({ settings: s }) => (
    <section className="pv-card" style={{ textAlign: s.align }}>
      {s.title && <h2 className="pv-card-title">{s.title}</h2>}
      {s.body && <p className="pv-prose">{s.body}</p>}
    </section>
  ),
};
