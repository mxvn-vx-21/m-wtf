/**
 * Social platform registry. To add a platform: add an entry here and (for a brand logo) its 24x24 path in
 * brand-paths.ts. No other code needs to change — the block, editor and renderer are all data-driven.
 */
export interface SocialPlatform { id: string; label: string; placeholder: string }

export const SOCIALS: SocialPlatform[] = [
  { id: "discord", label: "Discord", placeholder: "https://discord.gg/yourinvite" },
  { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/you" },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@you" },
  { id: "github", label: "GitHub", placeholder: "https://github.com/you" },
  { id: "x", label: "X", placeholder: "https://x.com/you" },
  { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@you" },
  { id: "twitch", label: "Twitch", placeholder: "https://twitch.tv/you" },
  { id: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/user/you" },
  { id: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/you" },
  { id: "reddit", label: "Reddit", placeholder: "https://reddit.com/u/you" },
  { id: "telegram", label: "Telegram", placeholder: "https://t.me/you" },
  { id: "steam", label: "Steam", placeholder: "https://steamcommunity.com/id/you" },
  { id: "snapchat", label: "Snapchat", placeholder: "https://snapchat.com/add/you" },
  { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/you" },
  { id: "patreon", label: "Patreon", placeholder: "https://patreon.com/you" },
  { id: "kofi", label: "Ko-fi", placeholder: "https://ko-fi.com/you" },
  { id: "website", label: "Website", placeholder: "https://yoursite.com" },
];

export const SOCIAL_IDS = SOCIALS.map((s) => s.id);
export const socialById = (id: string) => SOCIALS.find((s) => s.id === id);
export const socialIconName = (id: string) => (id === "website" ? "globe" : id);
