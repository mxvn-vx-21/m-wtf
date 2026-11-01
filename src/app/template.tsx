import type { ReactNode } from "react";

// Re-mounts on every navigation → a soft fade-in between pages. Opacity only (a transform here would
// become the containing block of position:fixed children such as the builder).
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
