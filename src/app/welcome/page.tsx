import { redirect } from "next/navigation";
import { WelcomeForm } from "@/components/WelcomeForm";
import { Logo } from "@/components/ui";
import { getOwnProfile, requireOnboardedUser } from "@/lib/session";

export const metadata = { title: "Welcome — MARVEL.WTF", robots: { index: false } };

export default async function WelcomePage() {
  const user = await requireOnboardedUser("/welcome");
  const profile = await getOwnProfile(user);
  if (profile.onboardedAt) redirect("/dashboard");
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="ambient" aria-hidden><div className="grid-floor" /></div>
      <main id="main" className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-4 py-10">
        <Logo className="mb-6 self-center" />
        <div className="glass hud-corners p-6 sm:p-8" style={{ animation: "rise .6s var(--ease-out-expo) both" }}>
          <p className="hud text-spark">Step 3 of 3 · @{user.username}</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Choose your identity</h1>
          <p className="mb-6 mt-2 text-mute">Pick a starting look. You can change every detail in the builder.</p>
          <WelcomeForm initialName={profile.displayName} />
        </div>
      </main>
    </div>
  );
}
