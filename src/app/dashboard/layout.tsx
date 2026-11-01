import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getOwnProfile, requireOnboardedUser } from "@/lib/session";

// The gate runs BEFORE the loading skeleton streams → anonymous visitors get a real 307 to /login and
// brand-new users a real 307 to /welcome (the short onboarding). Pages re-check independently.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireOnboardedUser("/dashboard");
  const profile = await getOwnProfile(user);
  if (!profile.onboardedAt) redirect("/welcome");
  return children;
}
