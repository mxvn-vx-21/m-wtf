/**
 * DEV ONLY seed. Creates demo@marvel.wtf / username "demo" through Better Auth (so the password is
 * hashed properly), then fills the profile and a couple of blocks.
 * Refuses to run in production.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { PRESETS } from "../src/profile/theme";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    throw new Error("Refusing to seed in production.");
  }
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client, { schema });
  const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    plugins: [username()],
    user: { additionalFields: { role: { type: "string", input: false }, plan: { type: "string", input: false } } },
  });

  const existing = await db.select().from(schema.user).where(eq(schema.user.username, "demo")).limit(1);
  let userId = existing[0]?.id;
  if (!userId) {
    const res = await auth.api.signUpEmail({
      body: { email: "demo@marvel.wtf", password: "demo-password-123", name: "Demo Hero", username: "demo", displayUsername: "demo" } as never,
    });
    userId = res.user.id;
  }

  await db.insert(schema.profile).values({ userId, displayName: "Demo Hero" }).onConflictDoNothing({ target: schema.profile.userId });
  const [prof] = await db.select().from(schema.profile).where(eq(schema.profile.userId, userId));
  const theme = JSON.parse(JSON.stringify(PRESETS.find((p) => p.id === "cosmic")!.theme));
  const blocks = [
    { id: crypto.randomUUID(), type: "header", settings: { showAvatar: true, showUsername: true, showBio: true, showStatus: true, showBanner: true, align: "center" } },
    { id: crypto.randomUUID(), type: "text", settings: { title: "Origin story", body: "Bitten by a radioactive commit. Now I ship features at the speed of light.", align: "left" } },
    { id: crypto.randomUUID(), type: "socials", settings: { title: "", style: "icons", items: [{ id: "seed-gh-1", platform: "github", url: "https://github.com" }, { id: "seed-dc-1", platform: "discord", url: "https://discord.com" }] } },
    { id: crypto.randomUUID(), type: "link", settings: { title: "MARVEL.WTF", url: "https://marvel.wtf", icon: "bolt", description: "Build your identity" } },
  ];
  const identity = { displayName: "Demo Hero", bio: "Welcome to MARVEL.WTF.", status: "Testing the multiverse" };
  const snapshot = { v: 1, identity: { ...identity, avatarKey: null, bannerKey: null }, theme, blocks: blocks.map(({ id, type, settings }) => ({ id, type, settings })) };

  await db.delete(schema.profileBlock).where(eq(schema.profileBlock.profileId, prof.id));
  await db.insert(schema.profileBlock).values(blocks.map((b, i) => ({ id: b.id, profileId: prof.id, type: b.type, position: i, data: b.settings, visible: true })));
  await db.update(schema.profile).set({ ...identity, theme, revision: 1, published: snapshot, visibility: "PUBLISHED", publishedAt: new Date(), onboardedAt: new Date() }).where(eq(schema.profile.id, prof.id));

  console.log("✓ Seeded demo user → /demo   (demo@marvel.wtf / demo-password-123)");
  await client.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
