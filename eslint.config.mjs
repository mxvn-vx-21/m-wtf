import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next/**", ".open-next/**", "node_modules/**", "next-env.d.ts", "cloudflare-env.d.ts", "drizzle/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Avatars/banners/blocks are served from our own /api/media route (or user URLs); there is no image optimizer on
      // Vercel Hobby / Workers for those, so plain <img> with explicit sizes + lazy loading is intentional.
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
