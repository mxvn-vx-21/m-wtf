import { z } from "zod";
import { line, secureMediaUrl } from "../text";
import { MusicPlayer } from "./music-view";
import type { BlockDef } from "./types";

const schema = z.object({
  url: secureMediaUrl,
  title: line(80).pipe(z.string().min(1, "Track title is required.")),
  artist: line(80),
  autoplay: z.boolean(),
  loop: z.boolean(),
});
export type MusicSettings = z.infer<typeof schema>;

export const musicBlock: BlockDef<MusicSettings> = {
  type: "music",
  label: "Music",
  description: "A simple audio player for a track URL.",
  icon: "music",
  schema,
  defaults: () => ({ url: "https://example.com/track.mp3", title: "My track", artist: "", autoplay: false, loop: false }),
  Render: ({ settings, ctx }) => <MusicPlayer settings={settings} ctx={ctx} />,
};
