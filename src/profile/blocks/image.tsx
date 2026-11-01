import { z } from "zod";
import { httpUrl, imageSrc, line } from "../text";
import { ImageBlockView } from "./image-view";
import type { BlockDef } from "./types";

const schema = z.object({
  src: imageSrc,
  alt: line(140),
  radius: z.enum(["none", "sm", "md", "lg", "full"]),
  aspect: z.enum(["auto", "square", "wide"]),
  link: z.union([z.literal(""), httpUrl]),
  caption: line(120),
});
export type ImageSettings = z.infer<typeof schema>;

export const imageBlock: BlockDef<ImageSettings> = {
  type: "image",
  label: "Image",
  description: "Upload a picture or use an image URL.",
  icon: "image",
  schema,
  defaults: () => ({ src: "https://placehold.co/800x450/png", alt: "", radius: "md", aspect: "auto", link: "", caption: "" }),
  Render: ({ settings }) => <ImageBlockView settings={settings} />,
};
